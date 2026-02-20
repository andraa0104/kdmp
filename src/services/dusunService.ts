export interface RTItem {
  id: number;
  nomor: string;
}

export interface DusunItem {
  id: number;
  nama: string;
  rtList: RTItem[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Request failed');
  }
  return response.json() as Promise<T>;
};

export const dusunService = {
  async getDusunWithRT(): Promise<DusunItem[]> {
    const response = await fetch(`${API_BASE_URL}/dusun-with-rt`);
    return handleResponse<DusunItem[]>(response);
  },

  async createDusun(payload: { nama: string; rtList: Array<{ nomor: string }> }): Promise<DusunItem> {
    const response = await fetch(`${API_BASE_URL}/dusun`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<DusunItem>(response);
  },

  async updateDusun(id: number, payload: { nama: string; rtList: Array<{ nomor: string }> }): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/dusun/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await handleResponse<{ message: string }>(response);
  },

  async deleteDusun(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/dusun/${id}`, {
      method: 'DELETE'
    });
    await handleResponse<{ message: string }>(response);
  }
};
