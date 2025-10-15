import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
  timeout: 30000, // Increased timeout to 30 seconds
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Trip API functions
export const tripService = {
  // Get all trips for a user
  getTrips: async (params = {}) => {
    try {
      const response = await api.get('/trips', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching trips:', error);
      throw error;
    }
  },

  // Get a single trip by ID
  getTripById: async (tripId) => {
    try {
      const response = await api.get(`/trips/${tripId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trip:', error);
      throw error;
    }
  },

  // Create a new trip
  createTrip: async (tripData) => {
    try {
      const response = await api.post('/trips', tripData);
      return response.data;
    } catch (error) {
      console.error('Error creating trip:', error);
      throw error;
    }
  },

  // Update trip status
  updateTripStatus: async (tripId, statusData) => {
    try {
      const response = await api.put(`/trips/${tripId}/status`, statusData);
      return response.data;
    } catch (error) {
      console.error('Error updating trip status:', error);
      throw error;
    }
  },

  // Assign driver to trip
  assignDriver: async (tripId, driverId) => {
    try {
      const response = await api.put(`/trips/${tripId}/assign-driver`, { driverId });
      return response.data;
    } catch (error) {
      console.error('Error assigning driver:', error);
      throw error;
    }
  },

  // Update trip location (GPS tracking)
  updateTripLocation: async (tripId, location) => {
    try {
      const response = await api.put(`/trips/${tripId}/location`, {
        latitude: location.latitude,
        longitude: location.longitude
      });
      return response.data;
    } catch (error) {
      console.error('Error updating trip location:', error);
      throw error;
    }
  },

  // Get trip statistics
  getTripStats: async (params = {}) => {
    try {
      const response = await api.get('/trips/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching trip stats:', error);
      throw error;
    }
  },

  // Get trip messages
  getTripMessages: async (tripId) => {
    try {
      const response = await api.get(`/trips/${tripId}/messages`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trip messages:', error);
      throw error;
    }
  },

  // Send message to trip
  sendTripMessage: async (tripId, message) => {
    try {
      const response = await api.post(`/trips/${tripId}/messages`, { message });
      return response.data;
    } catch (error) {
      console.error('Error sending trip message:', error);
      throw error;
    }
  },

  // Cancel trip
  cancelTrip: async (tripId, reason = '') => {
    try {
      const response = await api.put(`/trips/${tripId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error cancelling trip:', error);
      throw error;
    }
  },

  // Get trip history
  getTripHistory: async (tripId) => {
    try {
      const response = await api.get(`/trips/${tripId}/history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trip history:', error);
      throw error;
    }
  },

  // Get driver trips
  getDriverTrips: async (driverId, params = {}) => {
    try {
      const response = await api.get(`/drivers/${driverId}/trips`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching driver trips:', error);
      throw error;
    }
  },

  // Get customer trips
  getCustomerTrips: async (customerId, params = {}) => {
    try {
      const response = await api.get(`/trips/customer/${customerId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching customer trips:', error);
      throw error;
    }
  },

  // Get vehicle owner trips
  getOwnerTrips: async (ownerId, params = {}) => {
    try {
      const response = await api.get(`/trips/owner/${ownerId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching owner trips:', error);
      throw error;
    }
  }
};

// Driver API functions
export const driverService = {
  // Get all drivers
  getDrivers: async (params = {}) => {
    try {
      const response = await api.get('/drivers', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching drivers:', error);
      throw error;
    }
  },

  // Get driver by ID
  getDriverById: async (driverId) => {
    try {
      const response = await api.get(`/drivers/${driverId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching driver:', error);
      throw error;
    }
  },

  // Get driver by user ID
  getDriverByUserId: async (userId) => {
    try {
      const response = await api.get(`/drivers/user/${userId}`);
      return response.data;
    } catch (error) {
      // Handle 404 as expected response when no driver profile exists
      if (error.response?.status === 404) {
        return {
          status: 'error',
          message: 'Driver profile not found',
          data: { needsRegistration: true }
        };
      }
      // Only log unexpected errors
      if (!error.suppressConsoleError) {
        console.error('Error fetching driver by user ID:', error);
      }
      throw error;
    }
  },

  // Register as driver
  registerDriver: async (driverData) => {
    try {
      const response = await api.post('/drivers/register', driverData);
      return response.data;
    } catch (error) {
      console.error('Error registering driver:', error);
      throw error;
    }
  },

  // Update driver profile
  updateDriverProfile: async (userId, profileData) => {
    try {
      const response = await api.put(`/drivers/user/${userId}/profile`, profileData);
      return response.data;
    } catch (error) {
      // Handle 404 as expected response when no driver profile exists
      if (error.response?.status === 404) {
        return {
          status: 'error',
          message: 'Driver profile not found',
          data: { needsRegistration: true }
        };
      }
      // Only log unexpected errors
      if (!error.suppressConsoleError) {
        console.error('Error updating driver profile:', error);
      }
      throw error;
    }
  },

  // Get driver trips
  getDriverTrips: async (driverId, params = {}) => {
    try {
      const response = await api.get(`/drivers/${driverId}/trips`, { params });
      return response.data;
    } catch (error) {
      // Handle 404 as expected response when no trips exist
      if (error.response?.status === 404) {
        return {
          status: 'success',
          data: { trips: [], total: 0, page: 1, limit: 10 }
        };
      }
      // Only log unexpected errors
      if (!error.suppressConsoleError) {
        console.error('Error fetching driver trips:', error);
      }
      throw error;
    }
  },

  // Get driver statistics
  getDriverStats: async (params = {}) => {
    try {
      const response = await api.get('/drivers/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching driver stats:', error);
      throw error;
    }
  },

  // Approve/Reject driver
  approveRejectDriver: async (driverId, status) => {
    try {
      const response = await api.patch(`/drivers/${driverId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error approving/rejecting driver:', error);
      throw error;
    }
  },

  // Update driver location
  updateDriverLocation: async (driverId, location) => {
    try {
      const response = await api.put(`/drivers/${driverId}/location`, {
        latitude: location.latitude,
        longitude: location.longitude
      });
      return response.data;
    } catch (error) {
      console.error('Error updating driver location:', error);
      throw error;
    }
  },

  // Get driver statistics
  getDriverStats: async (params = {}) => {
    try {
      const response = await api.get('/drivers/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching driver stats:', error);
      throw error;
    }
  }
};

// Maintenance API functions
export const maintenanceService = {
  // Get maintenance records
  getMaintenanceRecords: async (params = {}) => {
    try {
      const response = await api.get('/maintenance', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
      throw error;
    }
  },

  // Get maintenance record by ID
  getMaintenanceRecord: async (recordId) => {
    try {
      const response = await api.get(`/maintenance/${recordId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching maintenance record:', error);
      throw error;
    }
  },

  // Create maintenance record
  createMaintenanceRecord: async (recordData) => {
    try {
      const response = await api.post('/maintenance', recordData);
      return response.data;
    } catch (error) {
      console.error('Error creating maintenance record:', error);
      throw error;
    }
  },

  // Update maintenance record
  updateMaintenanceRecord: async (recordId, recordData) => {
    try {
      const response = await api.put(`/maintenance/${recordId}`, recordData);
      return response.data;
    } catch (error) {
      console.error('Error updating maintenance record:', error);
      throw error;
    }
  },

  // Update maintenance status
  updateMaintenanceStatus: async (recordId, statusData) => {
    try {
      const response = await api.put(`/maintenance/${recordId}/status`, statusData);
      return response.data;
    } catch (error) {
      console.error('Error updating maintenance status:', error);
      throw error;
    }
  },

  // Get maintenance statistics
  getMaintenanceStats: async (params = {}) => {
    try {
      const response = await api.get('/maintenance/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching maintenance stats:', error);
      throw error;
    }
  }
};

// Revenue API functions
export const revenueService = {
  // Get revenue records
  getRevenueRecords: async (params = {}) => {
    try {
      const response = await api.get('/revenue', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue records:', error);
      throw error;
    }
  },

  // Get revenue record by ID
  getRevenueRecord: async (recordId) => {
    try {
      const response = await api.get(`/revenue/${recordId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue record:', error);
      throw error;
    }
  },

  // Calculate revenue
  calculateRevenue: async (calculationData) => {
    try {
      const response = await api.post('/revenue/calculate', calculationData);
      return response.data;
    } catch (error) {
      console.error('Error calculating revenue:', error);
      throw error;
    }
  },

  // Update revenue status
  updateRevenueStatus: async (recordId, statusData) => {
    try {
      const response = await api.put(`/revenue/${recordId}/status`, statusData);
      return response.data;
    } catch (error) {
      console.error('Error updating revenue status:', error);
      throw error;
    }
  },

  // Process payout
  processPayout: async (recordId, payoutData) => {
    try {
      const response = await api.post(`/revenue/${recordId}/payout`, payoutData);
      return response.data;
    } catch (error) {
      console.error('Error processing payout:', error);
      throw error;
    }
  },

  // Get revenue statistics
  getRevenueStats: async (params = {}) => {
    try {
      const response = await api.get('/revenue/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      throw error;
    }
  }
};

// Vehicle API functions
export const vehicleService = {
  // Register vehicle
  registerVehicle: async (vehicleData) => {
    try {
      const response = await api.post('/vehicles/register', vehicleData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // Increase timeout to 30 seconds
      });
      return response.data;
    } catch (error) {
      console.error('Error registering vehicle:', error);
      throw error;
    }
  },

  // Get driver vehicles
  getDriverVehicles: async (driverId) => {
    try {
      const response = await api.get(`/vehicles/driver/${driverId}`);
      return response.data;
    } catch (error) {
      // Handle 403 as expected response when user doesn't have driver role
      if (error.response?.status === 403) {
        return {
          status: 'error',
          message: 'Access denied. Driver role required.',
          data: { vehicles: [] }
        };
      }
      // Only log unexpected errors
      if (!error.suppressConsoleError) {
        console.error('Error fetching driver vehicles:', error);
      }
      throw error;
    }
  },

  // Get vehicle by ID
  getVehicleById: async (vehicleId) => {
    try {
      const response = await api.get(`/vehicles/${vehicleId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      throw error;
    }
  },

  // Update vehicle
  updateVehicle: async (vehicleId, vehicleData) => {
    try {
      const response = await api.put(`/vehicles/${vehicleId}`, vehicleData);
      return response.data;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  },

  // Update vehicle status
  updateVehicleStatus: async (vehicleId, status) => {
    try {
      const response = await api.put(`/vehicles/${vehicleId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      throw error;
    }
  },

  // Delete vehicle
  deleteVehicle: async (vehicleId) => {
    try {
      const response = await api.delete(`/vehicles/${vehicleId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  },

  // Get all vehicles for staff review
  getAllVehiclesForReview: async (params = {}) => {
    try {
      const response = await api.get('/vehicles/admin/all', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicles for review:', error);
      throw error;
    }
  },

  // Update vehicle status (admin/staff)
  updateVehicleStatus: async (vehicleId, status, reason = '') => {
    try {
      const response = await api.put(`/vehicles/${vehicleId}/status`, { 
        status, 
        rejectionReason: reason 
      });
      return response.data;
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      throw error;
    }
  },

  // Upload vehicle images
  uploadVehicleImages: async (vehicleId, formData) => {
    try {
      const response = await api.post(`/vehicles/${vehicleId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading vehicle images:', error);
      throw error;
    }
  },

  // Delete vehicle image
  deleteVehicleImage: async (vehicleId, imageId) => {
    try {
      const response = await api.delete(`/vehicles/${vehicleId}/images/${imageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting vehicle image:', error);
      throw error;
    }
  },
};

export default {
  tripService,
  driverService,
  maintenanceService,
  revenueService,
  vehicleService
};
