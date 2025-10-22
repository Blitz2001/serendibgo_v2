import api from './api';

const customTripReviewService = {
  // Create a new custom trip review
  createReview: async (reviewData) => {
    try {
      const response = await api.post('/custom-trip-reviews', reviewData);
      return response.data;
    } catch (error) {
      console.error('Error creating custom trip review:', error);
      throw error;
    }
  },

  // Get reviews for a specific custom trip
  getCustomTripReviews: async (customTripId, options = {}) => {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);
      if (options.sortBy) params.append('sortBy', options.sortBy);

      const response = await api.get(`/custom-trip-reviews/${customTripId}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error getting custom trip reviews:', error);
      throw error;
    }
  },

  // Get user's custom trip reviews
  getUserReviews: async (options = {}) => {
    try {
      const { page = 1, limit = 10 } = options;
      const response = await api.get('/custom-trip-reviews/user', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting user custom trip reviews:', error);
      throw error;
    }
  },

  // Update a custom trip review
  updateReview: async (reviewId, updateData) => {
    try {
      const response = await api.put(`/custom-trip-reviews/${reviewId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating custom trip review:', error);
      throw error;
    }
  },

  // Delete a custom trip review
  deleteReview: async (reviewId) => {
    try {
      const response = await api.delete(`/custom-trip-reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting custom trip review:', error);
      throw error;
    }
  },

  // Check if user can review a custom trip
  canReviewCustomTrip: async (customTripId) => {
    try {
      const response = await api.get(`/custom-trip-reviews/${customTripId}/can-review`);
      return response.data;
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      throw error;
    }
  }
};

export default customTripReviewService;
