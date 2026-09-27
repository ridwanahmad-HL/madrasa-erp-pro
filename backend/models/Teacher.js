const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: String,
  phone: String,
  join: String,
  salary: String,
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema);
