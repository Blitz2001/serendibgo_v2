import api from './api';

const customTripBookingService = {
  // Create a new custom trip booking (confirmed booking)
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/custom-trips/book', bookingData);
      return response.data;
    } catch (error) {
      console.error('Error creating custom trip booking:', error);
      throw error;
    }
  },

  // Get user's custom trip bookings
  getUserBookings: async () => {
    try {
      const response = await api.get('/custom-trips/user/my-trips');
      return response.data;
    } catch (error) {
      console.error('Error getting user custom trip bookings:', error);
      throw error;
    }
  },

  // Get custom trip by ID
  getCustomTripById: async (id) => {
    try {
      const response = await api.get(`/custom-trips/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting custom trip:', error);
      throw error;
    }
  },

  // Update custom trip
  updateCustomTrip: async (id, updateData) => {
    try {
      const response = await api.put(`/custom-trips/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating custom trip:', error);
      throw error;
    }
  },

  // Confirm custom trip
  confirmCustomTrip: async (id) => {
    try {
      const response = await api.post(`/custom-trips/${id}/confirm`);
      return response.data;
    } catch (error) {
      console.error('Error confirming custom trip:', error);
      throw error;
    }
  },

  // Delete custom trip
  deleteCustomTrip: async (id) => {
    try {
      const response = await api.delete(`/custom-trips/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting custom trip:', error);
      throw error;
    }
  }
};

export default customTripBookingService;
