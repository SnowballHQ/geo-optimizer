require("dotenv").config();
require('express-async-errors');

// Secure environment variable logging - only log status, not values
console.log('🔐 Environment Security Check:');
console.log('MONGO_URI:', process.env.MONGO_URI ? '✅ Set' : '❌ NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ NOT SET');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ NOT SET');
console.log('PERPLEXITY_API_KEY:', process.env.PERPLEXITY_API_KEY ? '✅ Set' : '❌ NOT SET');
console.log('SHOPIFY_API_KEY:', process.env.SHOPIFY_API_KEY ? '✅ Set' : '❌ NOT SET');
console.log('SHOPIFY_API_SECRET:', process.env.SHOPIFY_API_SECRET ? '✅ Set' : '❌ NOT SET');
console.log('WORDPRESS_CLIENT_ID:', process.env.WORDPRESS_CLIENT_ID ? '✅ Set' : '❌ NOT SET');
console.log('WORDPRESS_CLIENT_SECRET:', process.env.WORDPRESS_CLIENT_SECRET ? '✅ Set' : '❌ NOT SET');
console.log('WORDPRESS_REDIRECT_URI:', process.env.WORDPRESS_REDIRECT_URI ? '✅ Set' : '❌ NOT SET');
console.log('APP_URL:', process.env.APP_URL ? '✅ Set' : 'http://localhost:5000 (default)');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL ? '✅ Set' : 'http://localhost:5173 (default)');
console.log('PORT:', process.env.PORT || '5000 (default)');

const connectDB = require("./db/connect");
const express = require("express");
const cors = require('cors');
const path = require('path');

// Security middleware imports
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const app = express();
const mainRouter = require("./routes/user");
const brandRouter = require("./routes/brand");
const domainAnalysisRouter = require("./routes/domainAnalysis");
const contentCalendarRouter = require("./routes/contentCalendar");
const cmsCredentialsRouter = require("./routes/cmsCredentials");
const shopifyRouter = require("./routes/shopify");
const webflowRouter = require("./routes/webflow");
const wordpressRouter = require("./routes/wordpress-oauth");
const uploadRouter = require("./routes/upload");
const onboardingRouter = require("./routes/onboarding");
const regenerateAnalysisRouter = require("./routes/regenerateAnalysis");
const superUserAnalysisRouter = require("./routes/superUserAnalysis");
const analyticsRouter = require("./routes/analytics");
const paymentRouter = require("./routes/payment");

// Initialize auto-publisher
require('./utils/autoPublisher');

// Security Middleware Configuration
console.log('🛡️  Initializing Security Middleware...');

// Set security headers with helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting for all requests
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/v1/health';
  }
});

app.use(generalLimiter);

// Sanitize user input to prevent NoSQL injection attacks
app.use(mongoSanitize());

// Clean user input from malicious XSS code
app.use(xss());

app.use(express.json({ limit: '10mb' }));

// CORS configuration for development and production
const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:3000', 
  'http://127.0.0.1:5173',
  'https://snowball-frontend.onrender.com',
  'https://snowball-land.onrender.com',
  'https://geo-optimizer-land.onrender.com',
  'https://geo-optimizer.onrender.com',
  'https://geo-optimizer-w7k1.onrender.com',
  'https://geo-optimizer-land-zu45.onrender.com', // Backend domain for CORS
  process.env.FRONTEND_URL,
  // Add explicit environment variable for production frontend URL
  process.env.FRONTEND_DOMAIN
].filter(Boolean);

console.log('🔧 CORS Configuration loaded with origins:', allowedOrigins);
console.log('🔧 Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  FRONTEND_URL: process.env.FRONTEND_URL,
  FRONTEND_DOMAIN: process.env.FRONTEND_DOMAIN
});

app.use(cors({
  origin: function (origin, callback) {
    console.log('🔍 CORS Request from origin:', origin);
    console.log('🔍 Allowed origins:', allowedOrigins);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS: Origin allowed');
      callback(null, true);
    } else {
      // Production fallback: allow onrender.com domains
      const isOnRender = origin.includes('.onrender.com');
      if (isOnRender && (origin.includes('geo-optimizer') || origin.includes('snowball'))) {
        console.log('✅ CORS: Onrender domain allowed as fallback:', origin);
        callback(null, true);
      } else {
        console.error('❌ CORS: Origin not allowed:', origin);
        console.error('❌ Allowed origins are:', allowedOrigins);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  console.log('🔍 Handling preflight OPTIONS request from:', req.get('Origin'));
  res.status(200).send();
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Snowball API is running',
    timestamp: new Date().toISOString(),
    allowedOrigins: allowedOrigins
  });
});

app.use("/api/v1", mainRouter);
app.use("/api/v1/brand", brandRouter);
app.use("/api/v1/domain-analysis", domainAnalysisRouter);
app.use("/api/v1/content-calendar", contentCalendarRouter);
app.use("/api/v1/cms-credentials", cmsCredentialsRouter);
app.use("/api/v1/shopify", shopifyRouter);
app.use("/api/v1/webflow", webflowRouter);
app.use("/api/v1/wordpress", wordpressRouter);
app.use("/api/v1/upload", uploadRouter);
app.use("/api/v1/onboarding", onboardingRouter);
app.use("/api/v1/regenerate", regenerateAnalysisRouter);
app.use("/api/v1/super-user/analysis", superUserAnalysisRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/payment", paymentRouter);

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Handle React Router - serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).json({ 
    msg: "Server error", 
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const port = process.env.PORT || 5000;

const start = async () => {
    try {        
        await connectDB(process.env.MONGO_URI);
        app.listen(port, () => {
            console.log(`Server is listening on port ${port}`);
        });
    } catch (error) {
       console.log(error); 
    }
}

start();

