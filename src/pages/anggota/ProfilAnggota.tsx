import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Phone, 
  CreditCard, 
  Edit,
  Key,
  Calendar,
  FileText,
  Wallet,
  CheckCircle,
  X
} from 'lucide-react';
import { authService } from '../../services/authService';
import { anggotaService } from '../../services/anggotaService';
import type { AnggotaProfile } from '../../services/anggotaService';
import './ProfilAnggota.css';

const ProfilAnggota = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AnggotaProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const session = authService.getCurrentUser();
      if (session) {
        const data = await anggotaService.getProfile(session.user.id);
        setProfile(data);
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfil = () => {
    navigate('/portal-anggota/edit-profil');
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert('Semua field wajib diisi');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Password baru dan konfirmasi tidak cocok');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('Password minimal 6 karakter');
      return;
    }

    try {
      setPasswordLoading(true);
      const session = authService.getCurrentUser();
      if (session) {
        await anggotaService.updatePassword(
          session.user.id,
          passwordData.currentPassword,
          passwordData.newPassword
        );
        
        setToastMessage('Password berhasil diubah!');
        setShowSuccessToast(true);
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        setTimeout(() => setShowSuccessToast(false), 3000);
      }
    } catch (err) {
      const error = err as Error;
      alert(error.message || 'Gagal mengubah password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="profil-anggota-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profil-anggota-container">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={loadProfile} className="btn-retry">Coba Lagi</button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profil-anggota-container">
        <div className="error-state">
          <p>Profil tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profil-anggota-container">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="toast-notification success">
          <CheckCircle size={20} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header dengan Action Buttons */}
      <div className="profil-header">
        <div className="profil-header-left">
          <h1>Profil Saya</h1>
          <p>Kelola informasi pribadi Anda</p>
        </div>
        <div className="profil-header-right">
          <button className="btn-edit-profil" onClick={handleEditProfil}>
            <Edit size={18} />
            Edit Profil
          </button>
          <button className="btn-change-password" onClick={() => setShowPasswordModal(true)}>
            <Key size={18} />
            Ubah Password
          </button>
        </div>
      </div>

      {/* Foto Profil */}
      <div className="profil-foto-section">
        <div className="foto-card">
          <h3>Foto Diri</h3>
          {profile.foto_diri ? (
            <img src={profile.foto_diri} alt="Foto Diri" className="foto-preview" />
          ) : (
            <div className="foto-placeholder">
              <User size={48} />
              <p>Belum ada foto</p>
            </div>
          )}
        </div>
        <div className="foto-card">
          <h3>Foto KTP</h3>
          {profile.foto_ktp ? (
            <img src={profile.foto_ktp} alt="Foto KTP" className="foto-preview" />
          ) : (
            <div className="foto-placeholder">
              <FileText size={48} />
              <p>Belum ada foto KTP</p>
            </div>
          )}
        </div>
      </div>

      {/* Informasi Keanggotaan */}
      <div className="profil-section">
        <div className="section-header">
          <Wallet size={24} />
          <h2>Informasi Keanggotaan</h2>
        </div>
        <div className="info-grid">
          <div className="info-item">
            <label>Status Keanggotaan</label>
            <span className={`status-badge status-${profile.status?.toLowerCase().replace(' ', '-')}`}>
              {profile.status}
            </span>
          </div>
          <div className="info-item">
            <label>Nomor Anggota Koperasi</label>
            <span className="highlight-text">{profile.nomor_anggota_koperasi || 'Belum ada'}</span>
          </div>
          <div className="info-item">
            <label>No. Registrasi</label>
            <span>{profile.no_registrasi}</span>
          </div>
          <div className="info-item">
            <label>Tanggal Pendaftaran</label>
            <span>{formatDate(profile.tanggal_daftar)}</span>
          </div>
          {profile.tanggal_verifikasi && (
            <div className="info-item">
              <label>Tanggal Verifikasi</label>
              <span>{formatDate(profile.tanggal_verifikasi)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Iuran Pokok */}
      {profile.status === 'Aktif' && (
        <div className="profil-section">
          <div className="section-header">
            <Wallet size={24} />
            <h2>Iuran Pokok</h2>
          </div>
          <div className="info-grid">
            <div className="info-item">
              <label>Status Pembayaran</label>
              <span className={`status-badge ${profile.iuran_pokok_dibayar ? 'status-aktif' : 'status-pending'}`}>
                {profile.iuran_pokok_dibayar ? 'Sudah Dibayar' : 'Belum Dibayar'}
              </span>
            </div>
            {profile.tanggal_bayar_iuran_pokok && (
              <div className="info-item">
                <label>Tanggal Pembayaran</label>
                <span>{formatDate(profile.tanggal_bayar_iuran_pokok)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Informasi Pribadi */}
      <div className="profil-section">
        <div className="section-header">
          <User size={24} />
          <h2>Informasi Pribadi</h2>
        </div>
        <div className="info-grid">
          <div className="info-item">
            <label>NIK</label>
            <span>{profile.nik}</span>
          </div>
          <div className="info-item">
            <label>Nama Lengkap</label>
            <span>{profile.nama_lengkap}</span>
          </div>
          <div className="info-item">
            <label>Jenis Kelamin</label>
            <span>{profile.jenis_kelamin === 'laki-laki' ? 'Laki-laki' : 'Perempuan'}</span>
          </div>
          <div className="info-item">
            <label>Tempat, Tanggal Lahir</label>
            <span>{profile.tempat_lahir}, {formatDate(profile.tanggal_lahir)}</span>
          </div>
          <div className="info-item">
            <label>Umur</label>
            <span>{calculateAge(profile.tanggal_lahir)} tahun</span>
          </div>
          <div className="info-item">
            <label>Jenis Warga</label>
            <span>{profile.jenis_warga === 'warga_desa' ? 'Warga Desa' : 'Warga Luar'}</span>
          </div>
        </div>
      </div>

      {/* Alamat */}
      <div className="profil-section">
        <div className="section-header">
          <MapPin size={24} />
          <h2>Alamat</h2>
        </div>
        <div className="info-grid">
          <div className="info-item full-width">
            <label>Alamat Lengkap</label>
            <span>{profile.alamat}</span>
          </div>
          {profile.jenis_warga === 'warga_desa' && (
            <>
              <div className="info-item">
                <label>RT</label>
                <span>{profile.rt_nomor}</span>
              </div>
              <div className="info-item">
                <label>Dusun</label>
                <span>{profile.dusun_nama}</span>
              </div>
            </>
          )}
          <div className="info-item">
            <label>Desa</label>
            <span>{profile.desa}</span>
          </div>
          <div className="info-item">
            <label>Kecamatan</label>
            <span>{profile.kecamatan}</span>
          </div>
          <div className="info-item">
            <label>Kabupaten</label>
            <span>{profile.kabupaten}</span>
          </div>
          <div className="info-item">
            <label>Provinsi</label>
            <span>{profile.provinsi}</span>
          </div>
        </div>
      </div>

      {/* Informasi Rekening */}
      <div className="profil-section">
        <div className="section-header">
          <CreditCard size={24} />
          <h2>Informasi Rekening</h2>
        </div>
        <div className="info-grid">
          <div className="info-item">
            <label>Nama Bank</label>
            <span>{profile.nama_bank}</span>
          </div>
          <div className="info-item">
            <label>Nomor Rekening</label>
            <span>{profile.nomor_rekening}</span>
          </div>
          <div className="info-item">
            <label>Atas Nama</label>
            <span>{profile.atas_nama}</span>
          </div>
        </div>
      </div>

      {/* Kontak */}
      <div className="profil-section">
        <div className="section-header">
          <Phone size={24} />
          <h2>Kontak</h2>
        </div>
        <div className="info-grid">
          <div className="info-item">
            <label>Nomor WhatsApp</label>
            <span>{profile.nomor_wa}</span>
          </div>
          <div className="info-item">
            <label>Username</label>
            <span>{profile.username}</span>
          </div>
        </div>
      </div>

      {/* Modal Ubah Password */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ubah Password</h3>
              <button className="btn-close-modal" onClick={() => setShowPasswordModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label>Password Saat Ini <span className="required">*</span></label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  placeholder="Masukkan password saat ini"
                  required
                />
              </div>
              <div className="form-group">
                <label>Password Baru <span className="required">*</span></label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  placeholder="Masukkan password baru (minimal 6 karakter)"
                  required
                />
              </div>
              <div className="form-group">
                <label>Konfirmasi Password Baru <span className="required">*</span></label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  placeholder="Konfirmasi password baru"
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={passwordLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Menyimpan...' : 'Simpan Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilAnggota;
