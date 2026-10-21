import Appointment from '../models/Appointment.js';
import CheckLog from '../models/CheckLog.js';
import Pass from '../models/Pass.js';
import Visitor from '../models/Visitor.js';

export async function getDashboardStats() {
  const [visitors, appointments, pendingAppointments, activePasses, checkedIn, recentLogs] = await Promise.all([
    Visitor.countDocuments(),
    Appointment.countDocuments(),
    Appointment.countDocuments({ status: 'pending' }),
    Pass.countDocuments({ status: 'active', validUntil: { $gt: new Date() } }),
    Pass.countDocuments({ status: 'checked-in' }),
    CheckLog.find()
      .populate('visitor', 'name')
      .sort({ timestamp: -1 })
      .limit(8)
  ]);
  return {
    stats: { visitors, appointments, pendingAppointments, activePasses, checkedIn },
    recentLogs
  };
}
