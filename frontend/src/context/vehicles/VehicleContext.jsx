import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-hot-toast';

// Initial State
const initialState = {
  vehicles: [],
  bookings: [],
  loading: false,
  error: null,
  stats: {
    totalVehicles: 0,
    activeVehicles: 0,
    totalBookings: 0,
    totalEarnings: 0
  }
};

// Action Types
const VehicleActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_VEHICLES: 'SET_VEHICLES',
  ADD_VEHICLE: 'ADD_VEHICLE',
  UPDATE_VEHICLE: 'UPDATE_VEHICLE',
  DELETE_VEHICLE: 'DELETE_VEHICLE',
  SET_BOOKINGS: 'SET_BOOKINGS',
  ADD_BOOKING: 'ADD_BOOKING',
  UPDATE_BOOKING: 'UPDATE_BOOKING',
  SET_STATS: 'SET_STATS'
};

// Reducer
const vehicleReducer = (state, action) => {
  switch (action.type) {
    case VehicleActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
      
    case VehicleActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
      
    case VehicleActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
      
    case VehicleActionTypes.SET_VEHICLES:
      return {
        ...state,
        vehicles: action.payload,
        loading: false
      };
      
    case VehicleActionTypes.ADD_VEHICLE:
      return {
        ...state,
        vehicles: [...state.vehicles, action.payload],
        loading: false
      };
      
    case VehicleActionTypes.UPDATE_VEHICLE:
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          vehicle._id === action.payload._id ? action.payload : vehicle
        ),
        loading: false
      };
      
    case VehicleActionTypes.DELETE_VEHICLE:
      return {
        ...state,
        vehicles: state.vehicles.filter(vehicle => vehicle._id !== action.payload),
        loading: false
      };
      
    case VehicleActionTypes.SET_BOOKINGS:
      return {
        ...state,
        bookings: action.payload,
        loading: false
      };
      
    case VehicleActionTypes.ADD_BOOKING:
      return {
        ...state,
        bookings: [...state.bookings, action.payload],
        loading: false
      };
      
    case VehicleActionTypes.UPDATE_BOOKING:
      return {
        ...state,
        bookings: state.bookings.map(booking =>
          booking._id === action.payload._id ? action.payload : booking
        ),
        loading: false
      };
      
    case VehicleActionTypes.SET_STATS:
      return {
        ...state,
        stats: action.payload,
        loading: false
      };
      
    default:
      return state;
  }
};

// Context
const VehicleContext = createContext();

