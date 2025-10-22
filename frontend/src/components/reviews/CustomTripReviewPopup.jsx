import React, { useState, useEffect } from 'react';
import { Star, X, Edit3, Trash2, User, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import customTripReviewService from '../../services/customTripReviewService';
import CustomTripReviewForm from './CustomTripReviewForm';
import EditCustomTripReviewPopup from './EditCustomTripReviewPopup';
import { useAuth } from '../../context/AuthContext';

const CustomTripReviewPopup = ({ 
  customTripId, 
  customTripData, 
  onClose, 
  onSubmit,
  onEditReview,
  onDeleteReview 
}) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [ratingStats, setRatingStats] = useState(null);
  const [ratingDistribution, setRatingDistribution] = useState({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Form state for inline review form
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
    name: user?.firstName ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || ''
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [canReview, setCanReview] = useState(true);
  const [existingReview, setExistingReview] = useState(null);

  useEffect(() => {
    fetchReviews();
    checkReviewEligibility();
  }, [customTripId, sortBy, currentPage]);

  const checkReviewEligibility = async () => {
    try {
      const response = await customTripReviewService.canReviewCustomTrip(customTripId);
      if (response.success) {
        setCanReview(response.data.canReview);
        if (response.data.hasExistingReview) {
          setExistingReview(response.data.existingReview);
          // Pre-fill form with existing review data
          setFormData(prev => ({
            ...prev,
            rating: response.data.existingReview.rating,
            comment: response.data.existingReview.comment
          }));
        }
      }
    } catch (error) {
      console.error('Error checking review eligibility:', error);
    }
  };

  useEffect(() => {
    // Update form data when user changes
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      }));
    }
  }, [user]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await customTripReviewService.getCustomTripReviews(customTripId, {
        page: currentPage,
        limit: 5,
        sortBy
      });

      if (response.success) {
        setReviews(response.data.reviews);
        setRatingStats(response.data.ratingStats);
        setRatingDistribution(response.data.ratingDistribution);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.rating || formData.rating === 0) {
      newErrors.rating = 'Please select a rating';
    }
    
    if (!formData.comment.trim()) {
      newErrors.comment = 'Please write a review';
    } else if (formData.comment.trim().length < 10) {
      newErrors.comment = 'Review must be at least 10 characters long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    setEditingReview(null);
    fetchReviews();
    if (onSubmit) onSubmit();
  };

  const handleEditPopupClose = () => {
    setShowEditPopup(false);
    setEditingReview(null);
  };

  const handleReviewUpdated = () => {
    fetchReviews();
    if (onSubmit) onSubmit();
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setShowEditPopup(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await customTripReviewService.deleteReview(reviewId);
        toast.success('Review deleted successfully');
        fetchReviews();
        if (onDeleteReview) onDeleteReview(reviewId);
      } catch (error) {
        console.error('Error deleting review:', error);
        toast.error('Failed to delete review');
      }
    }
  };

  const handleInlineFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setSubmitting(true);

    try {
      console.log('Frontend: Custom trip data:', customTripData);
      console.log('Frontend: Duration type:', typeof customTripData?.duration);
      console.log('Frontend: Duration value:', customTripData?.duration);

      const reviewData = {
        customTripId,
        rating: formData.rating,
        comment: formData.comment.trim(),
        tripDetails: {
          destination: customTripData?.destination || customTripData?.location,
          duration: typeof customTripData?.duration === 'string' ? 
            (customTripData.duration === 'multi-day' ? 7 : 
             customTripData.duration === 'full-day' ? 1 : 
             customTripData.duration === 'half-day' ? 0.5 : 1) : 
            customTripData?.duration || 1,
          groupSize: customTripData?.groupSize || 1,
          startDate: customTripData?.startDate,
          endDate: customTripData?.endDate
        }
      };

      console.log('Frontend: Sending review data:', reviewData);

      if (existingReview) {
        // Update existing review
        await customTripReviewService.updateReview(existingReview.id, {
          rating: formData.rating,
          comment: formData.comment.trim()
        });
        toast.success('Review updated successfully!');
      } else {
        // Create new review
        await customTripReviewService.createReview(reviewData);
        toast.success('Review submitted successfully!');
      }
      
      // Reset form
      if (existingReview) {
        // Keep existing review data for editing
        setFormData(prev => ({
          ...prev,
          rating: formData.rating,
          comment: formData.comment
        }));
      } else {
        // Reset to empty for new reviews
        setFormData({
          rating: 0,
          comment: '',
          name: user?.firstName ? `${user.firstName} ${user.lastName}` : '',
          email: user?.email || ''
        });
      }
      setErrors({}); // Clear errors on successful submission
      
      fetchReviews();
      checkReviewEligibility(); // Refresh eligibility check
      if (onSubmit) onSubmit();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating, interactive = false, onRatingChange = null, hovered = 0) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            className={interactive ? "cursor-pointer hover:scale-110 transition-transform duration-150" : "cursor-default"}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
            onMouseEnter={interactive ? () => setHoveredRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoveredRating(0) : undefined}
            disabled={!interactive}
          >
            <Star
              className={`w-3 h-3 ${
                star <= (hovered || rating)
                  ? 'text-orange-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const renderLargeStars = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-10 h-10 ${
              star <= rating
                ? 'text-orange-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const getEntityName = () => {
    return customTripData?.title || `Custom Trip to ${customTripData?.destination}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            Review {getEntityName()}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Reviews and Statistics */}
            <div className="space-y-6">
              {/* Rating Distribution */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Rating Distribution</h3>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2 w-16">
                        <span className="text-sm font-medium text-gray-700">
                          {rating === 5 ? 'FIVE' : rating === 4 ? 'FOUR' : rating === 3 ? 'THREE' : rating === 2 ? 'TWO' : 'ONE'}
                        </span>
                        <Star className="w-3 h-3 text-orange-400 fill-current" />
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${ratingStats?.totalReviews > 0 ? (ratingDistribution[rating] / ratingStats.totalReviews) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {ratingDistribution[rating] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Feedbacks */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Recent Feedbacks</h3>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Loading reviews...</p>
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No reviews yet. Be the first to review!</p>
                    </div>
                  ) : (
                    reviews.map((review) => (
                      <div key={review._id} className="bg-white border rounded-lg p-4 shadow-sm">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {review.user?.firstName?.charAt(0)}{review.user?.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-semibold text-gray-900">
                                  {review.user?.firstName} {review.user?.lastName}
                                </h4>
                                {renderStars(review.rating)}
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditReview(review)}
                                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                  title="Edit review"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteReview(review._id)}
                                  className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                  title="Delete review"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm">{review.comment}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatDate(review.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Overall Rating and Add Review Form */}
            <div className="space-y-6">
              {/* Overall Rating */}
              <div className="bg-yellow-50 rounded-lg p-6 text-center border border-yellow-200">
                <div className="text-5xl font-bold text-orange-600 mb-3">
                  {ratingStats?.averageRating?.toFixed(1) || '0.0'}
                </div>
                <div className="mb-3">
                  {renderLargeStars(Math.round(ratingStats?.averageRating || 0))}
                </div>
                <div className="text-gray-700 font-medium">
                  {ratingStats?.totalReviews || 0} Rating{(ratingStats?.totalReviews || 0) !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Add/Edit Review Form */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4">
                  {existingReview ? 'Edit Your Review' : 'Add a Review'}
                </h3>
                <form onSubmit={handleInlineFormSubmit} className="space-y-4">
                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {existingReview ? 'Update Your Rating' : 'Add Your Rating'} *
                    </label>
                    <div className="flex items-center space-x-1">
                      {renderStars(formData.rating, true, (rating) => {
                        setFormData(prev => ({ ...prev, rating }));
                        // Clear rating error when user selects a rating
                        if (errors.rating) {
                          setErrors(prev => ({ ...prev, rating: '' }));
                        }
                      }, hoveredRating)}
                    </div>
                    {errors.rating && (
                      <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
                    )}
                  </div>

                  {/* Name - Read Only */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.name}
                        readOnly
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Automatically filled from your profile</p>
                  </div>

                  {/* Email - Read Only */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        readOnly
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Automatically filled from your profile</p>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {existingReview ? 'Update Your Review' : 'Write Your Review'} *
                    </label>
                    <textarea
                      value={formData.comment}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, comment: e.target.value }));
                        // Clear comment error when user starts typing
                        if (errors.comment) {
                          setErrors(prev => ({ ...prev, comment: '' }));
                        }
                      }}
                      placeholder={existingReview ? "Update your experience with this custom trip..." : "Share your experience with this custom trip..."}
                      rows={4}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                        errors.comment ? 'border-red-300' : 'border-gray-300'
                      }`}
                      required
                    />
                    {errors.comment && (
                      <p className="mt-1 text-sm text-red-600">{errors.comment}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.comment.length}/500 characters (minimum 10)
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-yellow-500 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {submitting 
                      ? (existingReview ? 'Updating...' : 'Submitting...') 
                      : (existingReview ? 'Update Review' : 'Submit Review')
                    }
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Review Popup */}
      {showEditPopup && editingReview && (
        <EditCustomTripReviewPopup
          review={editingReview}
          isOpen={showEditPopup}
          onClose={handleEditPopupClose}
          onReviewUpdated={handleReviewUpdated}
        />
      )}

      {/* Detailed Review Form Modal */}
      {showReviewForm && (
        <CustomTripReviewForm
          customTripId={customTripId}
          customTripData={customTripData}
          onReviewSubmitted={handleReviewSubmitted}
          onCancel={() => {
            setShowReviewForm(false);
            setEditingReview(null);
          }}
          existingReview={editingReview}
        />
      )}
    </div>
  );
};

export default CustomTripReviewPopup;
