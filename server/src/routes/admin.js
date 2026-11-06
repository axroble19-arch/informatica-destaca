const express = require('express');
const prisma = require('../prisma');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Antes todo el router era solo ADMIN (router.use con requireRole('ADMIN')).
// Ahora cada ruta declara su propio rol:
// - Lectura de pendientes y de multimedia: ADMIN y CONTENT_MANAGER, para
//   que el responsable de contenido pueda seguir sus propias propuestas.
// - Aprobar/rechazar, usuarios: SOLO ADMIN (no se tocan sus permisos).
const isAdmin = requireRole('ADMIN');
const canManage = requireRole('ADMIN', 'CONTENT_MANAGER');

router.get('/pending', verifyToken, canManage, async (req, res, next) => {
  try {
    const [achievements, participations] = await Promise.all([
      prisma.achievement.findMany({ where: { status: 'PENDING' }, include: { student: true }, orderBy: { createdAt: 'desc' } }),
      prisma.participation.findMany({ where: { status: 'PENDING' }, include: { student: true, event: true }, orderBy: { createdAt: 'desc' } }),
    ]);
    return res.json({ achievements, participations });
  } catch (err) { return next(err); }
});

router.post('/achievements/:id/approve', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const item = await prisma.achievement.update({ where: { id: Number(req.params.id) }, data: { status: 'APPROVED' } });
    return res.json(item);
  } catch (err) { return next(err); }
});

router.post('/achievements/:id/reject', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const item = await prisma.achievement.update({ where: { id: Number(req.params.id) }, data: { status: 'REJECTED' } });
    return res.json(item);
  } catch (err) { return next(err); }
});

router.post('/participations/:id/approve', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const item = await prisma.participation.update({ where: { id: Number(req.params.id) }, data: { status: 'APPROVED' } });
    return res.json(item);
  } catch (err) { return next(err); }
});

router.post('/participations/:id/reject', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const item = await prisma.participation.update({ where: { id: Number(req.params.id) }, data: { status: 'REJECTED' } });
    return res.json(item);
  } catch (err) { return next(err); }
});

router.get('/users', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(users);
  } catch (err) { return next(err); }
});

// Catálogo completo de multimedia para la pestaña del Admin (el GET
// público /api/media solo devuelve lo que tiene consentToPublish).
router.get('/media', verifyToken, canManage, async (req, res, next) => {
  try {
    const items = await prisma.media.findMany({
      include: { event: true, student: true, achievement: true },
      orderBy: { date: 'desc' },
    });
    return res.json(items);
  } catch (err) { return next(err); }
});

module.exports = router;
