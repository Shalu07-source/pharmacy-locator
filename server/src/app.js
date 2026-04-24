import 'dotenv/config';
import dotenv from "dotenv";
dotenv.config();
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import pharmacyRoutes from './routes/pharmacyRoutes.js';

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin not allowed'));
    }
  })
);
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);
app.use('/api/pharmacies', pharmacyRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

app.use((error, _req, res, _next) => {
  if (error.message === 'CORS origin not allowed') {
    return res.status(403).json({ message: error.message });
  }

  console.error('Unhandled server error', error);
  return res.status(500).json({ message: 'Unexpected server error' });
});

export default app;
