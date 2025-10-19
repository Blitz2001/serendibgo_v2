// Staff Hotel Management Component
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Star,
  Calendar,
  Camera,
  Save,
  X,
  Upload,
  Globe,
  Award,
  Heart,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  Zap,
  Target,
  Info,
  Edit3,
  Copy,
  Share,
  Archive,
  Ban,
  Unlock,
  Lock,
  EyeOff,
  Send,
  Reply,
  Phone,
  Mail,
  User,
  Building,
  Car,
  Compass,
  Navigation,
  Flag,
  Layers,
  Package,
  Tag,
  Hash,
  Percent,
  PieChart,
  LineChart,
  Monitor,
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  Signal,
  Battery,
  Thermometer,
  Gauge,
  CheckSquare,
  Square,
  Bed,
  Coffee,
  Utensils,
  Waves,
  Dumbbell,
  Plane,
  Train,
  Ship,
  Bike,
  Bus,
  Tv,
  Wind,
  Droplets,
  ChefHat,
  Car as CarIcon,
  Shield as ShieldIcon,
  UserCheck,
  Bell,
  RefreshCw as RefreshCwIcon,
  Building2,
  Heart as HeartIcon,
  Mountain,
  Trees
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import staffService from '../../../services/staff/staffService';
import toast from 'react-hot-toast';

