const User = require('../models/User');
const stripeService = require('../utils/stripeService');

/**
 * Get user's payment information
 * @route GET /api/v1/payment/info
 * @access Private
 */
const getPaymentInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    let customerData = null;
    let subscriptions = [];
    let paymentMethods = [];

    // Get Stripe customer data if exists
    if (user.stripeCustomerId) {
      try {
        customerData = await stripeService.getCustomer(user.stripeCustomerId);
        const subsData = await stripeService.getCustomerSubscriptions(user.stripeCustomerId);
        subscriptions = subsData;
        paymentMethods = await stripeService.getCustomerPaymentMethods(user.stripeCustomerId);
      } catch (stripeError) {
        console.error('Stripe API error:', stripeError);
        // Continue without Stripe data if there's an error
      }
    }

    res.json({
      success: true,
      data: {
        planType: user.planType,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionId: user.subscriptionId,
        customer: customerData,
        subscriptions,
        paymentMethods,
        paymentHistory: user.paymentHistory || [],
        billingAddress: user.billingAddress || null,
        hasStripeCustomer: !!user.stripeCustomerId
      }
    });
  } catch (error) {
    console.error('Get payment info error:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Failed to retrieve payment information',
      error: error.message 
    });
  }
};

/**
 * Create a payment intent for one-time payments
 * @route POST /api/v1/payment/create-payment-intent
 * @access Private
 */
const createPaymentIntent = async (req, res) => {
  try {
    const { amount, planType, currency = 'usd' } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        msg: 'Valid amount is required'
      });
    }

    if (!planType) {
      return res.status(400).json({
        success: false,
        msg: 'Plan type is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeService.createCustomer(user.email, user.name);
      customerId = customer.id;
      
      // Update user with Stripe customer ID
      await User.findByIdAndUpdate(userId, {
        stripeCustomerId: customerId
      });
    }

    // Create payment intent
    const paymentIntent = await stripeService.createPaymentIntent(
      amount, 
      currency, 
      customerId,
      {
        userId: userId,
        planType: planType,
        userEmail: user.email
      }
    );

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        customerId: customerId
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Failed to create payment intent',
      error: error.message 
    });
  }
};

/**
 * Handle successful payment
 * @route POST /api/v1/payment/success
 * @access Private
 */
const handlePaymentSuccess = async (req, res) => {
  try {
    const { paymentIntentId, planType, amount } = req.body;
    const userId = req.user.id;

    if (!paymentIntentId || !planType) {
      return res.status(400).json({
        success: false,
        msg: 'Payment intent ID and plan type are required'
      });
    }

    // Verify payment intent with Stripe
    const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        msg: 'Payment has not been completed successfully'
      });
    }

    // Update user's plan and payment history
    const updateData = {
      planType,
      $push: {
        paymentHistory: {
          paymentIntentId,
          amount: amount || paymentIntent.amount / 100, // Convert from cents
          currency: paymentIntent.currency,
          status: 'succeeded',
          planType
        }
      }
    };

    // If this is a subscription plan, update subscription status
    if (planType !== 'free') {
      updateData.subscriptionStatus = 'active';
    }

    await User.findByIdAndUpdate(userId, updateData);

    res.json({
      success: true,
      msg: 'Payment processed successfully',
      data: {
        planType,
        paymentIntentId,
        amount: amount || paymentIntent.amount / 100
      }
    });
  } catch (error) {
    console.error('Handle payment success error:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Failed to process payment success',
      error: error.message 
    });
  }
};

/**
 * Create a subscription
 * @route POST /api/v1/payment/create-subscription
 * @access Private
 */
const createSubscription = async (req, res) => {
  try {
    const { priceId, planType } = req.body;
    const userId = req.user.id;

    if (!priceId || !planType) {
      return res.status(400).json({
        success: false,
        msg: 'Price ID and plan type are required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeService.createCustomer(user.email, user.name);
      customerId = customer.id;
      
      await User.findByIdAndUpdate(userId, {
        stripeCustomerId: customerId
      });
    }

    // Create subscription
    const subscription = await stripeService.createSubscription(customerId, priceId);

    // Update user with subscription info
    await User.findByIdAndUpdate(userId, {
      subscriptionId: subscription.id,
      subscriptionStatus: 'incomplete',
      planType
    });

    res.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        status: subscription.status
      }
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Failed to create subscription',
      error: error.message 
    });
  }
};

/**
 * Cancel subscription
 * @route POST /api/v1/payment/cancel-subscription
 * @access Private
 */
const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user || !user.subscriptionId) {
      return res.status(404).json({
        success: false,
        msg: 'No active subscription found'
      });
    }

    // Cancel subscription in Stripe
    const canceledSubscription = await stripeService.cancelSubscription(user.subscriptionId);

    // Update user
    await User.findByIdAndUpdate(userId, {
      subscriptionStatus: 'canceled',
      planType: 'free'
    });

    res.json({
      success: true,
      msg: 'Subscription canceled successfully',
      data: {
        subscriptionId: canceledSubscription.id,
        status: canceledSubscription.status
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Failed to cancel subscription',
      error: error.message 
    });
  }
};

/**
 * Update billing address
 * @route POST /api/v1/payment/billing-address
 * @access Private
 */
const updateBillingAddress = async (req, res) => {
  try {
    const { billingAddress } = req.body;
    const userId = req.user.id;

    if (!billingAddress) {
      return res.status(400).json({
        success: false,
        msg: 'Billing address is required'
      });
    }

    await User.findByIdAndUpdate(userId, {
      billingAddress
    });

    res.json({
      success: true,
      msg: 'Billing address updated successfully'
    });
  } catch (error) {
    console.error('Update billing address error:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Failed to update billing address',
      error: error.message 
    });
  }
};

module.exports = {
  getPaymentInfo,
  createPaymentIntent,
  handlePaymentSuccess,
  createSubscription,
  cancelSubscription,
  updateBillingAddress
};
