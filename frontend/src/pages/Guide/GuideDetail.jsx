import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MapPin,
  Star,
  Clock,
  Users,
  Calendar,
  Phone,
  Mail,
  Award,
  Globe,
  Shield,
  CheckCircle,
  Zap,
  Crown,
  Sparkles,
  Eye,
  BookOpen,
  ArrowLeft,
  Heart,
  Share2,
  MessageCircle,
  Camera,
  Navigation,
  X,
  MessageSquare,
  Plus
} from 'lucide-react'
import { guideService } from '../../services/guideService'
import { useAuth } from '../../context/AuthContext'
import ReviewForm from '../../components/reviews/ReviewForm'
import ReviewDisplay from '../../components/reviews/ReviewDisplay'
import ReviewRequirements from '../../components/reviews/ReviewRequirements'

const GuideDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [guide, setGuide] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [bookingData, setBookingData] = useState({
    date: '',
    duration: '',
    groupSize: 1,
    specialRequests: ''
  })
  const [showBookingCalendar, setShowBookingCalendar] = useState(false)
  const [selectedBookingDate, setSelectedBookingDate] = useState(new Date())
  const [userBookings, setUserBookings] = useState([])

  // Fetch guide data from API
  useEffect(() => {
    if (id) {
      fetchGuide()
    }
    
    // Listen for guide profile updates
    const handleGuideUpdate = (event) => {
      console.log('Guide profile updated, refreshing guide detail:', event.detail)
      if (event.detail.guideId === id) {
        fetchGuide()
      }
    }
    
    window.addEventListener('guideProfileUpdated', handleGuideUpdate)
    
    return () => {
      window.removeEventListener('guideProfileUpdated', handleGuideUpdate)
    }
  }, [id])

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

  const fetchGuide = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await guideService.getGuideById(id)
      setGuide(response.data)
      
      // If user is authenticated, fetch their bookings with this guide
      if (isAuthenticated && user) {
        await fetchUserBookings()
      }
    } catch (err) {
      console.error('Error fetching guide:', err)
      setError('Failed to load guide details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserBookings = async () => {
    try {
      // Fetch user's bookings with this specific guide
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/bookings/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Filter bookings for this specific guide that are completed
          const guideBookings = data.data.bookings.filter(booking => 
            booking.guide && 
            (booking.guide._id === id || booking.guide === id) &&
            booking.status === 'completed'
          );
          setUserBookings(guideBookings);
        }
      }
    } catch (err) {
      console.error('Error fetching user bookings:', err);
      // Fallback to empty array if fetch fails
      setUserBookings([]);
    }
  }

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    // Refresh guide data to update review count and rating
    fetchGuide();
  }

  const handleReviewUpdate = () => {
    // Refresh guide data when reviews are updated
    fetchGuide();
  }

  const canUserReview = () => {
    if (!isAuthenticated || !user) return false;
    
    // Check if user has completed bookings with this guide
    return userBookings.some(booking => 
      booking.status === 'completed' && 
      (booking.guide === id || booking.guide?._id === id)
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Loading Guide Details...</h2>
          <p className="text-slate-600">Please wait while we fetch the guide information.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Error Loading Guide</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={fetchGuide}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 font-semibold"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/guides')}
              className="w-full px-6 py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-colors duration-200 font-semibold"
            >
              Back to Guides
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!guide) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-slate-100">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Guide Not Found</h1>
          <p className="text-slate-600 mb-6">The guide you are looking for does not exist.</p>
          <button
            onClick={() => navigate('/guides')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all duration-300 font-semibold"
          >
            Go Back to Guides
          </button>
        </div>
      </div>
    )
  }

  const handleBookGuide = () => {
    setShowBookingModal(true)
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
    if (!guide?.blockedDates) return false
    return guide.blockedDates.some(blockout => 
      new Date(blockout.date).toDateString() === date.toDateString()
    )
  }

  const isWorkingDay = (date) => {
    if (!guide?.workingDays) return true
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[date.getDay()]
    return guide.workingDays.includes(dayName)
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
          disabled={!isAvailable}
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

  const handleBookingSubmit = async (e) => {
    e.preventDefault()

    if (!guide) {
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
        guideId: guide.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        duration: bookingData.duration,
        groupSize: parseInt(bookingData.groupSize),
        specialRequests: bookingData.specialRequests || ''
      }

      console.log('Submitting guide booking:', bookingDataToSubmit)

      const response = await guideService.createGuideBooking(bookingDataToSubmit)

      if (response.success) {
        alert('Guide booking submitted successfully! We will contact you soon to confirm.')
        setShowBookingModal(false)
        setBookingData({
          date: '',
          duration: '',
          groupSize: 1,
          specialRequests: ''
        })
      } else {
        alert('Failed to submit booking: ' + (response.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error submitting guide booking:', error)
      alert('Failed to submit booking request. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-blue-800">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/10 to-cyan-500/10"></div>
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-white">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-blue-200 hover:text-blue-100 transition-colors duration-200 mb-8"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Guides
          </button>
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-2xl">
                <span className="text-white text-5xl font-bold">
                  {guide.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-center lg:text-left">
              <h1 className="text-5xl font-bold mb-3">{guide.name}</h1>
              <div className="flex items-center justify-center lg:justify-start mb-4">
                <Star className="h-6 w-6 text-yellow-400 fill-current" />
                <span className="ml-2 text-xl font-bold">{guide.rating}</span>
                <span className="ml-2 text-white/80">({guide.reviewCount} reviews)</span>
              </div>
              <p className="text-xl text-white/90 max-w-2xl lg:max-w-none mx-auto lg:mx-0">{guide.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          {/* About Section */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-3xl p-8 border border-slate-100 shadow-lg">
            <div className="flex items-center mb-5">
              <BookOpen className="h-7 w-7 text-blue-600 mr-4" />
              <h2 className="text-3xl font-bold text-slate-900">About {guide.name}</h2>
            </div>
            <p className="text-slate-700 leading-relaxed text-lg font-medium">{guide.bio}</p>
          </div>

          {/* Highlights Section */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-3xl p-8 border border-yellow-100 shadow-lg">
            <div className="flex items-center mb-5">
              <Award className="h-7 w-7 text-yellow-600 mr-4" />
              <h2 className="text-3xl font-bold text-slate-900">Key Highlights</h2>
            </div>
            <div className="space-y-4">
              {guide.highlights.map((highlight, index) => (
                <div key={index} className="flex items-center p-4 bg-white/60 rounded-2xl border border-yellow-200 shadow-sm">
                  <Zap className="h-6 w-6 text-yellow-500 mr-4" />
                  <span className="text-slate-700 font-semibold text-lg">{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Specialties Section */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl p-8 border border-blue-100 shadow-lg">
            <div className="flex items-center mb-5">
              <Award className="h-7 w-7 text-blue-600 mr-4" />
              <h2 className="text-3xl font-bold text-slate-900">Specialties</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {guide.specialties.map((specialty) => (
                <span key={specialty} className="px-5 py-3 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 rounded-2xl font-bold border border-blue-300 shadow-sm">
                  {specialty}
                </span>
              ))}
            </div>
          </div>

          {/* Languages Section */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-3xl p-8 border border-slate-100 shadow-lg">
            <div className="flex items-center mb-5">
              <Globe className="h-7 w-7 text-blue-600 mr-4" />
              <h2 className="text-3xl font-bold text-slate-900">Languages</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {guide.languages.map((lang) => (
                <span key={lang} className="px-5 py-3 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 rounded-2xl font-bold border border-blue-300 shadow-sm">
                  {lang}
                </span>
              ))}
            </div>
          </div>

          {/* Contact & Socials */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-lg">
            <div className="flex items-center mb-5">
              <MessageCircle className="h-7 w-7 text-blue-600 mr-4" />
              <h2 className="text-3xl font-bold text-slate-900">Connect with {guide.name}</h2>
            </div>
            <div className="flex flex-wrap gap-4">
              <button className="flex items-center px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200 font-semibold">
                <Phone className="h-5 w-5 mr-2" /> Call
              </button>
              <button className="flex items-center px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors duration-200 font-semibold">
                <Mail className="h-5 w-5 mr-2" /> Email
              </button>
              <button className="flex items-center px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors duration-200 font-semibold">
                <Share2 className="h-5 w-5 mr-2" /> Share Profile
              </button>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="space-y-6">            
            {/* Reviews Display */}
            <ReviewDisplay
              guideId={guide.id}
              onReviewUpdate={handleReviewUpdate}
            />
          </div>
        </div>

        {/* Sidebar - Booking & Quick Info */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl p-8 border border-slate-200 shadow-xl sticky top-24">
            <div className="text-center mb-8">
              <div className="text-4xl font-bold text-green-600 mb-2">LKR {guide.price.toLocaleString()}</div>
              <div className="text-green-600 font-semibold">per day</div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center p-3 bg-white/60 rounded-2xl border border-slate-200">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-slate-600 font-medium">Experience</span>
                </div>
                <span className="font-bold text-slate-900">{guide.experience} years</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/60 rounded-2xl border border-slate-200">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-slate-600 font-medium">Location</span>
                </div>
                <span className="font-bold text-slate-900">{guide.location}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/60 rounded-2xl border border-slate-200">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-slate-600 font-medium">Tours Completed</span>
                </div>
                <span className="font-bold text-slate-900">{guide.completedTours}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/60 rounded-2xl border border-slate-200">
                <div className="flex items-center">
                  <Zap className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-slate-600 font-medium">Response Time</span>
                </div>
                <span className="font-bold text-slate-900">{guide.responseTime}</span>
              </div>
            </div>

            <button
              onClick={handleBookGuide}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-2xl hover:from-blue-700 hover:to-cyan-600 transition-all duration-300 font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Book This Guide
            </button>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 my-4">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-slate-200 p-4 sm:p-6 lg:p-8 rounded-t-3xl">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg sm:text-2xl font-bold">
                      {guide.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Book {guide.name}</h2>
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

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-4 sm:p-6 border border-green-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                    <span className="text-lg sm:text-xl font-bold text-slate-900">Total Price</span>
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600">
                      LKR {(guide.price * bookingData.groupSize).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="text-sm sm:text-base text-slate-600 font-medium">
                      {bookingData.groupSize} person(s) × LKR {guide.price.toLocaleString()}
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

export default GuideDetail