const HotelManagement = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [hotels, setHotels] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedHotels, setSelectedHotels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    location: 'all',
    rating: 'all',
    priceRange: 'all',
    amenities: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [newHotel, setNewHotel] = useState({
    name: '',
    description: '',
    location: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    rating: 0,
    priceRange: 'budget',
    amenities: [],
    images: [],
    rooms: [],
    policies: {
      checkIn: '',
      checkOut: '',
      cancellation: '',
      pets: false,
      smoking: false
    },
    coordinates: {
      latitude: 0,
      longitude: 0
    }
  });

  // Fetch hotels
  const fetchHotels = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        ...filters
      };
      if (searchTerm) params.search = searchTerm;
      
      console.log('Fetching hotels with params:', params);
      const data = await staffService.getHotels(params);
      console.log('Hotels data:', data);
      setHotels(data.data.hotels);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Fetch hotels error:', error);
      toast.error(error.message || 'Failed to fetch hotels');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    if (!isAuthenticated) return;
    
    try {
      const data = await staffService.getHotelStatistics();
      setStatistics(data.data);
    } catch (error) {
      console.error('Fetch statistics error:', error);
    }
  };

  // Initial load
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchHotels();
      fetchStatistics();
    }
  }, [isAuthenticated, isLoading]);

  // Filter changes
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchHotels();
    }
  }, [filters.status, filters.location, filters.rating, filters.priceRange, searchTerm]);

  // Handle viewing details
  const handleViewDetails = async (hotel) => {
    setSelectedHotel(hotel);
    setShowDetailsModal(true);
  };

  // Handle delete hotel
  const handleDeleteHotel = async (hotelId) => {
    try {
      await staffService.deleteHotel(hotelId);
      toast.success('Hotel deleted successfully');
      fetchHotels();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Delete hotel error:', error);
      toast.error(error.message || 'Failed to delete hotel');
    }
  };

  // Handle approve hotel
  const handleApproveHotel = async (hotelId) => {
    try {
      await staffService.updateHotel(hotelId, { status: 'approved' });
      toast.success('Hotel approved successfully');
      fetchHotels();
      fetchStatistics();
    } catch (error) {
      console.error('Approve hotel error:', error);
      toast.error(error.message || 'Failed to approve hotel');
    }
  };

  // Handle reject hotel
  const handleRejectHotel = async (hotelId) => {
    try {
      await staffService.updateHotel(hotelId, { status: 'rejected' });
      toast.success('Hotel rejected successfully');
      fetchHotels();
      fetchStatistics();
    } catch (error) {
      console.error('Reject hotel error:', error);
      toast.error(error.message || 'Failed to reject hotel');
    }
  };

  // Handle edit hotel
  const handleEditHotel = async (hotel) => {
    setSelectedHotel(hotel);
    setNewHotel({
      name: hotel.name || '',
      description: hotel.description || '',
      location: hotel.location?.city || hotel.location?.address || '',
      address: hotel.address || '',
      phone: hotel.contact?.phone || '',
      email: hotel.email || '',
      website: hotel.website || '',
      rating: hotel.ratings?.overall || 0,
      priceRange: getPriceRange(hotel),
      amenities: Object.keys(hotel.amenities || {}).filter(amenity => hotel.amenities[amenity]),
      images: hotel.images || [],
      rooms: hotel.rooms || [],
      policies: hotel.policies || {
        checkIn: '',
        checkOut: '',
        cancellation: '',
        pets: false,
        smoking: false
      },
      coordinates: hotel.coordinates || {
        latitude: 0,
        longitude: 0
      }
    });
    setShowCreateModal(true);
  };

  // Handle bulk operations
  const handleBulkAction = async (action) => {
    if (selectedHotels.length === 0) {
      toast.error('Please select hotels first');
      return;
    }

    try {
      await staffService.bulkHotelAction(selectedHotels, action);
      toast.success(`${action} completed successfully`);
      fetchHotels();
      setSelectedHotels([]);
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error(error.message || `Failed to ${action} hotels`);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedHotels.length === hotels.length) {
      setSelectedHotels([]);
    } else {
      setSelectedHotels(hotels.map(hotel => hotel._id));
    }
  };

  // Handle individual select
  const handleSelectHotel = (hotelId) => {
    if (selectedHotels.includes(hotelId)) {
      setSelectedHotels(selectedHotels.filter(id => id !== hotelId));
    } else {
      setSelectedHotels([...selectedHotels, hotelId]);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return CheckCircle;
      case 'rejected': return X;
      case 'pending': return Clock;
      case 'draft': return FileText;
      case 'suspended': return Ban;
      default: return AlertCircle;
    }
  };

  // Get price range color
  const getPriceRangeColor = (priceRange) => {
    switch (priceRange) {
      case 'budget': return 'text-green-600 bg-green-100';
      case 'mid-range': return 'text-yellow-600 bg-yellow-100';
      case 'luxury': return 'text-purple-600 bg-purple-100';
      case 'ultra-luxury': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get price range based on room types
  const getPriceRange = (hotel) => {
    if (!hotel.roomTypes || hotel.roomTypes.length === 0) return 'N/A';
    
    const prices = hotel.roomTypes.map(room => room.basePrice || 0);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    if (avgPrice <= 10000) return 'budget';
    if (avgPrice <= 25000) return 'mid-range';
    if (avgPrice <= 50000) return 'luxury';
    return 'ultra-luxury';
  };

  // Get amenity icon
  const getAmenityIcon = (amenity) => {
    switch (amenity) {
      case 'wifi': return Wifi;
      case 'parking': return CarIcon;
      case 'pool': return Waves;
      case 'restaurant': return Utensils;
      case 'gym': return Dumbbell;
      case 'spa': return HeartIcon;
      case 'room-service': return Bell;
      case 'concierge': return UserCheck;
      case 'business-center': return Building2;
      case 'laundry': return RefreshCwIcon;
      case 'air-conditioning': return Wind;
      case 'tv': return Tv;
      case 'kitchen': return ChefHat;
      case 'balcony': return Mountain;
      case 'ocean-view': return Waves;
      case 'city-view': return Building;
      case 'mountain-view': return Mountain;
      default: return Package;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Hotel Management</h2>
          <p className="text-slate-600">Review and approve hotel applications</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchHotels}
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
            <ChevronDown className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Hotels</p>
              <p className="text-2xl font-bold text-slate-900">{statistics.total || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Hotels</p>
              <p className="text-2xl font-bold text-green-600">{statistics.active || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-600">{statistics.pending || 0}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Rooms</p>
              <p className="text-2xl font-bold text-purple-600">{statistics.totalRooms || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bed className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
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
                  placeholder="Search hotels..."
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
              <select
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Locations</option>
                <option value="Colombo">Colombo</option>
                <option value="Kandy">Kandy</option>
                <option value="Galle">Galle</option>
                <option value="Negombo">Negombo</option>
                <option value="Bentota">Bentota</option>
                <option value="Sigiriya">Sigiriya</option>
                <option value="Anuradhapura">Anuradhapura</option>
                <option value="Polonnaruwa">Polonnaruwa</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Price Range</label>
              <select
                value={filters.priceRange}
                onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Price Ranges</option>
                <option value="budget">Budget</option>
                <option value="mid-range">Mid-Range</option>
                <option value="luxury">Luxury</option>
                <option value="ultra-luxury">Ultra-Luxury</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3 mt-4">
            <button
              onClick={() => {
                setFilters({ status: 'all', location: 'all', rating: 'all', priceRange: 'all', amenities: 'all', sortBy: 'createdAt', sortOrder: 'desc' });
                setSearchTerm('');
              }}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedHotels.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedHotels.length} hotel(s) selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('approve')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <CheckCircle className="h-4 w-4 mr-2 inline" />
                Approve Selected
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                <X className="h-4 w-4 mr-2 inline" />
                Reject Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hotels List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Hotels</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSelectAll}
                className="flex items-center px-3 py-1 text-slate-600 hover:text-slate-900 transition-colors"
              >
                {selectedHotels.length === hotels.length ? (
                  <CheckSquare className="h-4 w-4 mr-1" />
                ) : (
                  <Square className="h-4 w-4 mr-1" />
                )}
                Select All
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading hotels...</p>
          </div>
        ) : hotels.length === 0 ? (
          <div className="p-8 text-center">
            <Building className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No hotels found</h3>
            <p className="text-slate-500 mb-4">No hotel applications match your current filters</p>
            <button
              onClick={() => setShowFilters(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Adjust Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4 p-6">
            {hotels.map((hotel) => {
              const StatusIcon = getStatusIcon(hotel.status);
              return (
                <div key={hotel._id} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 hover:border-slate-300">
                  <div className="flex items-start space-x-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedHotels.includes(hotel._id)}
                      onChange={() => handleSelectHotel(hotel._id)}
                      className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-1"
                    />
                    
                    {/* Hotel Image */}
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg overflow-hidden shadow-sm flex-shrink-0">
                      {hotel.images && hotel.images.length > 0 ? (
                        <img
                          src={hotel.images[0]?.url || hotel.images[0]}
                          alt={hotel.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building className="h-6 w-6 text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* Hotel Content */}
                    <div className="flex-1 min-w-0">
                      {/* Hotel Name and Status */}
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-bold text-slate-900">{hotel.name}</h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(hotel.status)}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {hotel.status}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          N/A
                        </span>
                      </div>
                      
                      {/* Description */}
                      <p className="text-slate-600 mb-3 text-sm leading-relaxed">
                        {hotel.description || 'No description provided'}
                      </p>
                      
                      {/* Hotel Details */}
                      <div className="flex items-center space-x-6 mb-3 text-sm text-slate-600">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span>{hotel.location?.city || hotel.location?.address || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-slate-400" />
                          <span>{hotel.ratings?.overall || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Bed className="h-4 w-4 text-slate-400" />
                          <span>{hotel.rooms?.length || 0} rooms</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <span>{hotel.contact?.phone || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Amenities */}
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const activeAmenities = Object.keys(hotel.amenities || {}).filter(amenity => hotel.amenities[amenity]);
                          return activeAmenities.slice(0, 6).map((amenity, index) => {
                            const AmenityIcon = getAmenityIcon(amenity);
                            return (
                              <span key={index} className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                <AmenityIcon className="h-3 w-3 mr-1" />
                                {amenity}
                              </span>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col items-end space-y-2">
                      <button
                        onClick={() => handleViewDetails(hotel)}
                        className="flex items-center px-3 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors text-sm"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                      
                      {/* Show approve/reject buttons for pending hotels */}
                      {hotel.status === 'pending' && (
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => handleApproveHotel(hotel._id)}
                            className="flex items-center px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium text-sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve Hotel
                          </button>
                          <button
                            onClick={() => handleRejectHotel(hotel._id)}
                            className="flex items-center px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium text-sm"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject Hotel
                          </button>
                        </div>
                      )}
                      
                      {/* Show status for approved/rejected hotels */}
                      {hotel.status === 'approved' && (
                        <span className="flex items-center px-3 py-2 bg-green-100 text-green-800 rounded-lg font-medium text-sm">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approved
                        </span>
                      )}
                      
                      {hotel.status === 'rejected' && (
                        <span className="flex items-center px-3 py-2 bg-red-100 text-red-800 rounded-lg font-medium text-sm">
                          <X className="h-4 w-4 mr-2" />
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hotel Details Modal */}
      {showDetailsModal && selectedHotel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">{selectedHotel.name}</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Hotel Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="font-medium text-gray-900">{selectedHotel.location?.city || selectedHotel.location?.address || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Star className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Rating</p>
                          <p className="font-medium text-gray-900">{selectedHotel.ratings?.overall || 'Not rated'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Bed className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Total Rooms</p>
                          <p className="font-medium text-gray-900">{selectedHotel.rooms?.length || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium text-gray-900">{selectedHotel.contact?.phone || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-700">{selectedHotel.description}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Amenities</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(selectedHotel.amenities || {})
                        .filter(amenity => selectedHotel.amenities[amenity])
                        .map((amenity, index) => {
                          const AmenityIcon = getAmenityIcon(amenity);
                          return (
                            <div key={index} className="flex items-center space-x-2 text-gray-700">
                              <AmenityIcon className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{amenity}</span>
                            </div>
                          );
                        })}
                      {Object.keys(selectedHotel.amenities || {}).filter(amenity => selectedHotel.amenities[amenity]).length === 0 && (
                        <span className="text-gray-400">No amenities specified</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Contact Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{selectedHotel.email || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{selectedHotel.website || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-6 border-t mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors rounded-xl hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleEditHotel(selectedHotel);
                    setShowDetailsModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2 inline" />
                  Edit Hotel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedHotel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Hotel</h3>
                  <p className="text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete "{selectedHotel.name}"? This will permanently remove the hotel and all associated data.
              </p>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteHotel(selectedHotel._id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  Delete Hotel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelManagement;