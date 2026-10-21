import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },
  code: { type: String, unique: true, required: true, uppercase: true, trim: true },
  status: { type: String, enum: ['active', 'checked-in', 'checked-out', 'revoked'], default: 'active' },
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date, required: true },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
schema.index({ status: 1, validUntil: 1 });
export default mongoose.model('Pass', schema);
