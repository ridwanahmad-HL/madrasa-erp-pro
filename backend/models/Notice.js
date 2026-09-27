const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: String,
  date: String,
  urgent: { type: String, default: 'no' },
}, { timestamps: true });

module.exports = mongoose.model('Notice', noticeSchema);
