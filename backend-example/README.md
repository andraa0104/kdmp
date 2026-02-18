# Setup Data Dinamis dari Database

## Cara Kerja

Data statistik (Anggota, Pertumbuhan, Aset) sekarang diambil secara dinamis dari API backend.

## Frontend (React)

1. **Service Layer** (`src/services/statsService.ts`)
   - Fetch data dari API endpoint
   - Fallback ke data default jika API gagal

2. **Component** (`src/App.tsx`)
   - Menggunakan `useState` dan `useEffect` untuk fetch data
   - Menampilkan loading state
   - Format currency otomatis

## Backend Setup

### Untuk Laravel:

1. Buat route di `routes/api.php`:
```php
Route::get('/stats', [StatsController::class, 'index']);
```

2. Buat controller:
```bash
php artisan make:controller StatsController
```

3. Implementasi query (lihat `backend-example/api-stats.php`)

### Response Format:
```json
{
  "totalAnggota": 450,
  "pertumbuhanPersen": 28,
  "totalAset": 2800000
}
```

## Environment Setup

1. Copy `.env.example` ke `.env`
2. Set `VITE_API_URL` ke URL backend Anda:
```
VITE_API_URL=http://localhost:8000/api
```

## Query Database

Data diambil dari tabel:
- `anggota` - Total anggota aktif
- `anggota` (created_at) - Perhitungan pertumbuhan
- `inventaris` - Total nilai aset
- `iuran_pokok`, `iuran_wajib`, `simpanan_sukarela` - Total simpanan

## Testing

Untuk testing tanpa backend, data fallback akan digunakan:
- Total Anggota: 450
- Pertumbuhan: 28%
- Total Aset: 2.8M
