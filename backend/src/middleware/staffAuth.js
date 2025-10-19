const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { hasPermission } = require('../utils/permissions');

// Enhanced staff authentication middleware
const staffAuth = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check for token in cookies
    if (!token && req.cookies.token) {
      token = req.cookies.token;
    }

    console.log('Staff Auth Debug:', {
      hasAuthHeader: !!req.headers.authorization,
      authHeader: req.headers.authorization,
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      url: req.originalUrl,
      method: req.method
    });

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully:', { id: decoded.id, iat: decoded.iat });
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      console.log('User found:', user ? { id: user._id, role: user.role, isActive: user.isActive } : 'Not found');
      
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Token is valid but user no longer exists'
        });
      }

      // Check if user is still active
      if (!user.isActive) {
        return res.status(401).json({
          status: 'error',
          message: 'User account is deactivated'
        });
      }

      // Check if user is staff member
      const staffRoles = ['staff', 'admin', 'super_admin', 'manager', 'support_staff'];
      if (!staffRoles.includes(user.role)) {
        console.log('User role not in staff roles:', { userRole: user.role, staffRoles });
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. Staff access required.'
        });
      }

      // Check if password was changed after token was issued
      if (user.changedPasswordAfter(decoded.iat)) {
        return res.status(401).json({
          status: 'error',
          message: 'User recently changed password. Please log in again.'
        });
      }

      // Add user and permissions to request
      req.user = user;
      req.userPermissions = {
        role: user.role,
        department: user.profile?.department || 'operations',
        permissions: user.profile?.permissions || []
      };

      console.log('Staff auth successful:', { userId: user._id, role: user.role });
      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('Staff auth error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error in authentication'
    });
  }
};

// Permission-based authorization middleware
const requirePermission = (module, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    if (!hasPermission(req.user.role, module, action, req.user.profile?.permissions)) {
      return res.status(403).json({
        status: 'error',
        message: `Insufficient permissions. Required: ${module}:${action}`
      });
    }

    next();
  };
};

// Role-based authorization middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Department-based authorization middleware
const requireDepartment = (...departments) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const userDepartment = req.user.profile?.department;
    
    if (!userDepartment || !departments.includes(userDepartment)) {
      return res.status(403).json({
        status: 'error',
        message: `Access denied. Required departments: ${departments.join(', ')}`
      });
    }

    next();
  };
};

// Activity logging middleware
const logActivity = (action) => {
  return (req, res, next) => {
    // Log staff activity
    const activity = {
      userId: req.user._id,
      userRole: req.user.role,
      action: action,
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method
    };

    // Store activity in database (you can create an Activity model)
    console.log('Staff Activity:', activity);
    
    next();
  };
};

module.exports = {
  staffAuth,
  requirePermission,
  requireRole,
  requireDepartment,
  logActivity
};


