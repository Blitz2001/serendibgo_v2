import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Star, Clock, Users, Search, Filter, Calendar, Phone, Mail, Award, Globe, Heart, ChevronDown, X, Shield, CheckCircle, Zap, Crown, Sparkles, Eye, BookOpen, ArrowLeft, User } from 'lucide-react'
import { guideService } from '../services/guideService'
import { useAuth } from '../context/AuthContext'

const Guides = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [selectedGuide, setSelectedGuide] = useState(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [bookingData, setBookingData] = useState({
    date: '',
    duration: '',
    groupSize: 1,
    specialRequests: ''
  })
  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })
  const [showBookingCalendar, setShowBookingCalendar] = useState(false)
  const [selectedBookingDate, setSelectedBookingDate] = useState(new Date())

  // Fetch guides from API
  useEffect(() => {
    fetchGuides()
    
    // Listen for guide profile updates
    const handleGuideUpdate = (event) => {
      console.log('Guide profile updated, refreshing guides list:', event.detail)
      fetchGuides()
    }
    
    window.addEventListener('guideProfileUpdated', handleGuideUpdate)
    
    return () => {
      window.removeEventListener('guideProfileUpdated', handleGuideUpdate)
    }
  }, [])

  const fetchGuides = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {
        search: searchTerm,
        location: selectedLocation,
        specialty: selectedSpecialty,
        limit: 50 // Get more guides
      }
      const response = await guideService.getGuides(params)
      setGuides(response.data || [])
    } catch (err) {
      console.error('Error fetching guides:', err)
      setError('Failed to load guides. Please try again.')
      // Fallback to empty array
      setGuides([])
    } finally {
      setLoading(false)
    }
  }

  // Refetch guides when filters change
  useEffect(() => {
    if (!loading) {
      fetchGuides()
    }
  }, [searchTerm, selectedLocation, selectedSpecialty])

  // Close booking calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showBookingCalendar && !event.target.closest('.booking-calendar-container')) {
        setShowBookingCalendar(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showBookingCalendar])

  const locations = ['All Locations', 'Colombo', 'Kandy', 'Galle', 'Anuradhapura', 'Trincomalee']
  const specialties = ['All Specialties', 'Cultural Tours', 'Historical Sites', 'Nature Tours', 'Wildlife', 'Food Tours', 'Religious Tours', 'Luxury Tours', 'Family Tours']

  const handleBookGuide = (guide) => {
    setSelectedGuide(guide)
    setShowBookingModal(true)
  }

  const handleViewDetails = (guide) => {
    navigate(`/guides/${guide.id}`)
  }

  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedGuide) {
      alert('Please select a guide first')
      return
    }

    try {
      // Calculate start and end dates based on duration
      const startDate = new Date(bookingData.date)
      let endDate = new Date(startDate)
      
      switch (bookingData.duration) {
        case 'half-day':
          endDate.setHours(startDate.getHours() + 4) // 4 hours
          break
        case 'full-day':
          endDate.setDate(startDate.getDate() + 1) // Next day
          break
        case 'multi-day':
          endDate.setDate(startDate.getDate() + 3) // 3 days
          break
        default:
          endDate.setDate(startDate.getDate() + 1)
      }

      const bookingDataToSubmit = {
        guideId: selectedGuide.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        duration: bookingData.duration,
        groupSize: parseInt(bookingData.groupSize),
        specialRequests: bookingData.specialRequests || '',
        guestInfo: {
          firstName: guestInfo.firstName,
          lastName: guestInfo.lastName,
          email: guestInfo.email,
          phone: guestInfo.phone
        }
      }

      console.log('Submitting guide booking:', bookingDataToSubmit)
      
      // Use authenticated endpoint if user is logged in, otherwise use guest endpoint
      let response
      if (isAuthenticated && user) {
        console.log('User is authenticated, using authenticated booking endpoint')
        // For authenticated users, we don't need guestInfo in the request body
        const authenticatedBookingData = {
          guideId: bookingDataToSubmit.guideId,
          startDate: bookingDataToSubmit.startDate,
          endDate: bookingDataToSubmit.endDate,
          duration: bookingDataToSubmit.duration,
          groupSize: bookingDataToSubmit.groupSize,
          specialRequests: bookingDataToSubmit.specialRequests
        }
        response = await guideService.createGuideBooking(authenticatedBookingData)
      } else {
        console.log('User is not authenticated, using guest booking endpoint')
        response = await guideService.createGuestGuideBooking(bookingDataToSubmit)
      }
      
      if (response.success) {
        // Calculate total amount (base price per person per day)
        const basePricePerPersonPerDay = 50; // $50 per person per day
        const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
        const totalAmount = basePricePerPersonPerDay * parseInt(bookingData.groupSize) * daysDiff;
        
        // Navigate to payment page
        navigate('/payment', {
          state: {
            bookingId: response.data._id,
            bookingType: 'guide',
            amount: totalAmount,
            currency: 'USD',
            guideName: selectedGuide.firstName + ' ' + selectedGuide.lastName,
            guideEmail: selectedGuide.email,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            groupSize: bookingData.groupSize,
            duration: bookingData.duration,
            bookingReference: response.data.bookingReference
          }
        });
        
        setShowBookingModal(false)
        setBookingData({
          date: '',
          duration: '',
          groupSize: 1,
          specialRequests: ''
        })
        setGuestInfo({
          firstName: '',
          lastName: '',
          email: '',
          phone: ''
        })
      } else {
        alert('Failed to submit booking: ' + (response.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error submitting guide booking:', error)
      alert('Failed to submit booking request. Please try again.')
    }
  }

  // Booking calendar helper functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const isDateInPast = (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const isDateBlocked = (date) => {
    if (!selectedGuide?.blockedDates) return false
    return selectedGuide.blockedDates.some(blockout => 
      new Date(blockout.date).toDateString() === date.toDateString()
    )
  }

  const isWorkingDay = (date) => {
    if (!selectedGuide?.workingDays) return true
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[date.getDay()]
    return selectedGuide.workingDays.includes(dayName)
  }

  const isDateAvailable = (date) => {
    return !isDateInPast(date) && !isDateBlocked(date) && isWorkingDay(date)
  }

  const handleBookingDateSelect = (day) => {
    const dateToSelect = new Date(selectedBookingDate.getFullYear(), selectedBookingDate.getMonth(), day)
    
    if (!isDateAvailable(dateToSelect)) {
      if (isDateInPast(dateToSelect)) {
        alert('Cannot select past dates')
      } else if (isDateBlocked(dateToSelect)) {
        alert('This date is not available (blocked by guide)')
      } else if (!isWorkingDay(dateToSelect)) {
        alert('Guide is not available on this day')
      }
      return
    }

    setBookingData(prev => ({
      ...prev,
      date: dateToSelect.toISOString().split('T')[0]
    }))
    setShowBookingCalendar(false)
  }

  const navigateBookingMonth = (direction) => {
    setSelectedBookingDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const renderBookingCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedBookingDate)
    const firstDay = getFirstDayOfMonth(selectedBookingDate)
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(selectedBookingDate.getFullYear(), selectedBookingDate.getMonth(), day)
      const isPast = isDateInPast(currentDate)
      const isBlocked = isDateBlocked(currentDate)
      const isWorking = isWorkingDay(currentDate)
      const isSelected = bookingData.date === currentDate.toISOString().split('T')[0]
      const isAvailable = isDateAvailable(currentDate)

      let buttonClass = 'h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200 '
      
      if (isSelected) {
        buttonClass += 'bg-blue-500 text-white'
      } else if (isPast) {
        buttonClass += 'text-gray-300 cursor-not-allowed'
      } else if (isBlocked) {
        buttonClass += 'bg-red-100 text-red-500 cursor-not-allowed'
      } else if (!isWorking) {
        buttonClass += 'bg-yellow-100 text-yellow-600 cursor-not-allowed'
      } else if (isAvailable) {
        buttonClass += 'text-gray-700 hover:bg-green-100 hover:text-green-600'
      }

      days.push(
        <button
          key={day}
          onClick={() => handleBookingDateSelect(day)}
          className={buttonClass}
        >
          {day}
        </button>
      )
    }
    
    return days
  }

  const formatBookingDate = (dateString) => {
    if (!dateString) return 'Select a date'
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50">
      {/* Hero Section */}
      <div 
        className="relative overflow-hidden"
        style={{
          backgroundImage: 'url(/bg2.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <Crown className="h-5 w-5 text-yellow-400 mr-2" />
              <span className="text-white/90 font-medium">Premium Certified Guides</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Professional
              <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Tour Guides
                  </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-4xl mx-auto leading-relaxed">
              Discover Sri Lanka with our <span className="font-semibold text-blue-300">certified</span>, 
              <span className="font-semibold text-cyan-300"> experienced</span>, and 
              <span className="font-semibold text-blue-200"> passionate</span> local guides. 
              Each guide brings unique expertise and local knowledge to make your journey unforgettable.
            </p>
            
            {/* Search and Filter Section */}
            <div className="max-w-5xl mx-auto">
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Search */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 group-hover:text-blue-500 transition-colors" />
                      <input
                        type="text"
                        placeholder="Search guides or specialties..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-slate-700 placeholder-slate-400 font-medium transition-all duration-200 hover:bg-white hover:shadow-lg"
                      />
                    </div>
                  </div>
                  
                  {/* Location Filter */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 group-hover:text-blue-500 transition-colors" />
                      <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white/80 backdrop-blur-sm text-slate-700 font-medium transition-all duration-200 hover:bg-white hover:shadow-lg"
                      >
                        {locations.map(location => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 pointer-events-none" />
                    </div>
                  </div>
                  
                  {/* Specialty Filter */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 group-hover:text-blue-500 transition-colors" />
                      <select
                        value={selectedSpecialty}
                        onChange={(e) => setSelectedSpecialty(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white/80 backdrop-blur-sm text-slate-700 font-medium transition-all duration-200 hover:bg-white hover:shadow-lg"
                      >
                        {specialties.map(specialty => (
                          <option key={specialty} value={specialty}>{specialty}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guides Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 mb-4">
            <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-slate-700 font-semibold">
              Showing {guides.length} certified guides
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-3xl shadow-xl p-8 animate-pulse">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-slate-200 rounded-2xl mr-4"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-slate-200 rounded mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="h-4 bg-slate-200 rounded"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                </div>
                <div className="h-12 bg-slate-200 rounded-2xl"></div>
              </div>
            ))
          ) : error ? (
            // Error state
            <div className="col-span-full text-center py-16">
              <div className="bg-red-50 border border-red-200 rounded-3xl p-8 max-w-md mx-auto">
                <div className="text-red-600 text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Guides</h3>
                <p className="text-red-600 mb-6">{error}</p>
                <button
                  onClick={fetchGuides}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 font-semibold"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : guides.length === 0 ? (
            // No guides found
            <div className="col-span-full text-center py-16">
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 max-w-md mx-auto">
                <div className="text-slate-400 text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No Guides Found</h3>
                <p className="text-slate-600 mb-6">Try adjusting your search criteria or check back later.</p>
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedLocation('')
                    setSelectedSpecialty('')
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-semibold"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          ) : (
            guides.map((guide) => (
              <div key={guide.id} className="group relative">
              {/* Card Glow Effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl blur opacity-0 group-hover:opacity-75 transition duration-300"></div>
              
              {/* Main Card */}
              <div 
                onClick={() => handleViewDetails(guide)}
                className="relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-100 group-hover:border-blue-200 cursor-pointer"
              >
                {/* Premium Badge */}
                <div className="absolute top-4 right-4">
                  <div className="flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold shadow-lg">
                    <Crown className="h-3 w-3 mr-1" />
                    PREMIUM
                  </div>
        </div>

                {/* Guide Header */}
                <div className="p-8">
                  <div className="flex items-start space-x-5">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl">
                        <span className="text-white text-3xl font-bold">
                    {guide.name.split(' ').map(n => n[0]).join('')}
                  </span>
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                </div>
                <div className="flex-1">
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">{guide.name}</h3>
                      <div className="flex items-center mb-3">
                        <div className="flex items-center">
                          <Star className="h-5 w-5 text-yellow-400 fill-current" />
                          <span className="ml-2 text-lg font-bold text-slate-700">{guide.rating}</span>
                          <span className="ml-2 text-sm text-slate-500 font-medium">({guide.reviewCount} reviews)</span>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-slate-600 mb-2">
                        <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="font-medium">{guide.location}</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <Clock className="h-4 w-4 mr-2 text-purple-500" />
                        <span className="font-medium">{guide.experience} experience</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Price */}
                  <div className="mt-6 text-center">
                    <div className="inline-flex items-center px-6 py-3 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                      <div className="text-3xl font-bold text-green-600">LKR {guide.price.toLocaleString()}</div>
                      <div className="ml-2 text-sm text-green-600 font-medium">per day</div>
                  </div>
                </div>
              </div>
              
                {/* Description */}
                <div className="px-8 pb-6">
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-slate-600 text-sm leading-relaxed font-medium">{guide.description}</p>
                  </div>
                </div>
                
                {/* Languages */}
                <div className="px-8 pb-4">
                  <div className="flex items-center mb-3">
                    <Globe className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-sm font-semibold text-slate-700">Languages</span>
                  </div>
                <div className="flex flex-wrap gap-2">
                    {guide.languages.slice(0, 3).map((lang) => (
                      <span key={lang} className="px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-sm rounded-xl font-semibold border border-blue-300">
                      {lang}
                    </span>
                  ))}
                    {guide.languages.length > 3 && (
                      <span className="px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-600 text-sm rounded-xl font-semibold border border-slate-300">
                        +{guide.languages.length - 3} more
                      </span>
                    )}
                </div>
              </div>
              
                {/* Specialties */}
                <div className="px-8 pb-8">
                  <div className="flex items-center mb-3">
                    <Award className="h-4 w-4 text-purple-500 mr-2" />
                    <span className="text-sm font-semibold text-slate-700">Specialties</span>
                  </div>
                <div className="flex flex-wrap gap-2">
                    {guide.specialties.slice(0, 2).map((specialty) => (
                      <span key={specialty} className="px-4 py-2 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 text-sm rounded-xl font-semibold border border-purple-300">
                        {specialty}
                      </span>
                    ))}
                    {guide.specialties.length > 2 && (
                      <span className="px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-600 text-sm rounded-xl font-semibold border border-slate-300">
                        +{guide.specialties.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              
                {/* Action Buttons */}
                <div className="px-8 pb-8 flex space-x-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewDetails(guide)
                    }}
                    className="flex-1 px-6 py-4 border-2 border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 font-semibold flex items-center justify-center group"
                  >
                    <Eye className="h-5 w-5 mr-2 group-hover:text-blue-500 transition-colors" />
                    View Details
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleBookGuide(guide)
                    }}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-2xl hover:from-blue-700 hover:to-cyan-600 transition-all duration-300 font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center group"
                  >
                    <BookOpen className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                    Book This Guide
                  </button>
                </div>
              </div>
            </div>
            ))
          )}
        </div>
        
        {guides.length === 0 && !loading && !error && (
          <div className="text-center py-20">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl p-12 max-w-md mx-auto border border-slate-100">
                <div className="text-slate-400 mb-6">
                  <Users className="h-20 w-20 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">No guides found</h3>
                <p className="text-slate-600 mb-6">Try adjusting your search criteria or filters to find the perfect guide for your adventure.</p>
                <button 
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedLocation('')
                    setSelectedSpecialty('')
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all duration-300 font-semibold"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Booking Modal */}
      {showBookingModal && selectedGuide && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 my-4">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-slate-200 p-4 sm:p-6 lg:p-8 rounded-t-3xl">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg sm:text-2xl font-bold">
                      {selectedGuide.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Book {selectedGuide.name}</h2>
                    <p className="text-sm sm:text-base text-slate-600 font-medium">Complete your booking details below</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="p-2 sm:p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-all duration-200 self-end sm:self-start"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
              <form onSubmit={handleBookingSubmit} className="space-y-6 sm:space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="group">
                    <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                      Tour Date
                    </label>
                    <div className="relative booking-calendar-container">
                      <button
                        type="button"
                        onClick={() => setShowBookingCalendar(!showBookingCalendar)}
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 hover:bg-white transition-all duration-200 font-medium text-left flex items-center justify-between text-sm sm:text-base"
                      >
                        <span className={bookingData.date ? 'text-slate-900' : 'text-slate-500'}>
                          {formatBookingDate(bookingData.date)}
                        </span>
                        <Calendar className="h-5 w-5 text-slate-400" />
                      </button>
                      
                      {/* Booking Calendar Dropdown */}
                      {showBookingCalendar && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-2xl shadow-lg z-10 p-4">
                          {/* Calendar Header */}
                          <div className="flex items-center justify-between mb-4">
                            <button
                              onClick={() => navigateBookingMonth('prev')}
                              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </button>
                            <h4 className="text-lg font-semibold text-slate-900">
                              {selectedBookingDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h4>
                            <button
                              onClick={() => navigateBookingMonth('next')}
                              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <ArrowLeft className="h-4 w-4 rotate-180" />
                            </button>
                          </div>
                          
                          {/* Calendar Days Header */}
                          <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                              <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-slate-500">
                                {day}
                              </div>
                            ))}
                          </div>
                          
                          {/* Calendar Days */}
                          <div className="grid grid-cols-7 gap-1">
                            {renderBookingCalendar()}
                          </div>
                          
                          {/* Calendar Legend */}
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
                                Selected
                              </div>
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-green-100 rounded mr-1"></div>
                                Available
                              </div>
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-red-100 rounded mr-1"></div>
                                Blocked
                              </div>
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-yellow-100 rounded mr-1"></div>
                                Non-working
                              </div>
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-gray-300 rounded mr-1"></div>
                                Past
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-blue-500" />
                      Duration
                    </label>
                    <select
                      value={bookingData.duration}
                      onChange={(e) => setBookingData({...bookingData, duration: e.target.value})}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 hover:bg-white transition-all duration-200 font-medium appearance-none text-sm sm:text-base"
                      required
                    >
                      <option value="">Select duration</option>
                      <option value="half-day">Half Day (4 hours)</option>
                      <option value="full-day">Full Day (8 hours)</option>
                      <option value="multi-day">Multi Day</option>
                    </select>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2 text-green-500" />
                    Group Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={bookingData.groupSize}
                    onChange={(e) => setBookingData({...bookingData, groupSize: parseInt(e.target.value)})}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50 hover:bg-white transition-all duration-200 font-medium text-sm sm:text-base"
                    required
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-orange-500" />
                    Special Requests
                  </label>
                  <textarea
                    value={bookingData.specialRequests}
                    onChange={(e) => setBookingData({...bookingData, specialRequests: e.target.value})}
                    rows="4"
                    placeholder="Any special requirements or requests..."
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-slate-50 hover:bg-white transition-all duration-200 font-medium resize-none text-sm sm:text-base"
                  />
                </div>

                {/* Guest Information */}
                <div className="bg-blue-50 rounded-2xl p-4 sm:p-6 border border-blue-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Your Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={guestInfo.firstName}
                        onChange={(e) => setGuestInfo({...guestInfo, firstName: e.target.value})}
                        className="w-full px-3 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 font-medium text-sm"
                        placeholder="Enter your first name"
                        required
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={guestInfo.lastName}
                        onChange={(e) => setGuestInfo({...guestInfo, lastName: e.target.value})}
                        className="w-full px-3 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 font-medium text-sm"
                        placeholder="Enter your last name"
                        required
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={guestInfo.email}
                        onChange={(e) => setGuestInfo({...guestInfo, email: e.target.value})}
                        className="w-full px-3 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 font-medium text-sm"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={guestInfo.phone}
                        onChange={(e) => setGuestInfo({...guestInfo, phone: e.target.value})}
                        className="w-full px-3 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 font-medium text-sm"
                        placeholder="Enter your phone number"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-4 sm:p-6 border border-green-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                    <span className="text-lg sm:text-xl font-bold text-slate-900">Total Price</span>
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600">
                      LKR {(selectedGuide.price * bookingData.groupSize).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="text-sm sm:text-base text-slate-600 font-medium">
                      {bookingData.groupSize} person(s) × LKR {selectedGuide.price.toLocaleString()}
                    </span>
                    <div className="flex items-center text-green-600 font-semibold text-sm sm:text-base">
                      <Shield className="h-4 w-4 mr-1" />
                      Secure Payment
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="flex-1 px-4 sm:px-6 py-3 sm:py-4 border-2 border-slate-300 text-slate-700 rounded-2xl hover:bg-slate-50 hover:border-slate-400 transition-all duration-300 font-bold text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-2xl hover:from-blue-700 hover:to-cyan-600 transition-all duration-300 font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center text-sm sm:text-base"
                  >
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    <span className="hidden sm:inline">Submit Booking Request</span>
                    <span className="sm:hidden">Submit</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Guides
