// server.js 
const express = require('express'); 
const session = require('express-session'); 
const cors = require('cors'); 
const helmet = require('helmet'); 
require('dotenv').config();  

const connectDB = require('./config/db'); 
const logger = require('./config/logger');  

const app = express(); 
const PORT = process.env.PORT;  

// Middleware 
app.use(helmet()); 
app.use(cors()); 
app.use(express.json());  

app.use(session({   
  secret: process.env.SESSION_SECRET || 'keyboard cat',   
  resave: false,   
  saveUninitialized: false,   
  cookie: { secure: false } // true if using HTTPS 
}));  

// Sanitize middleware 
app.use(require('./middleware/sanitize'));  

// Serve static frontend files 
app.use(express.static('public'));  

// Routes
app.use('/api/admin', require('./routes/adminRoutes')); 
app.use('/api/auth', require('./routes/authRoutes')); 
app.use('/api/bills', require('./routes/billRoutes'));
// Add the missing user routes
app.use('/api/user', require('./routes/userRoutes'));  

// Connect DB and start server 
connectDB()   
  .then(() => {     
    app.listen(PORT, () => {       
      logger.info(`✅ Server running on port ${PORT}`);     
    });   
  })   
  .catch(err => {     
    logger.error('❌ Failed to connect to MongoDB', err);     
    process.exit(1);   
  });