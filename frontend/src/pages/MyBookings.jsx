import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Clock, Users, CreditCard, Sparkles, Eye, CheckCircle, XCircle, User, Building, Car, Phone, Star, MapPin as LocationIcon, Bed, AlertCircle, MessageSquare } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { bookingAPI } from '../services/hotels/hotelService'
import { guideService } from '../services/guideService'
import { toast } from 'react-hot-toast'
import ReviewForm from '../components/reviews/ReviewForm'

const MyBookings = () => {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [customTrips, setCustomTrips] = useState([])
  const [vehicleBookings, setVehicleBookings] = useState([])
  const [guideBookings, setGuideBookings] = useState([])
  const [tourBookings, setTourBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('bookings')
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null)

  useEffect(() => {
    if (user) {
      fetchBookings()
    }
  }, [user])

  // Handle navigation state from payment page
  useEffect(() => {
    const locationState = location.state
    if (locationState?.message) {
      toast.success(locationState.message)
      // Clear the state to prevent showing the message again
      navigate(location.pathname, { replace: true })
    }
  }, [location.state, navigate, location.pathname])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if user is authenticated
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please login to view your bookings')
        return
      }
      
      console.log('Fetching bookings for user:', user?.email)
      
      // Fetch hotel bookings
      try {
        const hotelResponse = await bookingAPI.getMyBookings()
        console.log('Hotel bookings response:', hotelResponse)
        if (hotelResponse.status === 'success') {
          setBookings(hotelResponse.data.bookings)
        }
      } catch (hotelError) {
        console.error('Hotel bookings error:', hotelError)
      }
      
      // Fetch custom trips and guide bookings using the same API service
      try {
          const customResponse = await fetch('/api/bookings/user', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })
        
        console.log('Custom trips response status:', customResponse.status)
        
        if (customResponse.ok) {
          const customData = await customResponse.json()
          console.log('Custom trips data:', customData)
          if (customData.success) {
            const customTrips = customData.data.bookings.filter(booking => booking.type === 'custom')
            setCustomTrips(customTrips)
            
            // Filter guide bookings (bookings with type 'guide')
            const guideBookings = customData.data.bookings.filter(booking => 
              booking.type === 'guide'
            )
            setGuideBookings(guideBookings)
            console.log('Guide bookings:', guideBookings)
            
            // Filter tour bookings (bookings with type 'tour')
            const tourBookings = customData.data.bookings.filter(booking => 
              booking.type === 'tour'
            )
            setTourBookings(tourBookings)
            console.log('Tour bookings:', tourBookings)
          }
        } else {
          console.error('Custom trips API error:', customResponse.status, customResponse.statusText)
        }
      } catch (customError) {
        console.error('Custom trips fetch error:', customError)
      }
      
      // Fetch vehicle bookings
      try {
        const vehicleResponse = await fetch('/api/vehicle-bookings/user', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })
        
        console.log('Vehicle bookings response status:', vehicleResponse.status)
        
        if (vehicleResponse.ok) {
          const vehicleData = await vehicleResponse.json()
          console.log('Vehicle bookings data:', vehicleData)
          if (vehicleData.status === 'success') {
            setVehicleBookings(vehicleData.data.bookings || [])
          }
        } else {
          console.error('Vehicle bookings API error:', vehicleResponse.status, vehicleResponse.statusText)
        }
      } catch (vehicleError) {
        console.error('Vehicle bookings fetch error:', vehicleError)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      setError('Failed to fetch bookings')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'approved':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'cancelled':
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const handleConfirmCustomTrip = async (trip) => {
    try {
      const response = await fetch(`/api/custom-trips/${trip.id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Navigate to payment page
        navigate('/payment', {
          state: {
            bookingId: data.data.booking._id,
            bookingType: 'custom-trip',
            amount: trip.totalAmount,
            currency: 'LKR',
            tripName: trip.destination,
            tripDescription: `Custom trip to ${trip.destination}`,
            startDate: trip.startDate,
            endDate: trip.endDate,
            groupSize: trip.groupSize,
            guideName: trip.assignedGuide?.name || 'TBD',
            interests: trip.interests?.join(', ') || '',
            accommodation: trip.accommodation || '',
            bookingReference: data.data.booking.bookingReference
          }
        })
      } else {
        alert(data.message || 'Failed to create booking for custom trip')
      }
    } catch (error) {
      console.error('Error creating custom trip booking:', error)
      alert('An error occurred while creating the booking')
    }
  }

  const handleConfirmHotelBooking = async (booking) => {
    navigate('/payment', {
      state: {
        bookingId: booking._id,
        bookingType: 'hotel',
        amount: booking.pricing?.totalPrice || 0,
        currency: booking.pricing?.currency || 'LKR',
        hotelName: booking.hotel?.name,
        roomName: booking.room?.name,
        checkIn: booking.checkInDate,
        checkOut: booking.checkOutDate,
        guests: booking.guests?.adults || 1,
        bookingReference: booking.bookingReference
      }
    })
  }

  const handleConfirmTourBooking = async (booking) => {
    navigate('/payment', {
      state: {
        bookingId: booking._id,
        bookingType: 'tour',
        amount: booking.totalAmount || 0,
        currency: 'LKR',
        tourName: booking.tour?.title || booking.title,
        tourDescription: booking.tour?.description || booking.description,
        startDate: booking.startDate,
        endDate: booking.endDate,
        groupSize: booking.groupSize,
        bookingReference: booking.bookingReference
      }
    })
  }

  const handleConfirmVehicleBooking = async (booking) => {
    navigate('/payment', {
      state: {
        bookingId: booking._id,
        bookingType: 'vehicle',
        amount: booking.pricing?.totalPrice || 0,
        currency: booking.pricing?.currency || 'LKR',
        vehicleName: booking.vehicle?.make + ' ' + booking.vehicle?.model,
        vehicleType: booking.vehicle?.type,
        pickupLocation: booking.tripDetails?.pickupLocation?.address,
        dropoffLocation: booking.tripDetails?.dropoffLocation?.address,
        pickupDateTime: booking.tripDetails?.startDate,
        bookingReference: booking.bookingReference
      }
    })
  }

  const handleViewDetails = (trip) => {
    console.log('=== VIEW DETAILS DEBUG ===')
    console.log('Trip data:', trip)
    console.log('Request details:', trip.requestDetails)
    console.log('Staff assignment:', trip.staffAssignment)
    console.log('Start date:', trip.requestDetails?.startDate)
    console.log('End date:', trip.requestDetails?.endDate)
    setSelectedTrip(trip)
    setShowDetailsModal(true)
  }

  const handleViewGuideDetails = (booking) => {
    console.log('=== GUIDE BOOKING DETAILS DEBUG ===')
    console.log('Guide booking data:', booking)
    console.log('Guide details:', booking.guide)
    console.log('Booking dates:', booking.startDate, booking.endDate)
    console.log('Payment status:', booking.paymentStatus)
    setSelectedTrip(booking)
    setShowDetailsModal(true)
  }

  const closeDetailsModal = () => {
    setShowDetailsModal(false)
    setSelectedTrip(null)
  }

  const handleWriteReview = (booking) => {
    setSelectedBookingForReview(booking)
    setShowReviewForm(true)
  }

  const handleReviewSubmitted = () => {
    setShowReviewForm(false)
    setSelectedBookingForReview(null)
    toast.success('Review submitted successfully!')
    // Optionally refresh bookings to show updated status
    fetchBookings()
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading bookings</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <button
                onClick={fetchBookings}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="mt-2 text-gray-600">Manage your tour bookings and custom trips</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                key="bookings-tab"
                onClick={() => setActiveTab('bookings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bookings'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Bed className="h-4 w-4 inline mr-2" />
                Hotel Bookings ({bookings.length})
              </button>
              <button
                key="tours-tab"
                onClick={() => setActiveTab('tours')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tours'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="h-4 w-4 inline mr-2" />
                Tour Bookings ({tourBookings.length})
              </button>
              <button
                key="custom-tab"
                onClick={() => setActiveTab('custom')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'custom'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Sparkles className="h-4 w-4 inline mr-2" />
                Custom Trips ({customTrips.length})
              </button>
              <button
                key="vehicles-tab"
                onClick={() => setActiveTab('vehicles')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'vehicles'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Car className="h-4 w-4 inline mr-2" />
                Vehicle Rentals ({vehicleBookings.length})
              </button>
              <button
                key="guides-tab"
                onClick={() => setActiveTab('guides')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'guides'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className="h-4 w-4 inline mr-2" />
                Guide Bookings ({guideBookings.length})
              </button>
            </nav>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your bookings...</p>
          </div>
        ) : (
          <>
            {/* Regular Bookings Tab */}
            {activeTab === 'bookings' && (
              <>
                {bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No tour bookings yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Start by exploring our amazing tours.</p>
                    <div className="mt-6">
                      <Link
                        to="/tours"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        Browse Tours
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {bookings.map((booking) => (
                      <div key={booking._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Bed className="h-5 w-5 text-blue-600" />
                              <h3 className="text-lg font-semibold text-gray-900">
                                {booking.hotel?.name || 'Hotel Booking'}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              {booking.room?.name || 'Room'} - {booking.room?.roomType || 'Standard'}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2" />
                                {formatDate(booking.checkInDate)}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2" />
                                {formatDate(booking.checkOutDate)}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="h-4 w-4 mr-2" />
                                {booking.hotel?.location?.city || 'Location'}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Users className="h-4 w-4 mr-2" />
                                {booking.guests?.adults || 1} {booking.guests?.adults === 1 ? 'guest' : 'guests'}
                              </div>
                            </div>
                            {booking.bookingReference && (
                              <div className="mt-3 text-xs text-gray-500">
                                Reference: {booking.bookingReference}
                              </div>
                            )}
                          </div>
                          <div className="ml-6 flex flex-col items-end">
                            <div className="flex flex-col items-end space-y-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                {getStatusIcon(booking.status)}
                                <span className="ml-1">{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                              </span>
                              {booking.paymentStatus && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  booking.paymentStatus === 'paid'
                                    ? 'bg-green-100 text-green-800'
                                    : booking.paymentStatus === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  <span className="ml-1">{booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}</span>
                                </span>
                              )}
                            </div>
                            <div className="mt-2 flex items-center text-lg font-semibold text-gray-900">
                              <CreditCard className="h-4 w-4 mr-1" />
                              {booking.pricing?.currency || 'USD'} {booking.pricing?.totalPrice?.toLocaleString() || '0'}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              Payment: {booking.paymentStatus?.charAt(0).toUpperCase() + booking.paymentStatus?.slice(1)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end space-x-3">
                          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                            View Details
                          </button>
                          {booking.status === 'pending' && (
                            <button className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                              Cancel
                            </button>
                          )}
                          {booking.status === 'confirmed' && booking.paymentStatus === 'pending' && (
                            <button 
                              onClick={() => handleConfirmHotelBooking(booking)}
                              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Pay Now
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Tour Bookings Tab */}
            {activeTab === 'tours' && (
              <>
                {tourBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No tour bookings yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Start by exploring our amazing tours.</p>
                    <div className="mt-6">
                      <Link
                        to="/tours"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        Browse Tours
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {tourBookings.map((booking) => (
                      <div key={booking.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Calendar className="h-5 w-5 text-blue-600" />
                              <h3 className="text-lg font-medium text-gray-900">{booking.title}</h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                {getStatusIcon(booking.status)}
                                <span className="ml-1">{booking.status}</span>
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{booking.description}</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center text-gray-600">
                                <Calendar className="h-4 w-4 mr-2" />
                                {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                              </div>
                              <div className="flex items-center text-gray-600">
                                <Users className="h-4 w-4 mr-2" />
                                {booking.groupSize} people
                              </div>
                              <div className="flex items-center text-gray-600">
                                <MapPin className="h-4 w-4 mr-2" />
                                {booking.location}
                              </div>
                              <div className="flex items-center text-gray-600">
                                <CreditCard className="h-4 w-4 mr-2" />
                                USD {booking.totalAmount?.toLocaleString() || '0'}
                              </div>
                            </div>
                            {booking.specialRequests && (
                              <div className="mt-3">
                                <p className="text-sm text-gray-600">
                                  <strong>Special Requests:</strong> {booking.specialRequests}
                                </p>
                              </div>
                            )}
                            {booking.guide && (
                              <div className="mt-3">
                                <p className="text-sm text-gray-600">
                                  <strong>Guide:</strong> {booking.guide.firstName} {booking.guide.lastName}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="ml-6 flex flex-col items-end">
                            <div className="flex flex-col items-end space-y-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                {getStatusIcon(booking.status)}
                                <span className="ml-1">{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                              </span>
                              {booking.paymentStatus && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  booking.paymentStatus === 'paid'
                                    ? 'bg-green-100 text-green-800'
                                    : booking.paymentStatus === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  <span className="ml-1">{booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}</span>
                                </span>
                              )}
                            </div>
                            <div className="mt-2 flex items-center text-lg font-semibold text-gray-900">
                              <CreditCard className="h-4 w-4 mr-1" />
                              USD {booking.totalAmount?.toLocaleString() || '0'}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              Payment: {booking.paymentStatus?.charAt(0).toUpperCase() + booking.paymentStatus?.slice(1)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end space-x-3">
                          <button 
                            onClick={() => handleViewDetails(booking)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </button>
                          {booking.status === 'pending' && (
                            <button className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                              Cancel
                            </button>
                          )}
                          {booking.status === 'confirmed' && booking.paymentStatus === 'pending' && (
                            <button 
                              onClick={() => handleConfirmTourBooking(booking)}
                              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Pay Now
                            </button>
                          )}
                          {booking.status === 'completed' && (
                            <button 
                              onClick={() => handleWriteReview(booking)}
                              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Write Review
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Custom Trips Tab */}
            {activeTab === 'custom' && (
              <>
                {customTrips.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No custom trips yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Create your personalized Sri Lankan adventure.</p>
                    <div className="mt-6">
                      <Link
                        to="/custom-trip"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Create Custom Trip
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {customTrips.map((trip) => (
                      <div key={trip.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <Sparkles className="h-5 w-5 text-primary mr-2" />
                              <h3 className="text-lg font-semibold text-gray-900">{trip.title}</h3>
                            </div>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2" />
                                {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Users className="h-4 w-4 mr-2" />
                                {trip.groupSize} {trip.groupSize === 1 ? 'person' : 'people'}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="h-4 w-4 mr-2" />
                                {trip.location}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Eye className="h-4 w-4 mr-2" />
                                {trip.guide ? `${trip.guide.firstName} ${trip.guide.lastName}` : 'Guide pending'}
                              </div>
                            </div>
                            {trip.hotels && trip.hotels.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm text-gray-600">
                                  <strong>Hotels:</strong> {trip.hotels.map(hotel => hotel.hotel?.name || 'Hotel').join(', ')}
                                </p>
                              </div>
                            )}
                            {trip.customTripDetails && (
                              <div className="mt-3">
                                {trip.customTripDetails.interests && trip.customTripDetails.interests.length > 0 && (
                                  <p className="text-sm text-gray-600">
                                    <strong>Interests:</strong> {trip.customTripDetails.interests.join(', ')}
                                  </p>
                                )}
                                {trip.customTripDetails.accommodation && (
                                  <p className="text-sm text-gray-600">
                                    <strong>Accommodation:</strong> {trip.customTripDetails.accommodation}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="ml-6 flex flex-col items-end">
                            <div className="flex flex-col items-end space-y-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                                {getStatusIcon(trip.status)}
                                <span className="ml-1">{trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}</span>
                              </span>
                              {trip.paymentStatus && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  trip.paymentStatus === 'paid' 
                                    ? 'bg-green-100 text-green-800' 
                                    : trip.paymentStatus === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  <span className="ml-1">{trip.paymentStatus.charAt(0).toUpperCase() + trip.paymentStatus.slice(1)}</span>
                                </span>
                              )}
                            </div>
                            <div className="mt-2 flex items-center text-lg font-semibold text-gray-900">
                              <CreditCard className="h-4 w-4 mr-1" />
                              LKR {trip.totalAmount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end space-x-3">
                          <button 
                            onClick={() => handleViewDetails(trip)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </button>
                          {trip.status === 'approved' && trip.paymentStatus !== 'paid' && (
                            <button 
                              onClick={() => handleConfirmCustomTrip(trip)}
                              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirm & Pay
                            </button>
                          )}
                          {trip.status === 'confirmed' && trip.paymentStatus === 'paid' && (
                            <div className="flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-300 rounded-md">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Payment Complete
                            </div>
                          )}
                          {trip.status === 'pending' && (
                            <button className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                              Cancel Request
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Vehicle Bookings Tab */}
            {activeTab === 'vehicles' && (
              <>
                {vehicleBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Car className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicle bookings yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Start by renting a vehicle for your Sri Lankan adventure.</p>
                    <div className="mt-6">
                      <Link
                        to="/vehicles"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        <Car className="h-4 w-4 mr-2" />
                        Browse Vehicles
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {vehicleBookings.map((booking) => (
                      <div key={booking._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Car className="h-5 w-5 text-blue-600" />
                              <h3 className="text-lg font-semibold text-gray-900">
                                {booking.vehicle?.name || 'Vehicle Booking'}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              {booking.vehicle?.make} {booking.vehicle?.model} - {booking.vehicle?.vehicleType}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2" />
                                {formatDate(booking.tripDetails.startDate)}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2" />
                                {formatDate(booking.tripDetails.endDate)}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="h-4 w-4 mr-2" />
                                {booking.tripDetails.pickupLocation.city}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Users className="h-4 w-4 mr-2" />
                                {booking.passengers.adults + booking.passengers.children + booking.passengers.infants} passengers
                              </div>
                            </div>
                            {booking.bookingReference && (
                              <div className="mt-3 text-xs text-gray-500">
                                Reference: {booking.bookingReference}
                              </div>
                            )}
                          </div>
                          <div className="ml-6 flex flex-col items-end">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.bookingStatus)}`}>
                              {getStatusIcon(booking.bookingStatus)}
                              <span className="ml-1">{booking.bookingStatus.charAt(0).toUpperCase() + booking.bookingStatus.slice(1)}</span>
                            </span>
                            <div className="mt-2 flex items-center text-lg font-semibold text-gray-900">
                              <CreditCard className="h-4 w-4 mr-1" />
                              {booking.pricing?.currency || 'LKR'} {booking.pricing?.totalPrice?.toLocaleString() || '0'}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              Payment: {booking.paymentStatus?.charAt(0).toUpperCase() + booking.paymentStatus?.slice(1)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end space-x-3">
                          <button 
                            onClick={() => handleViewVehicleDetails(booking)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </button>
                          {booking.bookingStatus === 'pending' && (
                            <button className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                              Cancel
                            </button>
                          )}
                          {booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'pending' && (
                            <button 
                              onClick={() => handleConfirmVehicleBooking(booking)}
                              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Pay Now
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Guide Bookings Tab */}
            {activeTab === 'guides' && (
              <>
                {guideBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No guide bookings yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Book a personal guide for your Sri Lankan adventure.</p>
                    <div className="mt-6">
                      <Link
                        to="/guides"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Browse Guides
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {guideBookings.map((booking) => (
                      <div key={booking._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <User className="h-5 w-5 text-blue-600" />
                              <h3 className="text-lg font-semibold text-gray-900">
                                {booking.guide?.firstName} {booking.guide?.lastName}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              Personal Guide Service
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2" />
                                {formatDate(booking.startDate)}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2" />
                                {formatDate(booking.endDate)}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="h-4 w-4 mr-2" />
                                {booking.duration?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Users className="h-4 w-4 mr-2" />
                                {booking.groupSize} {booking.groupSize === 1 ? 'person' : 'people'}
                              </div>
                            </div>
                            {booking.specialRequests && (
                              <div className="mt-3 text-sm text-gray-600">
                                <strong>Special Requests:</strong> {booking.specialRequests}
                              </div>
                            )}
                            {booking.guide?.phone && (
                              <div className="mt-2 text-sm text-gray-600">
                                <Phone className="h-4 w-4 inline mr-1" />
                                <strong>Guide Contact:</strong> {booking.guide.phone}
                              </div>
                            )}
                          </div>
                          <div className="ml-6 flex flex-col items-end">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              <span className="ml-1">{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                            </span>
                            <div className="mt-2 flex items-center text-lg font-semibold text-gray-900">
                              <CreditCard className="h-4 w-4 mr-1" />
                              LKR {booking.totalAmount?.toLocaleString() || '0'}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              Payment: {booking.paymentStatus?.charAt(0).toUpperCase() + booking.paymentStatus?.slice(1)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end space-x-3">
                          <button 
                            onClick={() => handleViewGuideDetails(booking)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </button>
                          {booking.status === 'completed' && (
                            <button 
                              onClick={() => handleWriteReview(booking)}
                              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Write Review
                            </button>
                          )}
                          {booking.status === 'pending' && (
                            <button className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                              Cancel
                            </button>
                          )}
                          {booking.status === 'confirmed' && booking.paymentStatus === 'pending' && (
                            <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                              <CreditCard className="h-4 w-4 mr-2" />
                              Pay Now
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Trip Details Modal */}
      {showDetailsModal && selectedTrip && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {selectedTrip.vehicle ? (
                    <Car className="h-6 w-6 text-primary mr-2" />
                  ) : selectedTrip.guide ? (
                    <User className="h-6 w-6 text-primary mr-2" />
                  ) : (
                    <Sparkles className="h-6 w-6 text-primary mr-2" />
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedTrip.vehicle 
                      ? 'Vehicle Booking Details' 
                      : selectedTrip.guide
                      ? 'Guide Booking Details'
                      : selectedTrip.status === 'pending' 
                        ? 'Trip Request Details' 
                        : 'Approved Trip Details'
                    }
                  </h3>
                </div>
                <button
                  onClick={closeDetailsModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTrip.bookingStatus || selectedTrip.status)}`}>
                  {getStatusIcon(selectedTrip.bookingStatus || selectedTrip.status)}
                  <span className="ml-2">{(selectedTrip.bookingStatus || selectedTrip.status).charAt(0).toUpperCase() + (selectedTrip.bookingStatus || selectedTrip.status).slice(1)}</span>
                </span>
              </div>

              {/* Trip Details Content */}
              <div className="space-y-4">
                {selectedTrip.vehicle ? (
                  /* Vehicle Booking Details */
                  <div className="space-y-6">
                    {/* Vehicle Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Vehicle Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <Car className="h-4 w-4 mr-2 text-gray-500" />
                            <span><strong>Vehicle:</strong> {selectedTrip.vehicle?.name || `${selectedTrip.vehicle?.make} ${selectedTrip.vehicle?.model}`}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-gray-500" />
                            <span><strong>Capacity:</strong> {selectedTrip.vehicle?.capacity?.passengers || 'N/A'} passengers</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                            <span><strong>Type:</strong> {selectedTrip.vehicle?.vehicleType || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                            <span><strong>Fuel Type:</strong> {selectedTrip.vehicle?.fuelType || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Booking Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            <span><strong>Start Date:</strong> {formatDate(selectedTrip.tripDetails?.startDate)}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            <span><strong>End Date:</strong> {formatDate(selectedTrip.tripDetails?.endDate)}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                            <span><strong>Pickup Location:</strong> {selectedTrip.tripDetails?.pickupLocation?.city || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-gray-500" />
                            <span><strong>Passengers:</strong> {(selectedTrip.passengers?.adults || 0) + (selectedTrip.passengers?.children || 0) + (selectedTrip.passengers?.infants || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pricing Information */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Pricing Details</h4>
                      <div className="space-y-2 text-sm text-blue-800">
                        <div className="flex justify-between">
                          <span><strong>Daily Rate:</strong></span>
                          <span>{selectedTrip.pricing?.currency || 'LKR'} {selectedTrip.pricing?.dailyRate?.toLocaleString() || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span><strong>Duration:</strong></span>
                          <span>{selectedTrip.pricing?.duration || 'N/A'} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span><strong>Subtotal:</strong></span>
                          <span>{selectedTrip.pricing?.currency || 'LKR'} {selectedTrip.pricing?.subtotal?.toLocaleString() || 'N/A'}</span>
                        </div>
                        {selectedTrip.pricing?.additionalServices && selectedTrip.pricing.additionalServices.length > 0 && (
                          <div>
                            <strong>Additional Services:</strong>
                            <ul className="ml-4 mt-1">
                              {selectedTrip.pricing.additionalServices.map((service, idx) => (
                                <li key={idx} className="flex justify-between">
                                  <span>{service.name}</span>
                                  <span>{selectedTrip.pricing?.currency || 'LKR'} {service.price?.toLocaleString()}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-blue-300 pt-2 font-semibold">
                          <span><strong>Total Price:</strong></span>
                          <span>{selectedTrip.pricing?.currency || 'LKR'} {selectedTrip.pricing?.totalPrice?.toLocaleString() || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    {(selectedTrip.tripDetails?.specialRequests || selectedTrip.tripDetails?.notes) && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Additional Information</h4>
                        <div className="space-y-2 text-sm">
                          {selectedTrip.tripDetails?.specialRequests && (
                            <div><strong>Special Requests:</strong> {selectedTrip.tripDetails.specialRequests}</div>
                          )}
                          {selectedTrip.tripDetails?.notes && (
                            <div><strong>Notes:</strong> {selectedTrip.tripDetails.notes}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Booking Reference */}
                    {selectedTrip.bookingReference && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <CreditCard className="h-5 w-5 text-gray-600 mr-2" />
                          <div>
                            <h4 className="font-semibold text-gray-900">Booking Reference</h4>
                            <p className="text-sm text-gray-600 mt-1">{selectedTrip.bookingReference}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status Information */}
                    <div className={`border rounded-lg p-4 ${
                      selectedTrip.bookingStatus === 'confirmed' 
                        ? 'bg-green-50 border-green-200' 
                        : selectedTrip.bookingStatus === 'pending'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex">
                        {selectedTrip.bookingStatus === 'confirmed' ? (
                          <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                        ) : selectedTrip.bookingStatus === 'pending' ? (
                          <Clock className="h-5 w-5 text-yellow-400 mr-2" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-gray-400 mr-2" />
                        )}
                        <div>
                          <h4 className={`text-sm font-medium ${
                            selectedTrip.bookingStatus === 'confirmed' 
                              ? 'text-green-800' 
                              : selectedTrip.bookingStatus === 'pending'
                              ? 'text-yellow-800'
                              : 'text-gray-800'
                          }`}>
                            {selectedTrip.bookingStatus === 'confirmed' 
                              ? 'Booking Confirmed' 
                              : selectedTrip.bookingStatus === 'pending'
                              ? 'Booking Pending'
                              : 'Booking Status'
                            }
                          </h4>
                          <p className={`text-sm mt-1 ${
                            selectedTrip.bookingStatus === 'confirmed' 
                              ? 'text-green-700' 
                              : selectedTrip.bookingStatus === 'pending'
                              ? 'text-yellow-700'
                              : 'text-gray-700'
                          }`}>
                            {selectedTrip.bookingStatus === 'confirmed' 
                              ? 'Your vehicle booking has been confirmed. You will receive a confirmation email shortly.' 
                              : selectedTrip.bookingStatus === 'pending'
                              ? 'Your vehicle booking is being processed. We will contact you within 24 hours.'
                              : 'Please contact support for more information about your booking.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : selectedTrip.guide ? (
                  /* Guide Booking Details */
                  <div className="space-y-6">
                    {/* Guide Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Guide Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-500" />
                            <span><strong>Name:</strong> {selectedTrip.guide?.firstName} {selectedTrip.guide?.lastName}</span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-500" />
                            <span><strong>Phone:</strong> {selectedTrip.guide?.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                            <span><strong>Email:</strong> {selectedTrip.guide?.email || 'N/A'}</span>
                          </div>
                          {selectedTrip.guide?.specializations && selectedTrip.guide.specializations.length > 0 && (
                            <div className="flex items-center">
                              <Star className="h-4 w-4 mr-2 text-gray-500" />
                              <span><strong>Specializations:</strong> {selectedTrip.guide.specializations.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Booking Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            <span><strong>Start Date:</strong> {formatDate(selectedTrip.startDate)}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            <span><strong>End Date:</strong> {formatDate(selectedTrip.endDate)}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-500" />
                            <span><strong>Duration:</strong> {selectedTrip.duration?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-gray-500" />
                            <span><strong>Group Size:</strong> {selectedTrip.groupSize} {selectedTrip.groupSize === 1 ? 'person' : 'people'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pricing Information */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Pricing Details</h4>
                      <div className="space-y-2 text-sm text-blue-800">
                        <div className="flex justify-between">
                          <span><strong>Total Amount:</strong></span>
                          <span>LKR {selectedTrip.totalAmount?.toLocaleString() || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span><strong>Payment Status:</strong></span>
                          <span className={`font-medium ${
                            selectedTrip.paymentStatus === 'paid' ? 'text-green-600' : 
                            selectedTrip.paymentStatus === 'pending' ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {selectedTrip.paymentStatus?.charAt(0).toUpperCase() + selectedTrip.paymentStatus?.slice(1) || 'N/A'}
                          </span>
                        </div>
                        {selectedTrip.paymentStatus === 'pending' && (
                          <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded">
                            <p className="text-xs text-yellow-800">
                              <strong>Note:</strong> Payment is pending. Complete your payment to confirm your guide booking.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Special Requests */}
                    {selectedTrip.specialRequests && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Special Requests</h4>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <p className="text-sm text-gray-700">{selectedTrip.specialRequests}</p>
                        </div>
                      </div>
                    )}

                    {/* Guide Contact Information */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <Phone className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-900">Contact Your Guide</h4>
                          <div className="mt-2 space-y-1 text-sm text-green-800">
                            <p><strong>Phone:</strong> {selectedTrip.guide?.phone || 'Contact information not available'}</p>
                            <p><strong>Email:</strong> {selectedTrip.guide?.email || 'Contact information not available'}</p>
                            {selectedTrip.guide?.languages && selectedTrip.guide.languages.length > 0 && (
                              <p><strong>Languages:</strong> {selectedTrip.guide.languages.join(', ')}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Information */}
                    <div className={`border rounded-lg p-4 ${
                      selectedTrip.status === 'confirmed' 
                        ? 'bg-green-50 border-green-200' 
                        : selectedTrip.status === 'pending'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex">
                        {selectedTrip.status === 'confirmed' ? (
                          <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                        ) : selectedTrip.status === 'pending' ? (
                          <Clock className="h-5 w-5 text-yellow-400 mr-2" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-gray-400 mr-2" />
                        )}
                        <div>
                          <h4 className={`text-sm font-medium ${
                            selectedTrip.status === 'confirmed' 
                              ? 'text-green-800' 
                              : selectedTrip.status === 'pending'
                              ? 'text-yellow-800'
                              : 'text-gray-800'
                          }`}>
                            {selectedTrip.status === 'confirmed' 
                              ? 'Booking Confirmed' 
                              : selectedTrip.status === 'pending'
                              ? 'Booking Pending'
                              : 'Booking Status'
                            }
                          </h4>
                          <p className={`text-sm mt-1 ${
                            selectedTrip.status === 'confirmed' 
                              ? 'text-green-700' 
                              : selectedTrip.status === 'pending'
                              ? 'text-yellow-700'
                              : 'text-gray-700'
                          }`}>
                            {selectedTrip.status === 'confirmed' 
                              ? 'Your guide booking has been confirmed. Your guide will contact you soon.' 
                              : selectedTrip.status === 'pending'
                              ? 'Your guide booking is being processed. We will contact you within 24 hours.'
                              : 'Please contact support for more information about your booking.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : selectedTrip.status === 'pending' ? (
                  /* Pending Trip - Show Customer Request Details */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Trip Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            <span><strong>Dates:</strong> {new Date(selectedTrip.startDate).toLocaleDateString()} - {new Date(selectedTrip.endDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-gray-500" />
                            <span><strong>Group Size:</strong> {selectedTrip.groupSize} {selectedTrip.groupSize === 1 ? 'person' : 'people'}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                            <span><strong>Destination:</strong> {selectedTrip.requestDetails?.destination || 'Not specified'}</span>
                          </div>
                          {selectedTrip.requestDetails?.destinations && selectedTrip.requestDetails.destinations.length > 0 && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                              <span><strong>Places to Visit:</strong> {selectedTrip.requestDetails.destinations.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Preferences</h4>
                        <div className="space-y-2 text-sm">
                          <div><strong>Budget:</strong> LKR {selectedTrip.requestDetails?.budget || 'Not specified'}</div>
                          <div><strong>Accommodation:</strong> {selectedTrip.requestDetails?.accommodation || 'Not specified'}</div>
                          {selectedTrip.requestDetails?.interests && selectedTrip.requestDetails.interests.length > 0 && (
                            <div><strong>Interests:</strong> {selectedTrip.requestDetails.interests.join(', ')}</div>
                          )}
                          {selectedTrip.requestDetails?.transport && selectedTrip.requestDetails.transport.length > 0 && (
                            <div><strong>Transport:</strong> {selectedTrip.requestDetails.transport.join(', ')}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {(selectedTrip.requestDetails?.specialRequests || selectedTrip.requestDetails?.dietaryRequirements || selectedTrip.requestDetails?.accessibility) && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Special Requirements</h4>
                        <div className="space-y-2 text-sm">
                          {selectedTrip.requestDetails?.specialRequests && (
                            <div><strong>Special Requests:</strong> {selectedTrip.requestDetails.specialRequests}</div>
                          )}
                          {selectedTrip.requestDetails?.dietaryRequirements && (
                            <div><strong>Dietary Requirements:</strong> {selectedTrip.requestDetails.dietaryRequirements}</div>
                          )}
                          {selectedTrip.requestDetails?.accessibility && (
                            <div><strong>Accessibility:</strong> {selectedTrip.requestDetails.accessibility}</div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <div className="flex">
                        <Clock className="h-5 w-5 text-yellow-400 mr-2" />
                        <div>
                          <h4 className="text-sm font-medium text-yellow-800">Under Review</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            Your custom trip request is being reviewed by our staff. We will contact you within 24 hours with a personalized itinerary and pricing.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Approved Trip - Show Staff Updated Details */
                  <div className="space-y-6">
                    {/* Trip Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Trip Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            <span><strong>Dates:</strong> {
                              selectedTrip.requestDetails?.startDate && selectedTrip.requestDetails?.endDate 
                                ? `${new Date(selectedTrip.requestDetails.startDate).toLocaleDateString()} - ${new Date(selectedTrip.requestDetails.endDate).toLocaleDateString()}`
                                : 'Dates not specified'
                            }</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-gray-500" />
                            <span><strong>Group Size:</strong> {selectedTrip.requestDetails?.groupSize || 'Not specified'} {selectedTrip.requestDetails?.groupSize === 1 ? 'person' : 'people'}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                            <span><strong>Destination:</strong> {selectedTrip.requestDetails?.destination || 'Not specified'}</span>
                          </div>
                          {selectedTrip.requestDetails?.destinations && selectedTrip.requestDetails.destinations.length > 0 && (
                            <div className="mt-2">
                              <p className="font-medium">Places to Visit:</p>
                              <ul className="list-disc list-inside ml-4">
                                {selectedTrip.requestDetails.destinations.map((dest, idx) => (
                                  <li key={idx}>{dest}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Pricing</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                            <span><strong>Total Cost:</strong> LKR {selectedTrip.staffAssignment?.totalBudget?.totalAmount?.toLocaleString() || 'TBD'}</span>
                          </div>
                          {selectedTrip.staffAssignment?.totalBudget && (
                            <div>
                              <strong>Cost Breakdown:</strong>
                              <ul className="ml-4 mt-1 space-y-1">
                                {selectedTrip.staffAssignment.totalBudget.guideFees > 0 && <li>Guide Fees: LKR {selectedTrip.staffAssignment.totalBudget.guideFees.toLocaleString()}</li>}
                                {selectedTrip.staffAssignment.totalBudget.vehicleCosts > 0 && <li>Vehicle Costs: LKR {selectedTrip.staffAssignment.totalBudget.vehicleCosts.toLocaleString()}</li>}
                                {selectedTrip.staffAssignment.totalBudget.hotelCosts > 0 && <li>Hotel Costs: LKR {selectedTrip.staffAssignment.totalBudget.hotelCosts.toLocaleString()}</li>}
                                {selectedTrip.staffAssignment.totalBudget.activityCosts > 0 && <li>Activity Costs: LKR {selectedTrip.staffAssignment.totalBudget.activityCosts.toLocaleString()}</li>}
                                {selectedTrip.staffAssignment.totalBudget.additionalFees > 0 && <li>Additional Fees: LKR {selectedTrip.staffAssignment.totalBudget.additionalFees.toLocaleString()}</li>}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Staff Assigned Resources */}
                    {selectedTrip.staffAssignment && (
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Assigned Resources</h4>
                        
                        {/* Assigned Guide */}
                        {selectedTrip.staffAssignment.assignedGuide && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start">
                              <User className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                              <div className="flex-1">
                                <h5 className="font-semibold text-blue-900">Your Guide</h5>
                                <div className="mt-2 space-y-1 text-sm text-blue-800">
                                  <p><strong>Name:</strong> {selectedTrip.staffAssignment.assignedGuide.firstName} {selectedTrip.staffAssignment.assignedGuide.lastName}</p>
                                  <p className="flex items-center"><Phone className="h-4 w-4 mr-1" /><strong>Phone:</strong> {selectedTrip.staffAssignment.assignedGuide.phone}</p>
                                  <p><strong>Email:</strong> {selectedTrip.staffAssignment.assignedGuide.email}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Hotel Bookings */}
                        {selectedTrip.staffAssignment.hotelBookings && selectedTrip.staffAssignment.hotelBookings.length > 0 && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start">
                              <Building className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                              <div className="flex-1">
                                <h5 className="font-semibold text-green-900">Accommodation</h5>
                                <div className="mt-2 space-y-3">
                                  {selectedTrip.staffAssignment.hotelBookings.map((booking, idx) => (
                                    <div key={idx} className="bg-white rounded-md p-3 border border-green-200">
                                      <div className="space-y-1 text-sm text-green-800">
                                        <p><strong>Hotel:</strong> {booking.hotel?.name || booking.hotelName || 'Hotel name not specified'}</p>
                                        <p className="flex items-center"><LocationIcon className="h-4 w-4 mr-1" /><strong>Location:</strong> {booking.hotel?.location?.city || booking.city || booking.location || 'Location not specified'}</p>
                                        {booking.hotel?.starRating && (
                                          <p className="flex items-center"><Star className="h-4 w-4 mr-1" /><strong>Rating:</strong> {booking.hotel.starRating} stars</p>
                                        )}
                                        <p><strong>Room Type:</strong> {booking.roomType}</p>
                                        <p><strong>Check-in:</strong> {new Date(booking.checkInDate).toLocaleDateString()}</p>
                                        <p><strong>Check-out:</strong> {new Date(booking.checkOutDate).toLocaleDateString()}</p>
                                        <p><strong>Nights:</strong> {booking.nights}</p>
                                        <p><strong>Rooms:</strong> {booking.rooms}</p>
                                        <p><strong>Total Price:</strong> LKR {booking.totalPrice?.toLocaleString() || booking.pricePerNight * booking.nights * booking.rooms || 'Price not calculated'}</p>
                                        {booking.specialRequests && (
                                          <p><strong>Special Requests:</strong> {booking.specialRequests}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Assigned Vehicles */}
                        {selectedTrip.staffAssignment.assignedVehicles && selectedTrip.staffAssignment.assignedVehicles.length > 0 && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-start">
                              <Car className="h-5 w-5 text-purple-600 mr-3 mt-0.5" />
                              <div className="flex-1">
                                <h5 className="font-semibold text-purple-900">Transportation</h5>
                                <div className="mt-2 space-y-3">
                                  {selectedTrip.staffAssignment.assignedVehicles.map((vehicle, idx) => (
                                    <div key={idx} className="bg-white rounded-md p-3 border border-purple-200">
                                      <div className="space-y-1 text-sm text-purple-800">
                                        <p><strong>Vehicle:</strong> {vehicle.vehicleId?.type || vehicle.vehicleType || 'Vehicle type'} - {vehicle.vehicleId?.model || vehicle.model || 'Model not specified'}</p>
                                        <p><strong>Capacity:</strong> {vehicle.vehicleId?.capacity || vehicle.capacity || 'Capacity not specified'} passengers</p>
                                        <p><strong>Daily Rate:</strong> LKR {vehicle.dailyRate?.toLocaleString()}</p>
                                        <p><strong>Total Days:</strong> {vehicle.totalDays}</p>
                                        {vehicle.driver && (
                                          <div className="mt-2 pt-2 border-t border-purple-200">
                                            <p><strong>Driver:</strong> {vehicle.driver.firstName} {vehicle.driver.lastName}</p>
                                            <p className="flex items-center"><Phone className="h-4 w-4 mr-1" /><strong>Phone:</strong> {vehicle.driver.phone}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Detailed Itinerary */}
                    {selectedTrip.staffAssignment?.itinerary && selectedTrip.staffAssignment.itinerary.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Detailed Itinerary</h4>
                        <div className="space-y-3">
                          {selectedTrip.staffAssignment.itinerary.map((day, index) => (
                            <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start">
                                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold mr-3">
                                  {day.day}
                                </div>
                                <div className="flex-1">
                                  <div className="space-y-2 text-sm">
                                    {day.date && (
                                      <p className="flex items-center text-gray-600">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        <strong>Date:</strong> {new Date(day.date).toLocaleDateString()}
                                      </p>
                                    )}
                                    {day.location && (
                                      <p className="flex items-center text-gray-600">
                                        <MapPin className="h-4 w-4 mr-2" />
                                        <strong>Location:</strong> {day.location}
                                      </p>
                                    )}
                                    {day.activities && day.activities.length > 0 && (
                                      <div>
                                        <p className="font-medium text-gray-700">Activities:</p>
                                        <ul className="list-disc list-inside ml-4 text-gray-600">
                                          {day.activities.map((activity, idx) => (
                                            <li key={idx}>{activity}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {day.accommodation && (
                                      <p><strong>Accommodation:</strong> {day.accommodation}</p>
                                    )}
                                    {day.meals && day.meals.length > 0 && (
                                      <div>
                                        <p className="font-medium text-gray-700">Meals:</p>
                                        <ul className="list-disc list-inside ml-4 text-gray-600">
                                          {day.meals.map((meal, idx) => (
                                            <li key={idx}>{meal}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {day.transport && (
                                      <p><strong>Transport:</strong> {day.transport}</p>
                                    )}
                                    {day.notes && (
                                      <p className="text-gray-600 italic">"{day.notes}"</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Staff Comments and Additional Notes */}
                    {(selectedTrip.staffAssignment?.staffComments || selectedTrip.staffAssignment?.additionalNotes) && (
                      <div className="space-y-3">
                        {selectedTrip.staffAssignment.staffComments && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Staff Comments</h4>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <p className="text-sm text-yellow-800">{selectedTrip.staffAssignment.staffComments}</p>
                            </div>
                          </div>
                        )}
                        {selectedTrip.staffAssignment.additionalNotes && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Additional Notes</h4>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <p className="text-sm text-gray-700">{selectedTrip.staffAssignment.additionalNotes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ready to Confirm */}
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="flex">
                        <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                        <div>
                          <h4 className="text-sm font-medium text-green-800">Ready to Confirm</h4>
                          <p className="text-sm text-green-700 mt-1">
                            Your custom trip has been approved! Click "Confirm & Pay" to secure your booking.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={closeDetailsModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Close
                </button>
                {selectedTrip.status === 'approved' && (
                  <button
                    onClick={() => {
                      closeDetailsModal()
                      handleConfirmCustomTrip(selectedTrip)
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm & Pay
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && selectedBookingForReview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 my-4">
            <ReviewForm
              guideId={selectedBookingForReview.guide?._id || selectedBookingForReview.guide}
              tourId={selectedBookingForReview.tour?._id || 'guide-service'} // Use guide service as tour for direct guide bookings
              bookingId={selectedBookingForReview._id}
              onReviewSubmitted={handleReviewSubmitted}
              onCancel={() => {
                setShowReviewForm(false)
                setSelectedBookingForReview(null)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default MyBookings

