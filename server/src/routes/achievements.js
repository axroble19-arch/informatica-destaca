const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

const achievementSchema = z.object({
  studentId: z.number().int(),
  category: z.string().min(2, 'La categoría es obligatoria'),
  title: z.string().min(2, 'El título es obligatorio'),
  description: z.string().optional().nullable(),
  date: z.string().datetime('Fecha inválida'),
  relatedEvent: z.string().optional().nullable(),
  institution: z.string().optional().nullable(),
  evidenceUrl: z.string().optional().nullable(),
  evidenceType: z.enum(['IMAGE', 'VIDEO', 'LINK']).optional().nullable(),
});

// Público: solo logros aprobados (nada se publica sin aprobación).
router.get('/', async (req, res, next) => {
  try {
    const { category, studentId } = req.query;
    const where = { status: 'APPROVED' };
    if (category) where.category = category;
    if (studentId) where.studentId = Number(studentId);
    const items = await prisma.achievement.findMany({
      where,
      include: { student: true },
      orderBy: { date: 'desc' },
    });
    return res.json(items);
  } catch (err) { return next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ error: 'Logro no encontrado.' });
    const item = await prisma.achievement.findUnique({
      where: { id },
      include: { student: true },
    });
    if (!item) return res.status(404).json({ error: 'Logro no encontrado.' });
    return res.json(item);
  } catch (err) { return next(err); }
});

router.post('/', verifyToken, requireRole('ADMIN', 'CONTENT_MANAGER'), async (req, res, next) => {
  try {
    const data = achievementSchema.parse(req.body);
    const item = await prisma.achievement.create({
      data: { ...data, date: new Date(data.date), status: 'PENDING' },
    });
    return res.status(201).json(item);
  } catch (err) { return next(err); }
});

// Postulación pública al Cuadro de Honor (sin login): cualquier visitante
// puede postular un logro. Si el estudiante no existe, se crea en el padrón;
// la postulación en sí es la autorización para publicar en el cuadro.
// El logro nace en PENDING y solo aparece en público cuando un ADMIN lo
// aprueba desde la cola de Aprobación. Sin modelo nuevo.
const applySchema = z.object({
  publicName: z.string().min(2, 'El nombre es obligatorio'),
  semester: z.number().int().min(1).max(12).optional().nullable(),
  generation: z.string().optional().nullable(),
  category: z.string().min(2, 'La categoría es obligatoria'),
  title: z.string().min(2, 'El título es obligatorio'),
  description: z.string().optional().nullable(),
  evidenceUrl: z.string().optional().nullable(),
  relatedEvent: z.string().optional().nullable(),
});

router.post('/apply', async (req, res, next) => {
  try {
    const data = applySchema.parse(req.body);
    let student = await prisma.student.findFirst({
      where: { publicName: { equals: data.publicName.trim(), mode: 'insensitive' } },
    });
    if (!student) {
      student = await prisma.student.create({
        data: {
          publicName: data.publicName.trim(),
          semester: data.semester ?? null,
          generation: data.generation ?? null,
          consentToPublish: true,
        },
      });
    }
    const achievement = await prisma.achievement.create({
      data: {
        studentId: student.id,
        category: data.category,
        title: data.title,
        description: data.description ?? null,
        date: new Date(),
        relatedEvent: data.relatedEvent ?? null,
        institution: 'Licenciatura en Informática',
        evidenceUrl: data.evidenceUrl ?? null,
        evidenceType: data.evidenceUrl ? 'LINK' : null,
        status: 'PENDING',
      },
    });
    return res.status(201).json({ student, achievement });
  } catch (err) { return next(err); }
});

router.put('/:id', verifyToken, requireRole('ADMIN', 'CONTENT_MANAGER'), async (req, res, next) => {
  try {
    const data = achievementSchema.partial().parse(req.body);
    if (data.date) data.date = new Date(data.date);
    const item = await prisma.achievement.update({ where: { id: Number(req.params.id) }, data });
    return res.json(item);
  } catch (err) { return next(err); }
});

router.delete('/:id', verifyToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.achievement.delete({ where: { id: Number(req.params.id) } });
    return res.json({ ok: true });
  } catch (err) { return next(err); }
});

module.exports = router;
