import type { StatsData } from '../types/stats';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface AnggotaSummary {
  total: number;
  aktif: number;
  nonAktif: number;
  breakdown: {
    warga_desa: number;
    warga_luar: number;
  };
}

export interface GrowthDataPoint {
  period: string;
  count: number;
}

export const statsService = {
  async getStats(): Promise<StatsData> {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fallback data jika API gagal
      return {
        totalAnggota: 450,
        pertumbuhanPersen: 28,
        totalAset: 2800000
      };
    }
  },

  async getAnggotaSummary(): Promise<AnggotaSummary> {
    try {
      const response = await fetch(`${API_BASE_URL}/stats/anggota/summary`);
      if (!response.ok) throw new Error('Failed to fetch anggota summary');
      return await response.json();
    } catch (error) {
      console.error('Error fetching anggota summary:', error);
      throw error;
    }
  },

  async getAnggotaGrowth(period: 'week' | 'month' | 'quarter' | 'semester' | 'year' = 'month'): Promise<GrowthDataPoint[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/stats/anggota/growth?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch anggota growth');
      return await response.json();
    } catch (error) {
      console.error('Error fetching anggota growth:', error);
      throw error;
    }
  }
};

