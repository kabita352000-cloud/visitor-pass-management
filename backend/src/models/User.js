import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { type: String, required: function passwordRequired() { return this.loginEnabled; }, select: false },
  role: {
    type: String,
    enum: ['admin', 'security', 'employee', 'visitor'],
    default: 'visitor'
  },
  phone: { type: String, default: '' },
  company: { type: String, default: '', trim: true },
  purpose: { type: String, default: '', trim: true },
  host: { type: String, default: '', trim: true },
  photoUrl: { type: String, default: '', trim: true },
  loginEnabled: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isBootstrapAdmin: { type: Boolean, default: false, select: false }
}, { timestamps: true });
userSchema.index(
  { isBootstrapAdmin: 1 },
  { unique: true, partialFilterExpression: { isBootstrapAdmin: true } }
);
export default mongoose.model('User', userSchema);
