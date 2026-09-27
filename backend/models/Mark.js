const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  subject: { type: String, required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  obtained: Number,
  full: Number,
}, { timestamps: true });

module.exports = mongoose.model('Mark', markSchema);
