// Staff Support & Quality Control Controller
const { asyncHandler } = require('../../middleware/errorHandler');
const SupportTicket = require('../../models/SupportTicket');
const User = require('../../models/User');
const Booking = require('../../models/Booking');
const Tour = require('../../models/Tour');
const { staffAuth, requirePermission, logActivity } = require('../../middleware/staffAuth');

// @desc    Get support tickets
// @route   GET /api/staff/support/tickets
// @access  Private (Staff)
const getSupportTickets = asyncHandler(async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      priority, 
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build filter object
    let filter = {};
    
    // Status filter
    if (status) {
      filter.status = status;
    }
    
    // Priority filter
    if (priority) {
      filter.priority = priority;
    }
    
    // Category filter
    if (category) {
      filter.category = category;
    }
    
    // Search filter
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'user.firstName': { $regex: search, $options: 'i' } },
        { 'user.lastName': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Get support tickets from database
    const tickets = await SupportTicket.find(filter)
      .populate('user', 'firstName lastName email phone')
      .populate('assignedTo', 'firstName lastName email')
      .populate('messages.sender', 'firstName lastName')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
    
    const totalCount = await SupportTicket.countDocuments(filter);
    
    // Get ticket statistics
    const stats = {
      total: await SupportTicket.countDocuments(),
      open: await SupportTicket.countDocuments({ status: 'open' }),
      in_progress: await SupportTicket.countDocuments({ status: 'in_progress' }),
      resolved: await SupportTicket.countDocuments({ status: 'resolved' }),
      closed: await SupportTicket.countDocuments({ status: 'closed' }),
      urgent: await SupportTicket.countDocuments({ priority: 'urgent' }),
      high: await SupportTicket.countDocuments({ priority: 'high' }),
      medium: await SupportTicket.countDocuments({ priority: 'medium' }),
      low: await SupportTicket.countDocuments({ priority: 'low' })
    };
    
    res.status(200).json({
      success: true,
      data: {
        tickets,
        stats,
        pagination: {
          totalCount,
          currentPage: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
    
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching support tickets'
    });
  }
});

// @desc    Get single support ticket
// @route   GET /api/support/tickets/:id or /api/staff/support/tickets/:id
// @access  Private (Staff or User)
const getSupportTicket = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const isStaff = req.user.role === 'staff' || req.user.role === 'admin';
    
    // Build query - staff can see all tickets, users can only see their own
    let query = { _id: id };
    if (!isStaff) {
      query.user = userId;
    }
    
    const ticket = await SupportTicket.findOne(query)
      .populate('user', 'firstName lastName email phone')
      .populate('assignedTo', 'firstName lastName email')
      .populate('booking', 'tour startDate totalAmount')
      .populate('booking.tour', 'title duration');
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: ticket
    });
    
  } catch (error) {
    console.error('Get support ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching support ticket'
    });
  }
});

// @desc    Update support ticket
// @route   PUT /api/staff/support/tickets/:id
// @access  Private (Staff)
const updateSupportTicket = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedTo, tags, resolution } = req.body;
    const staffId = req.user._id;
    
    // Mock update response
    const updatedTicket = {
      _id: id,
      status: status || 'in_progress',
      priority: priority || 'medium',
      assignedTo: assignedTo || staffId,
      tags: tags || [],
      resolution: resolution || null,
      updatedAt: new Date(),
      updatedBy: staffId
    };
    
    // Log activity
    console.log(`Staff ${staffId} updated ticket ${id}`);
    
    res.status(200).json({
      success: true,
      message: 'Support ticket updated successfully',
      data: updatedTicket
    });
    
  } catch (error) {
    console.error('Update support ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating support ticket'
    });
  }
});

// @desc    Add message to support ticket
// @route   POST /api/support/tickets/:id/messages or /api/staff/support/tickets/:id/messages
// @access  Private (Staff or User)
const addSupportMessage = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { message, attachments } = req.body;
    const userId = req.user._id;
    const isStaff = req.user.role === 'staff' || req.user.role === 'admin';
    
    // Find the ticket and verify access
    let query = { _id: id };
    if (!isStaff) {
      query.user = userId;
    }
    
    const ticket = await SupportTicket.findOne(query);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }
    
    // Create new message
    const newMessage = {
      sender: userId,
      senderType: isStaff ? 'staff' : 'user',
      message,
      timestamp: new Date(),
      attachments: attachments || []
    };
    
    // Add message to ticket
    ticket.messages.push(newMessage);
    ticket.updatedAt = new Date();
    await ticket.save();
    
    // Log activity
    console.log(`${isStaff ? 'Staff' : 'User'} ${userId} added message to ticket ${id}`);
    
    res.status(201).json({
      success: true,
      message: 'Message added successfully',
      data: newMessage
    });
    
  } catch (error) {
    console.error('Add support message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding support message'
    });
  }
});

