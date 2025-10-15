import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hotelAPI, roomAPI, bookingAPI, hotelUtils } from '../../services/hotels/hotelService';
import roomAvailabilityService from '../../services/hotels/roomAvailabilityService';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Users, 
  Bed, 
  Calendar, 
  Clock, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Phone,
  Mail,
  Globe,
  Wifi,
  Car,
  Coffee,
  Tv,
  Wind,
  Waves,
  Utensils,
  Dumbbell,
  Sparkles,
  Navigation
} from 'lucide-react';
import toast from 'react-hot-toast';

const HotelBooking = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [hotel, setHotel] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    adults: parseInt(searchParams.get('adults')) || 1,
    children: parseInt(searchParams.get('children')) || 0,
    infants: parseInt(searchParams.get('infants')) || 0,
    specialRequests: searchParams.get('specialRequests') || '',
    guestInfo: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      nationality: '',
      passportNumber: ''
    },
    paymentMethod: 'card',
    termsAccepted: false
  });

  const [pricing, setPricing] = useState({
    basePrice: 0,
    totalNights: 0,
    subtotal: 0,
    taxes: 0,
    serviceFee: 0,
    total: 0
  });

  const [errors, setErrors] = useState({});

  const amenityIcons = {
    wifi: Wifi,
    airConditioning: Wind,
    tv: Tv,
    minibar: Coffee,
    balcony: Waves,
    oceanView: Waves,
    mountainView: MapPin,
    roomService: Utensils,
    safe: Sparkles,
    parking: Car,
    gym: Dumbbell,
    spa: Sparkles,
    restaurant: Utensils,
    bar: Coffee,
    pool: Waves,
    airportPickup: Navigation,
    tourBooking: Globe,
    currencyExchange: Sparkles,
    laundryService: Sparkles,
    englishSpeakingStaff: Users,
    localTransportation: Car,
    safetyDepositBox: Sparkles,
    internationalAdapters: Sparkles,
    ayurveda: Sparkles,
    culturalShows: Sparkles,
    localCuisine: Utensils,
    heritageExperience: Sparkles,
    wildlifeSafari: Sparkles,
    plantationTour: Sparkles
  };

  const handleDateChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBooking = async () => {
    if (!bookingData.checkIn || !bookingData.checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    try {
      setSubmitting(true);
      
      const bookingPayload = {
        hotel: hotel._id,
        room: room._id,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        numberOfRooms: bookingData.numberOfRooms,
        guests: {
          adults: bookingData.adults,
          children: bookingData.children
        },
        guestInfo: {
          name: bookingData.name,
          email: bookingData.email,
          phone: bookingData.phone
        },
        specialRequests: bookingData.specialRequests
      };

      const response = await bookingAPI.createBooking(bookingPayload);
      
      if (response.status === 'success') {
        toast.success('Booking created successfully!');
        navigate('/my-bookings');
      } else {
        toast.error(response.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!user) {
      toast.error('Please login to make a booking');
      navigate('/login');
      return;
    }

    fetchBookingData();
  }, [id, searchParams, user]);

  useEffect(() => {
    if (bookingData.checkIn && bookingData.checkOut && room) {
      calculatePricing();
      checkAvailability();
    }
  }, [bookingData.checkIn, bookingData.checkOut, room]);

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      
      // Fetch hotel details
      const hotelResponse = await hotelAPI.getHotel(id);
      setHotel(hotelResponse.data.hotel);

      // Fetch room details
      const roomId = searchParams.get('roomId');
      if (roomId) {
        try {
          const roomResponse = await roomAPI.getRoomFromHotel(id, roomId);
          setRoom(roomResponse.data);
        } catch (roomError) {
          console.error('Error fetching room details:', roomError);
          // Create a fallback room object with basic info
          setRoom({
            _id: roomId,
            name: 'Selected Room',
            roomType: 'Standard',
            pricing: {
              basePrice: 100,
              currency: 'USD'
            },
            amenities: [],
            images: [],
            bedConfiguration: [{ quantity: 1, type: 'Double' }],
            maxOccupancy: { adults: 2, children: 1 },
            size: '25 sqm',
            description: 'Room details could not be loaded, but booking can proceed.'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching booking data:', error);
      toast.error('Failed to load booking information');
      navigate('/hotels');
    } finally {
      setLoading(false);
    }
  };

  const calculatePricing = async () => {
    try {
      const roomId = searchParams.get('roomId');
      if (!roomId || !room) return;

      // Use fallback pricing if room data is incomplete
      const basePrice = room.pricing?.basePrice || 100;
      const nights = hotelUtils.calculateNights(bookingData.checkIn, bookingData.checkOut);
      
      const subtotal = basePrice * nights;
      const taxes = subtotal * 0.12; // 12% tax
      const serviceFee = subtotal * 0.05; // 5% service fee
      const total = subtotal + taxes + serviceFee;

      setPricing({
        basePrice: basePrice,
        totalNights: nights,
        subtotal,
        taxes,
        serviceFee,
        total
      });
    } catch (error) {
      console.error('Error calculating pricing:', error);
      // Use fallback pricing
      const nights = hotelUtils.calculateNights(bookingData.checkIn, bookingData.checkOut);
      const basePrice = 100;
      const subtotal = basePrice * nights;
      const taxes = subtotal * 0.12;
      const serviceFee = subtotal * 0.05;
      const total = subtotal + taxes + serviceFee;

      setPricing({
        basePrice,
        totalNights: nights,
        subtotal,
        taxes,
        serviceFee,
        total
      });
    }
  };

  const checkAvailability = async () => {
    try {
      const roomId = searchParams.get('roomId');
      if (!roomId) return;

      setAvailabilityLoading(true);
      
      // Use the real availability service
      const availabilityResult = await roomAvailabilityService.getRoomAvailabilityForBooking(
        roomId,
        bookingData.checkIn,
        bookingData.checkOut
      );
      
      console.log('HotelBooking availability result:', availabilityResult);
      
      setAvailability({
        isAvailable: availabilityResult.isAvailable,
        message: availabilityResult.message,
        totalAvailableRooms: availabilityResult.totalAvailableRooms,
        details: availabilityResult.details
      });
      
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailability({
        isAvailable: false,
        message: 'Error checking availability'
      });
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate dates
    const dateValidation = hotelUtils.validateDateRange(bookingData.checkIn, bookingData.checkOut);
    if (dateValidation) {
      newErrors.dates = dateValidation;
    }

    // Validate guest information
    if (!bookingData.guestInfo.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!bookingData.guestInfo.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!bookingData.guestInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(bookingData.guestInfo.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!bookingData.guestInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    // Validate terms acceptance
    if (!bookingData.termsAccepted) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    // Check availability before proceeding
    if (availability && !availability.isAvailable) {
      toast.error('Room is not available for the selected dates');
      return;
    }

    try {
      setSubmitting(true);

      const bookingPayload = {
        hotel: id,
        room: searchParams.get('roomId'),
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: {
          adults: bookingData.adults,
          children: bookingData.children,
          infants: bookingData.infants
        },
        guestInfo: bookingData.guestInfo,
        specialRequests: bookingData.specialRequests,
        pricing: {
          basePrice: pricing.basePrice,
          totalNights: pricing.totalNights,
          subtotal: pricing.subtotal,
          taxes: pricing.taxes,
          serviceFee: pricing.serviceFee,
          total: pricing.total
        },
        paymentMethod: bookingData.paymentMethod
      };

      const response = await bookingAPI.createBooking(bookingPayload);
      
      if (response.data.status === 'success') {
        const booking = response.data.booking;
        
        // Navigate to payment page
        navigate('/payment', {
          state: {
            bookingId: booking._id,
            bookingType: 'hotel',
            amount: pricing.total,
            currency: 'LKR',
            hotelName: hotel.name,
            roomName: room.name,
            checkIn: bookingData.checkIn,
            checkOut: bookingData.checkOut,
            guests: bookingData.adults,
            bookingReference: booking.bookingReference
          }
        });
      } else {
        toast.error(response.data.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const getAmenityIcon = (amenity) => {
    const IconComponent = amenityIcons[amenity] || Sparkles;
    return <IconComponent className="w-4 h-4" />;
  };

  const getAmenityLabel = (amenity) => {
    const labels = {
      wifi: 'Free WiFi',
      airConditioning: 'Air Conditioning',
      tv: 'TV',
      minibar: 'Mini Bar',
      balcony: 'Balcony',
      oceanView: 'Ocean View',
      mountainView: 'Mountain View',
      roomService: 'Room Service',
      safe: 'Safe',
      parking: 'Parking',
      gym: 'Gym Access',
      spa: 'Spa Access',
      restaurant: 'Restaurant',
      bar: 'Bar',
      pool: 'Swimming Pool',
      airportPickup: 'Airport Pickup',
      tourBooking: 'Tour Booking',
      currencyExchange: 'Currency Exchange',
      laundryService: 'Laundry Service',
      englishSpeakingStaff: 'English Speaking Staff',
      localTransportation: 'Local Transportation',
      safetyDepositBox: 'Safety Deposit Box',
      internationalAdapters: 'International Adapters',
      ayurveda: 'Ayurveda',
      culturalShows: 'Cultural Shows',
      localCuisine: 'Local Cuisine',
      heritageExperience: 'Heritage Experience',
      wildlifeSafari: 'Wildlife Safari',
      plantationTour: 'Plantation Tour'
    };
    return labels[amenity] || amenity;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Hotel information not found</h2>
          <button
            onClick={() => navigate('/hotels')}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Hotels
          </button>
        </div>
      </div>
    );
  }

  // Show booking form even if room data is not available
  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Booking Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Booking Information</h2>
                <p className="text-gray-600 mb-4">Room details could not be loaded, but you can still proceed with booking.</p>
                
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Check-in Date</label>
                      <input
                        type="date"
                        value={bookingData.checkIn}
                        onChange={(e) => handleDateChange('checkIn', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Check-out Date</label>
                      <input
                        type="date"
                        value={bookingData.checkOut}
                        onChange={(e) => handleDateChange('checkOut', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Guests</label>
                    <select
                      value={bookingData.adults}
                      onChange={(e) => setBookingData(prev => ({ ...prev, adults: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      if (!bookingData.checkIn || !bookingData.checkOut) {
                        toast.error('Please select check-in and check-out dates');
                        return;
                      }
                      // Navigate to booking with basic data
                      navigate(`/hotels/${id}/booking`, { 
                        state: { 
                          bookingData: {
                            hotelId: id,
                            hotelName: hotel.name,
                            checkIn: bookingData.checkIn,
                            checkOut: bookingData.checkOut,
                            guests: bookingData.adults
                          }
                        }
                      });
                    }}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Continue to Booking
                  </button>
                </form>
              </div>
            </div>
            
            {/* Booking Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{hotel.name}</h4>
                    <p className="text-sm text-gray-600">Room details will be confirmed during booking</p>
                  </div>
                  
                  {bookingData.checkIn && bookingData.checkOut && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Check-in:</span>
                        <span className="font-medium">{bookingData.checkIn}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Check-out:</span>
                        <span className="font-medium">{bookingData.checkOut}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Guests:</span>
                        <span className="font-medium">{bookingData.adults}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/hotels/${id}`)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Hotel
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Complete Your Booking</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Hotel & Room Summary */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Booking Summary</h2>
                
                <div className="flex items-start space-x-4">
                  {hotel.images && hotel.images.length > 0 && (
                    <img
                      src={hotel.images[0]}
                      alt={hotel.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{hotel.name}</h3>
                    <p className="text-sm text-gray-600">{room.name}</p>
                    <div className="flex items-center mt-2">
                      <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-600">
                        {hotel.location.city}, {hotel.location.district}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span>Check-in: {hotelUtils.formatDate(bookingData.checkIn)}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span>Check-out: {hotelUtils.formatDate(bookingData.checkOut)}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 text-gray-400 mr-2" />
                    <span>{bookingData.adults} adults, {bookingData.children} children</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-400 mr-2" />
                    <span>{pricing.totalNights} night{pricing.totalNights !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Availability Status */}
                {bookingData.checkIn && bookingData.checkOut && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    {availabilityLoading ? (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm">Checking availability...</span>
                      </div>
                    ) : availability ? (
                      <div className="flex items-center space-x-2">
                        {availability.isAvailable ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">
                              Room is available for your selected dates
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-red-600 font-medium">
                              Room is not available for selected dates
                            </span>
                          </>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Guest Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Guest Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={bookingData.guestInfo.firstName}
                      onChange={(e) => setBookingData({
                        ...bookingData,
                        guestInfo: { ...bookingData.guestInfo, firstName: e.target.value }
                      })}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.firstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={bookingData.guestInfo.lastName}
                      onChange={(e) => setBookingData({
                        ...bookingData,
                        guestInfo: { ...bookingData.guestInfo, lastName: e.target.value }
                      })}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={bookingData.guestInfo.email}
                      onChange={(e) => setBookingData({
                        ...bookingData,
                        guestInfo: { ...bookingData.guestInfo, email: e.target.value }
                      })}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={bookingData.guestInfo.phone}
                      onChange={(e) => setBookingData({
                        ...bookingData,
                        guestInfo: { ...bookingData.guestInfo, phone: e.target.value }
                      })}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nationality
                    </label>
                    <input
                      type="text"
                      value={bookingData.guestInfo.nationality}
                      onChange={(e) => setBookingData({
                        ...bookingData,
                        guestInfo: { ...bookingData.guestInfo, nationality: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passport Number
                    </label>
                    <input
                      type="text"
                      value={bookingData.guestInfo.passportNumber}
                      onChange={(e) => setBookingData({
                        ...bookingData,
                        guestInfo: { ...bookingData.guestInfo, passportNumber: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Special Requests</h2>
                <textarea
                  value={bookingData.specialRequests}
                  onChange={(e) => setBookingData({...bookingData, specialRequests: e.target.value})}
                  rows="4"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any special requests or requirements..."
                />
              </div>

              {/* Terms and Conditions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={bookingData.termsAccepted}
                    onChange={(e) => setBookingData({...bookingData, termsAccepted: e.target.checked})}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700">
                    I agree to the{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-800">
                      Terms and Conditions
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-800">
                      Privacy Policy
                    </a>
                  </label>
                </div>
                {errors.terms && (
                  <p className="text-red-500 text-sm mt-1">{errors.terms}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <button
                  type="submit"
                  disabled={submitting || (availability && !availability.isAvailable)}
                  className={`w-full py-3 px-6 rounded-lg transition-colors ${
                    submitting || (availability && !availability.isAvailable)
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {submitting ? 'Processing...' : 
                   (availability && !availability.isAvailable) ? 'Room Not Available' : 
                   'Complete Booking'}
                </button>
              </div>
            </form>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
              
              {/* Room Details */}
              <div className="border-b pb-4 mb-4">
                <h4 className="font-medium text-gray-900">{room.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{room.description}</p>
                
                {room.amenities && room.amenities.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Room Amenities</h5>
                    <div className="flex flex-wrap gap-2">
                      {room.amenities.slice(0, 6).map((amenity) => (
                        <div key={amenity} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-full text-xs">
                          {getAmenityIcon(amenity)}
                          <span>{getAmenityLabel(amenity)}</span>
                        </div>
                      ))}
                      {room.amenities.length > 6 && (
                        <span className="text-xs text-gray-500">
                          +{room.amenities.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Base Price ({pricing.totalNights} night{pricing.totalNights !== 1 ? 's' : ''})</span>
                  <span>{hotelUtils.formatPrice(pricing.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taxes (12%)</span>
                  <span>{hotelUtils.formatPrice(pricing.taxes)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Service Fee (5%)</span>
                  <span>{hotelUtils.formatPrice(pricing.serviceFee)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-blue-600">{hotelUtils.formatPrice(pricing.total)}</span>
                  </div>
                </div>
              </div>

              {/* Hotel Contact */}
              <div className="mt-6 pt-4 border-t">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Hotel Contact</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    <span>{hotel.contact.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    <span>{hotel.contact.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelBooking;
