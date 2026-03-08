require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/webauthn', require('./routes/webauthn'));
app.use('/api/hod', require('./routes/hod'));
app.use('/api/teacher', require('./routes/teacher'));
app.use('/api/student', require('./routes/student'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`AttendGuard server running on port ${PORT}`);
});
