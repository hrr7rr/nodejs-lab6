import express from 'express';
import pgPromise from 'pg-promise';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const db = pgPromise()(process.env.DATABASE_URL);

app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await db.one('SELECT 1 AS result');
    res.status(200).json({
      status: 'ok',
      database: 'connected'
    });
  } catch {
    res.status(503).json({
      status: 'error',
      database: 'disconnected'
    });
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

