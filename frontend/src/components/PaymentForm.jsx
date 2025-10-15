import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { toast } from 'react-hot-toast';
import { CreditCard, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import paymentService from '../services/payments/paymentService';

const PaymentForm = ({ bookingData, onPaymentSuccess, onPaymentError, onRetry }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !bookingData.clientSecret) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if payment intent is still in a valid state
      console.log('Attempting to confirm payment with clientSecret:', bookingData.clientSecret);
      
      // Confirm payment with Stripe using the existing clientSecret
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        bookingData.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: bookingData.customerName || 'Customer',
              email: bookingData.customerEmail || '',
            },
          }
        }
      );

      if (stripeError) {
        console.error('Stripe error:', stripeError);
        
        // If payment intent is in unexpected state, suggest retry
        if (stripeError.code === 'payment_intent_unexpected_state') {
          setError('Payment session expired. Please refresh the page and try again.');
          toast.error('Payment session expired. Please refresh the page and try again.');
        } else {
          setError(stripeError.message);
          toast.error(`Payment failed: ${stripeError.message}`);
        }
        onPaymentError?.(stripeError);
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm payment on backend
        try {
          console.log('Payment succeeded, confirming payment...', {
            paymentIntentId: paymentIntent.id,
            isGuestPayment: bookingData.isGuestPayment,
            bookingId: bookingData.bookingId
          });
          
          // Use the isGuestPayment flag to determine which endpoint to use
          if (bookingData.isGuestPayment) {
            console.log('Confirming guest payment:', paymentIntent.id);
            await paymentService.confirmGuestPayment(paymentIntent.id);
          } else {
            console.log('Confirming authenticated payment:', paymentIntent.id);
            await paymentService.confirmPayment(paymentIntent.id);
          }
          
          console.log('Payment confirmation successful!');
          toast.success('Payment successful!');
          onPaymentSuccess?.(paymentIntent);
        } catch (confirmError) {
          console.error('Payment confirmation error:', confirmError);
          console.error('Confirmation error details:', {
            status: confirmError.response?.status,
            data: confirmError.response?.data,
            message: confirmError.message
          });
          toast.error('Payment succeeded but confirmation failed. Please contact support.');
          onPaymentError?.(confirmError);
        }
      } else {
        setError('Payment was not successful');
        toast.error('Payment was not successful');
        onPaymentError?.(new Error('Payment not succeeded'));
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error.response?.data?.message || 'Payment failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      onPaymentError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <CreditCard className="w-6 h-6 text-blue-600 mr-2" />
        Payment Details
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className="p-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        {error && (
          <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <div className="flex-1">
              <span className="text-red-700 text-sm">{error}</span>
              {error.includes('Payment session expired') && onRetry && (
                <button 
                  onClick={onRetry}
                  className="ml-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Create New Payment Session
                </button>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || loading || !bookingData.clientSecret}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center ${
            loading || !stripe || !bookingData.clientSecret
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Pay {bookingData.currency} {bookingData.amount}
            </>
          )}
        </button>
      </form>

      <div className="mt-4 text-xs text-gray-500">
        <p>Your payment information is secure and encrypted.</p>
        <p>Test card: 4242 4242 4242 4242</p>
      </div>
    </div>
  );
};

export default PaymentForm;
