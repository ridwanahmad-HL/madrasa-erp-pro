const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  name: { type: String, default: 'আমার মাদ্রাসা / স্কুল' },
  address: String,
  phone: String,
});

module.exports = mongoose.model('Settings', settingsSchema);
