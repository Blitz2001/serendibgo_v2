import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { StripeProvider } from '../context/StripeContext'
import PaymentForm from '../components/PaymentForm'
import { toast } from 'react-hot-toast'
import paymentService from '../services/payments/paymentService'
import { 
  CreditCard, 
  CheckCircle, 
  Calendar, 
  Users, 
  MapPin,
  Bed,
  DollarSign,
  ArrowLeft,
  User,
  Phone,
  Mail,
  Car
} from 'lucide-react'

const Payment = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [paymentData, setPaymentData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState(null)
  const [initializing, setInitializing] = useState(true)
  const [paymentIntentCreated, setPaymentIntentCreated] = useState(false)
  
  useEffect(() => {
    // Get booking data from navigation state
    if (location.state && !paymentIntentCreated) {
      const initialPaymentData = {
        ...location.state,
        isGuestPayment: !isAuthenticated || !user
      }
      setPaymentData(initialPaymentData)
      console.log('Payment page received booking data:', initialPaymentData)
      console.log('Booking ID from location state:', location.state?.bookingId)
      console.log('Booking ID from initialPaymentData:', initialPaymentData?.bookingId)
      createPaymentIntent(initialPaymentData)
    } else if (!location.state) {
      console.error('No booking data found in location state')
      toast.error('No booking data found. Please try booking again.')
      navigate('/guides')
    }
  }, [location.state, navigate, paymentIntentCreated, isAuthenticated, user])

  const createPaymentIntent = async (bookingData) => {
    try {
      setInitializing(true)
      
      console.log('=== CREATE PAYMENT INTENT DEBUG ===')
      console.log('Booking data received:', bookingData)
      console.log('Booking ID:', bookingData?.bookingId)
      console.log('Amount:', bookingData?.amount)
      console.log('Currency:', bookingData?.currency)
      
      // Validate required fields
      if (!bookingData?.bookingId) {
        console.warn('⚠️ Booking ID is missing, generating a mock booking ID for payment');
        // Generate a mock booking ID if missing (for cases where booking creation failed but we still want to process payment)
        bookingData.bookingId = `mock-booking-${Date.now()}`;
        console.log('Generated mock booking ID:', bookingData.bookingId);
        
        // Update the payment data state with the generated booking ID
        setPaymentData(prev => ({
          ...prev,
          bookingId: bookingData.bookingId
        }));
      }
      if (!bookingData?.amount || bookingData.amount <= 0) {
        throw new Error('Valid amount is required for payment')
      }
      
      // Debug authentication state
      console.log('Auth Debug:', {
        isAuthenticated,
        user: user ? `${user.firstName} ${user.lastName}` : 'No user',
        hasToken: !!localStorage.getItem('token')
      })
      
      let response;
      
      if (isAuthenticated && user) {
        try {
          // Use authenticated payment endpoint
          console.log('Using authenticated payment endpoint')
          response = await paymentService.createPaymentIntent(
            bookingData.amount,
            bookingData.currency,
            { bookingId: bookingData.bookingId }
          )
        } catch (authError) {
          console.warn('Authenticated payment failed, falling back to guest payment:', authError.response?.status)
          console.log('Auth error details:', authError.response?.data)
          
          // If authenticated payment fails (403, 401, 400), fall back to guest payment
          if (authError.response?.status === 403 || authError.response?.status === 401 || authError.response?.status === 400) {
            console.log('Falling back to guest payment endpoint due to auth failure')
            response = await paymentService.createGuestPaymentIntent(
              bookingData.amount,
              bookingData.currency,
              { 
                bookingId: bookingData.bookingId,
                customerEmail: user?.email || bookingData.customerEmail || 'guest@example.com',
                customerName: user ? `${user.firstName} ${user.lastName}` : bookingData.customerName || 'Guest User'
              }
            )
            // Mark this as a guest payment for the PaymentForm
            setPaymentData(prev => ({ ...prev, isGuestPayment: true }))
          } else {
            throw authError
          }
        }
      } else {
        // Use guest payment endpoint
        console.log('Using guest payment endpoint')
        response = await paymentService.createGuestPaymentIntent(
          bookingData.amount,
          bookingData.currency,
          { 
            bookingId: bookingData.bookingId,
            customerEmail: bookingData.customerEmail || 'guest@example.com',
            customerName: bookingData.customerName || 'Guest User'
          }
        )
      }
      
      setClientSecret(response.data.clientSecret)
      setPaymentIntentCreated(true)
      console.log('Payment intent created:', response.data.clientSecret)
    } catch (error) {
      console.error('Error creating payment intent:', error)
      toast.error('Failed to initialize payment. Please try again.')
    } finally {
      setInitializing(false)
    }
  }

  const handlePaymentSuccess = (paymentIntent) => {
    console.log('Payment successful:', paymentIntent)
    toast.success('Payment completed successfully!')
    navigate('/payment-success', { 
      state: { 
        message: 'Payment completed successfully!',
        bookingId: paymentData.bookingId,
        bookingData: paymentData
      }
    })
  }

  const handlePaymentError = (error) => {
    console.error('Payment error:', error)
    toast.error('Payment failed. Please try again.')
  }

  const handleRetryPayment = async () => {
    if (paymentData) {
      setPaymentIntentCreated(false)
      setClientSecret(null)
      await createPaymentIntent(paymentData)
    }
  }

  const handleAuthFailure = () => {
    console.log('Authentication failed, clearing token and redirecting to login')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.error('Your session has expired. Please log in again.')
    navigate('/login')
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading payment details...</h2>
        </div>
      </div>
    )
  }

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading payment details...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Room Details
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Payment</h1>
          <p className="text-gray-600 mt-2">Review your booking details and complete the payment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
              Booking Summary
            </h2>
            
            <div className="space-y-4">
              {/* Booking Type Specific Information */}
              {paymentData.bookingType === 'hotel' && (
                <>
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">{paymentData.hotelName}</p>
                      <p className="text-sm text-gray-600">{paymentData.roomName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">Check-in: {paymentData.checkIn}</p>
                      <p className="text-sm text-gray-600">Check-out: {paymentData.checkOut}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">Guests: {paymentData.guests || 1}</p>
                    </div>
                  </div>
                </>
              )}

              {paymentData.bookingType === 'guide' && (
                <>
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">Guide: {paymentData.guideName}</p>
                      <p className="text-sm text-gray-600">{paymentData.guideEmail}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">Start: {paymentData.startDate}</p>
                      <p className="text-sm text-gray-600">End: {paymentData.endDate}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">Group Size: {paymentData.groupSize}</p>
                      <p className="text-sm text-gray-600">Duration: {paymentData.duration}</p>
                    </div>
                  </div>
                </>
              )}

              {paymentData.bookingType === 'tour' && (
                <>
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">{paymentData.tourName}</p>
                      <p className="text-sm text-gray-600">{paymentData.tourDescription}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">Start: {paymentData.startDate}</p>
                      <p className="text-sm text-gray-600">End: {paymentData.endDate}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">Group Size: {paymentData.groupSize}</p>
                    </div>
                  </div>
                </>
              )}

              {paymentData.bookingType === 'vehicle' && (
                <>
                  <div className="flex items-center">
                    <Car className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">{paymentData.vehicleName}</p>
                      <p className="text-sm text-gray-600">{paymentData.vehicleType}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">Pickup: {paymentData.pickupLocation}</p>
                      <p className="text-sm text-gray-600">Dropoff: {paymentData.dropoffLocation}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">Pickup: {new Date(paymentData.pickupDateTime).toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Dropoff: {new Date(paymentData.dropoffDateTime).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">Passengers: {paymentData.passengers}</p>
                    </div>
                  </div>
                </>
              )}

              {paymentData.bookingType === 'custom-trip' && (
                <>
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">{paymentData.tripName}</p>
                      <p className="text-sm text-gray-600">{paymentData.tripDescription}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">Start: {paymentData.startDate}</p>
                      <p className="text-sm text-gray-600">End: {paymentData.endDate}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">Group Size: {paymentData.groupSize}</p>
                      <p className="text-sm text-gray-600">Guide: {paymentData.guideName}</p>
                    </div>
                  </div>
                  
                  {paymentData.interests && (
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium">Interests: {paymentData.interests}</p>
                        <p className="text-sm text-gray-600">Accommodation: {paymentData.accommodation}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Customer Information */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-2">Customer Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm">
                      {isAuthenticated && user 
                        ? `${user.firstName} ${user.lastName}` 
                        : paymentData.customerName || 'Guest User'
                      }
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm">
                      {isAuthenticated && user 
                        ? user.email 
                        : paymentData.customerEmail || 'guest@example.com'
                      }
                    </span>
                  </div>
                  {(isAuthenticated && user?.phone) || paymentData.customerPhone ? (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm">
                        {isAuthenticated && user 
                          ? user.phone 
                          : paymentData.customerPhone
                        }
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
              
              {/* Pricing Breakdown */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      {paymentData.bookingType === 'hotel' ? 'Room Price:' : 
                       paymentData.bookingType === 'tour' ? 'Tour Price:' : 
                       paymentData.bookingType === 'vehicle' ? 'Vehicle Rental:' :
                       paymentData.bookingType === 'custom-trip' ? 'Custom Trip Price:' :
                       'Service Price:'}
                    </span>
                    <span>{paymentData.currency} {paymentData.amount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taxes & Fees:</span>
                    <span>{paymentData.currency} {Math.round(paymentData.amount * 0.15)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total Amount:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {paymentData.currency} {Math.round(paymentData.amount * 1.15)}
                    </span>
                  </div>
                  {paymentData.amount > 999999 && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-800">
                            <strong>Test Mode:</strong> Payment amount capped at LKR 999,999.99 for testing purposes.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {paymentData.bookingReference && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                    <span className="font-medium">Booking Reference:</span> {paymentData.bookingReference}
                  </div>
                )}
              </div>
            </div>
          </div>

              {/* Payment Form */}
              {initializing ? (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Initializing payment...</span>
                  </div>
                </div>
              ) : clientSecret ? (
                <StripeProvider clientSecret={clientSecret}>
                  <PaymentForm
                    bookingData={{
                      bookingId: paymentData.bookingId,
                      amount: Math.round(paymentData.amount * 1.15), // Include taxes
                    currency: paymentData.currency,
                    customerName: isAuthenticated && user 
                      ? `${user.firstName} ${user.lastName}` 
                      : paymentData.customerName || 'Guest User',
                    customerEmail: isAuthenticated && user 
                      ? user.email 
                      : paymentData.customerEmail || 'guest@example.com',
                    clientSecret: clientSecret,
                    isGuestPayment: paymentData.isGuestPayment || !isAuthenticated || !user
                    }}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                    onRetry={handleRetryPayment}
                  />
                </StripeProvider>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="text-center text-red-600">
                    <p>Failed to initialize payment. Please try again.</p>
                    <div className="mt-4 space-x-2">
                      <button 
                        onClick={handleRetryPayment} 
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Retry Payment
                      </button>
                      {isAuthenticated && (
                        <button 
                          onClick={handleAuthFailure} 
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Clear Session & Login
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
        </div>
      </div>
    </div>
  )
}

export default Payment
