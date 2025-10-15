import api from './api';

// Guide service functions
export const guideService = {
  // Get all guides with filters
  getGuides: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });
    
    const response = await api.get(`/guides?${queryParams.toString()}`);
    return response.data;
  },

  // Get guide by ID
  getGuideById: async (id) => {
    const response = await api.get(`/guides/${id}`);
    return response.data;
  },

  // Get guide statistics
  getGuideStats: async (id) => {
    const response = await api.get(`/guides/stats/${id}`);
    return response.data;
  },

  // Create guide (Admin only)
  createGuide: async (guideData) => {
    const response = await api.post('/guides', guideData);
    return response.data;
  },

  // Update guide profile (for guides themselves)
  updateGuideProfile: async (profileData) => {
    const response = await api.put('/guides/profile', profileData);
    return response.data;
  },

  // Update guide
  updateGuide: async (id, guideData) => {
    const response = await api.put(`/guides/${id}`, guideData);
    return response.data;
  },

  // Delete guide (Admin only)
  deleteGuide: async (id) => {
    const response = await api.delete(`/guides/${id}`);
    return response.data;
  },

  // Create guide booking
  createGuideBooking: async (bookingData) => {
    const response = await api.post('/bookings/guide', bookingData);
    return response.data;
  },

  // Create guest guide booking (without authentication)
  createGuestGuideBooking: async (bookingData) => {
    const response = await api.post('/bookings/guide/guest', bookingData);
    return response.data;
  },

  // Get guide bookings (for guides to see their bookings)
  getGuideBookings: async (params = {}) => {
    console.log('🔍 guideService.getGuideBookings called with params:', params)
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });
    
    const url = `/bookings/guide?${queryParams.toString()}`
    console.log('🌐 guideService - Making API call to:', url)
    
    try {
      const response = await api.get(url);
      console.log('📡 guideService - API response:', response.data)
      return response.data;
    } catch (error) {
      console.error('❌ guideService - API error:', error)
      console.error('❌ guideService - Error response:', error.response?.data)
      throw error;
    }
  },

  // Get user's guide bookings (for tourists to see their guide bookings)
  getUserGuideBookings: async () => {
    const response = await api.get('/bookings/user');
    return response.data;
  },

  // Cancel booking
  cancelBooking: async (bookingId, cancellationReason = '') => {
    const response = await api.put(`/bookings/${bookingId}/cancel`, {
      cancellationReason
    });
    return response.data;
  }
};

export default guideService;
