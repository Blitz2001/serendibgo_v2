import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { bookingAPI } from '../../services/hotels/hotelService'
import { 
  Calendar, 
  MapPin, 
  Users, 
  CreditCard, 
  Bed, 
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const AdminBookings = () => {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    search: ''
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10
  })

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAllBookings()
    }
  }, [user, filters, pagination.current])

  const fetchAllBookings = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.current,
        limit: pagination.limit,
        ...filters
      }
      
      // For admin, we need to get all bookings
      // This would require a new endpoint or modify existing one
      const response = await bookingAPI.getAllBookings(params)
      if (response.status === 'success') {
        setBookings(response.data.bookings)
        setPagination(response.data.pagination)
      } else {
        setError('Failed to fetch bookings')
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
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'cancelled':
        return <XCircle className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const response = await bookingAPI.updateBookingStatus(bookingId, { status: newStatus })
      if (response.status === 'success') {
        toast.success('Booking status updated successfully')
        fetchAllBookings()
      } else {
        toast.error('Failed to update booking status')
      }
    } catch (error) {
      console.error('Error updating booking status:', error)
      toast.error('Failed to update booking status')
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100">
        {/* Fixed Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Bed className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Manage Bookings</h1>
                  <p className="text-sm text-gray-600">View and manage all hotel bookings</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-100">
        {/* Fixed Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Bed className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Manage Bookings</h1>
                  <p className="text-sm text-gray-600">View and manage all hotel bookings</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-error" />
              <h3 className="mt-2 text-sm font-medium text-base-content">Error loading bookings</h3>
              <p className="mt-1 text-sm text-base-content/70">{error}</p>
              <div className="mt-6">
                <button
                  onClick={fetchAllBookings}
                  className="btn btn-primary"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Fixed Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Bed className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Manage Bookings</h1>
                <p className="text-sm text-gray-600">View and manage all hotel bookings</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Filters */}
        <div className="bg-base-200 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Search</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  className="input input-bordered w-full pl-10"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Status</span>
              </label>
              <select
                className="select select-bordered"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Payment Status</span>
              </label>
              <select
                className="select select-bordered"
                value={filters.paymentStatus}
                onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
              >
                <option value="">All Payments</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Actions</span>
              </label>
              <div className="flex space-x-2">
                <button className="btn btn-outline btn-sm">
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button className="btn btn-outline btn-sm" onClick={fetchAllBookings}>
                  <Filter className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <Bed className="mx-auto h-12 w-12 text-base-content/50" />
            <h3 className="mt-2 text-sm font-medium text-base-content">No bookings found</h3>
            <p className="mt-1 text-sm text-base-content/70">
              {filters.status || filters.paymentStatus || filters.search 
                ? 'Try adjusting your filters' 
                : 'No bookings have been made yet'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-base-200 rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Bed className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-base-content">
                        {booking.hotel?.name || 'Hotel Booking'}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1">{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                      </span>
                    </div>
                    
                    <p className="text-sm text-base-content/70 mb-3">
                      {booking.room?.name || 'Room'} - {booking.room?.roomType || 'Standard'}
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center text-sm text-base-content/70">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(booking.checkInDate)}
                      </div>
                      <div className="flex items-center text-sm text-base-content/70">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(booking.checkOutDate)}
                      </div>
                      <div className="flex items-center text-sm text-base-content/70">
                        <MapPin className="h-4 w-4 mr-2" />
                        {booking.hotel?.location?.city || 'Location'}
                      </div>
                      <div className="flex items-center text-sm text-base-content/70">
                        <Users className="h-4 w-4 mr-2" />
                        {booking.guests?.adults || 1} {booking.guests?.adults === 1 ? 'guest' : 'guests'}
                      </div>
                    </div>
                    
                    {booking.bookingReference && (
                      <div className="mt-3 text-xs text-base-content/50">
                        Reference: {booking.bookingReference}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-6 flex flex-col items-end">
                    <div className="flex items-center text-lg font-semibold text-base-content mb-2">
                      <CreditCard className="h-4 w-4 mr-1" />
                      {booking.pricing?.currency || 'USD'} {booking.pricing?.totalPrice?.toLocaleString() || '0'}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        className="btn btn-sm btn-outline"
                        onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                        disabled={booking.status === 'confirmed'}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirm
                      </button>
                      <button 
                        className="btn btn-sm btn-outline btn-error"
                        onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                        disabled={booking.status === 'cancelled'}
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel
                      </button>
                      <button className="btn btn-sm btn-primary">
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="btn-group">
              <button 
                className="btn"
                disabled={pagination.current === 1}
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
              >
                Previous
              </button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`btn ${page === pagination.current ? 'btn-active' : ''}`}
                  onClick={() => setPagination(prev => ({ ...prev, current: page }))}
                >
                  {page}
                </button>
              ))}
              <button 
                className="btn"
                disabled={pagination.current === pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
              >
                Next
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

export default AdminBookings
