const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect('YOUR_MONGODB_URI_HERE');

const transactionSchema = new mongoose.Schema({
  title: String,
  amount: Number,
  type: String,
  category: String,
  division: String,
  date: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

app.get('/api/transactions', async (req, res) => {
  try {
    const { division, type, search, startDate, endDate } = req.query;
    let query = {};

    if (division && division !== 'All') query.division = division;
    if (type && type !== 'All') query.type = type;

    // Fixed search logic
    if (search && search.trim() !== '') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate && endDate) {
      query.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) 
      };
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });
    res.json(transactions);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/transactions', async (req, res) => {
  try { 
    const newTx = new Transaction(req.body); 
    await newTx.save(); 
    res.json(newTx); 
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/transactions/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ error: "Not found" });
    if (Date.now() - new Date(transaction.date).getTime() > 12 * 60 * 60 * 1000) {
        return res.status(403).json({ error: "Edit window expired" });
    }
    const updated = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/transactions/transfer', async (req, res) => {
  try {
    const { amount, fromDivision, toDivision } = req.body;
    const tx1 = new Transaction({ title: `Transfer to ${toDivision}`, amount: Number(amount), type: 'expense', category: 'Other', division: fromDivision });
    const tx2 = new Transaction({ title: `Transfer from ${fromDivision}`, amount: Number(amount), type: 'income', category: 'Other', division: toDivision });
    await tx1.save(); 
    await tx2.save();
    res.json({ success: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.listen(5000, () => console.log('Server running on 5000'));