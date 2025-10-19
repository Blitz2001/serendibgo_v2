const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const { saveMemoryFilesToDisk } = require('../utils/fileUpload');

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Public
const getAllVehicles = async (req, res) => {
  try {
    const { 
      city, 
      vehicleType, 
      minCapacity, 
      maxPrice, 
      features,
      page = 1, 
      limit = 10,
      sortBy = 'ratings.overall',
      sortOrder = 'desc'
    } = req.query;

    const query = { status: 'available', isActive: true };

    // Apply filters
    if (city) {
      query['location.city'] = city;
    }

    if (vehicleType) {
      query.vehicleType = vehicleType;
    }

    if (minCapacity) {
      query['capacity.passengers'] = { $gte: parseInt(minCapacity) };
    }

    if (maxPrice) {
      query['pricing.dailyRate'] = { $lte: parseInt(maxPrice) };
    }

    if (features) {
      const featureArray = Array.isArray(features) ? features : [features];
      featureArray.forEach(feature => {
        query[`features.${feature}`] = true;
      });
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const vehicles = await Vehicle.find(query)
      .populate('driver', 'firstName lastName email phone profile.driverLicense')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Vehicle.countDocuments(query);

    res.json({
      success: true,
      data: vehicles,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicles',
      error: error.message
    });
  }
};

// @desc    Get vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Public
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('owner', 'firstName lastName email phone');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      data: vehicle
    });

  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle',
      error: error.message
    });
  }
};

// @desc    Create new vehicle
// @route   POST /api/vehicles
// @access  Private (Driver/Staff/Admin)
const createVehicle = async (req, res) => {
  try {
    const {
      vehicleType,
      make,
      model,
      year,
      licensePlate,
      capacity,
      features,
      pricing,
      driver,
      location,
      images,
      insurance,
      registration,
      description,
      notes
    } = req.body;

    // Process uploaded images
    let processedImages = [];
    
    // Handle uploaded files from req.files
    if (req.files && req.files.images && req.files.images.length > 0) {
      console.log('Processing uploaded image files:', req.files.images.length);
      const savedFiles = await saveMemoryFilesToDisk(req.files.images);
      processedImages = savedFiles.map((file, index) => ({
        url: file.url,
        caption: file.originalName,
        isPrimary: index === 0 // First image is primary
      }));
    }
    // Fallback to parsed images from request body
    else if (images && Array.isArray(images)) {
      console.log('Processing images from request body:', images.length);
      processedImages = images.map((image, index) => ({
        url: typeof image === 'string' ? image : image.url,
        caption: image.caption || '',
        isPrimary: index === 0 // First image is primary
      }));
    }

    console.log('Processed images:', processedImages);

    // Check if driver exists and has driver role (if driver is specified)
    if (driver) {
      const driverUser = await User.findById(driver);
      if (!driverUser || driverUser.role !== 'driver') {
        return res.status(400).json({
          success: false,
          message: 'Invalid driver. Driver must exist and have driver role.'
        });
      }
    }

    const vehicle = new Vehicle({
      vehicleType,
      make,
      model,
      year,
      licensePlate,
      capacity,
      features,
      pricing,
      driver: driver || req.user.id, // Use current user if no driver specified
      location,
      images: processedImages,
      insurance,
      registration,
      description,
      notes,
      owner: req.user.id, // Set owner to current user
      status: 'pending' // Set to pending initially
    });

    await vehicle.save();

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: vehicle
    });

  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating vehicle',
      error: error.message
    });
  }
};

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
// @access  Private (Driver/Staff/Admin)
const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if user can update this vehicle
    const canUpdate = req.user.role === 'staff' || 
                     req.user.role === 'admin' || 
                     (vehicle.driver && vehicle.driver.toString() === req.user._id.toString()) ||
                     (vehicle.owner && vehicle.owner.toString() === req.user._id.toString());

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Map frontend fields to backend schema
    const updateData = {};
    
    // Map basic fields that exist in schema
    if (req.body.make) updateData.make = req.body.make;
    if (req.body.model) updateData.model = req.body.model;
    if (req.body.year) updateData.year = req.body.year;
    if (req.body.licensePlate) updateData.licensePlate = req.body.licensePlate;
    if (req.body.description) updateData.description = req.body.description;
    
    // Map capacity fields
    if (req.body.seatingCapacity) {
      updateData.capacity = {
        ...vehicle.capacity,
        passengers: req.body.seatingCapacity
      };
    }
    
    // Map pricing fields
    if (req.body.pricing) {
      updateData.pricing = {
        ...vehicle.pricing,
        dailyRate: req.body.pricing.dailyRate || vehicle.pricing.dailyRate,
        hourlyRate: req.body.pricing.hourlyRate || vehicle.pricing.hourlyRate
      };
    }

    // Map images field
    if (req.body.images) {
      updateData.images = req.body.images;
    }

    // Determine which field to populate based on what exists
    const populateOptions = [];
    if (vehicle.driver) {
      populateOptions.push({ path: 'driver', select: 'firstName lastName email phone' });
    }
    if (vehicle.owner) {
      populateOptions.push({ path: 'owner', select: 'firstName lastName email phone' });
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    // Populate only the fields that exist
    if (populateOptions.length > 0) {
      await updatedVehicle.populate(populateOptions);
    }

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: updatedVehicle
    });

  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating vehicle',
      error: error.message
    });
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private (Driver/Staff/Admin)
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if user can delete this vehicle
    console.log('Delete vehicle - User ID:', req.user._id || req.user.id, 'Type:', typeof (req.user._id || req.user.id));
    console.log('Delete vehicle - Vehicle owner:', vehicle.owner, 'Type:', typeof vehicle.owner);
    console.log('Delete vehicle - User role:', req.user.role);
    
    const userId = req.user._id || req.user.id;
    const canDelete = req.user.role === 'staff' || 
                     req.user.role === 'admin' || 
                     vehicle.owner.toString() === userId.toString();

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Vehicle.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting vehicle:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error deleting vehicle',
      error: error.message
    });
  }
};

