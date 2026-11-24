import express from 'express';
import pgPromise from 'pg-promise';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

dotenv.config();

const app = express();
const db = pgPromise()(process.env.DATABASE_URL);
const PORT = process.env.PORT || 8080;
const BASE_URL = `http://localhost:${PORT}`;

app.use(express.json());

const spec = YAML.parse(
  readFileSync('./openapi.yaml', 'utf8')
);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));

function validUrl(value) {
  if (typeof value !== 'string') return false;

  try {
    const url = new URL(value);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

function validCode(value) {
  return typeof value === 'string' &&
    /^[A-Za-z0-9]{4,32}$/.test(value);
}

function formatLink(row) {
  return {
    code: row.code,
    originalUrl: row.original_url,
    shortUrl: `${BASE_URL}/r/${row.code}`,
    clicks: row.clicks,
    createdAt: row.created_at
  };
}

function error(res, status, message) {
  return res.status(status).json({ error: message });
}

function validBody(body, allowAlias = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return false;
  }

  const allowed = allowAlias
    ? ['originalUrl', 'alias']
    : ['originalUrl'];

  if (Object.keys(body).some(key => !allowed.includes(key))) {
    return false;
  }

  if (!validUrl(body.originalUrl)) return false;

  if (Object.hasOwn(body, 'alias') && !validCode(body.alias)) {
    return false;
  }

  return true;
}

//Перевірка зв'язку з базою даних
app.get('/health', async (req, res) => {
  try {
    await db.one('SELECT 1 AS result');
    res.json({
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

// Створення коротшого посилання
app.post('/api/links', async (req, res) => {
  if (!validBody(req.body, true)) {
    return error(res, 400, 'Invalid URL or alias');
  }

  const { originalUrl, alias } = req.body;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = alias || randomBytes(5).toString('hex');

    try {
      const row = await db.one(
        `INSERT INTO links (code, original_url)
         VALUES ($1, $2)
         RETURNING *`,
        [code, originalUrl]
      );

      res.location(`/api/links/${code}`);
      return res.status(201).json(formatLink(row));
    } catch (err) {
      if (err.code === '23505') {
        if (alias) {
          return error(res, 409, 'Alias already exists');
        }
        continue;
      }
      throw err;
    }
  }

  throw new Error('Could not generate unique code');
});

// Список всіх посилань
app.get('/api/links', async (req, res) => {
  const rows = await db.any(
    'SELECT * FROM links ORDER BY id DESC'
  );

  res.json(rows.map(formatLink));
});

// Вивід одного посилання
app.get('/api/links/:code', async (req, res) => {
  const row = await db.oneOrNone(
    'SELECT * FROM links WHERE code = $1',
    [req.params.code]
  );

  if (!row) return error(res, 404, 'Link not found');

  res.json(formatLink(row));
});

//Оновлення оригінального посилання
app.patch('/api/links/:code', async (req, res) => {
  if (!validBody(req.body)) {
    return error(res, 400, 'Invalid URL');
  }

  const row = await db.oneOrNone(
    `UPDATE links
     SET original_url = $1
     WHERE code = $2
     RETURNING *`,
    [req.body.originalUrl, req.params.code]
  );

  if (!row) return error(res, 404, 'Link not found');

  res.json(formatLink(row));
});

//Видалення посилання
app.delete('/api/links/:code', async (req, res) => {
  const result = await db.result(
    'DELETE FROM links WHERE code = $1',
    [req.params.code]
  );

  if (result.rowCount === 0) {
    return error(res, 404, 'Link not found');
  }

  res.status(204).send();
});
