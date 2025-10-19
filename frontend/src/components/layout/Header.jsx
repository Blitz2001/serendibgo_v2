import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  Settings,
  Headphones,
  Bell,
  Eye,
  LogIn
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const { user, logout, isAuthenticated } = useAuth()
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
      setIsProfileDropdownOpen(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleProfileSettings = () => {
    // Navigate based on user role
    if (user?.role === 'guide') {
      navigate('/guide/settings')
    } else if (user?.role === 'admin') {
      navigate('/admin/settings')
    } else if (user?.role === 'staff') {
      navigate('/staff')
    } else if (user?.role === 'hotel_owner') {
      navigate('/hotel-owner')
    } else if (user?.role === 'driver') {
      navigate('/driver')
    } else if (user?.role === 'vehicle_owner') {
      navigate('/vehicle-owner')
    } else {
      navigate('/profile')
    }
    setIsProfileDropdownOpen(false)
  }

  const handleSupport = () => {
    // Navigate based on user role
    if (user?.role === 'guide') {
      navigate('/guide-support')
    } else {
      // For regular users, navigate to a general support page or contact page
      navigate('/contact')
    }
    setIsProfileDropdownOpen(false)
  }

  const handleNotifications = () => {
    // Navigate based on user role
    if (user?.role === 'guide') {
      navigate('/guide-notifications')
    } else {
      // For regular users, navigate to a general notifications page
      navigate('/notifications')
    }
    setIsProfileDropdownOpen(false)
  }

  const handleViewPublicProfile = () => {
    // Navigate to public profile view
    if (user?.role === 'guide') {
      navigate(`/guides/${user.id}`)
    } else {
      // For regular users, show their public profile or a placeholder
      navigate('/profile')
    }
    setIsProfileDropdownOpen(false)
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  const isHomePage = location.pathname === '/'
  const navClassName = "bg-white/50 backdrop-blur-sm absolute top-0 left-0 right-0 z-50"
  
  const textColor = 'text-[#272C2F]'
  const hoverColor = 'hover:text-[#E59B2C]'

  return (
    <>
      {/* Main Navigation */}
      <nav className={navClassName}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Left Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                to="/" 
                className={`font-semibold transition-colors ${
                  isActive('/') ? textColor : `${textColor} ${hoverColor}`
                }`}
              >
                HOME
              </Link>
              <Link 
                to="/tours" 
                className={`font-semibold transition-colors ${
                  isActive('/tours') ? textColor : `${textColor} ${hoverColor}`
                }`}
              >
                TOURS
              </Link>
              <Link 
                to="/guides" 
                className={`font-semibold transition-colors ${
                  isActive('/guides') ? textColor : `${textColor} ${hoverColor}`
                }`}
              >
                GUIDES
              </Link>
              <Link 
                to="/hotels" 
                className={`font-semibold transition-colors ${
                  isActive('/hotels') ? textColor : `${textColor} ${hoverColor}`
                }`}
              >
                HOTELS
              </Link>
            </div>

            {/* Center Brand Name */}
            <div className="text-center">
              <span className={`font-bold text-3xl drop-shadow-lg ${textColor}`} style={{ fontFamily: 'Georgia, serif' }}>SERENDIB</span>
              <span className="font-bold text-3xl ml-2 drop-shadow-lg text-[#E59B2C]" style={{ fontFamily: 'Georgia, serif' }}>GO</span>
            </div>

            {/* Right Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                to="/vehicles" 
                className={`font-semibold transition-colors ${
                  isActive('/vehicles') ? textColor : `${textColor} ${hoverColor}`
                }`}
              >
                VEHICLES
              </Link>
              <Link 
                to="/custom-trip" 
                className={`font-semibold transition-colors ${
                  isActive('/custom-trip') ? textColor : `${textColor} ${hoverColor}`
                }`}
              >
                CUSTOM TRIP
              </Link>
              <Link 
                to="/my-bookings" 
                className={`font-semibold transition-colors ${
                  isActive('/my-bookings') ? textColor : `${textColor} ${hoverColor}`
                }`}
              >
                MY BOOKINGS
              </Link>
              {isAuthenticated ? (
                <div className="flex items-center space-x-4" ref={dropdownRef}>
                  <div className="flex items-center space-x-2">
                    <User className={`w-5 h-5 ${textColor}`} />
                    <span className={`${textColor} font-semibold`}>
                      {user?.name || user?.firstName || 'User'}
                    </span>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${textColor}`}
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {isProfileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                        {/* User Info Section */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="font-semibold text-gray-900">
                            {user?.firstName && user?.lastName 
                              ? `${user.firstName} ${user.lastName}` 
                              : user?.name || 'User'}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {user?.email || 'user@example.com'}
                          </div>
                        </div>
                        
                        {/* Menu Items */}
                        <div className="py-2">
                          <button
                            onClick={() => {
                              // Navigate to appropriate dashboard based on role
                              if (user?.role === 'guide') {
                                navigate('/guide')
                              } else if (user?.role === 'admin') {
                                navigate('/admin')
                              } else if (user?.role === 'staff') {
                                navigate('/staff')
                              } else if (user?.role === 'hotel_owner') {
                                navigate('/hotel-owner')
                              } else if (user?.role === 'driver') {
                                navigate('/driver')
                              } else if (user?.role === 'vehicle_owner') {
                                navigate('/vehicle-owner')
                              } else {
                                navigate('/dashboard')
                              }
                              setIsProfileDropdownOpen(false)
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <User className="w-4 h-4 text-gray-500" />
                            <span>Dashboard</span>
                          </button>
                          
                          <button
                            onClick={handleViewPublicProfile}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                            <span>View Public Profile</span>
                          </button>
                          
                          <button
                            onClick={handleProfileSettings}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Settings className="w-4 h-4 text-gray-500" />
                            <span>Profile Settings</span>
                          </button>
                          
                          <button
                            onClick={handleSupport}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Headphones className="w-4 h-4 text-gray-500" />
                            <span>Support</span>
                          </button>
                          
                          <button
                            onClick={handleNotifications}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Bell className="w-4 h-4 text-gray-500" />
                            <span>Notifications</span>
                          </button>
                        </div>
                        
                        {/* Logout Section */}
                        <div className="border-t border-gray-100 pt-2">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4 text-red-500" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors ${textColor}`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span className="font-medium">LOGIN</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className={`md:hidden p-2 ${textColor}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden bg-white/50 backdrop-blur-sm border-t border-gray-200 py-4 rounded-b-lg">
              <div className="flex flex-col space-y-4">
                <Link 
                  to="/" 
                  className={`font-semibold transition-colors px-4 ${
                    isActive('/') ? textColor : `${textColor} ${hoverColor}`
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  HOME
                </Link>
                <Link 
                  to="/tours" 
                  className={`font-semibold transition-colors px-4 ${
                    isActive('/tours') ? textColor : `${textColor} ${hoverColor}`
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  TOURS
                </Link>
                <Link 
                  to="/guides" 
                  className={`font-semibold transition-colors px-4 ${
                    isActive('/guides') ? textColor : `${textColor} ${hoverColor}`
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  GUIDES
                </Link>
                <Link 
                  to="/hotels" 
                  className={`font-semibold transition-colors px-4 ${
                    isActive('/hotels') ? textColor : `${textColor} ${hoverColor}`
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  HOTELS
                </Link>
                <Link 
                  to="/vehicles" 
                  className={`font-semibold transition-colors px-4 ${
                    isActive('/vehicles') ? textColor : `${textColor} ${hoverColor}`
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  VEHICLES
                </Link>
                <Link 
                  to="/custom-trip" 
                  className={`font-semibold transition-colors px-4 ${
                    isActive('/custom-trip') ? textColor : `${textColor} ${hoverColor}`
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  CUSTOM TRIP
                </Link>
                <Link 
                  to="/my-bookings" 
                  className={`font-semibold transition-colors px-4 ${
                    isActive('/my-bookings') ? textColor : `${textColor} ${hoverColor}`
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  MY BOOKINGS
                </Link>
                {isAuthenticated ? (
                  <div className="px-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <User className={`w-5 h-5 ${textColor}`} />
                      <span className={`${textColor} font-semibold`}>
                        {user?.name || user?.firstName || 'User'}
                      </span>
                    </div>
                    
                    {/* Mobile Dropdown Menu */}
                    <div className="space-y-2">
                      <button
                        onClick={handleViewPublicProfile}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4 text-gray-500" />
                        <span>View Public Profile</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          // Navigate to appropriate dashboard based on role
                          if (user?.role === 'guide') {
                            navigate('/guide')
                          } else if (user?.role === 'admin') {
                            navigate('/admin')
                          } else if (user?.role === 'staff') {
                            navigate('/staff')
                          } else if (user?.role === 'hotel_owner') {
                            navigate('/hotel-owner')
                          } else if (user?.role === 'driver') {
                            navigate('/driver')
                          } else if (user?.role === 'vehicle_owner') {
                            navigate('/vehicle-owner')
                          } else {
                            navigate('/dashboard')
                          }
                          setIsMenuOpen(false)
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <User className="w-4 h-4 text-gray-500" />
                        <span>Dashboard</span>
                      </button>
                      
                      <button
                        onClick={handleProfileSettings}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Settings className="w-4 h-4 text-gray-500" />
                        <span>Profile Settings</span>
                      </button>
                      
                      <button
                        onClick={handleSupport}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Headphones className="w-4 h-4 text-gray-500" />
                        <span>Support</span>
                      </button>
                      
                      <button
                        onClick={handleNotifications}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Bell className="w-4 h-4 text-gray-500" />
                        <span>Notifications</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          handleLogout()
                          setIsMenuOpen(false)
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 space-y-3">
                    <Link
                      to="/login"
                      className="flex items-center space-x-3 px-3 py-2 text-left text-blue-600 hover:bg-blue-50 rounded-lg transition-colors w-full"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LogIn className="w-4 h-4" />
                      <span className="font-medium">LOGIN</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  )
}

export default Header