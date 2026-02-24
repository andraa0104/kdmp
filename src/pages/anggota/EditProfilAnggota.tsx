import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Upload, X } from 'lucide-react';
import { authService } from '../../services/authService';
import { anggotaService, type AnggotaRegisterData } from '../../services/anggotaService';
import { dusunService } from '../../services/dusunService';
import './EditProfilAnggota.css';

interface DusunItem {
  id: number;
  nama: string;
  rtList: { id: number; nomor: string; }[];
}

const EditProfilAnggota = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const [formData, setFormData] = useState<AnggotaRegisterData>({
    nik: '',
    namaLengkap: '',
    jenisKelamin: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisWarga: '',
    alamat: '',
    dusun: '',
    rt: '',
    desa: '',
    kecamatan: '',
    kabupaten: '',
    provinsi: '',
    nomorRekening: '',
    namaBank: '',
    namaBankLainnya: '',
    atasNama: '',
    nomorWA: '',
    username: '',
    password: '',
    fotoDiri: null,
    fotoKtp: null
  });

  const [fotoPreview, setFotoPreview] = useState<string>('');
  const [fotoKtpPreview, setFotoKtpPreview] = useState<string>('');
  const [dusunData, setDusunData] = useState<DusunItem[]>([]);
  const [isDusunLoading, setIsDusunLoading] = useState(false);
  const [dusunLoadError, setDusunLoadError] = useState('');

  const selectedDusun = dusunData.find(dusun => dusun.nama === formData.dusun);
  const filteredRtList = selectedDusun?.rtList ?? [];

  const loadDusun = async () => {
    setIsDusunLoading(true);
    try {
      const data = await dusunService.getDusunWithRT();
      setDusunData(data);
      setDusunLoadError('');
    } catch (err) {
      const error = err as Error;
      setDusunLoadError(error.message || 'Gagal memuat data dusun');
    } finally {
      setIsDusunLoading(false);
    }
  };

  const loadProfile = useCallback(async () => {
    try {
      const session = authService.getCurrentUser();
      if (!session) {
        navigate('/login');
        return;
      }

      const profile = await anggotaService.getProfile(session.user.id);
      
      console.log('Profile loaded:', profile); // Debug log
      console.log('Tanggal lahir from DB:', profile.tanggal_lahir); // Debug log
      
      // Format tanggal lahir to YYYY-MM-DD
      let formattedTanggalLahir = '';
      if (profile.tanggal_lahir) {
        // Handle both ISO string and date string formats
        const dateStr = profile.tanggal_lahir.split('T')[0];
        formattedTanggalLahir = dateStr;
        console.log('Formatted tanggal lahir:', formattedTanggalLahir); // Debug log
      }
      
      // Populate form with existing data
      const newFormData = {
        nik: profile.nik || '',
        namaLengkap: profile.nama_lengkap || '',
        jenisKelamin: profile.jenis_kelamin || '',
        tempatLahir: profile.tempat_lahir || '',
        tanggalLahir: formattedTanggalLahir,
        jenisWarga: profile.jenis_warga || '',
        alamat: profile.alamat || '',
        dusun: profile.dusun_nama || '',
        rt: profile.rt || '',
        desa: profile.desa || '',
        kecamatan: profile.kecamatan || '',
        kabupaten: profile.kabupaten || '',
        provinsi: profile.provinsi || '',
        nomorRekening: profile.nomor_rekening || '',
        namaBank: profile.nama_bank || '',
        namaBankLainnya: '',
        atasNama: profile.atas_nama || '',
        nomorWA: profile.nomor_wa || '',
        username: profile.username || '',
        password: '', // Don't prefill password
        fotoDiri: null,
        fotoKtp: null
      };
      
      console.log('Setting formData with tanggalLahir:', newFormData.tanggalLahir); // Debug log
      setFormData(newFormData);

      // Set foto preview if exists
      if (profile.foto_diri) {
        setFotoPreview(profile.foto_diri);
      }
      if (profile.foto_ktp) {
        setFotoKtpPreview(profile.foto_ktp);
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error loading profile:', err); // Debug log
      setError(error.message || 'Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadProfile();
    loadDusun();
  }, [loadProfile]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Ukuran foto maksimal 2MB', 'error');
        return;
      }

      setFormData(prev => ({ ...prev, fotoDiri: file }));
      
      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFoto = () => {
    setFormData(prev => ({ ...prev, fotoDiri: null }));
    setFotoPreview('');
  };

  const handleKtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Ukuran foto KTP maksimal 2MB', 'error');
        return;
      }

      setFormData(prev => ({ ...prev, fotoKtp: file }));
      
      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoKtpPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeKtp = () => {
    setFormData(prev => ({ ...prev, fotoKtp: null }));
    setFotoKtpPreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.nik || !formData.namaLengkap || !formData.jenisKelamin) {
      showToast('Mohon lengkapi semua field yang wajib diisi', 'error');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const session = authService.getCurrentUser();
      if (!session) {
        navigate('/login');
        return;
      }

      await anggotaService.updateProfileAndResubmit(session.user.id, formData);
      
      showToast('Data berhasil diperbaiki dan diajukan ulang untuk verifikasi!', 'success');
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/portal-anggota');
      }, 2000);
    } catch (err) {
      const error = err as Error;
      showToast(error.message || 'Gagal mengajukan ulang pendaftaran', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-profil-loading">
        <div className="loading-spinner"></div>
        <p>Memuat data profil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="edit-profil-error">
        <AlertCircle size={48} />
        <h2>Gagal Memuat Data</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/portal-anggota')} className="btn-back">
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="edit-profil-container">
      <div className="edit-profil-header">
        <h1>Perbaiki Data & Ajukan Ulang</h1>
        <p>Perbaiki data yang ditolak dan ajukan kembali untuk verifikasi</p>
      </div>

      <form onSubmit={handleSubmit} className="edit-profil-form">
        {/* Data Pribadi */}
        <section className="form-section">
          <h2>Data Pribadi</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>NIK <span className="required">*</span></label>
              <input
                type="text"
                name="nik"
                value={formData.nik}
                onChange={handleInputChange}
                maxLength={16}
                required
              />
            </div>

            <div className="form-group">
              <label>Nama Lengkap <span className="required">*</span></label>
              <input
                type="text"
                name="namaLengkap"
                value={formData.namaLengkap}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Jenis Kelamin <span className="required">*</span></label>
              <select
                name="jenisKelamin"
                value={formData.jenisKelamin}
                onChange={handleInputChange}
                required
              >
                <option value="">Pilih Jenis Kelamin</option>
                <option value="laki-laki">Laki-laki</option>
                <option value="perempuan">Perempuan</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tempat Lahir <span className="required">*</span></label>
              <input
                type="text"
                name="tempatLahir"
                value={formData.tempatLahir}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Tanggal Lahir <span className="required">*</span></label>
            <input
              type="date"
              name="tanggalLahir"
              value={formData.tanggalLahir}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Jenis Warga <span className="required">*</span></label>
            <select
              name="jenisWarga"
              value={formData.jenisWarga}
              onChange={handleInputChange}
              required
            >
              <option value="">Pilih Jenis Warga</option>
              <option value="warga_desa">Warga Desa Purwajaya</option>
              <option value="warga_luar">Warga Luar Desa Purwajaya</option>
            </select>
          </div>
        </section>

        {/* Alamat */}
        <section className="form-section">
          <h2>Alamat</h2>
          
          <div className="form-group">
            <label>Alamat Lengkap <span className="required">*</span></label>
            <textarea
              name="alamat"
              value={formData.alamat}
              onChange={handleInputChange}
              rows={3}
              required
            />
          </div>

          {formData.jenisWarga === 'warga_desa' ? (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Dusun <span className="required">*</span></label>
                  <select
                    name="dusun"
                    value={formData.dusun}
                    onChange={handleInputChange}
                    disabled={isDusunLoading}
                    required
                  >
                    <option value="">Pilih Dusun</option>
                    {dusunData.map(d => (
                      <option key={d.id} value={d.nama}>{d.nama}</option>
                    ))}
                  </select>
                  {isDusunLoading && <small>Memuat data dusun...</small>}
                  {dusunLoadError && (
                    <div className="inline-error">
                      <span className="error-message">{dusunLoadError}</span>
                      <button type="button" className="retry-button" onClick={loadDusun}>
                        Coba lagi
                      </button>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>RT <span className="required">*</span></label>
                  <select
                    name="rt"
                    value={formData.rt}
                    onChange={handleInputChange}
                    disabled={!formData.dusun || isDusunLoading}
                    required
                  >
                    <option value="">Pilih RT</option>
                    {filteredRtList.map(rt => (
                      <option key={rt.id} value={rt.nomor}>{rt.nomor}</option>
                    ))}
                  </select>
                  {isDusunLoading && <small>Memuat RT...</small>}
                  {!isDusunLoading && formData.dusun && filteredRtList.length === 0 && (
                    <span className="error-message">RT belum tersedia untuk dusun ini</span>
                  )}
                </div>
              </div>

              <div className="info-box">
                <strong>Alamat Lengkap:</strong>
                <p>Purwajaya, Kec. Loa Janan, Kutai Kartanegara, Kalimantan Timur</p>
              </div>
            </>
          ) : formData.jenisWarga === 'warga_luar' ? (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>RT <span className="required">*</span></label>
                  <input
                    type="text"
                    name="rt"
                    value={formData.rt}
                    onChange={handleInputChange}
                    placeholder="001"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Desa/Kelurahan <span className="required">*</span></label>
                  <input
                    type="text"
                    name="desa"
                    value={formData.desa}
                    onChange={handleInputChange}
                    placeholder="Nama Desa/Kelurahan"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Kecamatan <span className="required">*</span></label>
                  <input
                    type="text"
                    name="kecamatan"
                    value={formData.kecamatan}
                    onChange={handleInputChange}
                    placeholder="Nama Kecamatan"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Kabupaten <span className="required">*</span></label>
                  <input
                    type="text"
                    name="kabupaten"
                    value={formData.kabupaten}
                    onChange={handleInputChange}
                    placeholder="Nama Kabupaten"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Provinsi <span className="required">*</span></label>
                <input
                  type="text"
                  name="provinsi"
                  value={formData.provinsi}
                  onChange={handleInputChange}
                  placeholder="Nama Provinsi"
                  required
                />
              </div>
            </>
          ) : null}
        </section>

        {/* Data Bank */}
        <section className="form-section">
          <h2>Data Bank</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Nomor Rekening <span className="required">*</span></label>
              <input
                type="text"
                name="nomorRekening"
                value={formData.nomorRekening}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Nama Bank <span className="required">*</span></label>
              <input
                type="text"
                name="namaBank"
                value={formData.namaBank}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Atas Nama <span className="required">*</span></label>
            <input
              type="text"
              name="atasNama"
              value={formData.atasNama}
              onChange={handleInputChange}
              required
            />
          </div>
        </section>

        {/* Kontak */}
        <section className="form-section">
          <h2>Kontak</h2>
          
          <div className="form-group">
            <label>Nomor WhatsApp <span className="required">*</span></label>
            <input
              type="tel"
              name="nomorWA"
              value={formData.nomorWA}
              onChange={handleInputChange}
              placeholder="08xxxxxxxxxx"
              required
            />
          </div>
        </section>

        {/* Foto Diri */}
        <section className="form-section">
          <h2>Foto Diri</h2>
          
          <div className="foto-upload-area">
            {fotoPreview ? (
              <div className="foto-preview">
                <img src={fotoPreview} alt="Preview" />
                <button type="button" onClick={removeFoto} className="btn-remove-foto">
                  <X size={16} />
                  Hapus Foto
                </button>
              </div>
            ) : (
              <label className="foto-upload-label">
                <Upload size={32} />
                <span>Klik untuk upload foto baru</span>
                <small>Maksimal 2MB (JPG, PNG)</small>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleFotoChange}
                  hidden
                />
              </label>
            )}
          </div>
        </section>

        {/* Foto KTP */}
        <section className="form-section">
          <h2>Foto KTP <span className="required">*</span></h2>
          
          <div className="foto-upload-area">
            {fotoKtpPreview ? (
              <div className="foto-preview">
                <img src={fotoKtpPreview} alt="Preview KTP" />
                <button type="button" onClick={removeKtp} className="btn-remove-foto">
                  <X size={16} />
                  Hapus Foto KTP
                </button>
              </div>
            ) : (
              <label className="foto-upload-label">
                <Upload size={32} />
                <span>Klik untuk upload foto KTP</span>
                <small>Maksimal 2MB (JPEG, JPG)</small>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg"
                  onChange={handleKtpChange}
                  hidden
                />
              </label>
            )}
          </div>
        </section>

        {/* Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/portal-anggota')}
            className="btn-cancel"
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Mengajukan...' : 'Ajukan Ulang'}
          </button>
        </div>
      </form>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          <div className="toast-content">
            {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProfilAnggota;
