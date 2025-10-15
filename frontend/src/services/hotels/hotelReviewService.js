import api from '../api';

const hotelReviewService = {
  // Create a new hotel review
  createReview: async (reviewData) => {
    try {
      const response = await api.post('/hotel-reviews', reviewData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get hotel reviews
  getHotelReviews: async (hotelId, params = {}) => {
    try {
      const response = await api.get(`/hotel-reviews/hotel/${hotelId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user's hotel reviews
  getUserReviews: async (userId, params = {}) => {
    try {
      const response = await api.get(`/hotel-reviews/user/${userId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update hotel review
  updateReview: async (reviewId, updateData) => {
    try {
      const response = await api.put(`/hotel-reviews/${reviewId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete hotel review
  deleteReview: async (reviewId) => {
    try {
      const response = await api.delete(`/hotel-reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Mark review as helpful/not helpful
  markHelpful: async (reviewId, helpful) => {
    try {
      const response = await api.post(`/hotel-reviews/${reviewId}/helpful`, { helpful });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Check if user can review a hotel
  canUserReview: async (hotelId) => {
    try {
      const response = await api.get(`/hotel-reviews/can-review/${hotelId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default hotelReviewService;
