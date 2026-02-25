import axios, { AxiosError } from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/anggota';

export interface AnggotaRegisterData {
  nik: string;
  namaLengkap: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisWarga: string;
  alamat: string;
  dusun?: string;
  rt: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  nomorRekening: string;
  namaBank: string;
  namaBankLainnya?: string;
  atasNama: string;
  nomorWA: string;
  username: string;
  password: string;
  fotoDiri?: File | null;
  fotoKtp?: File | null;
}

export interface AnggotaLoginData {
  username: string;
  password: string;
}

export interface AnggotaProfile {
  id: number;
  nomor_anggota_koperasi?: string;
  no_registrasi: string;
  nik: string;
  nama_lengkap: string;
  jenis_kelamin: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_warga: string;
  alamat: string;
  rt: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  dusun_nama?: string;
  rt_nomor?: string;
  nomor_rekening: string;
  nama_bank: string;
  nama_bank_lainnya?: string;
  atas_nama: string;
  nomor_wa: string;
  username: string;
  foto_diri?: string;  foto_ktp?: string;  status: 'Pending' | 'Ditolak' | 'Diterima' | 'Non Aktif' | 'Aktif';
  tanggal_daftar: string;
  tanggal_verifikasi?: string;
  alasan_ditolak?: string;
  iuran_pokok_dibayar: boolean;
  tanggal_bayar_iuran_pokok?: string;
  konfirmasi_bayar_iuran_pokok: boolean;
  tanggal_konfirmasi_bayar?: string;
}

export interface AnggotaListItem {
  id: number;
  no_registrasi: string;
  nomor_anggota_koperasi?: string;
  nik: string;
  nama_lengkap: string;
  jenis_kelamin: string;
  jenis_warga: string;
  status: string;
  tanggal_daftar: string;
  tanggal_verifikasi?: string;
  dusun_id?: number;
  dusun_nama?: string;
  rt_id?: number;
  rt_nomor?: string;
  verified_by_username?: string;
  foto_diri?: string;
  foto_ktp?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  alamat?: string;
  rt?: string;
  desa?: string;
  kecamatan?: string;
  kabupaten?: string;
  provinsi?: string;
  nomor_rekening?: string;
  nama_bank?: string;
  atas_nama?: string;
  nomor_wa?: string;
  alasan_ditolak?: string;
  iuran_pokok_dibayar?: boolean;
  konfirmasi_bayar_iuran_pokok?: boolean;
  tanggal_konfirmasi_bayar?: string;
}

export interface VerifikasiHistory {
  id: number;
  anggota_id: number;
  status_sebelum: string | null;
  status_sesudah: string;
  aksi: string;
  catatan: string | null;
  verified_by: number | null;
  verified_by_username?: string;
  created_at: string;
}

// Helper function to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Convert form data ke format API
const convertFormDataToAPI = async (formData: AnggotaRegisterData) => {
  let foto_diri = null;
  let foto_ktp = null;
  
  // Check if data is already in snake_case format (from admin edit)
  const isSnakeCase = 'nama_lengkap' in formData;
  
  // Convert foto to base64 if exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (formData.fotoDiri || (formData as any).foto_diri) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fotoFile = formData.fotoDiri || (formData as any).foto_diri;
      if (fotoFile && typeof fotoFile !== 'string') {
        foto_diri = await fileToBase64(fotoFile);
      }
    } catch (error) {
      console.error('Error converting foto diri to base64:', error);
    }
  }

  // Convert foto KTP to base64 if exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (formData.fotoKtp || (formData as any).foto_ktp) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fotoFile = formData.fotoKtp || (formData as any).foto_ktp;
      if (fotoFile && typeof fotoFile !== 'string') {
        foto_ktp = await fileToBase64(fotoFile);
      }
    } catch (error) {
      console.error('Error converting foto KTP to base64:', error);
    }
  }

  // If already in snake_case (admin edit), just add photos and return
  if (isSnakeCase) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = formData as any;
    return {
      nik: data.nik?.replace(/\s/g, '') || data.nik,
      nama_lengkap: data.nama_lengkap,
      jenis_kelamin: data.jenis_kelamin,
      tempat_lahir: data.tempat_lahir,
      tanggal_lahir: data.tanggal_lahir,
      jenis_warga: data.jenis_warga,
      alamat: data.alamat,
      dusun: data.dusun,
      rt: data.rt,
      desa: data.desa,
      kecamatan: data.kecamatan,
      kabupaten: data.kabupaten,
      provinsi: data.provinsi,
      nomor_rekening: data.nomor_rekening,
      nama_bank: data.nama_bank,
      nama_bank_lainnya: data.nama_bank_lainnya,
      atas_nama: data.atas_nama,
      nomor_wa: data.nomor_wa,
      foto_diri,
      foto_ktp
    };
  }

  // Convert from camelCase (register form) to snake_case
  return {
    nik: formData.nik.replace(/\s/g, ''), // Remove spaces from NIK
    nama_lengkap: formData.namaLengkap,
    jenis_kelamin: formData.jenisKelamin,
    tempat_lahir: formData.tempatLahir,
    tanggal_lahir: formData.tanggalLahir,
    jenis_warga: formData.jenisWarga,
    alamat: formData.alamat,
    dusun: formData.dusun,
    rt: formData.rt,
    desa: formData.desa,
    kecamatan: formData.kecamatan,
    kabupaten: formData.kabupaten,
    provinsi: formData.provinsi,
    nomor_rekening: formData.nomorRekening,
    nama_bank: formData.namaBank,
    nama_bank_lainnya: formData.namaBankLainnya,
    atas_nama: formData.atasNama,
    nomor_wa: formData.nomorWA,
    username: formData.username,
    password: formData.password,
    foto_diri,
    foto_ktp
  };
};

export const anggotaService = {
  /**
   * Register anggota baru
   */
  register: async (formData: AnggotaRegisterData) => {
    try {
      const apiData = await convertFormDataToAPI(formData);
      const response = await axios.post(`${API_BASE_URL}/register`, apiData);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Pendaftaran gagal');
    }
  },

  /**
   * Login anggota
   */
  login: async (loginData: AnggotaLoginData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, loginData);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Login gagal');
    }
  },

  /**
   * Get profile anggota by ID
   */
  getProfile: async (id: number): Promise<AnggotaProfile> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/profile/${id}`);
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Gagal memuat profil');
    }
  },

  /**
   * Get all anggota (untuk admin)
   */
  getAll: async (filters?: { 
    status?: string; 
    search?: string;
    jenis_warga?: string[];
    dusun?: string;
    rt?: string;
    nomor_anggota?: string;
  }): Promise<AnggotaListItem[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.jenis_warga && filters.jenis_warga.length > 0) {
        params.append('jenis_warga', filters.jenis_warga.join(','));
      }
      if (filters?.dusun) params.append('dusun', filters.dusun);
      if (filters?.rt) params.append('rt', filters.rt);
      if (filters?.nomor_anggota) params.append('nomor_anggota', filters.nomor_anggota);

      const response = await axios.get(`${API_BASE_URL}?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Gagal memuat data anggota');
    }
  },

  /**
   * Update status anggota (untuk admin)
   */
  updateStatus: async (
    id: number,
    status: string,
    alasanDitolak?: string,
    verifiedBy?: number
  ) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/${id}/status`, {
        status,
        alasan_ditolak: alasanDitolak,
        verified_by: verifiedBy
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Gagal update status');
    }
  },

  /**
   * Update profile anggota & resubmit application
   */
  updateProfileAndResubmit: async (id: number, formData: AnggotaRegisterData) => {
    try {
      const apiData = await convertFormDataToAPI(formData);
      const response = await axios.put(`${API_BASE_URL}/${id}/resubmit`, apiData);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Gagal mengajukan ulang pendaftaran');
    }
  },

  /**
   * Get history verifikasi anggota
   */
  getHistory: async (id: number): Promise<VerifikasiHistory[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/${id}/history`);
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Gagal memuat riwayat');
    }
  },

  /**
   * Konfirmasi bayar iuran pokok
   */
  konfirmasiBayar: async (id: number) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/${id}/konfirmasi-bayar`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Gagal konfirmasi pembayaran');
    }
  },

  /**
   * Tolak konfirmasi bayar iuran pokok
   */
  tolakKonfirmasiBayar: async (id: number, alasanPenolakan: string) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/${id}/tolak-konfirmasi-bayar`, {
        alasanPenolakan
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Gagal menolak konfirmasi pembayaran');
    }
  },

  /**
   * Update data anggota oleh admin
   */
  updateByAdmin: async (id: number, formData: Partial<AnggotaRegisterData>) => {
    try {
      const apiData = await convertFormDataToAPI(formData as AnggotaRegisterData);
      const response = await axios.put(`${API_BASE_URL}/${id}/admin-update`, apiData);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Gagal memperbarui data anggota');
    }
  },

  /**
   * Reset password anggota oleh admin
   */
  resetPassword: async (id: number, newPassword: string) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/${id}/reset-password`, {
        newPassword
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Gagal reset password');
    }
  }
};