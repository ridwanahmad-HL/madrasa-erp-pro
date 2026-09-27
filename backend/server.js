require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// ---------- Middleware ----------
app.use(cors());            // ফ্রন্টএন্ড (আলাদা পোর্ট থেকে) API কল করতে পারবে
app.use(express.json());    // JSON বডি পার্স করার জন্য

// ---------- Database ----------
connectDB();

// ---------- Routes ----------
app.use('/api/students', require('./routes/students'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/marks', require('./routes/marks'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/settings', require('./routes/settings'));

// ---------- Health check ----------
app.get('/', (req, res) => {
  res.send('✅ মাদ্রাসা ERP ব্যাকএন্ড সার্ভার চালু আছে');
});

// ---------- Error handler (সবার শেষে) ----------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'সার্ভারে একটি সমস্যা হয়েছে' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 সার্ভার চালু হয়েছে: http://localhost:${PORT}`);
});
