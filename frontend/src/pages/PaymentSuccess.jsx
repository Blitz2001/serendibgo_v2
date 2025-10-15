import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, Users, MapPin, ArrowRight, Home } from 'lucide-react';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId, message } = location.state || {};

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Payment Successful!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {message || 'Your booking has been confirmed and payment processed successfully.'}
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Confirmation</h3>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-sm text-gray-600">Booking ID: {bookingId}</span>
            </div>
            
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <span className="text-sm text-gray-600">Status: Confirmed</span>
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <p className="text-sm text-gray-500 mb-4">
              You will receive a confirmation email shortly with all the details.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/my-bookings')}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                View My Bookings
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <Home className="h-4 w-4 inline mr-1" />
                Home
              </button>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Need help? Contact our support team at support@serendibgo.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
