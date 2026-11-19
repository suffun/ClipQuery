require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const videoRoutes = require('./routes/videoRoutes');
const chatRoutes = require('./routes/chatRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 8080;
const isProduction = process.env.NODE_ENV === 'production';

// Connect to MongoDB
connectDB();

// CORS configuration (default '*' allows Chrome Extension origin chrome-extension://<id>)
const allowedOriginsEnv = (process.env.ALLOWED_ORIGINS || '*').trim();
const corsOrigin =
  allowedOriginsEnv === '*'
    ? '*'
    : allowedOriginsEnv
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

// Middleware
app.use(
  cors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-gemini-api-key', 'x-api-key']
  })
);
app.use(express.json());
app.use(morgan(isProduction ? 'combined' : 'dev'));

// Routes
app.use('/api/videos', videoRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'ClipQuery Backend API',
    status: 'online',
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`[ClipQuery Backend] Server listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});
