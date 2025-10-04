import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';
import { apiService } from '../utils/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CreditCard, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { ConfirmDialog } from './ui/confirm-dialog';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Payment form component
const PaymentForm = ({ planType, amount, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent
      const response = await apiService.createPaymentIntent({
        amount,
        planType
      });

      const { clientSecret } = response.data.data;

      // Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (result.error) {
        toast.error(result.error.message);
      } else {
        // Payment succeeded
        await apiService.handlePaymentSuccess({
          paymentIntentId: result.paymentIntent.id,
          planType,
          amount
        });
        
        toast.success('Payment successful! Your plan has been upgraded.');
        onSuccess();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#4a4a6a] mb-2">
            Card Information
          </label>
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 text-sm text-blue-800">
            <CreditCard className="w-4 h-4" />
            <span>Secure payment powered by Stripe</span>
          </div>
        </div>
      </div>
      
      <div className="flex space-x-3">
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-[#7765e3] hover:bg-[#7765e3]/90"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${amount}`
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

// Main StripePaymentSettings component
const StripePaymentSettings = () => {
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const plans = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: 29,
      features: [
        '5 Domain Analyses per month',
        'Basic Support',
        'Content Calendar',
        'Blog Analysis',
        'Basic Analytics'
      ],
      popular: false
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: 59,
      features: [
        'Unlimited Domain Analyses',
        'Priority Support',
        'Advanced Content Calendar',
        'Advanced Blog Analysis',
        'Full Analytics Suite',
        'API Access',
        'Custom Integrations'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      price: 99,
      features: [
        'Everything in Premium',
        'Dedicated Account Manager',
        'Custom Brand Analysis',
        'White-label Options',
        'Advanced Reporting',
        '24/7 Phone Support'
      ],
      popular: false
    }
  ];

  useEffect(() => {
    loadPaymentInfo();
  }, []);

  const loadPaymentInfo = async () => {
    try {
      const response = await apiService.getPaymentInfo();
      setPaymentInfo(response.data.data);
    } catch (error) {
      console.error('Error loading payment info:', error);
      toast.error('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setSelectedPlan(null);
    loadPaymentInfo(); // Reload payment info
  };

  const handleCancelSubscription = () => {
    setShowCancelDialog(true);
  };

  const confirmCancelSubscription = async () => {
    setIsCanceling(true);
    try {
      await apiService.cancelSubscription();
      toast.success('Subscription canceled successfully');
      loadPaymentInfo();
      setShowCancelDialog(false);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setIsCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#7765e3]" />
          <p className="text-sm text-gray-600">Loading payment information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <div className="bg-gradient-to-r from-[#7765e3]/10 to-[#7765e3]/5 p-6 rounded-lg border border-[#7765e3]/20">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-[#4a4a6a] text-lg">Current Plan</h3>
            <p className="text-sm text-gray-600 mt-1">
              You are currently on the{' '}
              <Badge 
                variant={paymentInfo?.planType === 'free' ? 'secondary' : 'default'} 
                className="ml-1"
              >
                {paymentInfo?.planType || 'Free'}
              </Badge>{' '}
              plan
            </p>
            {paymentInfo?.subscriptionStatus && paymentInfo.subscriptionStatus !== 'none' && (
              <div className="mt-2">
                <Badge 
                  variant={paymentInfo.subscriptionStatus === 'active' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {paymentInfo.subscriptionStatus}
                </Badge>
              </div>
            )}
          </div>
          {paymentInfo?.subscriptionStatus === 'active' && paymentInfo.planType !== 'free' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelSubscription}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Cancel Subscription
            </Button>
          )}
        </div>
      </div>

      {/* Available Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative border-2 transition-all duration-200 ${
              plan.popular 
                ? 'border-[#7765e3] shadow-lg scale-105' 
                : 'border-[#b0b0d8] hover:border-[#7765e3]/50'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-[#7765e3] text-white px-3 py-1">
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-[#4a4a6a] text-xl">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold text-[#7765e3]">
                  ${plan.price}
                </span>
                <span className="text-sm text-gray-600 ml-1">/month</span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button
                onClick={() => handlePlanSelect(plan)}
                className={`w-full ${
                  plan.popular 
                    ? 'bg-[#7765e3] hover:bg-[#7765e3]/90' 
                    : 'bg-gray-600 hover:bg-gray-700'
                } text-white`}
                disabled={paymentInfo?.planType === plan.id}
              >
                {paymentInfo?.planType === plan.id ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Current Plan
                  </>
                ) : (
                  'Select Plan'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && selectedPlan && (
        <Card className="border-2 border-[#7765e3] bg-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-[#4a4a6a] flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Complete Payment - {selectedPlan.name}</span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              You will be charged ${selectedPlan.price} per month
            </p>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise}>
              <PaymentForm
                planType={selectedPlan.id}
                amount={selectedPlan.price}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setShowPaymentForm(false)}
              />
            </Elements>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      {paymentInfo?.paymentHistory?.length > 0 && (
        <Card className="border-0.3 border-[#b0b0d8]">
          <CardHeader>
            <CardTitle className="text-[#4a4a6a] flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Payment History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentInfo.paymentHistory.map((payment, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div>
                      <span className="font-medium text-[#4a4a6a]">${payment.amount}</span>
                      <span className="text-sm text-gray-600 ml-2">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {payment.planType}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    {payment.status === 'succeeded' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <Badge 
                      variant={payment.status === 'succeeded' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-800 text-sm">Secure Payment Processing</h4>
            <p className="text-xs text-gray-600 mt-1">
              Your payment information is processed securely by Stripe. We never store your card details.
              All transactions are encrypted and PCI compliant.
            </p>
          </div>
        </div>
      </div>

      {/* Cancel Subscription Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={confirmCancelSubscription}
        title="Cancel Subscription?"
        description="Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period."
        confirmText="Cancel Subscription"
        cancelText="Keep Subscription"
        variant="destructive"
        isLoading={isCanceling}
      />
    </div>
  );
};

export default StripePaymentSettings;
