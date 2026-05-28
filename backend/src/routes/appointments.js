const express = require('express');
const { PrismaClient, Prisma } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/appointments
// List all appointments
router.get('/', authenticate, async (req, res) => {
  try {
    const { doctorId, status } = req.query;

    const where = {};
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;

    // Fetch core appointments with relations in a single query
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: { id: true, name: true, phoneNumber: true, age: true, medicalHistory: true },
        },
        doctor: {
          select: { id: true, name: true, specialization: true },
        },
      },
      orderBy: { appointmentDate: 'asc' },
    });

    const detailedAppointments = appointments;

    res.json({
      success: true,
      count: detailedAppointments.length,
      appointments: detailedAppointments,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/appointments
// Book an appointment
router.post('/', authenticate, authorize(['RECEPTIONIST', 'ADMIN']), async (req, res) => {
  try {
    const { patientId, doctorId, appointmentDate, reason } = req.body;

    if (!patientId || !doctorId || !appointmentDate) {
      return res.status(400).json({ error: 'Patient, Doctor, and Appointment Date are required.' });
    }

    const appDate = new Date(appointmentDate);

    const appointment = await prisma.$transaction(async (tx) => {
      const existingBooking = await tx.appointment.findFirst({
        where: {
          doctorId,
          appointmentDate: appDate,
          status: { not: 'CANCELLED' },
        },
      });

      if (existingBooking) {
        throw new Error('Double booking blocked. Doctor already has an appointment at this exact millisecond.');
      }

      return tx.appointment.create({
        data: {
          patientId,
          doctorId,
          appointmentDate: appDate,
          reason: reason || '',
          status: 'PENDING',
        },
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment,
    });
  } catch (error) {
    if (error.message && error.message.includes('Double booking blocked')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH /api/appointments/:id
// Update appointment status (COMPLETED, CANCELLED, etc.)
router.patch('/:id', authenticate, authorize(['RECEPTIONIST', 'ADMIN', 'DOCTOR']), async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