// @desc    Resolve support ticket
// @route   POST /api/staff/support/tickets/:id/resolve
// @access  Private (Staff)
const resolveSupportTicket = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, notes } = req.body;
    const staffId = req.user._id;
    
    // Mock resolve response
    const resolvedTicket = {
      _id: id,
      status: 'resolved',
      resolution,
      notes,
      resolvedAt: new Date(),
      resolvedBy: staffId,
      updatedAt: new Date()
    };
    
    // Log activity
    console.log(`Staff ${staffId} resolved ticket ${id}`);
    
    res.status(200).json({
      success: true,
      message: 'Support ticket resolved successfully',
      data: resolvedTicket
    });
    
  } catch (error) {
    console.error('Resolve support ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resolving support ticket'
    });
  }
});

// @desc    Get reviews and ratings
// @route   GET /api/staff/support/reviews
// @access  Private (Staff)
const getReviews = asyncHandler(async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      rating, 
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Mock reviews data
    const mockReviews = [
      {
        _id: 'review1',
        user: {
          _id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          avatar: null
        },
        tour: {
          _id: 'tour1',
          title: 'Sigiriya Rock Fortress Tour',
          guide: {
            _id: 'guide1',
            firstName: 'Sarah',
            lastName: 'Perera'
          }
        },
        rating: 5,
        comment: 'Amazing tour! The guide was very knowledgeable and friendly.',
        status: 'approved',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        moderatedBy: null,
        moderatedAt: null
      },
      {
        _id: 'review2',
        user: {
          _id: 'user2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          avatar: null
        },
        tour: {
          _id: 'tour2',
          title: 'Kandy Cultural Show',
          guide: {
            _id: 'guide2',
            firstName: 'David',
            lastName: 'Fernando'
          }
        },
        rating: 3,
        comment: 'The tour was okay but the guide seemed uninterested.',
        status: 'pending',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        moderatedBy: null,
        moderatedAt: null
      },
      {
        _id: 'review3',
        user: {
          _id: 'user3',
          firstName: 'Mike',
          lastName: 'Johnson',
          email: 'mike@example.com',
          avatar: null
        },
        tour: {
          _id: 'tour3',
          title: 'Ella Scenic Train Journey',
          guide: {
            _id: 'guide3',
            firstName: 'Lisa',
            lastName: 'Silva'
          }
        },
        rating: 1,
        comment: 'Terrible experience! Guide was rude and unprofessional.',
        status: 'rejected',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        moderatedBy: req.user._id,
        moderatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ];
    
    // Filter mock data
    let filteredReviews = mockReviews;
    if (rating) {
      filteredReviews = filteredReviews.filter(review => review.rating === parseInt(rating));
    }
    if (status) {
      filteredReviews = filteredReviews.filter(review => review.status === status);
    }
    if (search) {
      filteredReviews = filteredReviews.filter(review => 
        review.comment.toLowerCase().includes(search.toLowerCase()) ||
        review.tour.title.toLowerCase().includes(search.toLowerCase()) ||
        review.user.firstName.toLowerCase().includes(search.toLowerCase()) ||
        review.user.lastName.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Sort mock data
    filteredReviews.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (sortOrder === 'desc') {
        return bVal > aVal ? 1 : -1;
      } else {
        return aVal > bVal ? 1 : -1;
      }
    });
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedReviews = filteredReviews.slice(skip, skip + parseInt(limit));
    
    // Get review statistics
    const stats = {
      total: mockReviews.length,
      approved: mockReviews.filter(r => r.status === 'approved').length,
      pending: mockReviews.filter(r => r.status === 'pending').length,
      rejected: mockReviews.filter(r => r.status === 'rejected').length,
      averageRating: mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length,
      ratingDistribution: {
        5: mockReviews.filter(r => r.rating === 5).length,
        4: mockReviews.filter(r => r.rating === 4).length,
        3: mockReviews.filter(r => r.rating === 3).length,
        2: mockReviews.filter(r => r.rating === 2).length,
        1: mockReviews.filter(r => r.rating === 1).length
      }
    };
    
    res.status(200).json({
      success: true,
      data: {
        reviews: paginatedReviews,
        stats,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(filteredReviews.length / parseInt(limit)),
          total: filteredReviews.length
        }
      }
    });
    
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reviews'
    });
  }
});

// @desc    Get review statistics
// @route   GET /api/staff/support/reviews/statistics
// @access  Private (Staff)
const getReviewStatistics = asyncHandler(async (req, res) => {
  try {
    // Mock statistics data
    const stats = {
      total: 3,
      pending: 1,
      approved: 1,
      rejected: 1,
      flagged: 0,
      averageRating: 3.0
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Get review statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching review statistics'
    });
  }
});

// @desc    Delete review
// @route   DELETE /api/staff/support/reviews/:id
// @access  Private (Staff)
const deleteReview = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const staffId = req.user._id;
    
    // Mock delete response
    console.log(`Staff ${staffId} deleted review ${id}`);
    
    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting review'
    });
  }
});

// @desc    Bulk review action
// @route   POST /api/staff/support/reviews/bulk-action
// @access  Private (Staff)
const bulkReviewAction = asyncHandler(async (req, res) => {
  try {
    const { reviewIds, action } = req.body;
    const staffId = req.user._id;
    
    // Mock bulk action response
    console.log(`Staff ${staffId} performed bulk ${action} on reviews:`, reviewIds);
    
    res.status(200).json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      data: {
        processedCount: reviewIds.length,
        action
      }
    });
    
  } catch (error) {
    console.error('Bulk review action error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error performing bulk review action'
    });
  }
});

// @desc    Moderate review
// @route   PUT /api/staff/support/reviews/:id/moderate
// @access  Private (Staff)
const moderateReview = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const staffId = req.user._id;
    
    // Mock moderate response
    const moderatedReview = {
      _id: id,
      status,
      reason,
      moderatedBy: staffId,
      moderatedAt: new Date(),
      updatedAt: new Date()
    };
    
    // Log activity
    console.log(`Staff ${staffId} moderated review ${id} as ${status}`);
    
    res.status(200).json({
      success: true,
      message: `Review ${status} successfully`,
      data: moderatedReview
    });
    
  } catch (error) {
    console.error('Moderate review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error moderating review'
    });
  }
});

// @desc    Submit a support ticket (User)
// @route   POST /api/support/tickets
// @access  Private
const submitSupportTicket = asyncHandler(async (req, res) => {
  try {
    console.log('Support ticket submission request:', {
      body: req.body,
      user: req.user ? {
        _id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email
      } : 'No user found'
    });

    const { subject, description, category, priority, bookingId } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Subject and description are required'
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Create new support ticket
    const supportTicket = new SupportTicket({
      user: userId,
      subject,
      description,
      category: category || 'general',
      priority: priority || 'medium',
      status: 'open',
      booking: bookingId || null,
      messages: [{
        sender: userId,
        senderType: 'user',
        message: description,
        timestamp: new Date()
      }]
    });

    await supportTicket.save();

    // Populate user details
    await supportTicket.populate('user', 'firstName lastName email phone');

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully',
      data: supportTicket
    });

  } catch (error) {
    console.error('Submit support ticket error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      body: req.body,
      user: req.user
    });
    res.status(500).json({
      success: false,
      message: 'Server error submitting support ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get user's support tickets
// @route   GET /api/support/tickets
// @access  Private
const getUserSupportTickets = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    // Build filter
    let filter = { user: userId };
    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get user's support tickets
    const tickets = await SupportTicket.find(filter)
      .populate('booking', 'tour startDate totalAmount')
      .populate('booking.tour', 'title duration')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalCount = await SupportTicket.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: tickets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNext: skip + tickets.length < totalCount,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get user support tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching support tickets'
    });
  }
});

// @desc    Rate support ticket resolution (User)
// @route   POST /api/support/tickets/:id/rate
// @access  Private
const rateSupportTicket = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;
    const userId = req.user._id;

    // Find the ticket and verify ownership
    const ticket = await SupportTicket.findOne({ _id: id, user: userId });
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // Update ticket with rating
    ticket.rating = rating;
    ticket.feedback = feedback;
    ticket.ratedAt = new Date();
    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Support ticket rated successfully',
      data: {
        ticketId: id,
        rating,
        feedback
      }
    });

  } catch (error) {
    console.error('Rate support ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error rating support ticket'
    });
  }
});

module.exports = {
  // Staff functions
  getSupportTickets,
  getSupportTicket,
  updateSupportTicket,
  addSupportMessage,
  resolveSupportTicket,
  getReviews,
  getReviewStatistics,
  deleteReview,
  bulkReviewAction,
  moderateReview,
  // User functions
  submitSupportTicket,
  getUserSupportTickets,
  rateSupportTicket
};


