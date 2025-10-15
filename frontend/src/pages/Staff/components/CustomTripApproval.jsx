import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  User,
  MessageSquare,
  FileText,
  AlertCircle,
  CheckSquare,
  Square,
  Send,
  Star,
  Globe,
  Camera,
  Heart,
  Award,
  Filter,
  Search,
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Archive,
  RefreshCw,
  Plus,
  Minus,
  Car,
  Building,
  UserCheck,
  Navigation,
  Bed,
  Utensils,
  ChevronDown,
  ChevronUp,
  Save,
  Edit3,
  Trash2
} from 'lucide-react'

const CustomTripApproval = () => {
  const navigate = useNavigate()
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [customTrips, setCustomTrips] = useState([])

  // Fetch custom trips from API
  useEffect(() => {
    fetchCustomTrips()
  }, [])

  const fetchCustomTrips = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/custom-trips', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setCustomTrips(data.data)
      } else {
        console.error('Error fetching custom trips:', data.message)
        setCustomTrips([])
      }
    } catch (error) {
      console.error('Error fetching custom trips:', error)
      setCustomTrips([])
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'in_review': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredTrips = customTrips.filter(trip => {
    const matchesSearch = trip.requestDetails?.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || trip.status === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Custom Trip Approval</h2>
          <p className="text-slate-600">Review and approve custom trip requests from customers</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={fetchCustomTrips}
            className="flex items-center px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Message */}
      {message.text && (
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
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search custom trips..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Custom Trips List */}
      <div className="space-y-4">
        {filteredTrips.map((trip, index) => {
          // Ensure we have a unique key
          const uniqueKey = trip._id || trip.id || `trip-${index}-${trip.customer?.email || 'unknown'}`;
          console.log('Trip key:', uniqueKey, 'Trip data:', trip);
          return (
          <div key={uniqueKey} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Custom Trip to {trip.requestDetails?.destination || 'Sri Lanka'}
                  </h3>
                  <p className="text-sm text-slate-600">
                    by {trip.customer?.firstName} {trip.customer?.lastName}
                  </p>
                  <p className="text-xs text-slate-500">{trip.customer?.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                  {trip.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center text-sm text-slate-600">
                <Clock className="h-4 w-4 mr-2" />
                {trip.requestDetails?.startDate && trip.requestDetails?.endDate 
                  ? Math.ceil((new Date(trip.requestDetails.endDate) - new Date(trip.requestDetails.startDate)) / (1000 * 60 * 60 * 24)) + ' days'
                  : 'Not specified'
                }
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <Users className="h-4 w-4 mr-2" />
                {trip.requestDetails?.groupSize || 1} people
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <DollarSign className="h-4 w-4 mr-2" />
                LKR {trip.requestDetails?.budget?.toLocaleString() || 'Not specified'}
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <Calendar className="h-4 w-4 mr-2" />
                {trip.requestDetails?.startDate ? new Date(trip.requestDetails.startDate).toLocaleDateString() : 'Not specified'}
              </div>
            </div>

            <p className="text-sm text-slate-700 mb-4 line-clamp-2">
              {trip.requestDetails?.specialRequests || 'No special requests specified'}
            </p>

            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">
                Requested on {new Date(trip.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedTrip(trip)
                    setShowDetailsModal(true)
                  }}
                  className="flex items-center px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </button>
                {trip.status === 'pending' && (
                  <React.Fragment key={`actions-${uniqueKey}`}>
                    <button
                      onClick={() => {
                        navigate(`/staff/custom-trips/${trip._id}/approve`, {
                          state: { trip, action: 'approved' }
                        })
                      }}
                      className="flex items-center px-3 py-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        navigate(`/staff/custom-trips/${trip._id}/approve`, {
                          state: { trip, action: 'rejected' }
                        })
                      }}
                      className="flex items-center px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                  </React.Fragment>
                )}
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {filteredTrips.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No custom trips found</h3>
          <p className="text-slate-500">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Trip Details Modal */}
      {showDetailsModal && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">{selectedTrip.title}</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Customer Information */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-3">Customer Information</h4>
                <div className="flex items-center space-x-4">
                  <img
                    src={selectedTrip.customer.avatar}
                    alt={selectedTrip.customer.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-slate-900">{selectedTrip.customer.name}</p>
                    <p className="text-sm text-slate-600">{selectedTrip.customer.email}</p>
                    <p className="text-sm text-slate-600">{selectedTrip.customer.phone}</p>
                  </div>
                </div>
              </div>

              {/* Trip Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Trip Overview</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Duration:</span>
                      <span className="font-medium">{selectedTrip.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Participants:</span>
                      <span className="font-medium">{selectedTrip.participants} people</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Budget:</span>
                      <span className="font-medium">LKR {selectedTrip.budget.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Requested Date:</span>
                      <span className="font-medium">{new Date(selectedTrip.requestedDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTrip.status)}`}>
                        {selectedTrip.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Cost Analysis</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Customer Budget:</span>
                      <span className="font-medium">LKR {selectedTrip.budget.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Estimated Cost:</span>
                      <span className="font-medium">LKR {selectedTrip.estimatedCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Difference:</span>
                      <span className={`font-medium ${selectedTrip.estimatedCost > selectedTrip.budget ? 'text-red-600' : 'text-green-600'}`}>
                        LKR {(selectedTrip.estimatedCost - selectedTrip.budget).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Description</h4>
                <p className="text-slate-700">{selectedTrip.description}</p>
              </div>

              {/* Requirements */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Requirements</h4>
                <ul className="space-y-1">
                  {selectedTrip.requirements.map((req, index) => (
                    <li key={index} className="flex items-center text-slate-700">
                      <CheckSquare className="h-4 w-4 text-green-600 mr-2" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Itinerary */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Proposed Itinerary</h4>
                <div className="space-y-3">
                  {selectedTrip.itinerary.map((day, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {day.day}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{day.location}</p>
                        <p className="text-sm text-slate-600">{day.activities}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Requests */}
              {selectedTrip.specialRequests && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Special Requests</h4>
                  <p className="text-slate-700">{selectedTrip.specialRequests}</p>
                </div>
              )}

              {/* Guide Recommendations */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Recommended Guides</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTrip.guideRecommendations.map((guide, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {guide}
                    </span>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedTrip.notes && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Staff Notes</h4>
                  <p className="text-slate-700">{selectedTrip.notes}</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              {selectedTrip.status === 'pending' && (
                <React.Fragment key={`modal-actions-${selectedTrip.id}`}>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false)
                      setApprovalAction('rejected')
                      setShowApprovalModal(true)
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false)
                      setApprovalAction('approved')
                      setShowApprovalModal(true)
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </button>
                </React.Fragment>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default CustomTripApproval
