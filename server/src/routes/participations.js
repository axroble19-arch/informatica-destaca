const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

const participationSchema = z.object({
  studentId: z.number().int(),
  eventId: z.number().int(),
  date: z.string().datetime().optional(),
  type: z.enum(['ATTENDEE', 'SPEAKER', 'CONTESTANT', 'ORGANIZER', 'COLLABORATOR', 'OTHER']).default('ATTENDEE'),
  description: z.string().optional().nullable(),
  result: z.string().optional().nullable(),
  evidenceUrl: z.string().optional().nullable(),
});

// Público: solo participaciones aprobadas.
router.get('/', async (req, res, next) => {
  try {
    const { studentId, eventId } = req.query;
    const where = { status: 'APPROVED' };
    if (studentId) where.studentId = Number(studentId);
    if (eventId) where.eventId = Number(eventId);
    const items = await prisma.participation.findMany({
      where,
      include: { student: true, event: true },
      orderBy: { date: 'desc' },
    });
    return res.json(items);
  } catch (err) { return next(err); }
});

router.post('/', verifyToken, requireRole('ADMIN', 'CONTENT_MANAGER'), async (req, res, next) => {
  try {
    const data = participationSchema.parse(req.body);
    const item = await prisma.participation.create({
      data: { ...data, date: data.date ? new Date(data.date) : new Date(), status: 'PENDING' },
    });
    return res.status(201).json(item);
  } catch (err) { return next(err); }
});

router.put('/:id', verifyToken, requireRole('ADMIN', 'CONTENT_MANAGER'), async (req, res, next) => {
  try {
    const data = participationSchema.partial().parse(req.body);
    if (data.date) data.date = new Date(data.date);
    const item = await prisma.participation.update({ where: { id: Number(req.params.id) }, data });
    return res.json(item);
  } catch (err) { return next(err); }
});

router.delete('/:id', verifyToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.participation.delete({ where: { id: Number(req.params.id) } });
    return res.json({ ok: true });
  } catch (err) { return next(err); }
});

module.exports = router;
