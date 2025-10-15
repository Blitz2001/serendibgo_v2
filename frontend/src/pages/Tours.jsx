import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  MapPin, 
  Calendar, 
  Users, 
  Star, 
  ArrowRight, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  SlidersHorizontal,
  Heart,
  Clock,
  Award,
  ChevronDown,
  X,
  Loader2,
  Sparkles,
  Shield,
  Zap,
  Eye,
  BookOpen
} from 'lucide-react'
import { useTour } from '../context/TourContext'
import api from '../services/api'

const Tours = () => {
  const { 
    tours, 
    isLoading, 
    error, 
    filters, 
    pagination, 
    setTours, 
    setLoading, 
    setError, 
    setFilters,
    clearFilters 
  } = useTour()

  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('featured')
  const [priceRange, setPriceRange] = useState([0, 1000000])
  const [selectedCategories, setSelectedCategories] = useState([])

  const categories = [
    { value: 'adventure', label: 'Adventure', icon: '🏔️' },
    { value: 'cultural', label: 'Cultural', icon: '🏛️' },
    { value: 'nature', label: 'Nature', icon: '🌿' },
    { value: 'beach', label: 'Beach', icon: '🏖️' },
    { value: 'wildlife', label: 'Wildlife', icon: '🦁' },
    { value: 'religious', icon: '🕉️', label: 'Religious' },
    { value: 'historical', label: 'Historical', icon: '🏰' },
    { value: 'culinary', label: 'Culinary', icon: '🍽️' }
  ]

  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'duration', label: 'Duration' },
    { value: 'newest', label: 'Newest' }
  ]

  // Sample tour data for demonstration
  const sampleTours = [
    {
      _id: '1',
      title: 'Sigiriya Rock Fortress Adventure',
      shortDescription: 'Climb the ancient rock fortress and discover Sri Lanka\'s rich history',
      images: [{ url: '/api/placeholder/400/300', alt: 'Sigiriya Rock', isPrimary: true }],
      price: 299,
      originalPrice: 399,
      duration: 1,
      maxParticipants: 15,
      category: 'adventure',
      difficulty: 'moderate',
      location: { name: 'Sigiriya', city: 'Matale' },
      rating: { average: 4.8, count: 127 },
      isFeatured: true,
      tags: ['UNESCO', 'Historical', 'Adventure']
    },
    {
      _id: '2',
      title: 'Tea Country Cultural Experience',
      shortDescription: 'Explore the beautiful tea plantations and learn about Ceylon tea',
      images: [{ url: '/api/placeholder/400/300', alt: 'Tea Plantations', isPrimary: true }],
      price: 199,
      originalPrice: null,
      duration: 2,
      maxParticipants: 12,
      category: 'cultural',
      difficulty: 'easy',
      location: { name: 'Nuwara Eliya', city: 'Nuwara Eliya' },
      rating: { average: 4.6, count: 89 },
      isFeatured: false,
      tags: ['Tea', 'Culture', 'Scenic']
    },
    {
      _id: '3',
      title: 'Yala National Park Safari',
      shortDescription: 'Spot leopards, elephants, and other wildlife in their natural habitat',
      images: [{ url: '/api/placeholder/400/300', alt: 'Yala Safari', isPrimary: true }],
      price: 450,
      originalPrice: 550,
      duration: 1,
      maxParticipants: 8,
      category: 'wildlife',
      difficulty: 'easy',
      location: { name: 'Yala National Park', city: 'Hambantota' },
      rating: { average: 4.9, count: 203 },
      isFeatured: true,
      tags: ['Wildlife', 'Safari', 'Photography']
    },
    {
      _id: '4',
      title: 'Galle Fort Heritage Walk',
      shortDescription: 'Discover the colonial charm of Galle Fort with a guided walking tour',
      images: [{ url: '/api/placeholder/400/300', alt: 'Galle Fort', isPrimary: true }],
      price: 89,
      originalPrice: null,
      duration: 1,
      maxParticipants: 20,
      category: 'historical',
      difficulty: 'easy',
      location: { name: 'Galle Fort', city: 'Galle' },
      rating: { average: 4.7, count: 156 },
      isFeatured: false,
      tags: ['UNESCO', 'Heritage', 'Walking']
    },
    {
      _id: '5',
      title: 'Ella Scenic Train Journey',
      shortDescription: 'Experience one of the world\'s most beautiful train rides through tea country',
      images: [{ url: '/api/placeholder/400/300', alt: 'Ella Train', isPrimary: true }],
      price: 149,
      originalPrice: 199,
      duration: 1,
      maxParticipants: 25,
      category: 'nature',
      difficulty: 'easy',
      location: { name: 'Ella', city: 'Badulla' },
      rating: { average: 4.8, count: 178 },
      isFeatured: true,
      tags: ['Train', 'Scenic', 'Nature']
    },
    {
      _id: '6',
      title: 'Mirissa Whale Watching',
      shortDescription: 'Watch blue whales and dolphins in the deep waters off Mirissa',
      images: [{ url: '/api/placeholder/400/300', alt: 'Whale Watching', isPrimary: true }],
      price: 399,
      originalPrice: null,
      duration: 1,
      maxParticipants: 30,
      category: 'wildlife',
      difficulty: 'easy',
      location: { name: 'Mirissa', city: 'Matara' },
      rating: { average: 4.5, count: 92 },
      isFeatured: false,
      tags: ['Whales', 'Marine', 'Photography']
    }
  ]

  useEffect(() => {
    fetchTours()
  }, [])

  const fetchTours = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Frontend: Fetching tours...')
      const response = await api.get('/tours')
      console.log('🔍 Frontend: API Response:', response)
      console.log('🔍 Frontend: Response data:', response.data)
      
      if (response.data.success) {
        console.log('🔍 Frontend: Tours received:', response.data.data.length)
        console.log('🔍 Frontend: Tours data:', response.data.data)
        setTours(response.data.data)
        console.log('🔍 Frontend: Tours state updated')
      } else {
        console.error('🔍 Frontend: API returned success: false')
        setError('Failed to fetch tours')
      }
    } catch (err) {
      console.error('🔍 Frontend: Error fetching tours:', err)
      console.error('🔍 Frontend: Error response:', err.response)
      setError('Failed to load tours. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    // Implement search logic
    console.log('Searching for:', searchQuery)
  }

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleSortChange = (sortValue) => {
    setSortBy(sortValue)
    // Implement sorting logic
  }

  const filteredTours = tours.filter(tour => {
    const matchesSearch = tour.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (tour.shortDescription && tour.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (tour.description && tour.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(tour.category)
    const matchesPrice = tour.price >= priceRange[0] && tour.price <= priceRange[1]
    
    // Debug individual tour filtering
    console.log(`🔍 Frontend: Tour "${tour.title}" filtering:`, {
      matchesSearch,
      matchesCategory,
      matchesPrice,
      tourPrice: tour.price,
      priceRange,
      selectedCategories,
      searchQuery,
      finalMatch: matchesSearch && matchesCategory && matchesPrice
    })
    
    return matchesSearch && matchesCategory && matchesPrice
  })

  // Debug tours state and filtering
  console.log('🔍 Frontend: Tours state:', tours)
  console.log('🔍 Frontend: Tours length:', tours.length)
  console.log('🔍 Frontend: Filtered tours:', filteredTours)
  console.log('🔍 Frontend: Filtered tours length:', filteredTours.length)
  console.log('🔍 Frontend: Search query:', searchQuery)
  console.log('🔍 Frontend: Selected categories:', selectedCategories)
  console.log('🔍 Frontend: Price range:', priceRange)

  const sortedTours = [...filteredTours].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      case 'rating':
        return b.rating.average - a.rating.average
      case 'duration':
        return a.duration - b.duration
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt)
      default:
        return b.isFeatured - a.isFeatured
    }
  })

  const TourCard = ({ tour }) => (
    <div className="group relative">
      {/* Card Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl blur opacity-0 group-hover:opacity-75 transition duration-300"></div>
      
      {/* Main Card */}
      <div className="relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-100 group-hover:border-blue-200">
        {/* Premium Badge */}
        <div className="absolute top-4 right-4">
          {tour.isFeatured && (
            <div className="flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold shadow-lg">
              <Award className="h-3 w-3 mr-1" />
              FEATURED
            </div>
          )}
          {tour.originalPrice && (
            <div className="flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold shadow-lg mt-2">
              -{Math.round(((tour.originalPrice - tour.price) / tour.originalPrice) * 100)}%
            </div>
          )}
        </div>

        {/* Wishlist Button */}
        <button className="absolute top-4 left-4 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
          <Heart className="w-4 h-4 text-slate-600 hover:text-red-500" />
        </button>

        {/* Tour Image */}
        <div className="aspect-[4/3] bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center relative overflow-hidden">
          {tour.images && tour.images.length > 0 ? (
            <img
              src={typeof tour.images[0] === 'string' ? tour.images[0] : tour.images[0]?.url}
              alt={tour.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Tour image failed to load:', {
                  tourTitle: tour.title,
                  imageSrc: e.target.src,
                  imagesData: tour.images
                });
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
              onLoad={() => {
                console.log('Tour image loaded successfully:', {
                  tourTitle: tour.title,
                  imageSrc: typeof tour.images[0] === 'string' ? tour.images[0] : tour.images[0]?.url
                });
              }}
            />
          ) : null}
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ display: (tour.images && tour.images.length > 0) ? 'none' : 'flex' }}
          >
            <MapPin className="w-16 h-16 text-blue-500/30" />
          </div>
          {/* Category Badge */}
          <div className="absolute bottom-4 left-4">
            <div className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-semibold border border-slate-200">
              {categories.find(c => c.value === tour.category)?.icon} {categories.find(c => c.value === tour.category)?.label}
            </div>
          </div>
        </div>

        {/* Tour Content */}
        <div className="p-8">
          <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
            {tour.title}
          </h3>
          
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            {tour.shortDescription}
          </p>

          <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{tour.location.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-purple-500" />
              <span className="font-medium">{tour.duration} day{tour.duration > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-green-500" />
              <span className="font-medium">Max {tour.maxParticipants}</span>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-5 w-5 ${i < Math.floor(tour.rating.average) ? 'text-yellow-400 fill-current' : 'text-slate-300'}`} 
                />
              ))}
            </div>
            <span className="ml-2 text-lg font-bold text-slate-700">{tour.rating.average}</span>
            <span className="ml-2 text-sm text-slate-500 font-medium">({tour.rating.count} reviews)</span>
          </div>

          {/* Price */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center px-6 py-3 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
              {tour.originalPrice && (
                <div className="text-sm text-slate-500 line-through mr-2">${tour.originalPrice}</div>
              )}
              <div className="text-3xl font-bold text-green-600">${tour.price}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Link 
              to={`/tours/${tour._id}`} 
              className="flex-1 px-6 py-4 border-2 border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 font-semibold flex items-center justify-center group/btn"
            >
              <Eye className="h-5 w-5 mr-2 group-hover/btn:text-blue-500 transition-colors" />
              View Details
            </Link>
            <button className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-2xl hover:from-blue-700 hover:to-cyan-600 transition-all duration-300 font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center group/btn">
              <BookOpen className="h-5 w-5 mr-2 group-hover/btn:scale-110 transition-transform" />
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const TourListCard = ({ tour }) => (
    <div className="card bg-base-100 shadow-lg card-hover">
      <div className="card-body">
        <div className="flex gap-6">
          <div className="w-48 h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
            {tour.images && tour.images.length > 0 ? (
              <img
                src={typeof tour.images[0] === 'string' ? tour.images[0] : tour.images[0]?.url}
                alt={tour.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Tour list image failed to load:', {
                    tourTitle: tour.title,
                    imageSrc: e.target.src,
                    imagesData: tour.images
                  });
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
                onLoad={() => {
                  console.log('Tour list image loaded successfully:', {
                    tourTitle: tour.title,
                    imageSrc: typeof tour.images[0] === 'string' ? tour.images[0] : tour.images[0]?.url
                  });
                }}
              />
            ) : null}
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ display: (tour.images && tour.images.length > 0) ? 'none' : 'flex' }}
            >
              <MapPin className="w-8 h-8 text-primary/30" />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-xl font-bold text-base-content mb-1">{tour.title}</h3>
                <p className="text-base-content/70 text-sm mb-3">{tour.shortDescription}</p>
              </div>
              <div className="text-right">
                {tour.originalPrice && (
                  <div className="text-sm text-base-content/60 line-through">${tour.originalPrice}</div>
                )}
                <div className="text-2xl font-bold text-primary">${tour.price}</div>
              </div>
            </div>

            <div className="flex items-center gap-6 mb-4 text-sm text-base-content/60">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{tour.location.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{tour.duration} day{tour.duration > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>Max {tour.maxParticipants}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-accent fill-current" />
                <span className="font-medium">{tour.rating.average}</span>
                <span>({tour.rating.count})</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="badge badge-outline">
                  {categories.find(c => c.value === tour.category)?.icon} {categories.find(c => c.value === tour.category)?.label}
                </div>
                {tour.isFeatured && (
                  <div className="badge badge-primary">
                    Featured
                  </div>
                )}
              </div>
              
              <Link 
                to={`/tours/${tour._id}`} 
                className="btn btn-primary btn-sm"
              >
                View Details
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (error) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-error text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-base-content mb-2">Something went wrong</h2>
          <p className="text-base-content/70 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
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
              <Sparkles className="h-5 w-5 text-yellow-400 mr-2" />
              <span className="text-white/90 font-medium">Premium Tour Experiences</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Discover Amazing
              <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Sri Lankan Tours
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-4xl mx-auto leading-relaxed">
              Experience breathtaking landscapes, <span className="font-semibold text-blue-300">rich culture</span>, 
              and <span className="font-semibold text-cyan-300">unforgettable adventures</span> with our 
              <span className="font-semibold text-blue-200">carefully curated</span> tour experiences.
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
                        placeholder="Search tours or destinations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-slate-700 placeholder-slate-400 font-medium transition-all duration-200 hover:bg-white hover:shadow-lg"
                      />
                    </div>
                  </div>
                  
                  {/* Category Filter */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 group-hover:text-blue-500 transition-colors" />
                      <select
                        value={selectedCategories.length > 0 ? selectedCategories[0] : ''}
                        onChange={(e) => setSelectedCategories(e.target.value ? [e.target.value] : [])}
                        className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white/80 backdrop-blur-sm text-slate-700 font-medium transition-all duration-200 hover:bg-white hover:shadow-lg"
                      >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.icon} {category.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 pointer-events-none" />
                    </div>
                  </div>
                  
                  {/* Price Filter */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <Zap className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 group-hover:text-blue-500 transition-colors" />
                      <select
                        value={priceRange[1] <= 200 ? 'budget' : priceRange[1] <= 500 ? 'mid' : 'luxury'}
                        onChange={(e) => {
                          const ranges = {
                            budget: [0, 200],
                            mid: [200, 500],
                            luxury: [500, 1000]
                          }
                          setPriceRange(ranges[e.target.value])
                        }}
                        className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white/80 backdrop-blur-sm text-slate-700 font-medium transition-all duration-200 hover:bg-white hover:shadow-lg"
                      >
                        <option value="budget">Budget ($0-200)</option>
                        <option value="mid">Mid-range ($200-500)</option>
                        <option value="luxury">Luxury ($500+)</option>
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

      {/* Tours Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 mb-4">
            <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-slate-700 font-semibold">
              Showing {sortedTours.length} amazing tours
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
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
                <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Tours</h3>
                <p className="text-red-600 mb-6">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 font-semibold"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : sortedTours.length === 0 ? (
            // No tours found
            <div className="col-span-full text-center py-16">
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 max-w-md mx-auto">
                <div className="text-slate-400 text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No Tours Found</h3>
                <p className="text-slate-600 mb-6">Try adjusting your search criteria or check back later.</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-semibold"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          ) : (
            sortedTours.map((tour) => (
              <TourCard key={tour._id} tour={tour} />
            ))
          )}
        </div>
        
        {sortedTours.length === 0 && !isLoading && !error && (
          <div className="text-center py-20">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl p-12 max-w-md mx-auto border border-slate-100">
                <div className="text-slate-400 mb-6">
                  <MapPin className="h-20 w-20 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">No tours found</h3>
                <p className="text-slate-600 mb-6">Try adjusting your search criteria or filters to find the perfect tour for your adventure.</p>
                <button 
                  onClick={clearFilters}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all duration-300 font-semibold"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Tours
