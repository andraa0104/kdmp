import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  User,
  MapPin,
  Phone,
  CreditCard,
  FileText,
  Wallet,
  Edit,
  ArrowRight,
  History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { anggotaService } from '../../services/anggotaService';
import type { AnggotaProfile, VerifikasiHistory } from '../../services/anggotaService';
import './DashboardAnggota.css';

const DashboardAnggota = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AnggotaProfile | null>(null);
  const [history, setHistory] = useState<VerifikasiHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [konfirmasiLoading, setKonfirmasiLoading] = useState(false);
  const [showKonfirmasiModal, setShowKonfirmasiModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [error, setError] = useState('');

  // Calculate age from birth date
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

  // Check if konfirmasi bayar was recently rejected
  const getLatestKonfirmasiRejection = () => {
    if (!history || history.length === 0) return null;
    
    // Find the most recent "Konfirmasi Ditolak" entry
    const rejections = history.filter(
      h => h.aksi === 'Konfirmasi Ditolak'
    );
    
    if (rejections.length === 0) return null;
    
    // Sort by date descending and get the latest
    const sorted = rejections.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    return sorted[0];
  };

  useEffect(() => {
    loadProfile();
    loadHistory();
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

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const session = authService.getCurrentUser();
      if (session) {
        const response = await anggotaService.getHistory(session.user.id, 10); // Get latest 10 items for dashboard
        setHistory(response.data);
      }
    } catch (err) {
      console.error('Error loading history:', err);
      // Don't show error to user, history is optional
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleKonfirmasiBayar = async () => {
    try {
      setKonfirmasiLoading(true);
      const session = authService.getCurrentUser();
      if (session) {
        await anggotaService.konfirmasiBayar(session.user.id);
        // Reload data
        await loadProfile();
        await loadHistory();
        setShowKonfirmasiModal(false);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 5000);
      }
    } catch (err) {
      const error = err as Error;
      alert(error.message || 'Gagal konfirmasi pembayaran');
    } finally {
      setKonfirmasiLoading(false);
    }
  };

  const getStatusInfo = (status: string, hasRejectedPayment: boolean = false) => {
    // If payment confirmation was rejected, show special status
    if (status === 'Diterima' && hasRejectedPayment) {
      return {
        icon: XCircle,
        color: 'red',
        title: 'Konfirmasi Pembayaran Ditolak',
        message: 'Admin menolak konfirmasi pembayaran Anda.',
        nextStep: 'Periksa alasan penolakan di bawah, lalu lakukan pembayaran yang benar dan konfirmasi ulang.'
      };
    }

    switch (status) {
      case 'Pending':
        return {
          icon: Clock,
          color: 'orange',
          title: 'Menunggu Verifikasi',
          message: 'Pendaftaran Anda sedang dalam proses verifikasi oleh admin. Silakan menunggu.',
          nextStep: 'Admin akan memeriksa data Anda dan memberikan keputusan dalam 1-3 hari kerja.'
        };
      case 'Ditolak':
        return {
          icon: XCircle,
          color: 'red',
          title: 'Pendaftaran Ditolak',
          message: 'Mohon maaf, pendaftaran Anda ditolak oleh admin.',
          nextStep: 'Silakan periksa alasan penolakan di bawah dan perbaiki data Anda, lalu daftar kembali.'
        };
      case 'Diterima':
        return {
          icon: CheckCircle,
          color: 'blue',
          title: 'Pendaftaran Diterima',
          message: 'Selamat! Pendaftaran Anda telah disetujui.',
          nextStep: 'Silakan lakukan pembayaran iuran pokok sebesar Rp 100.000 untuk mengaktifkan keanggotaan.'
        };
      case 'Aktif':
        return {
          icon: CheckCircle,
          color: 'green',
          title: 'Anggota Aktif',
          message: 'Selamat! Anda sudah menjadi anggota aktif Koperasi Merah Putih.',
          nextStep: 'Anda dapat mulai menggunakan layanan simpanan dan pinjaman koperasi.'
        };
      case 'Non Aktif':
        return {
          icon: XCircle,
          color: 'red',
          title: 'Status Non Aktif',
          message: 'Keanggotaan Anda saat ini dalam status non aktif.',
          nextStep: 'Silakan hubungi admin untuk informasi lebih lanjut.'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'gray',
          title: 'Status Tidak Diketahui',
          message: '',
          nextStep: ''
        };
    }
  };

  const getStatusTimeline = (status: string, hasRejectedPayment: boolean = false) => {
    const steps = [
      { name: 'Pendaftaran', status: 'completed' },
      { 
        name: 'Verifikasi', 
        status: status === 'Pending' ? 'current' : 
                status === 'Ditolak' ? 'rejected' : 
                'completed' 
      },
      { 
        name: 'Pembayaran', 
        status: hasRejectedPayment ? 'rejected' : 
                status === 'Diterima' ? 'current' : 
                status === 'Aktif' ? 'completed' : 
                'pending' 
      },
      { 
        name: 'Aktif', 
        status: status === 'Aktif' ? 'completed' : 'pending' 
      }
    ];

    return steps;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Memuat data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <AlertCircle size={48} />
        <h2>Terjadi Kesalahan</h2>
        <p>{error}</p>
        <button onClick={loadProfile} className="btn-retry">Coba Lagi</button>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const hasRejectedPayment = profile.status === 'Diterima' && 
                             !profile.iuran_pokok_dibayar && 
                             !profile.konfirmasi_bayar_iuran_pokok && 
                             getLatestKonfirmasiRejection() !== null;
  const statusInfo = getStatusInfo(profile.status, hasRejectedPayment);
  const StatusIcon = statusInfo.icon;
  const timeline = getStatusTimeline(profile.status, hasRejectedPayment);

  return (
    <div className="dashboard-anggota">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-content">
          <h1>Selamat Datang, {profile.nama_lengkap.split(' ')[0]}! 👋</h1>
          <p>Berikut adalah informasi status keanggotaan Anda</p>
        </div>
      </div>

      {/* Status Card - Redesigned - Hide when payment is rejected or Non Aktif */}
      {!hasRejectedPayment && profile.status !== 'Non Aktif' && (
        <div className={`status-card-modern status-${statusInfo.color}`}>
          <div className="status-card-decoration">
            <div className="decoration-circle circle-1"></div>
            <div className="decoration-circle circle-2"></div>
            <div className="decoration-circle circle-3"></div>
          </div>
          <div className="status-card-content">
            <div className="status-card-left">
              <div className="status-icon-wrapper">
                <StatusIcon size={40} />
              </div>
              <div className="status-info">
                <div className="status-label">Status Keanggotaan</div>
                <h2 className="status-title">{statusInfo.title}</h2>
                <span className={`status-pill status-${statusInfo.color}`}>{profile.status}</span>
              </div>
            </div>
            <div className="status-card-right">
              <div className="status-message-box">
                <p className="status-message-text">{statusInfo.message}</p>
                {statusInfo.nextStep && (
                  <div className="status-next-action">
                    <div className="next-action-header">
                      <ArrowRight size={20} />
                      <strong>Langkah Selanjutnya:</strong>
                    </div>
                    <p>{statusInfo.nextStep}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason (if rejected) */}
      {profile.status === 'Ditolak' && profile.alasan_ditolak && (
        <div className="rejection-card">
          <div className="rejection-header">
            <XCircle size={24} />
            <h3>Alasan Penolakan</h3>
          </div>
          <p>{profile.alasan_ditolak}</p>
          <button 
            className="btn-resubmit"
            onClick={() => navigate('/portal-anggota/edit-profil')}
          >
            <Edit size={20} />
            Perbaiki Data & Ajukan Ulang
          </button>
        </div>
      )}

      {/* Non Aktif Alert - Show reason for inactive status */}
      {profile.status === 'Non Aktif' && (
        <div className="rejection-card non-aktif-card">
          <div className="rejection-header">
            <XCircle size={24} />
            <h3>Status Non Aktif</h3>
          </div>
          {profile.alasan_non_aktif && (
            <div className="non-aktif-reason">
              <strong>Alasan Dinonaktifkan:</strong>
              <p>{profile.alasan_non_aktif}</p>
            </div>
          )}
          {!profile.alasan_non_aktif && (
            <p>Keanggotaan Anda telah dinonaktifkan oleh admin. Silakan hubungi admin koperasi untuk informasi lebih lanjut mengenai status keanggotaan Anda.</p>
          )}
          <div className="non-aktif-info">
            <AlertCircle size={18} />
            <p>Untuk mengaktifkan kembali keanggotaan, silakan hubungi admin koperasi.</p>
          </div>
        </div>
      )}

      {/* Konfirmasi Bayar Ditolak Alert - Displayed prominently at top */}
      {hasRejectedPayment && (
        <div className="konfirmasi-rejection-alert-prominent">
          <div className="rejection-alert-header">
            <XCircle size={28} />
            <div>
              <h3>Konfirmasi Pembayaran Ditolak</h3>
              <p className="rejection-alert-date">
                Ditolak pada: {getLatestKonfirmasiRejection() && new Date(getLatestKonfirmasiRejection()!.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <div className="rejection-alert-body">
            <div className="rejection-alert-reason">
              <strong>Alasan Penolakan:</strong>
              <p>{getLatestKonfirmasiRejection()?.catatan || 'Tidak ada keterangan'}</p>
            </div>
            <div className="rejection-alert-instruction">
              <AlertCircle size={20} />
              <div>
                <strong>Apa yang harus dilakukan?</strong>
                <ol>
                  <li>Pastikan Anda <strong>sudah benar-benar melakukan transfer Rp 100.000</strong> ke rekening koperasi</li>
                  <li>Jika belum transfer, segera lakukan pembayaran terlebih dahulu</li>
                  <li>Setelah transfer berhasil, scroll ke bawah dan klik tombol <strong>"Konfirmasi Sudah Bayar"</strong></li>
                  <li>Admin akan memverifikasi pembayaran Anda kembali</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline - Only show for Pending, Ditolak, and Diterima status */}
      {profile.status !== 'Aktif' && profile.status !== 'Non Aktif' && (
        <div className="timeline-card">
          <h3>Status Proses Keanggotaan</h3>
          <div className="timeline">
            {timeline.map((step, index) => (
              <div key={index} className={`timeline-step ${step.status}`}>
                <div className="timeline-marker">
                  {step.status === 'completed' && <CheckCircle size={24} />}
                  {step.status === 'current' && <Clock size={24} />}
                  {step.status === 'rejected' && <XCircle size={24} />}
                  {step.status === 'pending' && <div className="timeline-dot"></div>}
                </div>
                <div className="timeline-content">
                  <p className="timeline-name">{step.name}</p>
                  <p className="timeline-status-text">
                    {step.status === 'completed' && 'Selesai'}
                    {step.status === 'current' && 'Sedang Diproses'}
                    {step.status === 'rejected' && 'Ditolak'}
                    {step.status === 'pending' && 'Belum Diproses'}
                  </p>
                </div>
                {index < timeline.length - 1 && (
                  <div className={`timeline-line ${step.status === 'completed' ? 'completed' : ''}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Member Dashboard - Redesigned */}
      {profile.status === 'Aktif' && (
        <div className="active-member-dashboard">
          {/* Member Hero Card */}
          <div className="member-hero-card">
            <div className="hero-bg-pattern"></div>
            <div className="member-hero-content">
              <div className="member-avatar-section">
                {profile.foto_diri ? (
                  <img src={profile.foto_diri} alt={profile.nama_lengkap} className="member-hero-avatar" />
                ) : (
                  <div className="member-hero-avatar-placeholder">
                    <User size={48} />
                  </div>
                )}
                <div className="member-hero-info">
                  <h2>{profile.nama_lengkap}</h2>
                  <div className="member-hero-meta">
                    <span className="hero-badge active">
                      <CheckCircle size={16} />
                      Anggota Aktif
                    </span>
                    <span className="hero-member-number">{profile.nomor_anggota_koperasi}</span>
                  </div>
                </div>
              </div>
              <div className="member-hero-stats">
                <div className="hero-stat-item">
                  <div className="stat-icon">
                    <Clock size={20} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">Bergabung Sejak</span>
                    <span className="stat-value">
                      {new Date(profile.tanggal_daftar).toLocaleDateString('id-ID', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                <div className="hero-stat-item">
                  <div className="stat-icon success">
                    <CheckCircle size={20} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">Status Iuran</span>
                    <span className="stat-value">Lunas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Access Menu Grid */}
          <div className="quick-menu-section">
            <h3 className="section-title">Menu Cepat</h3>
            <div className="quick-menu-grid">
              <div className="menu-card primary" onClick={() => navigate('/portal-anggota/profil')}>
                <div className="menu-card-icon">
                  <User size={28} />
                </div>
                <div className="menu-card-content">
                  <h4>Profil Saya</h4>
                  <p>Lihat & edit profil lengkap</p>
                </div>
                <ArrowRight size={20} className="menu-card-arrow" />
              </div>

              <div className="menu-card secondary" onClick={() => navigate('/portal-anggota/riwayat')}>
                <div className="menu-card-icon">
                  <History size={28} />
                </div>
                <div className="menu-card-content">
                  <h4>Riwayat</h4>
                  <p>Lihat riwayat keanggotaan</p>
                </div>
                <ArrowRight size={20} className="menu-card-arrow" />
              </div>

              <div className="menu-card accent">
                <div className="menu-card-icon">
                  <Phone size={28} />
                </div>
                <div className="menu-card-content">
                  <h4>Kontak</h4>
                  <p>{profile.nomor_wa}</p>
                </div>
              </div>

              <div className="menu-card info">
                <div className="menu-card-icon">
                  <MapPin size={28} />
                </div>
                <div className="menu-card-content">
                  <h4>Alamat</h4>
                  <p>{profile.dusun_nama ? `${profile.dusun_nama}, RT ${profile.rt_nomor || profile.rt}` : profile.alamat.substring(0, 30) + '...'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="info-cards-grid">
            <div className="info-card bank">
              <div className="info-card-header">
                <CreditCard size={24} />
                <h4>Informasi Rekening</h4>
              </div>
              <div className="info-card-body">
                <div className="info-row">
                  <span className="info-label">Bank</span>
                  <span className="info-value-text">{profile.nama_bank}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">No. Rekening</span>
                  <span className="info-value-text">{profile.nomor_rekening}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Atas Nama</span>
                  <span className="info-value-text">{profile.atas_nama}</span>
                </div>
              </div>
            </div>

            <div className="info-card membership">
              <div className="info-card-header">
                <FileText size={24} />
                <h4>Data Keanggotaan</h4>
              </div>
              <div className="info-card-body">
                <div className="info-row">
                  <span className="info-label">No. Registrasi</span>
                  <span className="info-value-text">{profile.no_registrasi}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Tanggal Verifikasi</span>
                  <span className="info-value-text">
                    {profile.tanggal_verifikasi && new Date(profile.tanggal_verifikasi).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Jenis Warga</span>
                  <span className="info-value-text">
                    {profile.jenis_warga === 'warga_desa' ? 'Warga Desa' : 'Warga Luar'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Cards Grid - Only show for pending, rejected, or accepted members */}
      {profile.status !== 'Aktif' && profile.status !== 'Non Aktif' && (
      <div className="profile-cards">
        {/* Photo Card */}
        {profile.foto_diri && (
          <div className="profile-card photo-card">
            <h3><User size={20} /> Foto Diri</h3>
            <div className="photo-display">
              <img src={profile.foto_diri} alt={profile.nama_lengkap} />
            </div>
          </div>
        )}

        {/* KTP Card */}
        {profile.foto_ktp && (
          <div className="profile-card photo-card">
            <h3><User size={20} /> Foto KTP</h3>
            <div className="photo-display">
              <img src={profile.foto_ktp} alt={`KTP ${profile.nama_lengkap}`} />
            </div>
          </div>
        )}

        {/* Personal Info */}
        <div className="profile-card">
          <h3><User size={20} /> Informasi Pribadi</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Nama Lengkap</span>
              <span className="info-value">{profile.nama_lengkap}</span>
            </div>
            <div className="info-item">
              <span className="info-label">NIK</span>
              <span className="info-value">{profile.nik}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Jenis Kelamin</span>
              <span className="info-value">{profile.jenis_kelamin}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Tempat, Tanggal Lahir</span>
              <span className="info-value">
                {profile.tempat_lahir}, {new Date(profile.tanggal_lahir).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Umur</span>
              <span className="info-value">{calculateAge(profile.tanggal_lahir)} tahun</span>
            </div>
            <div className="info-item">
              <span className="info-label">Jenis Warga</span>
              <span className="info-value">
                {profile.jenis_warga === 'warga_desa' ? 'Warga Desa' : 'Warga Luar'}
              </span>
            </div>
          </div>
        </div>

        {/* Address Info */}
        <div className="profile-card">
          <h3><MapPin size={20} /> Alamat</h3>
          <div className="info-grid">
            <div className="info-item full-width">
              <span className="info-label">Alamat Lengkap</span>
              <span className="info-value">{profile.alamat}</span>
            </div>
            {profile.dusun_nama && (
              <div className="info-item">
                <span className="info-label">Dusun</span>
                <span className="info-value">{profile.dusun_nama}</span>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">RT</span>
              <span className="info-value">{profile.rt_nomor || profile.rt}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Desa</span>
              <span className="info-value">{profile.desa}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Kecamatan</span>
              <span className="info-value">{profile.kecamatan}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Kabupaten</span>
              <span className="info-value">{profile.kabupaten}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Provinsi</span>
              <span className="info-value">{profile.provinsi}</span>
            </div>
          </div>
        </div>

        {/* Bank Info */}
        <div className="profile-card">
          <h3><CreditCard size={20} /> Informasi Rekening</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Nama Bank</span>
              <span className="info-value">{profile.nama_bank}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Nomor Rekening</span>
              <span className="info-value">{profile.nomor_rekening}</span>
            </div>
            <div className="info-item full-width">
              <span className="info-label">Atas Nama</span>
              <span className="info-value">{profile.atas_nama}</span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="profile-card">
          <h3><Phone size={20} /> Kontak</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Nomor WhatsApp</span>
              <span className="info-value">{profile.nomor_wa}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Username</span>
              <span className="info-value">{profile.username}</span>
            </div>
          </div>
        </div>

        {/* Membership Info */}
        <div className="profile-card">
          <h3><FileText size={20} /> Keanggotaan</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">No. Registrasi</span>
              <span className="info-value">{profile.no_registrasi}</span>
            </div>
            {profile.nomor_anggota_koperasi && (
              <div className="info-item">
                <span className="info-label">No. Anggota</span>
                <span className="info-value membership-number">{profile.nomor_anggota_koperasi}</span>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">Tanggal Daftar</span>
              <span className="info-value">
                {new Date(profile.tanggal_daftar).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            {profile.tanggal_verifikasi && (
              <div className="info-item">
                <span className="info-label">Tanggal Verifikasi</span>
                <span className="info-value">
                  {new Date(profile.tanggal_verifikasi).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Iuran Pokok Info */}
        <div className="profile-card">
          <h3><Wallet size={20} /> Iuran Pokok</h3>
          
          {/* Warning: Konfirmasi Ditolak */}
          {profile.status === 'Diterima' && !profile.iuran_pokok_dibayar && !profile.konfirmasi_bayar_iuran_pokok && getLatestKonfirmasiRejection() && (
            <div className="iuran-rejection-alert">
              <div className="rejection-header">
                <XCircle size={24} />
                <h4>Konfirmasi Pembayaran Ditolak</h4>
              </div>
              <div className="rejection-content">
                <p><strong>Alasan penolakan:</strong></p>
                <p className="rejection-reason">{getLatestKonfirmasiRejection()?.catatan || 'Tidak ada keterangan'}</p>
                <p><strong>Ditolak pada:</strong> {getLatestKonfirmasiRejection() && new Date(getLatestKonfirmasiRejection()!.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
                <div className="rejection-instruction">
                  <p>⚠️ <strong>Penting:</strong></p>
                  <ol>
                    <li>Pastikan Anda sudah benar-benar melakukan transfer Rp 100.000 ke rekening koperasi</li>
                    <li>Setelah transfer, klik tombol "Konfirmasi Sudah Bayar" di bawah</li>
                    <li>Admin akan memverifikasi pembayaran Anda kembali</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
          
          <div className="iuran-info">
            {profile.iuran_pokok_dibayar ? (
              <div className="iuran-paid">
                <CheckCircle size={32} />
                <div>
                  <p className="iuran-status">Sudah Dibayar</p>
                  {profile.tanggal_bayar_iuran_pokok && (
                    <p className="iuran-date">
                      Dibayar pada: {new Date(profile.tanggal_bayar_iuran_pokok).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="iuran-unpaid">
                <AlertCircle size={32} />
                <div>
                  <p className="iuran-status">Belum Dibayar</p>
                  <p className="iuran-amount">Rp 100.000</p>
                  {profile.status === 'Diterima' && !profile.konfirmasi_bayar_iuran_pokok && (
                    <p className="iuran-note">Segera lakukan pembayaran untuk aktivasi keanggotaan</p>
                  )}
                  {profile.konfirmasi_bayar_iuran_pokok && (
                    <>
                      <p className="iuran-konfirmasi">✓ Konfirmasi pembayaran diterima</p>
                      {profile.tanggal_konfirmasi_bayar && (
                        <p className="iuran-date-small">
                          Dikonfirmasi: {new Date(profile.tanggal_konfirmasi_bayar).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      )}
                      <p className="iuran-note">Menunggu verifikasi admin...</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Tombol Konfirmasi Bayar */}
          {profile.status === 'Diterima' && !profile.iuran_pokok_dibayar && !profile.konfirmasi_bayar_iuran_pokok && (
            <button 
              className="btn-konfirmasi-bayar"
              onClick={() => setShowKonfirmasiModal(true)}
            >
              <CheckCircle size={18} />
              Konfirmasi Sudah Bayar
            </button>
          )}
        </div>

        {/* Riwayat Verifikasi */}
        <div className="profile-card history-card">
          <h3><FileText size={20} /> Riwayat Status</h3>
          {historyLoading ? (
            <div className="history-loading">
              <p>Memuat riwayat...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="history-empty">
              <p>Belum ada riwayat</p>
            </div>
          ) : (
            <div className="history-timeline">
              {history.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-icon">
                    {item.aksi === 'Pendaftaran Baru' && <Clock size={20} />}
                    {item.aksi === 'Ditolak' && <XCircle size={20} />}
                    {item.aksi === 'Pengajuan Ulang' && <Edit size={20} />}
                    {item.aksi === 'Diterima' && <CheckCircle size={20} />}
                    {item.aksi === 'Diaktifkan' && <CheckCircle size={20} />}
                    {!['Pendaftaran Baru', 'Ditolak', 'Pengajuan Ulang', 'Diterima', 'Diaktifkan'].includes(item.aksi) && <FileText size={20} />}
                  </div>
                  <div className="history-content">
                    <div className="history-header">
                      <span className={`history-aksi aksi-${item.aksi.toLowerCase().replace(/\s+/g, '-')}`}>
                        {item.aksi}
                      </span>
                      <span className="history-date">
                        {new Date(item.created_at).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="history-status">
                      {item.status_sebelum && (
                        <>
                          <span className="status-badge">{item.status_sebelum}</span>
                          <span className="status-arrow">→</span>
                        </>
                      )}
                      <span className="status-badge">{item.status_sesudah}</span>
                    </div>
                    {item.catatan && (
                      <p className="history-note">{item.catatan}</p>
                    )}
                    {item.verified_by_username && (
                      <p className="history-verifier">Oleh: {item.verified_by_username}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Modal Konfirmasi Pembayaran */}
      {showKonfirmasiModal && (
        <div className="modal-overlay" onClick={() => setShowKonfirmasiModal(false)}>
          <div className="modal-konfirmasi" onClick={(e) => e.stopPropagation()}>
            <div className="modal-konfirmasi-icon">
              <Wallet size={48} />
            </div>
            <h3>Konfirmasi Pembayaran Iuran Pokok</h3>
            <div className="modal-konfirmasi-content">
              <p className="konfirmasi-question">Apakah Anda sudah melakukan pembayaran iuran pokok sebesar <strong>Rp 100.000</strong>?</p>
              <div className="konfirmasi-note">
                <AlertCircle size={20} />
                <p>Pastikan Anda sudah melakukan transfer sebelum konfirmasi. Admin akan memverifikasi pembayaran Anda.</p>
              </div>
            </div>
            <div className="modal-konfirmasi-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowKonfirmasiModal(false)}
                disabled={konfirmasiLoading}
              >
                Belum
              </button>
              <button 
                className="btn-confirm"
                onClick={handleKonfirmasiBayar}
                disabled={konfirmasiLoading}
              >
                {konfirmasiLoading ? 'Memproses...' : 'Ya, Sudah Bayar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="success-toast">
          <CheckCircle size={20} />
          <span>Konfirmasi berhasil! Admin akan segera memverifikasi pembayaran Anda.</span>
        </div>
      )}
    </div>
  );
};

export default DashboardAnggota;
