const mongoose = require('mongoose');

const tinkerSchema = new mongoose.Schema({
  name: String,
  reason: String,
  blockChain: String,
  hypeLevel: String,
  riskLevel: String,
  source: String,
  foundAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tinker', tinkerSchema);
