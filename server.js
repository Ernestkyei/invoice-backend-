// server.js
require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const PORT = process.env.PORT;

// Call connectDB properly
console.log('📡 Connecting to MongoDB...');
connectDB();

// Start server after connection is established
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});