const Stripe = require('stripe');

// Initialize Stripe with secret key
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

class StripeService {
  /**
   * Create a new Stripe customer
   * @param {string} email - Customer email
   * @param {string} name - Customer name
   * @returns {Promise<Object>} Stripe customer object
   */
  async createCustomer(email, name) {
    try {
      return await stripe.customers.create({
        email,
        name,
        metadata: { 
          source: 'snowball_app',
          created_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  /**
   * Create a subscription for a customer
   * @param {string} customerId - Stripe customer ID
   * @param {string} priceId - Stripe price ID
   * @returns {Promise<Object>} Stripe subscription object
   */
  async createSubscription(customerId, priceId) {
    try {
      return await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Create a payment intent for one-time payments
   * @param {number} amount - Amount in dollars
   * @param {string} currency - Currency code (default: 'usd')
   * @param {string} customerId - Stripe customer ID
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Stripe payment intent object
   */
  async createPaymentIntent(amount, currency = 'usd', customerId, metadata = {}) {
    try {
      return await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: customerId,
        automatic_payment_methods: { enabled: true },
        metadata: {
          ...metadata,
          source: 'snowball_app'
        }
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Retrieve a Stripe customer
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Object>} Stripe customer object
   */
  async getCustomer(customerId) {
    try {
      return await stripe.customers.retrieve(customerId);
    } catch (error) {
      console.error('Error retrieving customer:', error);
      throw new Error('Failed to retrieve customer');
    }
  }

  /**
   * Get customer subscriptions
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Array>} Array of subscription objects
   */
  async getCustomerSubscriptions(customerId) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        expand: ['data.items.data.price']
      });
      return subscriptions.data;
    } catch (error) {
      console.error('Error retrieving customer subscriptions:', error);
      throw new Error('Failed to retrieve subscriptions');
    }
  }

  /**
   * Retrieve a payment intent
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {Promise<Object>} Stripe payment intent object
   */
  async getPaymentIntent(paymentIntentId) {
    try {
      return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      throw new Error('Failed to retrieve payment intent');
    }
  }

  /**
   * Create a setup intent for saving payment methods
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Object>} Stripe setup intent object
   */
  async createSetupIntent(customerId) {
    try {
      return await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
      });
    } catch (error) {
      console.error('Error creating setup intent:', error);
      throw new Error('Failed to create setup intent');
    }
  }

  /**
   * List customer payment methods
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Array>} Array of payment method objects
   */
  async getCustomerPaymentMethods(customerId) {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      return paymentMethods.data;
    } catch (error) {
      console.error('Error retrieving payment methods:', error);
      throw new Error('Failed to retrieve payment methods');
    }
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - Stripe subscription ID
   * @returns {Promise<Object>} Stripe subscription object
   */
  async cancelSubscription(subscriptionId) {
    try {
      return await stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Update subscription
   * @param {string} subscriptionId - Stripe subscription ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Stripe subscription object
   */
  async updateSubscription(subscriptionId, updateData) {
    try {
      return await stripe.subscriptions.update(subscriptionId, updateData);
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }
}

module.exports = new StripeService();
