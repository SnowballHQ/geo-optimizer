const express = require("express");
const router = express.Router();
const { authenticationMiddleware } = require("../middleware/auth");
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login/register attempts per windowMs
  message: {
    error: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// General API rate limiting for other user endpoints
const userApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs for user endpoints
  message: {
    error: 'Too many requests to user API, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input validation middleware
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .trim()
    .escape(),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
];

const validateRegistration = [
  body('name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces')
    .trim()
    .escape(),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .trim()
    .escape(),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
];

// Middleware to handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
    });
  }
  next();
};

// Import authentication controllers
const { login, register, dashboard, getAllUsers, googleAuth } = require("../controllers/user");

// Import brand settings controllers
const { getBrandSettings, saveBrandSettings, refreshBrandVoice } = require("../controllers/user/brandSettings");

// Authentication routes with strict rate limiting and input validation
router.post("/login", authLimiter, validateLogin, handleValidationErrors, login);
router.post("/register", authLimiter, validateRegistration, handleValidationErrors, register);
router.post("/auth/google", authLimiter, googleAuth); // Google auth has its own validation

// Protected routes with general API rate limiting
router.get("/dashboard", userApiLimiter, authenticationMiddleware, dashboard);
router.get("/users", userApiLimiter, authenticationMiddleware, getAllUsers);

// Get current user info including role
router.get("/me", userApiLimiter, authenticationMiddleware, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      profilePicture: req.user.profilePicture
    }
  });
});

// Logout route
router.post("/logout", userApiLimiter, authenticationMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully"
  });
});

// Brand settings routes
router.get("/brand-settings", userApiLimiter, authenticationMiddleware, getBrandSettings);
router.post("/brand-settings", userApiLimiter, authenticationMiddleware, saveBrandSettings);
router.post("/brand-settings/refresh", userApiLimiter, authenticationMiddleware, refreshBrandVoice);

module.exports = router;