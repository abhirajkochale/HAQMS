const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/reports/doctor-stats
// Highly inefficient nested loop aggregate reporting for admin/receptionists dashboard
// PERFORMANCE BUG: Performs multiple nested DB queries inside a loop for every doctor.
// Runs sequentially, blocking/scaling terrible with doctors count.
router.get('/doctor-stats', authenticate, async (req, res) => {
  try {
    const start = Date.now();

    // 1. Fetch doctors with their related counts and completed appointments for revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const doctorsWithRelations = await prisma.doctor.findMany({
      include: {
        appointments: {
          select: { status: true }
        },
        queueTokens: {
          where: { createdAt: { gte: today } },
          select: { id: true }
        }
      }
    });

    const reportData = doctorsWithRelations.map(doc => {
      const totalAppointments = doc.appointments.length;
      let completedAppointments = 0;
      let cancelledAppointments = 0;

      doc.appointments.forEach(apt => {
        if (apt.status === 'COMPLETED') completedAppointments++;
        if (apt.status === 'CANCELLED') cancelledAppointments++;
      });

      const queueTokensCount = doc.queueTokens.length;
      const revenue = completedAppointments * doc.consultationFee;

      return {
        id: doc.id,
        name: doc.name,
        specialization: doc.specialization,
        department: doc.department,
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        todayQueueSize: queueTokensCount,
        revenue,
      };
    });

    const durationMs = Date.now() - start;

    res.json({
      success: true,
      timeTakenMs: durationMs,
      data: reportData,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report', details: error.message });
  }
});

module.exports = router;
