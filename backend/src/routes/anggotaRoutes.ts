import { Router } from 'express';
import {
  registerAnggota,
  loginAnggota,
  getAnggotaProfile,
  getAllAnggota,
  updateStatusAnggota,
  resubmitAnggota,
  getAnggotaHistory,
  konfirmasiBayarIuranPokok,
  tolakKonfirmasiBayar,
  updateAnggotaByAdmin,
  resetPasswordByAdmin
} from '../controllers/anggotaController';

const router = Router();

// Public routes
router.post('/register', registerAnggota);
router.post('/login', loginAnggota);

// Protected routes (anggota yang sudah login)
router.get('/profile/:id', getAnggotaProfile);
router.get('/:id/history', getAnggotaHistory);
router.put('/:id/resubmit', resubmitAnggota);
router.put('/:id/konfirmasi-bayar', konfirmasiBayarIuranPokok);

// Admin routes
router.get('/', getAllAnggota);
router.put('/:id/status', updateStatusAnggota);
router.put('/:id/tolak-konfirmasi-bayar', tolakKonfirmasiBayar);
router.put('/:id/admin-update', updateAnggotaByAdmin);
router.put('/:id/reset-password', resetPasswordByAdmin);

export default router;
