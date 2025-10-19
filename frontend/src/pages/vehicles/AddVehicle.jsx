import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useVehicle } from '../../context/vehicles/VehicleContext';
import { 
  Car, 
  Upload, 
  Plus, 
  X,
  MapPin,
  DollarSign,
  Users,
  Calendar,
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const AddVehicle = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { vehicleActions } = useVehicle();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    description: '',
    vehicleType: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    licensePlate: '',
    
    // Capacity
    capacity: {
      passengers: 1,
      luggage: 0,
      wheelchairAccessible: false
    },
    
    // Amenities
    amenities: {
      airConditioning: false,
      wifi: false,
      childSeats: false,
      musicSystem: false,
      chargingPorts: false,
      waterBottles: false,
      firstAidKit: false,
      fireExtinguisher: false,
      gpsNavigation: false,
      englishSpeakingDriver: false,
      localGuide: false,
      cameraEquipment: false,
      umbrella: false,
      coolerBox: false,
      phoneCharger: false
    },
    
    // Pricing
    pricing: {
      basePrice: 0,
      currency: 'LKR',
      perKmRate: 0,
      hourlyRate: 0,
      dailyRate: 0
    },
    
    // Service Areas
    serviceAreas: [{
      city: '',
      district: '',
      coordinates: {
        latitude: '',
        longitude: ''
      },
      radius: 50
    }],
    
    // Availability
    availability: {
      isAvailable: true,
      workingHours: {
        start: '06:00',
        end: '22:00'
      },
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      minimumBookingNotice: 2
    },
    
    // Images
    images: []
  });
  
  const steps = [
    { id: 1, title: 'Basic Information', icon: Car },
    { id: 2, title: 'Capacity & Amenities', icon: Users },
    { id: 3, title: 'Pricing', icon: DollarSign },
    { id: 4, title: 'Service Areas', icon: MapPin },
    { id: 5, title: 'Availability', icon: Calendar },
    { id: 6, title: 'Images', icon: Upload },
    { id: 7, title: 'Review & Submit', icon: CheckCircle }
  ];
  
  const vehicleTypes = [
    'Car', 'Van', 'Tuk-tuk', 'Bus', 'Minibus', 'SUV', 'Motorcycle',
    'Bicycle', 'Boat', 'Train', 'Airplane', 'Helicopter'
  ];
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'capacity' || parent === 'amenities' || parent === 'pricing') {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: type === 'checkbox' ? checked : value
          }
        }));
      } else if (parent === 'workingHours') {
        setFormData(prev => ({
          ...prev,
          availability: {
            ...prev.availability,
            workingHours: {
              ...prev.availability.workingHours,
              [child]: value
            }
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 5MB.`);
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} is not a valid image format.`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = {
          url: e.target.result, // Preview URL for display
          file: file, // Actual File object for upload
          caption: '',
          isPrimary: formData.images.length === 0,
          category: 'exterior',
          order: formData.images.length
        };
        
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, newImage]
        }));
      };
      reader.readAsDataURL(file);
    });
  };
  
  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };
  
  const setPrimaryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }))
    }));
  };
  
  const addServiceArea = () => {
    setFormData(prev => ({
      ...prev,
      serviceAreas: [...prev.serviceAreas, {
        city: '',
        district: '',
        coordinates: {
          latitude: '',
          longitude: ''
        },
        radius: 50
      }]
    }));
  };
  
  const removeServiceArea = (index) => {
    setFormData(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.filter((_, i) => i !== index)
    }));
  };
  
  const updateServiceArea = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.map((area, i) => 
        i === index ? { ...area, [field]: value } : area
      )
    }));
  };
  
  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Vehicle name is required';
        if (!formData.vehicleType) newErrors.vehicleType = 'Vehicle type is required';
        if (!formData.make.trim()) newErrors.make = 'Make is required';
        if (!formData.model.trim()) newErrors.model = 'Model is required';
        if (!formData.year) newErrors.year = 'Year is required';
        if (!formData.licensePlate.trim()) newErrors.licensePlate = 'License plate is required';
        break;
        
      case 2:
        if (formData.capacity.passengers < 1) newErrors.passengers = 'Passenger capacity must be at least 1';
        break;
        
      case 3:
        if (formData.pricing.basePrice <= 0) newErrors.basePrice = 'Base price must be greater than 0';
        break;
        
      case 4:
        if (formData.serviceAreas.length === 0) newErrors.serviceAreas = 'At least one service area is required';
        formData.serviceAreas.forEach((area, index) => {
          if (!area.city.trim()) newErrors[`serviceArea_${index}_city`] = 'City is required';
          if (!area.district.trim()) newErrors[`serviceArea_${index}_district`] = 'District is required';
        });
        break;
        
      case 5:
        if (!formData.availability.workingDays.length) newErrors.workingDays = 'At least one working day is required';
        break;
        
      case 6:
        if (formData.images.length === 0) newErrors.images = 'At least one image is required';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };
  
  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }
    
    setLoading(true);
    
    try {
      await vehicleActions.addVehicle(formData);
      toast.success('Vehicle added successfully!');
      navigate('/vehicle-owner/dashboard');
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast.error('Failed to add vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter vehicle name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Type *
                </label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.vehicleType ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select vehicle type</option>
                  {vehicleTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.vehicleType && <p className="text-red-500 text-sm mt-1">{errors.vehicleType}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Make *
                </label>
                <input
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.make ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Toyota"
                />
                {errors.make && <p className="text-red-500 text-sm mt-1">{errors.make}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model *
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.model ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Camry"
                />
                {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year *
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.year ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., White"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Plate *
                </label>
                <input
                  type="text"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.licensePlate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., ABC-1234"
                />
                {errors.licensePlate && <p className="text-red-500 text-sm mt-1">{errors.licensePlate}</p>}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your vehicle..."
              />
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passenger Capacity *
                </label>
                <input
                  type="number"
                  name="capacity.passengers"
                  value={formData.capacity.passengers}
                  onChange={handleInputChange}
                  min="1"
                  max="50"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.passengers ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.passengers && <p className="text-red-500 text-sm mt-1">{errors.passengers}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Luggage Capacity
                </label>
                <input
                  type="number"
                  name="capacity.luggage"
                  value={formData.capacity.luggage}
                  onChange={handleInputChange}
                  min="0"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="capacity.wheelchairAccessible"
                checked={formData.capacity.wheelchairAccessible}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">
                Wheelchair Accessible
              </label>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.keys(formData.amenities).map(amenity => (
                  <div key={amenity} className="flex items-center">
                    <input
                      type="checkbox"
                      name={`amenities.${amenity}`}
                      checked={formData.amenities[amenity]}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700 capitalize">
                      {amenity.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price (LKR) *
                </label>
                <input
                  type="number"
                  name="pricing.basePrice"
                  value={formData.pricing.basePrice}
                  onChange={handleInputChange}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.basePrice ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.basePrice && <p className="text-red-500 text-sm mt-1">{errors.basePrice}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  name="pricing.currency"
                  value={formData.pricing.currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LKR">LKR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Per KM Rate (LKR)
                </label>
                <input
                  type="number"
                  name="pricing.perKmRate"
                  value={formData.pricing.perKmRate}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly Rate (LKR)
                </label>
                <input
                  type="number"
                  name="pricing.hourlyRate"
                  value={formData.pricing.hourlyRate}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Rate (LKR)
                </label>
                <input
                  type="number"
                  name="pricing.dailyRate"
                  value={formData.pricing.dailyRate}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Service Areas</h3>
              <button
                type="button"
                onClick={addServiceArea}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Area
              </button>
            </div>
            
            {formData.serviceAreas.map((area, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900">Service Area {index + 1}</h4>
                  {formData.serviceAreas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeServiceArea(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={area.city}
                      onChange={(e) => updateServiceArea(index, 'city', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`serviceArea_${index}_city`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter city"
                    />
                    {errors[`serviceArea_${index}_city`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`serviceArea_${index}_city`]}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      District *
                    </label>
                    <input
                      type="text"
                      value={area.district}
                      onChange={(e) => updateServiceArea(index, 'district', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`serviceArea_${index}_district`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter district"
                    />
                    {errors[`serviceArea_${index}_district`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`serviceArea_${index}_district`]}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={area.coordinates.latitude}
                      onChange={(e) => updateServiceArea(index, 'coordinates', {
                        ...area.coordinates,
                        latitude: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="6.9271"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={area.coordinates.longitude}
                      onChange={(e) => updateServiceArea(index, 'coordinates', {
                        ...area.coordinates,
                        longitude: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="79.8612"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Radius (km)
                    </label>
                    <input
                      type="number"
                      value={area.radius}
                      onChange={(e) => updateServiceArea(index, 'radius', parseInt(e.target.value))}
                      min="1"
                      max="500"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {errors.serviceAreas && (
              <p className="text-red-500 text-sm">{errors.serviceAreas}</p>
            )}
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="availability.isAvailable"
                checked={formData.availability.isAvailable}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">
                Vehicle is available for booking
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Working Hours Start
                </label>
                <input
                  type="time"
                  name="workingHours.start"
                  value={formData.availability.workingHours.start}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Working Hours End
                </label>
                <input
                  type="time"
                  name="workingHours.end"
                  value={formData.availability.workingHours.end}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Working Days *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                  <div key={day} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.availability.workingDays.includes(day)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            availability: {
                              ...prev.availability,
                              workingDays: [...prev.availability.workingDays, day]
                            }
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            availability: {
                              ...prev.availability,
                              workingDays: prev.availability.workingDays.filter(d => d !== day)
                            }
                          }));
                        }
                      }}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700 capitalize">{day}</label>
                  </div>
                ))}
              </div>
              {errors.workingDays && <p className="text-red-500 text-sm mt-1">{errors.workingDays}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Booking Notice (hours)
              </label>
              <input
                type="number"
                name="availability.minimumBookingNotice"
                value={formData.availability.minimumBookingNotice}
                onChange={handleInputChange}
                min="0"
                max="168"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );
        
      case 6:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Images *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                  id="vehicleImages"
                />
                <label htmlFor="vehicleImages" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Click to upload vehicle images
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 5MB each</p>
                </label>
              </div>
              {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}
            </div>
            
            {formData.images.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Uploaded Images</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image.url}
                        alt={`Vehicle ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(index)}
                          className={`p-1 rounded-full ${
                            image.isPrimary ? 'bg-green-500 text-white' : 'bg-white text-gray-600'
                          }`}
                          title="Set as primary"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="p-1 bg-red-500 text-white rounded-full"
                          title="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {image.isPrimary && (
                        <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          Primary
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
        
      case 7:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Review Your Vehicle</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Basic Information</h4>
                  <p className="text-sm text-gray-600">
                    {formData.name} ({formData.vehicleType})
                  </p>
                  <p className="text-sm text-gray-600">
                    {formData.make} {formData.model} {formData.year}
                  </p>
                  <p className="text-sm text-gray-600">
                    License: {formData.licensePlate}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Capacity</h4>
                  <p className="text-sm text-gray-600">
                    {formData.capacity.passengers} passengers, {formData.capacity.luggage} luggage
                  </p>
                  {formData.capacity.wheelchairAccessible && (
                    <p className="text-sm text-gray-600">Wheelchair accessible</p>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Pricing</h4>
                  <p className="text-sm text-gray-600">
                    Base: {formData.pricing.currency} {formData.pricing.basePrice.toLocaleString()}
                  </p>
                  {formData.pricing.perKmRate > 0 && (
                    <p className="text-sm text-gray-600">
                      Per KM: {formData.pricing.currency} {formData.pricing.perKmRate}
                    </p>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Service Areas</h4>
                  {formData.serviceAreas.map((area, index) => (
                    <p key={index} className="text-sm text-gray-600">
                      {area.city}, {area.district} ({area.radius}km radius)
                    </p>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="font-medium text-blue-900">Important Notice</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    Your vehicle will be submitted for review. It will be pending approval before it becomes available for booking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Car className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Add New Vehicle</h1>
          </div>
          <p className="text-gray-600">
            Add your vehicle to start receiving bookings
          </p>
        </div>
        
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isActive 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'bg-white border-gray-300 text-gray-500'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <form onSubmit={handleSubmit}>
            {renderStepContent()}
            
            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 ${
                  currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Previous
              </button>
              
              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Adding Vehicle...' : 'Add Vehicle'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddVehicle;
