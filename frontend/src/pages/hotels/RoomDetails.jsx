import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import hotelService, { hotelUtils, bookingAPI } from '../../services/hotels/hotelService';
import roomAvailabilityService from '../../services/hotels/roomAvailabilityService';
import AvailabilityCalendar from '../../components/hotels/AvailabilityCalendar';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Bed,
  Users,
  Wifi,
  Car,
  Coffee,
  Tv,
  Wind,
  Shield,
  Heart,
  Share2,
  Star,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  Mail,
  Globe
} from 'lucide-react';

const RoomDetails = () => {
  const { hotelId, roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [bookingDates, setBookingDates] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1
  });
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchRoomDetails();
  }, [hotelId, roomId]);

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      const [roomResponse, hotelResponse] = await Promise.all([
        hotelService.roomAPI.getRoomFromHotel(hotelId, roomId),
        hotelService.hotelAPI.getHotel(hotelId)
      ]);

      if (roomResponse.status === 'success') {
        setRoom(roomResponse.data);
      } else {
        toast.error('Room not found');
        navigate(`/hotels/${hotelId}`);
      }

      if (hotelResponse.status === 'success') {
        setHotel(hotelResponse.data.hotel);
      } else {
        toast.error('Hotel not found');
        navigate('/hotels');
      }
    } catch (error) {
      console.error('Error fetching room details:', error);
      toast.error('Failed to load room details');
      navigate('/hotels');
    } finally {
      setLoading(false);
    }
  };

  const handleImageNavigation = (direction) => {
    if (!room?.images) return;
    
    if (direction === 'next') {
      setSelectedImageIndex((prev) => 
        prev === room.images.length - 1 ? 0 : prev + 1
      );
    } else {
      setSelectedImageIndex((prev) => 
        prev === 0 ? room.images.length - 1 : prev - 1
      );
    }
  };

  const checkAvailability = async (checkIn, checkOut) => {
    if (!checkIn || !checkOut || !room) return;
    
    try {
      setAvailabilityLoading(true);
      console.log('Checking availability for roomId:', roomId, 'dates:', checkIn, checkOut);
      
      // Use the real availability service
      const availabilityResult = await roomAvailabilityService.getRoomAvailabilityForBooking(
        roomId, 
        checkIn, 
        checkOut
      );
      
      console.log('Availability result:', availabilityResult);
      
      setAvailability({
        isAvailable: availabilityResult.isAvailable,
        message: availabilityResult.message,
        totalAvailableRooms: availabilityResult.totalAvailableRooms,
        details: availabilityResult.details,
        warning: availabilityResult.warning || false
      });
      
    } catch (error) {
      console.error('Error checking availability:', error);
      // Use fallback availability when API fails
      setAvailability({
        isAvailable: true,
        message: 'Availability check failed, but booking can proceed. Please contact hotel directly if needed.',
        warning: true
      });
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleDateChange = (field, value) => {
    const newDates = { ...bookingDates, [field]: value };
    
    // If check-in date is changed, ensure check-out is at least one day later
    if (field === 'checkIn' && value && newDates.checkOut) {
      const checkInDate = new Date(value + 'T00:00:00');
      const checkOutDate = new Date(newDates.checkOut + 'T00:00:00');
      
      if (checkOutDate <= checkInDate) {
        // Set check-out to be one day after check-in
        const nextDay = new Date(checkInDate);
        nextDay.setDate(nextDay.getDate() + 1);
        newDates.checkOut = nextDay.toISOString().split('T')[0];
      }
    }
    
    setBookingDates(newDates);
    
    // Check availability when both dates are selected
    if (newDates.checkIn && newDates.checkOut) {
      checkAvailability(newDates.checkIn, newDates.checkOut);
    }
  };

  const handleDateSelect = (dateString, availability) => {
    // Allow selection of dates with unknown availability (availability is null/undefined)
    // Only block dates that are explicitly not available
    if (availability && availability.status !== 'available') {
      toast.error('This date is not available for booking');
      return;
    }

    // Set check-in date if not set, or check-out if check-in is already set
    if (!bookingDates.checkIn) {
      setBookingDates(prev => ({ ...prev, checkIn: dateString }));
      toast.success(`Check-in date set to ${dateString}`);
    } else if (!bookingDates.checkOut) {
      const checkInDate = new Date(bookingDates.checkIn);
      const selectedDate = new Date(dateString);
      
      if (selectedDate <= checkInDate) {
        toast.error('Check-out date must be after check-in date');
        return;
      }
      
      setBookingDates(prev => ({ ...prev, checkOut: dateString }));
      toast.success(`Check-out date set to ${dateString}`);
    } else {
      // Reset and set new check-in
      setBookingDates({ checkIn: dateString, checkOut: '' });
      toast.success(`Check-in date updated to ${dateString}`);
    }
  };

  const getAmenityIcon = (amenity) => {
    const icons = {
      wifi: <Wifi className="w-4 h-4" />,
      airConditioning: <Wind className="w-4 h-4" />,
      parking: <Car className="w-4 h-4" />,
      television: <Tv className="w-4 h-4" />,
      minibar: <Coffee className="w-4 h-4" />,
      safe: <Shield className="w-4 h-4" />,
    };
    return icons[amenity] || <CheckCircle className="w-4 h-4" />;
  };

  const getAmenityLabel = (amenity) => {
    const labels = {
      wifi: 'Free WiFi',
      airConditioning: 'Air Conditioning',
      parking: 'Free Parking',
      television: 'TV',
      minibar: 'Minibar',
      safe: 'Safe',
      privateBathroom: 'Private Bathroom',
      hotWater: 'Hot Water',
      bathtub: 'Bathtub',
      shower: 'Shower',
      toiletries: 'Toiletries',
      hairdryer: 'Hair Dryer',
      towels: 'Towels',
      seaView: 'Sea View',
      mountainView: 'Mountain View',
      gardenView: 'Garden View',
      cityView: 'City View',
      poolView: 'Pool View',
      workDesk: 'Work Desk',
      seatingArea: 'Seating Area',
      diningArea: 'Dining Area',
      kitchenette: 'Kitchenette',
      wheelchairAccessible: 'Wheelchair Accessible',
      accessibleBathroom: 'Accessible Bathroom',
      accessibleElevator: 'Accessible Elevator',
      roomService: 'Room Service',
      housekeeping: 'Housekeeping',
      laundryService: 'Laundry Service',
      wakeUpService: 'Wake-up Service',
      balcony: 'Balcony',
      fan: 'Fan',
      heating: 'Heating',
      telephone: 'Telephone',
      alarmClock: 'Alarm Clock',
    };
    return labels[amenity] || amenity;
  };

  const handleBooking = async () => {
    if (!bookingDates.checkIn || !bookingDates.checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    if (!bookingDates.guests || bookingDates.guests < 1) {
      toast.error('Please select number of guests');
      return;
    }

    if (!user) {
      toast.error('Please sign in to make a booking');
      return;
    }

    try {
      setBookingLoading(true);
      
      // Calculate pricing
      const checkInDate = new Date(bookingDates.checkIn);
      const checkOutDate = new Date(bookingDates.checkOut);
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
      const basePrice = room.pricing?.basePrice || 100;
      const totalPrice = basePrice * nights;

      // Create booking payload
      const bookingPayload = {
        hotel: hotelId,
        room: room._id,
        checkInDate: bookingDates.checkIn,
        checkOutDate: bookingDates.checkOut,
        numberOfRooms: 1,
        guests: {
          adults: bookingDates.guests || 1, // Ensure adults is always a number
          children: 0,
          infants: 0
        },
        guestDetails: {
          firstName: user.firstName || user.email.split('@')[0],
          lastName: user.lastName || 'Guest',
          email: user.email,
          phone: user.phone || '+1234567890' // Provide default phone if not available
        },
        specialRequests: ''
      };

      console.log('Booking payload:', bookingPayload);
      console.log('User data:', user);
      console.log('Booking dates:', bookingDates);

      // Create the booking using the authenticated API service
      const result = await bookingAPI.createBooking(bookingPayload);

      if (result.status === 'success') {
        toast.success('Booking created successfully!');
        
        // Navigate to payment page with booking ID
        navigate(`/payment/${result.data.booking._id}`, { 
          state: { 
            bookingId: result.data.booking._id,
            amount: result.data.booking.pricing.totalPrice,
            currency: result.data.booking.pricing.currency,
            bookingType: 'hotel',
            hotelName: hotel?.name,
            roomName: room.name,
            checkIn: bookingDates.checkIn,
            checkOut: bookingDates.checkOut,
            guests: bookingDates.guests,
            bookingReference: result.data.booking.bookingReference
          }
        });
      } else {
        toast.error(result.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Booking error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to create booking. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Room not found</h2>
          <Link to="/hotels" className="text-blue-600 hover:text-blue-800">
            Back to Hotels
          </Link>
        </div>
      </div>
    );
  }

  const activeAmenities = Object.entries(room.amenities || {})
    .filter(([key, value]) => value === true)
    .map(([key]) => key);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/hotels/${hotelId}`)}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Hotel
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{room.name}</h1>
                <p className="text-gray-600">{hotel?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Heart className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            {room.images && room.images.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Room Photos</h2>
                <div className="relative">
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-200">
                    <img
                      src={room.images[selectedImageIndex].url}
                      alt={`${room.name} - Image ${selectedImageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {room.images.length > 1 && (
                    <>
                      <button
                        onClick={() => handleImageNavigation('prev')}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleImageNavigation('next')}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                      >
                        <ArrowLeft className="w-5 h-5 rotate-180" />
                      </button>
                    </>
                  )}

                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    {selectedImageIndex + 1} / {room.images.length}
                  </div>
                </div>

                {/* Thumbnail Gallery */}
                {room.images.length > 1 && (
                  <div className="flex space-x-2 mt-4 overflow-x-auto">
                    {room.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                          index === selectedImageIndex ? 'border-blue-600' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={image.url}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Room Details */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Room Details</h2>
              <p className="text-gray-600 mb-6">{room.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Room Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {room.maxOccupancy?.adults} adults, {room.maxOccupancy?.children} children
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Bed className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {room.bedConfiguration?.map(bed => `${bed.quantity} ${bed.type}`).join(', ')}
                      </span>
                    </div>
                    {room.size && (
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600">{room.size} sq ft</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600">Room Type: {room.roomType}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Policies</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Check-in: {room.policies?.checkInTime}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Check-out: {room.policies?.checkOutTime}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Min Stay: {room.policies?.minStay} night(s)
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600">
                        Cancellation: {room.policies?.cancellationPolicy}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Availability Calendar */}
            <div className="mb-8">
              <AvailabilityCalendar
                roomId={roomId}
                onDateSelect={handleDateSelect}
                selectedDates={bookingDates}
              />
            </div>

            {/* Amenities */}
            {activeAmenities.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {activeAmenities.map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      {getAmenityIcon(amenity)}
                      <span className="text-sm text-gray-600">{getAmenityLabel(amenity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hotel Information */}
            {hotel && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Hotel Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {hotel.location?.address}, {hotel.location?.city}, {hotel.location?.district}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Contact</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-600">{hotel.contact?.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-600">{hotel.contact?.email}</span>
                      </div>
                      {hotel.contact?.website && (
                        <div className="flex items-center">
                          <Globe className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-sm text-gray-600">{hotel.contact.website}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              {hotelUtils.formatPrice(room.pricing?.basePrice) && (
                <>
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {hotelUtils.formatPrice(room.pricing?.basePrice)}
                    </div>
                    <div className="text-sm text-gray-600">per night</div>
                  </div>

                  <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    value={bookingDates.checkIn}
                    onChange={(e) => handleDateChange('checkIn', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-out Date
                  </label>
                  <input
                    type="date"
                    value={bookingDates.checkOut}
                    onChange={(e) => handleDateChange('checkOut', e.target.value)}
                    min={bookingDates.checkIn || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Guests
                  </label>
                  <select
                    value={bookingDates.guests}
                    onChange={(e) => setBookingDates(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Array.from({ length: room.maxOccupancy?.adults || 4 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Guest' : 'Guests'}</option>
                    ))}
                  </select>
                </div>

                {/* Availability Status */}
                {bookingDates.checkIn && bookingDates.checkOut && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    {availabilityLoading ? (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Checking availability...</span>
                      </div>
                    ) : availability ? (
                      <div className="flex items-center space-x-2">
                        {availability.isAvailable ? (
                          <>
                            {availability.warning ? (
                              <>
                                <AlertCircle className="w-5 h-5 text-yellow-600" />
                                <span className="text-yellow-600 font-medium">
                                  Booking available with warning
                                </span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-green-600 font-medium">
                                  Available for your selected dates
                                </span>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-600" />
                            <span className="text-red-600 font-medium">
                              Not available for selected dates
                            </span>
                          </>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
                  </div>

                  <button
                    onClick={handleBooking}
                    disabled={bookingLoading || !bookingDates.checkIn || !bookingDates.checkOut || (availability && !availability.isAvailable)}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                      bookingLoading || !bookingDates.checkIn || !bookingDates.checkOut || (availability && !availability.isAvailable)
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : availability?.warning
                          ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {bookingLoading 
                      ? 'Processing Booking...'
                      : availability && !availability.isAvailable 
                        ? 'Room Not Available' 
                        : availability?.warning 
                          ? 'Book with Warning'
                          : 'Book This Room'
                    }
                  </button>

                  <div className="mt-4 text-center">
                    {availability?.warning && (
                      <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center justify-center space-x-2 text-sm text-yellow-700">
                          <AlertCircle className="w-4 h-4" />
                          <span>{availability.message}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Free cancellation up to 24 hours before check-in</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetails;
