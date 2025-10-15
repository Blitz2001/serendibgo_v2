import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, Users, MapPin, ArrowRight, Home, Download, Mail, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId, message, bookingData } = location.state || {};
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      const response = await fetch(`/api/bookings/${bookingId}/download-pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `booking-confirmation-${bookingId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('PDF downloaded successfully!');
      } else {
        throw new Error('Failed to download PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      setSendingEmail(true);
      const response = await fetch(`/api/bookings/${bookingId}/send-confirmation-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success('Confirmation email sent successfully!');
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  };

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
              Your booking has been confirmed! You can download your confirmation or have it sent to your email.
            </p>
            
            <div className="space-y-3">
              <div className="flex space-x-3">
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloadingPDF}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloadingPDF ? 'Downloading...' : 'Download PDF'}
                </button>
                
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {sendingEmail ? 'Sending...' : 'Send Email'}
                </button>
              </div>
              
              <button
                onClick={() => navigate('/my-bookings')}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center justify-center"
              >
                <FileText className="h-4 w-4 mr-2" />
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
