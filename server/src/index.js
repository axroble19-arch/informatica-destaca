require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { ZodError } = require('zod');

const authRoutes = require('./routes/auth');
const studentsRoutes = require('./routes/students');
const eventsRoutes = require('./routes/events');
const achievementsRoutes = require('./routes/achievements');
const participationsRoutes = require('./routes/participations');
const mediaRoutes = require('./routes/media');
const searchRoutes = require('./routes/search');
const adminRoutes = require('./routes/admin');
const evaluationsRoutes = require('./routes/evaluations');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'informatica-destaca', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/participations', participationsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/evaluations', evaluationsRoutes);

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

// Manejo central de errores: validación (Zod), Prisma y errores generales.
app.use((err, req, res, next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Datos inválidos.', details: err.errors });
  }
  if (err.code === 'P2002') {
    return res.status(400).json({ error: 'Ya existe un registro con esos datos (duplicado).' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Registro no encontrado.' });
  }
  console.error(err);
  return res.status(500).json({ error: err.message || 'Error interno del servidor.' });
});

app.listen(PORT, () => {
  console.log(`Servidor de Informática Destaca en http://localhost:${PORT}`);
});
