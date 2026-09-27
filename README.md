# মাদ্রাসা/স্কুল ম্যানেজমেন্ট সিস্টেম — প্রফেশনাল ভার্সন

**স্ট্যাক:** Node.js + Express (ব্যাকএন্ড API) + MongoDB (ডেটাবেজ) + HTML/CSS/JS (ফ্রন্টএন্ড)

## ফোল্ডার গঠন
```
madrasa-erp-pro/
  backend/     -> Express সার্ভার + MongoDB মডেল ও API
  frontend/    -> ব্যবহারকারীর দেখা ওয়েবসাইট (HTML/CSS/JS)
```

## চালানোর নিয়ম (প্রতিবার কম্পিউটার খুললে)

1. MongoDB সার্ভিস ব্যাকগ্রাউন্ডে অটো চালু থাকবে (ইনস্টলের সময় Service হিসেবে সেট করা হয়েছিল)।
2. VS Code-এ `backend` ফোল্ডার খুলে Terminal-এ লিখুন:
   ```
   npm run dev
   ```
   এতে সার্ভার চালু হবে `http://localhost:5000` এ। টার্মিনালে "🚀 সার্ভার চালু হয়েছে" এবং "✅ MongoDB সংযুক্ত হয়েছে" দেখতে পাবেন।
3. `frontend/index.html` ফাইলে Right Click → Open with Live Server।
4. প্রথমবার চালু করলে `backend` ফোল্ডারে গিয়ে একবার মাত্র `npm install` চালাতে হবে (নিচে বিস্তারিত)।

## প্রথমবার সেটআপ (একবারই করতে হবে)

```
cd backend
npm install
npm run dev
```
