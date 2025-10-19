import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { 
  Users, 
  Calendar, 
  Car, 
  Hotel, 
  TrendingUp, 
  Settings,
  Shield,
  Activity,
  AlertCircle
} from 'lucide-react'

const AdminDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/admin/dashboard/stats')
      setStats(response.data.data)
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError('Failed to load dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0'
    return num.toLocaleString()
  }

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'Rs. 0'
    return `Rs. ${amount.toLocaleString()}`
  }

  const statsCards = stats ? [
    {
      title: 'Total Users',
      value: formatNumber(stats.overview.totalUsers),
      change: '+12%', // TODO: Calculate real change
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Total Hotels',
      value: formatNumber(stats.overview.totalHotels),
      change: '+3%', // TODO: Calculate real change
      icon: Hotel,
      color: 'text-orange-600'
    },
    {
      title: 'Total Bookings',
      value: formatNumber(stats.overview.totalBookings),
      change: '+5%', // TODO: Calculate real change
      icon: Calendar,
      color: 'text-green-600'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.revenue.totalRevenue),
      change: '+8%', // TODO: Calculate real change
      icon: TrendingUp,
      color: 'text-purple-600'
    },
    {
      title: 'Active Staff',
      value: formatNumber(stats.overview.totalStaff),
      change: '0%',
      icon: Shield,
      color: 'text-red-600'
    },
    {
      title: 'Pending Approvals',
      value: formatNumber(stats.pending.pendingHotels + stats.pending.pendingUsers),
      change: '0%',
      icon: AlertCircle,
      color: 'text-yellow-600'
    },
    {
      title: 'Hotel Owners',
      value: formatNumber(stats.overview.totalHotelOwners),
      change: '2%',
      icon: Hotel,
      color: 'text-indigo-600'
    },
    {
      title: 'Tourists',
      value: formatNumber(stats.overview.totalTourists),
      change: '2%',
      icon: Users,
      color: 'text-teal-600'
    }
  ] : []

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'View and manage user accounts',
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-500'
    },
    {
      title: 'Manage Bookings',
      description: 'Review and approve bookings',
      icon: Calendar,
      href: '/admin/bookings',
      color: 'bg-green-500'
    },
    {
      title: 'Vehicle Management',
      description: 'Approve and manage vehicles',
      icon: Car,
      href: '/admin/vehicles',
      color: 'bg-purple-500'
    },
    {
      title: 'Analytics',
      description: 'View platform analytics',
      icon: TrendingUp,
      href: '/admin/analytics',
      color: 'bg-orange-500'
    },
    {
      title: 'Staff Management',
      description: 'Manage staff accounts',
      icon: Shield,
      href: '/admin/staff',
      color: 'bg-red-500'
    },
    {
      title: 'Settings',
      description: 'Platform configuration',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-500'
    }
  ]

  return (
    <div className="min-h-screen bg-base-100 pt-0 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-base-content mb-4">
            Admin Dashboard
          </h1>
          <p className="text-xl text-base-content/70">
            Welcome back, {user?.firstName}! Manage your SerendibGo platform
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-base-200 rounded-lg p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-base-300 rounded mb-2"></div>
                    <div className="h-8 bg-base-300 rounded mb-2"></div>
                    <div className="h-3 bg-base-300 rounded w-16"></div>
                  </div>
                  <div className="p-3 rounded-full bg-base-300">
                    <div className="w-6 h-6 bg-base-300 rounded"></div>
                  </div>
                </div>
              </div>
            ))
          ) : error ? (
            // Error state
            <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-700 font-medium">{error}</p>
              <button 
                onClick={fetchDashboardStats}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            // Actual stats
            statsCards.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="bg-base-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-base-content/70">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-base-content">
                        {stat.value}
                      </p>
                      <p className="text-sm text-green-600">
                        {stat.change} from last month
                      </p>
                    </div>
                    <div className={`p-3 rounded-full bg-base-300`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-base-content mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <a
                  key={index}
                  href={action.href}
                  className="bg-base-200 rounded-lg p-6 hover:bg-base-300 transition-colors duration-200 group"
                >
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-full ${action.color} mr-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-base-content group-hover:text-primary">
                      {action.title}
                    </h3>
                  </div>
                  <p className="text-base-content/70">
                    {action.description}
                  </p>
                </a>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-base-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Activity className="w-5 h-5 text-base-content mr-2" />
            <h2 className="text-xl font-bold text-base-content">
              Recent Activity
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-base-300">
              <div>
                <p className="font-medium text-base-content">New user registration</p>
                <p className="text-sm text-base-content/70">John Doe registered as a guide</p>
              </div>
              <span className="text-sm text-base-content/70">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-base-300">
              <div>
                <p className="font-medium text-base-content">Vehicle approval</p>
                <p className="text-sm text-base-content/70">Toyota Camry approved for driver Sarah</p>
              </div>
              <span className="text-sm text-base-content/70">4 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-base-content">Booking completed</p>
                <p className="text-sm text-base-content/70">Hotel booking #12345 completed</p>
              </div>
              <span className="text-sm text-base-content/70">6 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
