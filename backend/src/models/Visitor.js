import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  company: { type: String, default: '', trim: true },
  purpose: { type: String, required: true, trim: true },
  host: { type: String, required: true, trim: true },
  photoUrl: { type: String, default: '', trim: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

schema.index({ email: 1 }, { unique: true });
schema.index({ account: 1, createdAt: -1 });

export default mongoose.model('Visitor', schema);
