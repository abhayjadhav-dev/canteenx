require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const menuRoutes = require('./routes/menu');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const inventoryRoutes = require('./routes/inventory');
const uploadRoutes = require('./routes/upload');
// authRoutes removed — phone OTP authentication disabled for this deploy

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/upload', uploadRoutes);
// auth route removed

// Health check
const healthHandler = (req, res) => {
  res.json({ status: 'ok', db: 'supabase', timestamp: new Date().toISOString() });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Serve frontend in production (avoid swallowing /api/* 404s)
const frontendPath = path.join(__dirname, '../../web/dist');
app.use(express.static(frontendPath));
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start server (no MongoDB connection needed — using Supabase)
const PORT = process.env.PORT || 4000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('Using Supabase PostgreSQL as database');
  console.log(`CanteenX API running on http://0.0.0.0:${PORT}`);
});

module.exports = app;
