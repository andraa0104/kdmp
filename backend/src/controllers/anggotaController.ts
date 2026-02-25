import { Request, Response } from 'express';
import { PoolClient } from 'pg';
import pool from '../config/database';
import bcrypt from 'bcrypt';
import type { AnggotaRegisterInput, AnggotaLoginInput } from '../types';

/**
 * Helper function: Insert history record
 */
const insertHistory = async (
  client: PoolClient,
  anggotaId: number,
  statusSebelum: string | null,
  statusSesudah: string,
  aksi: string,
  catatan: string | null,
  verifiedBy: number | null
) => {
  await client.query(
    `INSERT INTO verifikasi_history (anggota_id, status_sebelum, status_sesudah, aksi, catatan, verified_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [anggotaId, statusSebelum, statusSesudah, aksi, catatan, verifiedBy]
  );
};

/**
 * Register anggota baru
 * POST /api/anggota/register
 */
export const registerAnggota = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const formData: AnggotaRegisterInput = req.body;
    
    // Validasi input
    if (!formData.nik || !formData.nama_lengkap || !formData.username || !formData.password) {
      return res.status(400).json({
        success: false,
        message: 'Data tidak lengkap'
      });
    }

    // Cek apakah NIK sudah terdaftar
    const nikCheck = await client.query(
      'SELECT id FROM anggota WHERE nik = $1',
      [formData.nik]
    );
    
    if (nikCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'NIK sudah terdaftar'
      });
    }

    // Cek apakah username sudah digunakan
    const usernameCheck = await client.query(
      'SELECT id FROM anggota WHERE username = $1',
      [formData.username]
    );
    
    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username sudah digunakan'
      });
    }

    await client.query('BEGIN');

    // Resolve dusun_id dan rt_id untuk warga desa
    let dusunId: number | null = null;
    let rtId: number | null = null;

    if (formData.jenis_warga === 'warga_desa') {
      // Get dusun_id
      if (formData.dusun) {
        const dusunResult = await client.query(
          'SELECT id FROM dusun WHERE nama = $1',
          [formData.dusun]
        );
        
        if (dusunResult.rows.length === 0) {
          throw new Error('Dusun tidak ditemukan');
        }
        
        dusunId = dusunResult.rows[0].id;

        // Get rt_id
        const rtResult = await client.query(
          'SELECT id FROM rt WHERE dusun_id = $1 AND nomor = $2',
          [dusunId, formData.rt]
        );
        
        if (rtResult.rows.length === 0) {
          throw new Error('RT tidak ditemukan');
        }
        
        rtId = rtResult.rows[0].id;
      }
    }

    // Generate no registrasi
    const noRegResult = await client.query('SELECT generate_no_registrasi() as no_reg');
    const noRegistrasi = noRegResult.rows[0].no_reg;

    // Hash password
    const hashedPassword = await bcrypt.hash(formData.password, 10);

    // Convert foto_diri and foto_ktp (File) to base64 if needed
    // Note: Jika menggunakan multipart/form-data, perlu setup multer
    const fotoDiri = formData.foto_diri || null;
    const fotoKtp = formData.foto_ktp || null;

    // Insert anggota baru
    const insertQuery = `
      INSERT INTO anggota (
        no_registrasi, nik, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir,
        jenis_warga, alamat, rt, desa, kecamatan, kabupaten, provinsi,
        dusun_id, rt_id,
        nomor_rekening, nama_bank, nama_bank_lainnya, atas_nama,
        nomor_wa, username, password, foto_diri, foto_ktp,
        status, tanggal_daftar
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13,
        $14, $15,
        $16, $17, $18, $19,
        $20, $21, $22, $23, $24,
        'Pending', CURRENT_TIMESTAMP
      ) RETURNING id, no_registrasi, nama_lengkap, username, status, tanggal_daftar
    `;

    const values = [
      noRegistrasi,
      formData.nik,
      formData.nama_lengkap,
      formData.jenis_kelamin,
      formData.tempat_lahir,
      formData.tanggal_lahir,
      formData.jenis_warga,
      formData.alamat,
      formData.rt,
      formData.desa,
      formData.kecamatan,
      formData.kabupaten,
      formData.provinsi,
      dusunId,
      rtId,
      formData.nomor_rekening,
      formData.nama_bank,
      formData.nama_bank_lainnya || null,
      formData.atas_nama,
      formData.nomor_wa,
      formData.username,
      hashedPassword,
      fotoDiri,
      fotoKtp
    ];

    const result = await client.query(insertQuery, values);
    const newAnggota = result.rows[0];

    // Insert history: Pendaftaran Baru
    await insertHistory(
      client,
      newAnggota.id,
      null, // status_sebelum: NULL untuk pendaftaran baru
      'Pending',
      'Pendaftaran Baru',
      'Pendaftaran akun baru',
      null // verified_by: NULL karena ini pendaftaran
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Pendaftaran berhasil! Silakan login untuk cek status verifikasi.',
      data: {
        id: newAnggota.id,
        no_registrasi: newAnggota.no_registrasi,
        nama_lengkap: newAnggota.nama_lengkap,
        username: newAnggota.username,
        status: newAnggota.status,
        tanggal_daftar: newAnggota.tanggal_daftar
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error register anggota:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat pendaftaran';
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  } finally {
    client.release();
  }
};

/**
 * Login anggota
 * POST /api/anggota/login
 */
export const loginAnggota = async (req: Request, res: Response) => {
  try {
    const { username, password }: AnggotaLoginInput = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password harus diisi'
      });
    }

    // Get anggota by username
    const result = await pool.query(
      `SELECT id, username, password, nama_lengkap, status, nomor_anggota_koperasi, no_registrasi
       FROM anggota 
       WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }

    const anggota = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, anggota.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }

    // Login success
    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        id: anggota.id,
        username: anggota.username,
        nama_lengkap: anggota.nama_lengkap,
        status: anggota.status,
        nomor_anggota_koperasi: anggota.nomor_anggota_koperasi,
        no_registrasi: anggota.no_registrasi
      }
    });

  } catch (error) {
    console.error('Error login anggota:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat login'
    });
  }
};

