require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Allowed origins for CORS (comma-separated in env, fallback to localhost)
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

// CORS error handler
app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ error: 'CORS blocked request' });
    }
    next(err);
});

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
        const status = res.statusCode >= 400 ? 'ERR' : 'OK';
        console.log(`[Backend API] <----- ${req.method} ${req.url} - ${status} ${res.statusCode} (${duration}ms)`);
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

// Global error handler
app.use((err, req, res, next) => {
    console.error('[Backend ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`AttendGuard server running on port ${PORT}`);
});
