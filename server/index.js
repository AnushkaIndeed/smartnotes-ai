const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const filesRoutes = require('./routes/files');


const app = express();

// Middleware 
app.use(cors());
app.use(express.json()); 

// Test route 
app.get('/', (req, res) => {
  res.json({ message: 'SmartNotes API is running' });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/files', filesRoutes);

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
    console.error('MongoDB connection failed:', err.message);
  });