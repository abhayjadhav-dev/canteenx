const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, default: '' },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    studentId: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    walletBalance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
