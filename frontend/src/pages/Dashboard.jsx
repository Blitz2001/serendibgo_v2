import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  Calendar, 
  MapPin, 
  Star, 
  Users, 
  Car, 
  Building, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Heart,
  ArrowRight
} from 'lucide-react'
import api from '../services/api'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Real data from database
  const [dashboardData, setDashboardData] = useState({
    recentBookings: [],
    recommendations: [],
    stats: {
      totalBookings: 0,
      completedTrips: 0,
      totalSpent: 0,
      favoriteDestination: 'N/A'
    },
    upcomingTrips: []
  })
  
  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    let bookingsResponse, toursResponse, hotelsResponse, vehiclesResponse
    
    try {
      setLoading(true)
      setError(null)
      
      // Fetch all dashboard data in parallel
      const responses = await Promise.all([
        api.get('/bookings/user'),
        api.get('/tours?isFeatured=true&limit=3'),
        api.get('/hotels?featured=true&limit=3'),
        api.get('/vehicles?featured=true&limit=3')
      ])
      
      // Destructure the responses
      bookingsResponse = responses[0]
      toursResponse = responses[1]
      hotelsResponse = responses[2]
      vehiclesResponse = responses[3]

      // Debug API responses
      console.log('API Responses Debug:', {
        bookings: bookingsResponse.data,
        tours: toursResponse.data,
        hotels: hotelsResponse.data,
        vehicles: vehiclesResponse.data
      })

      // Process bookings data
      const bookings = bookingsResponse.data.success ? bookingsResponse.data.data.bookings : []
      const recentBookings = bookings.slice(0, 3).map(booking => ({
        id: booking._id,
        type: booking.type || 'tour',
        title: booking.tour?.title || booking.hotel?.name || booking.vehicle?.name || 'Booking',
        date: booking.startDate || booking.checkInDate || booking.createdAt,
        status: booking.status || 'pending',
        price: booking.totalAmount || booking.pricing?.totalPrice || 0,
        image: booking.tour?.images?.[0]?.url || 
               booking.hotel?.images?.[0]?.url || 
               booking.vehicle?.images?.[0]?.url || 
               'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop'
      }))

      // Process upcoming trips
      const upcomingTrips = bookings
        .filter(booking => {
          const tripDate = new Date(booking.startDate || booking.checkInDate)
          return tripDate > new Date() && (booking.status === 'confirmed' || booking.status === 'pending')
        })
        .slice(0, 2)
        .map(booking => ({
          id: booking._id,
          title: booking.tour?.title || booking.hotel?.name || booking.vehicle?.name || 'Trip',
          date: booking.startDate || booking.checkInDate,
          type: booking.type || 'tour',
          status: booking.status
        }))

      // Calculate statistics
      const stats = {
        totalBookings: bookings.length,
        completedTrips: bookings.filter(b => b.status === 'completed').length,
        totalSpent: bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
        favoriteDestination: getFavoriteDestination(bookings)
      }

      // Process recommendations
      const recommendations = []
      
      // Add featured tours
      if (toursResponse.data.success && toursResponse.data.data && toursResponse.data.data.tours) {
        toursResponse.data.data.tours.forEach(tour => {
          recommendations.push({
            id: tour._id,
            title: tour.title,
            location: tour.location?.city || tour.destination,
            rating: tour.rating?.average || 4.5,
            price: tour.price || 0,
            image: tour.images?.[0]?.url || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop',
            type: 'tour'
          })
        })
      }

      // Add featured hotels
      if (hotelsResponse.data.success && hotelsResponse.data.data && hotelsResponse.data.data.hotels) {
        hotelsResponse.data.data.hotels.forEach(hotel => {
          recommendations.push({
            id: hotel._id,
            title: hotel.name,
            location: hotel.location?.city || 'Sri Lanka',
            rating: hotel.rating?.average || 4.5,
            price: hotel.pricing?.averagePrice || hotel.priceRange?.min || 0,
            image: hotel.images?.[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop',
            type: 'hotel'
          })
        })
      }

      // Add featured vehicles
      if (vehiclesResponse.data.success && vehiclesResponse.data.data && vehiclesResponse.data.data.vehicles) {
        vehiclesResponse.data.data.vehicles.forEach(vehicle => {
          recommendations.push({
            id: vehicle._id,
            title: vehicle.name || `${vehicle.make} ${vehicle.model}`,
            location: vehicle.location?.city || 'Sri Lanka',
            rating: vehicle.ratings?.overall || 4.5,
            price: vehicle.pricing?.dailyRate || 0,
            image: vehicle.images?.[0]?.url || 'https://images.unsplash.com/photo-1549317336-206569e8475c?w=300&h=200&fit=crop',
            type: 'vehicle'
          })
        })
      }

      setDashboardData({
        recentBookings,
        recommendations: recommendations.slice(0, 3), // Limit to 3 recommendations
        stats,
        upcomingTrips
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      console.error('API Response Debug:', {
        bookingsResponse: bookingsResponse?.data,
        toursResponse: toursResponse?.data,
        hotelsResponse: hotelsResponse?.data,
        vehiclesResponse: vehiclesResponse?.data
      })
      setError('Failed to load dashboard data')
      
      // Fallback to empty data
      setDashboardData({
        recentBookings: [],
        recommendations: [],
        stats: {
          totalBookings: 0,
          completedTrips: 0,
          totalSpent: 0,
          favoriteDestination: 'N/A'
        },
        upcomingTrips: []
      })
    } finally {
      setLoading(false)
    }
  }

  const getFavoriteDestination = (bookings) => {
    const destinations = {}
    bookings.forEach(booking => {
      const destination = booking.tour?.destination || 
                        booking.hotel?.location?.city || 
                        booking.vehicle?.location?.city || 
                        'Unknown'
      destinations[destination] = (destinations[destination] || 0) + 1
    })
    
    const favorite = Object.keys(destinations).reduce((a, b) => 
      destinations[a] > destinations[b] ? a : b, 'N/A'
    )
    
    return favorite === 'Unknown' ? 'N/A' : favorite
  }
  
  useEffect(() => {
    // Redirect users to their appropriate dashboards
    if (user?.role === 'hotel_owner') {
      navigate('/hotel-owner', { replace: true })
    } else if (user?.role === 'admin') {
      navigate('/admin', { replace: true })
    } else if (user?.role === 'guide') {
      navigate('/guide', { replace: true })
    } else if (user?.role === 'driver') {
      navigate('/driver', { replace: true })
    } else if (user?.role === 'staff') {
      navigate('/staff', { replace: true })
    } else if (user?.role === 'vehicle_owner') {
      navigate('/vehicle-owner', { replace: true })
    }
  }, [user, navigate])
  
  // Show loading or redirect message for non-tourist users
  if (user?.role !== 'tourist') {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4 text-base-content/70">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'tour':
        return <MapPin className="h-4 w-4" />
      case 'hotel':
        return <Building className="h-4 w-4" />
      case 'vehicle':
        return <Car className="h-4 w-4" />
      case 'guide':
        return <Users className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.firstName}! 👋
              </h2>
              <p className="text-gray-600">
                Ready for your next Sri Lankan adventure? Here's what's happening with your bookings.
              </p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardData.stats.totalBookings}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed Trips</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardData.stats.completedTrips}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Spent</p>
                <p className="text-2xl font-semibold text-gray-900">LKR {dashboardData.stats.totalSpent.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Heart className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Favorite Destination</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardData.stats.favoriteDestination}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Bookings */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
                  <Link
                    to="/my-bookings"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                  >
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {dashboardData.recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <img
                        src={booking.image}
                        alt={booking.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {getTypeIcon(booking.type)}
                          <h4 className="font-medium text-gray-900">{booking.title}</h4>
                        </div>
                        <p className="text-sm text-gray-500">{new Date(booking.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          <span className="ml-1">{booking.status}</span>
                        </span>
                        <p className="text-sm font-medium text-gray-900 mt-1">LKR {booking.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Upcoming Trips */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <Link
                    to="/tours"
                    className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <MapPin className="h-8 w-8 text-blue-600 mb-2" />
                    <span className="text-sm font-medium text-blue-900">Book Tours</span>
                  </Link>
                  <Link
                    to="/hotels"
                    className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <Building className="h-8 w-8 text-green-600 mb-2" />
                    <span className="text-sm font-medium text-green-900">Find Hotels</span>
                  </Link>
                  <Link
                    to="/vehicles"
                    className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <Car className="h-8 w-8 text-purple-600 mb-2" />
                    <span className="text-sm font-medium text-purple-900">Rent Vehicles</span>
                  </Link>
                  <Link
                    to="/custom-trip"
                    className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    <Sparkles className="h-8 w-8 text-orange-600 mb-2" />
                    <span className="text-sm font-medium text-orange-900">Custom Trip</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Upcoming Trips */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Trips</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {dashboardData.upcomingTrips.map((trip) => (
                    <div key={trip.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(trip.type)}
                        <div>
                          <h4 className="font-medium text-gray-900">{trip.title}</h4>
                          <p className="text-sm text-gray-500">{new Date(trip.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                        {getStatusIcon(trip.status)}
                        <span className="ml-1">{trip.status}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recommended for You</h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All Recommendations
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dashboardData.recommendations.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        {getTypeIcon(item.type)}
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{item.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium text-gray-900">{item.rating}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">LKR {item.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
