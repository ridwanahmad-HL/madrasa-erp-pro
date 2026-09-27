const express = require('express');
const router = express.Router();
const Mark = require('../models/Mark');

// GET /api/marks?examId=xxxx
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.examId) filter.examId = req.query.examId;
    const records = await Mark.find(filter);
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/marks
// body: { examId, subject, full, records: [{studentId, obtained}, ...] }
// একই পরীক্ষা+বিষয়ের পুরনো নম্বর মুছে নতুন করে সেভ করা হয়
router.post('/', async (req, res) => {
  try {
    const { examId, subject, full, records } = req.body;
    if (!examId || !subject || !Array.isArray(records)) {
      return res.status(400).json({ message: 'examId, subject ও records আবশ্যক' });
    }
    await Mark.deleteMany({ examId, subject });
    const docs = records.map(r => ({ examId, subject, full, studentId: r.studentId, obtained: r.obtained }));
    const saved = await Mark.insertMany(docs);
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
