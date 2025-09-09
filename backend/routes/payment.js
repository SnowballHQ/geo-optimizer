const express = require('express');
const router = express.Router();
const { authenticationMiddleware: auth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const {
  getPaymentInfo,
  createPaymentIntent,
  handlePaymentSuccess,
  createSubscription,
  cancelSubscription,
  updateBillingAddress
} = require('../controllers/payment');

// Rate limiting for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    msg: 'Too many payment requests, please try again later.'
  }
});

// Validation middleware
const validatePaymentIntent = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('planType')
    .isIn(['free', 'basic', 'premium', 'enterprise'])
    .withMessage('Invalid plan type'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be 3 characters')
];

const validatePaymentSuccess = [
  body('paymentIntentId')
    .notEmpty()
    .withMessage('Payment intent ID is required'),
  body('planType')
    .isIn(['free', 'basic', 'premium', 'enterprise'])
    .withMessage('Invalid plan type'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0')
];

const validateSubscription = [
  body('priceId')
    .notEmpty()
    .withMessage('Price ID is required'),
  body('planType')
    .isIn(['basic', 'premium', 'enterprise'])
    .withMessage('Invalid plan type for subscription')
];

const validateBillingAddress = [
  body('billingAddress.line1')
    .notEmpty()
    .withMessage('Address line 1 is required'),
  body('billingAddress.city')
    .notEmpty()
    .withMessage('City is required'),
  body('billingAddress.state')
    .notEmpty()
    .withMessage('State is required'),
  body('billingAddress.postal_code')
    .notEmpty()
    .withMessage('Postal code is required'),
  body('billingAddress.country')
    .notEmpty()
    .withMessage('Country is required')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      msg: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * @route GET /api/v1/payment/info
 * @desc Get user's payment information
 * @access Private
 */
router.get('/info', auth, getPaymentInfo);

/**
 * @route POST /api/v1/payment/create-payment-intent
 * @desc Create a payment intent for one-time payments
 * @access Private
 */
router.post(
  '/create-payment-intent', 
  auth, 
  paymentLimiter,
  validatePaymentIntent,
  handleValidationErrors,
  createPaymentIntent
);

/**
 * @route POST /api/v1/payment/success
 * @desc Handle successful payment
 * @access Private
 */
router.post(
  '/success', 
  auth, 
  paymentLimiter,
  validatePaymentSuccess,
  handleValidationErrors,
  handlePaymentSuccess
);

/**
 * @route POST /api/v1/payment/create-subscription
 * @desc Create a subscription
 * @access Private
 */
router.post(
  '/create-subscription', 
  auth, 
  paymentLimiter,
  validateSubscription,
  handleValidationErrors,
  createSubscription
);

/**
 * @route POST /api/v1/payment/cancel-subscription
 * @desc Cancel subscription
 * @access Private
 */
router.post('/cancel-subscription', auth, paymentLimiter, cancelSubscription);

/**
 * @route POST /api/v1/payment/billing-address
 * @desc Update billing address
 * @access Private
 */
router.post(
  '/billing-address', 
  auth, 
  validateBillingAddress,
  handleValidationErrors,
  updateBillingAddress
);

module.exports = router;
