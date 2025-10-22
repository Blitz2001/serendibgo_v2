import api from './api';

const adminReviewService = {
  // Get all reviews for admin dashboard
  getAllReviews: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.type) queryParams.append('type', params.type);
      if (params.status) queryParams.append('status', params.status);
      if (params.rating) queryParams.append('rating', params.rating);
      if (params.search) queryParams.append('search', params.search);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);

      const response = await api.get(`/admin/reviews?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error getting admin reviews:', error);
      throw error;
    }
  },

  // Get review statistics
  getReviewStatistics: async () => {
    try {
      const response = await api.get('/admin/reviews/stats');
      return response.data;
    } catch (error) {
      console.error('Error getting review statistics:', error);
      throw error;
    }
  },

  // Update review status
  updateReviewStatus: async (reviewId, reviewType, status) => {
    try {
      const response = await api.put(`/admin/reviews/${reviewId}/status`, {
        reviewType,
        status
      });
      return response.data;
    } catch (error) {
      console.error('Error updating review status:', error);
      throw error;
    }
  },

  // Get all reviews with comprehensive data
  getAllReviewsComprehensive: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.type) queryParams.append('type', params.type);
      if (params.status) queryParams.append('status', params.status);
      if (params.rating) queryParams.append('rating', params.rating);
      if (params.search) queryParams.append('search', params.search);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);

      const response = await api.get(`/admin/reviews?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error getting comprehensive reviews:', error);
      throw error;
    }
  },

  // Delete review
  deleteReview: async (reviewId, reviewType) => {
    try {
      const response = await api.delete(`/admin/reviews/${reviewId}`, {
        data: { reviewType }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }
};

export default adminReviewService;
