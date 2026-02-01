const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Transaction = require('./models/Transaction');
const app = express();

app.use(cors());
app.use(express.json());

// 1. Health Check
app.get('/api/health', (req, res) => res.status(200).json({ status: 'OK' }));

// 2. GET: Fetch with Advanced Filters (Date range, Division, Category)
app.get('/api/transactions', async (req, res) => {
    try {
        const { division, category, startDate, endDate, type } = req.query;
        let filter = {};

        if (division && division !== 'All') filter.division = division;
        if (category && category !== 'All') filter.category = category;
        if (type && type !== 'All') filter.type = type;
        
        if (startDate && endDate) {
            filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const transactions = await Transaction.find(filter).sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. POST: Standard Add
app.post('/api/transactions', async (req, res) => {
    try {
        const newTransaction = new Transaction({ ...req.body, date: req.body.date || Date.now() });
        const saved = await newTransaction.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 4. POST: Account Transfer (Double Entry)
app.post('/api/transactions/transfer', async (req, res) => {
    try {
        const { amount, fromDivision, toDivision } = req.body;
        const date = Date.now();

        const outgoing = new Transaction({
            title: `Transfer to ${toDivision}`,
            amount: Number(amount),
            type: 'expense',
            category: 'Transfer',
            division: fromDivision,
            date
        });

        const incoming = new Transaction({
            title: `Transfer from ${fromDivision}`,
            amount: Number(amount),
            type: 'income',
            category: 'Transfer',
            division: toDivision,
            date
        });

        await outgoing.save();
        await incoming.save();
        res.status(201).json({ message: "Transfer Successful" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 5. PUT: Edit with 12-Hour Rule
app.put('/api/transactions/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ error: "Not found" });

        const TWELVE_HOURS = 12 * 60 * 60 * 1000;
        if (Date.now() - new Date(transaction.date).getTime() > TWELVE_HOURS) {
            return res.status(403).json({ error: "Edit window expired (12h limit)" });
        }

        const updated = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/moneyManager';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Connected');
        app.listen(PORT, () => console.log(`🚀 Port: ${PORT}`));
    })
    .catch(err => console.error('❌ Failed:', err.message));