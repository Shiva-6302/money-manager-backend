const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Ensure the model path is correct
const Transaction = require('./models/Transaction');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

/**
 * 1. Health Check Route
 * Useful for verifying server status during deployment (e.g., on Render or AWS)
 */
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'Server is healthy and running' });
});

/**
 * 2. POST: Add New Transaction
 * Handles saving both Office and Personal transactions.
 */
app.post('/api/transactions', async (req, res) => {
    try {
        const { title, amount, type, category, division, date } = req.body;
        
        // Basic validation
        if (!title || !amount || !type || !division) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newTransaction = new Transaction({
            title,
            amount: Number(amount),
            type, // 'income' or 'expense'
            category,
            division, // 'Office' or 'Personal'
            date: date || Date.now()
        });

        const savedTransaction = await newTransaction.save();
        res.status(201).json(savedTransaction);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * 3. GET: Fetch Transactions
 * Supports filtering for the History functionality and Dashboard lists.
 */
app.get('/api/transactions', async (req, res) => {
    try {
        const { division, category, startDate, endDate } = req.query;
        let filter = {};

        if (division) filter.division = division;
        if (category) filter.category = category;
        
        if (startDate && endDate) {
            filter.date = { 
                $gte: new Date(startDate), 
                $lte: new Date(endDate) 
            };
        }

        // Sort by date descending so newest appear at the top
        const transactions = await Transaction.find(filter).sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * 4. GET: Dashboard Stats
 * Aggregates data for the top summary cards (Balance, Income, Expenses).
 */
app.get('/api/stats', async (req, res) => {
    try {
        const transactions = await Transaction.find();
        
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((acc, curr) => acc + curr.amount, 0);
            
        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, curr) => acc + curr.amount, 0);

        res.json({
            totalBalance: income - expenses,
            totalIncome: income,
            totalExpenses: expenses,
            count: transactions.length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Server & Database Connection
const PORT = process.env.PORT || 5000;
// Defaulting to local MongoDB; remember to update .env for production/cloud
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/moneyManager';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Database Connected Successfully');
        app.listen(PORT, () => {
            console.log(`🚀 Server active on: http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Connection failed:', err.message);
    });