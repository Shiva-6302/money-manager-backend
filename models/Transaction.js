const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, required: true, enum: ['income', 'expense'] },
  // FIXED: Removed enum so it accepts ALL categories (Salary, Food, etc.)
  category: { type: String, required: true }, 
  division: { type: String, required: true, enum: ['Personal', 'Office'] },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);