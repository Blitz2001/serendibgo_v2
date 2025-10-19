import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, useParams } from 'react-router-dom'
import { Calendar, MapPin, Users, CreditCard, CheckCircle, Loader2, AlertCircle, Info } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const Booking = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { tourId } = useParams() // Get tourId from URL params
  const { user, isAuthenticated } = useAuth()
  const vehicleId = searchParams.get('vehicle')
  
  const [vehicle, setVehicle] = useState(null)
  const [tour, setTour] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [dateErrors, setDateErrors] = useState({
    startDate: '',
    endDate: ''
  })
  const [formData, setFormData] = useState({
    // Trip Details (for vehicles)
    pickupLocation: {
      address: '',
      city: '',
      district: ''
    },
    dropoffLocation: {
      address: '',
      city: '',
      district: ''
    },
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    
    // Tour Details (for tours)
    tourDate: '',
    participants: 1,
    
    // Passengers
    adults: 1,
    children: 0,
    infants: 0,
    
    // Guest Details
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Special Requests
    specialRequests: ''
  })

  // Fetch vehicle or tour details
  useEffect(() => {
    const fetchData = async () => {
      if (vehicleId) {
        // Fetch vehicle details
        try {
          const response = await api.get(`/vehicles/${vehicleId}`)
          setVehicle(response.data.data)
        } catch (error) {
          console.error('Error fetching vehicle:', error)
          toast.error('Failed to load vehicle details')
          navigate('/vehicles')
        } finally {
          setLoading(false)
        }
      } else if (tourId) {
        // Fetch tour details
        try {
          const response = await api.get(`/tours/${tourId}`)
          setTour(response.data.data)
        } catch (error) {
          console.error('Error fetching tour:', error)
          toast.error('Failed to load tour details')
          navigate('/tours')
        } finally {
          setLoading(false)
        }
      } else {
        toast.error('No vehicle or tour selected')
        navigate('/')
        return
      }
    }

    fetchData()
  }, [vehicleId, tourId, navigate])

  // Pre-fill user details if logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || ''
      }))
    }
  }, [isAuthenticated, user])

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to book a vehicle')
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  // Validate vehicle booking dates
  const validateVehicleDates = (startDate, endDate) => {
    const errors = { startDate: '', endDate: '' }
    let isValid = true

    if (!startDate) {
      errors.startDate = 'Please select a start date'
      isValid = false
    } else {
      const start = new Date(startDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (start < today) {
        errors.startDate = 'Start date cannot be in the past'
        isValid = false
      }

      // Check if start date is more than 1 year in advance
      const oneYearFromNow = new Date()
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
      if (start > oneYearFromNow) {
        errors.startDate = 'Start date cannot be more than 1 year in advance'
        isValid = false
      }
    }

    if (!endDate) {
      errors.endDate = 'Please select an end date'
      isValid = false
    } else {
      const end = new Date(endDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (end < today) {
        errors.endDate = 'End date cannot be in the past'
        isValid = false
      }

      // Check if end date is more than 1 year in advance
      const oneYearFromNow = new Date()
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
      if (end > oneYearFromNow) {
        errors.endDate = 'End date cannot be more than 1 year in advance'
        isValid = false
      }
    }

    // Check if end date is before start date
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      if (end < start) {
        errors.endDate = 'End date must be after start date'
        isValid = false
      }

      // Check if rental period is too long (more than 30 days)
      const diffTime = Math.abs(end - start)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays > 30) {
        errors.endDate = 'Rental period cannot exceed 30 days'
        isValid = false
      }
    }

    setDateErrors(errors)
    return isValid
  }

  // Handle date input changes with validation
  const handleDateChange = (e) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Validate dates when both are present
    if (name === 'startDate') {
      validateVehicleDates(value, formData.endDate)
    } else if (name === 'endDate') {
      validateVehicleDates(formData.startDate, value)
    }
  }

  const calculatePrice = () => {
    if (vehicle?.pricing) {
      // Vehicle pricing calculation
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)
      const hours = Math.ceil((endDate - startDate) / (1000 * 60 * 60))
      
      const basePrice = vehicle.pricing.basePrice || 0
      const hourlyRate = vehicle.pricing.hourlyRate || 0
      const dailyRate = vehicle.pricing.dailyRate || 0
      
      // Use daily rate if more than 8 hours, otherwise hourly
      const durationPrice = hours > 8 ? dailyRate : (hours * hourlyRate)
      const subtotal = basePrice + durationPrice
      const taxes = subtotal * 0.1 // 10% tax
      const serviceCharge = subtotal * 0.05 // 5% service charge
      
      return subtotal + taxes + serviceCharge
    } else if (tour?.price) {
      // Tour pricing calculation
      const basePrice = tour.price * parseInt(formData.participants)
      const taxes = basePrice * 0.1 // 10% tax
      const serviceCharge = basePrice * 0.05 // 5% service charge
      
      return basePrice + taxes + serviceCharge
    }
    
    return 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!vehicle && !tour) {
      toast.error('Vehicle or tour not found')
      return
    }

    // Validate vehicle dates if booking a vehicle
    if (vehicle && !validateVehicleDates(formData.startDate, formData.endDate)) {
      toast.error('Please fix the date errors before submitting')
      return
    }

    setSubmitting(true)
    
    try {
      let bookingData, response
      
      if (vehicle) {
        // Vehicle booking
        bookingData = {
          vehicle: vehicleId,
          tripDetails: {
            pickupLocation: formData.pickupLocation,
            dropoffLocation: formData.dropoffLocation,
            startDate: new Date(formData.startDate).toISOString(),
            endDate: new Date(formData.endDate).toISOString(),
            startTime: formData.startTime,
            endTime: formData.endTime
          },
          passengers: {
            adults: parseInt(formData.adults),
            children: parseInt(formData.children),
            infants: parseInt(formData.infants)
          },
          guestDetails: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone
          },
          specialRequests: formData.specialRequests
        }
        
        response = await api.post('/vehicle-bookings', bookingData)
      } else if (tour) {
        // Tour booking
        bookingData = {
          tourId: tourId,
          startDate: new Date(formData.tourDate).toISOString(),
          endDate: new Date(formData.tourDate).toISOString(), // Same day for tours
          groupSize: parseInt(formData.participants),
          specialRequests: formData.specialRequests
        }
        
        response = await api.post('/bookings', bookingData)
      }
      
      if (response.data.status === 'success') {
        const booking = response.data.data.booking || response.data.data
        const totalAmount = calculatePrice()
        
        console.log('=== BOOKING CREATED ===')
        console.log('Response data:', response.data)
        console.log('Booking object:', booking)
        console.log('Booking ID:', booking?._id)
        console.log('Total amount:', totalAmount)
        
        // Navigate to payment page
        navigate('/payment', {
          state: {
            bookingId: booking._id,
            bookingType: vehicle ? 'vehicle' : 'tour',
            amount: totalAmount,
            currency: 'LKR',
            serviceName: vehicle ? (vehicle.make + ' ' + vehicle.model) : tour.title,
            serviceDescription: vehicle ? vehicle.description : tour.description,
            startDate: vehicle ? formData.startDate : formData.tourDate,
            endDate: vehicle ? formData.endDate : formData.tourDate,
            groupSize: vehicle ? (parseInt(formData.adults) + parseInt(formData.children) + parseInt(formData.infants)) : formData.participants,
            guestDetails: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone
            }
          }
        })
      } else {
        toast.error(response.data.message || 'Failed to create booking')
      }
      
    } catch (error) {
      console.error('Booking error:', error)
      console.error('Error response:', error.response?.data)
      toast.error(error.response?.data?.message || 'Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading details...</span>
      </div>
    )
  }

  if (!vehicle && !tour) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Service not found</h2>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {vehicle ? 'Book Vehicle' : 'Book Tour'}
          </h1>
          <p className="text-gray-600">
            {vehicle ? 'Complete your vehicle rental booking' : 'Complete your tour booking'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Service Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {vehicle ? vehicle.name : tour.title}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {vehicle ? vehicle.vehicleType : tour.category}
                  </p>
                </div>
                
                {(vehicle?.images || tour?.images) && (vehicle?.images?.length > 0 || tour?.images?.length > 0) && (
                  <div className="h-32 bg-gray-200 rounded-lg overflow-hidden">
                    <img 
                      src={vehicle ? (vehicle.images[0].url || vehicle.images[0]) : (tour.images[0].url || tour.images[0])} 
                      alt={vehicle ? vehicle.name : tour.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Estimated Total:</span>
                    <span className="text-lg font-semibold text-primary">
                      LKR {calculatePrice().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Service Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    {vehicle ? 'Trip Details' : 'Tour Details'}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vehicle ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              name="startDate"
                              value={formData.startDate}
                              onChange={handleDateChange}
                              min={new Date().toISOString().split('T')[0]}
                              required
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary ${
                                dateErrors.startDate 
                                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                                  : 'border-gray-300 focus:border-primary'
                              }`}
                            />
                            {dateErrors.startDate && (
                              <div className="absolute -bottom-6 left-0 text-red-500 text-sm flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {dateErrors.startDate}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            Select today or future date
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              name="endDate"
                              value={formData.endDate}
                              onChange={handleDateChange}
                              min={formData.startDate || new Date().toISOString().split('T')[0]}
                              required
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary ${
                                dateErrors.endDate 
                                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                                  : 'border-gray-300 focus:border-primary'
                              }`}
                            />
                            {dateErrors.endDate && (
                              <div className="absolute -bottom-6 left-0 text-red-500 text-sm flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {dateErrors.endDate}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            Must be after start date (max 30 days)
                          </div>
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tour Date
                        </label>
                        <input
                          type="date"
                          name="tourDate"
                          value={formData.tourDate}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>
                    )}
                    
                    {vehicle && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Time
                          </label>
                      <input
                        type="time"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Pickup Location (for vehicles) or Participants (for tours) */}
                {vehicle ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Pickup Location
                    </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        name="pickupLocation.address"
                        value={formData.pickupLocation.address}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Enter pickup address"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          name="pickupLocation.city"
                          value={formData.pickupLocation.city}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          placeholder="City"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          District
                        </label>
                        <input
                          type="text"
                          name="pickupLocation.district"
                          value={formData.pickupLocation.district}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          placeholder="District"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Participants
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Participants
                      </label>
                      <input
                        type="number"
                        name="participants"
                        value={formData.participants}
                        onChange={handleInputChange}
                        min="1"
                        max={tour?.maxParticipants || 20}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Maximum: {tour?.maxParticipants || 20} participants
                      </p>
                    </div>
                  </div>
                )}

                {/* Dropoff Location (vehicles only) */}
                {vehicle && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Dropoff Location</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        name="dropoffLocation.address"
                        value={formData.dropoffLocation.address}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Enter dropoff address"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          name="dropoffLocation.city"
                          value={formData.dropoffLocation.city}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          placeholder="City"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          District
                        </label>
                        <input
                          type="text"
                          name="dropoffLocation.district"
                          value={formData.dropoffLocation.district}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          placeholder="District"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                )}

                {/* Passengers (vehicles only) */}
                {vehicle && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Passengers
                    </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adults
                      </label>
                      <input
                        type="number"
                        name="adults"
                        value={formData.adults}
                        onChange={handleInputChange}
                        min="1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Children
                      </label>
                      <input
                        type="number"
                        name="children"
                        value={formData.children}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Infants
                      </label>
                      <input
                        type="number"
                        name="infants"
                        value={formData.infants}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
                )}

                {/* Guest Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Special Requests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Requests
                  </label>
                  <textarea
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Any special requests or notes..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => navigate('/vehicles')}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Booking...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete Booking
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Booking
