import React, { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import customTripReviewService from '../../services/customTripReviewService';

const EditCustomTripReviewPopup = ({ 
  review, 
  isOpen, 
  onClose, 
  onReviewUpdated 
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (review && isOpen) {
      setRating(review.rating || 0);
      setComment(review.comment || '');
      setErrors({});
    }
  }, [review, isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!rating || rating === 0) {
      newErrors.rating = 'Please select a rating';
    }
    
    if (!comment.trim()) {
      newErrors.comment = 'Please write a review';
    } else if (comment.trim().length < 10) {
      newErrors.comment = 'Review must be at least 10 characters long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setLoading(true);

    try {
      await customTripReviewService.updateReview(review._id, {
        rating,
        comment: comment.trim()
      });
      
      toast.success('Review updated successfully!');
      onReviewUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating review:', error);
      toast.error(error.response?.data?.message || 'Failed to update review');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (currentRating, interactive = false) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            className={interactive ? "cursor-pointer hover:scale-110 transition-transform duration-150" : "cursor-default"}
            onClick={interactive ? () => {
              setRating(star);
              if (errors.rating) {
                setErrors(prev => ({ ...prev, rating: '' }));
              }
            } : undefined}
            disabled={!interactive}
          >
            <Star
              className={`w-6 h-6 ${
                star <= currentRating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen || !review) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Edit Review</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating *
            </label>
            {renderStars(rating, true)}
            {errors.rating && (
              <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review *
            </label>
            <textarea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (errors.comment) {
                  setErrors(prev => ({ ...prev, comment: '' }));
                }
              }}
              placeholder="Share your experience..."
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
              {comment.length}/500 characters (minimum 10)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCustomTripReviewPopup;
