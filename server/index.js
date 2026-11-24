const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });
console.log('Loaded env from:', path.resolve(__dirname, '.env'));

// Import routes
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const filesRoutes = require('./routes/files');
const aiRoutes = require('./routes/ai');


const app = express();

// Middleware
const configuredFrontendOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedFrontendOrigins = new Set([
  'http://localhost:5173',
  'https://smartnotes-ai-alpha.vercel.app',
  ...configuredFrontendOrigins
]);
const vercelPreviewOrigin = /^https:\/\/smartnotes-[a-z0-9]+-anushka-s-projects24\.vercel\.app$/i;

app.use(cors({
  origin: (origin, callback) => {
    // Requests without an Origin header are non-browser clients (for example, health checks).
    if (!origin || allowedFrontendOrigins.has(origin) || vercelPreviewOrigin.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); 

// Log all incoming requests for debugging route issues
app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.path);
  next();
});

// Test route 
app.get('/', (req, res) => {
  res.json({ message: 'SmartNotes API is running' });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/ai', aiRoutes);

// Connect to MongoDB then start the server
const PORT = process.env.PORT || 5001;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
  console.error('MongoDB connection failed');
  console.error(err);
});
