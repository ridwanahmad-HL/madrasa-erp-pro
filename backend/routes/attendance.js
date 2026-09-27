const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');

// GET /api/attendance?date=2026-01-05&classs=হিফজ-১
// নির্দিষ্ট তারিখ ও শ্রেণির উপস্থিতি রেকর্ড আনা
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.date) filter.date = req.query.date;
    if (req.query.classs) filter.classs = req.query.classs;
    const records = await Attendance.find(filter);
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/attendance
// body: { date, classs, records: [{studentId, status}, ...] }
// একই তারিখ+শ্রেণির পুরনো রেকর্ড মুছে নতুন করে সেভ করা হয় (উপরে লেখা/overwrite)
router.post('/', async (req, res) => {
  try {
    const { date, classs, records } = req.body;
    if (!date || !classs || !Array.isArray(records)) {
      return res.status(400).json({ message: 'date, classs ও records আবশ্যক' });
    }
    await Attendance.deleteMany({ date, classs });
    const docs = records.map(r => ({ date, classs, studentId: r.studentId, status: r.status }));
    const saved = await Attendance.insertMany(docs);
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
