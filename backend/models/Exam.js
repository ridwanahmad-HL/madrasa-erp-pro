const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  name: { type: String, required: true },
  classs: { type: String, required: true },
  date: String,
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
