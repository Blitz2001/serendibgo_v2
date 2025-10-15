// Load environment variables first
require('dotenv').config();

// Set environment variables if not defined
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';
}
if (!process.env.JWT_EXPIRE) {
  process.env.JWT_EXPIRE = '30d';
}
if (!process.env.JWT_COOKIE_EXPIRE) {
  process.env.JWT_COOKIE_EXPIRE = '30';
}
if (!process.env.STRIPE_SECRET_KEY) {
  process.env.STRIPE_SECRET_KEY = 'sk_test_51SIRHEGhGMqfYoq5KBkzdOMEIupPxFUYdR6rbPiHM7s3IohZfLxZD7iwyu489t7OEkTRAv7v06Fjd3y8zEyBGZy500bL41wQoy';
}
if (!process.env.STRIPE_WEBHOOK_SECRET) {
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_1234567890abcdef';
}
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb+srv://asbthanayamwatta2_db_user:a9tYLTCwJCXc0xjX@cluster0.gv7sbeb.mongodb.net/serendibgo?retryWrites=true&w=majority&appName=Cluster0';
}

// Debug environment variables
console.log('Environment variables:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('JWT_EXPIRE:', process.env.JWT_EXPIRE);
console.log('JWT_COOKIE_EXPIRE:', process.env.JWT_COOKIE_EXPIRE);
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET');
console.log('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'NOT SET');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV);
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

// Import routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const tourRoutes = require('./src/routes/tours');
const bookingRoutes = require('./src/routes/bookings');
const paymentRoutes = require('./src/routes/payments');
const reviewRoutes = require('./src/routes/reviews');
const adminRoutes = require('./src/routes/admin');
const guideRoutes = require('./src/routes/guides');
const earningsRoutes = require('./src/routes/earnings');

// Staff routes
const staffRoutes = require('./src/routes/staff');

// Hotel routes
const hotelRoutes = require('./src/routes/hotels/hotels');
const roomRoutes = require('./src/routes/hotels/rooms');
const hotelBookingRoutes = require('./src/routes/hotels/hotelBookingRoutes');
const roomAvailabilityRoutes = require('./src/routes/hotels/roomAvailabilityRoutes');
const hotelReviewRoutes = require('./src/routes/hotels/hotelReviewRoutes');

// Custom trip routes
const customTripRoutes = require('./src/routes/customTrips');

// Notification routes
const notificationRoutes = require('./src/routes/notifications');

// Vehicle routes
const vehicleRoutes = require('./src/routes/vehicles');
const vehicleBookingRoutes = require('./src/routes/vehicles/vehicleBookings');
const vehicleAvailabilityRoutes = require('./src/routes/vehicles/availability');
const vehiclePricingRoutes = require('./src/routes/vehicles/pricing');
const vehicleIntegrationRoutes = require('./src/routes/vehicles/integrations');
const vehicleBookingRequestRoutes = require('./src/routes/vehicles/bookingRequests');
const tripRoutes = require('./src/routes/vehicles/trips');
const driverRoutes = require('./src/routes/vehicles/drivers');
const maintenanceRoutes = require('./src/routes/vehicles/maintenance');
const revenueRoutes = require('./src/routes/vehicles/revenue');

// Import middleware
const { errorHandler } = require('./src/middleware/errorHandler');

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(hpp());

// Rate limiting (more lenient for development)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and in development
    return req.path === '/api/health' || process.env.NODE_ENV === 'development';
  }
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Disposition', 'Content-Length', 'Content-Type']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'SerendibGo API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/earnings', earningsRoutes);

// Staff API routes
app.use('/api/staff', staffRoutes);

// Hotel API routes
app.use('/api/hotels', hotelRoutes);
app.use('/api/hotels', roomRoutes); // Mount room routes under /api/hotels
app.use('/api', roomAvailabilityRoutes); // Mount room availability routes under /api
app.use('/api/hotel-bookings', hotelBookingRoutes); // Mount hotel booking routes under /api/hotel-bookings
app.use('/api/hotel-reviews', hotelReviewRoutes); // Mount hotel review routes under /api/hotel-reviews

// Vehicle API routes
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/vehicles', vehicleAvailabilityRoutes);
app.use('/api/vehicles', vehiclePricingRoutes);
app.use('/api/vehicles', vehicleIntegrationRoutes);

// Sample vehicles route (fallback when database is not available)
const sampleVehiclesRoute = require('./src/routes/sampleVehicles');
app.use('/api/sample-vehicles', sampleVehiclesRoute);
app.use('/api/vehicle-bookings', vehicleBookingRoutes);
app.use('/api/vehicle-booking-requests', vehicleBookingRequestRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/revenue', revenueRoutes);

// Custom trip API routes
app.use('/api/custom-trips', customTripRoutes);

// Notification API routes
app.use('/api/notifications', notificationRoutes);

// Support API routes
const supportRoutes = require('./src/routes/support');
app.use('/api/support', supportRoutes);

// 404 handler
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

// Database connection
const connectDB = async () => {
  try {
    // Try Atlas MongoDB first (prioritize cloud over local)
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://asbthanayamwatta2_db_user:a9tYLTCwJCXc0xjX@cluster0.gv7sbeb.mongodb.net/serendibgo?retryWrites=true&w=majority&appName=Cluster0';
    console.log('Attempting to connect to MongoDB Atlas...');
    console.log('MONGODB_URI:', mongoUri);
    
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      retryWrites: true,
      w: 'majority'
    });
    console.log(`✅ MongoDB Connected (Atlas): ${conn.connection.host}`);
    return conn;
  } catch (atlasError) {
    console.error('Atlas connection failed:', atlasError.message);
    
    // Try alternative connection method if SRV fails
    if (atlasError.code === 'ENOTFOUND' && process.env.MONGODB_URI && process.env.MONGODB_URI.includes('mongodb+srv://')) {
      console.log('SRV record failed, trying alternative connection...');
      try {
        // Convert SRV URI to standard format
        const altUri = process.env.MONGODB_URI.replace('mongodb+srv://', 'mongodb://');
        const conn = await mongoose.connect(altUri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
        });
        console.log(`✅ MongoDB Connected (alternative): ${conn.connection.host}`);
        return conn;
      } catch (altError) {
        console.error('Alternative connection also failed:', altError.message);
      }
    }
    
    // Fallback to local MongoDB if Atlas fails
    console.log('Atlas not available, trying local MongoDB...');
    try {
      const localMongoUri = 'mongodb://localhost:27017/serendibgo';
      const conn = await mongoose.connect(localMongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // Timeout after 5s
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
      });
      console.log(`✅ MongoDB Connected (Local): ${conn.connection.host}`);
      return conn;
    } catch (localError) {
      console.error('Local MongoDB also failed:', localError.message);
      
      console.log('❌ All MongoDB connections failed. Starting server without database...');
      console.log('⚠️  Some features may not work without database connection.');
      console.log('');
      console.log('To fix this:');
      console.log('   1. Install MongoDB locally: https://www.mongodb.com/try/download/community');
      console.log('   2. Start MongoDB service: net start MongoDB');
      console.log('   3. Or check your MongoDB Atlas connection');
      
      // Don't exit in development, allow server to start without DB
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', err);
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.log('Uncaught Exception:', err);
    process.exit(1);
  });
};

startServer();

module.exports = app;

