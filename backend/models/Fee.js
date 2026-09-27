const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  type: String,
  amount: Number,
  month: String,
  method: String,
  status: { type: String, enum: ['পরিশোধিত', 'বকেয়া'], default: 'বকেয়া' },
  date: String,
}, { timestamps: true });

module.exports = mongoose.model('Fee', feeSchema);
