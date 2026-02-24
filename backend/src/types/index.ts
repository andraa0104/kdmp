export interface Dusun {
  id: number;
  nama: string;
  kode_dusun: string;
  created_at: Date;
  updated_at: Date;
}

export interface RT {
  id: number;
  dusun_id: number;
  nomor: string;
  kode_rt: string;
  created_at: Date;
  updated_at: Date;
}

export interface DusunWithRT extends Dusun {
  rtList: RT[];
}

export interface Anggota {
  id: number;
  nomor_anggota_koperasi?: string; // Generated saat status = 'Aktif'
  no_registrasi: string; // REG-20260224-001
  nik: string;
  
  // Data Pribadi
  nama_lengkap: string;
  jenis_kelamin: 'laki-laki' | 'perempuan';
  tempat_lahir: string;
  tanggal_lahir: string | Date;
  umur: number;
  
  // Data Alamat
  jenis_warga: 'warga_desa' | 'warga_luar';
  alamat: string;
  rt: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  
  // Relasi
  dusun_id?: number;
  rt_id?: number;
  
  // Data Bank
  nomor_rekening: string;
  nama_bank: string;
  nama_bank_lainnya?: string;
  atas_nama: string;
  
  // Kontak & Akun
  nomor_wa: string;
  username: string;
  password: string; // Hashed
  foto_diri?: string;
  foto_ktp?: string;
  
  // Status & Verifikasi
  status: 'Pending' | 'Ditolak' | 'Diterima' | 'Non Aktif' | 'Aktif';
  tanggal_daftar: Date;
  tanggal_verifikasi?: Date;
  verified_by?: number;
  alasan_ditolak?: string;
  
  // Pembayaran
  iuran_pokok_dibayar: boolean;
  tanggal_bayar_iuran_pokok?: Date;
  bukti_bayar_iuran_pokok?: string;
  konfirmasi_bayar_iuran_pokok: boolean;
  tanggal_konfirmasi_bayar?: Date;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

export interface AnggotaRegisterInput {
  nik: string;
  nama_lengkap: string;
  jenis_kelamin: 'laki-laki' | 'perempuan';
  tempat_lahir: string;
  tanggal_lahir: string;
  umur: string;
  
  jenis_warga: 'warga_desa' | 'warga_luar';
  alamat: string;
  dusun?: string; // Nama dusun (akan di-resolve ke dusun_id)
  rt: string; // Nomor RT (akan di-resolve ke rt_id untuk warga desa)
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  
  nomor_rekening: string;
  nama_bank: string;
  nama_bank_lainnya?: string;
  atas_nama: string;
  
  nomor_wa: string;
  username: string;
  password: string;
  foto_diri?: string | null;
  foto_ktp?: string | null;
}

export interface AnggotaLoginInput {
  username: string;
  password: string;
}

export interface AnggotaLoginResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    username: string;
    nama_lengkap: string;
    status: string;
    nomor_anggota_koperasi?: string;
    token?: string;
  };
}

export interface VerifikasiHistory {
  id: number;
  anggota_id: number;
  status_sebelum: string;
  status_sesudah: string;
  catatan?: string;
  verified_by?: number;
  created_at: Date;
}

export interface PembayaranIuran {
  id: number;
  anggota_id: number;
  jenis_iuran: 'pokok' | 'wajib';
  jumlah: number;
  tanggal_bayar: Date;
  bukti_bayar?: string;
  metode_pembayaran?: string;
  catatan?: string;
  verified_by?: number;
  created_at: Date;
}
