import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import staffService from '../../services/staff/staffService'
import api from '../../services/api'
import toast from 'react-hot-toast'
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
  Car,
  Building,
  UserCheck,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Filter,
  Search,
  Download,
  RefreshCw,
  Activity,
  Target,
  Zap,
  Package,
  ClipboardList,
  UserPlus,
  Building2,
  Car as CarIcon,
  Map,
  Navigation,
  Compass,
  Flag,
  CheckSquare,
  Square,
  AlertTriangle,
  Info,
  ExternalLink,
  MoreHorizontal,
  Edit,
  Trash,
  Copy,
  Share,
  Archive,
  Ban,
  Unlock,
  Lock,
  EyeOff,
  Send,
  Reply,
  Flag as FlagIcon,
  Star as StarIcon,
  ThumbsUp as ThumbsUpIcon,
  ThumbsDown as ThumbsDownIcon,
  MessageSquare as MessageSquareIcon,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  MapPin as MapPinIcon,
  Users as UsersIcon,
  TrendingUp as TrendingUpIcon,
  BarChart3 as BarChart3Icon,
  PieChart,
  LineChart,
  Activity as ActivityIcon,
  Zap as ZapIcon,
  Target as TargetIcon,
  Award as AwardIcon,
  Shield as ShieldIcon,
  Globe as GlobeIcon,
  Camera as CameraIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  RefreshCw as RefreshCwIcon,
  Filter as FilterIcon,
  Search as SearchIcon,
  Plus as PlusIcon,
  X as XIcon,
  CheckCircle as CheckCircleIcon,
  AlertCircle as AlertCircleIcon,
  Info as InfoIcon,
  ExternalLink as ExternalLinkIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Edit as EditIcon,
  Trash as TrashIcon,
  Copy as CopyIcon,
  Share as ShareIcon,
  Archive as ArchiveIcon,
  Ban as BanIcon,
  Unlock as UnlockIcon,
  Lock as LockIcon,
  EyeOff as EyeOffIcon,
  Send as SendIcon,
  Reply as ReplyIcon,
  FlagIcon as FlagIconIcon,
  StarIcon as StarIconIcon,
  ThumbsUpIcon as ThumbsUpIconIcon,
  ThumbsDownIcon as ThumbsDownIconIcon,
  MessageSquareIcon as MessageSquareIconIcon,
  ClockIcon as ClockIconIcon,
  CalendarIcon as CalendarIconIcon,
  MapPinIcon as MapPinIconIcon,
  UsersIcon as UsersIconIcon,
  TrendingUpIcon as TrendingUpIconIcon,
  BarChart3Icon as BarChart3IconIcon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  ActivityIcon as ActivityIconIcon,
  ZapIcon as ZapIconIcon,
  TargetIcon as TargetIconIcon,
  AwardIcon as AwardIconIcon,
  ShieldIcon as ShieldIconIcon,
  GlobeIcon as GlobeIconIcon,
  CameraIcon as CameraIconIcon,
  UploadIcon as UploadIconIcon,
  DownloadIcon as DownloadIconIcon,
  RefreshCwIcon as RefreshCwIconIcon,
  FilterIcon as FilterIconIcon,
  SearchIcon as SearchIconIcon,
  PlusIcon as PlusIconIcon,
  XIcon as XIconIcon,
  CheckCircleIcon as CheckCircleIconIcon,
  AlertCircleIcon as AlertCircleIconIcon,
  InfoIcon as InfoIconIcon,
  ExternalLinkIcon as ExternalLinkIconIcon,
  MoreHorizontalIcon as MoreHorizontalIconIcon,
  EditIcon as EditIconIcon,
  TrashIcon as TrashIconIcon,
  CopyIcon as CopyIconIcon,
  ShareIcon as ShareIconIcon,
  ArchiveIcon as ArchiveIconIcon,
  BanIcon as BanIconIcon,
  UnlockIcon as UnlockIconIcon,
  LockIcon as LockIconIcon,
  EyeOffIcon as EyeOffIconIcon,
  SendIcon as SendIconIcon,
  ReplyIcon as ReplyIconIcon
} from 'lucide-react'
import TripManagement from './components/TripManagement'
import CustomTripApproval from './components/CustomTripApproval'
import HotelManagement from './components/HotelManagement'
import GuideManagement from './components/GuideManagement'
import DriverVehicleManagement from './components/DriverVehicleManagement'
import SupportManagement from './components/SupportManagement'
import ReviewManagement from './components/ReviewManagement'
import AnalyticsManagement from './components/AnalyticsManagement'
import ApprovalManagement from '../../components/staff/management/ApprovalManagement'
import BookingManagement from '../../components/staff/management/BookingManagement'

const StaffDashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, isLoading, navigate])
  
  // Staff stats
  const [staffStats, setStaffStats] = useState({
    pendingApprovals: 0,
    totalUsers: 0,
    activeBookings: 0,
    pendingReviews: 0,
    supportTickets: 0,
    newGuides: 0,
    newHotels: 0
  })
  const [dashboardLoading, setDashboardLoading] = useState(true)

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
    
    if (user.role !== 'staff' && user.role !== 'admin') {
      navigate('/dashboard')
      return
    }
  }, [isLoading, isAuthenticated, user, navigate])

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated || isLoading) return
      
      try {
        setDashboardLoading(true)
        const response = await staffService.getDashboardOverview()
        
        if (response.success) {
          const data = response.data.stats
          setStaffStats({
            pendingApprovals: data.pendingApprovals || 0,
            totalUsers: data.totalUsers || 0,
            activeBookings: data.activeBookings || 0,
            pendingReviews: data.pendingReviews || 0,
            supportTickets: data.supportTickets || 0,
            newGuides: data.newGuides || 0,
            newHotels: data.newHotels || 0
          })
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setDashboardLoading(false)
      }
    }

    fetchDashboardData()
  }, [isAuthenticated, isLoading])

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

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // PDF Report generation
  const handleGeneratePDFReport = async (reportType = 'overview', period = '30d') => {
    try {
      toast.loading('Generating PDF report...', { id: 'pdf-report' });
      
      const response = await api.post('/staff/reports/generate', {
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
          link.download = response.data.filename || `staff-report-${new Date().toISOString().split('T')[0]}.pdf`;
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
    { id: 'approvals', label: 'Approvals', icon: CheckCircle },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'trips', label: 'Trip Management', icon: Map },
    { id: 'custom-trips', label: 'Custom Trips', icon: Compass },
    { id: 'drivers', label: 'Driver Management', icon: UserCheck },
    { id: 'guides', label: 'Guides', icon: UserCheck },
    { id: 'hotels', label: 'Hotels', icon: Building },
    { id: 'support', label: 'Support', icon: Headphones },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ]

  const handleTabClick = (tabId) => {
    setActiveTab(tabId)
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Loading Staff Dashboard</h2>
          <p className="text-slate-500">Please wait while we verify your access...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Staff Dashboard</h1>
                <p className="text-slate-600">Manage and oversee platform operations</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Site
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
                      <p className="text-xs text-blue-600 font-medium">Staff Member</p>
                    </div>
                    <button
                      onClick={() => {
                        navigate('/')
                        setIsProfileDropdownOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 mr-3" />
                      View Site
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
                        Welcome back, {user?.firstName}!
                      </h2>
                      <p className="text-blue-100 text-lg">
                        Manage and oversee the SerendibGo platform operations
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleGeneratePDFReport('overview', '30d')}
                        className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Generate Report</span>
                      </button>
                      <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Shield className="h-10 w-10 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Clock className="h-6 w-6 text-orange-600" />
                      </div>
                      <span className="text-2xl font-bold text-slate-900">
                        {dashboardLoading ? (
                          <div className="w-8 h-6 bg-slate-200 rounded animate-pulse"></div>
                        ) : (
                          staffStats.pendingApprovals
                        )}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Pending Approvals</h3>
                    <p className="text-sm text-slate-600">Items awaiting review</p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <span className="text-2xl font-bold text-slate-900">
                        {dashboardLoading ? (
                          <div className="w-8 h-6 bg-slate-200 rounded animate-pulse"></div>
                        ) : (
                          staffStats.totalUsers
                        )}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Total Users</h3>
                    <p className="text-sm text-slate-600">Registered platform users</p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="text-2xl font-bold text-slate-900">
                        {dashboardLoading ? (
                          <div className="w-8 h-6 bg-slate-200 rounded animate-pulse"></div>
                        ) : (
                          staffStats.activeBookings
                        )}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Active Bookings</h3>
                    <p className="text-sm text-slate-600">Current reservations</p>
                  </div>
                </div>

                {/* Additional Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      </div>
                      <span className="text-2xl font-bold text-slate-900">
                        {dashboardLoading ? (
                          <div className="w-8 h-6 bg-slate-200 rounded animate-pulse"></div>
                        ) : (
                          staffStats.supportTickets
                        )}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Support Tickets</h3>
                    <p className="text-sm text-slate-600">Open support requests</p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <Star className="h-6 w-6 text-yellow-600" />
                      </div>
                      <span className="text-2xl font-bold text-slate-900">
                        {dashboardLoading ? (
                          <div className="w-8 h-6 bg-slate-200 rounded animate-pulse"></div>
                        ) : (
                          staffStats.pendingReviews
                        )}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Pending Reviews</h3>
                    <p className="text-sm text-slate-600">Reviews awaiting moderation</p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <UserCheck className="h-6 w-6 text-indigo-600" />
                      </div>
                      <span className="text-2xl font-bold text-slate-900">
                        {dashboardLoading ? (
                          <div className="w-8 h-6 bg-slate-200 rounded animate-pulse"></div>
                        ) : (
                          staffStats.newGuides
                        )}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Active Guides</h3>
                    <p className="text-sm text-slate-600">Verified tour guides</p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                        <Building className="h-6 w-6 text-teal-600" />
                      </div>
                      <span className="text-2xl font-bold text-slate-900">
                        {dashboardLoading ? (
                          <div className="w-8 h-6 bg-slate-200 rounded animate-pulse"></div>
                        ) : (
                          staffStats.newHotels
                        )}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Active Hotels</h3>
                    <p className="text-sm text-slate-600">Verified hotel partners</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                  <div className="flex items-center mb-6">
                    <Zap className="h-6 w-6 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-slate-900">Quick Actions</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <button
                      onClick={() => setActiveTab('custom-trips')}
                      className="p-6 border-2 border-slate-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all duration-200 text-left group"
                    >
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                        <Compass className="h-6 w-6 text-orange-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">Review Custom Trips</h3>
                      <p className="text-sm text-slate-600">Approve or reject custom trip requests</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('guides')}
                      className="p-6 border-2 border-slate-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-200 text-left group"
                    >
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                        <UserCheck className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">Manage Guides</h3>
                      <p className="text-sm text-slate-600">Approve and manage guide applications</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('hotels')}
                      className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left group"
                    >
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                        <Building className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">Manage Hotels</h3>
                      <p className="text-sm text-slate-600">Approve and manage hotel listings</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('support')}
                      className="p-6 border-2 border-slate-200 rounded-xl hover:border-yellow-500 hover:bg-yellow-50 transition-all duration-200 text-left group"
                    >
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-yellow-200 transition-colors">
                        <Headphones className="h-6 w-6 text-yellow-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">Support Tickets</h3>
                      <p className="text-sm text-slate-600">Handle customer support requests</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('reviews')}
                      className="p-6 border-2 border-slate-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition-all duration-200 text-left group"
                    >
                      <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-cyan-200 transition-colors">
                        <Star className="h-6 w-6 text-cyan-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">Review Moderation</h3>
                      <p className="text-sm text-slate-600">Moderate user reviews and ratings</p>
                    </button>
                  </div>
                </div>

                {/* System Health Indicators */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                  <div className="flex items-center mb-6">
                    <Shield className="h-6 w-6 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-slate-900">System Health</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="flex items-center p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">Database Status</h3>
                        <p className="text-sm text-slate-600">All systems operational</p>
                      </div>
                      <span className="text-sm text-green-600 font-medium">Healthy</span>
                    </div>

                    <div className="flex items-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <Globe className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">API Response Time</h3>
                        <p className="text-sm text-slate-600">Average: 120ms</p>
                      </div>
                      <span className="text-sm text-blue-600 font-medium">Good</span>
                    </div>

                    <div className="flex items-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">Server Load</h3>
                        <p className="text-sm text-slate-600">CPU: 45% | Memory: 62%</p>
                      </div>
                      <span className="text-sm text-yellow-600 font-medium">Moderate</span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                  <div className="flex items-center mb-6">
                    <Activity className="h-6 w-6 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-slate-900">Recent Activity</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center p-4 bg-orange-50 rounded-xl border border-orange-200">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                        <Compass className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">New custom trip request</h3>
                        <p className="text-sm text-slate-600">7-day cultural tour of Kandy and Anuradhapura</p>
                      </div>
                      <span className="text-sm text-slate-500">2 hours ago</span>
                    </div>

                    <div className="flex items-center p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                        <UserCheck className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">Guide application approved</h3>
                        <p className="text-sm text-slate-600">Sarah Perera - Wildlife specialist</p>
                      </div>
                      <span className="text-sm text-slate-500">4 hours ago</span>
                    </div>

                    <div className="flex items-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <Building className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">Hotel listing updated</h3>
                        <p className="text-sm text-slate-600">Colombo Grand Hotel - New room types added</p>
                      </div>
                      <span className="text-sm text-slate-500">6 hours ago</span>
                    </div>

                    <div className="flex items-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                        <Headphones className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">Support ticket resolved</h3>
                        <p className="text-sm text-slate-600">Booking cancellation issue - Ticket #ST-2024-001</p>
                      </div>
                      <span className="text-sm text-slate-500">1 day ago</span>
                    </div>
                  </div>
                </div>

                {/* Performance Charts */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                  <div className="flex items-center mb-6">
                    <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-slate-900">Performance Overview</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                    {/* User Growth Chart Placeholder */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">User Growth</h3>
                      <div className="h-48 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                        <div className="text-center">
                          <Users className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                          <p className="text-slate-500">Chart will be implemented</p>
                          <p className="text-sm text-slate-400">User analytics coming soon</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Report Generation Section */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Generate Reports</h3>
                    <p className="text-slate-600">Create comprehensive PDF reports for different aspects of your operations</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Overview Report */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                          <BarChart3 className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-sm font-medium text-blue-600">Overview</span>
                      </div>
                      <h4 className="font-semibold text-slate-900 mb-2">Overview Report</h4>
                      <p className="text-sm text-slate-600 mb-4">Complete performance summary with key metrics and trends</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleGeneratePDFReport('overview', '30d')}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          30 Days
                        </button>
                        <button
                          onClick={() => handleGeneratePDFReport('overview', '90d')}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          90 Days
                        </button>
                      </div>
                    </div>

                    {/* Approvals Report */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-sm font-medium text-orange-600">Approvals</span>
                      </div>
                      <h4 className="font-semibold text-slate-900 mb-2">Approvals Report</h4>
                      <p className="text-sm text-slate-600 mb-4">Detailed analysis of approval processes and processing times</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleGeneratePDFReport('approvals', '30d')}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          30 Days
                        </button>
                        <button
                          onClick={() => handleGeneratePDFReport('approvals', '90d')}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          90 Days
                        </button>
                      </div>
                    </div>

                    {/* Bookings Report */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-sm font-medium text-green-600">Bookings</span>
                      </div>
                      <h4 className="font-semibold text-slate-900 mb-2">Bookings Report</h4>
                      <p className="text-sm text-slate-600 mb-4">Comprehensive booking analysis and customer insights</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleGeneratePDFReport('bookings', '30d')}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          30 Days
                        </button>
                        <button
                          onClick={() => handleGeneratePDFReport('bookings', '90d')}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          90 Days
                        </button>
                      </div>
                    </div>

                    {/* Support Report */}
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                          <Headphones className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-sm font-medium text-red-600">Support</span>
                      </div>
                      <h4 className="font-semibold text-slate-900 mb-2">Support Report</h4>
                      <p className="text-sm text-slate-600 mb-4">Customer support metrics and ticket resolution analysis</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleGeneratePDFReport('support', '30d')}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          30 Days
                        </button>
                        <button
                          onClick={() => handleGeneratePDFReport('support', '90d')}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          90 Days
                        </button>
                      </div>
                    </div>

                    {/* Performance Report */}
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center">
                          <Activity className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-sm font-medium text-indigo-600">Performance</span>
                      </div>
                      <h4 className="font-semibold text-slate-900 mb-2">Performance Report</h4>
                      <p className="text-sm text-slate-600 mb-4">Staff performance metrics and productivity analysis</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleGeneratePDFReport('performance', '30d')}
                          className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          30 Days
                        </button>
                        <button
                          onClick={() => handleGeneratePDFReport('performance', '90d')}
                          className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          90 Days
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Approval Management Tab */}
            {activeTab === 'approvals' && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                <ApprovalManagement />
              </div>
            )}

            {/* Booking Management Tab */}
            {activeTab === 'bookings' && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                <BookingManagement />
              </div>
            )}

            {/* Trip Management Tab */}
            {activeTab === 'trips' && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                <TripManagement />
              </div>
            )}

            {/* Custom Trip Approval Tab */}
            {activeTab === 'custom-trips' && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                <CustomTripApproval />
              </div>
            )}

            {/* Hotel Management Tab */}
            {activeTab === 'hotels' && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                <HotelManagement />
              </div>
            )}

            {/* Guide Management Tab */}
            {activeTab === 'guides' && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                <GuideManagement />
              </div>
            )}

            {/* Driver Management Tab */}
            {activeTab === 'drivers' && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                <DriverVehicleManagement />
              </div>
            )}

            {/* Support Management Tab */}
            {activeTab === 'support' && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                <SupportManagement />
              </div>
            )}

            {/* Review Management Tab */}
            {activeTab === 'reviews' && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                <ReviewManagement />
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                <AnalyticsManagement />
              </div>
            )}

            {/* Other tabs will be implemented in separate components */}
            {activeTab !== 'overview' && activeTab !== 'approvals' && activeTab !== 'bookings' && activeTab !== 'trips' && activeTab !== 'custom-trips' && activeTab !== 'hotels' && activeTab !== 'guides' && activeTab !== 'drivers' && activeTab !== 'support' && activeTab !== 'reviews' && activeTab !== 'analytics' && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Settings className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">
                    {tabs.find(tab => tab.id === activeTab)?.label} Management
                  </h3>
                  <p className="text-slate-500">
                    This section is under development. The {tabs.find(tab => tab.id === activeTab)?.label.toLowerCase()} management interface will be available soon.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffDashboard
