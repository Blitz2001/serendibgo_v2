// Staff Review Management Component
import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Eye, Search, Filter, MapPin, Clock, DollarSign, Users, Star, Calendar, Camera, Save, X, Upload, Globe, Award, Heart, CheckCircle, AlertCircle, MoreHorizontal, RefreshCw, Download, ChevronDown, ChevronUp, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, FileText, BarChart3, TrendingUp, TrendingDown, Activity, Shield, Zap, Target, Info, Edit3, Copy, Share, Archive, Ban, Unlock, Lock, EyeOff, Send, Reply, Phone, Mail, User, Building, Car, Compass, Navigation, Flag, Layers, Package, Tag, Hash, Percent, PieChart, LineChart, Monitor, Server, Database, Cpu, HardDrive, Wifi, Signal, Battery, Thermometer, Gauge, CheckSquare, Square, MoreHorizontal as MoreHorizontalIcon, Edit as EditIcon, Trash as TrashIcon, Copy as CopyIcon, Share as ShareIcon, Archive as ArchiveIcon, Ban as BanIcon, Unlock as UnlockIcon, Lock as LockIcon, EyeOff as EyeOffIcon, Send as SendIcon, Reply as ReplyIcon, MessageSquare, ThumbsUp, ThumbsDown, Flag as FlagIcon, Shield as ShieldIcon, CheckCircle as CheckCircleIcon, XCircle, AlertTriangle, Star as StarIcon, StarHalf, StarOff
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import staffService from '../../../services/staff/staffService';
import toast from 'react-hot-toast';

