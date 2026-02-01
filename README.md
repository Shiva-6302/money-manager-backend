# Money Manager - Backend API

This is the Node.js/Express backend for the Money Manager application, designed for the GUVI/HCL Hackathon.

## 🛠️ Tech Stack
- **Node.js & Express**: Server framework
- **MongoDB & Mongoose**: Database and Schema modeling
- **Dotenv**: Environment variable management
- **Cors**: Cross-Origin Resource Sharing for Frontend connectivity

## 🚀 API Endpoints
- `GET /api/health`: Check if the server is running.
- `POST /api/transactions`: Create a new transaction (Income/Expense).
- `GET /api/transactions`: Fetch transactions with optional filters for `division`, `category`, and `date`.

## ⚙️ Local Setup
1. `npm install`
2. Create a `.env` file with your `MONGO_URI`.
3. Run `npm start`.