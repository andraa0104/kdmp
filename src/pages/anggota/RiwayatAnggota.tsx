import { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  FileText,
  Edit,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { authService } from '../../services/authService';
import { anggotaService } from '../../services/anggotaService';
import type { AnggotaProfile, VerifikasiHistory } from '../../services/anggotaService';
import './RiwayatAnggota.css';

const RiwayatAnggota = () => {
  const [profile, setProfile] = useState<AnggotaProfile | null>(null);
  const [history, setHistory] = useState<VerifikasiHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(5);
  const [totalItems, setTotalItems] = useState(0);

  const loadHistory = useCallback(async () => {
    if (!profile) return;
    
    setHistoryLoading(true);
    try {
      const session = authService.getCurrentUser();
      if (session) {
        const offset = itemsPerPage === 'all' ? 0 : (currentPage - 1) * (itemsPerPage as number);
        const response = await anggotaService.getHistory(
          session.user.id,
          itemsPerPage,
          offset
        );
        setHistory(response.data);
        setTotalItems(response.pagination.total);
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error loading history:', error);
      setError(error.message || 'Gagal memuat riwayat');
    } finally {
      setHistoryLoading(false);
    }
  }, [profile, currentPage, itemsPerPage]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const session = authService.getCurrentUser();
        if (session) {
          const profileData = await anggotaService.getProfile(session.user.id);
          setProfile(profileData);
        }
      } catch (err) {
        const error = err as Error;
        setError(error.message || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    if (profile) {
      loadHistory();
    }
  }, [profile, loadHistory]);

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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'Pending':
        return {
          icon: Clock,
          color: 'orange',
          title: 'Menunggu Verifikasi',
          message: 'Pendaftaran Anda sedang dalam proses verifikasi oleh admin.',
          nextStep: 'Admin akan memeriksa data Anda dalam 1-3 hari kerja.'
        };
      case 'Ditolak':
        return {
          icon: XCircle,
          color: 'red',
          title: 'Pendaftaran Ditolak',
          message: 'Mohon maaf, pendaftaran Anda ditolak oleh admin.',
          nextStep: 'Periksa alasan penolakan dan perbaiki data Anda.'
        };
      case 'Diterima':
        return {
          icon: CheckCircle,
          color: 'blue',
          title: 'Pendaftaran Diterima',
          message: 'Selamat! Pendaftaran Anda telah disetujui.',
          nextStep: 'Silakan lakukan pembayaran iuran pokok Rp 100.000 dan konfirmasi.'
        };
      case 'Aktif':
        return {
          icon: CheckCircle,
          color: 'green',
          title: 'Anggota Aktif',
          message: 'Anda adalah anggota aktif Koperasi Merah Putih.',
          nextStep: 'Anda dapat menggunakan semua layanan koperasi.'
        };
      case 'Non Aktif':
        return {
          icon: AlertCircle,
          color: 'gray',
          title: 'Status Non Aktif',
          message: 'Status keanggotaan Anda saat ini tidak aktif.',
          nextStep: 'Hubungi admin untuk informasi lebih lanjut.'
        };
      default:
        return {
          icon: Clock,
          color: 'gray',
          title: status,
          message: 'Status keanggotaan Anda.',
          nextStep: ''
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="riwayat-anggota-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Memuat riwayat...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="riwayat-anggota-container">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-retry">Coba Lagi</button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="riwayat-anggota-container">
        <div className="error-state">
          <p>Data tidak ditemukan</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(profile.status);
  
  // Check for rejected payment confirmation
  const getLatestKonfirmasiRejection = () => {
    if (!history || history.length === 0) return null;
    const rejections = history.filter(h => h.aksi === 'Konfirmasi Ditolak');
    if (rejections.length === 0) return null;
    const sorted = rejections.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted[0];
  };
  
  const hasRejectedPayment = profile.status === 'Diterima' && 
                             !profile.iuran_pokok_dibayar && 
                             !profile.konfirmasi_bayar_iuran_pokok && 
                             getLatestKonfirmasiRejection() !== null;
  const timeline = getStatusTimeline(profile.status, hasRejectedPayment);

  return (
    <div className="riwayat-anggota-container">
      {/* Header */}
      <div className="riwayat-header">
        <h1>Riwayat Keanggotaan</h1>
        <p>Lihat status dan riwayat proses keanggotaan Anda</p>
      </div>

      {/* Timeline Status Proses - Show for all statuses except Non Aktif */}
      {profile.status !== 'Non Aktif' && (
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

      {/* Timeline Riwayat */}
      <div className="timeline-section">
        <div className="timeline-header-section">
          <h2>Riwayat Data</h2>
          <div className="pagination-controls-top">
            <label htmlFor="itemsPerPage">Tampilkan:</label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => {
                const value = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
                setItemsPerPage(value);
                setCurrentPage(1);
              }}
              className="items-per-page-select"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value="all">Semua</option>
            </select>
            <span className="total-items">dari {totalItems} data</span>
          </div>
        </div>
        {historyLoading ? (
          <div className="timeline-loading">
            <div className="spinner-small"></div>
            <p>Memuat riwayat...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="timeline-empty">
            <FileText size={48} />
            <p>Belum ada riwayat</p>
          </div>
        ) : (
          <>
            <div className="history-timeline">
              {history.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-icon">
                    {item.aksi === 'Pendaftaran Baru' && <Clock size={20} />}
                    {item.aksi === 'Ditolak' && <XCircle size={20} />}
                    {item.aksi === 'Pengajuan Ulang' && <Edit size={20} />}
                    {item.aksi === 'Diterima' && <CheckCircle size={20} />}
                    {item.aksi === 'Diaktifkan' && <CheckCircle size={20} />}
                    {item.aksi === 'Update Data' && <Edit size={20} />}
                    {item.aksi === 'Update Profil' && <Edit size={20} />}
                    {item.aksi === 'Non Aktif' && <XCircle size={20} />}
                    {!['Pendaftaran Baru', 'Ditolak', 'Pengajuan Ulang', 'Diterima', 'Diaktifkan', 'Update Data', 'Update Profil', 'Non Aktif'].includes(item.aksi) && <FileText size={20} />}
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

            {/* Pagination Controls */}
            {itemsPerPage !== 'all' && (
              <div className="pagination-controls">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  <ChevronLeft size={20} />
                  Sebelumnya
                </button>
                
                <div className="pagination-pages">
                  {Array.from({ length: Math.ceil(totalItems / (itemsPerPage as number)) }, (_, i) => i + 1).map((page) => {
                    const totalPages = Math.ceil(totalItems / (itemsPerPage as number));
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="pagination-ellipsis">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalItems / (itemsPerPage as number)), prev + 1))}
                  disabled={currentPage === Math.ceil(totalItems / (itemsPerPage as number))}
                  className="pagination-btn"
                >
                  Selanjutnya
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Info Pendaftaran */}
      <div className="info-section">
        <h3>Informasi Pendaftaran</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>No. Registrasi</label>
            <span>{profile.no_registrasi}</span>
          </div>
          <div className="info-item">
            <label>Tanggal Pendaftaran</label>
            <span>{formatDate(profile.tanggal_daftar)}</span>
          </div>
          {profile.nomor_anggota_koperasi && (
            <div className="info-item">
              <label>Nomor Anggota</label>
              <span className="highlight-text">{profile.nomor_anggota_koperasi}</span>
            </div>
          )}
          {profile.tanggal_verifikasi && (
            <div className="info-item">
              <label>Tanggal Verifikasi</label>
              <span>{formatDate(profile.tanggal_verifikasi)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiwayatAnggota;
