const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());

// "База данных" в памяти (лучше потом подключить PostgreSQL)
const licenses = new Map();

// Генерация ключа
app.post('/generate', (req, res) => {
  const { hwid } = req.body;
  if (!hwid) return res.status(400).json({ error: 'HWID не указан' });

  const key = crypto.randomBytes(12).toString('hex'); // Случайный ключ
  licenses.set(key, { hwid, activated: true }); // Сохраняем

  res.json({ key });
});

// Проверка ключа
app.post('/check', (req, res) => {
  const { key, hwid } = req.body;
  if (!licenses.has(key)) return res.json({ valid: false });

  const license = licenses.get(key);
  res.json({ valid: license.hwid === hwid && license.activated });
});

// Список всех ключей
app.get('/licenses', (req, res) => {
  const allLicenses = Array.from(licenses.entries()).map(([key, data]) => ({
    key,
    hwid: data.hwid,
    activated: data.activated
  }));
  res.json(allLicenses);
});

// Блокировка ключа
app.post('/ban', (req, res) => {
  const { key } = req.body;
  if (!licenses.has(key)) return res.json({ success: false });

  licenses.delete(key);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