/**
 * Get profile anggota (setelah login)
 * GET /api/anggota/profile/:id
 */
export const getAnggotaProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        a.*,
        d.nama as dusun_nama,
        d.kode_dusun,
        r.nomor as rt_nomor,
        r.kode_rt,
        u.username as verified_by_username
       FROM anggota a
       LEFT JOIN dusun d ON a.dusun_id = d.id
       LEFT JOIN rt r ON a.rt_id = r.id
       LEFT JOIN users u ON a.verified_by = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Anggota tidak ditemukan'
      });
    }

    const anggota = result.rows[0];
    
    // Remove password from response
    delete anggota.password;

    res.json({
      success: true,
      data: anggota
    });

  } catch (error) {
    console.error('Error get profile:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan'
    });
  }
};

/**
 * Get all anggota (untuk admin)
 * GET /api/anggota
 */
export const getAllAnggota = async (req: Request, res: Response) => {
  try {
    const { status, search, jenis_warga, dusun, rt, nomor_anggota } = req.query;

    let query = `
      SELECT 
        a.id, a.no_registrasi, a.nomor_anggota_koperasi, a.nik, a.nama_lengkap,
        a.jenis_kelamin, a.jenis_warga, a.status, a.tanggal_daftar, a.tanggal_verifikasi,
        a.dusun_id, a.rt_id,
        d.nama as dusun_nama,
        r.nomor as rt_nomor,
        u.username as verified_by_username
      FROM anggota a
      LEFT JOIN dusun d ON a.dusun_id = d.id
      LEFT JOIN rt r ON a.rt_id = r.id
      LEFT JOIN users u ON a.verified_by = u.id
      WHERE 1=1
    `;

    const params: (string | number | string[])[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status as string);
      paramIndex++;
    }

    if (search) {
      query += ` AND (a.nama_lengkap ILIKE $${paramIndex} OR a.nomor_anggota_koperasi ILIKE $${paramIndex})`;
      params.push(`%${search as string}%`);
      paramIndex++;
    }

    if (jenis_warga) {
      const jenisWargaArray = (jenis_warga as string).split(',');
      query += ` AND a.jenis_warga = ANY($${paramIndex}::text[])`;
      params.push(jenisWargaArray);
      paramIndex++;
    }

    if (dusun) {
      query += ` AND a.dusun_id = $${paramIndex}`;
      params.push(parseInt(dusun as string));
      paramIndex++;
    }

    if (rt) {
      query += ` AND a.rt_id = $${paramIndex}`;
      params.push(parseInt(rt as string));
      paramIndex++;
    }

    if (nomor_anggota) {
      query += ` AND a.nomor_anggota_koperasi ILIKE $${paramIndex}`;
      params.push(`%${nomor_anggota as string}%`);
      paramIndex++;
    }

    query += ` ORDER BY a.tanggal_daftar DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error get all anggota:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan'
    });
  }
};

/**
 * Update status anggota (untuk admin)
 * PUT /api/anggota/:id/status
 */
export const updateStatusAnggota = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { status, alasan_ditolak, verified_by } = req.body;

    await client.query('BEGIN');

    // Get current status
    const currentResult = await client.query(
      'SELECT status, jenis_warga, dusun_id, rt_id FROM anggota WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      throw new Error('Anggota tidak ditemukan');
    }

    const currentStatus = currentResult.rows[0].status;
    const anggotaData = currentResult.rows[0];

    // Update status
    let updateQuery = `
      UPDATE anggota 
      SET status = $1, tanggal_verifikasi = CURRENT_TIMESTAMP, verified_by = $2
    `;
    
    const params: (string | number | null)[] = [status, verified_by];
    let paramIndex = 3;

    if (status === 'Ditolak' && alasan_ditolak) {
      updateQuery += `, alasan_ditolak = $${paramIndex}`;
      params.push(alasan_ditolak);
      paramIndex++;
    }

    // Generate nomor anggota jika status = Aktif
    if (status === 'Aktif' && !anggotaData.nomor_anggota_koperasi) {
      const nomorAnggotaResult = await client.query(
        'SELECT generate_nomor_anggota($1, $2, $3) as nomor',
        [anggotaData.jenis_warga, anggotaData.dusun_id, anggotaData.rt_id]
      );
      
      const nomorAnggota = nomorAnggotaResult.rows[0].nomor;
      updateQuery += `, nomor_anggota_koperasi = $${paramIndex}`;
      params.push(nomorAnggota);
      paramIndex++;

      // Set iuran pokok sudah dibayar
      updateQuery += `, iuran_pokok_dibayar = TRUE`;
      updateQuery += `, tanggal_bayar_iuran_pokok = CURRENT_TIMESTAMP`;
    }

    updateQuery += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(id);

    const updateResult = await client.query(updateQuery, params);

    // Insert history dengan aksi yang sesuai
    let aksi = '';
    if (status === 'Ditolak') {
      aksi = 'Ditolak';
    } else if (status === 'Diterima') {
      aksi = 'Diterima';
    } else if (status === 'Aktif') {
      aksi = 'Diaktifkan';
    } else if (status === 'Non Aktif') {
      aksi = 'Non Aktif';
    } else {
      aksi = `Status diubah ke ${status}`;
    }

    await insertHistory(
      client,
      Number(id),
      currentStatus,
      status,
      aksi,
      alasan_ditolak || null,
      verified_by
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Status berhasil diupdate',
      data: updateResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error update status:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan';
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  } finally {
    client.release();
  }
};

/**
 * Update profile & resubmit application (untuk anggota yang ditolak)
 * PUT /api/anggota/:id/resubmit
 */
export const resubmitAnggota = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const {
      nik,
      nama_lengkap,
      jenis_kelamin,
      tempat_lahir,
      tanggal_lahir,
      jenis_warga,
      alamat,
      dusun,
      rt,
      desa,
      kecamatan,
      kabupaten,
      provinsi,
      nomor_rekening,
      nama_bank,
      atas_nama,
      nomor_wa,
      foto_diri,
      foto_ktp
    } = req.body;

    await client.query('BEGIN');

    // Check if anggota exists and is rejected
    const checkResult = await client.query(
      'SELECT status FROM anggota WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      throw new Error('Anggota tidak ditemukan');
    }

    if (checkResult.rows[0].status !== 'Ditolak') {
      throw new Error('Hanya anggota dengan status Ditolak yang dapat mengajukan ulang');
    }

    // Get dusun_id and rt_id if provided
    let dusun_id = null;
    let rt_id = null;

    if (dusun && rt) {
      const rtResult = await client.query(
        `SELECT rt.id as rt_id, rt.dusun_id 
         FROM rt 
         JOIN dusun ON rt.dusun_id = dusun.id 
         WHERE dusun.nama = $1 AND rt.nomor = $2`,
        [dusun, rt]
      );

      if (rtResult.rows.length > 0) {
        dusun_id = rtResult.rows[0].dusun_id;
        rt_id = rtResult.rows[0].rt_id;
      }
    }

    // Update anggota data and reset status to Pending
    const updateQuery = `
      UPDATE anggota 
      SET 
        nik = $1,
        nama_lengkap = $2,
        jenis_kelamin = $3,
        tempat_lahir = $4,
        tanggal_lahir = $5,
        jenis_warga = $6,
        alamat = $7,
        dusun_id = $8,
        rt_id = $9,
        rt = $10,
        desa = $11,
        kecamatan = $12,
        kabupaten = $13,
        provinsi = $14,
        nomor_rekening = $15,
        nama_bank = $16,
        atas_nama = $17,
        nomor_wa = $18,
        foto_diri = COALESCE($19, foto_diri),
        foto_ktp = COALESCE($20, foto_ktp),
        status = 'Pending',
        alasan_ditolak = NULL,
        tanggal_verifikasi = NULL,
        verified_by = NULL
      WHERE id = $21
      RETURNING *
    `;

    const updateResult = await client.query(updateQuery, [
      nik,
      nama_lengkap,
      jenis_kelamin,
      tempat_lahir,
      tanggal_lahir,
      jenis_warga,
      alamat,
      dusun_id,
      rt_id,
      rt,
      desa,
      kecamatan,
      kabupaten,
      provinsi,
      nomor_rekening,
      nama_bank,
      atas_nama,
      nomor_wa,
      foto_diri || null, // Use provided foto or keep existing
      foto_ktp || null, // Use provided foto KTP or keep existing
      id
    ]);

    // Insert history: Pengajuan Ulang
    await insertHistory(
      client,
      Number(id),
      'Ditolak', // status sebelumnya pasti Ditolak
      'Pending',
      'Pengajuan Ulang',
      'Anggota mengajukan ulang pendaftaran setelah ditolak',
      null // verified_by: NULL karena ini aksi dari anggota sendiri
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Data berhasil diperbaiki dan diajukan ulang untuk verifikasi',
      data: updateResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error resubmit anggota:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan';
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  } finally {
    client.release();
  }
};

/**
 * Get history verifikasi anggota
 * GET /api/anggota/:id/history
 */
export const getAnggotaHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        vh.*,
        u.username as verified_by_username
       FROM verifikasi_history vh
       LEFT JOIN users u ON vh.verified_by = u.id
       WHERE vh.anggota_id = $1
       ORDER BY vh.created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error get anggota history:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan'
    });
  }
};

/**
 * Konfirmasi bayar iuran pokok (dari anggota)
 * PUT /api/anggota/:id/konfirmasi-bayar
 */
export const konfirmasiBayarIuranPokok = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Get current anggota data
    const anggotaResult = await client.query(
      'SELECT status, konfirmasi_bayar_iuran_pokok FROM anggota WHERE id = $1',
      [id]
    );

    if (anggotaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Anggota tidak ditemukan'
      });
    }

    const anggota = anggotaResult.rows[0];

    // Validasi: hanya anggota dengan status 'Diterima' yang bisa konfirmasi
    if (anggota.status !== 'Diterima') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Hanya anggota dengan status Diterima yang dapat mengkonfirmasi pembayaran'
      });
    }

    // Validasi: tidak bisa konfirmasi dua kali
    if (anggota.konfirmasi_bayar_iuran_pokok) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Konfirmasi pembayaran sudah pernah dilakukan'
      });
    }

    // Update konfirmasi bayar
    await client.query(
      `UPDATE anggota 
       SET konfirmasi_bayar_iuran_pokok = TRUE,
           tanggal_konfirmasi_bayar = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    // Insert history log
    await insertHistory(
      client,
      parseInt(id),
      'Diterima',
      'Diterima',
      'Konfirmasi Pembayaran',
      'Calon anggota konfirmasi sudah melakukan pembayaran iuran pokok',
      null // Dari anggota, bukan admin
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Konfirmasi pembayaran berhasil. Admin akan segera memverifikasi.'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error konfirmasi bayar:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat konfirmasi pembayaran'
    });
  } finally {
    client.release();
  }
};


