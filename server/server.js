require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Connect MongoDB
connectDB();

const app = express();

// ====================================================
// SECURITY & MIDDLEWARE
// ====================================================

app.use(
    helmet({
        contentSecurityPolicy: false
    })
);

app.use(
    cors({
        origin:
            process.env.NODE_ENV === 'production'
                ? 'https://yourdomain.com'
                : '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ====================================================
// STATIC FILES
// ====================================================

// Serve HTML pages
app.use(express.static(path.join(__dirname, '../client/html')));

// Serve CSS files
app.use(
    '/css',
    express.static(path.join(__dirname, '../client/css'))
);

// Serve JS files
app.use(
    '/js',
    express.static(path.join(__dirname, '../client/js'))
);

// Serve uploads
app.use(
    '/uploads',
    express.static(path.join(__dirname, '../uploads'))
);

// ====================================================
// API ROUTES
// ====================================================

app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/hearings', require('./routes/hearings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/dashboard', require('./routes/dashboard'));

// ====================================================
// HEALTH CHECK
// ====================================================

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date(),
        environment: process.env.NODE_ENV
    });
});

// ====================================================
// FRONTEND ROUTES
// ====================================================

// Default route
app.get('/', (req, res) => {
    res.sendFile(
        path.join(__dirname, '../client/html/auth.html')
    );
});

// Dashboard route
app.get('/dashboard', (req, res) => {
    res.sendFile(
        path.join(__dirname, '../client/html/dashboard.html')
    );
});

// ====================================================
// GLOBAL ERROR HANDLER
// ====================================================

app.use(errorHandler);

// ====================================================
// START SERVER
// ====================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`
⚖️  Advocate CMS Server Running
================================
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🚀 Server:      http://localhost:${PORT}
📁 API Base:    http://localhost:${PORT}/api
================================
`);
});

module.exports = app;