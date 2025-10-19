import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Car,
  Star,
  CheckCircle,
  CreditCard,
  Shield,
  ArrowLeft,
  ArrowRight,
  Phone,
  Mail,
  User,
  Navigation,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { vehicleSearchService } from '../../services/vehicles/vehicleSearchService';
import toast from 'react-hot-toast';

const VehicleBookingFlow = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    // Trip details
    pickupLocation: {
      address: '',
      city: '',
      district: '',
      coordinates: { latitude: 0, longitude: 0 },
      landmark: '',
      instructions: ''
    },
    dropoffLocation: {
      address: '',
      city: '',
      district: '',
      coordinates: { latitude: 0, longitude: 0 },
      landmark: '',
      instructions: ''
    },
    pickupDateTime: '',
    dropoffDateTime: '',
    estimatedDistance: 0,
    estimatedDuration: 0,
    
    // Passenger details
    passengers: {
      adults: 1,
      children: 0,
      infants: 0,
      totalPassengers: 1
    },
    luggage: {
      smallBags: 0,
      largeBags: 0,
      specialItems: [],
      specialInstructions: ''
    },
    
    // Special requirements
    specialRequirements: {
      accessibility: {
        wheelchairAccess: false,
        mobilityAssistance: false,
        accessibilityNotes: ''
      },
      comfort: {
        airConditioning: true,
        music: false,
        wifi: false,
        comfortNotes: ''
      },
      safety: {
        childSeat: false,
        boosterSeat: false,
        safetyNotes: ''
      },
      other: {
        smokingAllowed: false,
        petFriendly: false,
        customRequests: ''
      }
    },
    
    // Contact information
    contactInfo: {
      primaryContact: {
        name: '',
        phone: '',
        email: ''
      },
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      }
    },
    
    // Pricing
    pricing: {
      basePrice: 0,
      distancePrice: 0,
      timePrice: 0,
      additionalFees: [],
      discounts: [],
      subtotal: 0,
      tax: 0,
      totalPrice: 0,
      currency: 'USD'
    }
  });
  
  useEffect(() => {
    fetchVehicleDetails();
  }, [vehicleId]);
  
  const fetchVehicleDetails = async () => {
    try {
      setLoading(true);
      const response = await vehicleSearchService.getVehicleDetails(vehicleId);
      if (response.status === 'success') {
        setVehicle(response.data.vehicle);
        setBookingData(prev => ({
          ...prev,
          pricing: {
            ...prev.pricing,
            basePrice: response.data.vehicle.pricing?.basePrice || 0,
            currency: response.data.vehicle.pricing?.currency || 'USD'
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      toast.error('Failed to load vehicle details');
      navigate('/search');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (section, field, value) => {
    setBookingData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };
  
  const handleNestedInputChange = (section, subsection, field, value) => {
    setBookingData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [field]: value
        }
      }
    }));
  };
  
  const calculatePricing = async () => {
    try {
      const pricingData = {
        distance: bookingData.estimatedDistance,
        duration: bookingData.estimatedDuration,
        date: bookingData.pickupDateTime,
        startTime: bookingData.pickupDateTime.split('T')[1],
        passengers: bookingData.passengers.totalPassengers
      };
      
      const response = await vehicleSearchService.getVehiclePricing(vehicleId, pricingData);
      if (response.status === 'success') {
        setBookingData(prev => ({
          ...prev,
          pricing: {
            ...prev.pricing,
            ...response.data
          }
        }));
      }
    } catch (error) {
      console.error('Error calculating pricing:', error);
    }
  };
  
  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSubmitBooking = async () => {
    try {
      setLoading(true);
      
      const bookingRequest = {
        vehicle: vehicleId,
        tripDetails: {
          pickupLocation: bookingData.pickupLocation,
          dropoffLocation: bookingData.dropoffLocation,
          estimatedDistance: bookingData.estimatedDistance,
          estimatedDuration: bookingData.estimatedDuration
        },
        timing: {
          pickupDateTime: bookingData.pickupDateTime,
          dropoffDateTime: bookingData.dropoffDateTime
        },
        passengers: bookingData.passengers,
        specialRequirements: bookingData.specialRequirements,
        contactInfo: bookingData.contactInfo,
        pricing: bookingData.pricing
      };
      
      const response = await fetch('/api/vehicle-bookings/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(bookingRequest)
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        const booking = data.data.booking || data.data;
        const totalAmount = bookingData.pricing?.totalPrice || 0;
        
        // Navigate to payment page
        navigate('/payment', {
          state: {
            bookingId: booking._id,
            bookingType: 'vehicle',
            amount: totalAmount,
            currency: 'USD',
            vehicleName: vehicle?.make + ' ' + vehicle?.model,
            vehicleType: vehicle?.type,
            pickupLocation: bookingData.pickupLocation.address,
            dropoffLocation: bookingData.dropoffLocation.address,
            pickupDateTime: bookingData.pickupDateTime,
            dropoffDateTime: bookingData.dropoffDateTime,
            passengers: bookingData.passengers.totalPassengers,
            bookingReference: booking.bookingReference
          }
        });
      } else {
        toast.error(data.message || 'Failed to submit booking request');
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast.error('Failed to submit booking request');
    } finally {
      setLoading(false);
    }
  };
  
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };
  
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star 
          key={i} 
          className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
        />
      );
    }
    return stars;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Vehicle not found</h3>
          <p className="mt-1 text-sm text-gray-500">The vehicle you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/search')}
            className="mt-4 btn btn-primary"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Book Your Vehicle</h1>
          <p className="text-lg text-gray-600 mt-2">Complete your booking in a few simple steps</p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="lg:w-2/3">
            {/* Progress Steps */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {currentStep > step ? <CheckCircle className="h-5 w-5" /> : step}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${
                        currentStep >= step ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                        {step === 1 && 'Trip Details'}
                        {step === 2 && 'Passenger Info'}
                        {step === 3 && 'Special Requirements'}
                        {step === 4 && 'Review & Book'}
                      </p>
                    </div>
                    {step < 4 && (
                      <div className={`w-16 h-0.5 mx-4 ${
                        currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Step Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Trip Details</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Location</label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="Enter pickup address"
                        value={bookingData.pickupLocation.address}
                        onChange={(e) => handleNestedInputChange('pickupLocation', null, 'address', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Dropoff Location</label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="Enter dropoff address"
                        value={bookingData.dropoffLocation.address}
                        onChange={(e) => handleNestedInputChange('dropoffLocation', null, 'address', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Date & Time</label>
                      <input
                        type="datetime-local"
                        className="input input-bordered w-full"
                        value={bookingData.pickupDateTime}
                        onChange={(e) => handleInputChange('pickupDateTime', null, e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Dropoff Date & Time</label>
                      <input
                        type="datetime-local"
                        className="input input-bordered w-full"
                        value={bookingData.dropoffDateTime}
                        onChange={(e) => handleInputChange('dropoffDateTime', null, e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Passenger Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Adults</label>
                      <input
                        type="number"
                        min="1"
                        className="input input-bordered w-full"
                        value={bookingData.passengers.adults}
                        onChange={(e) => handleNestedInputChange('passengers', null, 'adults', parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Children</label>
                      <input
                        type="number"
                        min="0"
                        className="input input-bordered w-full"
                        value={bookingData.passengers.children}
                        onChange={(e) => handleNestedInputChange('passengers', null, 'children', parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Infants</label>
                      <input
                        type="number"
                        min="0"
                        className="input input-bordered w-full"
                        value={bookingData.passengers.infants}
                        onChange={(e) => handleNestedInputChange('passengers', null, 'infants', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Information</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="Full Name"
                        value={bookingData.contactInfo.primaryContact.name}
                        onChange={(e) => handleNestedInputChange('contactInfo', 'primaryContact', 'name', e.target.value)}
                      />
                      <input
                        type="tel"
                        className="input input-bordered w-full"
                        placeholder="Phone Number"
                        value={bookingData.contactInfo.primaryContact.phone}
                        onChange={(e) => handleNestedInputChange('contactInfo', 'primaryContact', 'phone', e.target.value)}
                      />
                      <input
                        type="email"
                        className="input input-bordered w-full"
                        placeholder="Email Address"
                        value={bookingData.contactInfo.primaryContact.email}
                        onChange={(e) => handleNestedInputChange('contactInfo', 'primaryContact', 'email', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Special Requirements</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Accessibility</h3>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="checkbox mr-2"
                            checked={bookingData.specialRequirements.accessibility.wheelchairAccess}
                            onChange={(e) => handleNestedInputChange('specialRequirements', 'accessibility', 'wheelchairAccess', e.target.checked)}
                          />
                          <span className="text-sm text-gray-700">Wheelchair Access</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="checkbox mr-2"
                            checked={bookingData.specialRequirements.accessibility.mobilityAssistance}
                            onChange={(e) => handleNestedInputChange('specialRequirements', 'accessibility', 'mobilityAssistance', e.target.checked)}
                          />
                          <span className="text-sm text-gray-700">Mobility Assistance</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Comfort</h3>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="checkbox mr-2"
                            checked={bookingData.specialRequirements.comfort.airConditioning}
                            onChange={(e) => handleNestedInputChange('specialRequirements', 'comfort', 'airConditioning', e.target.checked)}
                          />
                          <span className="text-sm text-gray-700">Air Conditioning</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="checkbox mr-2"
                            checked={bookingData.specialRequirements.comfort.music}
                            onChange={(e) => handleNestedInputChange('specialRequirements', 'comfort', 'music', e.target.checked)}
                          />
                          <span className="text-sm text-gray-700">Music</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="checkbox mr-2"
                            checked={bookingData.specialRequirements.comfort.wifi}
                            onChange={(e) => handleNestedInputChange('specialRequirements', 'comfort', 'wifi', e.target.checked)}
                          />
                          <span className="text-sm text-gray-700">WiFi</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Safety</h3>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="checkbox mr-2"
                            checked={bookingData.specialRequirements.safety.childSeat}
                            onChange={(e) => handleNestedInputChange('specialRequirements', 'safety', 'childSeat', e.target.checked)}
                          />
                          <span className="text-sm text-gray-700">Child Seat</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="checkbox mr-2"
                            checked={bookingData.specialRequirements.safety.boosterSeat}
                            onChange={(e) => handleNestedInputChange('specialRequirements', 'safety', 'boosterSeat', e.target.checked)}
                          />
                          <span className="text-sm text-gray-700">Booster Seat</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Review & Book</h2>
                  
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Summary</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vehicle:</span>
                        <span className="font-medium">{vehicle.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pickup:</span>
                        <span className="font-medium">{bookingData.pickupLocation.address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dropoff:</span>
                        <span className="font-medium">{bookingData.dropoffLocation.address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date & Time:</span>
                        <span className="font-medium">
                          {new Date(bookingData.pickupDateTime).toLocaleDateString()} - {new Date(bookingData.dropoffDateTime).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Passengers:</span>
                        <span className="font-medium">{bookingData.passengers.totalPassengers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Price:</span>
                        <span className="font-bold text-lg">{formatCurrency(bookingData.pricing.totalPrice, bookingData.pricing.currency)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm text-blue-800">
                        Your booking is secure and protected. You'll receive a confirmation email once the vehicle owner approves your request.
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                  className="btn btn-outline"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </button>
                
                {currentStep < 4 ? (
                  <button
                    onClick={handleNextStep}
                    className="btn btn-primary"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitBooking}
                    disabled={loading}
                    className="btn btn-success"
                  >
                    {loading ? 'Submitting...' : 'Submit Booking'}
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Details</h3>
              
              <div className="space-y-4">
                <div>
                  <img
                    src={vehicle.images?.[0] || '/placeholder-vehicle.jpg'}
                    alt={vehicle.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">{vehicle.name}</h4>
                  <p className="text-gray-600">{vehicle.make} {vehicle.model} ({vehicle.year})</p>
                </div>
                
                <div className="flex items-center">
                  {renderStars(vehicle.averageRating || 0)}
                  <span className="ml-2 text-sm text-gray-600">({vehicle.reviewCount || 0} reviews)</span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    {vehicle.seatingCapacity} seats
                  </div>
                  <div className="flex items-center">
                    <Car className="h-4 w-4 mr-2" />
                    {vehicle.fuelType} • {vehicle.transmission}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {vehicle.location?.city}, {vehicle.location?.district}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total Price</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(bookingData.pricing.totalPrice, bookingData.pricing.currency)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Includes all taxes and fees</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleBookingFlow;
