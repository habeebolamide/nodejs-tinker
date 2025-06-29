const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  chatId: { type: String, required: true, unique: true },
  joinedAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('User', userSchema);
