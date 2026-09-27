const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

// GET /api/settings -> প্রতিষ্ঠানের তথ্য আনা (না থাকলে ডিফল্ট তৈরি করে দেয়)
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/settings -> প্রতিষ্ঠানের তথ্য আপডেট
router.put('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create(req.body);
    else settings = await Settings.findByIdAndUpdate(settings._id, req.body, { new: true });
    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