// Provider Component
export const VehicleProvider = ({ children }) => {
  const [state, dispatch] = useReducer(vehicleReducer, initialState);
  
  // API Base URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  
  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };
  
  // API request helper
  const apiRequest = async (url, options = {}) => {
    const token = getAuthToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };
    
    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  };
  
  // Vehicle Actions
  const vehicleActions = {
    // Get all vehicles for the current user
    getMyVehicles: async () => {
      try {
        dispatch({ type: VehicleActionTypes.SET_LOADING, payload: true });
        const data = await apiRequest('/vehicles/my-vehicles');
        
        if (data.status === 'success') {
          dispatch({ type: VehicleActionTypes.SET_VEHICLES, payload: data.data.vehicles });
        } else {
          throw new Error(data.message || 'Failed to fetch vehicles');
        }
      } catch (error) {
        dispatch({ type: VehicleActionTypes.SET_ERROR, payload: error.message });
        toast.error(error.message);
        throw error;
      }
    },
    
    // Get a single vehicle
    getVehicle: async (vehicleId) => {
      try {
        dispatch({ type: VehicleActionTypes.SET_LOADING, payload: true });
        const data = await apiRequest(`/vehicles/${vehicleId}`);
        
        if (data.status === 'success') {
          return data.data.vehicle;
        } else {
          throw new Error(data.message || 'Failed to fetch vehicle');
        }
      } catch (error) {
        dispatch({ type: VehicleActionTypes.SET_ERROR, payload: error.message });
        toast.error(error.message);
        throw error;
      }
    },
    
    // Add a new vehicle
    addVehicle: async (vehicleData) => {
      try {
        dispatch({ type: VehicleActionTypes.SET_LOADING, payload: true });
        
        // Handle file uploads
        const formData = new FormData();
        
        Object.keys(vehicleData).forEach(key => {
          if (key === 'images' && Array.isArray(vehicleData[key])) {
            vehicleData[key].forEach((image, index) => {
              if (image.file instanceof File) {
                // Send the actual File object
                formData.append(`images[${index}]`, image.file);
              } else if (image instanceof File) {
                // Fallback for direct File objects
                formData.append(`images[${index}]`, image);
              } else {
                // Fallback for URL strings (backward compatibility)
                formData.append(`images[${index}]`, JSON.stringify(image));
              }
            });
          } else if (key === 'documents' && typeof vehicleData[key] === 'object') {
            Object.keys(vehicleData[key]).forEach(docKey => {
              if (vehicleData[key][docKey] instanceof File) {
                formData.append(`documents.${docKey}`, vehicleData[key][docKey]);
              } else {
                formData.append(`documents.${docKey}`, vehicleData[key][docKey]);
              }
            });
          } else {
            formData.append(key, vehicleData[key]);
          }
        });
        
        const data = await apiRequest('/vehicles', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          },
          body: formData
        });
        
        if (data.status === 'success') {
          dispatch({ type: VehicleActionTypes.ADD_VEHICLE, payload: data.data.vehicle });
          toast.success('Vehicle added successfully!');
          return data.data.vehicle;
        } else {
          throw new Error(data.message || 'Failed to add vehicle');
        }
      } catch (error) {
        dispatch({ type: VehicleActionTypes.SET_ERROR, payload: error.message });
        toast.error(error.message);
        throw error;
      }
    },
    
    // Update a vehicle
    updateVehicle: async (vehicleId, vehicleData) => {
      try {
        dispatch({ type: VehicleActionTypes.SET_LOADING, payload: true });
        
        const data = await apiRequest(`/vehicles/${vehicleId}`, {
          method: 'PUT',
          body: JSON.stringify(vehicleData)
        });
        
        if (data.status === 'success') {
          dispatch({ type: VehicleActionTypes.UPDATE_VEHICLE, payload: data.data.vehicle });
          toast.success('Vehicle updated successfully!');
          return data.data.vehicle;
        } else {
          throw new Error(data.message || 'Failed to update vehicle');
        }
      } catch (error) {
        dispatch({ type: VehicleActionTypes.SET_ERROR, payload: error.message });
        toast.error(error.message);
        throw error;
      }
    },
    
    // Delete a vehicle
    deleteVehicle: async (vehicleId) => {
      try {
        dispatch({ type: VehicleActionTypes.SET_LOADING, payload: true });
        
        const data = await apiRequest(`/vehicles/${vehicleId}`, {
          method: 'DELETE'
        });
        
        if (data.status === 'success') {
          dispatch({ type: VehicleActionTypes.DELETE_VEHICLE, payload: vehicleId });
          toast.success('Vehicle deleted successfully!');
        } else {
          throw new Error(data.message || 'Failed to delete vehicle');
        }
      } catch (error) {
        dispatch({ type: VehicleActionTypes.SET_ERROR, payload: error.message });
        toast.error(error.message);
        throw error;
      }
    }
  };
  
  // Booking Actions
  const bookingActions = {
    // Get all bookings for the current user's vehicles
    getMyBookings: async (params = {}) => {
      try {
        dispatch({ type: VehicleActionTypes.SET_LOADING, payload: true });
        
        const queryString = new URLSearchParams(params).toString();
        const url = `/vehicle-bookings/my-bookings${queryString ? `?${queryString}` : ''}`;
        
        const data = await apiRequest(url);
        
        if (data.status === 'success') {
          dispatch({ type: VehicleActionTypes.SET_BOOKINGS, payload: data.data.bookings });
          return data.data;
        } else {
          throw new Error(data.message || 'Failed to fetch bookings');
        }
      } catch (error) {
        dispatch({ type: VehicleActionTypes.SET_ERROR, payload: error.message });
        toast.error(error.message);
        throw error;
      }
    },
    
    // Get a single booking
    getBooking: async (bookingId) => {
      try {
        dispatch({ type: VehicleActionTypes.SET_LOADING, payload: true });
        const data = await apiRequest(`/vehicle-bookings/${bookingId}`);
        
        if (data.status === 'success') {
          return data.data.booking;
        } else {
          throw new Error(data.message || 'Failed to fetch booking');
        }
      } catch (error) {
        dispatch({ type: VehicleActionTypes.SET_ERROR, payload: error.message });
        toast.error(error.message);
        throw error;
      }
    },
    
    // Update booking status
    updateBookingStatus: async (bookingId, statusData) => {
      try {
        dispatch({ type: VehicleActionTypes.SET_LOADING, payload: true });
        
        const data = await apiRequest(`/vehicle-bookings/${bookingId}/status`, {
          method: 'PUT',
          body: JSON.stringify(statusData)
        });
        
        if (data.status === 'success') {
          dispatch({ type: VehicleActionTypes.UPDATE_BOOKING, payload: data.data.booking });
          toast.success('Booking status updated successfully!');
          return data.data.booking;
        } else {
          throw new Error(data.message || 'Failed to update booking status');
        }
      } catch (error) {
        dispatch({ type: VehicleActionTypes.SET_ERROR, payload: error.message });
        toast.error(error.message);
        throw error;
      }
    }
  };
  
  // Stats Actions
  const statsActions = {
    // Get dashboard stats
    getStats: async () => {
      try {
        dispatch({ type: VehicleActionTypes.SET_LOADING, payload: true });
        const data = await apiRequest('/vehicle-owners/stats');
        
        if (data.status === 'success') {
          dispatch({ type: VehicleActionTypes.SET_STATS, payload: data.data.stats });
          return data.data.stats;
        } else {
          throw new Error(data.message || 'Failed to fetch stats');
        }
      } catch (error) {
        dispatch({ type: VehicleActionTypes.SET_ERROR, payload: error.message });
        toast.error(error.message);
        throw error;
      }
    }
  };
  
  // Utility Functions
  const vehicleUtils = {
    // Calculate vehicle rating
    calculateRating: (vehicle) => {
      if (!vehicle.ratings || vehicle.reviewCount === 0) return 0;
      
      const { overall, cleanliness, comfort, driver, value } = vehicle.ratings;
      return (overall + cleanliness + comfort + driver + value) / 5;
    },
    
    // Get vehicle status color
    getStatusColor: (status) => {
      const colors = {
        pending: 'text-yellow-600 bg-yellow-100',
        approved: 'text-blue-600 bg-blue-100',
        active: 'text-green-600 bg-green-100',
        suspended: 'text-red-600 bg-red-100',
        rejected: 'text-red-600 bg-red-100',
        maintenance: 'text-orange-600 bg-orange-100'
      };
      return colors[status] || colors.pending;
    },
    
    // Format price
    formatPrice: (price, currency = 'LKR') => {
      return `${currency} ${price.toLocaleString()}`;
    },
    
    // Check if vehicle is available
    isVehicleAvailable: (vehicle, startDate, endDate) => {
      if (!vehicle.availability.isAvailable || vehicle.status !== 'active') {
        return false;
      }
      
      // Additional availability logic can be added here
      return true;
    }
  };
  
  // Clear error
  const clearError = () => {
    dispatch({ type: VehicleActionTypes.CLEAR_ERROR });
  };
  
  const value = {
    // State
    ...state,
    
    // Actions
    vehicleActions,
    bookingActions,
    statsActions,
    
    // Utils
    vehicleUtils,
    
    // Helpers
    clearError
  };
  
  return (
    <VehicleContext.Provider value={value}>
      {children}
    </VehicleContext.Provider>
  );
};

// Custom Hook
export const useVehicle = () => {
  const context = useContext(VehicleContext);
  if (!context) {
    throw new Error('useVehicle must be used within a VehicleProvider');
  }
  return context;
};

export default VehicleContext;
