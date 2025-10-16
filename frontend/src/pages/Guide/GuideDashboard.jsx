import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  User,
  MapPin,
  Star,
  Clock,
  Users,
  Award,
  Globe,
  Camera,
  Save,
  Edit3,
  Eye,
  Phone,
  Mail,
  Shield,
  CheckCircle,
  AlertCircle,
  Upload,
  X,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Languages,
  Briefcase,
  FileText,
  Settings,
  BarChart3,
  MessageSquare,
  Heart,
  Bell,
  Headphones,
  Home,
  TrendingUp,
  BookOpen,
  LogOut,
  ChevronDown,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { guideService } from '../../services/guideService'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

const GuideDashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedBookingId, setSelectedBookingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [guideStats, setGuideStats] = useState({
    activeBookings: 0,
    averageRating: 0,
    totalEarnings: 0,
    newMessages: 0
  })
  
  // Bookings state
  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingsError, setBookingsError] = useState('')
  const [bookingsFilter, setBookingsFilter] = useState('all')
  
  // Cancellation state
  const [cancellingBooking, setCancellingBooking] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [bookingToCancel, setBookingToCancel] = useState(null)
  
  // Cancel booking function
  const handleCancelBooking = async (bookingId) => {
    try {
      setCancellingBooking(bookingId)
      await guideService.cancelBooking(bookingId, cancelReason)
      
      // Refresh bookings after cancellation
      await fetchBookings()
      
      setMessage({ type: 'success', text: 'Booking cancelled successfully' })
      setShowCancelModal(false)
      setCancelReason('')
      setBookingToCancel(null)
    } catch (error) {
      console.error('Error cancelling booking:', error)
      setMessage({ type: 'error', text: 'Failed to cancel booking' })
    } finally {
      setCancellingBooking(null)
    }
  }

  // Open cancel modal
  const openCancelModal = (booking) => {
    setBookingToCancel(booking._id)
    setCancellingBooking(null)
    setShowCancelModal(true)
  }

  // Close cancel modal
  const closeCancelModal = () => {
    setShowCancelModal(false)
    setCancellingBooking(null)
    setBookingToCancel(null)
    setCancelReason('')
  }

  // Handle URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const tab = searchParams.get('tab')
    const bookingId = searchParams.get('booking')
    
    if (tab) {
      setActiveTab(tab)
    }
    
    if (bookingId) {
      setSelectedBookingId(bookingId)
    }
  }, [location.search])

  // Scroll to selected booking when bookings are loaded and selectedBookingId is set
  useEffect(() => {
    if (selectedBookingId && bookings.length > 0) {
      setTimeout(() => {
        const bookingElement = document.getElementById(`booking-${selectedBookingId}`)
        if (bookingElement) {
          bookingElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          bookingElement.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50')
          // Remove highlight after 3 seconds
          setTimeout(() => {
            bookingElement.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50')
          }, 3000)
        }
      }, 500)
    }
  }, [selectedBookingId, bookings])

  // Handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    // Clear selected booking when changing tabs
    if (tab !== 'bookings') {
      setSelectedBookingId(null)
    }
  }

  // Fetch bookings function
  const fetchBookings = async () => {
    try {
      console.log('🔍 Guide Dashboard - Fetching bookings for user:', user?.id || user?._id, user?.firstName, user?.role)
      setBookingsLoading(true)
      setBookingsError('')
      
      const response = await guideService.getGuideBookings({ status: bookingsFilter === 'all' ? '' : bookingsFilter })
      
      console.log('📊 Guide Dashboard - API Response:', response)
      
      if (response.success) {
        console.log('✅ Guide Dashboard - Bookings fetched successfully:', response.data.bookings?.length || 0, 'bookings')
        setBookings(response.data.bookings || [])
      } else {
        console.error('❌ Guide Dashboard - Failed to fetch bookings:', response.message)
        setBookingsError(response.message || 'Failed to fetch bookings')
      }
    } catch (error) {
      console.error('❌ Guide Dashboard - Error fetching bookings:', error)
      setBookingsError('Failed to fetch bookings')
    } finally {
      setBookingsLoading(false)
    }
  }
  
  // Guide profile state
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatar: '',
    profile: {
      guideLicense: '',
      languages: [],
      experience: 0,
      specialties: [],
      location: '',
      pricePerDay: 0,
      bio: '',
      certifications: [],
      responseTime: 'Within 24 hours',
      highlights: [],
      availability: 'Available'
    }
  })

  // Form states
  const [newLanguage, setNewLanguage] = useState('')
  const [newSpecialty, setNewSpecialty] = useState('')
  const [newCertification, setNewCertification] = useState('')
  const [newHighlight, setNewHighlight] = useState('')

  // Availability states
  const [availability, setAvailability] = useState({
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    workingHours: {
      start: '09:00',
      end: '17:00'
    },
    blockedDates: [],
    recurringBlockouts: [],
    maxBookingsPerDay: 3,
    advanceBookingDays: 30
  })
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [blockoutDate, setBlockoutDate] = useState('')
  const [blockoutReason, setBlockoutReason] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)

  // Validation states
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // Function to load profile data from user
  const loadProfileData = (userData) => {
    setProfile({
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      email: userData.email || '',
      phone: userData.phone || '',
      avatar: userData.avatar || '',
      profile: {
        guideLicense: userData.profile?.guideLicense || '',
        languages: userData.profile?.languages || [],
        experience: userData.profile?.experience || 0,
        specialties: userData.profile?.specialties || [],
        location: userData.profile?.location || '',
        pricePerDay: userData.profile?.pricePerDay || 0,
        bio: userData.profile?.bio || '',
        certifications: userData.profile?.certifications || [],
        responseTime: userData.profile?.responseTime || 'Within 24 hours',
        highlights: userData.profile?.highlights || [],
        availability: userData.profile?.availability || 'Available'
      }
    })

    // Load availability data
    setAvailability({
      workingDays: userData.profile?.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      workingHours: userData.profile?.workingHours || { start: '09:00', end: '17:00' },
      blockedDates: userData.profile?.blockedDates || [],
      recurringBlockouts: userData.profile?.recurringBlockouts || [],
      maxBookingsPerDay: userData.profile?.maxBookingsPerDay || 3,
      advanceBookingDays: userData.profile?.advanceBookingDays || 30
    })
  }

  // Handle navigation state for activeTab
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab)
    }
  }, [location.state])

  // Get current user info
  useEffect(() => {
    if (isLoading) return
    
    if (!isAuthenticated || !user) {
      navigate('/login')
      return
    }
    
    if (user.role !== 'guide') {
      navigate('/dashboard')
      return
    }
    
    // Debug: Log user data
    console.log('User data loaded:', user)
    console.log('User profile data:', user.profile)
    
    // Load profile data
    loadProfileData(user)
  }, [isLoading, isAuthenticated, user, navigate])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileDropdownOpen && !event.target.closest('.profile-dropdown')) {
        setIsProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileDropdownOpen])

  // Listen for profile updates from other components
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      if (event.detail && event.detail.updatedData) {
        // Reload profile data when updated from other components
        loadProfileData(event.detail.updatedData)
      }
    }

    window.addEventListener('guideProfileUpdated', handleProfileUpdate)
    return () => {
      window.removeEventListener('guideProfileUpdated', handleProfileUpdate)
    }
  }, [])

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCalendar && !event.target.closest('.calendar-container')) {
        setShowCalendar(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCalendar])

  // Fetch guide stats when component loads
  useEffect(() => {
    if (user?.id || user?._id) {
      fetchGuideStats()
    }
  }, [user?.id, user?._id])

  // Fetch bookings when bookings tab is active or filter changes
  useEffect(() => {
    console.log('🔄 useEffect triggered - activeTab:', activeTab, 'user.id:', user?.id, 'user._id:', user?._id)
    if (activeTab === 'bookings' && (user?.id || user?._id)) {
      console.log('📋 Fetching bookings for bookings tab')
      fetchBookings()
    }
  }, [activeTab, bookingsFilter, user?.id, user?._id])

  // Fetch bookings for overview tab
  useEffect(() => {
    console.log('🔄 useEffect triggered - activeTab:', activeTab, 'user.id:', user?.id, 'user._id:', user?._id)
    if (activeTab === 'overview' && (user?.id || user?._id)) {
      console.log('📋 Fetching bookings for overview tab')
      fetchBookings()
    }
  }, [activeTab, user?.id, user?._id])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  // Validation functions
  const validateField = (name, value) => {
    const newErrors = { ...errors }
    
    switch (name) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!value.trim()) {
          newErrors.email = 'Email is required'
        } else if (!emailRegex.test(value)) {
          newErrors.email = 'Please enter a valid email address'
        } else {
          delete newErrors.email
        }
        break
        
      case 'phone':
        if (!value.trim()) {
          newErrors.phone = 'Phone number is required'
        } else {
          // Remove all non-digit characters to check length
          const digitsOnly = value.replace(/\D/g, '')
          if (digitsOnly.length !== 10) {
            newErrors.phone = 'Phone number must be exactly 10 digits'
          } else {
            delete newErrors.phone
          }
        }
        break
        
      case 'bio':
        if (!value.trim()) {
          newErrors.bio = 'Bio is required'
        } else if (value.trim().length < 50) {
          newErrors.bio = 'Bio must be at least 50 characters'
        } else if (value.trim().length > 1000) {
          newErrors.bio = 'Bio cannot exceed 1000 characters'
        } else {
          delete newErrors.bio
        }
        break
        
      default:
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateForm = (formType = 'profile') => {
    const newErrors = {}
    
    if (formType === 'profile') {
      // Only validate essential fields for profile form
      if (!profile.email.trim()) newErrors.email = 'Email is required'
      if (!profile.phone.trim()) newErrors.phone = 'Phone number is required'
      if (!profile.profile.bio.trim()) newErrors.bio = 'Bio is required'
      
      // Validate email format only if email is provided
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (profile.email && !emailRegex.test(profile.email)) {
        newErrors.email = 'Please enter a valid email address'
      }
      
      // Validate phone format only if phone is provided
      if (profile.phone) {
        const digitsOnly = profile.phone.replace(/\D/g, '')
        if (digitsOnly.length !== 10) {
          newErrors.phone = 'Phone number must be exactly 10 digits'
        }
      }
      
      // Validate bio length only if bio is provided
      if (profile.profile.bio && (profile.profile.bio.length < 50 || profile.profile.bio.length > 1000)) {
        newErrors.bio = 'Bio must be between 50 and 1000 characters'
      }
    } else if (formType === 'pricing') {
      // Validate pricing fields
      if (!profile.profile.pricePerDay || profile.profile.pricePerDay === 0) {
        newErrors.pricePerDay = 'Price per day is required'
      } else if (profile.profile.pricePerDay < 1000) {
        newErrors.pricePerDay = 'Price must be at least LKR 1,000'
      } else if (profile.profile.pricePerDay > 100000) {
        newErrors.pricePerDay = 'Price cannot exceed LKR 100,000'
      }
    } else if (formType === 'services') {
      // No validation needed for services (placeholder form)
      // This form doesn't have any required fields yet
    } else if (formType === 'availability') {
      // No validation needed for availability (placeholder form)
      // This form doesn't have any required fields yet
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFieldChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setProfile(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setProfile(prev => ({
        ...prev,
        [field]: value
      }))
    }
    
    // Validate field on change
    validateField(field, value)
  }

  const handleFieldBlur = (field) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }))
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const fetchGuideStats = async () => {
    try {
      if (user?.id) {
        // Fetch both stats and bookings to get accurate counts
        const [statsResponse, bookingsResponse] = await Promise.all([
          guideService.getGuideStats(user.id),
          guideService.getGuideBookings({ status: 'confirmed' })
        ])
        
        const confirmedBookings = bookingsResponse.data.bookings || []
        
        setGuideStats({
          activeBookings: confirmedBookings.length,
          averageRating: statsResponse.data.averageRating || 0,
          totalEarnings: statsResponse.data.totalRevenue || 0,
          newMessages: Math.floor(Math.random() * 5) // Placeholder for now
        })
      }
    } catch (error) {
      console.error('Error fetching guide stats:', error)
      // Set default values if API fails
      setGuideStats({
        activeBookings: 0,
        averageRating: 0,
        totalEarnings: 0,
        newMessages: 0
      })
    }
  }

  // Save Profile Information
  const handleSaveProfile = async () => {
    // Mark all fields as touched to show validation errors
    const touchedFields = { email: true, phone: true, bio: true }
    setTouched(touchedFields)
    
    // Validate the form
    if (!validateForm('profile')) {
      showMessage('error', 'Please fix the validation errors before saving')
      return
    }

    try {
      setSaving(true)
      
      // Only send profile-specific fields, not pricing or other fields
      const updateData = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        avatar: profile.avatar,
        profile: {
          guideLicense: profile.profile.guideLicense,
          languages: profile.profile.languages,
          experience: profile.profile.experience,
          specialties: profile.profile.specialties,
          location: profile.profile.location,
          bio: profile.profile.bio,
          certifications: profile.profile.certifications,
          responseTime: profile.profile.responseTime,
          highlights: profile.profile.highlights
          // Note: NOT including pricePerDay, availability - these are handled by other forms
        }
      }
      
      console.log('Saving profile data:', updateData)
      
      const response = await guideService.updateGuideProfile(updateData)
      
      if (response.success && response.data) {
        const savedProfile = response.data
        
        // Update local profile state with the saved profile data
        setProfile(prev => ({
          ...prev,
          firstName: savedProfile.firstName || prev.firstName,
          lastName: savedProfile.lastName || prev.lastName,
          email: savedProfile.email || prev.email,
          phone: savedProfile.phone || prev.phone,
          avatar: savedProfile.avatar || prev.avatar,
          profile: {
            ...prev.profile,
            guideLicense: savedProfile.profile?.guideLicense || prev.profile.guideLicense,
            languages: savedProfile.profile?.languages !== undefined ? savedProfile.profile.languages : prev.profile.languages,
            experience: savedProfile.profile?.experience || prev.profile.experience,
            specialties: savedProfile.profile?.specialties !== undefined ? savedProfile.profile.specialties : prev.profile.specialties,
            location: savedProfile.profile?.location || prev.profile.location,
            bio: savedProfile.profile?.bio || prev.profile.bio,
            certifications: savedProfile.profile?.certifications !== undefined ? savedProfile.profile.certifications : prev.profile.certifications,
            responseTime: savedProfile.profile?.responseTime || prev.profile.responseTime,
            highlights: savedProfile.profile?.highlights !== undefined ? savedProfile.profile.highlights : prev.profile.highlights
            // Note: NOT updating pricePerDay, availability - these are handled by other forms
          }
        }))
        
        // Update user data in localStorage
        const updatedUser = {
          ...user,
          firstName: savedProfile.firstName || user.firstName,
          lastName: savedProfile.lastName || user.lastName,
          email: savedProfile.email || user.email,
          phone: savedProfile.phone || user.phone,
          avatar: savedProfile.avatar || user.avatar,
          profile: {
            ...user.profile,
            guideLicense: savedProfile.profile?.guideLicense || user.profile?.guideLicense,
            languages: savedProfile.profile?.languages !== undefined ? savedProfile.profile.languages : user.profile?.languages,
            experience: savedProfile.profile?.experience || user.profile?.experience,
            specialties: savedProfile.profile?.specialties !== undefined ? savedProfile.profile.specialties : user.profile?.specialties,
            location: savedProfile.profile?.location || user.profile?.location,
            bio: savedProfile.profile?.bio || user.profile?.bio,
            certifications: savedProfile.profile?.certifications !== undefined ? savedProfile.profile.certifications : user.profile?.certifications,
            responseTime: savedProfile.profile?.responseTime || user.profile?.responseTime,
            highlights: savedProfile.profile?.highlights !== undefined ? savedProfile.profile.highlights : user.profile?.highlights
            // Note: NOT updating pricePerDay, availability - these are handled by other forms
          }
        }
        
        localStorage.setItem('user', JSON.stringify(updatedUser))
        
        // Reload profile data to ensure form shows updated values
        loadProfileData(updatedUser)
        
        showMessage('success', 'Profile information updated successfully!')
        
        window.dispatchEvent(new CustomEvent('guideProfileUpdated', {
          detail: { guideId: user.id, updatedData: savedProfile }
        }))
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      showMessage('error', 'Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Save Pricing Information
  const handleSavePricing = async () => {
    // Mark pricing fields as touched to show validation errors
    const touchedFields = { pricePerDay: true }
    setTouched(touchedFields)
    
    if (!validateForm('pricing')) {
      showMessage('error', 'Please fix the validation errors before saving')
      return
    }

    try {
      setSaving(true)
      
      // Only send pricing-specific fields
      const updateData = {
        profile: {
          pricePerDay: profile.profile.pricePerDay,
          availability: profile.profile.availability
          // Note: NOT including other profile fields - these are handled by other forms
        }
      }
      
      console.log('Saving pricing data:', updateData)
      
      const response = await guideService.updateGuideProfile(updateData)
      
      if (response.success && response.data) {
        const savedProfile = response.data
        
        // Update local profile state with the saved pricing data
        setProfile(prev => ({
          ...prev,
          profile: {
            ...prev.profile,
            pricePerDay: savedProfile.profile?.pricePerDay || prev.profile.pricePerDay,
            availability: savedProfile.profile?.availability || prev.profile.availability
          }
        }))
        
        // Update user data in localStorage
        const updatedUser = {
          ...user,
          profile: {
            ...user.profile,
            pricePerDay: savedProfile.profile?.pricePerDay || user.profile?.pricePerDay,
            availability: savedProfile.profile?.availability || user.profile?.availability
          }
        }
        
        localStorage.setItem('user', JSON.stringify(updatedUser))
        
        // Reload profile data to ensure form shows updated values
        loadProfileData(updatedUser)
        
        showMessage('success', 'Pricing updated successfully!')
        
        window.dispatchEvent(new CustomEvent('guideProfileUpdated', {
          detail: { guideId: user.id, updatedData: savedProfile }
        }))
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Error updating pricing:', error)
      showMessage('error', 'Failed to update pricing. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Save Services Information (placeholder for future implementation)
  const handleSaveServices = async () => {
    try {
      setSaving(true)
      // Future implementation for services
      showMessage('success', 'Services updated successfully!')
    } catch (error) {
      console.error('Error updating services:', error)
      showMessage('error', 'Failed to update services. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Save Availability Information
  const handleSaveAvailability = async () => {
    try {
      setSaving(true)
      
      // Only send availability-specific fields
      const updateData = {
        profile: {
          availability: profile.profile.availability,
          workingDays: availability.workingDays,
          workingHours: availability.workingHours,
          blockedDates: availability.blockedDates,
          maxBookingsPerDay: availability.maxBookingsPerDay,
          advanceBookingDays: availability.advanceBookingDays
        }
      }
      
      console.log('Saving availability data:', updateData)
      
      const response = await guideService.updateGuideProfile(updateData)
      
      if (response.success && response.data) {
        const savedProfile = response.data
        
        // Update local profile state with the saved availability data
        setProfile(prev => ({
          ...prev,
          profile: {
            ...prev.profile,
            availability: savedProfile.profile?.availability || prev.profile.availability
          }
        }))
        
        // Update availability state
        setAvailability(prev => ({
          ...prev,
          workingDays: savedProfile.profile?.workingDays !== undefined ? savedProfile.profile.workingDays : prev.workingDays,
          workingHours: savedProfile.profile?.workingHours || prev.workingHours,
          blockedDates: savedProfile.profile?.blockedDates !== undefined ? savedProfile.profile.blockedDates : prev.blockedDates,
          maxBookingsPerDay: savedProfile.profile?.maxBookingsPerDay || prev.maxBookingsPerDay,
          advanceBookingDays: savedProfile.profile?.advanceBookingDays || prev.advanceBookingDays
        }))
        
        // Update user data in localStorage
        const updatedUser = {
          ...user,
          profile: {
            ...user.profile,
            availability: savedProfile.profile?.availability || user.profile?.availability,
            workingDays: savedProfile.profile?.workingDays !== undefined ? savedProfile.profile.workingDays : user.profile?.workingDays,
            workingHours: savedProfile.profile?.workingHours || user.profile?.workingHours,
            blockedDates: savedProfile.profile?.blockedDates !== undefined ? savedProfile.profile.blockedDates : user.profile?.blockedDates,
            maxBookingsPerDay: savedProfile.profile?.maxBookingsPerDay || user.profile?.maxBookingsPerDay,
            advanceBookingDays: savedProfile.profile?.advanceBookingDays || user.profile?.advanceBookingDays
          }
        }
        
        localStorage.setItem('user', JSON.stringify(updatedUser))
        
        // Reload profile data to ensure form shows updated values
        loadProfileData(updatedUser)
        
        showMessage('success', 'Availability updated successfully!')
        
        window.dispatchEvent(new CustomEvent('guideProfileUpdated', {
          detail: { guideId: user.id, updatedData: savedProfile }
        }))
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Error updating availability:', error)
      showMessage('error', 'Failed to update availability. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Availability helper functions
  const toggleWorkingDay = (day) => {
    setAvailability(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day]
    }))
  }

  const addBlockedDate = () => {
    if (!blockoutDate || !blockoutReason.trim()) return
    
    const newBlockout = {
      date: blockoutDate,
      reason: blockoutReason
    }
    
    setAvailability(prev => ({
      ...prev,
      blockedDates: [...prev.blockedDates, newBlockout]
    }))
    
    setBlockoutDate('')
    setBlockoutReason('')
  }

  const removeBlockedDate = (index) => {
    setAvailability(prev => ({
      ...prev,
      blockedDates: prev.blockedDates.filter((_, i) => i !== index)
    }))
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Calendar helper functions
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
    return availability.blockedDates.some(blockout => 
      new Date(blockout.date).toDateString() === date.toDateString()
    )
  }

  const handleDateSelect = (day) => {
    const dateToSelect = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)
    
    if (isDateInPast(dateToSelect)) {
      showMessage('error', 'Cannot select past dates')
      return
    }
    
    if (isDateBlocked(dateToSelect)) {
      showMessage('error', 'This date is already blocked')
      return
    }
    
    setBlockoutDate(dateToSelect.toISOString().split('T')[0])
    setShowCalendar(false)
  }

  const navigateMonth = (direction) => {
    setSelectedDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedDate)
    const firstDay = getFirstDayOfMonth(selectedDate)
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)
      const isPast = isDateInPast(currentDate)
      const isBlocked = isDateBlocked(currentDate)
      const isSelected = blockoutDate === currentDate.toISOString().split('T')[0]
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          disabled={isPast || isBlocked}
          className={`h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200 ${
            isSelected
              ? 'bg-blue-500 text-white'
              : isPast
              ? 'text-gray-300 cursor-not-allowed'
              : isBlocked
              ? 'bg-red-100 text-red-500 cursor-not-allowed'
              : 'text-gray-700 hover:bg-blue-100 hover:text-blue-600'
          }`}
        >
          {day}
        </button>
      )
    }
    
    return days
  }

  const addItem = (type, value) => {
    if (!value.trim()) return
    
    // Validate the input based on type
    const fieldName = `new${type.charAt(0).toUpperCase() + type.slice(1)}`
    if (!validateField(fieldName, value)) {
      return
    }
    
    const newItem = value.trim()
    setProfile(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [type]: [...prev.profile[type], newItem]
      }
    }))
    
    // Clear input
    switch(type) {
      case 'languages': setNewLanguage(''); break
      case 'specialties': setNewSpecialty(''); break
      case 'certifications': setNewCertification(''); break
      case 'highlights': setNewHighlight(''); break
    }
  }

  const removeItem = (type, index) => {
    setProfile(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [type]: prev.profile[type].filter((_, i) => i !== index)
      }
    }))
  }

  // PDF Report generation
  const handleGeneratePDFReport = async (reportType = 'overview', period = '30d') => {
    try {
      toast.loading('Generating PDF report...', { id: 'pdf-report' });
      
      const response = await api.post('/guides/reports/generate', {
        reportType,
        period
      });

      if (response.data.success && response.data.data) {
        console.log('Response data type:', typeof response.data.data);
        console.log('Response data length:', response.data.data.length);
        console.log('First 100 chars:', response.data.data.substring(0, 100));
        
        try {
          // Convert base64 to blob using a more robust method
          const base64Data = response.data.data;
          
          // Remove any whitespace or newlines
          const cleanBase64 = base64Data.replace(/\s/g, '');
          
          // Convert base64 to binary string
          const binaryString = atob(cleanBase64);
          
          // Convert binary string to Uint8Array
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          // Create blob
          const blob = new Blob([bytes], { type: 'application/pdf' });
          
          console.log('Blob created successfully, size:', blob.size);
          
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = response.data.filename || `guide-report-${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          toast.success('PDF report generated successfully!', { id: 'pdf-report' });
        } catch (decodeError) {
          console.error('Error decoding base64 data:', decodeError);
          throw new Error('Failed to decode PDF data: ' + decodeError.message);
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast.error('Failed to generate PDF report', { id: 'pdf-report' });
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'services', label: 'Services', icon: Briefcase },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'availability', label: 'Availability', icon: Calendar },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'support', label: 'Support', icon: Headphones }
  ]

  const handleTabClick = (tabId) => {
    if (tabId === 'notifications') {
      navigate('/guide-notifications')
    } else if (tabId === 'support') {
      navigate('/guide-support')
    } else {
      setActiveTab(tabId)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Guide Dashboard</h1>
                <p className="text-slate-600">Manage your profile and services</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/guides')}
                className="flex items-center px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Public Profile
              </button>
              
              {/* Profile Dropdown */}
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:text-slate-900 transition-colors rounded-xl hover:bg-slate-50"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium">{user?.firstName}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('profile')
                        setIsProfileDropdownOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Profile Settings
                    </button>
                    <button
                      onClick={() => {
                        navigate('/guide-support')
                        setIsProfileDropdownOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Headphones className="h-4 w-4 mr-3" />
                      Support
                    </button>
                    <button
                      onClick={() => {
                        navigate('/guide-notifications')
                        setIsProfileDropdownOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Bell className="h-4 w-4 mr-3" />
                      Notifications
                    </button>
                    <hr className="my-1 border-slate-100" />
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsProfileDropdownOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className={`p-4 rounded-xl border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2" />
              )}
              {message.text}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 sticky top-24">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-lg p-8 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">
                        Welcome back, {profile.firstName}!
                      </h2>
                      <p className="text-blue-100 text-lg">
                        Ready to show tourists the beauty of Sri Lanka?
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => handleGeneratePDFReport('overview', '30d')}
                        className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        Generate Report
                      </button>
                      <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                        <User className="h-10 w-10 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-green-600" />
                      </div>
                      <span className="text-2xl font-bold text-slate-900">{guideStats.activeBookings}</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Active Bookings</h3>
                    <p className="text-sm text-slate-600">Tours scheduled this month</p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <Star className="h-6 w-6 text-yellow-600" />
                      </div>
                      <span className="text-2xl font-bold text-slate-900">{guideStats.averageRating}</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Average Rating</h3>
                    <p className="text-sm text-slate-600">Based on customer reviews</p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="text-2xl font-bold text-slate-900">LKR {guideStats.totalEarnings.toLocaleString()}</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Total Earnings</h3>
                    <p className="text-sm text-slate-600">All-time earnings</p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Bell className="h-6 w-6 text-purple-600" />
                      </div>
                      <span className="text-2xl font-bold text-slate-900">{guideStats.newMessages}</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">New Messages</h3>
                    <p className="text-sm text-slate-600">Unread notifications</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                  <div className="flex items-center mb-6">
                    <TrendingUp className="h-6 w-6 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-slate-900">Quick Actions</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <button
                      onClick={() => handleTabChange('profile')}
                      className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left group"
                    >
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">Update Profile</h3>
                      <p className="text-sm text-slate-600">Keep your information current</p>
                    </button>

                    <button
                      onClick={() => handleTabChange('bookings')}
                      className="p-6 border-2 border-slate-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-200 text-left group"
                    >
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                        <Calendar className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">View Bookings</h3>
                      <p className="text-sm text-slate-600">Manage your bookings</p>
                    </button>

                    <button
                      onClick={() => navigate('/guide-notifications')}
                      className="p-6 border-2 border-slate-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 text-left group"
                    >
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                        <Bell className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">View Notifications</h3>
                      <p className="text-sm text-slate-600">Check messages and updates</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('availability')}
                      className="p-6 border-2 border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200 text-left group"
                    >
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                        <Calendar className="h-6 w-6 text-emerald-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">Set Availability</h3>
                      <p className="text-sm text-slate-600">Manage your schedule</p>
                    </button>

                    <button
                      onClick={() => navigate('/guide-support')}
                      className="p-6 border-2 border-slate-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all duration-200 text-left group"
                    >
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                        <Headphones className="h-6 w-6 text-orange-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">Get Support</h3>
                      <p className="text-sm text-slate-600">Contact customer support</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('pricing')}
                      className="p-6 border-2 border-slate-200 rounded-xl hover:border-yellow-500 hover:bg-yellow-50 transition-all duration-200 text-left group"
                    >
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-yellow-200 transition-colors">
                        <DollarSign className="h-6 w-6 text-yellow-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">Update Pricing</h3>
                      <p className="text-sm text-slate-600">Adjust your rates</p>
                    </button>

                    <button
                      onClick={() => navigate('/guides')}
                      className="p-6 border-2 border-slate-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition-all duration-200 text-left group"
                    >
                      <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-cyan-200 transition-colors">
                        <Eye className="h-6 w-6 text-cyan-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">View Public Profile</h3>
                      <p className="text-sm text-slate-600">See how tourists see you</p>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <BookOpen className="h-6 w-6 text-blue-600 mr-3" />
                      <h2 className="text-2xl font-bold text-slate-900">Recent Activity</h2>
                    </div>
                    <button
                      onClick={() => handleTabChange('bookings')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View All Bookings
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {bookings.length > 0 ? (
                      bookings.slice(0, 3).map((booking) => (
                        <div key={booking._id} className="flex items-center p-4 bg-green-50 rounded-xl border border-green-200">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                            <Calendar className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">
                              {booking.status === 'pending' ? 'New booking received' : 
                               booking.status === 'confirmed' ? 'Booking confirmed' :
                               booking.status === 'completed' ? 'Tour completed' : 'Booking updated'}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {booking.tour?.title || 'Custom Tour'} - {booking.user?.firstName} {booking.user?.lastName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(booking.startDate).toLocaleDateString()} - {booking.duration}
                            </p>
                          </div>
                          <span className="text-sm text-slate-500">
                            {new Date(booking.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-500">No recent bookings</p>
                        <p className="text-sm text-slate-400">Your recent bookings will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="space-y-8">
                {/* Bookings Header */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <Calendar className="h-6 w-6 text-blue-600 mr-3" />
                      <h2 className="text-2xl font-bold text-slate-900">My Bookings</h2>
                    </div>
                    
                    {/* Filter Dropdown */}
                    <div className="flex items-center space-x-4">
                      <label className="text-sm font-medium text-slate-700">Filter by status:</label>
                      <select
                        value={bookingsFilter}
                        onChange={(e) => setBookingsFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Bookings</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Bookings List */}
                  {bookingsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-3 text-slate-600">Loading bookings...</span>
                    </div>
                  ) : bookingsError ? (
                    <div className="text-center py-12">
                      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                      <p className="text-red-600 mb-4">{bookingsError}</p>
                      <button
                        onClick={fetchBookings}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-700 mb-2">No bookings found</h3>
                      <p className="text-slate-500">
                        {bookingsFilter === 'all' 
                          ? "You don't have any bookings yet. When tourists book your services, they'll appear here."
                          : `No ${bookingsFilter} bookings found.`
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {bookings.map((booking) => (
                        <div key={booking._id} id={`booking-${booking._id}`} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <BookOpen className="h-5 w-5 text-blue-600" />
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {booking.tour?.title || 'Custom Tour'}
                                </h3>
                              </div>
                              
                              <div className="flex items-center space-x-2 mb-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  booking.status === 'confirmed' 
                                    ? 'bg-green-100 text-green-800'
                                    : booking.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : booking.status === 'completed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {booking.status === 'confirmed' && <CheckCircle className="h-3 w-3 mr-1" />}
                                  {booking.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                  {booking.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                                  {booking.status === 'cancelled' && <XCircle className="h-3 w-3 mr-1" />}
                                  <span className="ml-1">{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  booking.paymentStatus === 'paid' 
                                    ? 'bg-green-100 text-green-800'
                                    : booking.paymentStatus === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {booking.paymentStatus === 'paid' && <CheckCircle className="h-3 w-3 mr-1" />}
                                  {booking.paymentStatus === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                  {booking.paymentStatus === 'refunded' && <XCircle className="h-3 w-3 mr-1" />}
                                  <span className="ml-1">{booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}</span>
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                <div className="flex items-center text-sm text-gray-600">
                                  <User className="h-4 w-4 mr-2" />
                                  <span className="font-medium">Customer:</span>
                                  <span className="ml-1">{booking.user?.firstName} {booking.user?.lastName}</span>
                                </div>
                                
                                <div className="flex items-center text-sm text-gray-600">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  <span className="font-medium">Start:</span>
                                  <span className="ml-1">{new Date(booking.startDate).toLocaleDateString()}</span>
                                </div>
                                
                                <div className="flex items-center text-sm text-gray-600">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  <span className="font-medium">End:</span>
                                  <span className="ml-1">{new Date(booking.endDate).toLocaleDateString()}</span>
                                </div>
                                
                                <div className="flex items-center text-sm text-gray-600">
                                  <Clock className="h-4 w-4 mr-2" />
                                  <span className="font-medium">Duration:</span>
                                  <span className="ml-1 capitalize">{booking.duration?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                </div>
                                
                                <div className="flex items-center text-sm text-gray-600">
                                  <Users className="h-4 w-4 mr-2" />
                                  <span className="font-medium">Group Size:</span>
                                  <span className="ml-1">{booking.groupSize} {booking.groupSize === 1 ? 'person' : 'people'}</span>
                                </div>
                                
                                <div className="flex items-center text-sm text-gray-600">
                                  <MapPin className="h-4 w-4 mr-2" />
                                  <span className="font-medium">Location:</span>
                                  <span className="ml-1">{booking.tour?.location?.name || 'Sri Lanka'}</span>
                                </div>
                                
                                <div className="flex items-center text-sm text-gray-600">
                                  <Phone className="h-4 w-4 mr-2" />
                                  <span className="font-medium">Contact:</span>
                                  <span className="ml-1">{booking.user?.phone || 'N/A'}</span>
                                </div>
                                
                                <div className="flex items-center text-sm text-gray-600">
                                  <Mail className="h-4 w-4 mr-2" />
                                  <span className="font-medium">Email:</span>
                                  <span className="ml-1">{booking.user?.email || 'N/A'}</span>
                                </div>
                              </div>
                              
                              {booking.specialRequests && (
                                <div className="mt-3 text-sm text-gray-600">
                                  <div className="flex items-start">
                                    <FileText className="h-4 w-4 mr-2 mt-0.5" />
                                    <div>
                                      <strong>Special Requests:</strong> {booking.specialRequests}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {booking.bookingReference && (
                                <div className="mt-2 text-xs text-gray-500">
                                  <strong>Booking Reference:</strong> {booking.bookingReference}
                                </div>
                              )}
                            </div>
                            
                            <div className="ml-6 flex flex-col items-end">
                              <div className="mt-2 flex items-center text-lg font-semibold text-gray-900">
                                <DollarSign className="h-4 w-4 mr-1" />
                                LKR {booking.totalAmount?.toLocaleString() || '0'}
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                Booking created: {new Date(booking.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex justify-end space-x-3">
                            <button
                              onClick={() => {
                                if (booking.user?.email) {
                                  window.open(`mailto:${booking.user.email}`, '_blank')
                                }
                              }}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Contact
                            </button>
                            
                            {booking.user?.phone && (
                              <button
                                onClick={() => {
                                  window.open(`tel:${booking.user.phone}`, '_self')
                                }}
                                className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-300 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                <Phone className="h-4 w-4 mr-2" />
                                Call
                              </button>
                            )}

                            {['pending', 'confirmed'].includes(booking.status) && (
                              <button
                                onClick={() => openCancelModal(booking)}
                                disabled={cancellingBooking === booking._id}
                                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                {cancellingBooking === booking._id ? 'Cancelling...' : 'Cancel'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cancelled Bookings Section */}
            {activeTab === 'bookings' && bookingsFilter === 'cancelled' && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                <div className="flex items-center mb-6">
                  <XCircle className="h-6 w-6 text-red-600 mr-3" />
                  <h2 className="text-2xl font-bold text-slate-900">Cancelled Bookings</h2>
                </div>
                
                {bookings.filter(booking => booking.status === 'cancelled').length === 0 ? (
                  <div className="text-center py-12">
                    <XCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">No cancelled bookings</h3>
                    <p className="text-slate-500">You haven't cancelled any bookings yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {bookings.filter(booking => booking.status === 'cancelled').map((booking) => (
                      <div key={booking._id} className="bg-white rounded-lg shadow-sm border border-red-200 p-6 hover:shadow-md transition-all duration-200 bg-red-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <BookOpen className="h-5 w-5 text-red-600" />
                              <h3 className="text-lg font-semibold text-gray-900">
                                {booking.tour?.title || 'Custom Tour'}
                              </h3>
                            </div>
                            
                            <div className="flex items-center space-x-2 mb-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <XCircle className="h-3 w-3 mr-1" />
                                <span className="ml-1">Cancelled</span>
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                booking.paymentStatus === 'refunded' 
                                  ? 'bg-green-100 text-green-800'
                                  : booking.paymentStatus === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {booking.paymentStatus === 'refunded' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {booking.paymentStatus === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                <span className="ml-1">{booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}</span>
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <User className="h-4 w-4 mr-2" />
                                <span className="font-medium">Customer:</span>
                                <span className="ml-1">{booking.user?.firstName} {booking.user?.lastName}</span>
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span className="font-medium">Start:</span>
                                <span className="ml-1">{new Date(booking.startDate).toLocaleDateString()}</span>
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span className="font-medium">End:</span>
                                <span className="ml-1">{new Date(booking.endDate).toLocaleDateString()}</span>
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="h-4 w-4 mr-2" />
                                <span className="font-medium">Duration:</span>
                                <span className="ml-1 capitalize">{booking.duration?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-600">
                                <Users className="h-4 w-4 mr-2" />
                                <span className="font-medium">Group Size:</span>
                                <span className="ml-1">{booking.groupSize} {booking.groupSize === 1 ? 'person' : 'people'}</span>
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="h-4 w-4 mr-2" />
                                <span className="font-medium">Location:</span>
                                <span className="ml-1">{booking.tour?.location?.name || 'Sri Lanka'}</span>
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="h-4 w-4 mr-2" />
                                <span className="font-medium">Contact:</span>
                                <span className="ml-1">{booking.user?.phone || 'N/A'}</span>
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="h-4 w-4 mr-2" />
                                <span className="font-medium">Email:</span>
                                <span className="ml-1">{booking.user?.email || 'N/A'}</span>
                              </div>
                            </div>
                            
                            {booking.specialRequests && (
                              <div className="mt-3 text-sm text-gray-600">
                                <div className="flex items-start">
                                  <FileText className="h-4 w-4 mr-2 mt-0.5" />
                                  <div>
                                    <strong>Special Requests:</strong> {booking.specialRequests}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {booking.cancellationReason && (
                              <div className="mt-3 text-sm text-red-600">
                                <div className="flex items-start">
                                  <AlertTriangle className="h-4 w-4 mr-2 mt-0.5" />
                                  <div>
                                    <strong>Cancellation Reason:</strong> {booking.cancellationReason}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {booking.bookingReference && (
                              <div className="mt-2 text-xs text-gray-500">
                                <strong>Booking Reference:</strong> {booking.bookingReference}
                              </div>
                            )}
                          </div>
                          
                          <div className="ml-6 flex flex-col items-end">
                            <div className="mt-2 flex items-center text-lg font-semibold text-red-600">
                              <DollarSign className="h-4 w-4 mr-1" />
                              LKR {booking.totalAmount?.toLocaleString() || '0'}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              Booking cancelled: {new Date(booking.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                {/* Basic Information */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                  <div className="flex items-center mb-6">
                    <User className="h-6 w-6 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-slate-900">Basic Information</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={profile.firstName}
                        onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={profile.lastName}
                        onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter your last name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        onBlur={() => handleFieldBlur('email')}
                        className={`w-full px-4 py-3 bg-white border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                          errors.email && touched.email ? 'border-red-500' : 'border-slate-200'
                        }`}
                        placeholder="Enter your email"
                      />
                      {errors.email && touched.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-slate-500 text-sm">+94</span>
                        </div>
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) => {
                            // Only allow digits and limit to 10 characters
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                            handleFieldChange('phone', value)
                          }}
                          onBlur={() => handleFieldBlur('phone')}
                          className={`w-full pl-12 pr-4 py-3 bg-white border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                            errors.phone && touched.phone ? 'border-red-500' : 'border-slate-200'
                          }`}
                          placeholder="77 123 4567"
                          maxLength="10"
                        />
                      </div>
                      {errors.phone && touched.phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                      )}
                      <p className="text-slate-500 text-xs mt-1">Enter 10-digit phone number without country code</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Profile Photo URL</label>
                    <input
                      type="url"
                      value={profile.avatar}
                      onChange={(e) => setProfile(prev => ({ ...prev, avatar: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="https://example.com/your-photo.jpg"
                    />
                    <p className="text-slate-500 text-xs mt-1">Enter a valid image URL (jpg, jpeg, png, gif, webp)</p>
                  </div>
                </div>

                {/* Professional Details */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                  <div className="flex items-center mb-6">
                    <Briefcase className="h-6 w-6 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-slate-900">Professional Details</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Guide License</label>
                      <input
                        type="text"
                        value={profile.profile.guideLicense}
                        onChange={(e) => setProfile(prev => ({ 
                          ...prev, 
                          profile: { ...prev.profile, guideLicense: e.target.value }
                        }))}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter your guide license number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Experience (Years)</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={profile.profile.experience}
                        onChange={(e) => setProfile(prev => ({ 
                          ...prev, 
                          profile: { ...prev.profile, experience: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Years of experience"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                      <input
                        type="text"
                        value={profile.profile.location}
                        onChange={(e) => setProfile(prev => ({ 
                          ...prev, 
                          profile: { ...prev.profile, location: e.target.value }
                        }))}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="e.g., Colombo, Kandy, Galle"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Response Time</label>
                      <select
                        value={profile.profile.responseTime}
                        onChange={(e) => setProfile(prev => ({ 
                          ...prev, 
                          profile: { ...prev.profile, responseTime: e.target.value }
                        }))}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      >
                        <option value="Within 1 hour">Within 1 hour</option>
                        <option value="Within 2 hours">Within 2 hours</option>
                        <option value="Within 4 hours">Within 4 hours</option>
                        <option value="Within 24 hours">Within 24 hours</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Bio</label>
                    <textarea
                      value={profile.profile.bio}
                      onChange={(e) => handleFieldChange('profile.bio', e.target.value)}
                      onBlur={() => handleFieldBlur('bio')}
                      rows="4"
                      placeholder="Tell potential clients about yourself, your experience, and what makes you special..."
                      className={`w-full px-4 py-3 bg-white border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none ${
                        errors.bio && touched.bio ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                    {errors.bio && touched.bio && (
                      <p className="text-red-500 text-sm mt-1">{errors.bio}</p>
                    )}
                    <p className="text-slate-500 text-sm mt-1">
                      {profile.profile.bio.length}/1000 characters
                    </p>
                  </div>
                </div>

                {/* Languages */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                  <div className="flex items-center mb-6">
                    <Globe className="h-6 w-6 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-slate-900">Languages</h2>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 mb-4">
                    {profile.profile.languages.map((lang, index) => (
                      <span key={index} className="flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-xl font-semibold">
                        {lang}
                        <button
                          onClick={() => removeItem('languages', index)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newLanguage}
                      onChange={(e) => {
                        setNewLanguage(e.target.value)
                        validateField('newLanguage', e.target.value)
                      }}
                      onBlur={() => handleFieldBlur('newLanguage')}
                      placeholder="Add a language"
                      className={`flex-1 px-4 py-3 bg-white border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                        errors.newLanguage && touched.newLanguage ? 'border-red-500' : 'border-slate-200'
                      }`}
                      onKeyPress={(e) => e.key === 'Enter' && addItem('languages', newLanguage)}
                    />
                    {errors.newLanguage && touched.newLanguage && (
                      <p className="text-red-500 text-sm mt-1">{errors.newLanguage}</p>
                    )}
                    <button
                      onClick={() => addItem('languages', newLanguage)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-semibold"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Specialties */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                  <div className="flex items-center mb-6">
                    <Award className="h-6 w-6 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-slate-900">Specialties</h2>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 mb-4">
                    {profile.profile.specialties.map((specialty, index) => (
                      <span key={index} className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-xl font-semibold">
                        {specialty}
                        <button
                          onClick={() => removeItem('specialties', index)}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newSpecialty}
                      onChange={(e) => {
                        setNewSpecialty(e.target.value)
                        validateField('newSpecialty', e.target.value)
                      }}
                      onBlur={() => handleFieldBlur('newSpecialty')}
                      placeholder="Add a specialty"
                      className={`flex-1 px-4 py-3 bg-white border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                        errors.newSpecialty && touched.newSpecialty ? 'border-red-500' : 'border-slate-200'
                      }`}
                      onKeyPress={(e) => e.key === 'Enter' && addItem('specialties', newSpecialty)}
                    />
                    {errors.newSpecialty && touched.newSpecialty && (
                      <p className="text-red-500 text-sm mt-1">{errors.newSpecialty}</p>
                    )}
                    <button
                      onClick={() => addItem('specialties', newSpecialty)}
                      className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors duration-200 font-semibold"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Certifications */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                  <div className="flex items-center mb-6">
                    <Shield className="h-6 w-6 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-slate-900">Certifications</h2>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 mb-4">
                    {profile.profile.certifications.map((cert, index) => (
                      <span key={index} className="flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-xl font-semibold">
                        {cert}
                        <button
                          onClick={() => removeItem('certifications', index)}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newCertification}
                      onChange={(e) => {
                        setNewCertification(e.target.value)
                        validateField('newCertification', e.target.value)
                      }}
                      onBlur={() => handleFieldBlur('newCertification')}
                      placeholder="Add a certification"
                      className={`flex-1 px-4 py-3 bg-white border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                        errors.newCertification && touched.newCertification ? 'border-red-500' : 'border-slate-200'
                      }`}
                      onKeyPress={(e) => e.key === 'Enter' && addItem('certifications', newCertification)}
                    />
                    {errors.newCertification && touched.newCertification && (
                      <p className="text-red-500 text-sm mt-1">{errors.newCertification}</p>
                    )}
                    <button
                      onClick={() => addItem('certifications', newCertification)}
                      className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors duration-200 font-semibold"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Highlights */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                  <div className="flex items-center mb-6">
                    <Star className="h-6 w-6 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-slate-900">Key Highlights</h2>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 mb-4">
                    {profile.profile.highlights.map((highlight, index) => (
                      <span key={index} className="flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-xl font-semibold">
                        {highlight}
                        <button
                          onClick={() => removeItem('highlights', index)}
                          className="ml-2 text-yellow-600 hover:text-yellow-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newHighlight}
                      onChange={(e) => {
                        setNewHighlight(e.target.value)
                        validateField('newHighlight', e.target.value)
                      }}
                      onBlur={() => handleFieldBlur('newHighlight')}
                      placeholder="Add a highlight"
                      className={`flex-1 px-4 py-3 bg-white border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                        errors.newHighlight && touched.newHighlight ? 'border-red-500' : 'border-slate-200'
                      }`}
                      onKeyPress={(e) => e.key === 'Enter' && addItem('highlights', newHighlight)}
                    />
                    {errors.newHighlight && touched.newHighlight && (
                      <p className="text-red-500 text-sm mt-1">{errors.newHighlight}</p>
                    )}
                    <button
                      onClick={() => addItem('highlights', newHighlight)}
                      className="px-6 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors duration-200 font-semibold"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Save Button for Profile */}
                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Profile Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                <div className="flex items-center mb-6">
                  <Briefcase className="h-6 w-6 text-blue-600 mr-3" />
                  <h2 className="text-2xl font-bold text-slate-900">Service Management</h2>
                </div>
                <p className="text-slate-600 mb-8">Manage your tour services and offerings.</p>
                
                <div className="text-center py-12">
                  <Briefcase className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">Service Management</h3>
                  <p className="text-slate-500">This feature will be available soon. You'll be able to manage your tour packages and services here.</p>
                </div>

                {/* Save Button for Services */}
                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleSaveServices}
                    disabled={saving}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Services Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                <div className="flex items-center mb-6">
                  <DollarSign className="h-6 w-6 text-blue-600 mr-3" />
                  <h2 className="text-2xl font-bold text-slate-900">Pricing</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Price Per Day (LKR)</label>
                    <input
                      type="number"
                      min="1000"
                      max="100000"
                      value={profile.profile.pricePerDay}
                      onChange={(e) => setProfile(prev => ({ 
                        ...prev, 
                        profile: { ...prev.profile, pricePerDay: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter price per day"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Availability Status</label>
                    <select
                      value={profile.profile.availability}
                      onChange={(e) => setProfile(prev => ({ 
                        ...prev, 
                        profile: { ...prev.profile, availability: e.target.value }
                      }))}
                      className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value="Available">Available</option>
                      <option value="Busy">Busy</option>
                      <option value="Unavailable">Unavailable</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="flex items-center mb-2">
                    <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-lg font-semibold text-green-800">Current Pricing</span>
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    LKR {profile.profile.pricePerDay.toLocaleString()}
                  </div>
                  <p className="text-green-700">per day</p>
                </div>

                {/* Save Button for Pricing */}
                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleSavePricing}
                    disabled={saving}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Pricing Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Availability Tab */}
            {activeTab === 'availability' && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                <div className="flex items-center mb-6">
                  <Calendar className="h-6 w-6 text-blue-600 mr-3" />
                  <h2 className="text-2xl font-bold text-slate-900">Availability</h2>
                </div>
                <p className="text-slate-600 mb-8">Manage your availability and schedule.</p>
                
                <div className="space-y-8">
                  {/* Working Days */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Working Days</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                        <button
                          key={day}
                          onClick={() => toggleWorkingDay(day)}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                            availability.workingDays.includes(day)
                              ? 'bg-blue-500 border-blue-500 text-white'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                          }`}
                        >
                          <span className="capitalize font-medium">{day}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Working Hours */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Working Hours</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Start Time</label>
                        <input
                          type="time"
                          value={availability.workingHours.start}
                          onChange={(e) => setAvailability(prev => ({
                            ...prev,
                            workingHours: { ...prev.workingHours, start: e.target.value }
                          }))}
                          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">End Time</label>
                        <input
                          type="time"
                          value={availability.workingHours.end}
                          onChange={(e) => setAvailability(prev => ({
                            ...prev,
                            workingHours: { ...prev.workingHours, end: e.target.value }
                          }))}
                          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Booking Limits */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Booking Limits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Max Bookings Per Day</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={availability.maxBookingsPerDay}
                          onChange={(e) => setAvailability(prev => ({
                            ...prev,
                            maxBookingsPerDay: parseInt(e.target.value) || 1
                          }))}
                          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Advance Booking Days</label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={availability.advanceBookingDays}
                          onChange={(e) => setAvailability(prev => ({
                            ...prev,
                            advanceBookingDays: parseInt(e.target.value) || 30
                          }))}
                          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Blocked Dates */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Blocked Dates</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative calendar-container">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                          <button
                            type="button"
                            onClick={() => setShowCalendar(!showCalendar)}
                            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-left flex items-center justify-between"
                          >
                            <span className={blockoutDate ? 'text-slate-900' : 'text-slate-500'}>
                              {blockoutDate ? formatDate(blockoutDate) : 'Select a date'}
                            </span>
                            <Calendar className="h-5 w-5 text-slate-400" />
                          </button>
                          
                          {/* Calendar Dropdown */}
                          {showCalendar && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-lg z-10 p-4">
                              {/* Calendar Header */}
                              <div className="flex items-center justify-between mb-4">
                                <button
                                  onClick={() => navigateMonth('prev')}
                                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                  <ChevronDown className="h-4 w-4 rotate-90" />
                                </button>
                                <h4 className="text-lg font-semibold text-slate-900">
                                  {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </h4>
                                <button
                                  onClick={() => navigateMonth('next')}
                                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                  <ChevronDown className="h-4 w-4 -rotate-90" />
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
                                {renderCalendar()}
                              </div>
                              
                              {/* Calendar Legend */}
                              <div className="mt-4 pt-4 border-t border-slate-200">
                                <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
                                  <div className="flex items-center">
                                    <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
                                    Selected
                                  </div>
                                  <div className="flex items-center">
                                    <div className="w-3 h-3 bg-red-100 rounded mr-1"></div>
                                    Blocked
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
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
                          <input
                            type="text"
                            value={blockoutReason}
                            onChange={(e) => setBlockoutReason(e.target.value)}
                            placeholder="e.g., Personal leave, Holiday"
                            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          />
                        </div>
                      </div>
                      <button
                        onClick={addBlockedDate}
                        disabled={!blockoutDate || !blockoutReason.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Blocked Date
                      </button>
                    </div>

                    {/* Blocked Dates List */}
                    {availability.blockedDates.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {availability.blockedDates.map((blockout, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div>
                              <span className="font-medium text-red-800">{formatDate(blockout.date)}</span>
                              <span className="text-red-600 ml-2">- {blockout.reason}</span>
                            </div>
                            <button
                              onClick={() => removeBlockedDate(index)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Save Button for Availability */}
                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleSaveAvailability}
                    disabled={saving}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Availability Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-lg p-8 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">Performance Analytics</h2>
                      <p className="text-green-100 text-lg">
                        Track your performance and generate detailed reports
                      </p>
                    </div>
                    <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                      <BarChart3 className="h-10 w-10 text-white" />
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="text-2xl font-bold text-slate-900">{guideStats.activeBookings}</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Total Bookings</h3>
                    <p className="text-sm text-slate-600">All-time bookings</p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                      <span className="text-2xl font-bold text-slate-900">LKR {guideStats.totalEarnings.toLocaleString()}</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Total Earnings</h3>
                    <p className="text-sm text-slate-600">All-time earnings</p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <Star className="h-6 w-6 text-yellow-600" />
                      </div>
                      <span className="text-2xl font-bold text-slate-900">{guideStats.averageRating}</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Average Rating</h3>
                    <p className="text-sm text-slate-600">Customer satisfaction</p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                      <span className="text-2xl font-bold text-slate-900">95%</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Success Rate</h3>
                    <p className="text-sm text-slate-600">Completed tours</p>
                  </div>
                </div>

                {/* Report Generation Section */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">Generate Reports</h3>
                      <p className="text-slate-600">Create detailed PDF reports of your performance and bookings</p>
                    </div>
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                      <FileText className="h-8 w-8 text-green-600" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Overview Report */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                          <BarChart3 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">Overview Report</h4>
                          <p className="text-sm text-slate-600">Complete performance summary</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleGeneratePDFReport('overview', '30d')}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </button>
                    </div>

                    {/* Bookings Report */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">Bookings Report</h4>
                          <p className="text-sm text-slate-600">Detailed booking analysis</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleGeneratePDFReport('bookings', '30d')}
                        className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </button>
                    </div>

                    {/* Earnings Report */}
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mr-4">
                          <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">Earnings Report</h4>
                          <p className="text-sm text-slate-600">Financial performance analysis</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleGeneratePDFReport('earnings', '30d')}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </button>
                    </div>

                    {/* Reviews Report */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                          <Star className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">Reviews Report</h4>
                          <p className="text-sm text-slate-600">Customer feedback analysis</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleGeneratePDFReport('reviews', '30d')}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </button>
                    </div>

                    {/* Performance Report */}
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center mr-4">
                          <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">Performance Report</h4>
                          <p className="text-sm text-slate-600">Comprehensive performance metrics</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleGeneratePDFReport('performance', '30d')}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </button>
                    </div>

                    {/* Custom Period Report */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center mr-4">
                          <Settings className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">Custom Report</h4>
                          <p className="text-sm text-slate-600">Choose your time period</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <button 
                          onClick={() => handleGeneratePDFReport('overview', '7d')}
                          className="w-full bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          7 Days
                        </button>
                        <button 
                          onClick={() => handleGeneratePDFReport('overview', '90d')}
                          className="w-full bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          90 Days
                        </button>
                        <button 
                          onClick={() => handleGeneratePDFReport('overview', '1y')}
                          className="w-full bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          1 Year
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Booking Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Cancel Booking</h3>
                </div>
                <button
                  onClick={closeCancelModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to cancel this booking? This action cannot be undone.
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cancellation Reason (Optional)
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={3}
                    placeholder="Please provide a reason for cancellation..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeCancelModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Keep Booking
                </button>
                <button
                  onClick={() => handleCancelBooking(bookingToCancel)}
                  disabled={cancellingBooking !== null}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancellingBooking !== null ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GuideDashboard


