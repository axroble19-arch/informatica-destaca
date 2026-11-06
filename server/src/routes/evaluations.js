const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas de evaluaciones requieren sesión (el token lleva el rol).
router.use(verifyToken);

const evaluationSchema = z.object({
  participationId: z.number().int().positive('La participación es obligatoria'),
  score: z.number().min(0, 'La calificación mínima es 0').max(10, 'La calificación máxima es 10'),
  observations: z.string().max(2000, 'Las observaciones no deben superar 2000 caracteres').optional().nullable(),
});

// Proyectos que el evaluador debe evaluar: participaciones CONTESTANT
// APROBADAS en eventos categoría Certamen, con la evaluación propia (si ya
// la registró) y el promedio de todos los evaluadores. Solo EVALUATOR.
router.get('/assignments', requireRole('EVALUATOR'), async (req, res, next) => {
  try {
    const parts = await prisma.participation.findMany({
      where: { type: 'CONTESTANT', status: 'APPROVED', event: { category: 'Certamen' } },
      include: {
        student: { select: { id: true, publicName: true, photoUrl: true, semester: true, generation: true } },
        event: { select: { id: true, title: true, date: true, place: true } },
        evaluations: {
          where: { evaluatorId: req.user.id },
          select: { id: true, score: true, observations: true, updatedAt: true },
        },
      },
      orderBy: [{ event: { date: 'desc' } }, { student: { publicName: 'asc' } }],
    });
    const grouped = await prisma.evaluation.groupBy({
      by: ['participationId'],
      _avg: { score: true },
      _count: { score: true },
    });
    const avgByPart = new Map(grouped.map((g) => [g.participationId, { avg: g._avg.score, count: g._count.score }]));
    return res.json(parts.map((p) => ({
      id: p.id,
      type: p.type,
      description: p.description,
      result: p.result,
      evidenceUrl: p.evidenceUrl,
      date: p.date,
      student: p.student,
      event: p.event,
      myEvaluation: p.evaluations[0] || null,
      average: avgByPart.get(p.id) || { avg: null, count: 0 },
    })));
  } catch (err) { return next(err); }
});

// Lista de evaluaciones realizadas: el evaluador ve solo las suyas; el
// admin ve todas (con evaluador, estudiante y evento). Acceso restringido.
router.get('/', requireRole('EVALUATOR', 'ADMIN'), async (req, res, next) => {
  try {
    const where = req.user.role === 'EVALUATOR' ? { evaluatorId: req.user.id } : {};
    const evals = await prisma.evaluation.findMany({
      where,
      include: {
        evaluator: { select: { id: true, name: true, email: true } },
        participation: {
          include: {
            student: { select: { id: true, publicName: true } },
            event: { select: { id: true, title: true, date: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return res.json(evals);
  } catch (err) { return next(err); }
});

// Registrar o actualizar la evaluación de un proyecto (un evaluador, una
// calificación por participación). Solo se evalúan proyectos concursantes
// de certámenes.
router.post('/', requireRole('EVALUATOR'), async (req, res, next) => {
  try {
    const data = evaluationSchema.parse(req.body);
    const part = await prisma.participation.findUnique({
      where: { id: data.participationId },
      include: { event: { select: { category: true } } },
    });
    if (!part) return res.status(404).json({ error: 'Participación no encontrada.' });
    if (part.type !== 'CONTESTANT' || part.event?.category !== 'Certamen') {
      return res.status(400).json({ error: 'Solo se evalúan proyectos concursantes de certámenes.' });
    }
    const evaluation = await prisma.evaluation.upsert({
      where: { evaluatorId_participationId: { evaluatorId: req.user.id, participationId: data.participationId } },
      update: { score: data.score, observations: data.observations || null },
      create: {
        evaluatorId: req.user.id,
        participationId: data.participationId,
        score: data.score,
        observations: data.observations || null,
      },
      include: {
        participation: {
          include: {
            student: { select: { publicName: true } },
            event: { select: { title: true } },
          },
        },
      },
    });
    return res.status(201).json(evaluation);
  } catch (err) { return next(err); }
});

module.exports = router;
