import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dusunRoutes from './routes/dusunRoutes';
import anggotaRoutes from './routes/anggotaRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
// Increase payload limit for file uploads (base64 encoded images)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'Koperasi Merah Putih API' });
});

app.use('/api', dusunRoutes);
app.use('/api/anggota', anggotaRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
