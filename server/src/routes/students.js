const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const canManage = requireRole('ADMIN', 'CONTENT_MANAGER');

const studentSchema = z.object({
  publicName: z.string().min(2, 'El nombre es obligatorio'),
  photoUrl: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  semester: z.number().int().min(1).max(12).optional().nullable(),
  generation: z.string().optional().nullable(),
  academicStatus: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  interests: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  consentToPublish: z.boolean().default(false),
  userId: z.number().int().optional().nullable(),
});

const profileInclude = {
  participations: {
    where: { status: 'APPROVED' },
    include: { event: true },
    orderBy: { date: 'desc' },
  },
  achievements: {
    where: { status: 'APPROVED' },
    orderBy: { date: 'desc' },
  },
  projects: { orderBy: { createdAt: 'desc' } },
  certifications: { orderBy: { date: 'desc' } },
  media: { where: { consentToPublish: true }, orderBy: { date: 'desc' } },
};

// Público: solo estudiantes con consentimiento de publicación.
router.get('/', async (req, res, next) => {
  try {
    const students = await prisma.student.findMany({
      where: { consentToPublish: true },
      orderBy: { publicName: 'asc' },
      include: { achievements: { where: { status: 'APPROVED' }, select: { id: true } } },
    });
    return res.json(students);
  } catch (err) { return next(err); }
});

// Perfil completo + historial cronológico (para el CV digital).
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ error: 'Estudiante no encontrado.' });
    const student = await prisma.student.findUnique({ where: { id }, include: profileInclude });
    if (!student) return res.status(404).json({ error: 'Estudiante no encontrado.' });
    const history = [
      ...student.achievements.map((a) => ({ type: 'achievement', date: a.date, title: a.title, description: a.description, category: a.category })),
      ...student.participations.map((p) => ({ type: 'participation', date: p.date, title: p.event?.title || 'Evento', description: p.description, category: p.type })),
      ...student.certifications.map((c) => ({ type: 'certification', date: c.date, title: c.title, description: c.issuer, category: 'Certificación' })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    return res.json({ ...student, history });
  } catch (err) { return next(err); }
});

router.post('/', verifyToken, canManage, async (req, res, next) => {
  try {
    const data = studentSchema.parse(req.body);
    const student = await prisma.student.create({ data });
    return res.status(201).json(student);
  } catch (err) { return next(err); }
});

router.put('/:id', verifyToken, canManage, async (req, res, next) => {
  try {
    const data = studentSchema.partial().parse(req.body);
    const student = await prisma.student.update({ where: { id: Number(req.params.id) }, data });
    return res.json(student);
  } catch (err) { return next(err); }
});

router.delete('/:id', verifyToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.student.delete({ where: { id: Number(req.params.id) } });
    return res.json({ ok: true });
  } catch (err) { return next(err); }
});

module.exports = router;
