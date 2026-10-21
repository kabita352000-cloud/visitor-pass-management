import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import Visitor from '../models/Visitor.js';
import AppError from '../utils/AppError.js';
import { sendEmail, sendSms } from '../utils/notify.js';
import { getLimit } from '../utils/query.js';

export async function listAppointments(query = {}) {
  const filter = {};
  if (typeof query.status === 'string' && ['pending', 'approved', 'rejected'].includes(query.status)) {
    filter.status = query.status;
  }
  return {
    appointments: await Appointment.find(filter)
      .sort({ scheduledAt: 1 })
      .limit(getLimit(query.limit))
  };
}

export async function listMyAppointments(visitorId) {
  return {
    appointments: await Appointment.find({
      $or: [{ requestedBy: visitorId }, { visitorAccount: visitorId }]
    })
      .sort({ scheduledAt: -1 })
      .limit(100)
  };
}

export async function createAppointment(input = {}, requestedBy) {
  const { visitorName, visitorEmail = '', visitorPhone, company = '', purpose, host, scheduledAt } = input;
  if (![visitorName, visitorEmail, visitorPhone, purpose, host, scheduledAt].every(value => typeof value === 'string' && value.trim())) {
    throw new AppError('Please fill all required appointment fields');
  }
  if (!Number.isFinite(Date.parse(scheduledAt))) {
    throw new AppError('Enter a valid appointment date and time');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitorEmail.trim())) {
    throw new AppError('Enter a valid visitor email address');
  }
  const requester = await User.findById(requestedBy);
  if (requester?.role === 'visitor' && requester.email !== visitorEmail.trim().toLowerCase()) {
    throw new AppError('Visitor accounts can only request appointments for their own email address', 403);
  }
  const appointmentTime = new Date(scheduledAt);
  if (appointmentTime <= new Date()) {
    throw new AppError('Appointment date and time must be in the future');
  }

  const appointment = await Appointment.create({
    visitorName: visitorName.trim(),
    visitorEmail: visitorEmail.trim().toLowerCase(),
    visitorPhone: visitorPhone.trim(),
    company: typeof company === 'string' ? company.trim() : '',
    purpose: purpose.trim(),
    host: host.trim(),
    scheduledAt: appointmentTime,
    requestedBy
  });
  await sendEmail(
    appointment.visitorEmail,
    'Visitor appointment request received',
    `Your appointment request for ${appointment.scheduledAt.toLocaleString()} is pending approval.`
  );
  await sendSms(
    appointment.visitorPhone,
    `Your appointment request for ${appointment.scheduledAt.toLocaleString()} is pending approval.`
  );
  return appointment;
}

export async function updateAppointmentStatus(id, requestedStatus, approvedBy) {
  if (!['approved', 'rejected'].includes(requestedStatus)) {
    throw new AppError('Status must be approved or rejected');
  }

  const pendingAppointment = await Appointment.findOne({ _id: id, status: 'pending' });
  if (!pendingAppointment) {
    const existing = await Appointment.findById(id);
    if (!existing) throw new AppError('Appointment not found', 404);
    throw new AppError('Only pending appointments can be reviewed', 409);
  }

  let visitorAccount = null;
  let visitorProfile = null;
  if (requestedStatus === 'approved') {
    ({ account: visitorAccount, visitor: visitorProfile } = await getOrCreateVisitorAccount(pendingAppointment, approvedBy));
  }

  const appointment = await Appointment.findOneAndUpdate(
    { _id: id, status: 'pending' },
    {
      status: requestedStatus,
      approvedBy,
      visitor: visitorProfile?._id || null,
      visitorAccount: visitorAccount?._id || null
    },
    { new: true, runValidators: true }
  );
  if (!appointment) {
    throw new AppError('Appointment status changed; refresh and try again', 409);
  }

  if (requestedStatus === 'approved') {
    await sendEmail(
      appointment.visitorEmail,
      'Visitor appointment approved',
      `Your visit with ${appointment.host} has been approved. Please check in at reception.`
    );
    await sendSms(
      appointment.visitorPhone,
      `Your visit with ${appointment.host} has been approved. Please check in at reception.`
    );
  } else {
    await sendEmail(
      appointment.visitorEmail,
      'Visitor appointment update',
      'Your visitor appointment request was declined.'
    );
    await sendSms(appointment.visitorPhone, 'Your visitor appointment request was declined.');
  }
  return appointment;
}

async function getOrCreateVisitorAccount(appointment, createdBy) {
  const profile = {
    name: appointment.visitorName,
    email: appointment.visitorEmail,
    phone: appointment.visitorPhone,
    company: appointment.company,
    purpose: appointment.purpose,
    host: appointment.host
  };

  const requester = await User.findById(appointment.requestedBy);
  let account;
  if (requester?.role === 'visitor') {
    if (requester.email !== profile.email) {
      throw new AppError('Appointment email does not match the visitor account', 409);
    }
    account = await User.findByIdAndUpdate(requester._id, { $set: profile }, { new: true, runValidators: true });
  } else {
    const existingVisitor = await User.findOne({ email: profile.email });
    if (existingVisitor && existingVisitor.role !== 'visitor') {
      throw new AppError('This email belongs to a non-visitor account', 409);
    }
    account = existingVisitor
      ? await User.findByIdAndUpdate(existingVisitor._id, { $set: profile }, { new: true, runValidators: true })
      : await User.create({
        ...profile,
        role: 'visitor',
        loginEnabled: false,
        createdBy
      });
  }

  const visitor = await Visitor.findOneAndUpdate(
    { email: profile.email },
    { $set: { ...profile, account: account._id, createdBy } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  return { account, visitor };
}
