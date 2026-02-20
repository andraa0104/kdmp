import { Router } from 'express';
import {
  getAllDusun,
  getDusunById,
  getDusunWithRT,
  createDusun,
  updateDusun,
  deleteDusun,
  getRTByDusun,
  createRT,
  updateRT,
  deleteRT
} from '../controllers/dusunController';

const router = Router();

router.get('/dusun', getAllDusun);
router.get('/dusun/:id', getDusunById);
router.get('/dusun-with-rt', getDusunWithRT);
router.post('/dusun', createDusun);
router.put('/dusun/:id', updateDusun);
router.delete('/dusun/:id', deleteDusun);
router.get('/dusun/:dusunId/rt', getRTByDusun);
router.post('/rt', createRT);
router.put('/rt/:id', updateRT);
router.delete('/rt/:id', deleteRT);

export default router;
