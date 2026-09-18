import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Root health endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Medicine AI API is running',
    version: '1.0.0',
    documentation: '/api/status',
    dataset: '150 medicines from clinical emergency guide'
  });
});

app.listen(PORT, () => {
  console.log(`Medicine AI Backend running on http://localhost:${PORT}`);
});
