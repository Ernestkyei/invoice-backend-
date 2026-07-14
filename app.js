const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const app = express();

// Import routes
const authRoutes = require('./routes/authRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');  

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(morgan('dev'));

// ========== ROUTES ==========
app.get('/', (req, res) => {
    res.send('Invoice API is running');
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is healthy',
        timestamp: new Date().toISOString()
    });
});

// Auth routes
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);  

// ========== ERROR HANDLING ==========
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!'
    });
});

module.exports = app;