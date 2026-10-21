import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  pass: { type: mongoose.Schema.Types.ObjectId, ref: 'Pass', required: true },
  visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },
  action: { type: String, enum: ['check-in', 'check-out'], required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, default: '' }
}, { timestamps: true });
schema.index({ timestamp: -1 });
schema.index({ visitor: 1, timestamp: -1 });
export default mongoose.model('CheckLog', schema);