/**
 * Tolak konfirmasi bayar iuran pokok (dari admin)
 * PUT /api/anggota/:id/tolak-konfirmasi-bayar
 */
export const tolakKonfirmasiBayar = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { alasanPenolakan } = req.body;

    if (!alasanPenolakan || !alasanPenolakan.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Alasan penolakan harus diisi'
      });
    }

    await client.query('BEGIN');

    // Get current anggota data
    const anggotaResult = await client.query(
      'SELECT status, konfirmasi_bayar_iuran_pokok FROM anggota WHERE id = $1',
      [id]
    );

    if (anggotaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Anggota tidak ditemukan'
      });
    }

    const anggota = anggotaResult.rows[0];

    // Validasi: hanya anggota dengan status 'Diterima' dan sudah konfirmasi
    if (anggota.status !== 'Diterima') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Hanya anggota dengan status Diterima yang dapat ditolak konfirmasinya'
      });
    }

    if (!anggota.konfirmasi_bayar_iuran_pokok) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Anggota belum melakukan konfirmasi pembayaran'
      });
    }

    // Reset konfirmasi bayar
    await client.query(
      `UPDATE anggota 
       SET konfirmasi_bayar_iuran_pokok = FALSE,
           tanggal_konfirmasi_bayar = NULL
       WHERE id = $1`,
      [id]
    );

    // Insert history log
    await insertHistory(
      client,
      parseInt(id),
      'Diterima',
      'Diterima',
      'Konfirmasi Ditolak',
      `Admin menolak konfirmasi pembayaran. Alasan: ${alasanPenolakan.trim()}`,
      1 // TODO: Get from auth context (admin user ID)
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Konfirmasi pembayaran berhasil ditolak'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error tolak konfirmasi:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menolak konfirmasi pembayaran'
    });
  } finally {
    client.release();
  }
};


