import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dusunRoutes from './routes/dusunRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Koperasi Merah Putih API' });
});

app.use('/api', dusunRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