const ReviewManagement = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    rating: 'all',
    type: 'all',
    service: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  // Fetch reviews
  const fetchReviews = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        ...filters
      };
      if (searchTerm) params.search = searchTerm;
      
      console.log('Fetching reviews with params:', params);
      const data = await staffService.getReviews(params);
      console.log('Reviews data:', data);
      setReviews(data.data.reviews);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Fetch reviews error:', error);
      toast.error(error.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    if (!isAuthenticated) return;
    
    try {
      const data = await staffService.getReviewStatistics();
      console.log('Review statistics data:', data);
      setStatistics(data.data);
    } catch (error) {
      console.error('Fetch statistics error:', error);
      // Set default values if API fails
      setStatistics({
        total: 0,
        pending: 0,
        flagged: 0,
        averageRating: '0.0'
      });
    }
  };

  // Initial load
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchReviews();
      fetchStatistics();
    }
  }, [isAuthenticated, isLoading]);

  // Filter changes
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchReviews();
    }
  }, [filters.status, filters.rating, filters.type, filters.service, searchTerm]);

  // Handle viewing details
  const handleViewDetails = async (review) => {
    setSelectedReview(review);
    setShowDetailsModal(true);
  };

  // Handle delete review
  const handleDeleteReview = async (reviewId) => {
    try {
      await staffService.deleteReview(reviewId);
      toast.success('Review deleted successfully');
      fetchReviews();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Delete review error:', error);
      toast.error(error.message || 'Failed to delete review');
    }
  };

  // Handle bulk operations
  const handleBulkAction = async (action) => {
    if (selectedReviews.length === 0) {
      toast.error('Please select reviews first');
      return;
    }

    try {
      await staffService.bulkReviewAction(selectedReviews, action);
      toast.success(`${action} completed successfully`);
      fetchReviews();
      setSelectedReviews([]);
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error(error.message || `Failed to ${action} reviews`);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedReviews.length === reviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(reviews.map(review => review._id));
    }
  };

  // Handle individual select
  const handleSelectReview = (reviewId) => {
    if (selectedReviews.includes(reviewId)) {
      setSelectedReviews(selectedReviews.filter(id => id !== reviewId));
    } else {
      setSelectedReviews([...selectedReviews, reviewId]);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'flagged': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return CheckCircle;
      case 'pending': return Clock;
      case 'rejected': return XCircle;
      case 'flagged': return FlagIcon;
      default: return AlertCircle;
    }
  };

  // Get rating color
  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    if (rating >= 2) return 'text-orange-600';
    return 'text-red-600';
  };

  // Get service type icon
  const getServiceTypeIcon = (type) => {
    switch (type) {
      case 'hotel': return Building;
      case 'guide': return User;
      case 'vehicle': return Car;
      case 'tour': return Compass;
      default: return Package;
    }
  };

  // Render stars
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<StarIcon key={i} className="h-4 w-4 text-yellow-400 fill-current" />);
      } else {
        stars.push(<StarIcon key={i} className="h-4 w-4 text-gray-300" />);
      }
    }
    return stars;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Review Management</h2>
          <p className="text-slate-600">Manage all user reviews and ratings</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchReviews}
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
              <p className="text-sm font-medium text-slate-600">Total Reviews</p>
              <p className="text-2xl font-bold text-slate-900">{statistics.total || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending Review</p>
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
              <p className="text-sm font-medium text-slate-600">Flagged Reviews</p>
              <p className="text-2xl font-bold text-orange-600">{statistics.flagged || 0}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FlagIcon className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Average Rating</p>
              <p className="text-2xl font-bold text-purple-600">{statistics.averageRating || '0.0'}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <StarIcon className="h-6 w-6 text-purple-600" />
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
                  placeholder="Search reviews..."
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
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
              <select
                value={filters.rating}
                onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Service Type</label>
              <select
                value={filters.service}
                onChange={(e) => setFilters({ ...filters, service: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Services</option>
                <option value="hotel">Hotels</option>
                <option value="guide">Guides</option>
                <option value="vehicle">Vehicles</option>
                <option value="tour">Tours</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3 mt-4">
            <button
              onClick={() => {
                setFilters({ status: 'all', rating: 'all', type: 'all', service: 'all', sortBy: 'createdAt', sortOrder: 'desc' });
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
      {selectedReviews.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedReviews.length} review(s) selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('approve')}
                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Approve
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Reject
              </button>
              <button
                onClick={() => handleBulkAction('flag')}
                className="px-3 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
              >
                Flag
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Reviews</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSelectAll}
                className="flex items-center px-3 py-1 text-slate-600 hover:text-slate-900 transition-colors"
              >
                {selectedReviews.length === reviews.length ? (
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
            <p className="text-slate-600">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No reviews found</h3>
            <p className="text-slate-500">No reviews match your current filters</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {reviews.map((review) => {
              const StatusIcon = getStatusIcon(review.status);
              const ServiceTypeIcon = getServiceTypeIcon(review.serviceType);
              return (
                <div key={review._id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedReviews.includes(review._id)}
                        onChange={() => handleSelectReview(review._id)}
                        className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      
                      <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden">
                        {review.userAvatar ? (
                          <img
                            src={review.userAvatar}
                            alt={review.userName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="h-6 w-6 text-slate-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-slate-900">{review.userName}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {review.status}
                          </span>
                          <div className="flex items-center space-x-1">
                            {renderStars(review.rating)}
                            <span className={`ml-1 text-sm font-medium ${getRatingColor(review.rating)}`}>
                              {review.rating}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-slate-600 mb-3 line-clamp-2">{review.comment}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-slate-500">
                          <div className="flex items-center space-x-1">
                            <ServiceTypeIcon className="h-4 w-4" />
                            <span>{review.serviceType}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Building className="h-4 w-4" />
                            <span>{review.serviceName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDetails(review)}
                        className="flex items-center px-3 py-1 text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReview(review);
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

      {/* Review Details Modal */}
      {showDetailsModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Review Details</h3>
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
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Review Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Reviewer</p>
                          <p className="font-medium text-gray-900">{selectedReview.userName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <StarIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Rating</p>
                          <div className="flex items-center space-x-1">
                            {renderStars(selectedReview.rating)}
                            <span className={`ml-1 font-medium ${getRatingColor(selectedReview.rating)}`}>
                              {selectedReview.rating}/5
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Date</p>
                          <p className="font-medium text-gray-900">
                            {new Date(selectedReview.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Review Comment</h4>
                    <p className="text-gray-700">{selectedReview.comment}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Service Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Building className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Service</p>
                          <p className="font-medium text-gray-900">{selectedReview.serviceName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Package className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Type</p>
                          <p className="font-medium text-gray-900">{selectedReview.serviceType}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Review Status</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedReview.status)}`}>
                        <StatusIcon className="h-4 w-4 mr-1" />
                        {selectedReview.status}
                      </span>
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Review</h3>
                  <p className="text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this review? This will permanently remove the review and all associated data.
              </p>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteReview(selectedReview._id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  Delete Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewManagement;