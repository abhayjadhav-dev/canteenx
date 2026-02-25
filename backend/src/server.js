require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const menuRoutes = require('./routes/menu');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const inventoryRoutes = require('./routes/inventory');
const uploadRoutes = require('./routes/upload');
// authRoutes removed — phone OTP authentication disabled for this deploy

const app = express();

// Security & middleware
const cspDirectives = helmet.contentSecurityPolicy.getDefaultDirectives();
// Allow Supabase Auth, REST, Realtime (use exact URL; some browsers reject *.domain in connect-src)
const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const supabaseWss = supabaseUrl ? supabaseUrl.replace(/^https:\/\//, 'wss://') : '';
cspDirectives['connect-src'] = [
  "'self'",
  ...(supabaseUrl ? [supabaseUrl, supabaseWss] : []),
  'https://*.supabase.co',
  'wss://*.supabase.co',
  // Allow calling external HTTPS/WSS APIs (e.g. Render URL) from the frontend
  'https:',
  'wss:',
];
cspDirectives['frame-src'] = ["'self'", ...(supabaseUrl ? [supabaseUrl] : []), 'https://*.supabase.co'];
// Allow Unsplash images and data URLs
cspDirectives['img-src'] = ["'self'", 'data:', 'https://images.unsplash.com', 'https://placehold.co'];

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: cspDirectives,
    },
  })
);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Basic rate limiting on API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Serve uploaded images (both /uploads and /api/uploads for compatibility)
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));
app.use('/api/uploads', express.static(uploadsPath));

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
