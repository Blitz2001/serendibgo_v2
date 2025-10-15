// Staff Booking Management Component
import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  Search,
  Filter,
  Eye,
  Edit,
  XCircle,
  CheckCircle,
  AlertCircle,
  Plus,
  Download,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  User,
  Star,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  CheckSquare,
  Square,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Car,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import staffService from '../../../services/staff/staffService';
import toast from 'react-hot-toast';

const BookingManagement = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    if (!isAuthenticated) return;
    
    console.log('🔍 Staff BookingManagement - Fetching bookings...', {
      isAuthenticated,
      user: user?.id || user?._id,
      userRole: user?.role,
      filters,
      searchTerm,
      pagination: pagination.current
    });
    
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        ...filters
      };
      if (searchTerm) params.search = searchTerm;
      
      console.log('🔍 Fetching bookings with params:', params);
      const data = await staffService.getBookings(params);
      console.log('📊 Received bookings:', data.data.bookings.length);
      setBookings(data.data.bookings);
      setPagination(data.data.pagination);
      
      console.log('✅ Staff BookingManagement - Bookings fetched:', data.data.bookings?.length || 0, 'bookings');
    } catch (error) {
      console.error('❌ Staff BookingManagement - Fetch bookings error:', error);
      toast.error(error.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, pagination.current, filters, searchTerm]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const data = await staffService.getBookingStatistics();
      setStatistics(data.data);
    } catch (error) {
      console.error('Fetch statistics error:', error);
    }
  }, [isAuthenticated]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isAuthenticated && !isLoading) {
        fetchBookings();
        fetchStatistics();
      }
    }, 500); // 500ms delay for search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, isAuthenticated, isLoading]);

  // Effect for other filters (immediate)
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchBookings();
      fetchStatistics();
    }
  }, [filters.status, filters.type, filters.dateFrom, filters.dateTo, pagination.current, isAuthenticated, isLoading]);

  // Handle booking update
  const handleUpdateBooking = async (bookingId, updateData) => {
    try {
      const data = await staffService.updateBooking(bookingId, updateData);
      toast.success(data.message);
      fetchBookings();
      fetchStatistics();
    } catch (error) {
      console.error('Update booking error:', error);
      toast.error(error.message || 'Failed to update booking');
    }
  };

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId, reason) => {
    try {
      const data = await staffService.cancelBooking(bookingId, reason);
      toast.success(data.message);
      fetchBookings();
      fetchStatistics();
    } catch (error) {
      console.error('Cancel booking error:', error);
      toast.error(error.message || 'Failed to cancel booking');
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedBookings.length === 0) {
      toast.error('Please select bookings to process');
      return;
    }

    try {
      // Process each selected booking
      for (const bookingId of selectedBookings) {
        if (action === 'cancel') {
          await staffService.cancelBooking(bookingId, 'Bulk cancellation by staff');
        } else if (action === 'confirm') {
          await staffService.updateBooking(bookingId, { status: 'confirmed' });
        }
      }
      
      toast.success(`${action} completed for ${selectedBookings.length} bookings`);
      setSelectedBookings([]);
      fetchBookings();
      fetchStatistics();
    } catch (error) {
      console.error(`Bulk ${action} error:`, error);
      toast.error(`Failed to ${action} bookings`);
    }
  };


  // Toggle selection
  const toggleSelection = (bookingId) => {
    setSelectedBookings(prev => 
      prev.includes(bookingId) 
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  // Select all
  const selectAll = () => {
    setSelectedBookings(bookings.map(booking => booking._id));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedBookings([]);
  };

  // View booking details
  const viewBookingDetails = async (bookingId) => {
    try {
      const data = await staffService.getBookingDetails(bookingId);
      setSelectedBooking(data.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Get booking details error:', error);
      toast.error('Failed to fetch booking details');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-orange-600 bg-orange-100';
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return Clock;
      case 'confirmed': return CheckCircle;
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      default: return AlertCircle;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Booking Management</h2>
          <p className="text-slate-600">Manage all platform bookings and reservations</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchBookings}
            className="flex items-center px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Bookings</p>
              <p className="text-2xl font-bold text-slate-900">{statistics.total || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{statistics.pending || 0}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">{statistics.confirmed || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-600">
                LKR {statistics.totalRevenue?.toLocaleString() || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Guide Bookings</p>
              <p className="text-2xl font-bold text-blue-600">{statistics.guideBookings || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Custom Trip Bookings</p>
              <p className="text-2xl font-bold text-indigo-600">{statistics.customTripBookings || 0}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Vehicle Bookings</p>
              <p className="text-2xl font-bold text-purple-600">{statistics.vehicleBookings || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Car className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Filter Bookings</h3>
            {loading && (
              <div className="flex items-center text-sm text-slate-500">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Applying filters...
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search bookings..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="tour">Tour Bookings</option>
                <option value="guide">Guide Bookings</option>
                <option value="custom-trip">Custom Trip Bookings</option>
                <option value="hotel">Hotel Bookings</option>
                <option value="vehicle">Vehicle Bookings</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Filter Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setFilters({
                    status: 'all',
                    type: 'all',
                    dateFrom: '',
                    dateTo: '',
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                  });
                  setSearchTerm('');
                }}
                className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
            <div className="text-sm text-slate-500">
              {bookings.length} bookings found
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedBookings.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-slate-700">
                {selectedBookings.length} selected
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('confirm')}
                className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Confirm All
              </button>
              <button
                onClick={() => handleBulkAction('cancel')}
                className="flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Cancel All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-700 mb-2">No bookings found</h3>
              <p className="text-slate-500">No bookings match your current filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All */}
              <div className="flex items-center justify-between py-2 border-b border-slate-200">
                <button
                  onClick={selectedBookings.length === bookings.length ? clearSelection : selectAll}
                  className="flex items-center text-sm text-slate-600 hover:text-slate-900"
                >
                  {selectedBookings.length === bookings.length ? (
                    <CheckSquare className="h-4 w-4 mr-2 text-blue-600" />
                  ) : (
                    <Square className="h-4 w-4 mr-2" />
                  )}
                  Select All
                </button>
              </div>

              {/* Booking Items */}
              {bookings.map((booking) => {
                const StatusIcon = getStatusIcon(booking.status);
                const isSelected = selectedBookings.includes(booking._id);
                
                return (
                  <div
                    key={booking._id}
                    className={`p-6 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors ${
                      isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <button
                          onClick={() => toggleSelection(booking._id)}
                          className="mt-1"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Square className="h-5 w-5 text-slate-400" />
                          )}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(booking.status)}`}>
                              <StatusIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">
                                {booking.customTrip ? `Custom Trip - ${booking.customTrip.requestDetails?.destination || 'Sri Lanka'}` :
                                 booking.tour?.title || 
                                 (booking.hotel ? `Hotel Booking - ${booking.hotel.name}` : 
                                  (booking.vehicle ? `Vehicle Booking - ${booking.vehicle.make} ${booking.vehicle.model}` :
                                   (booking.guide ? `Guide Booking - ${booking.guide.firstName} ${booking.guide.lastName}` : 'Booking')))}
                              </h3>
                              <p className="text-sm text-slate-600">
                                {booking.user?.firstName} {booking.user?.lastName}
                              </p>
                              {booking.customTrip && (
                                <div className="flex items-center space-x-2 mt-1">
                                  <p className="text-xs text-indigo-600 font-medium">
                                    Custom Trip Booking
                                  </p>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    booking.paymentStatus === 'paid' 
                                      ? 'bg-green-100 text-green-800'
                                      : booking.paymentStatus === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {booking.paymentStatus}
                                  </span>
                                </div>
                              )}
                              {booking.guide && !booking.tour && !booking.hotel && !booking.vehicle && !booking.customTrip && (
                                <div className="flex items-center space-x-2 mt-1">
                                  <p className="text-xs text-blue-600 font-medium">
                                    Direct Guide Booking
                                  </p>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    booking.paymentStatus === 'paid' 
                                      ? 'bg-green-100 text-green-800'
                                      : booking.paymentStatus === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {booking.paymentStatus}
                                  </span>
                                </div>
                              )}
                              {booking.hotel && (
                                <p className="text-xs text-green-600 font-medium">
                                  Hotel Booking
                                </p>
                              )}
                              {booking.vehicle && (
                                <p className="text-xs text-purple-600 font-medium">
                                  Vehicle Booking
                                </p>
                              )}
                              {booking.bookingReference && (
                                <p className="text-xs text-slate-500 mt-1">
                                  Ref: {booking.bookingReference}
                                </p>
                              )}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-slate-600">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              {new Date(booking.startDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              {booking.groupSize} people
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-2" />
                              LKR {booking.totalAmount?.toLocaleString()}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              {booking.duration || 
                               (booking.hotel ? `${booking.room?.roomType || 'Room'}` : 
                                (booking.vehicle ? `${booking.vehicle.type || 'Vehicle'}` : 'N/A'))}
                            </div>
                          </div>

                          {/* Additional info for custom trip bookings */}
                          {booking.customTrip && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600 mt-2 pt-2 border-t border-slate-100">
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2" />
                                {booking.customTrip.requestDetails?.destination || 'Sri Lanka'}
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2" />
                                {booking.customTrip.requestDetails?.groupSize || booking.groupSize} people
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                End: {new Date(booking.endDate).toLocaleDateString()}
                              </div>
                            </div>
                          )}

                          {/* Additional info for guide bookings */}
                          {booking.guide && !booking.tour && !booking.hotel && !booking.vehicle && !booking.customTrip && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600 mt-2 pt-2 border-t border-slate-100">
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-2" />
                                {booking.user?.phone || 'N/A'}
                              </div>
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-2" />
                                {booking.user?.email || 'N/A'}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                End: {new Date(booking.endDate).toLocaleDateString()}
                              </div>
                            </div>
                          )}

                          {booking.specialRequests && (
                            <div className="mt-2 text-sm text-slate-600">
                              <span className="font-medium">Special Requests: </span>
                              {booking.specialRequests}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => viewBookingDetails(booking._id)}
                          className="flex items-center px-3 py-1 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </button>
                        
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateBooking(booking._id, { status: 'confirmed' })}
                            className="flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirm
                          </button>
                        )}
                        
                        {booking.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancelBooking(booking._id, 'Cancelled by staff')}
                            className="flex items-center px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Showing {((pagination.current - 1) * 10) + 1} to {Math.min(pagination.current * 10, pagination.total)} of {pagination.total} bookings
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagination({ ...pagination, current: pagination.current - 1 })}
                  disabled={pagination.current === 1}
                  className="px-3 py-1 text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg">
                  {pagination.current}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, current: pagination.current + 1 })}
                  disabled={pagination.current === pagination.pages}
                  className="px-3 py-1 text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Booking Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Booking Info */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Booking Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">Booking ID:</span>
                      <p className="text-slate-600">{selectedBooking.booking._id}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Status:</span>
                      <p className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBooking.booking.status)}`}>
                        {selectedBooking.booking.status}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Start Date:</span>
                      <p className="text-slate-600">{new Date(selectedBooking.booking.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">End Date:</span>
                      <p className="text-slate-600">{new Date(selectedBooking.booking.endDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Group Size:</span>
                      <p className="text-slate-600">{selectedBooking.booking.groupSize} people</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Total Amount:</span>
                      <p className="text-slate-600">LKR {selectedBooking.booking.totalAmount?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Customer Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">Name:</span>
                      <p className="text-slate-600">{selectedBooking.booking.user?.firstName} {selectedBooking.booking.user?.lastName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Email:</span>
                      <p className="text-slate-600">{selectedBooking.booking.user?.email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Phone:</span>
                      <p className="text-slate-600">{selectedBooking.booking.user?.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Tour/Guide Info */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">
                    {selectedBooking.booking.tour ? 'Tour Information' : 'Guide Information'}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedBooking.booking.tour ? (
                      <>
                        <div>
                          <span className="font-medium text-slate-700">Tour:</span>
                          <p className="text-slate-600">{selectedBooking.booking.tour.title}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Duration:</span>
                          <p className="text-slate-600">{selectedBooking.booking.tour.duration}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Location:</span>
                          <p className="text-slate-600">{selectedBooking.booking.tour.location}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Price:</span>
                          <p className="text-slate-600">LKR {selectedBooking.booking.tour.price?.toLocaleString()}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="font-medium text-slate-700">Guide:</span>
                          <p className="text-slate-600">{selectedBooking.booking.guide?.firstName} {selectedBooking.booking.guide?.lastName}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Email:</span>
                          <p className="text-slate-600">{selectedBooking.booking.guide?.email}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Phone:</span>
                          <p className="text-slate-600">{selectedBooking.booking.guide?.phone}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Duration:</span>
                          <p className="text-slate-600">{selectedBooking.booking.duration}</p>
                        </div>
                        {selectedBooking.booking.bookingReference && (
                          <div>
                            <span className="font-medium text-slate-700">Booking Reference:</span>
                            <p className="text-slate-600">{selectedBooking.booking.bookingReference}</p>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-slate-700">Start Date:</span>
                          <p className="text-slate-600">{new Date(selectedBooking.booking.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">End Date:</span>
                          <p className="text-slate-600">{new Date(selectedBooking.booking.endDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Group Size:</span>
                          <p className="text-slate-600">{selectedBooking.booking.groupSize} people</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Special Requests */}
                {selectedBooking.booking.specialRequests && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Special Requests</h4>
                    <p className="text-slate-600">{selectedBooking.booking.specialRequests}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center space-x-3 pt-4 border-t border-slate-200">
                  {selectedBooking.booking.status === 'pending' && (
                    <button
                      onClick={() => {
                        handleUpdateBooking(selectedBooking.booking._id, { status: 'confirmed' });
                        setShowDetailsModal(false);
                      }}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Booking
                    </button>
                  )}
                  
                  {selectedBooking.booking.status !== 'cancelled' && (
                    <button
                      onClick={() => {
                        handleCancelBooking(selectedBooking.booking._id, 'Cancelled by staff');
                        setShowDetailsModal(false);
                      }}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
