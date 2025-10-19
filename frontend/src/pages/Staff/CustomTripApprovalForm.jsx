import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  CheckCircle,
  XCircle,
  UserCheck,
  Car,
  Building,
  DollarSign,
  FileText,
  AlertCircle,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Send
} from 'lucide-react'

const CustomTripApprovalForm = () => {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get trip data from location state or fetch from API
  const selectedTrip = location.state?.trip || null
  const approvalAction = location.state?.action || 'approved'
  
  // Debug: Log selectedTrip data
  console.log('selectedTrip:', selectedTrip)
  console.log('selectedTrip.requestDetails:', selectedTrip?.requestDetails)
  console.log('selectedTrip keys:', selectedTrip ? Object.keys(selectedTrip) : 'null')
  console.log('Trip ID from params:', tripId)
  console.log('Trip ID from selectedTrip:', selectedTrip?._id || selectedTrip?.id)
  
  // If trip data is not available, fetch it from API
  useEffect(() => {
    const fetchTripData = async () => {
      if (selectedTrip) {
        setTripData(selectedTrip)
        return
      }
      
      if (tripId) {
        try {
          const response = await fetch(`/api/custom-trips/${tripId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          const data = await response.json()
          if (data.success) {
            console.log('Fetched trip data:', data.data)
            console.log('Fetched trip data keys:', Object.keys(data.data))
            setTripData(data.data)
          }
        } catch (error) {
          console.error('Error fetching trip data:', error)
        }
      }
    }
    fetchTripData()
  }, [selectedTrip, tripId])
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [tripData, setTripData] = useState(null)
  
  // Approval form state
  const [approvalForm, setApprovalForm] = useState({
    assignedGuide: '',
    assignedVehicles: [],
    hotelBookings: [],
    totalBudget: {
      guideFees: 0,
      vehicleCosts: 0,
      hotelCosts: 0,
      activityCosts: 0,
      additionalFees: 0,
      totalAmount: 0
    },
    itinerary: [],
    additionalNotes: '',
    staffComments: ''
  })
  
  // Available resources
  const [availableGuides, setAvailableGuides] = useState([])
  const [availableVehicles, setAvailableVehicles] = useState([])
  const [availableHotels, setAvailableHotels] = useState([])
  
  // Manual resource creation state
  const [showManualGuide, setShowManualGuide] = useState(false)
  const [showManualVehicle, setShowManualVehicle] = useState(false)
  const [showManualHotel, setShowManualHotel] = useState(false)
  
  // Filter states
  const [hotelCityFilter, setHotelCityFilter] = useState('')
  
  // Manual resource forms
  const [manualGuide, setManualGuide] = useState({
    name: '',
    email: '',
    phone: '',
    languages: [],
    specialties: [],
    pricePerDay: 0,
    experience: '',
    isCustom: true
  })
  
  const [manualVehicle, setManualVehicle] = useState({
    type: '',
    make: '',
    model: '',
    capacity: 0,
    dailyRate: 0,
    driver: '',
    features: [],
    isCustom: true
  })
  
  const [manualHotel, setManualHotel] = useState({
    name: '',
    city: '',
    starRating: 0,
    pricePerNight: 0,
    amenities: [],
    roomType: '',
    checkInDate: '',
    checkOutDate: '',
    rooms: 1,
    specialRequests: '',
    isCustom: true
  })

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Load available resources and trip data from database
  useEffect(() => {
    fetchAvailableResources()
    fetchCustomTripData()
  }, [])

  const fetchAvailableResources = async () => {
    try {
      // Fetch guides
      const guidesResponse = await fetch('/api/guides', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const guidesData = await guidesResponse.json()
      if (guidesData.success) {
        console.log('Fetched guides:', guidesData.data)
        setAvailableGuides(guidesData.data)
      }

      // Fetch vehicles
      const vehiclesResponse = await fetch('/api/vehicles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const vehiclesData = await vehiclesResponse.json()
      if (vehiclesData.success) {
        setAvailableVehicles(vehiclesData.data)
      }

      // Fetch hotels - try staff API first, then fallback to public API
      let hotelsData = null
      try {
        const hotelsResponse = await fetch('/api/staff/hotels', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        hotelsData = await hotelsResponse.json()
        console.log('Staff Hotels API response:', hotelsData)
      } catch (staffError) {
        console.log('Staff hotels API failed, trying public API:', staffError)
        try {
          const hotelsResponse = await fetch('/api/hotels', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          hotelsData = await hotelsResponse.json()
          console.log('Public Hotels API response:', hotelsData)
        } catch (publicError) {
          console.error('Both hotels APIs failed:', publicError)
        }
      }
      
      if (hotelsData?.success) {
        console.log('Fetched hotels:', hotelsData.data.hotels)
        console.log('First hotel room types:', hotelsData.data.hotels[0]?.roomTypes)
        setAvailableHotels(hotelsData.data.hotels)
      } else if (hotelsData?.status === 'success') {
        console.log('Fetched hotels:', hotelsData.data.hotels)
        console.log('First hotel room types:', hotelsData.data.hotels[0]?.roomTypes)
        setAvailableHotels(hotelsData.data.hotels)
      } else {
        console.error('Hotels API error:', hotelsData?.message || 'No hotels data received')
      }
    } catch (error) {
      console.error('Error fetching resources:', error)
      setMessage({ type: 'error', text: 'Failed to load available resources' })
    }
  }

  const fetchCustomTripData = async () => {
    try {
      if (!tripId) {
        console.error('No trip ID provided')
        setMessage({ type: 'error', text: 'No trip ID provided' })
        return
      }

      const response = await fetch(`/api/custom-trips/${tripId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log('Fetched custom trip:', data.data)
        // Update the form with real trip data
        setApprovalForm(prev => ({
          ...prev,
          assignedGuide: data.data.staffAssignment?.assignedGuide || '',
          assignedVehicles: data.data.staffAssignment?.assignedVehicles || [],
          hotelBookings: data.data.staffAssignment?.hotelBookings || [],
          totalBudget: data.data.staffAssignment?.totalBudget || {
            guideFees: 0,
            vehicleCosts: 0,
            hotelCosts: 0,
            activityCosts: 0,
            additionalFees: 0,
            totalAmount: 0
          },
          itinerary: data.data.staffAssignment?.itinerary || [],
          additionalNotes: data.data.staffAssignment?.additionalNotes || '',
          staffComments: data.data.approvalDetails?.staffComments || ''
        }))
      } else {
        console.error('Failed to fetch custom trip:', data.message)
        setMessage({ type: 'error', text: data.message || 'Failed to load trip data' })
      }
    } catch (error) {
      console.error('Error fetching custom trip:', error)
      setMessage({ type: 'error', text: 'Failed to load trip data' })
    }
  }

  // Calculate total budget
  // Helper function to calculate trip duration
  const calculateTripDuration = (tripData) => {
    if (tripData?.requestDetails?.startDate && tripData?.requestDetails?.endDate) {
      return Math.ceil((new Date(tripData.requestDetails.endDate) - new Date(tripData.requestDetails.startDate)) / (1000 * 60 * 60 * 24))
    } else if (tripData?.startDate && tripData?.endDate) {
      return Math.ceil((new Date(tripData.endDate) - new Date(tripData.startDate)) / (1000 * 60 * 60 * 24))
    } else if (tripData?.tripStartDate && tripData?.tripEndDate) {
      return Math.ceil((new Date(tripData.tripEndDate) - new Date(tripData.tripStartDate)) / (1000 * 60 * 60 * 24))
    } else if (tripData?.duration) {
      const durationMatch = tripData.duration.match(/(\d+)/)
      return durationMatch ? parseInt(durationMatch[1]) : 7
    } else {
      return 7 // Default fallback
    }
  }

  const calculateTotalBudget = () => {
    console.log('calculateTotalBudget called')
    console.log('Current approvalForm:', approvalForm)
    
    if (!tripData) {
      console.log('tripData is null, skipping budget calculation')
      return
    }
    
    // Try different possible date field names
    const tripDuration = calculateTripDuration(tripData)
    console.log('Trip duration calculated:', tripDuration, 'days')
    console.log('Trip duration:', tripDuration)
    
    const guideFees = approvalForm.assignedGuide ? 
      (availableGuides.find(g => g._id === approvalForm.assignedGuide)?.profile?.pricePerDay || 0) * tripDuration : 0
    console.log('Guide fees:', guideFees)
    
    const vehicleCosts = approvalForm.assignedVehicles.reduce((total, vehicle) => {
      const cost = vehicle.dailyRate * vehicle.totalDays
      console.log(`Vehicle ${vehicle.make || 'Unknown'} ${vehicle.model || ''}: ${vehicle.dailyRate} * ${vehicle.totalDays} = ${cost}`)
      return total + cost
    }, 0)
    console.log('Vehicle costs:', vehicleCosts)
    
    const hotelCosts = approvalForm.hotelBookings.reduce((total, booking) => {
      const cost = booking.pricePerNight * booking.nights * booking.rooms
      console.log(`Hotel ${booking.name}: ${booking.pricePerNight} * ${booking.nights} * ${booking.rooms} = ${cost}`)
      return total + cost
    }, 0)
    console.log('Hotel costs:', hotelCosts)
    
    const totalAmount = guideFees + vehicleCosts + hotelCosts + approvalForm.totalBudget.activityCosts + approvalForm.totalBudget.additionalFees
    console.log('Total amount:', totalAmount)
    
    setApprovalForm(prev => ({
      ...prev,
      totalBudget: {
        ...prev.totalBudget,
        guideFees,
        vehicleCosts,
        hotelCosts,
        totalAmount
      }
    }))
  }

  // Vehicle management functions
  const addVehicle = () => {
    setApprovalForm(prev => {
      // Calculate trip duration
      const addVehicleTripDuration = calculateTripDuration(tripData)
      
      const updated = {
        ...prev,
        assignedVehicles: [...prev.assignedVehicles, {
          vehicleType: '',
          vehicleId: '',
          dailyRate: 0,
          totalDays: addVehicleTripDuration,
          driver: null, // Set driver to null initially
          isCustom: false
        }]
      }
      
      // Calculate budget immediately with updated data
      if (!tripData) {
        console.log('tripData is null, skipping budget calculation')
        return updated
      }
      
      console.log('Trip duration calculated:', addVehicleTripDuration, 'days')
      
      const guideFees = updated.assignedGuide ? 
        (typeof updated.assignedGuide === 'string' 
          ? availableGuides.find(g => g.id === updated.assignedGuide)?.price || 0
          : updated.assignedGuide.pricePerDay || 0
        ) * addVehicleTripDuration : 0
      
      const vehicleCosts = updated.assignedVehicles.reduce((total, vehicle) => {
        return total + (vehicle.dailyRate * vehicle.totalDays)
      }, 0)
      
      const hotelCosts = updated.hotelBookings.reduce((total, booking) => {
        const cost = booking.pricePerNight * booking.nights * booking.rooms
        console.log(`Hotel ${booking.name || 'Unknown'}: ${booking.pricePerNight} * ${booking.nights} * ${booking.rooms} = ${cost}`)
        return total + cost
      }, 0)
      
      const totalAmount = guideFees + vehicleCosts + hotelCosts + updated.totalBudget.activityCosts + updated.totalBudget.additionalFees
      
      console.log('Budget calculation - Calculated costs:', { guideFees, vehicleCosts, hotelCosts, totalAmount })
      
      return {
        ...updated,
        totalBudget: {
          ...updated.totalBudget,
          guideFees,
          vehicleCosts,
          hotelCosts,
          totalAmount
        }
      }
    })
  }

  const addManualVehicle = () => {
    console.log('Adding manual vehicle:', manualVehicle)
    setApprovalForm(prev => {
      // Calculate trip duration
      const addManualVehicleTripDuration = calculateTripDuration(tripData)
      
      const updated = {
        ...prev,
        assignedVehicles: [...prev.assignedVehicles, {
          ...manualVehicle,
          driver: null, // Set driver to null for manual vehicles
          totalDays: addManualVehicleTripDuration,
          isCustom: true
        }]
      }
      
      // Calculate budget immediately with updated data
      if (!tripData) {
        console.log('tripData is null, skipping budget calculation')
        return updated
      }
      
      console.log('Trip duration calculated:', addManualVehicleTripDuration, 'days')
      
      const guideFees = updated.assignedGuide ? 
        (typeof updated.assignedGuide === 'string' 
          ? availableGuides.find(g => g.id === updated.assignedGuide)?.price || 0
          : updated.assignedGuide.pricePerDay || 0
        ) * addManualVehicleTripDuration : 0
      
      const vehicleCosts = updated.assignedVehicles.reduce((total, vehicle) => {
        return total + (vehicle.dailyRate * vehicle.totalDays)
      }, 0)
      
      const hotelCosts = updated.hotelBookings.reduce((total, booking) => {
        const cost = booking.pricePerNight * booking.nights * booking.rooms
        console.log(`Hotel ${booking.name || 'Unknown'}: ${booking.pricePerNight} * ${booking.nights} * ${booking.rooms} = ${cost}`)
        return total + cost
      }, 0)
      
      const totalAmount = guideFees + vehicleCosts + hotelCosts + updated.totalBudget.activityCosts + updated.totalBudget.additionalFees
      
      console.log('Budget calculation - Calculated costs:', { guideFees, vehicleCosts, hotelCosts, totalAmount })
      
      return {
        ...updated,
        totalBudget: {
          ...updated.totalBudget,
          guideFees,
          vehicleCosts,
          hotelCosts,
          totalAmount
        }
      }
    })
    
    setShowManualVehicle(false)
    setManualVehicle({
      type: '',
      make: '',
      model: '',
      capacity: 0,
      dailyRate: 0,
      driver: '',
      features: [],
      isCustom: true
    })
  }

  const removeVehicle = (index) => {
    setApprovalForm(prev => {
      // Calculate trip duration
      const removeVehicleTripDuration = calculateTripDuration(tripData)
      
      const updated = {
        ...prev,
        assignedVehicles: prev.assignedVehicles.filter((_, i) => i !== index)
      }
      
      // Calculate budget immediately with updated data
      if (!tripData) {
        console.log('tripData is null, skipping budget calculation')
        return updated
      }
      
      console.log('Trip duration calculated:', removeVehicleTripDuration, 'days')
      
      const guideFees = updated.assignedGuide ? 
        (typeof updated.assignedGuide === 'string' 
          ? availableGuides.find(g => g.id === updated.assignedGuide)?.price || 0
          : updated.assignedGuide.pricePerDay || 0
        ) * removeVehicleTripDuration : 0
      
      const vehicleCosts = updated.assignedVehicles.reduce((total, vehicle) => {
        return total + (vehicle.dailyRate * vehicle.totalDays)
      }, 0)
      
      const hotelCosts = updated.hotelBookings.reduce((total, booking) => {
        const cost = booking.pricePerNight * booking.nights * booking.rooms
        console.log(`Hotel ${booking.name || 'Unknown'}: ${booking.pricePerNight} * ${booking.nights} * ${booking.rooms} = ${cost}`)
        return total + cost
      }, 0)
      
      const totalAmount = guideFees + vehicleCosts + hotelCosts + updated.totalBudget.activityCosts + updated.totalBudget.additionalFees
      
      console.log('Budget calculation - Calculated costs:', { guideFees, vehicleCosts, hotelCosts, totalAmount })
      
      return {
        ...updated,
        totalBudget: {
          ...updated.totalBudget,
          guideFees,
          vehicleCosts,
          hotelCosts,
          totalAmount
        }
      }
    })
  }

  const updateVehicle = (index, field, value) => {
    setApprovalForm(prev => {
      // Calculate trip duration
      const updateVehicleTripDuration = calculateTripDuration(tripData)
      
      const updated = {
        ...prev,
        assignedVehicles: prev.assignedVehicles.map((vehicle, i) => 
          i === index ? { 
            ...vehicle, 
            [field]: field === 'driver' && typeof value === 'string' ? null : value // Set driver to null if it's a string (manual entry)
          } : vehicle
        )
      }
      
      // Calculate budget immediately with updated data
      if (!tripData) {
        console.log('tripData is null, skipping budget calculation')
        return updated
      }
      
      console.log('Trip duration calculated:', updateVehicleTripDuration, 'days')
      
      const guideFees = updated.assignedGuide ? 
        (typeof updated.assignedGuide === 'string' 
          ? availableGuides.find(g => g.id === updated.assignedGuide)?.price || 0
          : updated.assignedGuide.pricePerDay || 0
        ) * updateVehicleTripDuration : 0
      
      const vehicleCosts = updated.assignedVehicles.reduce((total, vehicle) => {
        return total + (vehicle.dailyRate * vehicle.totalDays)
      }, 0)
      
      const hotelCosts = updated.hotelBookings.reduce((total, booking) => {
        const cost = booking.pricePerNight * booking.nights * booking.rooms
        console.log(`Hotel ${booking.name || 'Unknown'}: ${booking.pricePerNight} * ${booking.nights} * ${booking.rooms} = ${cost}`)
        return total + cost
      }, 0)
      
      const totalAmount = guideFees + vehicleCosts + hotelCosts + updated.totalBudget.activityCosts + updated.totalBudget.additionalFees
      
      console.log('Budget calculation - Calculated costs:', { guideFees, vehicleCosts, hotelCosts, totalAmount })
      
      return {
        ...updated,
        totalBudget: {
          ...updated.totalBudget,
          guideFees,
          vehicleCosts,
          hotelCosts,
          totalAmount
        }
      }
    })
  }

  // Hotel booking management functions
  const addHotelBooking = () => {
    setApprovalForm(prev => {
      // Calculate trip duration
      const addHotelBookingTripDuration = calculateTripDuration(tripData)
      
      const updated = {
        ...prev,
        hotelBookings: [...prev.hotelBookings, {
          hotel: '',
          roomType: '',
          checkInDate: '',
          checkOutDate: '',
          rooms: 1,
          nights: 0,
          pricePerNight: 0,
          city: '',
          specialRequests: '',
          isCustom: false
        }]
      }
      
      // Calculate budget immediately with updated data
      if (!tripData) {
        console.log('tripData is null, skipping budget calculation')
        return updated
      }
      
      console.log('Trip duration calculated:', addHotelBookingTripDuration, 'days')
      
      const guideFees = updated.assignedGuide ? 
        (typeof updated.assignedGuide === 'string' 
          ? availableGuides.find(g => g.id === updated.assignedGuide)?.price || 0
          : updated.assignedGuide.pricePerDay || 0
        ) * addHotelBookingTripDuration : 0
      
      const vehicleCosts = updated.assignedVehicles.reduce((total, vehicle) => {
        return total + (vehicle.dailyRate * vehicle.totalDays)
      }, 0)
      
      const hotelCosts = updated.hotelBookings.reduce((total, booking) => {
        const cost = booking.pricePerNight * booking.nights * booking.rooms
        return total + cost
      }, 0)
      
      const totalAmount = guideFees + vehicleCosts + hotelCosts + updated.totalBudget.activityCosts + updated.totalBudget.additionalFees
      
      console.log('Budget calculation - Calculated costs:', { guideFees, vehicleCosts, hotelCosts, totalAmount })
      
      return {
        ...updated,
        totalBudget: {
          ...updated.totalBudget,
          guideFees,
          vehicleCosts,
          hotelCosts,
          totalAmount
        }
      }
    })
  }

  const addManualHotel = () => {
    console.log('Adding manual hotel:', manualHotel)
    console.log('Current hotelBookings before add:', approvalForm.hotelBookings)
    
    const newHotel = {
      ...manualHotel,
      nights: manualHotel.checkInDate && manualHotel.checkOutDate ? 
        Math.ceil((new Date(manualHotel.checkOutDate) - new Date(manualHotel.checkInDate)) / (1000 * 60 * 60 * 24)) : 0,
      isCustom: true
    }
    
    console.log('New hotel to add:', newHotel)
    
    setApprovalForm(prev => {
      // Calculate trip duration
      const addManualHotelTripDuration = calculateTripDuration(tripData)
      
      const updated = {
        ...prev,
        hotelBookings: [...prev.hotelBookings, newHotel]
      }
      console.log('Updated hotelBookings after add:', updated.hotelBookings)
      
      // Calculate budget immediately with updated data
      if (!tripData) {
        console.log('tripData is null, skipping budget calculation')
        return updated
      }
      
      console.log('Trip duration calculated:', addManualHotelTripDuration, 'days')
      
      const guideFees = updated.assignedGuide ? 
        (typeof updated.assignedGuide === 'string' 
          ? availableGuides.find(g => g.id === updated.assignedGuide)?.price || 0
          : updated.assignedGuide.pricePerDay || 0
        ) * addManualHotelTripDuration : 0
      
      const vehicleCosts = updated.assignedVehicles.reduce((total, vehicle) => {
        return total + (vehicle.dailyRate * vehicle.totalDays)
      }, 0)
      
      const hotelCosts = updated.hotelBookings.reduce((total, booking) => {
        const cost = booking.pricePerNight * booking.nights * booking.rooms
        console.log(`Hotel ${booking.name || 'Unknown'}: ${booking.pricePerNight} * ${booking.nights} * ${booking.rooms} = ${cost}`)
        return total + cost
      }, 0)
      
      const totalAmount = guideFees + vehicleCosts + hotelCosts + updated.totalBudget.activityCosts + updated.totalBudget.additionalFees
      
      console.log('Calculated costs:', { guideFees, vehicleCosts, hotelCosts, totalAmount })
      
      return {
        ...updated,
        totalBudget: {
          ...updated.totalBudget,
          guideFees,
          vehicleCosts,
          hotelCosts,
          totalAmount
        }
      }
    })
    
    setShowManualHotel(false)
    setManualHotel({
      name: '',
      city: '',
      starRating: 0,
      pricePerNight: 0,
      amenities: [],
      roomType: '',
      checkInDate: '',
      checkOutDate: '',
      rooms: 1,
      specialRequests: '',
      isCustom: true
    })
  }

  // Guide management functions
  const addManualGuide = () => {
    setApprovalForm(prev => {
      // Calculate trip duration
      const addManualGuideTripDuration = calculateTripDuration(tripData)
      
      const updated = {
        ...prev,
        assignedGuide: {
          ...manualGuide,
          isCustom: true
        }
      }
      
      // Calculate budget immediately with updated data
      if (!tripData) {
        console.log('tripData is null, skipping budget calculation')
        return updated
      }
      
      console.log('Trip duration calculated:', addManualGuideTripDuration, 'days')
      
      const guideFees = updated.assignedGuide ? 
        (updated.assignedGuide.pricePerDay || 0) * addManualGuideTripDuration : 0
      
      const vehicleCosts = updated.assignedVehicles.reduce((total, vehicle) => {
        return total + (vehicle.dailyRate * vehicle.totalDays)
      }, 0)
      
      const hotelCosts = updated.hotelBookings.reduce((total, booking) => {
        const cost = booking.pricePerNight * booking.nights * booking.rooms
        return total + cost
      }, 0)
      
      const totalAmount = guideFees + vehicleCosts + hotelCosts + updated.totalBudget.activityCosts + updated.totalBudget.additionalFees
      
      console.log('Budget calculation - Calculated costs:', { guideFees, vehicleCosts, hotelCosts, totalAmount })
      
      return {
        ...updated,
        totalBudget: {
          ...updated.totalBudget,
          guideFees,
          vehicleCosts,
          hotelCosts,
          totalAmount
        }
      }
    })
    
    setShowManualGuide(false)
    setManualGuide({
      name: '',
      email: '',
      phone: '',
      languages: [],
      specialties: [],
      pricePerDay: 0,
      experience: '',
      isCustom: true
    })
  }

  const removeHotelBooking = (index) => {
    setApprovalForm(prev => {
      // Calculate trip duration
      const removeHotelBookingTripDuration = calculateTripDuration(tripData)
      
      const updated = {
        ...prev,
        hotelBookings: prev.hotelBookings.filter((_, i) => i !== index)
      }
      
      // Calculate budget immediately with updated data
      if (!tripData) {
        console.log('tripData is null, skipping budget calculation')
        return updated
      }
      
      console.log('Trip duration calculated:', removeHotelBookingTripDuration, 'days')
      
      const guideFees = updated.assignedGuide ? 
        (typeof updated.assignedGuide === 'string' 
          ? availableGuides.find(g => g.id === updated.assignedGuide)?.price || 0
          : updated.assignedGuide.pricePerDay || 0
        ) * removeHotelBookingTripDuration : 0
      
      const vehicleCosts = updated.assignedVehicles.reduce((total, vehicle) => {
        return total + (vehicle.dailyRate * vehicle.totalDays)
      }, 0)
      
      const hotelCosts = updated.hotelBookings.reduce((total, booking) => {
        const cost = booking.pricePerNight * booking.nights * booking.rooms
        return total + cost
      }, 0)
      
      const totalAmount = guideFees + vehicleCosts + hotelCosts + updated.totalBudget.activityCosts + updated.totalBudget.additionalFees
      
      console.log('Budget calculation - Calculated costs:', { guideFees, vehicleCosts, hotelCosts, totalAmount })
      
      return {
        ...updated,
        totalBudget: {
          ...updated.totalBudget,
          guideFees,
          vehicleCosts,
          hotelCosts,
          totalAmount
        }
      }
    })
  }

  const updateHotelBooking = (index, field, value) => {
    setApprovalForm(prev => {
      // Calculate trip duration
      const updateHotelBookingTripDuration = calculateTripDuration(tripData)
      
      const updated = {
        ...prev,
        hotelBookings: prev.hotelBookings.map((booking, i) => 
          i === index ? { ...booking, [field]: value } : booking
        )
      }
      
      // Calculate budget immediately with updated data
      if (!tripData) {
        console.log('tripData is null, skipping budget calculation')
        return updated
      }
      
      console.log('Trip duration calculated:', updateHotelBookingTripDuration, 'days')
      
      const guideFees = updated.assignedGuide ? 
        (typeof updated.assignedGuide === 'string' 
          ? availableGuides.find(g => g.id === updated.assignedGuide)?.price || 0
          : updated.assignedGuide.pricePerDay || 0
        ) * updateHotelBookingTripDuration : 0
      
      const vehicleCosts = updated.assignedVehicles.reduce((total, vehicle) => {
        return total + (vehicle.dailyRate * vehicle.totalDays)
      }, 0)
      
      const hotelCosts = updated.hotelBookings.reduce((total, booking) => {
        const cost = booking.pricePerNight * booking.nights * booking.rooms
        return total + cost
      }, 0)
      
      const totalAmount = guideFees + vehicleCosts + hotelCosts + updated.totalBudget.activityCosts + updated.totalBudget.additionalFees
      
      console.log('Budget calculation - Calculated costs:', { guideFees, vehicleCosts, hotelCosts, totalAmount })
      
      return {
        ...updated,
        totalBudget: {
          ...updated.totalBudget,
          guideFees,
          vehicleCosts,
          hotelCosts,
          totalAmount
        }
      }
    })
  }

  // Handle approval submission
  const handleApproval = async (tripId, action) => {
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      console.log('=== HANDLE APPROVAL START ===');
      console.log('Trip ID:', tripId);
      console.log('Action:', action);
      console.log('Approval Form Data:', JSON.stringify(approvalForm, null, 2));
      
      // First, update the custom trip with staff assignments
      const updatePayload = {
        assignedGuide: typeof approvalForm.assignedGuide === 'object' && approvalForm.assignedGuide?._id 
          ? approvalForm.assignedGuide._id 
          : approvalForm.assignedGuide,
        assignedVehicles: approvalForm.assignedVehicles,
        hotelBookings: approvalForm.hotelBookings,
        totalBudget: approvalForm.totalBudget,
        itinerary: approvalForm.itinerary,
        additionalNotes: approvalForm.additionalNotes,
        staffComments: approvalForm.staffComments
      };
      
      console.log('Update payload:', JSON.stringify(updatePayload, null, 2));
      
      const updateResponse = await fetch(`/api/custom-trips/${tripId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatePayload)
      })

      console.log('Update response status:', updateResponse.status);
      const updateData = await updateResponse.json();
      console.log('Update response data:', updateData);
      
      if (!updateData.success) {
        console.error('Update failed:', updateData);
        throw new Error(updateData.message || 'Failed to update custom trip')
      }

      // Then, approve/reject the custom trip
      const response = await fetch(`/api/custom-trips/${tripId}/${action === 'approved' ? 'approve' : 'reject'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          staffComments: approvalForm.staffComments
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: `Custom trip ${action} successfully!` })
        setTimeout(() => {
          navigate('/staff', { state: { activeTab: 'custom-trips' } })
        }, 2000)
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to process approval' })
      }
    } catch (error) {
      console.error('Error processing approval:', error)
      setMessage({ type: 'error', text: 'An error occurred while processing the approval' })
    } finally {
      setLoading(false)
    }
  }

  // Reset form
  const resetApprovalForm = () => {
    setApprovalForm({
      assignedGuide: '',
      assignedVehicles: [],
      hotelBookings: [],
      totalBudget: {
        guideFees: 0,
        vehicleCosts: 0,
        hotelCosts: 0,
        activityCosts: 0,
        additionalFees: 0,
        totalAmount: 0
      },
      itinerary: [],
      additionalNotes: '',
      staffComments: ''
    })
  }

  if (!selectedTrip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Trip Not Found</h2>
          <p className="text-gray-600 mb-6">The custom trip you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/staff')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Staff Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Handle case where tripData is null
  if (!tripData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Trip Not Found</h2>
          <p className="text-gray-600 mb-4">The custom trip you're looking for could not be found.</p>
          <button
            onClick={() => navigate('/staff')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Staff Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/staff', { state: { activeTab: 'custom-trips' } })}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {approvalAction === 'approved' ? 'Approve & Assign Resources' : 'Reject'} Custom Trip
                </h1>
                <p className="text-gray-600 mt-1">
                  Trip: {tripData.title} | Customer: {tripData.customer.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/staff', { state: { activeTab: 'custom-trips' } })}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApproval(selectedTrip._id || selectedTrip.id, approvalAction)}
                disabled={loading || (approvalAction === 'approved' && !approvalForm.assignedGuide)}
                className={`px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center ${
                  approvalAction === 'approved' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {approvalAction === 'approved' ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    {approvalAction === 'approved' ? 'Approve & Assign' : 'Reject'} Trip
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trip Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Customer</p>
              <p className="font-semibold">{selectedTrip.customer.name}</p>
              <p className="text-sm text-gray-500">{selectedTrip.customer.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <p className="font-semibold">{selectedTrip.duration} days</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Group Size</p>
              <p className="font-semibold">{selectedTrip.participants} people</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Budget</p>
              <p className="font-semibold">LKR {selectedTrip.budget?.toLocaleString() || 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Approval Form */}
        {approvalAction === 'approved' ? (
          <div className="space-y-8">
            {/* Guide Assignment */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserCheck className="h-5 w-5 mr-2 text-blue-600" />
                Assign Guide
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Guide *
                  </label>
                  <select
                    value={typeof approvalForm.assignedGuide === 'string' ? approvalForm.assignedGuide : 'custom'}
                    onChange={(e) => {
                      if (e.target.value === 'manual') {
                        setShowManualGuide(true)
                      } else if (e.target.value === 'custom') {
                        // Do nothing, custom guide is already selected
                      } else if (e.target.value === '') {
                        // Clear guide selection
                        setApprovalForm(prev => {
                          // Calculate trip duration
                          const clearGuideTripDuration = calculateTripDuration(tripData)
                          
                          const updated = {
                            ...prev,
                            assignedGuide: ''
                          }
                          
                          // Calculate budget immediately with updated data
                          if (!tripData) {
                            console.log('tripData is null, skipping budget calculation')
                            return updated
                          }
                          
                          console.log('Trip duration calculated:', clearGuideTripDuration, 'days')
                          
                          const guideFees = 0 // No guide selected
                          
                          const vehicleCosts = updated.assignedVehicles.reduce((total, vehicle) => {
                            return total + (vehicle.dailyRate * vehicle.totalDays)
                          }, 0)
                          
                          const hotelCosts = updated.hotelBookings.reduce((total, booking) => {
                            const cost = booking.pricePerNight * booking.nights * booking.rooms
                            console.log(`Hotel ${booking.name || 'Unknown'}: ${booking.pricePerNight} * ${booking.nights} * ${booking.rooms} = ${cost}`)
                            return total + cost
                          }, 0)
                          
                          const totalAmount = guideFees + vehicleCosts + hotelCosts + updated.totalBudget.activityCosts + updated.totalBudget.additionalFees
                          
                          return {
                            ...updated,
                            totalBudget: {
                              ...updated.totalBudget,
                              guideFees,
                              vehicleCosts,
                              hotelCosts,
                              totalAmount
                            }
                          }
                        })
                      } else {
                        setApprovalForm(prev => {
                          // Calculate trip duration
                          const selectGuideTripDuration = calculateTripDuration(tripData)
                          
                          const updated = {
                            ...prev,
                            assignedGuide: e.target.value
                          }
                          
                          // Calculate budget immediately with updated data
                          if (!tripData) {
                            console.log('tripData is null, skipping budget calculation')
                            return updated
                          }
                          
                          console.log('Trip duration calculated:', selectGuideTripDuration, 'days')
                          
                          const guideFees = updated.assignedGuide ? 
                            (typeof updated.assignedGuide === 'string' 
                              ? availableGuides.find(g => g.id === updated.assignedGuide)?.price || 0
                              : updated.assignedGuide.pricePerDay || 0
                            ) * selectGuideTripDuration : 0
                          
                          const vehicleCosts = updated.assignedVehicles.reduce((total, vehicle) => {
                            return total + (vehicle.dailyRate * vehicle.totalDays)
                          }, 0)
                          
                          const hotelCosts = updated.hotelBookings.reduce((total, booking) => {
                            const cost = booking.pricePerNight * booking.nights * booking.rooms
                            console.log(`Hotel ${booking.name || 'Unknown'}: ${booking.pricePerNight} * ${booking.nights} * ${booking.rooms} = ${cost}`)
                            return total + cost
                          }, 0)
                          
                          const totalAmount = guideFees + vehicleCosts + hotelCosts + updated.totalBudget.activityCosts + updated.totalBudget.additionalFees
                          
                          return {
                            ...updated,
                            totalBudget: {
                              ...updated.totalBudget,
                              guideFees,
                              vehicleCosts,
                              hotelCosts,
                              totalAmount
                            }
                          }
                        })
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option key="guide-empty" value="">Choose a guide...</option>
                    {availableGuides.map(guide => (
                      <option key={guide.id} value={guide.id}>
                        {guide.name} - LKR {guide.price || 0}/day ({guide.specialties?.join(', ') || 'General'})
                      </option>
                    ))}
                    {typeof approvalForm.assignedGuide === 'object' && approvalForm.assignedGuide.isCustom && (
                      <option key="custom-guide" value="custom">
                        {approvalForm.assignedGuide.name} - LKR {approvalForm.assignedGuide.pricePerDay}/day (Custom)
                      </option>
                    )}
                    <option key="manual-guide" value="manual">+ Add Custom Guide</option>
                  </select>
                </div>
                {approvalForm.assignedGuide && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Guide Fee:</strong> LKR {
                        typeof approvalForm.assignedGuide === 'string' 
                          ? availableGuides.find(g => g.id === approvalForm.assignedGuide)?.price || 0
                          : approvalForm.assignedGuide.pricePerDay || 0
                      } per day
                    </p>
                  </div>
                )}
              </div>

              {/* Manual Guide Form */}
              {showManualGuide && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Add Custom Guide</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={manualGuide.name}
                        onChange={(e) => setManualGuide(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Guide name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={manualGuide.email}
                        onChange={(e) => setManualGuide(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="guide@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={manualGuide.phone}
                        onChange={(e) => setManualGuide(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+94771234567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Price per Day (LKR) *</label>
                      <input
                        type="number"
                        value={manualGuide.pricePerDay}
                        onChange={(e) => setManualGuide(prev => ({ ...prev, pricePerDay: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="5000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Languages</label>
                      <input
                        type="text"
                        value={manualGuide.languages.join(', ')}
                        onChange={(e) => setManualGuide(prev => ({ ...prev, languages: e.target.value.split(',').map(l => l.trim()) }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="English, Sinhala, Tamil"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Specialties</label>
                      <input
                        type="text"
                        value={manualGuide.specialties.join(', ')}
                        onChange={(e) => setManualGuide(prev => ({ ...prev, specialties: e.target.value.split(',').map(s => s.trim()) }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Cultural, Historical, Nature"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Experience</label>
                      <textarea
                        value={manualGuide.experience}
                        onChange={(e) => setManualGuide(prev => ({ ...prev, experience: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Brief description of guide's experience..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-4">
                    <button
                      onClick={() => setShowManualGuide(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addManualGuide}
                      disabled={!manualGuide.name || !manualGuide.pricePerDay}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Add Guide
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Assignment */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Car className="h-5 w-5 mr-2 text-green-600" />
                  Assign Vehicles
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={addVehicle}
                    className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Existing Vehicle
                  </button>
                  <button
                    onClick={() => {
                      console.log('Show manual vehicle form')
                      setShowManualVehicle(true)
                    }}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Custom Vehicle
                  </button>
                </div>
              </div>
              
              {approvalForm.assignedVehicles.map((vehicle, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">
                      Vehicle {index + 1} {vehicle.isCustom && <span className="text-blue-600">(Custom)</span>}
                    </h4>
                    <button
                      onClick={() => removeVehicle(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {vehicle.isCustom ? (
                    // Custom vehicle display
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Vehicle Type
                        </label>
                        <input
                          type="text"
                          value={vehicle.vehicleType}
                          onChange={(e) => updateVehicle(index, 'vehicleType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Car, Van, Bus"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Make & Model
                        </label>
                        <input
                          type="text"
                          value={`${vehicle.make} ${vehicle.model}`}
                          onChange={(e) => {
                            const parts = e.target.value.split(' ')
                            updateVehicle(index, 'make', parts[0] || '')
                            updateVehicle(index, 'model', parts.slice(1).join(' ') || '')
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Toyota Corolla"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Capacity
                        </label>
                        <input
                          type="number"
                          value={vehicle.capacity}
                          onChange={(e) => updateVehicle(index, 'capacity', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="4"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Daily Rate (LKR)
                        </label>
                        <input
                          type="number"
                          value={vehicle.dailyRate}
                          onChange={(e) => {
                            updateVehicle(index, 'dailyRate', parseInt(e.target.value) || 0)
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Driver Name
                        </label>
                        <input
                          type="text"
                          value={vehicle.driver}
                          onChange={(e) => updateVehicle(index, 'driver', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Driver name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Total Days
                        </label>
                        <input
                          type="number"
                          value={vehicle.totalDays}
                          onChange={(e) => {
                            updateVehicle(index, 'totalDays', parseInt(e.target.value) || 0)
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>
                  ) : (
                    // Existing vehicle selection
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Select Vehicle
                        </label>
                        <select
                          value={vehicle.vehicleId}
                          onChange={(e) => {
                            const selectedVehicle = availableVehicles.find(v => v._id === e.target.value)
                            if (selectedVehicle) {
                              // Update all vehicle fields in a single call to avoid race conditions
                              setApprovalForm(prev => {
                                const updated = {
                                  ...prev,
                                  assignedVehicles: prev.assignedVehicles.map((vehicle, i) => 
                                    i === index ? { 
                                      ...vehicle, 
                                      vehicleId: selectedVehicle._id,
                                      vehicleType: selectedVehicle.vehicleType,
                                      dailyRate: selectedVehicle.pricing?.dailyRate || 0,
                                      driver: selectedVehicle.driver?._id || null // Send ObjectId instead of name
                                    } : vehicle
                                  )
                                }
                                
                                // Calculate budget immediately with updated data
                                if (!tripData) {
                                  console.log('tripData is null, skipping budget calculation')
                                  return updated
                                }
                                
                                // Try different possible date field names
                                const addVehicleBudgetTripDuration = calculateTripDuration(tripData)
                                
                                console.log('Trip duration calculated:', addVehicleBudgetTripDuration, 'days')
                                
                                const guideFees = updated.assignedGuide ? 
                                  (availableGuides.find(g => g.id === updated.assignedGuide)?.price || 0) * addVehicleBudgetTripDuration : 0
                                
                                const vehicleCosts = updated.assignedVehicles.reduce((total, vehicle) => {
                                  const cost = vehicle.dailyRate * vehicle.totalDays
                                  console.log(`Vehicle ${vehicle.make || 'Unknown'} ${vehicle.model || ''}: ${vehicle.dailyRate} * ${vehicle.totalDays} = ${cost}`)
                                  return total + cost
                                }, 0)
                                
                                const hotelCosts = updated.hotelBookings.reduce((total, booking) => {
                                  const cost = booking.pricePerNight * booking.nights * booking.rooms
                                  console.log(`Hotel ${booking.name || 'Unknown'}: ${booking.pricePerNight} * ${booking.nights} * ${booking.rooms} = ${cost}`)
                                  return total + cost
                                }, 0)
                                
                                const totalAmount = guideFees + vehicleCosts + hotelCosts + updated.totalBudget.activityCosts + updated.totalBudget.additionalFees
                                
                                console.log('Budget calculation - Calculated costs:', { guideFees, vehicleCosts, hotelCosts, totalAmount })
                                
                                return {
                                  ...updated,
                                  totalBudget: {
                                    ...updated.totalBudget,
                                    guideFees,
                                    vehicleCosts,
                                    hotelCosts,
                                    totalAmount
                                  }
                                }
                              })
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option key="vehicle-empty" value="">Select vehicle...</option>
                          {availableVehicles.map(v => (
                            <option key={v._id} value={v._id}>
                              {v.make} {v.model} ({v.vehicleType}) - LKR {v.pricing?.dailyRate || 0}/day
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Daily Rate (LKR)
                        </label>
                        <input
                          type="number"
                          value={vehicle.dailyRate}
                          onChange={(e) => {
                            updateVehicle(index, 'dailyRate', parseInt(e.target.value) || 0)
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Total Days
                        </label>
                        <input
                          type="number"
                          value={vehicle.totalDays}
                          onChange={(e) => {
                            updateVehicle(index, 'totalDays', parseInt(e.target.value) || 0)
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>
                  )}
                  
                  {vehicle.driver && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>Driver:</strong> {typeof vehicle.driver === 'object' ? `${vehicle.driver.firstName} ${vehicle.driver.lastName}` : vehicle.driver}
                    </div>
                  )}
                </div>
              ))}

              {/* Manual Vehicle Form */}
              {showManualVehicle && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Add Custom Vehicle</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Vehicle Type *</label>
                      <select
                        value={manualVehicle.type}
                        onChange={(e) => setManualVehicle(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option key="type-empty" value="">Select type...</option>
                        <option key="car" value="car">Car</option>
                        <option key="van" value="van">Van</option>
                        <option key="bus" value="bus">Bus</option>
                        <option key="tuk-tuk" value="tuk-tuk">Tuk-tuk</option>
                        <option key="motorcycle" value="motorcycle">Motorcycle</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Make *</label>
                      <input
                        type="text"
                        value={manualVehicle.make}
                        onChange={(e) => setManualVehicle(prev => ({ ...prev, make: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Toyota"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Model *</label>
                      <input
                        type="text"
                        value={manualVehicle.model}
                        onChange={(e) => setManualVehicle(prev => ({ ...prev, model: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Corolla"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Capacity *</label>
                      <input
                        type="number"
                        value={manualVehicle.capacity}
                        onChange={(e) => setManualVehicle(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="4"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Daily Rate (LKR) *</label>
                      <input
                        type="number"
                        value={manualVehicle.dailyRate}
                        onChange={(e) => setManualVehicle(prev => ({ ...prev, dailyRate: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="8000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Driver Name</label>
                      <input
                        type="text"
                        value={manualVehicle.driver}
                        onChange={(e) => setManualVehicle(prev => ({ ...prev, driver: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Driver name"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Features</label>
                      <input
                        type="text"
                        value={manualVehicle.features.join(', ')}
                        onChange={(e) => setManualVehicle(prev => ({ ...prev, features: e.target.value.split(',').map(f => f.trim()) }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="AC, GPS, WiFi"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-4">
                    <button
                      onClick={() => setShowManualVehicle(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addManualVehicle}
                      disabled={!manualVehicle.type || !manualVehicle.make || !manualVehicle.model || manualVehicle.capacity <= 0 || manualVehicle.dailyRate <= 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Add Vehicle
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Hotel Bookings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Building className="h-5 w-5 mr-2 text-purple-600" />
                  Hotel Bookings
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={addHotelBooking}
                    className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Existing Hotel
                  </button>
                  <button
                    onClick={() => {
                      console.log('Show manual hotel form')
                      setShowManualHotel(true)
                    }}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Custom Hotel
                  </button>
                </div>
              </div>

              {/* Hotel City Filter */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Filter Hotels by City
                </label>
                <select
                  value={hotelCityFilter}
                  onChange={(e) => setHotelCityFilter(e.target.value)}
                  className="w-full md:w-64 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option key="city-all" value="">All Cities</option>
                  {Array.from(new Set(availableHotels.map(hotel => hotel.location?.city).filter(Boolean))).map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              
              {approvalForm.hotelBookings.map((booking, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">
                      Hotel {index + 1} {booking.isCustom && <span className="text-blue-600">(Custom)</span>}
                    </h4>
                    <button
                      onClick={() => removeHotelBooking(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {booking.isCustom ? (
                    // Custom hotel display
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Hotel Name *
                        </label>
                        <input
                          type="text"
                          value={booking.name}
                          onChange={(e) => updateHotelBooking(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Hotel name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          value={booking.city}
                          onChange={(e) => updateHotelBooking(index, 'city', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Colombo, Kandy, Galle"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Star Rating
                        </label>
                        <select
                          value={booking.starRating}
                          onChange={(e) => updateHotelBooking(index, 'starRating', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option key="rating-0" value={0}>Select rating...</option>
                          <option key="rating-1" value={1}>1 Star</option>
                          <option key="rating-2" value={2}>2 Stars</option>
                          <option key="rating-3" value={3}>3 Stars</option>
                          <option key="rating-4" value={4}>4 Stars</option>
                          <option key="rating-5" value={5}>5 Stars</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Price per Night (LKR) *
                        </label>
                        <input
                          type="number"
                          value={booking.pricePerNight}
                          onChange={(e) => {
                            updateHotelBooking(index, 'pricePerNight', parseInt(e.target.value) || 0)
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="15000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Room Type *
                        </label>
                        <select
                          value={booking.roomType}
                          onChange={(e) => updateHotelBooking(index, 'roomType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option key="room-empty" value="">Select room type...</option>
                          <option key="single" value="single">Single Room</option>
                          <option key="double" value="double">Double Room</option>
                          <option key="twin" value="twin">Twin Room</option>
                          <option key="family" value="family">Family Room</option>
                          <option key="suite" value="suite">Suite</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Amenities
                        </label>
                        <input
                          type="text"
                          value={booking.amenities?.join(', ') || ''}
                          onChange={(e) => updateHotelBooking(index, 'amenities', e.target.value.split(',').map(a => a.trim()))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="WiFi, Pool, Restaurant, AC"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Check-in Date *
                        </label>
                        <input
                          type="date"
                          value={booking.checkInDate}
                          onChange={(e) => updateHotelBooking(index, 'checkInDate', e.target.value)}
                          min={getTodayDate()}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Check-out Date *
                        </label>
                        <input
                          type="date"
                          value={booking.checkOutDate}
                          onChange={(e) => {
                            updateHotelBooking(index, 'checkOutDate', e.target.value)
                            if (booking.checkInDate && e.target.value) {
                              const nights = Math.ceil((new Date(e.target.value) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24))
                              updateHotelBooking(index, 'nights', nights)
                            }
                          }}
                          min={booking.checkInDate || getTodayDate()}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Number of Rooms *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={booking.rooms}
                          onChange={(e) => {
                            updateHotelBooking(index, 'rooms', parseInt(e.target.value) || 1)
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Special Requests
                        </label>
                        <textarea
                          value={booking.specialRequests}
                          onChange={(e) => updateHotelBooking(index, 'specialRequests', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Any special requests for this hotel..."
                        />
                      </div>
                    </div>
                  ) : (
                    // Existing hotel selection
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Select Hotel
                        </label>
                        <select
                          value={booking.hotel}
                          onChange={(e) => {
                            updateHotelBooking(index, 'hotel', e.target.value)
                            const selectedHotel = availableHotels.find(h => h._id === e.target.value)
                            if (selectedHotel) {
                              updateHotelBooking(index, 'pricePerNight', selectedHotel.roomTypes?.[0]?.basePrice || selectedHotel.averageRoomPrice || 0)
                              updateHotelBooking(index, 'city', selectedHotel.location?.city || '')
                              updateHotelBooking(index, 'name', selectedHotel.name)
                              updateHotelBooking(index, 'starRating', selectedHotel.starRating)
                              updateHotelBooking(index, 'amenities', selectedHotel.amenities || [])
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option key="hotel-empty" value="">Select hotel...</option>
                          {console.log('Available hotels for dropdown:', availableHotels)}
                          {availableHotels
                            .filter(hotel => !hotelCityFilter || hotel.location?.city === hotelCityFilter)
                            .map(hotel => (
                            <option key={hotel._id} value={hotel._id}>
                              {hotel.name} - {hotel.location?.city} ({hotel.starRating}★) - LKR {hotel.roomTypes?.[0]?.basePrice || hotel.averageRoomPrice || 0}/night
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Room Type
                        </label>
                        <select
                          value={booking.roomType}
                          onChange={(e) => {
                            updateHotelBooking(index, 'roomType', e.target.value)
                            // Update price based on selected room type
                            if (booking.hotel) {
                              const selectedHotel = availableHotels.find(h => h._id === booking.hotel)
                              const selectedRoomType = selectedHotel?.roomTypes?.find(rt => rt.name === e.target.value)
                              if (selectedRoomType) {
                                updateHotelBooking(index, 'pricePerNight', selectedRoomType.basePrice)
                              }
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option key="room-empty" value="">Select room type...</option>
                          {(() => {
                            const selectedHotel = availableHotels.find(h => h._id === booking.hotel)
                            console.log('Selected hotel for room types:', booking.hotel, selectedHotel)
                            console.log('Selected hotel room types:', selectedHotel?.roomTypes)
                            
                            if (selectedHotel?.roomTypes && selectedHotel.roomTypes.length > 0) {
                              return selectedHotel.roomTypes.map((roomType, roomIndex) => (
                                <option key={`${roomIndex}-${roomType.name}`} value={roomType.name}>
                                  {roomType.name} - LKR {roomType.basePrice}/night
                                </option>
                              ))
                            } else {
                              return (
                                <>
                                  <option key="single" value="single">Single Room</option>
                                  <option key="double" value="double">Double Room</option>
                                  <option key="twin" value="twin">Twin Room</option>
                                  <option key="family" value="family">Family Room</option>
                                  <option key="suite" value="suite">Suite</option>
                                </>
                              )
                            }
                          })()}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Check-in Date
                        </label>
                        <input
                          type="date"
                          value={booking.checkInDate}
                          onChange={(e) => updateHotelBooking(index, 'checkInDate', e.target.value)}
                          min={getTodayDate()}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Check-out Date
                        </label>
                        <input
                          type="date"
                          value={booking.checkOutDate}
                          onChange={(e) => {
                            updateHotelBooking(index, 'checkOutDate', e.target.value)
                            if (booking.checkInDate && e.target.value) {
                              const nights = Math.ceil((new Date(e.target.value) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24))
                              updateHotelBooking(index, 'nights', nights)
                            }
                          }}
                          min={booking.checkInDate || getTodayDate()}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Number of Rooms
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={booking.rooms}
                          onChange={(e) => {
                            updateHotelBooking(index, 'rooms', parseInt(e.target.value) || 1)
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Price per Night (LKR)
                        </label>
                        <input
                          type="number"
                          value={booking.pricePerNight}
                          onChange={(e) => {
                            updateHotelBooking(index, 'pricePerNight', parseInt(e.target.value) || 0)
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Special Requests
                        </label>
                        <textarea
                          value={booking.specialRequests}
                          onChange={(e) => updateHotelBooking(index, 'specialRequests', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Any special requests for this hotel..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Manual Hotel Form */}
              {showManualHotel && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Add Custom Hotel</h4>
                  {console.log('Manual hotel form is showing, showManualHotel:', showManualHotel)}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Hotel Name *</label>
                      <input
                        type="text"
                        value={manualHotel.name}
                        onChange={(e) => setManualHotel(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Hotel name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        value={manualHotel.city}
                        onChange={(e) => setManualHotel(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Colombo, Kandy, Galle"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Star Rating</label>
                      <select
                        value={manualHotel.starRating}
                        onChange={(e) => setManualHotel(prev => ({ ...prev, starRating: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option key="rating-0-manual" value={0}>Select rating...</option>
                        <option key="rating-1-manual" value={1}>1 Star</option>
                        <option key="rating-2-manual" value={2}>2 Stars</option>
                        <option key="rating-3-manual" value={3}>3 Stars</option>
                        <option key="rating-4-manual" value={4}>4 Stars</option>
                        <option key="rating-5-manual" value={5}>5 Stars</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Price per Night (LKR) *</label>
                      <input
                        type="number"
                        value={manualHotel.pricePerNight}
                        onChange={(e) => setManualHotel(prev => ({ ...prev, pricePerNight: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="15000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Room Type *</label>
                      <select
                        value={manualHotel.roomType}
                        onChange={(e) => setManualHotel(prev => ({ ...prev, roomType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option key="room-empty-manual" value="">Select room type...</option>
                        <option key="single-manual" value="single">Single Room</option>
                        <option key="double-manual" value="double">Double Room</option>
                        <option key="twin-manual" value="twin">Twin Room</option>
                        <option key="family-manual" value="family">Family Room</option>
                        <option key="suite-manual" value="suite">Suite</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Amenities</label>
                      <input
                        type="text"
                        value={manualHotel.amenities.join(', ')}
                        onChange={(e) => setManualHotel(prev => ({ ...prev, amenities: e.target.value.split(',').map(a => a.trim()) }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="WiFi, Pool, Restaurant, AC, Gym"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Check-in Date *</label>
                      <input
                        type="date"
                        value={manualHotel.checkInDate}
                        onChange={(e) => setManualHotel(prev => ({ ...prev, checkInDate: e.target.value }))}
                        min={getTodayDate()}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Check-out Date *</label>
                      <input
                        type="date"
                        value={manualHotel.checkOutDate}
                        onChange={(e) => setManualHotel(prev => ({ ...prev, checkOutDate: e.target.value }))}
                        min={manualHotel.checkInDate || getTodayDate()}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Rooms *</label>
                      <input
                        type="number"
                        min="1"
                        value={manualHotel.rooms}
                        onChange={(e) => setManualHotel(prev => ({ ...prev, rooms: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Special Requests</label>
                      <textarea
                        value={manualHotel.specialRequests}
                        onChange={(e) => setManualHotel(prev => ({ ...prev, specialRequests: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Any special requests for this hotel..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-4">
                    <button
                      onClick={() => setShowManualHotel(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        console.log('Add Hotel button clicked')
                        console.log('manualHotel state:', manualHotel)
                        console.log('Button disabled check:', {
                          name: !manualHotel.name,
                          city: !manualHotel.city,
                          pricePerNight: manualHotel.pricePerNight <= 0,
                          roomType: !manualHotel.roomType,
                          checkInDate: !manualHotel.checkInDate,
                          checkOutDate: !manualHotel.checkOutDate,
                          rooms: manualHotel.rooms <= 0
                        })
                        addManualHotel()
                      }}
                      disabled={!manualHotel.name || !manualHotel.city || manualHotel.pricePerNight <= 0 || !manualHotel.roomType || !manualHotel.checkInDate || !manualHotel.checkOutDate || manualHotel.rooms <= 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Add Hotel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Budget Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Budget Summary
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Guide Fees:</span>
                    <span className="font-semibold">LKR {approvalForm.totalBudget.guideFees.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehicle Costs:</span>
                    <span className="font-semibold">LKR {approvalForm.totalBudget.vehicleCosts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hotel Costs:</span>
                    <span className="font-semibold">LKR {approvalForm.totalBudget.hotelCosts.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Activity Costs:</span>
                    <input
                      type="number"
                      value={approvalForm.totalBudget.activityCosts}
                      onChange={(e) => {
                        setApprovalForm(prev => ({
                          ...prev,
                          totalBudget: {
                            ...prev.totalBudget,
                            activityCosts: parseInt(e.target.value) || 0
                          }
                        }))
                      }}
                      className="w-32 px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Additional Fees:</span>
                    <input
                      type="number"
                      value={approvalForm.totalBudget.additionalFees}
                      onChange={(e) => {
                        setApprovalForm(prev => ({
                          ...prev,
                          totalBudget: {
                            ...prev.totalBudget,
                            additionalFees: parseInt(e.target.value) || 0
                          }
                        }))
                      }}
                      className="w-32 px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total Amount:</span>
                  <span>LKR {approvalForm.totalBudget.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-gray-600" />
                Additional Notes & Comments
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Staff Comments
                  </label>
                  <textarea
                    value={approvalForm.staffComments}
                    onChange={(e) => setApprovalForm(prev => ({ ...prev, staffComments: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any comments or notes about this approval..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Additional Notes for Customer
                  </label>
                  <textarea
                    value={approvalForm.additionalNotes}
                    onChange={(e) => setApprovalForm(prev => ({ ...prev, additionalNotes: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any additional information for the customer..."
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
              Rejection Reason
            </h3>
            <textarea
              value={approvalForm.staffComments}
              onChange={(e) => setApprovalForm(prev => ({ ...prev, staffComments: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Please provide a reason for rejecting this custom trip request..."
              required
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomTripApprovalForm
