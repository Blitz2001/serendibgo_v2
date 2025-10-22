import React, { useState, useEffect } from 'react';
import { Star, X, Camera, Upload, MapPin, Calendar, Users, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import customTripReviewService from '../../services/customTripReviewService';

const CustomTripReviewForm = ({ 
  customTripId, 
  customTripData, 
  onReviewSubmitted, 
  onCancel,
  existingReview = null 
}) => {
  const [formData, setFormData] = useState({
    rating: existingReview?.rating || 0,
    title: existingReview?.title || '',
    comment: existingReview?.comment || '',
    detailedRatings: {
      guideService: existingReview?.detailedRatings?.guideService || 0,
      accommodation: existingReview?.detailedRatings?.accommodation || 0,
      transportation: existingReview?.detailedRatings?.transportation || 0,
      itinerary: existingReview?.detailedRatings?.itinerary || 0,
      valueForMoney: existingReview?.detailedRatings?.valueForMoney || 0
    },
    additionalComments: {
      guideComment: existingReview?.additionalComments?.guideComment || '',
      accommodationComment: existingReview?.additionalComments?.accommodationComment || '',
      transportationComment: existingReview?.additionalComments?.transportationComment || '',
      itineraryComment: existingReview?.additionalComments?.itineraryComment || ''
    },
    images: existingReview?.images || []
  });

  const [hoveredRating, setHoveredRating] = useState(0);
  const [hoveredDetailedRating, setHoveredDetailedRating] = useState({});
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);

  const detailedRatingLabels = {
    guideService: 'Guide Service',
    accommodation: 'Accommodation',
    transportation: 'Transportation',
    itinerary: 'Itinerary Planning',
    valueForMoney: 'Value for Money'
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleDetailedRatingChange = (category, rating) => {
    setFormData(prev => ({
      ...prev,
      detailedRatings: {
        ...prev.detailedRatings,
        [category]: rating
      }
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAdditionalCommentChange = (category, value) => {
    setFormData(prev => ({
      ...prev,
      additionalComments: {
        ...prev.additionalComments,
        [category]: value
      }
    }));
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select valid image files');
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setImageFiles(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} image(s) selected`);
    }
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.rating || !formData.title || !formData.comment) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.rating < 1 || formData.rating > 5) {
      toast.error('Please provide a valid rating');
      return;
    }

    setLoading(true);

    try {
      const reviewData = {
        customTripId,
        rating: formData.rating,
        title: formData.title,
        comment: formData.comment,
        detailedRatings: formData.detailedRatings,
        additionalComments: formData.additionalComments,
        tripDetails: {
          destination: customTripData?.destination,
          duration: customTripData?.duration,
          groupSize: customTripData?.groupSize,
          startDate: customTripData?.startDate,
          endDate: customTripData?.endDate
        }
      };

      if (existingReview) {
        await customTripReviewService.updateReview(existingReview._id, reviewData);
        toast.success('Review updated successfully!');
      } else {
        await customTripReviewService.createReview(reviewData);
        toast.success('Review submitted successfully!');
      }

      onReviewSubmitted();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const renderStarRating = (rating, onRatingChange, hovered, onHover) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="focus:outline-none"
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => onHover(star)}
          onMouseLeave={() => onHover(0)}
        >
          <Star
            className={`h-6 w-6 ${
              star <= (hovered || rating)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-orange-500 mr-4" />
              <div>
                <h2 className="text-3xl font-bold text-slate-900">
                  {existingReview ? 'Edit Review' : 'Write Review'}
                </h2>
                <p className="text-slate-600 font-medium">
                  {customTripData?.title || 'Custom Trip Experience'}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Trip Details */}
          {customTripData && (
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 mb-6 border border-orange-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Trip Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center text-sm text-slate-600">
                  <MapPin className="h-4 w-4 mr-2 text-orange-500" />
                  {customTripData.destination}
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                  {customTripData.duration} days
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <Users className="h-4 w-4 mr-2 text-orange-500" />
                  {customTripData.groupSize} people
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                  {new Date(customTripData.startDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Overall Rating */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <label className="block text-lg font-semibold text-slate-900 mb-4">
                Overall Rating *
              </label>
              {renderStarRating(
                formData.rating,
                handleRatingChange,
                hoveredRating,
                setHoveredRating
              )}
              <p className="text-sm text-slate-600 mt-2">
                How would you rate your overall custom trip experience?
              </p>
            </div>

            {/* Detailed Ratings */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <label className="block text-lg font-semibold text-slate-900 mb-4">
                Detailed Ratings
              </label>
              <div className="space-y-4">
                {Object.entries(detailedRatingLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                    {renderStarRating(
                      formData.detailedRatings[key],
                      (rating) => handleDetailedRatingChange(key, rating),
                      hoveredDetailedRating[key],
                      (rating) => setHoveredDetailedRating(prev => ({ ...prev, [key]: rating }))
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Review Title */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <label className="block text-lg font-semibold text-slate-900 mb-2">
                Review Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Summarize your experience in a few words"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                maxLength={100}
                required
              />
              <p className="text-sm text-slate-600 mt-1">
                {formData.title.length}/100 characters
              </p>
            </div>

            {/* Main Comment */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <label className="block text-lg font-semibold text-slate-900 mb-2">
                Your Review *
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => handleInputChange('comment', e.target.value)}
                placeholder="Tell us about your custom trip experience..."
                rows={6}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                maxLength={2000}
                required
              />
              <p className="text-sm text-slate-600 mt-1">
                {formData.comment.length}/2000 characters
              </p>
            </div>

            {/* Additional Comments */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <label className="block text-lg font-semibold text-slate-900 mb-4">
                Additional Comments
              </label>
              <div className="space-y-4">
                {Object.entries(detailedRatingLabels).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {label} Comment
                    </label>
                    <textarea
                      value={formData.additionalComments[`${key}Comment`]}
                      onChange={(e) => handleAdditionalCommentChange(`${key}Comment`, e.target.value)}
                      placeholder={`Share your thoughts about ${label.toLowerCase()}...`}
                      rows={2}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                      maxLength={500}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Image Upload */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <label className="block text-lg font-semibold text-slate-900 mb-4">
                Photos (Optional)
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Camera className="h-12 w-12 text-slate-400 mb-2" />
                  <span className="text-slate-600 font-medium">
                    Click to upload photos
                  </span>
                  <span className="text-sm text-slate-500">
                    PNG, JPG up to 5MB each
                  </span>
                </label>
              </div>
              
              {/* Selected Images */}
              {imageFiles.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imageFiles.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : (existingReview ? 'Update Review' : 'Submit Review')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomTripReviewForm;
