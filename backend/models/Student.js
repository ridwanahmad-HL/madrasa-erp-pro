const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  father: String,
  mother: String,
  classs: String,
  roll: String,
  phone: String,
  admissionDate: String,
  status: { type: String, default: 'সক্রিয়' },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
