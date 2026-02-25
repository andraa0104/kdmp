import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, UserCheck, UserX, CheckCircle, XCircle, Eye, Calendar, AlertCircle, Users, Edit2, Key, Upload } from 'lucide-react';
import { anggotaService, type AnggotaListItem, type AnggotaProfile } from '../../services/anggotaService';
import { dusunService, type DusunItem } from '../../services/dusunService';
import Modal from '../../components/Modal';
import './KelolaAnggota.css';

type StatusFilter = 'All' | 'Pending' | 'Ditolak' | 'Diterima' | 'Aktif' | 'Non Aktif';
type ToastType = 'success' | 'error' | 'warning' | 'info';

const KelolaAnggota = () => {
  const [anggotaList, setAnggotaList] = useState<AnggotaListItem[]>([]);
  const [filteredList, setFilteredList] = useState<AnggotaListItem[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Toast notification states
  const [toast, setToast] = useState<{ show: boolean; message: string; type: ToastType }>({
    show: false,
    message: '',
    type: 'info'
  });
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedAnggota, setSelectedAnggota] = useState<AnggotaProfile | null>(null);
  const [verifyAction, setVerifyAction] = useState<'approve' | 'reject' | 'activate' | 'reject-payment'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit form states
  const [editFormData, setEditFormData] = useState<Record<string, string>>({});
  const [editFotoDiri, setEditFotoDiri] = useState<File | null>(null);
  const [editFotoKTP, setEditFotoKTP] = useState<File | null>(null);
  const [fotoDiriPreview, setFotoDiriPreview] = useState<string | null>(null);
  const [fotoKTPPreview, setFotoKTPPreview] = useState<string | null>(null);

  // Dusun & RT states
  const [dusunData, setDusunData] = useState<DusunItem[]>([]);
  const [isDusunLoading, setIsDusunLoading] = useState(false);
  const [dusunLoadError, setDusunLoadError] = useState('');

  // Reset password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const statusTabs: StatusFilter[] = ['All', 'Pending', 'Ditolak', 'Diterima', 'Aktif', 'Non Aktif'];

  // Toast notification function
  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'info' });
    }, 4000);
  };

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

  const statusColors = {
    'Pending': 'status-pending',
    'Ditolak': 'status-rejected',
    'Diterima': 'status-approved',
    'Aktif': 'status-active',
    'Non Aktif': 'status-inactive'
  };

  const statusIcons = {
    'Pending': Calendar,
    'Ditolak': XCircle,
    'Diterima': CheckCircle,
    'Aktif': UserCheck,
    'Non Aktif': UserX
  };

  // Computed values for dusun & RT
  const selectedDusun = dusunData.find(dusun => dusun.nama === editFormData.dusun);
  const filteredRtList = selectedDusun?.rtList ?? [];

  // Load dusun data
  const loadDusun = async () => {
    setIsDusunLoading(true);
    try {
      const data = await dusunService.getDusunWithRT();
      setDusunData(data);
      setDusunLoadError('');
    } catch {
      setDusunData([]);
      setDusunLoadError('Gagal memuat data dusun. Coba lagi.');
    } finally {
      setIsDusunLoading(false);
    }
  };

  useEffect(() => {
    loadAnggota();
    loadDusun();
  }, []);

  const filterAnggota = useCallback(() => {
    let filtered = [...anggotaList];

    // Filter by status
    if (selectedStatus !== 'All') {
      filtered = filtered.filter(a => a.status === selectedStatus);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.nama_lengkap.toLowerCase().includes(query) ||
        a.nik.includes(query) ||
        a.no_registrasi.toLowerCase().includes(query) ||
        (a.nomor_anggota_koperasi && a.nomor_anggota_koperasi.includes(query))
      );
    }

    setFilteredList(filtered);
  }, [selectedStatus, searchQuery, anggotaList]);

  useEffect(() => {
    filterAnggota();
  }, [filterAnggota]);

  const loadAnggota = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await anggotaService.getAll();
      setAnggotaList(data);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Gagal memuat data anggota');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetail = async (anggota: AnggotaListItem) => {
    try {
      const profile = await anggotaService.getProfile(anggota.id);
      setSelectedAnggota(profile);
      setShowDetailModal(true);
    } catch (err) {
      const error = err as Error;
      showToast(error.message || 'Gagal memuat detail anggota', 'error');
    }
  };

  const handleVerifyClick = (action: 'approve' | 'reject' | 'activate' | 'reject-payment') => {
    setVerifyAction(action);
    setRejectionReason('');
    setShowDetailModal(false);
    setShowVerifyModal(true);
  };

  const handleVerifySubmit = async () => {
    if (!selectedAnggota) return;

    if ((verifyAction === 'reject' || verifyAction === 'reject-payment') && !rejectionReason.trim()) {
      showToast('Alasan penolakan harus diisi', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      // Handle reject payment confirmation
      if (verifyAction === 'reject-payment') {
        await anggotaService.tolakKonfirmasiBayar(
          selectedAnggota.id,
          rejectionReason.trim()
        );
        showToast('Konfirmasi pembayaran berhasil ditolak', 'success');
        setShowVerifyModal(false);
        setSelectedAnggota(null);
        loadAnggota();
        return;
      }

      // Handle normal status update
      let newStatus = '';
      if (verifyAction === 'approve') newStatus = 'Diterima';
      if (verifyAction === 'reject') newStatus = 'Ditolak';
      if (verifyAction === 'activate') newStatus = 'Aktif';

      await anggotaService.updateStatus(
        selectedAnggota.id,
        newStatus,
        verifyAction === 'reject' ? rejectionReason : undefined,
        1 // TODO: Get from auth context (admin user ID)
      );

      showToast('Status berhasil diupdate!', 'success');
      setShowVerifyModal(false);
      setSelectedAnggota(null);
      loadAnggota(); // Reload data
    } catch (err) {
      const error = err as Error;
      showToast(error.message || 'Gagal mengupdate status', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (anggota: AnggotaProfile) => {
    setSelectedAnggota(anggota);
    // Format tanggal lahir untuk input date (YYYY-MM-DD)
    const tanggalLahir = anggota.tanggal_lahir ? anggota.tanggal_lahir.split('T')[0] : '';
    setEditFormData({
      nik: anggota.nik,
      nama_lengkap: anggota.nama_lengkap,
      jenis_kelamin: anggota.jenis_kelamin,
      tempat_lahir: anggota.tempat_lahir,
      tanggal_lahir: tanggalLahir,
      jenis_warga: anggota.jenis_warga,
      alamat: anggota.alamat,
      dusun: anggota.dusun_nama || '',
      rt: anggota.rt,
      desa: anggota.desa,
      kecamatan: anggota.kecamatan,
      kabupaten: anggota.kabupaten,
      provinsi: anggota.provinsi,
      nomor_rekening: anggota.nomor_rekening,
      nama_bank: anggota.nama_bank,
      nama_bank_lainnya: anggota.nama_bank_lainnya || '',
      atas_nama: anggota.atas_nama,
      nomor_wa: anggota.nomor_wa
    });
    setFotoDiriPreview(anggota.foto_diri || null);
    setFotoKTPPreview(anggota.foto_ktp || null);
    setEditFotoDiri(null);
    setEditFotoKTP(null);
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedAnggota) return;
    
    // Validasi untuk warga desa
    if (editFormData.jenis_warga === 'warga_desa') {
      if (!editFormData.dusun || !editFormData.rt) {
        showToast('Warga desa harus memilih Dusun dan RT', 'warning');
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      const updateData: Record<string, string | File | null> = {
        ...editFormData,
        fotoDiri: editFotoDiri,
        fotoKtp: editFotoKTP
      };

      await anggotaService.updateByAdmin(selectedAnggota.id, updateData);
      showToast('Data anggota berhasil diperbarui', 'success');
      setShowEditModal(false);
      setSelectedAnggota(null);
      loadAnggota();
    } catch (err) {
      const error = err as Error;
      showToast(error.message || 'Gagal memperbarui data', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordClick = (anggota: AnggotaProfile) => {
    setSelectedAnggota(anggota);
    setNewPassword('');
    setConfirmPassword('');
    setShowDetailModal(false);
    setShowResetPasswordModal(true);
  };

  const handleResetPasswordSubmit = async () => {
    if (!selectedAnggota) return;

    if (newPassword.length < 6) {
      showToast('Password minimal 6 karakter', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Password tidak cocok', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await anggotaService.resetPassword(selectedAnggota.id, newPassword);
      showToast('Password berhasil direset', 'success');
      setShowResetPasswordModal(false);
      setSelectedAnggota(null);
    } catch (err) {
      const error = err as Error;
      showToast(error.message || 'Gagal reset password', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxSize = 800;

          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Kompresi gagal'));
              }
            },
            'image/jpeg',
            0.7
          );
        };
      };
      reader.onerror = reject;
    });
  };

  const handleFotoDiriChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Ukuran file maksimal 2MB', 'error');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showToast('File harus berupa gambar', 'error');
        return;
      }

      let processedFile = file;
      if (file.size > 500 * 1024) {
        try {
          processedFile = await compressImage(file);
          showToast('Foto berhasil dikompress', 'success');
        } catch {
          showToast('Gagal memproses gambar', 'error');
          return;
        }
      }

      setEditFotoDiri(processedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoDiriPreview(reader.result as string);
      };
      reader.readAsDataURL(processedFile);
    }
  };

  const handleFotoKTPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Ukuran file maksimal 2MB', 'error');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showToast('File harus berupa gambar', 'error');
        return;
      }

      let processedFile = file;
      if (file.size > 500 * 1024) {
        try {
          processedFile = await compressImage(file);
          showToast('Foto KTP berhasil dikompress', 'success');
        } catch {
          showToast('Gagal memproses gambar', 'error');
          return;
        }
      }

      setEditFotoKTP(processedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoKTPPreview(reader.result as string);
      };
      reader.readAsDataURL(processedFile);
    }
  };

  const handleEditFormChange = (field: string, value: string) => {
    // Handle jenis warga change
    if (field === 'jenis_warga') {
      if (value === 'warga_desa') {
        setEditFormData((prev: Record<string, string>) => ({
          ...prev,
          [field]: value,
          desa: 'Purwajaya',
          kecamatan: 'Loa Janan',
          kabupaten: 'Kutai Kartanegara',
          provinsi: 'Kalimantan Timur',
          dusun: '',
          rt: ''
        }));
      } else {
        setEditFormData((prev: Record<string, string>) => ({
          ...prev,
          [field]: value,
          dusun: '',
          desa: '',
          kecamatan: '',
          kabupaten: '',
          provinsi: '',
          rt: ''
        }));
      }
      return;
    }

    // Handle dusun change - reset RT
    if (field === 'dusun') {
      setEditFormData((prev: Record<string, string>) => ({
        ...prev,
        dusun: value,
        rt: ''
      }));
      return;
    }

    // Default behavior
    setEditFormData((prev: Record<string, string>) => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusCount = (status: StatusFilter) => {
    if (status === 'All') return anggotaList.length;
    return anggotaList.filter(a => a.status === status).length;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="kelola-anggota-page">
      <div className="page-header">
        <div>
          <h1>Kelola Anggota</h1>
          <p>Verifikasi dan kelola data anggota koperasi</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-label">Total Anggota</span>
            <span className="stat-value">{anggotaList.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Menunggu Verifikasi</span>
            <span className="stat-value pending">{getStatusCount('Pending')}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Aktif</span>
            <span className="stat-value active">{getStatusCount('Aktif')}</span>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="status-tabs">
        {statusTabs.map(status => (
          <button
            key={status}
            className={`tab-item ${selectedStatus === status ? 'active' : ''}`}
            onClick={() => setSelectedStatus(status)}
          >
            {status}
            <span className="tab-count">{getStatusCount(status)}</span>
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Cari nama, NIK, atau nomor registrasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="btn-filter">
          <Filter size={20} />
          Filter
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={loadAnggota}>Coba Lagi</button>
        </div>
      )}

      {/* Anggota Table */}
      <div className="anggota-table-container">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Memuat data anggota...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="empty-state">
            <Users size={60} />
            <h3>Tidak ada anggota</h3>
            <p>
              {searchQuery ? 'Tidak ditemukan hasil pencarian' : 'Belum ada data anggota'}
            </p>
          </div>
        ) : (
          <table className="anggota-table">
            <thead>
              <tr>
                <th>Nomor Anggota</th>
                <th>Nama Lengkap</th>
                <th>Jenis Warga</th>
                <th>Tanggal Daftar</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map(anggota => {
                const StatusIcon = statusIcons[anggota.status as keyof typeof statusIcons];
                return (
                  <tr key={anggota.id}>
                    <td>
                      {anggota.nomor_anggota_koperasi ? (
                        <span className="member-number">{anggota.nomor_anggota_koperasi}</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <div className="member-info">
                        <span className="member-name">{anggota.nama_lengkap}</span>
                        <span className="member-gender">{anggota.jenis_kelamin}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${anggota.jenis_warga === 'warga_desa' ? 'badge-blue' : 'badge-gray'}`}>
                        {anggota.jenis_warga === 'warga_desa' ? 'Warga Desa' : 'Warga Luar'}
                      </span>
                    </td>
                    <td>{formatDate(anggota.tanggal_daftar)}</td>
                    <td>
                      <span className={`status-badge ${statusColors[anggota.status as keyof typeof statusColors]}`}>
                        <StatusIcon size={14} />
                        {anggota.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-action btn-view"
                        onClick={() => handleViewDetail(anggota)}
                        title="Lihat Detail"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedAnggota && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedAnggota(null);
          }}
          title="Detail Anggota"
        >
          <div className="anggota-detail">
            {/* Status Banner */}
            <div className={`status-banner ${statusColors[selectedAnggota.status as keyof typeof statusColors]}`}>
              {(() => {
                const StatusIcon = statusIcons[selectedAnggota.status as keyof typeof statusIcons];
                return <StatusIcon size={24} />;
              })()}
              <div>
                <span className="status-label">Status Pendaftaran</span>
                <span className="status-text">{selectedAnggota.status}</span>
              </div>
            </div>

            {/* Foto Diri */}
            {selectedAnggota.foto_diri && (
              <div className="photo-section">
                <h3>Foto Diri</h3>
                <div className="photo-container">
                  <img 
                    src={selectedAnggota.foto_diri} 
                    alt={`Foto ${selectedAnggota.nama_lengkap}`}
                    className="member-photo"
                  />
                </div>
              </div>
            )}

            {/* Foto KTP */}
            {selectedAnggota.foto_ktp && (
              <div className="photo-section">
                <h3>Foto KTP</h3>
                <div className="photo-container">
                  <img 
                    src={selectedAnggota.foto_ktp} 
                    alt={`KTP ${selectedAnggota.nama_lengkap}`}
                    className="member-photo"
                  />
                </div>
              </div>
            )}

            {/* Rejection Reason (if rejected) */}
            {selectedAnggota.status === 'Ditolak' && selectedAnggota.alasan_ditolak && (
              <div className="rejection-box">
                <XCircle size={20} />
                <div>
                  <strong>Alasan Penolakan:</strong>
                  <p>{selectedAnggota.alasan_ditolak}</p>
                </div>
              </div>
            )}

            {/* Member Number (if active) */}
            {selectedAnggota.nomor_anggota_koperasi && (
              <div className="member-number-box">
                <strong>Nomor Anggota Koperasi</strong>
                <span className="big-number">{selectedAnggota.nomor_anggota_koperasi}</span>
              </div>
            )}

            {/* Registration Info */}
            <div className="detail-section">
              <h3>Informasi Pendaftaran</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>No. Registrasi</label>
                  <span>{selectedAnggota.no_registrasi}</span>
                </div>
                <div className="detail-item">
                  <label>Tanggal Daftar</label>
                  <span>{formatDate(selectedAnggota.tanggal_daftar)}</span>
                </div>
                {selectedAnggota.tanggal_verifikasi && (
                  <div className="detail-item">
                    <label>Tanggal Verifikasi</label>
                    <span>{formatDate(selectedAnggota.tanggal_verifikasi)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Personal Data */}
            <div className="detail-section">
              <h3>Data Pribadi</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>NIK</label>
                  <span>{selectedAnggota.nik}</span>
                </div>
                <div className="detail-item">
                  <label>Nama Lengkap</label>
                  <span>{selectedAnggota.nama_lengkap}</span>
                </div>
                <div className="detail-item">
                  <label>Jenis Kelamin</label>
                  <span>{selectedAnggota.jenis_kelamin}</span>
                </div>
                <div className="detail-item">
                  <label>Tempat, Tanggal Lahir</label>
                  <span>{selectedAnggota.tempat_lahir}, {formatDate(selectedAnggota.tanggal_lahir)}</span>
                </div>
                <div className="detail-item">
                  <label>Umur</label>
                  <span>{calculateAge(selectedAnggota.tanggal_lahir)} tahun</span>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="detail-section">
              <h3>Alamat</h3>
              <div className="detail-grid">
                <div className="detail-item full-width">
                  <label>Jenis Warga</label>
                  <span className={`badge ${selectedAnggota.jenis_warga === 'warga_desa' ? 'badge-blue' : 'badge-gray'}`}>
                    {selectedAnggota.jenis_warga === 'warga_desa' ? 'Warga Desa Purwajaya' : 'Warga Luar Desa Purwajaya'}
                  </span>
                </div>
                <div className="detail-item full-width">
                  <label>Alamat Lengkap</label>
                  <span>{selectedAnggota.alamat}</span>
                </div>
                {selectedAnggota.dusun_nama && (
                  <div className="detail-item">
                    <label>Dusun</label>
                    <span>{selectedAnggota.dusun_nama}</span>
                  </div>
                )}
                <div className="detail-item">
                  <label>RT</label>
                  <span>{selectedAnggota.rt_nomor || selectedAnggota.rt}</span>
                </div>
                <div className="detail-item">
                  <label>Desa/Kelurahan</label>
                  <span>{selectedAnggota.desa}</span>
                </div>
                <div className="detail-item">
                  <label>Kecamatan</label>
                  <span>{selectedAnggota.kecamatan}</span>
                </div>
                <div className="detail-item">
                  <label>Kabupaten</label>
                  <span>{selectedAnggota.kabupaten}</span>
                </div>
                <div className="detail-item">
                  <label>Provinsi</label>
                  <span>{selectedAnggota.provinsi}</span>
                </div>
              </div>
            </div>

            {/* Bank Info */}
            <div className="detail-section">
              <h3>Informasi Bank</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Nama Bank</label>
                  <span>{selectedAnggota.nama_bank}</span>
                </div>
                <div className="detail-item">
                  <label>Nomor Rekening</label>
                  <span>{selectedAnggota.nomor_rekening}</span>
                </div>
                <div className="detail-item full-width">
                  <label>Atas Nama</label>
                  <span>{selectedAnggota.atas_nama}</span>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="detail-section">
              <h3>Kontak & Akun</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Nomor WhatsApp</label>
                  <span>{selectedAnggota.nomor_wa}</span>
                </div>
                <div className="detail-item">
                  <label>Username</label>
                  <span>{selectedAnggota.username}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="modal-actions">
              {/* Admin Action Buttons - Always visible */}
              <div className="admin-action-buttons">
                <button
                  className="btn-edit"
                  onClick={() => handleEditClick(selectedAnggota)}
                  title="Edit Data Anggota"
                >
                  <Edit2 size={18} />
                  Edit Data
                </button>
                <button
                  className="btn-reset-password"
                  onClick={() => handleResetPasswordClick(selectedAnggota)}
                  title="Reset Password"
                >
                  <Key size={18} />
                  Reset Password
                </button>
              </div>

              {/* Status-specific Action Buttons */}
              {selectedAnggota.status === 'Pending' && (
                <>
                  <button
                    className="btn-success"
                    onClick={() => handleVerifyClick('approve')}
                  >
                    <CheckCircle size={20} />
                    Setujui Pendaftaran
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleVerifyClick('reject')}
                  >
                    <XCircle size={20} />
                    Tolak Pendaftaran
                  </button>
                </>
              )}
              {selectedAnggota.status === 'Diterima' && !selectedAnggota.iuran_pokok_dibayar && !selectedAnggota.konfirmasi_bayar_iuran_pokok && (
                <div className="info-box warning">
                  <AlertCircle size={20} />
                  <p>Menunggu calon anggota melakukan pembayaran dan konfirmasi iuran pokok.</p>
                </div>
              )}
              
              {/* Status: Diterima - Anggota Konfirmasi Bayar */}
              {selectedAnggota.status === 'Diterima' && !selectedAnggota.iuran_pokok_dibayar && selectedAnggota.konfirmasi_bayar_iuran_pokok && (
                <>
                  <div className="konfirmasi-bayar-section">
                    <div className="konfirmasi-info-header">
                      <CheckCircle size={24} style={{ color: '#10b981' }} />
                      <div>
                        <h4 style={{ margin: 0, color: '#10b981', fontSize: '1.1rem' }}>Konfirmasi Pembayaran Diterima</h4>
                        {selectedAnggota.tanggal_konfirmasi_bayar && (
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: '#6b7280' }}>
                            Dikonfirmasi: {new Date(selectedAnggota.tanggal_konfirmasi_bayar).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="konfirmasi-instructions">
                      <div className="instruction-box warning">
                        <AlertCircle size={18} />
                        <p><strong>Langkah Verifikasi:</strong></p>
                        <ol>
                          <li>Cek rekening bank koperasi</li>
                          <li>Pastikan transfer Rp 100.000 sudah masuk</li>
                          <li>Cocokkan nama pengirim dengan nama anggota</li>
                        </ol>
                      </div>

                      <div className="instruction-box info">
                        <CheckCircle size={18} />
                        <p><strong>Jika pembayaran sudah diterima:</strong> Klik tombol hijau "Verifikasi & Aktifkan"</p>
                      </div>

                      <div className="instruction-box danger">
                        <XCircle size={18} />
                        <p><strong>Jika pembayaran belum masuk:</strong> Klik tombol merah "Tolak Konfirmasi" untuk membatalkan</p>
                      </div>
                    </div>

                    <div className="konfirmasi-actions">
                      <button
                        className="btn-danger-outline"
                        onClick={() => handleVerifyClick('reject-payment')}
                      >
                        <XCircle size={20} />
                        Tolak Konfirmasi
                      </button>
                      <button
                        className="btn-success"
                        onClick={() => handleVerifyClick('activate')}
                      >
                        <CheckCircle size={20} />
                        Verifikasi & Aktifkan
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Verify Modal */}
      {showVerifyModal && selectedAnggota && (
        <Modal
          isOpen={showVerifyModal}
          onClose={() => {
            setShowVerifyModal(false);
            setShowDetailModal(true);
          }}
          title={
            verifyAction === 'approve' ? 'Setujui Pendaftaran' :
            verifyAction === 'reject' ? 'Tolak Pendaftaran' :
            verifyAction === 'reject-payment' ? 'Tolak Konfirmasi Pembayaran' :
            'Aktifkan Anggota'
          }
        >
          <div className="verify-modal">
            {verifyAction === 'approve' && (
              <>
                <div className="verify-info">
                  <CheckCircle size={48} className="icon-success" />
                  <h3>Setujui pendaftaran anggota ini?</h3>
                  <p>Anggota: <strong>{selectedAnggota.nama_lengkap}</strong></p>
                  <p>NIK: {selectedAnggota.nik}</p>
                </div>
                <div className="info-box">
                  <AlertCircle size={20} />
                  <p>Setelah disetujui, anggota akan dihubungi untuk melakukan pembayaran iuran pokok.</p>
                </div>
              </>
            )}

            {verifyAction === 'reject' && (
              <>
                <div className="verify-info">
                  <XCircle size={48} className="icon-danger" />
                  <h3>Tolak pendaftaran anggota ini?</h3>
                  <p>Anggota: <strong>{selectedAnggota.nama_lengkap}</strong></p>
                  <p>NIK: {selectedAnggota.nik}</p>
                </div>
                <div className="form-group">
                  <label htmlFor="rejectionReason">Alasan Penolakan <span className="required">*</span></label>
                  <textarea
                    id="rejectionReason"
                    rows={4}
                    placeholder="Jelaskan alasan penolakan..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className={!rejectionReason.trim() ? 'error' : ''}
                  />
                  <small>Alasan ini akan dilihat oleh anggota dan dapat dijadikan acuan untuk pendaftaran ulang.</small>
                </div>
              </>
            )}

            {verifyAction === 'reject-payment' && (
              <>
                <div className="verify-info">
                  <XCircle size={48} className="icon-danger" />
                  <h3>Tolak konfirmasi pembayaran?</h3>
                  <p>Anggota: <strong>{selectedAnggota.nama_lengkap}</strong></p>
                  {selectedAnggota.tanggal_konfirmasi_bayar && (
                    <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                      Dikonfirmasi: {new Date(selectedAnggota.tanggal_konfirmasi_bayar).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
                <div className="info-box warning">
                  <AlertCircle size={20} />
                  <div>
                    <p><strong>Perhatian:</strong></p>
                    <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      Konfirmasi pembayaran akan dibatalkan. Anggota harus melakukan konfirmasi ulang setelah benar-benar melakukan pembayaran.
                    </p>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="rejectionReason">Alasan Penolakan <span className="required">*</span></label>
                  <textarea
                    id="rejectionReason"
                    rows={4}
                    placeholder="Contoh: Pembayaran belum masuk ke rekening koperasi"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className={!rejectionReason.trim() ? 'error' : ''}
                  />
                  <small>Jelaskan mengapa konfirmasi pembayaran ditolak.</small>
                </div>
              </>
            )}

            {verifyAction === 'activate' && (
              <>
                <div className="verify-info">
                  <UserCheck size={48} className="icon-primary" />
                  <h3>Aktifkan anggota ini?</h3>
                  <p>Anggota: <strong>{selectedAnggota.nama_lengkap}</strong></p>
                  <p>NIK: {selectedAnggota.nik}</p>
                </div>

                {selectedAnggota.tanggal_konfirmasi_bayar && (
                  <div className="info-box">
                    <AlertCircle size={20} />
                    <div>
                      <p><strong>Konfirmasi Pembayaran:</strong></p>
                      <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        Anggota sudah konfirmasi pembayaran pada {new Date(selectedAnggota.tanggal_konfirmasi_bayar).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                <div className="info-box warning">
                  <AlertCircle size={20} />
                  <div>
                    <p><strong>Pastikan pembayaran sudah diterima!</strong></p>
                    <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      Cek rekening bank koperasi untuk memastikan transfer Rp 100.000 sudah masuk sebelum mengaktifkan anggota.
                    </p>
                  </div>
                </div>

                <div className="info-box success">
                  <CheckCircle size={20} />
                  <div>
                    <p><strong>Setelah diaktifkan:</strong></p>
                    <ul style={{ fontSize: '0.9rem', marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
                      <li>Nomor anggota koperasi akan dibuat otomatis</li>
                      <li>Iuran pokok ditandai sudah dibayar</li>
                      <li>Anggota dapat menggunakan semua layanan koperasi</li>
                    </ul>
                  </div>
                </div>
              </>
            )}

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowVerifyModal(false);
                  setShowDetailModal(true);
                }}
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                className={`btn ${
                  verifyAction === 'approve' ? 'btn-success' :
                  verifyAction === 'reject' || verifyAction === 'reject-payment' ? 'btn-danger' :
                  'btn-primary'
                }`}
                onClick={handleVerifySubmit}
                disabled={isSubmitting || ((verifyAction === 'reject' || verifyAction === 'reject-payment') && !rejectionReason.trim())}
              >
                {isSubmitting ? 'Memproses...' : 
                  verifyAction === 'approve' ? 'Ya, Setujui' :
                  verifyAction === 'reject' ? 'Ya, Tolak Pendaftaran' :
                  verifyAction === 'reject-payment' ? 'Ya, Tolak Konfirmasi' :
                  'Ya, Aktifkan'
                }
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedAnggota && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setShowDetailModal(true);
          }}
          title="Edit Data Anggota"
        >
          <div className="edit-modal">
            <div className="form-section">
              <h3>Foto Anggota</h3>
              <div className="info-box" style={{ marginBottom: '1.5rem' }}>
                <AlertCircle size={20} />
                <p>Foto akan otomatis dikompres jika ukuran lebih dari 500KB. Maksimal ukuran file: 2MB</p>
              </div>
              <div className="photo-upload-grid">
                <div className="photo-upload-item">
                  <label>Foto Diri</label>
                  {fotoDiriPreview && (
                    <div className="photo-preview">
                      <img src={fotoDiriPreview} alt="Preview Foto Diri" />
                    </div>
                  )}
                  <label className="upload-btn">
                    <Upload size={18} />
                    {editFotoDiri ? 'Ganti Foto' : 'Upload Foto Baru'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFotoDiriChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
                
                <div className="photo-upload-item">
                  <label>Foto KTP</label>
                  {fotoKTPPreview && (
                    <div className="photo-preview">
                      <img src={fotoKTPPreview} alt="Preview Foto KTP" />
                    </div>
                  )}
                  <label className="upload-btn">
                    <Upload size={18} />
                    {editFotoKTP ? 'Ganti Foto' : 'Upload Foto Baru'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFotoKTPChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Data Pribadi</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>NIK</label>
                  <input
                    type="text"
                    value={editFormData.nik || ''}
                    onChange={(e) => handleEditFormChange('nik', e.target.value)}
                    maxLength={16}
                  />
                </div>
                <div className="form-group">
                  <label>Nama Lengkap</label>
                  <input
                    type="text"
                    value={editFormData.nama_lengkap || ''}
                    onChange={(e) => handleEditFormChange('nama_lengkap', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Jenis Kelamin</label>
                  <select
                    value={editFormData.jenis_kelamin || ''}
                    onChange={(e) => handleEditFormChange('jenis_kelamin', e.target.value)}
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tempat Lahir</label>
                  <input
                    type="text"
                    value={editFormData.tempat_lahir || ''}
                    onChange={(e) => handleEditFormChange('tempat_lahir', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Tanggal Lahir</label>
                  <input
                    type="date"
                    value={editFormData.tanggal_lahir || ''}
                    onChange={(e) => handleEditFormChange('tanggal_lahir', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Jenis Warga</label>
                  <select
                    value={editFormData.jenis_warga || ''}
                    onChange={(e) => handleEditFormChange('jenis_warga', e.target.value)}
                  >
                    <option value="">Pilih Jenis Warga</option>
                    <option value="warga_desa">Warga Desa Purwajaya</option>
                    <option value="warga_luar">Warga Luar Desa Purwajaya</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Alamat</h3>
              {editFormData.jenis_warga === 'warga_desa' && (
                <div className="info-box" style={{ marginBottom: '1.5rem' }}>
                  <AlertCircle size={20} />
                  <p>Warga Desa Purwajaya - Field Dusun dan RT dinamis berdasarkan data master</p>
                </div>
              )}
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Alamat Lengkap</label>
                  <textarea
                    value={editFormData.alamat || ''}
                    onChange={(e) => handleEditFormChange('alamat', e.target.value)}
                    rows={3}
                  />
                </div>
                
                {editFormData.jenis_warga === 'warga_desa' ? (
                  <>
                    <div className="form-group">
                      <label>Dusun</label>
                      <select
                        value={editFormData.dusun || ''}
                        onChange={(e) => handleEditFormChange('dusun', e.target.value)}
                        disabled={isDusunLoading}
                      >
                        <option value="">Pilih Dusun</option>
                        {dusunData.map(d => (
                          <option key={d.id} value={d.nama}>{d.nama}</option>
                        ))}
                      </select>
                      {isDusunLoading && <small>Memuat data dusun...</small>}
                      {dusunLoadError && (
                        <small className="error-message">{dusunLoadError} 
                          <button 
                            type="button" 
                            className="btn-link" 
                            onClick={loadDusun}
                            style={{ marginLeft: '0.5rem', textDecoration: 'underline', cursor: 'pointer', border: 'none', background: 'none', color: '#dc2626' }}
                          >
                            Coba lagi
                          </button>
                        </small>
                      )}
                    </div>

                    <div className="form-group">
                      <label>RT</label>
                      <select
                        value={editFormData.rt || ''}
                        onChange={(e) => handleEditFormChange('rt', e.target.value)}
                        disabled={!editFormData.dusun || isDusunLoading}
                      >
                        <option value="">Pilih RT</option>
                        {filteredRtList.map(rt => (
                          <option key={rt.id} value={rt.nomor}>{rt.nomor}</option>
                        ))}
                      </select>
                      {isDusunLoading && <small>Memuat RT...</small>}
                      {!isDusunLoading && editFormData.dusun && filteredRtList.length === 0 && (
                        <small className="error-message">RT belum tersedia untuk dusun ini</small>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="form-group">
                    <label>RT</label>
                    <input
                      type="text"
                      value={editFormData.rt || ''}
                      onChange={(e) => handleEditFormChange('rt', e.target.value)}
                      placeholder="Contoh: 001"
                    />
                  </div>
                )}
                
                <div className="form-group">
                  <label>Desa/Kelurahan</label>
                  <input
                    type="text"
                    value={editFormData.desa || ''}
                    onChange={(e) => handleEditFormChange('desa', e.target.value)}
                    disabled={editFormData.jenis_warga === 'warga_desa'}
                    style={editFormData.jenis_warga === 'warga_desa' ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                  />
                  {editFormData.jenis_warga === 'warga_desa' && (
                    <small>Otomatis terisi untuk warga desa</small>
                  )}
                </div>
                <div className="form-group">
                  <label>Kecamatan</label>
                  <input
                    type="text"
                    value={editFormData.kecamatan || ''}
                    onChange={(e) => handleEditFormChange('kecamatan', e.target.value)}
                    disabled={editFormData.jenis_warga === 'warga_desa'}
                    style={editFormData.jenis_warga === 'warga_desa' ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                  />
                </div>
                <div className="form-group">
                  <label>Kabupaten</label>
                  <input
                    type="text"
                    value={editFormData.kabupaten || ''}
                    onChange={(e) => handleEditFormChange('kabupaten', e.target.value)}
                    disabled={editFormData.jenis_warga === 'warga_desa'}
                    style={editFormData.jenis_warga === 'warga_desa' ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                  />
                </div>
                <div className="form-group">
                  <label>Provinsi</label>
                  <input
                    type="text"
                    value={editFormData.provinsi || ''}
                    onChange={(e) => handleEditFormChange('provinsi', e.target.value)}
                    disabled={editFormData.jenis_warga === 'warga_desa'}
                    style={editFormData.jenis_warga === 'warga_desa' ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Informasi Bank</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nama Bank</label>
                  <input
                    type="text"
                    value={editFormData.nama_bank || ''}
                    onChange={(e) => handleEditFormChange('nama_bank', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Nomor Rekening</label>
                  <input
                    type="text"
                    value={editFormData.nomor_rekening || ''}
                    onChange={(e) => handleEditFormChange('nomor_rekening', e.target.value)}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Atas Nama</label>
                  <input
                    type="text"
                    value={editFormData.atas_nama || ''}
                    onChange={(e) => handleEditFormChange('atas_nama', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Kontak</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nomor WhatsApp</label>
                  <input
                    type="text"
                    value={editFormData.nomor_wa || ''}
                    onChange={(e) => handleEditFormChange('nomor_wa', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setShowDetailModal(true);
                }}
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                className="btn-primary"
                onClick={handleEditSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedAnggota && (
        <Modal
          isOpen={showResetPasswordModal}
          onClose={() => {
            setShowResetPasswordModal(false);
            setShowDetailModal(true);
          }}
          title="Reset Password"
        >
          <div className="reset-password-modal">
            <div className="info-box">
              <Key size={24} />
              <div>
                <p><strong>Reset password untuk:</strong></p>
                <p style={{ marginTop: '0.5rem' }}>
                  <strong>{selectedAnggota.nama_lengkap}</strong><br />
                  Username: {selectedAnggota.username}
                </p>
              </div>
            </div>

            <div className="form-section">
              <div className="form-group">
                <label>Password Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div className="form-group">
                <label>Konfirmasi Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setShowDetailModal(true);
                }}
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                className="btn-primary"
                onClick={handleResetPasswordSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Mereset...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          <div className="toast-content">
            {toast.type === 'success' && <CheckCircle size={20} />}
            {toast.type === 'error' && <XCircle size={20} />}
            {toast.type === 'warning' && <AlertCircle size={20} />}
            {toast.type === 'info' && <AlertCircle size={20} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default KelolaAnggota;
