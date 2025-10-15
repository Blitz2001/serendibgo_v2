import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const StripeContext = createContext();

export const useStripeContext = () => {
  const context = useContext(StripeContext);
  if (!context) {
    throw new Error('useStripeContext must be used within a StripeProvider');
  }
  return context;
};

export const StripeProvider = ({ children, clientSecret: propClientSecret }) => {
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState(propClientSecret || '');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState('LKR');

  useEffect(() => {
    // Load Stripe.js as soon as the component mounts
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51SIRHEGhGMqfYoq5wR5TD8i3ZZyVcwmQ6Lyp0GXfVMCjj2ChlkVnCyv579TQe0B3J54DCAErpkRj5BBmga8urcnt00NMZy5Eli';
    if (publishableKey) {
      setStripePromise(loadStripe(publishableKey));
    } else {
      console.error('Stripe Publishable Key is not set in environment variables.');
      console.log('Please create a .env file in the frontend directory with:');
      console.log('VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...');
    }
  }, []);

  // Update clientSecret when prop changes
  useEffect(() => {
    if (propClientSecret) {
      setClientSecret(propClientSecret);
    }
  }, [propClientSecret]);

  const value = {
    clientSecret,
    setClientSecret,
    paymentIntentId,
    setPaymentIntentId,
    amount,
    setAmount,
    currency,
    setCurrency
  };

  return (
    <StripeContext.Provider value={value}>
      {stripePromise && (
        <Elements stripe={stripePromise} options={clientSecret ? { clientSecret } : {}}>
          {children}
        </Elements>
      )}
      {!stripePromise && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Stripe Configuration Required</h2>
            <p className="text-gray-600 mb-4">Please set up your Stripe publishable key in the environment variables.</p>
            <div className="bg-gray-100 p-4 rounded-lg text-left max-w-md mx-auto">
              <p className="text-sm font-mono">Create frontend/.env file with:</p>
              <p className="text-sm font-mono text-blue-600">VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...</p>
            </div>
          </div>
        </div>
      )}
    </StripeContext.Provider>
  );
};
