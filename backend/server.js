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

app.get('/', (req, res) => {
    res.send('Smart attendance system backend is running');
});

// Request and Response Logging Middleware
app.use((req, res, next) => {
    const start = Date.now();
    console.log(`\n[Backend API] -----> ${req.method} ${req.url}`);

    // Log body safely
    if (req.body && Object.keys(req.body).length > 0) {
        const safeBody = { ...req.body };
        if (safeBody.password) safeBody.password = '[HIDDEN]';
        console.log(`[Backend API] Body:`, safeBody);
    }

    res.on('finish', () => {
        const duration = Date.now() - start;
        const color = res.statusCode >= 400 ? '\\x1b[31m' : '\\x1b[32m'; // Red for errors, green for success
        console.log(`${color}[Backend API] <----- ${req.method} ${req.url} - Status: ${res.statusCode} (${duration}ms)\\x1b[0m`);
    });

    next();
});

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
