// সাধারণ CRUD (Create, Read, Update, Delete) রাউট তৈরির জন্য একটি পুনঃব্যবহারযোগ্য ফাংশন।
// Student, Teacher, Notice — এই সাধারণ মডেলগুলোর জন্য ব্যবহৃত হয়, যাতে একই কোড বারবার লিখতে না হয়।
const express = require('express');

function crudFactory(Model) {
  const router = express.Router();

  // GET /api/xxx  -> সব রেকর্ড আনা
  router.get('/', async (req, res) => {
    try {
      const items = await Model.find().sort({ createdAt: -1 });
      res.json(items);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // POST /api/xxx -> নতুন রেকর্ড তৈরি
  router.post('/', async (req, res) => {
    try {
      const item = await Model.create(req.body);
      res.status(201).json(item);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  // PUT /api/xxx/:id -> রেকর্ড আপডেট
  router.put('/:id', async (req, res) => {
    try {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!item) return res.status(404).json({ message: 'পাওয়া যায়নি' });
      res.json(item);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  // DELETE /api/xxx/:id -> রেকর্ড মুছে ফেলা
  router.delete('/:id', async (req, res) => {
    try {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ message: 'পাওয়া যায়নি' });
      res.json({ message: 'মুছে ফেলা হয়েছে' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  return router;
}

module.exports = crudFactory;
