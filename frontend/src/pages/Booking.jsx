import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, CreditCard, CheckCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const Booking = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const vehicleId = searchParams.get('vehicle')
  
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    // Trip Details
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

  // Fetch vehicle details
  useEffect(() => {
    const fetchVehicle = async () => {
      if (!vehicleId) {
        toast.error('No vehicle selected')
        navigate('/vehicles')
        return
      }
      
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
    }

    fetchVehicle()
  }, [vehicleId, navigate])

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

  const calculatePrice = () => {
    if (!vehicle?.pricing) return 0
    
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
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!vehicle) {
      toast.error('Vehicle not found')
      return
    }

    setSubmitting(true)
    
    try {
      const bookingData = {
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

      const response = await api.post('/vehicle-bookings', bookingData)
      
      if (response.data.status === 'success') {
        const booking = response.data.data.booking || response.data.data
        const totalAmount = calculatePrice()
        
        console.log('=== VEHICLE BOOKING CREATED ===')
        console.log('Response data:', response.data)
        console.log('Booking object:', booking)
        console.log('Booking ID:', booking?._id)
        console.log('Total amount:', totalAmount)
        
        // Navigate to payment page
        navigate('/payment', {
          state: {
            bookingId: booking._id,
            bookingType: 'vehicle',
            amount: totalAmount,
            currency: 'LKR',
            vehicleName: vehicle.make + ' ' + vehicle.model,
            vehicleType: vehicle.type,
            pickupLocation: formData.pickupLocation.address,
            dropoffLocation: formData.dropoffLocation.address,
            pickupDateTime: formData.startDate,
            dropoffDateTime: formData.endDate,
            passengers: parseInt(formData.adults) + parseInt(formData.children) + parseInt(formData.infants),
            bookingReference: booking.bookingReference
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
        <span className="ml-2 text-gray-600">Loading vehicle details...</span>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Vehicle not found</h2>
          <button 
            onClick={() => navigate('/vehicles')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Back to Vehicles
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Vehicle</h1>
          <p className="text-gray-600">Complete your vehicle rental booking</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Vehicle Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{vehicle.name}</h4>
                  <p className="text-sm text-gray-500">{vehicle.vehicleType}</p>
                </div>
                
                {vehicle.images && vehicle.images.length > 0 && (
                  <div className="h-32 bg-gray-200 rounded-lg overflow-hidden">
                    <img 
                      src={vehicle.images[0].url || vehicle.images[0]} 
                      alt={vehicle.name}
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
                {/* Trip Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Trip Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    
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
                  </div>
                </div>

                {/* Pickup Location */}
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

                {/* Dropoff Location */}
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

                {/* Passengers */}
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
