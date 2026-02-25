import express from 'express';
import { getAnggotaSummary, getAnggotaGrowth } from '../controllers/statsController';

const router = express.Router();

// GET /api/stats/anggota/summary - Get summary statistics
router.get('/anggota/summary', getAnggotaSummary);

// GET /api/stats/anggota/growth?period=week|month|quarter|semester|year
router.get('/anggota/growth', getAnggotaGrowth);

export default router;