// @desc    Get vehicles by driver
// @route   GET /api/vehicles/driver/:driverId
// @access  Private
const getVehiclesByDriver = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ driver: req.params.driverId })
      .populate('driver', 'firstName lastName email phone');

    res.json({
      success: true,
      data: vehicles
    });

  } catch (error) {
    console.error('Error fetching driver vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching driver vehicles',
      error: error.message
    });
  }
};

// @desc    Check vehicle availability
// @route   POST /api/vehicles/:id/check-availability
// @access  Public
const checkVehicleAvailability = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    const isAvailable = vehicle.isAvailable(startDate, endDate);

    res.json({
      success: true,
      data: {
        available: isAvailable,
        vehicle: {
          id: vehicle._id,
          vehicleType: vehicle.vehicleType,
          make: vehicle.make,
          model: vehicle.model,
          capacity: vehicle.capacity,
          pricing: vehicle.pricing
        }
      }
    });

  } catch (error) {
    console.error('Error checking vehicle availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking vehicle availability',
      error: error.message
    });
  }
};

// @desc    Get vehicles near location
// @route   GET /api/vehicles/near/:lat/:lng
// @access  Public
const getVehiclesNearLocation = async (req, res) => {
  try {
    const { lat, lng, maxDistance = 50 } = req.params; // maxDistance in km

    const vehicles = await Vehicle.find({
      status: 'available',
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(maxDistance) * 1000 // Convert km to meters
        }
      }
    })
    .populate('driver', 'firstName lastName email phone')
    .limit(20);

    res.json({
      success: true,
      data: vehicles
    });

  } catch (error) {
    console.error('Error fetching vehicles near location:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicles near location',
      error: error.message
    });
  }
};

// @desc    Upload vehicle images
// @route   POST /api/vehicles/:id/images
// @access  Private (Driver/Staff/Admin)
const uploadVehicleImages = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if user can upload images for this vehicle
    const canUpload = req.user.role === 'staff' || 
                     req.user.role === 'admin' || 
                     vehicle.owner.toString() === req.user._id.toString();

    if (!canUpload) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images provided'
      });
    }

    // Process uploaded images
    const uploadedImages = [];
    for (const file of req.files) {
      // Convert buffer to base64 for storage
      const base64Image = file.buffer.toString('base64');
      const imageData = {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        data: base64Image,
        url: `data:${file.mimetype};base64,${base64Image}`
      };
      uploadedImages.push(imageData);
    }

    // Add images to vehicle
    vehicle.images = vehicle.images || [];
    vehicle.images.push(...uploadedImages);
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        images: uploadedImages
      }
    });

  } catch (error) {
    console.error('Error uploading vehicle images:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
    });
  }
};

// @desc    Delete vehicle image
// @route   DELETE /api/vehicles/:id/images/:imageId
// @access  Private (Driver/Staff/Admin)
const deleteVehicleImage = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if user can delete images for this vehicle
    const canDelete = req.user.role === 'staff' || 
                     req.user.role === 'admin' || 
                     vehicle.owner.toString() === req.user._id.toString();

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const imageId = req.params.imageId;
    const imageIndex = vehicle.images.findIndex(img => img._id.toString() === imageId);
    
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Remove image from array
    vehicle.images.splice(imageIndex, 1);
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting vehicle image:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehiclesByDriver,
  checkVehicleAvailability,
  getVehiclesNearLocation,
  uploadVehicleImages,
  deleteVehicleImage
};
