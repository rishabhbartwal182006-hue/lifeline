const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');

// Create a new appointment from kiosk
router.post('/', async (req, res) => {
  try {
    const {
      patientName, age, gender, phone, symptoms,
      department, requestedDate, requestedTime, arrivalTime, tokenNumber
    } = req.body;

    const newAppointment = new Appointment({
      patientName, age, gender, phone, symptoms,
      department, requestedDate, requestedTime, arrivalTime, tokenNumber,
      status: 'pending'
    });
    
    await newAppointment.save();
    res.status(201).json(newAppointment);
  } catch (err) {
    console.error('Error creating appointment:', err);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Doctor Dashboard: List all pending and recent appointments
router.get('/doctor', async (req, res) => {
  try {
    // Maybe show pending first, then others, limit to 50
    const appointments = await Appointment.find()
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(appointments);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Doctor updates status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!updated) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Error updating appointment:', err);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Patient gets live status
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json(appointment);
  } catch (err) {
    console.error('Error fetching appointment:', err);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

module.exports = router;
