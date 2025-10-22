import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff,
  Trash2,
  Calendar,
  User,
  Building,
  MapPin,
  MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import adminReviewService from '../../services/adminReviewService';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    rating: 'all',
    search: '',
    sortBy: 'newest'
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [currentPage, filters]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await adminReviewService.getAllReviews({
        page: currentPage,
        limit: 20,
        ...filters
      });

      if (response.success) {
        setReviews(response.data.reviews);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminReviewService.getReviewStatistics();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleStatusUpdate = async (reviewId, reviewType, status) => {
    try {
      await adminReviewService.updateReviewStatus(reviewId, reviewType, status);
      toast.success(`Review ${status} successfully`);
      fetchReviews();
    } catch (error) {
      console.error('Error updating review status:', error);
      toast.error('Failed to update review status');
    }
  };

  const handleDeleteReview = async (reviewId, reviewType) => {
    if (window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      try {
        await adminReviewService.deleteReview(reviewId, reviewType);
        toast.success('Review deleted successfully');
        fetchReviews();
      } catch (error) {
        console.error('Error deleting review:', error);
        toast.error('Failed to delete review');
      }
    }
  };

  const renderStars = (rating, size = 'w-4 h-4') => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getReviewTypeIcon = (type) => {
    switch (type) {
      case 'hotel':
        return <Building className="w-4 h-4 text-blue-500" />;
      case 'guide':
        return <User className="w-4 h-4 text-green-500" />;
      case 'custom-trip':
        return <MapPin className="w-4 h-4 text-purple-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  const getReviewTypeColor = (type) => {
    switch (type) {
      case 'hotel':
        return 'bg-blue-100 text-blue-800';
      case 'guide':
        return 'bg-green-100 text-green-800';
      case 'custom-trip':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRatingValue = (review) => {
    if (review.reviewType === 'hotel') {
      return review.rating?.overall || 0;
    }
    return review.rating || 0;
  };

  const getReviewContent = (review) => {
    if (review.reviewType === 'hotel') {
      return review.content || '';
    }
    return review.comment || '';
  };

  const getReviewTitle = (review) => {
    if (review.reviewType === 'hotel') {
      return review.hotel?.name || 'Hotel Review';
    } else if (review.reviewType === 'guide') {
      return review.tour?.title || review.guide?.firstName + ' ' + review.guide?.lastName || 'Guide Review';
    } else if (review.reviewType === 'custom-trip') {
      return review.customTrip?.title || 'Custom Trip Review';
    }
    return 'Review';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Management</h1>
        <p className="text-gray-600">Manage and moderate all platform reviews</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hotel Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.hotelReviews.total}</p>
                <p className="text-sm text-gray-500">
                  Avg: {stats.hotelReviews.averageRating?.toFixed(1) || '0.0'} ⭐
                </p>
              </div>
              <Building className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Guide Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.guideReviews.total}</p>
                <p className="text-sm text-gray-500">
                  Avg: {stats.guideReviews.averageRating?.toFixed(1) || '0.0'} ⭐
                </p>
              </div>
              <User className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Custom Trip Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.customTripReviews.total}</p>
                <p className="text-sm text-gray-500">
                  Avg: {stats.customTripReviews.averageRating?.toFixed(1) || '0.0'} ⭐
                </p>
              </div>
              <MapPin className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="hotel">Hotel Reviews</option>
                <option value="guide">Guide Reviews</option>
                <option value="custom-trip">Custom Trip Reviews</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <select
                value={filters.rating}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-lg shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No reviews found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reviews.map((review) => (
              <div key={`${review.reviewType}-${review.reviewId}`} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getReviewTypeIcon(review.reviewType)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReviewTypeColor(review.reviewType)}`}>
                        {review.reviewType?.replace('-', ' ').toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1">
                        {renderStars(getRatingValue(review))}
                        <span className="text-sm text-gray-600 ml-1">
                          ({getRatingValue(review)}/5)
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        review.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {review.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-1">
                      {getReviewTitle(review)}
                    </h3>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {review.user?.firstName} {review.user?.lastName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(review.createdAt)}
                      </div>
                    </div>

                    <p className="text-gray-700 mb-3 line-clamp-2">
                      {getReviewContent(review)}
                    </p>

                    {/* Review Details */}
                    <div className="text-sm text-gray-600">
                      {review.reviewType === 'hotel' && review.hotel && (
                        <p><strong>Hotel:</strong> {review.hotel.name}</p>
                      )}
                      {review.reviewType === 'guide' && review.guide && (
                        <p><strong>Guide:</strong> {review.guide.firstName} {review.guide.lastName}</p>
                      )}
                      {review.reviewType === 'custom-trip' && review.customTrip && (
                        <p><strong>Destination:</strong> {review.customTrip.destination}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {review.isActive ? (
                      <button
                        onClick={() => handleStatusUpdate(review.reviewId, review.reviewType, 'inactive')}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Deactivate"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusUpdate(review.reviewId, review.reviewType, 'active')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Activate"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteReview(review.reviewId, review.reviewType)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * 20) + 1} to {Math.min(pagination.currentPage * 20, pagination.totalReviews)} of {pagination.totalReviews} reviews
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="px-3 py-2 text-sm text-gray-700">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                  disabled={!pagination.hasNext}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReviews;
