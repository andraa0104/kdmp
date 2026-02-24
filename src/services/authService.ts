import axios, { AxiosError } from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      username: string;
      nama_lengkap: string;
      role?: string; // For admin/superadmin
      status?: string; // For anggota
      nomor_anggota_koperasi?: string;
      no_registrasi?: string;
    };
    userType: 'admin' | 'anggota';
  };
}

/**
 * Unified login service - handles both anggota and admin login
 */
export const authService = {
  /**
   * Try login as anggota first, then as admin if failed
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      // Try login as anggota first
      try {
        const anggotaResponse = await axios.post(`${API_BASE_URL}/anggota/login`, credentials);
        
        if (anggotaResponse.data.success) {
          return {
            success: true,
            message: anggotaResponse.data.message,
            data: {
              user: anggotaResponse.data.data,
              userType: 'anggota'
            }
          };
        }
      } catch (anggotaError) {
        // If anggota login fails, try admin login
        const axiosError = anggotaError as AxiosError<{ message: string }>;
        
        // Only try admin if it's not a network error
        if (axiosError.response) {
          try {
            const adminResponse = await axios.post(`${API_BASE_URL}/admin/login`, credentials);
            
            if (adminResponse.data.success) {
              return {
                success: true,
                message: adminResponse.data.message,
                data: {
                  user: adminResponse.data.data,
                  userType: 'admin'
                }
              };
            }
          } catch {
            // Both failed, throw generic error
            throw new Error('Username atau password salah');
          }
        }
        
        throw anggotaError;
      }
      
      throw new Error('Login gagal');
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Terjadi kesalahan saat login');
    }
  },

  /**
   * Save user session to localStorage
   */
  saveSession: (loginResponse: LoginResponse) => {
    localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
    localStorage.setItem('userType', loginResponse.data.userType);
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    const userType = localStorage.getItem('userType');
    
    if (userStr && userType) {
      return {
        user: JSON.parse(userStr),
        userType: userType as 'admin' | 'anggota'
      };
    }
    
    return null;
  },

  /**
   * Check if user is logged in
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('user');
  },

  /**
   * Logout - clear session
   */
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
  }
};
