import {
  createAppointment,
  listAppointments,
  listMyAppointments,
  updateAppointmentStatus
} from '../services/appointment.service.js';

export async function getAppointments(req, res) {
  res.json(await listAppointments(req.query));
}

export async function getMyAppointments(req, res) {
  res.json(await listMyAppointments(req.user._id));
}

export async function createAppointmentRequest(req, res) {
  const appointment = await createAppointment(req.body || {}, req.user._id);
  res.status(201).json({ message: 'Appointment request submitted', appointment });
}

export async function reviewAppointment(req, res) {
  const status = req.body?.status || 'approved';
  const appointment = await updateAppointmentStatus(req.params.id, status, req.user._id);
  res.json({ message: `Appointment ${status}`, appointment });
}
