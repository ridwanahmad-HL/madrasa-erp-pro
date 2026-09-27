const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB সংযুক্ত হয়েছে:', mongoose.connection.name);
  } catch (err) {
    console.error('❌ MongoDB সংযোগে সমস্যা হয়েছে:', err.message);
    console.error('   নিশ্চিত করুন MongoDB সার্ভিস চালু আছে (services.msc তে MongoDB চেক করুন)।');
    process.exit(1);
  }
}

module.exports = connectDB;
