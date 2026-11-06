const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { z } = require('zod');
const prisma = require('../prisma');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^(image|video)\//.test(file.mimetype)) return cb(null, true);
    return cb(new Error('Solo se permiten imágenes o videos.'));
  },
});

const mediaSchema = z.object({
  title: z.string().min(2, 'El título es obligatorio'),
  description: z.string().optional().nullable(),
  date: z.string().datetime().optional(),
  type: z.enum(['IMAGE', 'VIDEO', 'LINK']).default('IMAGE'),
  url: z.string().min(1, 'La URL o archivo es obligatorio'),
  eventId: z.number().int().optional().nullable(),
  studentId: z.number().int().optional().nullable(),
  achievementId: z.number().int().optional().nullable(),
  consentToPublish: z.boolean().default(false),
});

router.get('/', async (req, res, next) => {
  try {
    const { eventId, studentId, type } = req.query;
    const where = { consentToPublish: true };
    if (eventId) where.eventId = Number(eventId);
    if (studentId) where.studentId = Number(studentId);
    if (type) where.type = type;
    const items = await prisma.media.findMany({ where, orderBy: { date: 'desc' } });
    return res.json(items);
  } catch (err) { return next(err); }
});

// Subida de archivo: devuelve la URL pública en /uploads/...
router.post('/upload', verifyToken, requireRole('ADMIN', 'CONTENT_MANAGER'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });
  return res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

router.post('/', verifyToken, requireRole('ADMIN', 'CONTENT_MANAGER'), async (req, res, next) => {
  try {
    const data = mediaSchema.parse(req.body);
    const item = await prisma.media.create({
      data: { ...data, date: data.date ? new Date(data.date) : new Date() },
    });
    return res.status(201).json(item);
  } catch (err) { return next(err); }
});

router.delete('/:id', verifyToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.media.delete({ where: { id: Number(req.params.id) } });
    return res.json({ ok: true });
  } catch (err) { return next(err); }
});

module.exports = router;
