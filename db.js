const mongoose = require('mongoose');

const connectDB = () => mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
});

module.exports = connectDB;
