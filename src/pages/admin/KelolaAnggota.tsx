import { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, UserCheck, UserX, CheckCircle, XCircle, Eye, Calendar,
  AlertCircle, Users, Edit2, Key, Upload, ChevronDown, ChevronUp,
  Download
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { anggotaService, type AnggotaListItem, type AnggotaProfile } from '../../services/anggotaService';
import { dusunService, type DusunItem } from '../../services/dusunService';
import { statsService, type AnggotaSummary, type GrowthDataPoint } from '../../services/statsService';
import Modal from '../../components/Modal';
import './KelolaAnggota.css';

type StatusFilter = 'All' | 'Pending' | 'Ditolak' | 'Diterima' | 'Aktif' | 'Non Aktif';
type ToastType = 'success' | 'error' | 'warning' | 'info';
type GrowthPeriod = 'week' | 'month' | 'quarter' | 'semester' | 'year';

const KelolaAnggota = () => {
  // Statistics states
  const [summary, setSummary] = useState<AnggotaSummary | null>(null);
  const [growthData, setGrowthData] = useState<GrowthDataPoint[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<GrowthPeriod>('month');
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Member list states
  const [anggotaList, setAnggotaList] = useState<AnggotaListItem[]>([]);
  const [filteredList, setFilteredList] = useState<AnggotaListItem[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Advanced filter states
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterJenisWarga, setFilterJenisWarga] = useState<string[]>([]);
  const [filterDusun, setFilterDusun] = useState('');
  const [filterRT, setFilterRT] = useState('');
  const [filterNomorAnggota, setFilterNomorAnggota] = useState('');

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
  const [verifyAction, setVerifyAction] = useState<'approve' | 'reject' | 'activate' | 'reject-payment' | 'deactivate' | 'reactivate'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [deactivateReason, setDeactivateReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit form states
  const [editFormData, setEditFormData] = useState<Record<string, string>>({});
  const [editFotoDiri, setEditFotoDiri] = useState<File | null>(null);
  const [editFotoKTP, setEditFotoKTP] = useState<File | null>(null);
  const [fotoDiriPreview, setFotoDiriPreview] = useState<string | null>(null);
  const [fotoKTPPreview, setFotoKTPPreview] = useState<string | null>(null);

  // Dusun & RT states
  const [dusunData, setDusunData] = useState<DusunItem[]>([]);

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
  const filterSelectedDusun = dusunData.find(d => d.id.toString() === filterDusun);
  const filterRTList = filterSelectedDusun?.rtList ?? [];

  // Load statistics
  const loadStatistics = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const [summaryData, growthResult] = await Promise.all([
        statsService.getAnggotaSummary(),
        statsService.getAnggotaGrowth(selectedPeriod)
      ]);
      setSummary(summaryData);
      setGrowthData(growthResult);
    } catch (err) {
      console.error('Error loading statistics:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, [selectedPeriod]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load dusun data
  const loadDusun = async () => {
    try {
      const data = await dusunService.getDusunWithRT();
      setDusunData(data);
    } catch (err) {
      console.error('Failed to load dusun:', err);
    }
  };

  // Load anggota with filters
  const loadAnggota = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const filters: {
        status?: string;
        search?: string;
        jenis_warga?: string[];
        dusun?: string;
        rt?: string;
        nomor_anggota?: string;
      } = {};

      if (selectedStatus !== 'All') {
        filters.status = selectedStatus;
      }
      if (debouncedSearchQuery.trim()) {
        filters.search = debouncedSearchQuery.trim();
      }
      if (filterJenisWarga.length > 0) {
        filters.jenis_warga = filterJenisWarga;
      }
      if (filterDusun) {
        filters.dusun = filterDusun;
      }
      if (filterRT) {
        filters.rt = filterRT;
      }
      if (filterNomorAnggota.trim()) {
        filters.nomor_anggota = filterNomorAnggota.trim();
      }

      const data = await anggotaService.getAll(filters);
      setAnggotaList(data);
      setFilteredList(data);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, debouncedSearchQuery, filterJenisWarga, filterDusun, filterRT, filterNomorAnggota]);

  // Load detail anggota
  const loadAnggotaDetail = async (id: number) => {
    try {
      const data = await anggotaService.getProfile(id);
      setSelectedAnggota(data);
    } catch (err) {
      const error = err as Error;
      showToast(error.message, 'error');
    }
  };

  useEffect(() => {
    loadStatistics();
    loadAnggota();
    loadDusun();
  }, [loadStatistics, loadAnggota]);

  useEffect(() => {
    loadStatistics();
  }, [selectedPeriod, loadStatistics]);

  const handleViewDetail = (anggota: AnggotaListItem) => {
    loadAnggotaDetail(anggota.id);
    setShowDetailModal(true);
  };

  const handleVerifyClick = (anggota: AnggotaProfile, action: 'approve' | 'reject' | 'activate' | 'reject-payment' | 'deactivate' | 'reactivate') => {
    setSelectedAnggota(anggota);
    setVerifyAction(action);
    setRejectionReason('');
    setDeactivateReason('');
    setShowDetailModal(false);
    setShowVerifyModal(true);
  };

  const handleVerifySubmit = async () => {
    if (!selectedAnggota) return;

    if ((verifyAction === 'reject' || verifyAction === 'reject-payment') && !rejectionReason.trim()) {
      showToast('Alasan penolakan wajib diisi', 'warning');
      return;
    }

    if (verifyAction === 'deactivate' && !deactivateReason.trim()) {
      showToast('Alasan nonaktif wajib diisi', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (verifyAction === 'reject-payment') {
        await anggotaService.tolakKonfirmasiBayar(selectedAnggota.id, rejectionReason);
        showToast('Konfirmasi pembayaran ditolak', 'success');
      } else {
        let newStatus = '';
        if (verifyAction === 'approve') newStatus = 'Diterima';
        if (verifyAction === 'reject') newStatus = 'Ditolak';
        if (verifyAction === 'activate') newStatus = 'Aktif';
        if (verifyAction === 'deactivate') newStatus = 'Non Aktif';
        if (verifyAction === 'reactivate') newStatus = 'Aktif';

        const userId = 1; // Get from auth context
        const reason = verifyAction === 'reject' ? rejectionReason : verifyAction === 'deactivate' ? deactivateReason : undefined;
        await anggotaService.updateStatus(selectedAnggota.id, newStatus, reason, userId);

        const actionText = 
          verifyAction === 'approve' ? 'disetujui' : 
          verifyAction === 'reject' ? 'ditolak' : 
          verifyAction === 'activate' ? 'diaktivasi' :
          verifyAction === 'deactivate' ? 'dinonaktifkan' :
          'diaktifkan kembali';
        showToast(`Anggota berhasil ${actionText}`, 'success');
      }

      setShowVerifyModal(false);
      setSelectedAnggota(null);
      loadAnggota();
      loadStatistics();
    } catch (err) {
      const error = err as Error;
      showToast(error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // @ts-expect-error - Keeping for future use
  const handleKonfirmasiBayar = async (anggota: AnggotaProfile) => {
    setIsSubmitting(true);
    try {
      await anggotaService.konfirmasiBayar(anggota.id);
      showToast('Pembayaran berhasil dikonfirmasi', 'success');
      setShowDetailModal(false);
      loadAnggota();
      loadStatistics();
    } catch (err) {
      const error = err as Error;
      showToast(error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (anggota: AnggotaProfile) => {
    setSelectedAnggota(anggota);
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

    if (field === 'dusun') {
      setEditFormData((prev: Record<string, string>) => ({
        ...prev,
        dusun: value,
        rt: ''
      }));
      return;
    }

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

  const handleJenisWargaFilter = (jenisWarga: string) => {
    setFilterJenisWarga(prev => {
      if (prev.includes(jenisWarga)) {
        return prev.filter(j => j !== jenisWarga);
      } else {
        return [...prev, jenisWarga];
      }
    });
  };

  const handleResetFilters = () => {
    setFilterJenisWarga([]);
    setFilterDusun('');
    setFilterRT('');
    setFilterNomorAnggota('');
    setSearchQuery('');
  };

  const handleApplyFilters = () => {
    loadAnggota();
  };

  return (
    <div className="kelola-anggota-page kelola-modern">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notification toast-${toast.type}`}>
          <AlertCircle size={20} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Statistics Dashboard */}
      <div className="dashboard-section">
        <div className="page-header-modern">
          <div>
            <h1>Kelola Anggota</h1>
            <p className="subtitle">Dashboard dan manajemen anggota koperasi</p>
          </div>
          <button className="btn-export">
            <Download size={18} />
            Export Excel
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card-modern stat-primary">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Anggota</p>
              <h2 className="stat-value">{isLoadingStats ? '...' : summary?.total || 0}</h2>
            </div>
          </div>

          <div className="stat-card-modern stat-success">
            <div className="stat-icon">
              <UserCheck size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Anggota Aktif</p>
              <h2 className="stat-value">{isLoadingStats ? '...' : summary?.aktif || 0}</h2>
              <span className="stat-badge badge-success">
                {summary && summary.total > 0 ? Math.round((summary.aktif / summary.total) * 100) : 0}%
              </span>
            </div>
          </div>

          <div className="stat-card-modern stat-warning">
            <div className="stat-icon">
              <UserX size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Non Aktif</p>
              <h2 className="stat-value">{isLoadingStats ? '...' : summary?.nonAktif || 0}</h2>
              <span className="stat-badge badge-warning">
                {summary && summary.total > 0 ? Math.round((summary.nonAktif / summary.total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Growth Chart */}
        <div className="growth-chart-section">
          <div className="chart-header">
            <div>
              <h3>Pertumbuhan Anggota</h3>
              <p>Grafik registrasi anggota baru</p>
            </div>
            <div className="period-selector">
              <button
                className={selectedPeriod === 'week' ? 'active' : ''}
                onClick={() => setSelectedPeriod('week')}
              >
                Minggu
              </button>
              <button
                className={selectedPeriod === 'month' ? 'active' : ''}
                onClick={() => setSelectedPeriod('month')}
              >
                Bulan
              </button>
              <button
                className={selectedPeriod === 'quarter' ? 'active' : ''}
                onClick={() => setSelectedPeriod('quarter')}
              >
                Triwulan
              </button>
              <button
                className={selectedPeriod === 'semester' ? 'active' : ''}
                onClick={() => setSelectedPeriod('semester')}
              >
                Semester
              </button>
              <button
                className={selectedPeriod === 'year' ? 'active' : ''}
                onClick={() => setSelectedPeriod('year')}
              >
                Tahun
              </button>
            </div>
          </div>

          <div className="chart-container">
            {isLoadingStats ? (
              <div className="chart-loading">Memuat data...</div>
            ) : growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="period"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">Tidak ada data pertumbuhan</div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <div className="filter-panel-section">
        <button
          className="filter-toggle"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          <Filter size={18} />
          Filter Lanjutan
          {showAdvancedFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showAdvancedFilters && (
          <div className="advanced-filters">
            <div className="filter-row">
              <div className="filter-group">
                <label>Jenis Warga</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filterJenisWarga.includes('warga_desa')}
                      onChange={() => handleJenisWargaFilter('warga_desa')}
                    />
                    <span>Warga Desa Purwajaya</span>
                    <span className="count">({summary?.breakdown.warga_desa || 0})</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filterJenisWarga.includes('warga_luar')}
                      onChange={() => handleJenisWargaFilter('warga_luar')}
                    />
                    <span>Warga Luar</span>
                    <span className="count">({summary?.breakdown.warga_luar || 0})</span>
                  </label>
                </div>
              </div>

              {filterJenisWarga.includes('warga_desa') && (
                <>
                  <div className="filter-group">
                    <label>Dusun</label>
                    <select
                      value={filterDusun}
                      onChange={(e) => {
                        setFilterDusun(e.target.value);
                        setFilterRT('');
                      }}
                      className="filter-select"
                    >
                      <option value="">Semua Dusun</option>
                      {dusunData.map((dusun) => (
                        <option key={dusun.id} value={dusun.id}>
                          {dusun.nama}
                        </option>
                      ))}
                    </select>
                  </div>

                  {filterDusun && (
                    <div className="filter-group">
                      <label>RT</label>
                      <select
                        value={filterRT}
                        onChange={(e) => setFilterRT(e.target.value)}
                        className="filter-select"
                      >
                        <option value="">Semua RT</option>
                        {filterRTList.map((rt) => (
                          <option key={rt.id} value={rt.id}>
                            RT {rt.nomor}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              <div className="filter-group">
                <label>Cari Nomor Anggota</label>
                <input
                  type="text"
                  placeholder="Ketik nomor anggota..."
                  value={filterNomorAnggota}
                  onChange={(e) => setFilterNomorAnggota(e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>

            <div className="filter-actions">
              <button className="btn-reset" onClick={handleResetFilters}>
                Reset Filter
              </button>
              <button className="btn-apply" onClick={handleApplyFilters}>
                Terapkan Filter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Tabs */}
      <div className="status-tabs-modern">
        {statusTabs.map(status => (
          <button
            key={status}
            className={`tab-modern ${selectedStatus === status ? 'active' : ''}`}
            onClick={() => setSelectedStatus(status)}
          >
            {status}
            <span className="tab-badge">{getStatusCount(status)}</span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-box-modern">
          <Search size={20} />
          <input
            type="text"
            placeholder="Cari nama atau nomor anggota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner-modern">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={loadAnggota}>Coba Lagi</button>
        </div>
      )}

      {/* Members Table */}
      <div className="members-table-section">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Memuat data anggota...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>Tidak ada data anggota</h3>
            <p>Belum ada anggota yang terdaftar atau tidak ditemukan dengan filter yang dipilih.</p>
          </div>
        ) : (
          <div className="table-modern-container">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>No. Anggota</th>
                  <th>Nama Lengkap</th>
                  <th>Jenis Warga</th>
                  <th>Dusun/RT</th>
                  <th>Status</th>
                  <th>Tgl. Daftar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((anggota) => {
                  const StatusIcon = statusIcons[anggota.status as keyof typeof statusIcons];
                  return (
                    <tr key={anggota.id} className="table-row-modern">
                      <td className="nomor-anggota">
                        {anggota.nomor_anggota_koperasi || '-'}
                      </td>
                      <td className="nama-cell">
                        <div className="nama-wrapper">
                          <strong>{anggota.nama_lengkap}</strong>
                          <small className="jk-text">{anggota.jenis_kelamin === 'laki-laki' ? 'Laki-laki' : 'Perempuan'}</small>
                        </div>
                      </td>
                      <td>
                        <span className={`jenis-warga-badge ${anggota.jenis_warga}`}>
                          {anggota.jenis_warga === 'warga_desa' ? 'Warga Desa' : 'Warga Luar'}
                        </span>
                      </td>
                      <td>
                        {anggota.jenis_warga === 'warga_desa' && anggota.dusun_nama && anggota.rt_nomor
                          ? `${anggota.dusun_nama} / RT ${anggota.rt_nomor}`
                          : '-'}
                      </td>
                      <td>
                        <span className={`status-badge ${statusColors[anggota.status as keyof typeof statusColors]}`}>
                          <StatusIcon size={14} />
                          {anggota.status}
                        </span>
                      </td>
                      <td>{formatDate(anggota.tanggal_daftar)}</td>
                      <td>
                        <button
                          className="btn-action btn-view"
                          onClick={() => handleViewDetail(anggota)}
                          title="Lihat Detail"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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

            {selectedAnggota.foto_diri && (
              <div className="photo-section">
                <h3>Foto Diri</h3>
                <div className="photo-container">
                  <img src={selectedAnggota.foto_diri} alt={`Foto ${selectedAnggota.nama_lengkap}`} className="member-photo" />
                </div>
              </div>
            )}

            {selectedAnggota.foto_ktp && (
              <div className="photo-section">
                <h3>Foto KTP</h3>
                <div className="photo-container">
                  <img src={selectedAnggota.foto_ktp} alt={`KTP ${selectedAnggota.nama_lengkap}`} className="member-photo" />
                </div>
              </div>
            )}

            {selectedAnggota.status === 'Ditolak' && selectedAnggota.alasan_ditolak && (
              <div className="rejection-box">
                <XCircle size={20} />
                <div>
                  <strong>Alasan Penolakan:</strong>
                  <p>{selectedAnggota.alasan_ditolak}</p>
                </div>
              </div>
            )}

            {selectedAnggota.nomor_anggota_koperasi && (
              <div className="member-number-box">
                <strong>Nomor Anggota Koperasi</strong>
                <span className="big-number">{selectedAnggota.nomor_anggota_koperasi}</span>
              </div>
            )}

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

            <div className="detail-section">
              <h3>Data Pribadi</h3>
              <div className="detail-grid detail-grid-3col">
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

            <div className="detail-section">
              <h3>Alamat</h3>
              <div className="detail-grid detail-grid-3col">
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

            <div className="detail-section">
              <h3>Informasi Bank</h3>
              <div className="detail-grid detail-grid-3col">
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

            <div className="modal-actions">
              <div className="admin-action-buttons">
                <button className="btn-edit" onClick={() => handleEditClick(selectedAnggota)}>
                  <Edit2 size={18} />
                  Edit Data
                </button>
                <button className="btn-reset-password" onClick={() => handleResetPasswordClick(selectedAnggota)}>
                  <Key size={18} />
                  Reset Password
                </button>
                {selectedAnggota.status === 'Aktif' && (
                  <button className="btn-danger" onClick={() => handleVerifyClick(selectedAnggota, 'deactivate')}>
                    <UserX size={20} />
                    Nonaktifkan Anggota
                  </button>
                )}
              </div>

              {selectedAnggota.status === 'Pending' && (
                <>
                  <button className="btn-success" onClick={() => handleVerifyClick(selectedAnggota, 'approve')}>
                    <CheckCircle size={20} />
                    Setujui Pendaftaran
                  </button>
                  <button className="btn-danger" onClick={() => handleVerifyClick(selectedAnggota, 'reject')}>
                    <XCircle size={20} />
                    Tolak Pendaftaran
                  </button>
                </>
              )}
              
              {selectedAnggota.status === 'Diterima' && !selectedAnggota.iuran_pokok_dibayar && selectedAnggota.konfirmasi_bayar_iuran_pokok && (
                <div className="konfirmasi-bayar-section">
                  <button className="btn-danger-outline" onClick={() => handleVerifyClick(selectedAnggota, 'reject-payment')}>
                    <XCircle size={20} />
                    Tolak Konfirmasi
                  </button>
                  <button className="btn-success" onClick={() => handleVerifyClick(selectedAnggota, 'activate')}>
                    <CheckCircle size={20} />
                    Verifikasi & Aktifkan
                  </button>
                </div>
              )}

              {selectedAnggota.status === 'Non Aktif' && (
                <button className="btn-success" onClick={() => handleVerifyClick(selectedAnggota, 'reactivate')}>
                  <UserCheck size={20} />
                  Aktifkan Kembali
                </button>
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
            verifyAction === 'activate' ? 'Aktifkan Anggota' :
            verifyAction === 'deactivate' ? 'Nonaktifkan Anggota' :
            'Aktifkan Kembali Anggota'
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
                </div>
                <div className="form-group">
                  <label htmlFor="rejectionReason">Alasan Penolakan <span className="required">*</span></label>
                  <textarea
                    id="rejectionReason"
                    rows={4}
                    placeholder="Jelaskan alasan penolakan..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              </>
            )}

            {verifyAction === 'reject-payment' && (
              <>
                <div className="verify-info">
                  <XCircle size={48} className="icon-danger" />
                  <h3>Tolak konfirmasi pembayaran?</h3>
                  <p>Anggota: <strong>{selectedAnggota.nama_lengkap}</strong></p>
                </div>
                <div className="form-group">
                  <label htmlFor="rejectionReason">Alasan Penolakan <span className="required">*</span></label>
                  <textarea
                    id="rejectionReason"
                    rows={4}
                    placeholder="Pembayaran belum masuk ke rekening koperasi"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              </>
            )}

            {verifyAction === 'activate' && (
              <>
                <div className="verify-info">
                  <UserCheck size={48} className="icon-primary" />
                  <h3>Aktifkan anggota ini?</h3>
                  <p>Anggota: <strong>{selectedAnggota.nama_lengkap}</strong></p>
                </div>
                <div className="info-box success">
                  <CheckCircle size={20} />
                  <p>Nomor anggota koperasi akan dibuat otomatis dan anggota dapat menggunakan semua layanan.</p>
                </div>
              </>
            )}

            {verifyAction === 'deactivate' && (
              <>
                <div className="verify-info">
                  <UserX size={48} className="icon-danger" />
                  <h3>Nonaktifkan anggota ini?</h3>
                  <p>Anggota: <strong>{selectedAnggota.nama_lengkap}</strong></p>
                  <p>Nomor Anggota: {selectedAnggota.nomor_anggota_koperasi}</p>
                </div>
                <div className="info-box warning">
                  <AlertCircle size={20} />
                  <p>Anggota yang dinonaktifkan tidak dapat menggunakan layanan koperasi. Anda dapat mengaktifkan kembali kapan saja.</p>
                </div>
                <div className="form-group">
                  <label>Alasan Nonaktif <span className="required">*</span></label>
                  <textarea
                    value={deactivateReason}
                    onChange={(e) => setDeactivateReason(e.target.value)}
                    placeholder="Contoh: Tidak membayar simpanan wajib, Mengundurkan diri, dll."
                    rows={4}
                  />
                </div>
              </>
            )}

            {verifyAction === 'reactivate' && (
              <>
                <div className="verify-info">
                  <UserCheck size={48} className="icon-success" />
                  <h3>Aktifkan kembali anggota ini?</h3>
                  <p>Anggota: <strong>{selectedAnggota.nama_lengkap}</strong></p>
                  <p>Nomor Anggota: {selectedAnggota.nomor_anggota_koperasi}</p>
                </div>
                <div className="info-box success">
                  <CheckCircle size={20} />
                  <p>Anggota akan dapat menggunakan kembali semua layanan koperasi dengan nomor anggota yang sama.</p>
                </div>
              </>
            )}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => { setShowVerifyModal(false); setShowDetailModal(true); }} disabled={isSubmitting}>
                Batal
              </button>
              <button
                className={`btn ${
                  verifyAction === 'approve' ? 'btn-success' : 
                  verifyAction === 'reject' || verifyAction === 'reject-payment' || verifyAction === 'deactivate' ? 'btn-danger' : 
                  'btn-primary'
                }`}
                onClick={handleVerifySubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Memproses...' : 
                  verifyAction === 'approve' ? 'Ya, Setujui' : 
                  verifyAction === 'reject' ? 'Ya, Tolak' : 
                  verifyAction === 'reject-payment' ? 'Ya, Tolak Konfirmasi' : 
                  verifyAction === 'activate' ? 'Ya, Aktifkan' :
                  verifyAction === 'deactivate' ? 'Ya, Nonaktifkan' :
                  'Ya, Aktifkan Kembali'
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
              <div className="photo-upload-grid">
                <div className="photo-upload-item">
                  <label>Foto Diri</label>
                  {fotoDiriPreview && <div className="photo-preview"><img src={fotoDiriPreview} alt="Preview" /></div>}
                  <label className="upload-btn">
                    <Upload size={18} />
                    {editFotoDiri ? 'Ganti Foto' : 'Upload Foto Baru'}
                    <input type="file" accept="image/*" onChange={handleFotoDiriChange} style={{ display: 'none' }} />
                  </label>
                </div>
                <div className="photo-upload-item">
                  <label>Foto KTP</label>
                  {fotoKTPPreview && <div className="photo-preview"><img src={fotoKTPPreview} alt="Preview" /></div>}
                  <label className="upload-btn">
                    <Upload size={18} />
                    {editFotoKTP ? 'Ganti Foto' : 'Upload Foto Baru'}
                    <input type="file" accept="image/*" onChange={handleFotoKTPChange} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Data Pribadi</h3>
              <div className="form-grid detail-grid-3col">
                <div className="form-group">
                  <label>NIK</label>
                  <input type="text" value={editFormData.nik || ''} onChange={(e) => handleEditFormChange('nik', e.target.value)} maxLength={16} />
                </div>
                <div className="form-group">
                  <label>Nama Lengkap</label>
                  <input type="text" value={editFormData.nama_lengkap || ''} onChange={(e) => handleEditFormChange('nama_lengkap', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Jenis Kelamin</label>
                  <select value={editFormData.jenis_kelamin || ''} onChange={(e) => handleEditFormChange('jenis_kelamin', e.target.value)}>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tempat Lahir</label>
                  <input type="text" value={editFormData.tempat_lahir || ''} onChange={(e) => handleEditFormChange('tempat_lahir', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Tanggal Lahir</label>
                  <input type="date" value={editFormData.tanggal_lahir || ''} onChange={(e) => handleEditFormChange('tanggal_lahir', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Jenis Warga</label>
                  <select value={editFormData.jenis_warga || ''} onChange={(e) => handleEditFormChange('jenis_warga', e.target.value)}>
                    <option value="">Pilih Jenis Warga</option>
                    <option value="warga_desa">Warga Desa Purwajaya</option>
                    <option value="warga_luar">Warga Luar Desa Purwajaya</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Alamat</h3>
              <div className="form-grid detail-grid-3col">
                <div className="form-group full-width">
                  <label>Alamat Lengkap</label>
                  <textarea value={editFormData.alamat || ''} onChange={(e) => handleEditFormChange('alamat', e.target.value)} rows={3} />
                </div>
                
                {editFormData.jenis_warga === 'warga_desa' ? (
                  <>
                    <div className="form-group">
                      <label>Dusun</label>
                      <select value={editFormData.dusun || ''} onChange={(e) => handleEditFormChange('dusun', e.target.value)}>
                        <option value="">Pilih Dusun</option>
                        {dusunData.map(d => (
                          <option key={d.id} value={d.nama}>{d.nama}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>RT</label>
                      <select value={editFormData.rt || ''} onChange={(e) => handleEditFormChange('rt', e.target.value)} disabled={!editFormData.dusun}>
                        <option value="">Pilih RT</option>
                        {filteredRtList.map(rt => (
                          <option key={rt.id} value={rt.nomor}>{rt.nomor}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="form-group">
                    <label>RT</label>
                    <input type="text" value={editFormData.rt || ''} onChange={(e) => handleEditFormChange('rt', e.target.value)} />
                  </div>
                )}
                
                <div className="form-group">
                  <label>Desa/Kelurahan</label>
                  <input type="text" value={editFormData.desa || ''} onChange={(e) => handleEditFormChange('desa', e.target.value)} disabled={editFormData.jenis_warga === 'warga_desa'} />
                </div>
                <div className="form-group">
                  <label>Kecamatan</label>
                  <input type="text" value={editFormData.kecamatan || ''} onChange={(e) => handleEditFormChange('kecamatan', e.target.value)} disabled={editFormData.jenis_warga === 'warga_desa'} />
                </div>
                <div className="form-group">
                  <label>Kabupaten</label>
                  <input type="text" value={editFormData.kabupaten || ''} onChange={(e) => handleEditFormChange('kabupaten', e.target.value)} disabled={editFormData.jenis_warga === 'warga_desa'} />
                </div>
                <div className="form-group">
                  <label>Provinsi</label>
                  <input type="text" value={editFormData.provinsi || ''} onChange={(e) => handleEditFormChange('provinsi', e.target.value)} disabled={editFormData.jenis_warga === 'warga_desa'} />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Informasi Bank</h3>
              <div className="form-grid detail-grid-3col">
                <div className="form-group">
                  <label>Nama Bank</label>
                  <input type="text" value={editFormData.nama_bank || ''} onChange={(e) => handleEditFormChange('nama_bank', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Nomor Rekening</label>
                  <input type="text" value={editFormData.nomor_rekening || ''} onChange={(e) => handleEditFormChange('nomor_rekening', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Atas Nama</label>
                  <input type="text" value={editFormData.atas_nama || ''} onChange={(e) => handleEditFormChange('atas_nama', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Kontak</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nomor WhatsApp</label>
                  <input type="text" value={editFormData.nomor_wa || ''} onChange={(e) => handleEditFormChange('nomor_wa', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => { setShowEditModal(false); setShowDetailModal(true); }} disabled={isSubmitting}>
                Batal
              </button>
              <button className="btn-primary" onClick={handleEditSubmit} disabled={isSubmitting}>
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
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimal 6 karakter" />
              </div>
              <div className="form-group">
                <label>Konfirmasi Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi password baru" />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => {setShowResetPasswordModal(false); setShowDetailModal(true);}} disabled={isSubmitting}>
                Batal
              </button>
              <button className="btn-primary" onClick={handleResetPasswordSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Mereset...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default KelolaAnggota;
