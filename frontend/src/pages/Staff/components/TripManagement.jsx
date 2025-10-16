// Staff Trip Management Component
import React, { useState, useEffect, useCallback } from 'react';
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
  MoreHorizontal as MoreHorizontalIcon,
  Edit as EditIcon,
  Trash as TrashIcon,
  Copy as CopyIcon,
  Share as ShareIcon,
  Archive as ArchiveIcon,
  Ban as BanIcon,
  Unlock as UnlockIcon,
  Lock as LockIcon,
  EyeOff as EyeOffIcon,
  Send as SendIcon,
  Reply as ReplyIcon
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import staffService from '../../../services/staff/staffService';
import toast from 'react-hot-toast';

const TripManagement = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [trips, setTrips] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedTrips, setSelectedTrips] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    location: 'all',
    difficulty: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [newTrip, setNewTrip] = useState({
    title: '',
    description: '',
    duration: '',
    price: 0,
    maxParticipants: 1,
    category: 'cultural',
    location: '',
    difficulty: 'easy',
    languages: ['English'],
    highlights: [],
    included: [],
    excluded: [],
    requirements: '',
    cancellationPolicy: 'moderate',
    cancellationDetails: '',
    images: []
  });

  // Fetch trips
  const fetchTrips = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        ...filters
      };
      if (searchTerm) params.search = searchTerm;
      
      console.log('Fetching trips with params:', params);
      const data = await staffService.getTrips(params);
      console.log('Trips data:', data);
      console.log('First trip structure:', data.data?.trips?.[0]);
      
      // Debug image data structure
      data.data.trips.forEach((trip, index) => {
        console.log(`Trip ${index + 1} (${trip.title}):`, {
          hasImages: !!trip.images,
          imagesLength: trip.images?.length || 0,
          firstImage: trip.images?.[0],
          firstImageType: typeof trip.images?.[0],
          firstImageUrl: trip.images?.[0]?.url || trip.images?.[0]
        });
      });
      
      setTrips(data.data.trips);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Fetch trips error:', error);
      toast.error(error.message || 'Failed to fetch trips');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, pagination.current, filters, searchTerm]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const data = await staffService.getTripStatistics();
      setStatistics(data.data);
    } catch (error) {
      console.error('Fetch statistics error:', error);
    }
  }, [isAuthenticated]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchTrips();
      fetchStatistics();
    }
  }, [isAuthenticated, isLoading, fetchTrips, fetchStatistics]);

  // Filter changes
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchTrips();
    }
  }, [filters.status, filters.category, filters.location, filters.difficulty, searchTerm]);

  // Handle viewing details
  const handleViewDetails = async (trip) => {
    setSelectedTrip(trip);
    setShowDetailsModal(true);
  };

  // Handle edit trip
  const handleEditTrip = (trip) => {
    console.log('Editing trip:', trip);
    setSelectedTrip(trip);
    
    // Populate the form with trip data
    setNewTrip({
      title: trip.title || '',
      description: trip.description || '',
      duration: trip.duration || '',
      price: trip.price || 0,
      maxParticipants: trip.maxParticipants || 1,
      category: trip.category || 'cultural',
      location: trip.location?.name || trip.location || '',
      difficulty: trip.difficulty || 'easy',
      languages: trip.languages || ['English'],
      highlights: trip.highlights || [],
      included: trip.included || [],
      excluded: trip.excluded || [],
      requirements: Array.isArray(trip.requirements) ? trip.requirements.join('\n') : trip.requirements || '',
      cancellationPolicy: trip.cancellationPolicy || 'moderate',
      cancellationDetails: trip.cancellationDetails || '',
      images: trip.images?.map(img => img.url || img) || []
    });
    
    setShowEditModal(true);
  };

  // Handle delete trip
  const handleDeleteTrip = async (tripId) => {
    try {
      console.log('Deleting trip with ID:', tripId);
      
      await staffService.deleteTrip(tripId);
      toast.success('Trip deleted successfully');
      
      // Refresh the trips list and statistics
      fetchTrips();
      fetchStatistics();
      
      // Close the modal
      setShowDeleteModal(false);
      setSelectedTrip(null);
    } catch (error) {
      console.error('Delete trip error:', error);
      
      // Show specific error messages based on the error
      if (error.message.includes('active booking')) {
        toast.error('Cannot delete trip with active bookings. Please cancel or complete the bookings first.');
      } else if (error.message.includes('not found')) {
        toast.error('Trip not found. It may have already been deleted.');
      } else {
        toast.error(error.message || 'Failed to delete trip');
      }
    }
  };

  // Handle update trip
  const handleUpdateTrip = async (e) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!newTrip.title || !newTrip.description || !newTrip.duration || !newTrip.price || !newTrip.maxParticipants || !newTrip.category) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Filter out empty highlights, included, excluded items, and images
      const tripData = {
        title: newTrip.title.trim(),
        description: newTrip.description.trim(),
        shortDescription: newTrip.description.substring(0, 200).trim(),
        duration: parseInt(newTrip.duration),
        price: parseFloat(newTrip.price),
        maxParticipants: parseInt(newTrip.maxParticipants),
        category: newTrip.category,
        location: newTrip.location || 'Location not specified',
        difficulty: newTrip.difficulty || 'easy',
        highlights: (newTrip.highlights || []).filter(h => h.trim() !== ''),
        included: (newTrip.included || []).filter(i => i.trim() !== ''),
        excluded: (newTrip.excluded || []).filter(e => e.trim() !== ''),
        images: (newTrip.images || []).filter(img => img.trim() !== ''),
        requirements: newTrip.requirements ? [newTrip.requirements] : [],
        cancellationPolicy: newTrip.cancellationPolicy || 'moderate',
        cancellationDetails: newTrip.cancellationDetails || ''
      };
      
      console.log('Updating trip with data:', tripData);
      
      await staffService.updateTrip(selectedTrip._id, tripData);
      toast.success('Trip updated successfully');
      setShowEditModal(false);
      resetNewTrip();
      fetchTrips();
      fetchStatistics();
    } catch (error) {
      console.error('Update trip error:', error);
      toast.error(error.message || 'Failed to update trip');
    }
  };

  // Handle bulk operations
  const handleBulkAction = async (action) => {
    if (selectedTrips.length === 0) {
      toast.error('Please select trips first');
      return;
    }

    try {
      await staffService.bulkTripAction(selectedTrips, action);
      toast.success(`${action} completed successfully`);
      fetchTrips();
      setSelectedTrips([]);
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error(error.message || `Failed to ${action} trips`);
    }
  };

  // Handle create trip
  const handleCreateTrip = async (e) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!newTrip.title || !newTrip.description || !newTrip.duration || !newTrip.price || !newTrip.maxParticipants || !newTrip.category) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Filter out empty highlights, included, excluded items, and images
      const tripData = {
        title: newTrip.title.trim(),
        description: newTrip.description.trim(),
        shortDescription: newTrip.description.substring(0, 200).trim(),
        duration: parseInt(newTrip.duration),
        price: parseFloat(newTrip.price),
        maxParticipants: parseInt(newTrip.maxParticipants),
        category: newTrip.category,
        location: newTrip.location || 'Location not specified',
        difficulty: newTrip.difficulty || 'easy',
        highlights: (newTrip.highlights || []).filter(h => h.trim() !== ''),
        included: (newTrip.included || []).filter(i => i.trim() !== ''),
        excluded: (newTrip.excluded || []).filter(e => e.trim() !== ''),
        images: (newTrip.images || []).filter(img => img.trim() !== ''),
        requirements: newTrip.requirements ? [newTrip.requirements] : [],
        cancellationPolicy: newTrip.cancellationPolicy || 'moderate',
        cancellationDetails: newTrip.cancellationDetails || ''
      };
      
      console.log('Sending trip data:', tripData);
      
      await staffService.createTrip(tripData);
      toast.success('Trip created successfully');
      setShowCreateModal(false);
      resetNewTrip();
      fetchTrips();
      fetchStatistics();
    } catch (error) {
      console.error('Create trip error:', error);
      toast.error(error.message || 'Failed to create trip');
    }
  };

  // Reset new trip form
  const resetNewTrip = () => {
    setNewTrip({
      title: '',
      description: '',
      duration: '',
      price: 0,
      maxParticipants: 1,
      category: 'cultural',
      location: '',
      difficulty: 'easy',
      languages: ['English'],
      highlights: [],
      included: [],
      excluded: [],
      requirements: '',
      cancellationPolicy: 'moderate',
      cancellationDetails: '',
      images: []
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedTrips.length === trips.length) {
      setSelectedTrips([]);
    } else {
      setSelectedTrips((trips || []).map(trip => trip._id));
    }
  };

  // Handle individual select
  const handleSelectTrip = (tripId) => {
    if ((selectedTrips || []).includes(tripId)) {
      setSelectedTrips((selectedTrips || []).filter(id => id !== tripId));
    } else {
      setSelectedTrips([...(selectedTrips || []), tripId]);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'draft': return Edit;
      case 'inactive': return X;
      case 'suspended': return Ban;
      default: return AlertCircle;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Trip Management</h2>
          <p className="text-slate-600">Manage all platform tours and experiences</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Trip
          </button>
          <button
            onClick={fetchTrips}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Trips</p>
              <p className="text-2xl font-bold text-slate-900">{typeof statistics.total === 'object' ? statistics.total?.count || 0 : statistics.total || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Trips</p>
              <p className="text-2xl font-bold text-green-600">{typeof statistics.active === 'object' ? statistics.active?.count || 0 : statistics.active || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Draft Trips</p>
              <p className="text-2xl font-bold text-yellow-600">{typeof statistics.draft === 'object' ? statistics.draft?.count || 0 : statistics.draft || 0}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Edit className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Bookings</p>
              <p className="text-2xl font-bold text-purple-600">{typeof statistics.totalBookings === 'object' ? statistics.totalBookings?.count || 0 : statistics.totalBookings || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-600" />
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
                  placeholder="Search trips..."
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
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="cultural">Cultural</option>
                <option value="adventure">Adventure</option>
                <option value="nature">Nature</option>
                <option value="beach">Beach</option>
                <option value="wildlife">Wildlife</option>
                <option value="historical">Historical</option>
                <option value="religious">Religious</option>
                <option value="culinary">Culinary</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
              <select
                value={filters.difficulty}
                onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="challenging">Challenging</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3 mt-4">
            <button
              onClick={() => {
                setFilters({ status: 'all', category: 'all', location: 'all', difficulty: 'all', sortBy: 'createdAt', sortOrder: 'desc' });
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
      {selectedTrips.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedTrips.length} trip(s) selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="px-3 py-1 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trips List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Trips</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSelectAll}
                className="flex items-center px-3 py-1 text-slate-600 hover:text-slate-900 transition-colors"
              >
                {selectedTrips.length === trips.length ? (
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
            <p className="text-slate-600">Loading trips...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="p-8 text-center">
            <Globe className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No trips found</h3>
            <p className="text-slate-500 mb-4">Get started by creating your first trip</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Trip
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {trips.map((trip) => {
              const StatusIcon = getStatusIcon(trip.status);
              return (
                <div key={trip._id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={(selectedTrips || []).includes(trip._id)}
                        onChange={() => handleSelectTrip(trip._id)}
                        className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      
                      <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden">
                        {trip.images && trip.images.length > 0 ? (
                          <img
                            src={typeof trip.images[0] === 'string' ? trip.images[0] : trip.images[0]?.url}
                            alt={trip.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Image failed to load:', {
                                tripTitle: trip.title,
                                imageSrc: e.target.src,
                                imagesData: trip.images,
                                imageType: typeof trip.images[0]
                              });
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                            onLoad={() => {
                              console.log('Image loaded successfully:', {
                                tripTitle: trip.title,
                                imageSrc: typeof trip.images[0] === 'string' ? trip.images[0] : trip.images[0]?.url
                              });
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{ display: (trip.images && trip.images.length > 0) ? 'none' : 'flex' }}
                        >
                          <Camera className="h-6 w-6 text-slate-400" />
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-slate-900">{trip.title}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {trip.status}
                          </span>
                        </div>
                        
                        <p className="text-slate-600 mb-3 line-clamp-2">{trip.description}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-slate-500">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{trip.location?.name || trip.location || 'Location not specified'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{typeof trip.duration === 'object' ? trip.duration?.value || 'N/A' : trip.duration || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4" />
                            <span>LKR {trip.price?.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{typeof trip.maxParticipants === 'object' ? trip.maxParticipants?.value || 'N/A' : trip.maxParticipants || 'N/A'} max</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4" />
                            <span>{typeof trip.rating === 'object' ? trip.rating?.average || 'N/A' : trip.rating || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDetails(trip)}
                        className="flex items-center px-3 py-1 text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleEditTrip(trip)}
                        className="flex items-center px-3 py-1 text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTrip(trip);
                          setShowDeleteModal(true);
                        }}
                        className="flex items-center px-3 py-1 text-red-600 hover:text-red-900 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Trip Details Modal */}
      {showDetailsModal && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">{selectedTrip.title}</h3>
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
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Trip Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="font-medium text-gray-900">{selectedTrip.location?.name || selectedTrip.location || 'Location not specified'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Duration</p>
                          <p className="font-medium text-gray-900">{selectedTrip.duration}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Price</p>
                          <p className="font-medium text-gray-900">LKR {selectedTrip.price?.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Max Participants</p>
                          <p className="font-medium text-gray-900">{selectedTrip.maxParticipants}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-700">{selectedTrip.description}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Highlights</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTrip.highlights?.map((highlight, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {highlight}
                        </span>
                      )) || <span className="text-gray-400">No highlights specified</span>}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Included</h4>
                    <ul className="space-y-1">
                      {selectedTrip.included?.map((item, index) => (
                        <li key={index} className="flex items-center space-x-2 text-gray-700">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{item}</span>
                        </li>
                      )) || <span className="text-gray-400">No inclusions specified</span>}
                    </ul>
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
                    handleEditTrip(selectedTrip);
                    setShowDetailsModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2 inline" />
                  Edit Trip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Trip Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Create New Trip</h3>
                  <p className="text-gray-600">Add a new tour or experience to the platform</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleCreateTrip} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Trip Title *</label>
                      <input
                        type="text"
                        value={newTrip.title}
                        onChange={(e) => setNewTrip({ ...newTrip, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter trip title"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                      <select
                        value={newTrip.category}
                        onChange={(e) => setNewTrip({ ...newTrip, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="cultural">Cultural</option>
                        <option value="adventure">Adventure</option>
                        <option value="nature">Nature</option>
                        <option value="historical">Historical</option>
                        <option value="religious">Religious</option>
                        <option value="wildlife">Wildlife</option>
                        <option value="beach">Beach</option>
                        <option value="culinary">Culinary</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days) *</label>
                      <input
                        type="number"
                        value={newTrip.duration}
                        onChange={(e) => setNewTrip({ ...newTrip, duration: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter duration in days"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level *</label>
                      <select
                        value={newTrip.difficulty}
                        onChange={(e) => setNewTrip({ ...newTrip, difficulty: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="easy">Easy</option>
                        <option value="moderate">Moderate</option>
                        <option value="challenging">Challenging</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price (LKR) *</label>
                      <input
                        type="number"
                        value={newTrip.price}
                        onChange={(e) => setNewTrip({ ...newTrip, price: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter price in LKR"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Participants *</label>
                      <input
                        type="number"
                        value={newTrip.maxParticipants}
                        onChange={(e) => setNewTrip({ ...newTrip, maxParticipants: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Maximum number of participants"
                        min="1"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                      <input
                        type="text"
                        value={newTrip.location}
                        onChange={(e) => setNewTrip({ ...newTrip, location: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter location (e.g., Colombo, Kandy, Sigiriya)"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                      <textarea
                        value={newTrip.description}
                        onChange={(e) => setNewTrip({ ...newTrip, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="4"
                        placeholder="Describe the trip experience, what participants will see and do..."
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h4>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
                      <div className="flex flex-wrap gap-2">
                        {['English', 'Sinhala', 'Tamil'].map((lang) => (
                          <label key={lang} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={newTrip.languages?.includes(lang) || false}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewTrip({ ...newTrip, languages: [...(newTrip.languages || []), lang] });
                                } else {
                                  setNewTrip({ ...newTrip, languages: (newTrip.languages || []).filter(l => l !== lang) });
                                }
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">{lang}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Trip Highlights</label>
                      <div className="space-y-2">
                        {(newTrip.highlights || []).map((highlight, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={highlight}
                              onChange={(e) => {
                                const newHighlights = [...newTrip.highlights];
                                newHighlights[index] = e.target.value;
                                setNewTrip({ ...newTrip, highlights: newHighlights });
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter highlight"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newHighlights = (newTrip.highlights || []).filter((_, i) => i !== index);
                                setNewTrip({ ...newTrip, highlights: newHighlights });
                              }}
                              className="p-2 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setNewTrip({ ...newTrip, highlights: [...(newTrip.highlights || []), ''] })}
                          className="flex items-center px-3 py-2 text-blue-600 hover:text-blue-800"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Highlight
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">What's Included</label>
                      <div className="space-y-2">
                        {(newTrip.included || []).map((item, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const newIncluded = [...newTrip.included];
                                newIncluded[index] = e.target.value;
                                setNewTrip({ ...newTrip, included: newIncluded });
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter included item"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newIncluded = (newTrip.included || []).filter((_, i) => i !== index);
                                setNewTrip({ ...newTrip, included: newIncluded });
                              }}
                              className="p-2 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setNewTrip({ ...newTrip, included: [...(newTrip.included || []), ''] })}
                          className="flex items-center px-3 py-2 text-blue-600 hover:text-blue-800"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Included Item
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">What's Not Included</label>
                      <div className="space-y-2">
                        {(newTrip.excluded || []).map((item, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const newExcluded = [...newTrip.excluded];
                                newExcluded[index] = e.target.value;
                                setNewTrip({ ...newTrip, excluded: newExcluded });
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter excluded item"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newExcluded = (newTrip.excluded || []).filter((_, i) => i !== index);
                                setNewTrip({ ...newTrip, excluded: newExcluded });
                              }}
                              className="p-2 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setNewTrip({ ...newTrip, excluded: [...(newTrip.excluded || []), ''] })}
                          className="flex items-center px-3 py-2 text-blue-600 hover:text-blue-800"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Excluded Item
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h4>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                      <textarea
                        value={newTrip.requirements}
                        onChange={(e) => setNewTrip({ ...newTrip, requirements: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="3"
                        placeholder="What participants need to bring or prepare..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Policy</label>
                      <select
                        value={newTrip.cancellationPolicy}
                        onChange={(e) => setNewTrip({ ...newTrip, cancellationPolicy: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select cancellation policy</option>
                        <option value="flexible">Flexible - Free cancellation up to 24 hours before</option>
                        <option value="moderate">Moderate - Free cancellation up to 7 days before</option>
                        <option value="strict">Strict - No refunds, only rescheduling</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Details</label>
                      <textarea
                        value={newTrip.cancellationDetails || ''}
                        onChange={(e) => setNewTrip({ ...newTrip, cancellationDetails: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="3"
                        placeholder="Additional details about cancellation and refund policy..."
                      />
                    </div>
                  </div>
                </div>

                {/* Trip Images */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Trip Images</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Image URLs</label>
                      <p className="text-sm text-gray-500 mb-3">
                        Add image URLs (recommended: Unsplash links for high-quality photos)
                      </p>
                      <div className="space-y-3">
                        {(newTrip.images || []).map((image, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="flex-1">
                              <input
                                type="url"
                                value={image}
                                onChange={(e) => {
                                  const newImages = [...newTrip.images];
                                  newImages[index] = e.target.value;
                                  setNewTrip({ ...newTrip, images: newImages });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://images.unsplash.com/photo-..."
                              />
                            </div>
                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {image ? (
                                <img
                                  src={image}
                                  alt={`Trip image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className="w-full h-full flex items-center justify-center text-gray-400"
                                style={{ display: image ? 'none' : 'flex' }}
                              >
                                <Camera className="h-6 w-6" />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newImages = (newTrip.images || []).filter((_, i) => i !== index);
                                setNewTrip({ ...newTrip, images: newImages });
                              }}
                              className="p-2 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setNewTrip({ ...newTrip, images: [...(newTrip.images || []), ''] })}
                          className="flex items-center px-3 py-2 text-blue-600 hover:text-blue-800"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Image URL
                        </button>
                      </div>
                    </div>
                    
                    {/* Sample Unsplash Links */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-blue-900 mb-2">💡 Sample Unsplash Links:</h5>
                      <div className="text-xs text-blue-700 space-y-1">
                        <p>• https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800</p>
                        <p>• https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800</p>
                        <p>• https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800</p>
                        <p className="text-blue-600 mt-2">💡 Tip: Add ?w=800 to the end of Unsplash URLs for optimal size</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Trip
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Trip Modal */}
      {showEditModal && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Edit Trip</h3>
                  <p className="text-gray-600">Update trip information and details</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateTrip} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Trip Title *</label>
                      <input
                        type="text"
                        value={newTrip.title}
                        onChange={(e) => setNewTrip({ ...newTrip, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter trip title"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                      <select
                        value={newTrip.category}
                        onChange={(e) => setNewTrip({ ...newTrip, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="cultural">Cultural</option>
                        <option value="adventure">Adventure</option>
                        <option value="nature">Nature</option>
                        <option value="historical">Historical</option>
                        <option value="religious">Religious</option>
                        <option value="wildlife">Wildlife</option>
                        <option value="beach">Beach</option>
                        <option value="culinary">Culinary</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days) *</label>
                      <input
                        type="number"
                        value={newTrip.duration}
                        onChange={(e) => setNewTrip({ ...newTrip, duration: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter duration in days"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price (LKR) *</label>
                      <input
                        type="number"
                        value={newTrip.price}
                        onChange={(e) => setNewTrip({ ...newTrip, price: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter price in LKR"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Participants *</label>
                      <input
                        type="number"
                        value={newTrip.maxParticipants}
                        onChange={(e) => setNewTrip({ ...newTrip, maxParticipants: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Maximum number of participants"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                      <select
                        value={newTrip.difficulty}
                        onChange={(e) => setNewTrip({ ...newTrip, difficulty: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="easy">Easy</option>
                        <option value="moderate">Moderate</option>
                        <option value="challenging">Challenging</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                      <input
                        type="text"
                        value={newTrip.location}
                        onChange={(e) => setNewTrip({ ...newTrip, location: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter location (e.g., Kandy, Sri Lanka)"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                      <textarea
                        value={newTrip.description}
                        onChange={(e) => setNewTrip({ ...newTrip, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="4"
                        placeholder="Describe the trip experience..."
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h4>
                  <div className="space-y-6">
                    {/* Highlights */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Highlights</label>
                      <div className="space-y-3">
                        {(newTrip.highlights || []).map((highlight, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <input
                              type="text"
                              value={highlight}
                              onChange={(e) => {
                                const newHighlights = [...(newTrip.highlights || [])];
                                newHighlights[index] = e.target.value;
                                setNewTrip({ ...newTrip, highlights: newHighlights });
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter highlight"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newHighlights = (newTrip.highlights || []).filter((_, i) => i !== index);
                                setNewTrip({ ...newTrip, highlights: newHighlights });
                              }}
                              className="p-2 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setNewTrip({ ...newTrip, highlights: [...(newTrip.highlights || []), ''] })}
                          className="flex items-center px-3 py-2 text-blue-600 hover:text-blue-800"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Highlight
                        </button>
                      </div>
                    </div>

                    {/* Included Items */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Included Items</label>
                      <div className="space-y-3">
                        {(newTrip.included || []).map((item, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const newIncluded = [...(newTrip.included || [])];
                                newIncluded[index] = e.target.value;
                                setNewTrip({ ...newTrip, included: newIncluded });
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter included item"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newIncluded = (newTrip.included || []).filter((_, i) => i !== index);
                                setNewTrip({ ...newTrip, included: newIncluded });
                              }}
                              className="p-2 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setNewTrip({ ...newTrip, included: [...(newTrip.included || []), ''] })}
                          className="flex items-center px-3 py-2 text-blue-600 hover:text-blue-800"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Included Item
                        </button>
                      </div>
                    </div>

                    {/* Excluded Items */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Excluded Items</label>
                      <div className="space-y-3">
                        {(newTrip.excluded || []).map((item, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const newExcluded = [...(newTrip.excluded || [])];
                                newExcluded[index] = e.target.value;
                                setNewTrip({ ...newTrip, excluded: newExcluded });
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter excluded item"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newExcluded = (newTrip.excluded || []).filter((_, i) => i !== index);
                                setNewTrip({ ...newTrip, excluded: newExcluded });
                              }}
                              className="p-2 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setNewTrip({ ...newTrip, excluded: [...(newTrip.excluded || []), ''] })}
                          className="flex items-center px-3 py-2 text-blue-600 hover:text-blue-800"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Excluded Item
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h4>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                      <textarea
                        value={newTrip.requirements}
                        onChange={(e) => setNewTrip({ ...newTrip, requirements: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="3"
                        placeholder="What participants need to bring or prepare..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Policy</label>
                      <select
                        value={newTrip.cancellationPolicy}
                        onChange={(e) => setNewTrip({ ...newTrip, cancellationPolicy: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select cancellation policy</option>
                        <option value="flexible">Flexible - Free cancellation up to 24 hours before</option>
                        <option value="moderate">Moderate - Free cancellation up to 7 days before</option>
                        <option value="strict">Strict - No refunds, only rescheduling</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Details</label>
                      <textarea
                        value={newTrip.cancellationDetails || ''}
                        onChange={(e) => setNewTrip({ ...newTrip, cancellationDetails: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="3"
                        placeholder="Additional details about cancellation and refund policy..."
                      />
                    </div>
                  </div>
                </div>

                {/* Trip Images */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Trip Images</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Image URLs</label>
                      <p className="text-sm text-gray-500 mb-3">
                        Add image URLs (recommended: Unsplash links for high-quality photos)
                      </p>
                      <div className="space-y-3">
                        {(newTrip.images || []).map((image, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="flex-1">
                              <input
                                type="url"
                                value={image}
                                onChange={(e) => {
                                  const newImages = [...(newTrip.images || [])];
                                  newImages[index] = e.target.value;
                                  setNewTrip({ ...newTrip, images: newImages });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://images.unsplash.com/photo-..."
                              />
                            </div>
                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {image ? (
                                <img
                                  src={image}
                                  alt={`Trip image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                className="w-full h-full flex items-center justify-center text-gray-400"
                                style={{ display: image ? 'none' : 'flex' }}
                              >
                                <Camera className="h-6 w-6" />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newImages = (newTrip.images || []).filter((_, i) => i !== index);
                                setNewTrip({ ...newTrip, images: newImages });
                              }}
                              className="p-2 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setNewTrip({ ...newTrip, images: [...(newTrip.images || []), ''] })}
                          className="flex items-center px-3 py-2 text-blue-600 hover:text-blue-800"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Image URL
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Update Trip
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Trip</h3>
                  <p className="text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete "{selectedTrip.title}"? This will permanently remove the trip and all associated data.
              </p>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteTrip(selectedTrip._id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  Delete Trip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripManagement;