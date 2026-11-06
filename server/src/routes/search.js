const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

// GET /api/search?q=ana&type=all|students|events
// type=achievements filtra logros por categoría con ?category=
router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const type = req.query.type || 'all';
    const category = req.query.category;
    const status = req.query.status;
    const result = {};

    if (type === 'all' || type === 'students') {
      result.students = await prisma.student.findMany({
        where: {
          consentToPublish: true,
          ...(q ? { publicName: { contains: q, mode: 'insensitive' } } : {}),
        },
        orderBy: { publicName: 'asc' },
      });
    }
    if (type === 'all' || type === 'events') {
      result.events = await prisma.event.findMany({
        where: {
          ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
          ...(status ? { status } : {}),
        },
        orderBy: { date: 'asc' },
      });
    }
    if (type === 'all' || type === 'achievements') {
      result.achievements = await prisma.achievement.findMany({
        where: {
          status: 'APPROVED',
          ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
          ...(category ? { category } : {}),
        },
        include: { student: true },
        orderBy: { date: 'desc' },
      });
    }
    return res.json(result);
  } catch (err) { return next(err); }
});

module.exports = router;
