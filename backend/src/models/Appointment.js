import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  visitorName: { type: String, required: true, trim: true },
  visitorEmail: { type: String, default: '', lowercase: true, trim: true },
  visitorPhone: { type: String, required: true, trim: true },
  company: { type: String, default: '', trim: true },
  purpose: { type: String, required: true, trim: true },
  host: { type: String, required: true, trim: true },
  scheduledAt: { type: Date, required: true },
  visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', default: null },
  visitorAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
schema.index({ status: 1, scheduledAt: 1 });
export default mongoose.model('Appointment', schema);