/**
 * Update data anggota oleh admin
 * PUT /api/anggota/:id/admin-update
 */
export const updateAnggotaByAdmin = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const formData = req.body;

    await client.query('BEGIN');

    // Get current anggota data
    const anggotaResult = await client.query(
      'SELECT * FROM anggota WHERE id = $1',
      [id]
    );

    if (anggotaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Anggota tidak ditemukan'
      });
    }

    const currentData = anggotaResult.rows[0];

    // Resolve dusun_id dan rt_id untuk warga desa
    let dusunId: number | null = null;
    let rtId: number | null = null;

    if (formData.jenis_warga === 'warga_desa') {
      // Validasi: warga desa harus memiliki dusun dan RT
      if (!formData.dusun || !formData.rt) {
        throw new Error('Warga desa harus memilih Dusun dan RT');
      }

      const dusunResult = await client.query(
        'SELECT id FROM dusun WHERE nama = $1',
        [formData.dusun]
      );
      
      if (dusunResult.rows.length === 0) {
        throw new Error('Dusun tidak ditemukan');
      }
      
      dusunId = dusunResult.rows[0].id;

      const rtResult = await client.query(
        'SELECT id FROM rt WHERE dusun_id = $1 AND nomor = $2',
        [dusunId, formData.rt]
      );
      
      if (rtResult.rows.length === 0) {
        throw new Error('RT tidak ditemukan');
      }
      
      rtId = rtResult.rows[0].id;
    }

    // Check if NIK is being changed and if new NIK already exists
    if (formData.nik !== currentData.nik) {
      const nikCheck = await client.query(
        'SELECT id FROM anggota WHERE nik = $1 AND id != $2',
        [formData.nik, id]
      );
      
      if (nikCheck.rows.length > 0) {
        throw new Error('NIK sudah digunakan oleh anggota lain');
      }
    }

    // Check if jenis_warga, dusun_id, or rt_id changed
    // If anggota is Aktif (has nomor_anggota_koperasi), regenerate nomor anggota
    let newNomorAnggota: string | null = null;
    const hasNomorAnggota = currentData.nomor_anggota_koperasi && currentData.status === 'Aktif';
    
    if (hasNomorAnggota) {
      const jenisWargaChanged = formData.jenis_warga !== currentData.jenis_warga;
      const dusunIdChanged = dusunId !== currentData.dusun_id;
      const rtIdChanged = rtId !== currentData.rt_id;
      
      if (jenisWargaChanged || dusunIdChanged || rtIdChanged) {
        // Regenerate nomor anggota dengan data baru
        const nomorAnggotaResult = await client.query(
          'SELECT generate_nomor_anggota($1, $2, $3) as nomor',
          [formData.jenis_warga, dusunId, rtId]
        );
        newNomorAnggota = nomorAnggotaResult.rows[0].nomor;
      }
    }

    // Update anggota data
    let updateQuery = `
      UPDATE anggota SET
        nik = $1,
        nama_lengkap = $2,
        jenis_kelamin = $3,
        tempat_lahir = $4,
        tanggal_lahir = $5,
        jenis_warga = $6,
        alamat = $7,
        rt = $8,
        desa = $9,
        kecamatan = $10,
        kabupaten = $11,
        provinsi = $12,
        dusun_id = $13,
        rt_id = $14,
        nomor_rekening = $15,
        nama_bank = $16,
        nama_bank_lainnya = $17,
        atas_nama = $18,
        nomor_wa = $19,
        foto_diri = COALESCE($20, foto_diri),
        foto_ktp = COALESCE($21, foto_ktp)`;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values: any[] = [
      formData.nik,
      formData.nama_lengkap,
      formData.jenis_kelamin,
      formData.tempat_lahir,
      formData.tanggal_lahir,
      formData.jenis_warga,
      formData.alamat,
      formData.rt,
      formData.desa,
      formData.kecamatan,
      formData.kabupaten,
      formData.provinsi,
      dusunId,
      rtId,
      formData.nomor_rekening,
      formData.nama_bank,
      formData.nama_bank_lainnya || null,
      formData.atas_nama,
      formData.nomor_wa,
      formData.foto_diri || null,
      formData.foto_ktp || null
    ];

    // Add nomor_anggota_koperasi if regenerated
    if (newNomorAnggota) {
      updateQuery += `, nomor_anggota_koperasi = $${values.length + 1}`;
      values.push(newNomorAnggota);
    }

    updateQuery += ` WHERE id = $${values.length + 1} RETURNING *`;
    values.push(id);

    const result = await client.query(updateQuery, values);

    // Insert history log
    let catatan = 'Admin memperbarui data anggota';
    if (newNomorAnggota) {
      catatan += ` - Nomor anggota diperbarui menjadi ${newNomorAnggota} (perubahan jenis warga/dusun/RT)`;
    }
    
    await insertHistory(
      client,
      parseInt(id),
      currentData.status,
      currentData.status,
      'Update Data',
      catatan,
      1 // TODO: Get from auth context (admin user ID)
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Data anggota berhasil diperbarui',
      data: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error update anggota by admin:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat memperbarui data';
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  } finally {
    client.release();
  }
};


/**
 * Reset password anggota oleh admin
 * PUT /api/anggota/:id/reset-password
 */
export const resetPasswordByAdmin = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password minimal 6 karakter'
      });
    }

    await client.query('BEGIN');

    // Get current anggota  data
    const anggotaResult = await client.query(
      'SELECT status, nama_lengkap FROM anggota WHERE id = $1',
      [id]
    );

    if (anggotaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Anggota tidak ditemukan'
      });
    }

    const currentData = anggotaResult.rows[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await client.query(
      'UPDATE anggota SET password = $1 WHERE id = $2',
      [hashedPassword, id]
    );

    // Insert history log
    await insertHistory(
      client,
      parseInt(id),
      currentData.status,
      currentData.status,
      'Reset Password',
      'Admin mereset password anggota',
      1 // TODO: Get from auth context (admin user ID)
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Password berhasil direset'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error reset password:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat reset password'
    });
  } finally {
    client.release();
  }
};
