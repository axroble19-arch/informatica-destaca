const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const canManage = requireRole('ADMIN', 'CONTENT_MANAGER');

const eventSchema = z.object({
  title: z.string().min(2, 'El título es obligatorio'),
  description: z.string().optional().nullable(),
  date: z.string().datetime('Fecha inválida'),
  time: z.string().optional().nullable(),
  place: z.string().optional().nullable(),
  modality: z.string().optional().nullable(),
  organizer: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  status: z.enum(['UPCOMING', 'COMPLETED', 'CANCELLED']).default('UPCOMING'),
});

router.get('/', async (req, res, next) => {
  try {
    const { status, from, to, category } = req.query;
    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }
    const events = await prisma.event.findMany({ where, orderBy: { date: 'asc' } });
    return res.json(events);
  } catch (err) { return next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ error: 'Evento no encontrado.' });
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        participations: {
          where: { status: 'APPROVED' },
          include: { student: true },
        },
        media: true,
      },
    });
    if (!event) return res.status(404).json({ error: 'Evento no encontrado.' });
    return res.json(event);
  } catch (err) { return next(err); }
});

router.post('/', verifyToken, canManage, async (req, res, next) => {
  try {
    const data = eventSchema.parse(req.body);
    const event = await prisma.event.create({ data: { ...data, date: new Date(data.date) } });
    return res.status(201).json(event);
  } catch (err) { return next(err); }
});

router.put('/:id', verifyToken, canManage, async (req, res, next) => {
  try {
    const data = eventSchema.partial().parse(req.body);
    if (data.date) data.date = new Date(data.date);
    const event = await prisma.event.update({ where: { id: Number(req.params.id) }, data });
    return res.json(event);
  } catch (err) { return next(err); }
});

router.delete('/:id', verifyToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.event.delete({ where: { id: Number(req.params.id) } });
    return res.json({ ok: true });
  } catch (err) { return next(err); }
});

module.exports = router;
