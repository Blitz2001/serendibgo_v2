import api from '../api';

const paymentService = {
  // Process payment
  processPayment: async (paymentData) => {
    const response = await api.post('/payments/process', paymentData);
    return response.data;
  },

  // Create payment intent (for Stripe)
  createPaymentIntent: async (amount, currency = 'LKR', metadata = {}) => {
    const response = await api.post('/payments/create-intent', {
      bookingId: metadata.bookingId,
      amount,
      currency
    });
    return response.data;
  },

  // Create guest payment intent (for unauthenticated users)
  createGuestPaymentIntent: async (amount, currency = 'LKR', metadata = {}) => {
    const response = await api.post('/payments/create-guest-intent', {
      bookingId: metadata.bookingId,
      amount,
      currency,
      customerEmail: metadata.customerEmail,
      customerName: metadata.customerName
    });
    return response.data;
  },

  // Confirm payment
  confirmPayment: async (paymentIntentId) => {
    const response = await api.post('/payments/confirm', {
      paymentIntentId
    });
    return response.data;
  },

  // Confirm guest payment (no authentication required)
  confirmGuestPayment: async (paymentIntentId) => {
    const response = await api.post('/payments/confirm-guest', {
      paymentIntentId
    });
    return response.data;
  },

  // Get payment methods
  getPaymentMethods: async () => {
    const response = await api.get('/payments/methods');
    return response.data;
  },

  // Save payment method
  savePaymentMethod: async (paymentMethodData) => {
    const response = await api.post('/payments/methods', paymentMethodData);
    return response.data;
  },

  // Get saved payment methods
  getSavedPaymentMethods: async () => {
    const response = await api.get('/payments/methods/saved');
    return response.data;
  },

  // Delete saved payment method
  deletePaymentMethod: async (paymentMethodId) => {
    const response = await api.delete(`/payments/methods/${paymentMethodId}`);
    return response.data;
  },

  // Process refund
  processRefund: async (paymentId, amount, reason = '') => {
    const response = await api.post(`/payments/${paymentId}/refund`, {
      amount,
      reason
    });
    return response.data;
  },

  // Get payment history
  getPaymentHistory: async (params = {}) => {
    const response = await api.get('/payments/history', { params });
    return response.data;
  },

  // Get payment details
  getPaymentDetails: async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
  },

  // Update payment status
  updatePaymentStatus: async (paymentId, status, metadata = {}) => {
    const response = await api.put(`/payments/${paymentId}/status`, {
      status,
      metadata
    });
    return response.data;
  },

  // Verify payment
  verifyPayment: async (paymentId) => {
    const response = await api.post(`/payments/${paymentId}/verify`);
    return response.data;
  },

  // Get payment statistics
  getPaymentStats: async (params = {}) => {
    const response = await api.get('/payments/stats', { params });
    return response.data;
  },

  // Process mobile payment
  processMobilePayment: async (provider, amount, phoneNumber, reference = '') => {
    const response = await api.post('/payments/mobile', {
      provider,
      amount,
      phoneNumber,
      reference
    });
    return response.data;
  },

  // Verify mobile payment
  verifyMobilePayment: async (transactionId) => {
    const response = await api.post('/payments/mobile/verify', {
      transactionId
    });
    return response.data;
  },

  // Process bank transfer
  processBankTransfer: async (transferData) => {
    const response = await api.post('/payments/bank-transfer', transferData);
    return response.data;
  },

  // Get bank transfer details
  getBankTransferDetails: async (transferId) => {
    const response = await api.get(`/payments/bank-transfer/${transferId}`);
    return response.data;
  },

  // Process cash payment
  processCashPayment: async (amount, bookingId, notes = '') => {
    const response = await api.post('/payments/cash', {
      amount,
      bookingId,
      notes
    });
    return response.data;
  },

  // Get payment methods for booking
  getBookingPaymentMethods: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}/payment-methods`);
    return response.data;
  },

  // Process booking payment
  processBookingPayment: async (bookingId, paymentData) => {
    const response = await api.post(`/bookings/${bookingId}/payment`, paymentData);
    return response.data;
  },

  // Get booking payment status
  getBookingPaymentStatus: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}/payment-status`);
    return response.data;
  }
};

export default paymentService;
