import type { StatsData } from '../types/stats';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
  }
};
