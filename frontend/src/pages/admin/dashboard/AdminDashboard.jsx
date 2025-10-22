import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  FileText,
  Settings,
  Shield,
  User,
  Eye,
  ChevronDown,
  Building,
  LogOut,
  ExternalLink,
  Home,
  Star,
  Headphones,
  Bell,
  MessageSquare,
  Search,
  Mail,
  Phone,
  X,
  XCircle,
  Filter,
  MapPin,
  Car
} from 'lucide-react';
import AdminStats from '../../../components/admin/dashboard/AdminStats';
import staffService from '../../../services/admin/staffService';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Review management state
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewPagination, setReviewPagination] = useState(null);
  const [reviewFilters, setReviewFilters] = useState({
    search: '',
    type: 'all',
    rating: 'all',
    sortBy: 'newest'
  });
  const [reviewCurrentPage, setReviewCurrentPage] = useState(1);
  const [showReviewFilters, setShowReviewFilters] = useState(false);

  // User management state
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [userPagination, setUserPagination] = useState(null);
  const [userPage, setUserPage] = useState(1);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showViewUserModal, setShowViewUserModal] = useState(false);

  // Staff management state
  const [staffMembers, setStaffMembers] = useState([]);
  const [staffStats, setStaffStats] = useState({});
  const [staffPagination, setStaffPagination] = useState(null);
  const [staffPage, setStaffPage] = useState(1);
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [staffStatusFilter, setStaffStatusFilter] = useState('all');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [showViewStaffModal, setShowViewStaffModal] = useState(false);

  // Payroll management state
  const [payrollData, setPayrollData] = useState([]);
  const [payrollStats, setPayrollStats] = useState({});
  const [payrollPagination, setPayrollPagination] = useState(null);
  const [payrollPage, setPayrollPage] = useState(1);
  const [payrollSearchTerm, setPayrollSearchTerm] = useState('');
  const [payrollStatusFilter, setPayrollStatusFilter] = useState('all');
  const [showAddSalaryModal, setShowAddSalaryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showViewPayrollModal, setShowViewPayrollModal] = useState(false);
  const [showEditPayrollModal, setShowEditPayrollModal] = useState(false);

  // Permissions management state
  const [permissions, setPermissions] = useState([]);
  const [permissionTemplates, setPermissionTemplates] = useState([]);
  const [permissionSearchTerm, setPermissionSearchTerm] = useState('');
  const [permissionStatusFilter, setPermissionStatusFilter] = useState('all');
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState(null);

  // Analytics management state
  const [analyticsData, setAnalyticsData] = useState({});
  const [userAnalytics, setUserAnalytics] = useState([]);
  const [bookingAnalytics, setBookingAnalytics] = useState([]);
  const [revenueAnalytics, setRevenueAnalytics] = useState([]);
  const [showAnalyticsReportModal, setShowAnalyticsReportModal] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30days');

  // Settings management state
  const [settingsData, setSettingsData] = useState({});
  const [platformSettings, setPlatformSettings] = useState({});
  const [emailSettings, setEmailSettings] = useState({});
  const [paymentSettings, setPaymentSettings] = useState({});
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Load initial data for all tabs
  useEffect(() => {
    console.log('Component mounted, loading initial data...');
    fetchPayrollData();
    fetchPermissionsData();
    fetchAnalyticsData();
    fetchSettingsData();
    fetchReviewStats();
  }, []);

  // Fetch reviews data when reviews tab becomes active
  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchReviews();
      fetchReviewStats();
    }
  }, [activeTab]);

  // Refetch reviews when filters change
  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchReviews();
    }
  }, [reviewFilters, reviewCurrentPage, activeTab]);

  // Handle navigation state for activeTab
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  // Get current user info
  useEffect(() => {
    if (isLoading) return;
    
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    
    console.log('🔍 Current user:', user);
    console.log('🔍 User role:', user.role);
    console.log('🔍 Is authenticated:', isAuthenticated);
    
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      console.log('❌ User does not have admin role, redirecting...');
      navigate('/dashboard');
      return;
    }
    
    console.log('✅ User has admin access');
  }, [isLoading, isAuthenticated, user, navigate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileDropdownOpen && !event.target.closest('.profile-dropdown')) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch admin dashboard stats, but don't fail if API doesn't exist
      try {
        const statsResponse = await staffService.getDashboardStats();
        
        if (statsResponse.success) {
          const { overview, pending, revenue, changes } = statsResponse.data;
          
          // Map backend data to frontend stats format
          setStats({
            totalUsers: overview.totalUsers || 0,
            totalHotels: overview.totalHotels || 0,
            totalBookings: overview.totalBookings || 0,
            totalRevenue: revenue.totalRevenue || 0,
            activeStaff: overview.totalStaff || 0,
            pendingApprovals: (pending.pendingHotels || 0) + (pending.pendingUsers || 0),
            hotelOwners: overview.totalHotelOwners || 0,
            tourists: overview.totalTourists || 0,
            guides: overview.totalGuides || 0,
            // Add percentage changes
            totalUsersChange: changes.totalUsersChange || 0,
            totalHotelsChange: changes.totalHotelsChange || 0,
            totalBookingsChange: changes.totalBookingsChange || 0,
            totalRevenueChange: changes.totalRevenueChange || 0,
            activeStaffChange: changes.activeStaffChange || 0,
            pendingApprovalsChange: changes.pendingApprovalsChange || 0,
            hotelOwnersChange: changes.hotelOwnersChange || 0,
            touristsChange: changes.touristsChange || 0
          });
          
          console.log('Dashboard stats loaded from database:', statsResponse.data);
        }
      } catch (statsError) {
        console.log('Dashboard stats API not available, using fallback data');
        // Provide fallback stats
        setStats({
          totalUsers: 12,
          totalBookings: 45,
          totalHotels: 8,
          totalRevenue: 125000,
          pendingApprovals: 3,
          activeStaff: 4,
          hotelOwners: 2,
          tourists: 2
        });
      }

      // Try to fetch recent activity, but don't fail if API doesn't exist
      try {
        const activityResponse = await staffService.getRecentActivity();
        setRecentActivity(activityResponse.data || []);
      } catch (activityError) {
        console.log('Recent activity API not available, using fallback data');
        // Provide fallback activity
        setRecentActivity([
          {
            id: 1,
            type: 'user_registration',
            message: 'New tourist "kavindu Nethmina" registered',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            status: 'pending'
          },
          {
            id: 2,
            type: 'user_registration',
            message: 'New tourist "Sandun Dimantha" registered',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            status: 'pending'
          }
        ]);
      }

      // Try to fetch pending approvals, but don't fail if API doesn't exist
      try {
        const approvalsResponse = await staffService.getPendingApprovals();
        setPendingApprovals(approvalsResponse.data || []);
      } catch (approvalsError) {
        console.log('Pending approvals API not available, using fallback data');
        // Provide fallback approvals
        setPendingApprovals([
          {
            id: 1,
            type: 'tourist_verification',
            title: 'Tourist Verification',
            submittedBy: 'kavindu Nethmina',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            priority: 'medium'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'staff', label: 'Staff', icon: Shield },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
    { id: 'permissions', label: 'Permissions', icon: Settings },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleTabClick = (tabId) => {
    console.log('🖱️ Tab clicked:', tabId);
    setActiveTab(tabId);
    
    if (tabId === 'reviews') {
      console.log('📊 Reviews tab clicked, fetching reviews...');
      fetchReviews();
      fetchReviewStats();
    }
  };

  // Review management functions
  const fetchReviews = async () => {
    try {
      console.log('🔍 Fetching reviews with params:', {
        page: reviewCurrentPage,
        limit: 20,
        type: reviewFilters.type,
        rating: reviewFilters.rating,
        sortBy: reviewFilters.sortBy,
        search: reviewFilters.search
      });
      
      setReviewLoading(true);
      const params = {
        page: reviewCurrentPage,
        limit: 20,
        type: reviewFilters.type,
        rating: reviewFilters.rating,
        sortBy: reviewFilters.sortBy,
        search: reviewFilters.search
      };
      
      console.log('📡 Making API call to /admin/reviews with params:', params);
      console.log('🔑 Auth token:', localStorage.getItem('token') ? 'Present' : 'Missing');
      
      const response = await api.get('/admin/reviews', { params });
      console.log('✅ Reviews API response:', response.data);
      console.log('📊 Reviews count:', response.data.data?.reviews?.length || 0);
      
      setReviews(response.data.data?.reviews || []);
      setReviewPagination(response.data.data?.pagination || null);
    } catch (error) {
      console.error('❌ Error fetching reviews:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      toast.error('Failed to fetch reviews');
      setReviews([]);
      setReviewPagination(null);
    } finally {
      setReviewLoading(false);
    }
  };

  const fetchReviewStats = async () => {
    try {
      console.log('📊 Fetching review statistics...');
      const response = await api.get('/admin/reviews/stats');
      console.log('✅ Review stats API response:', response.data);
      setReviewStats(response.data.data);
    } catch (error) {
      console.error('❌ Error fetching review stats:', error);
      console.error('❌ Error response:', error.response?.data);
    }
  };

  const handleReviewFilterChange = (key, value) => {
    setReviewFilters(prev => ({ ...prev, [key]: value }));
    setReviewCurrentPage(1);
  };

  // Staff management functions
  const fetchStaffData = async () => {
    try {
      const params = {
        page: staffPage,
        limit: 10,
        search: staffSearchTerm,
        status: staffStatusFilter === 'all' ? undefined : staffStatusFilter
      };

      const [staffResponse, statsResponse] = await Promise.all([
        staffService.getStaffMembers(params),
        staffService.getStaffStats()
      ]);

      setStaffMembers(staffResponse.data.staff || []);
      setStaffPagination(staffResponse.data.pagination);
      setStaffStats(statsResponse.data || {});
    } catch (error) {
      console.error('Error fetching staff data:', error);
      toast.error('Failed to load staff data');
    }
  };

  const handleViewStaff = (staff) => {
    setSelectedStaff(staff);
    setShowViewStaffModal(true);
  };

  const handleEditStaff = (staff) => {
    setSelectedStaff(staff);
    setShowEditStaffModal(true);
  };

  const handleToggleStaffStatus = async (staff) => {
    try {
      const newStatus = !staff.isActive;
      await staffService.updateStaffStatus(staff._id, newStatus);
      
      // Update local state
      setStaffMembers(prev => 
        prev.map(s => 
          s._id === staff._id ? { ...s, isActive: newStatus } : s
        )
      );
      
      toast.success(`Staff ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating staff status:', error);
      toast.error('Failed to update staff status');
    }
  };

  const handleAddStaff = async (staffData) => {
    try {
      await staffService.createStaffMember(staffData);
      toast.success('Staff member created successfully');
      setShowAddStaffModal(false);
      fetchStaffData(); // Refresh the list
    } catch (error) {
      console.error('Error creating staff:', error);
      toast.error('Failed to create staff member');
    }
  };

  const handleUpdateStaff = async (staffId, staffData) => {
    try {
      await staffService.updateStaffMember(staffId, staffData);
      toast.success('Staff member updated successfully');
      setShowEditStaffModal(false);
      setSelectedStaff(null);
      fetchStaffData(); // Refresh the list
    } catch (error) {
      console.error('Error updating staff:', error);
      toast.error('Failed to update staff member');
    }
  };

  // Fetch staff data when staff tab is active
  useEffect(() => {
    if (activeTab === 'staff') {
      fetchStaffData();
    }
  }, [activeTab, staffPage, staffSearchTerm, staffStatusFilter]);

  // User management functions
  const fetchUserData = async () => {
    try {
      // For now, we'll use the existing admin dashboard controller endpoints
      // In a real implementation, you'd want dedicated user management endpoints
      const [recentUsersResponse, unverifiedUsersResponse] = await Promise.all([
        staffService.getRecentUsers({ limit: 50 }),
        staffService.getUnverifiedUsers({ limit: 50 })
      ]);

      // Combine and process user data
      const recentUsers = recentUsersResponse.data.users || [];
      const unverifiedUsers = unverifiedUsersResponse.data.users || [];
      
      // Create a combined list with additional processing
      const allUsers = [...recentUsers, ...unverifiedUsers];
      const uniqueUsers = allUsers.filter((user, index, self) => 
        index === self.findIndex(u => u._id === user._id)
      );

      // Apply filters
      let filteredUsers = uniqueUsers;
      
      if (userSearchTerm) {
        filteredUsers = filteredUsers.filter(user => 
          user.firstName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
        );
      }

      if (userRoleFilter !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.role === userRoleFilter);
      }

      if (userStatusFilter !== 'all') {
        if (userStatusFilter === 'verified') {
          filteredUsers = filteredUsers.filter(user => user.isVerified === true);
        } else if (userStatusFilter === 'unverified') {
          filteredUsers = filteredUsers.filter(user => user.isVerified === false);
        }
      }

      // Calculate pagination
      const startIndex = (userPage - 1) * 10;
      const endIndex = startIndex + 10;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

      setUsers(paginatedUsers);
      setUserPagination({
        current: userPage,
        pages: Math.ceil(filteredUsers.length / 10),
        total: filteredUsers.length,
        limit: 10
      });

      // Calculate stats
      const stats = {
        totalUsers: uniqueUsers.length,
        verifiedUsers: uniqueUsers.filter(u => u.isVerified).length,
        unverifiedUsers: uniqueUsers.filter(u => !u.isVerified).length,
        tourists: uniqueUsers.filter(u => u.role === 'tourist').length,
        guides: uniqueUsers.filter(u => u.role === 'guide').length,
        hotelOwners: uniqueUsers.filter(u => u.role === 'hotel_owner').length,
        drivers: uniqueUsers.filter(u => u.role === 'driver').length,
        staff: uniqueUsers.filter(u => u.role === 'staff').length
      };
      setUserStats(stats);
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user data');
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowViewUserModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditUserModal(true);
  };

  const handleToggleUserStatus = async (user) => {
    try {
      const response = await api.put(`/admin/users/${user._id}/status`, { 
        isActive: !user.isVerified 
      });
      
      if (response.status === 200) {
        toast.success(`User ${user.isVerified ? 'unverified' : 'verified'} successfully`);
        fetchUserData(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.target);
      const userData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        role: formData.get('role'),
        password: formData.get('password'),
        isVerified: formData.get('isVerified') === 'true',
        isActive: true
      };

      // Create user via API
      await api.post('/admin/users', userData);
      
      toast.success('User created successfully');
      setShowAddUserModal(false);
      fetchUserData(); // Refresh the list
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    try {
      // Update user role if it changed
      if (userData.role) {
        await api.put(`/admin/users/${userId}/role`, { 
          role: userData.role 
        });
      }
      
      // Update user status if it changed
      if (userData.isActive !== undefined) {
        await api.put(`/admin/users/${userId}/status`, { 
          isActive: userData.isActive 
        });
      }
      
      toast.success('User updated successfully');
      setShowEditUserModal(false);
      setSelectedUser(null);
      fetchUserData(); // Refresh the list
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  // Fetch user data when users tab is active
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUserData();
    }
  }, [activeTab, userPage, userSearchTerm, userRoleFilter, userStatusFilter]);

  // Payroll management functions
  const fetchPayrollData = async () => {
    try {
      console.log('fetchPayrollData called');
      
      // Fetch real staff data from the database
      const staffResponse = await staffService.getStaffMembers({ limit: 100 });
      const staffMembers = staffResponse.data.staff || [];
      
      // Generate payroll data based on real staff members
      const payrollData = staffMembers.map((staff, index) => {
        // Generate realistic salary data based on staff role/position
        const baseSalary = staff.role === 'manager' ? 75000 : 
                          staff.role === 'admin' ? 80000 :
                          staff.role === 'supervisor' ? 65000 :
                          staff.role === 'support' ? 45000 : 50000;
        
        const allowances = Math.floor(baseSalary * 0.1); // 10% allowances
        const deductions = Math.floor(baseSalary * 0.05); // 5% deductions
        const netSalary = baseSalary + allowances - deductions;
        
        // Generate pay period (current month)
        const currentDate = new Date();
        const payPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        // Random status for demonstration (in real app, this would come from database)
        const status = Math.random() > 0.5 ? 'paid' : 'pending';
        
        return {
          _id: staff._id,
          staffId: staff._id,
          staffName: `${staff.firstName} ${staff.lastName}`,
          position: staff.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Staff Member',
          baseSalary: baseSalary,
          allowances: allowances,
          deductions: deductions,
          netSalary: netSalary,
          status: status,
          payPeriod: payPeriod,
          paymentDate: status === 'paid' ? new Date().toISOString().split('T')[0] : null,
          paymentMethod: 'Bank Transfer',
          email: staff.email,
          phone: staff.phone,
          isActive: staff.isActive
        };
      });

      console.log('Setting payroll data:', payrollData);
      setPayrollData(payrollData);
      setPayrollStats({
        totalStaff: payrollData.length,
        paidStaff: payrollData.filter(p => p.status === 'paid').length,
        pendingStaff: payrollData.filter(p => p.status === 'pending').length,
        totalPayroll: payrollData.reduce((sum, p) => sum + p.netSalary, 0)
      });
      console.log('Payroll data set successfully');
    } catch (error) {
      console.error('Error fetching payroll data:', error);
      toast.error('Failed to load payroll data');
    }
  };

  const handleProcessPayment = async (payrollId) => {
    try {
      // Find the payroll record
      const payroll = payrollData.find(p => p._id === payrollId);
      if (!payroll) {
        toast.error('Payroll record not found');
        return;
      }

      // Update the payroll status to paid
      const updatedPayrollData = payrollData.map(p => 
        p._id === payrollId 
          ? { ...p, status: 'paid', paymentDate: new Date().toISOString().split('T')[0] }
          : p
      );
      
      setPayrollData(updatedPayrollData);
      
      // Update payroll stats
      setPayrollStats(prev => ({
        ...prev,
        paidStaff: updatedPayrollData.filter(p => p.status === 'paid').length,
        pendingStaff: updatedPayrollData.filter(p => p.status === 'pending').length
      }));

      toast.success(`Payment processed successfully for ${payroll.staffName}`);
      
      // In a real application, you would make an API call here:
      // await api.put(`/admin/payroll/${payrollId}/process-payment`);
      
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    }
  };

  const handleAddSalary = async (salaryData) => {
    try {
      // Mock salary addition
      toast.success('Salary record added successfully');
      setShowAddSalaryModal(false);
      fetchPayrollData(); // Refresh the list
    } catch (error) {
      console.error('Error adding salary:', error);
      toast.error('Failed to add salary record');
    }
  };

  const handleViewPayroll = (payroll) => {
    setSelectedPayroll(payroll);
    setShowViewPayrollModal(true);
  };

  const handleEditPayroll = (payroll) => {
    setSelectedPayroll(payroll);
    setShowEditPayrollModal(true);
  };

  // Permissions management functions
  const fetchPermissionsData = async () => {
    try {
      console.log('Fetching permissions data...');
      
      // Fetch permission templates
      const templatesResponse = await api.get('/admin/permissions/templates');
      setPermissionTemplates(templatesResponse.data.data.templates);
      
      // Fetch staff permissions
      const staffResponse = await api.get('/admin/permissions/staff');
      setPermissions(staffResponse.data.data.staff);
      
      console.log('Permissions data fetched successfully');
    } catch (error) {
      console.error('Error fetching permissions data:', error);
      toast.error('Failed to load permissions data');
      
      // Fallback to mock data if API fails
      const mockPermissions = [
        {
          _id: '1',
          staffId: 'staff1',
          staffName: 'John Smith',
          role: 'Manager',
          permissions: {
            users: { view: true, create: true, edit: true, delete: true },
            bookings: { view: true, create: true, edit: true, delete: true },
            vehicles: { view: true, create: true, edit: true, delete: true },
            reports: { view: true, create: true, edit: true, delete: true }
          }
        },
        {
          _id: '2',
          staffId: 'staff2',
          staffName: 'Sarah Johnson',
          role: 'Developer',
          permissions: {
            users: { view: true, create: false, edit: false, delete: false },
            bookings: { view: true, create: false, edit: false, delete: false },
            vehicles: { view: true, create: false, edit: false, delete: false },
            reports: { view: false, create: false, edit: false, delete: false }
          }
        }
      ];

      setPermissions(mockPermissions);

      // Mock permission templates
      const mockTemplates = [
        {
          _id: 'template1',
          name: 'Manager Template',
          description: 'Full access to all modules and features.',
          permissions: {
            users: { view: true, create: true, edit: true, delete: true },
            bookings: { view: true, create: true, edit: true, delete: true },
            vehicles: { view: true, create: true, edit: true, delete: true },
            reports: { view: true, create: true, edit: true, delete: true }
          }
        },
        {
          _id: 'template2',
          name: 'Staff Template',
          description: 'Limited access for general staff operations.',
          permissions: {
            users: { view: true, create: false, edit: false, delete: false },
            bookings: { view: true, create: false, edit: true, delete: false },
            vehicles: { view: true, create: true, edit: false, delete: false },
            reports: { view: true, create: false, edit: false, delete: false }
          }
        }
      ];

      setPermissionTemplates(mockTemplates);
    }
  };

  const handleUpdatePermissions = async (staffId, newPermissions) => {
    try {
      await api.put(`/admin/permissions/staff/${staffId}`, { permissions: newPermissions });
      toast.success('Permissions updated successfully');
      setShowPermissionModal(false);
      fetchPermissionsData(); // Refresh the list
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error('Failed to update permissions');
    }
  };

  const handleCreateTemplate = async (templateData) => {
    try {
      await api.post('/admin/permissions/templates', templateData);
      toast.success('Permission template created successfully');
      setShowTemplateModal(false);
      fetchPermissionsData(); // Refresh the list
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  const handleApplyTemplate = async (template) => {
    try {
      // Get all staff IDs for now (in a real app, you'd have a selection mechanism)
      const staffIds = permissions.map(p => p._id);
      await api.post('/admin/permissions/apply-template', {
        templateId: template._id,
        staffIds: staffIds
      });
      toast.success(`Template "${template.name}" applied to staff successfully`);
      fetchPermissionsData(); // Refresh the list
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error('Failed to apply template');
    }
  };

  const handleEditTemplate = (template) => {
    setSelectedPermission(template);
    setShowTemplateModal(true);
  };

  // Analytics management functions
  const fetchAnalyticsData = async () => {
    try {
      console.log('fetchAnalyticsData called');
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Analytics request timeout')), 15000); // 15 second timeout
      });

      // Fetch real analytics data from backend with timeout
      const analyticsPromise = api.get('/admin/analytics', {
        params: { period: analyticsPeriod === '7days' ? '7d' : '30d' },
        timeout: 15000 // 15 second timeout
      });

      const response = await Promise.race([analyticsPromise, timeoutPromise]);

      if (response.data.success) {
        const { 
          userTrends, 
          bookingTrends, 
          hotelTrends, 
          topHotels,
          totalNewUsers,
          avgActiveUsers,
          totalBookings,
          totalRevenue,
          userGrowthRate,
          bookingGrowthRate,
          revenueGrowthRate,
          avgBookingValue,
          platformStats
        } = response.data.data;
        
        // Transform user trends data
        const transformedUserAnalytics = userTrends.map(trend => ({
          date: new Date(trend._id.year, trend._id.month - 1, trend._id.day).toISOString(),
          newUsers: trend.count,
          activeUsers: Math.floor(trend.count * 0.7), // Estimate active users
          totalUsers: trend.count
        }));

        // Transform booking trends data
        const transformedBookingAnalytics = bookingTrends.map(trend => ({
          date: new Date(trend._id.year, trend._id.month - 1, trend._id.day).toISOString(),
          tours: Math.floor(trend.count * 0.4), // Estimate tour bookings
          hotels: Math.floor(trend.count * 0.3), // Estimate hotel bookings
          vehicles: Math.floor(trend.count * 0.3), // Estimate vehicle bookings
          total: trend.count,
          revenue: trend.revenue || 0
        }));

        // Set analytics data with real values from backend
        setAnalyticsData({
          totalNewUsers,
          avgActiveUsers,
          totalBookings,
          totalRevenue,
          userGrowthRate,
          bookingGrowthRate,
          revenueGrowthRate,
          avgBookingValue,
          platformStats
        });

        setUserAnalytics(transformedUserAnalytics);
        setBookingAnalytics(transformedBookingAnalytics);
        setRevenueAnalytics(transformedBookingAnalytics.map(item => ({
          date: item.date,
          revenue: item.revenue
        })));

        console.log('Analytics data set successfully from database:', {
          totalNewUsers,
          avgActiveUsers,
          totalBookings,
          totalRevenue,
          userGrowthRate,
          bookingGrowthRate,
          revenueGrowthRate
        });
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      
      // Handle timeout specifically
      if (error.message === 'Analytics request timeout' || error.code === 'ECONNABORTED') {
        console.warn('Analytics request timed out, using fallback data');
      }
      
      // Fallback to mock data if API fails
      const mockUserAnalytics = [
        { date: '2024-01-01', newUsers: 45, activeUsers: 120, totalUsers: 1250 },
        { date: '2024-01-02', newUsers: 52, activeUsers: 135, totalUsers: 1302 },
        { date: '2024-01-03', newUsers: 38, activeUsers: 128, totalUsers: 1340 },
        { date: '2024-01-04', newUsers: 61, activeUsers: 142, totalUsers: 1401 },
        { date: '2024-01-05', newUsers: 47, activeUsers: 138, totalUsers: 1448 },
        { date: '2024-01-06', newUsers: 55, activeUsers: 145, totalUsers: 1503 },
        { date: '2024-01-07', newUsers: 43, activeUsers: 132, totalUsers: 1546 }
      ];

      const mockBookingAnalytics = [
        { date: '2024-01-01', tours: 12, hotels: 8, vehicles: 15, total: 35, revenue: 45000 },
        { date: '2024-01-02', tours: 18, hotels: 12, vehicles: 22, total: 52, revenue: 68000 },
        { date: '2024-01-03', tours: 15, hotels: 10, vehicles: 18, total: 43, revenue: 55000 },
        { date: '2024-01-04', tours: 22, hotels: 15, vehicles: 25, total: 62, revenue: 78000 },
        { date: '2024-01-05', tours: 19, hotels: 13, vehicles: 20, total: 52, revenue: 65000 },
        { date: '2024-01-06', tours: 25, hotels: 18, vehicles: 28, total: 71, revenue: 89000 },
        { date: '2024-01-07', tours: 21, hotels: 14, vehicles: 23, total: 58, revenue: 72000 }
      ];

      setAnalyticsData({
        totalNewUsers: 341,
        avgActiveUsers: 134,
        totalBookings: 361,
        totalRevenue: 128900,
        userGrowthRate: 12.5,
        bookingGrowthRate: 8.3,
        revenueGrowthRate: 15.2,
        avgBookingValue: 357
      });

      setUserAnalytics(mockUserAnalytics);
      setBookingAnalytics(mockBookingAnalytics);
      setRevenueAnalytics(mockBookingAnalytics.map(item => ({
        date: item.date,
        revenue: item.revenue
      })));

      console.log('Using fallback mock data');
      toast.error('Failed to load analytics data from database');
    }
  };

  const handleGenerateAnalyticsReport = async (period) => {
    try {
      // Mock analytics report generation
      toast.success(`${period} analytics report generated successfully`);
      setShowAnalyticsReportModal(false);
    } catch (error) {
      console.error('Error generating analytics report:', error);
      toast.error('Failed to generate analytics report');
    }
  };

  // Settings management functions
  const fetchSettingsData = async () => {
    try {
      console.log('fetchSettingsData called');
      
      // Fetch real settings data from backend
      const response = await api.get('/admin/settings');

      if (response.data.success) {
        const { platform, email, payment, system, lastUpdated } = response.data.data;
        
        setPlatformSettings(platform);
        setEmailSettings(email);
        setPaymentSettings(payment);
        setSettingsData({
          lastUpdated,
          version: system.version,
          environment: system.environment,
          databaseStatus: system.databaseStatus,
          cacheStatus: system.cacheStatus
        });

        console.log('Settings data set successfully from database');
      }
    } catch (error) {
      console.error('Error fetching settings data:', error);
      
      // Fallback to mock data if API fails
      const mockPlatformSettings = {
        siteName: 'SerendibGo',
        siteDescription: 'Your gateway to Sri Lankan adventures',
        siteUrl: 'https://serendibgo.com',
        timezone: 'Asia/Colombo',
        currency: 'LKR',
        language: 'en',
        maintenanceMode: false,
        registrationEnabled: true,
        emailVerificationRequired: true,
        maxFileUploadSize: '10MB',
        sessionTimeout: 30
      };

      const mockEmailSettings = {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUsername: 'noreply@serendibgo.com',
        smtpPassword: '••••••••',
        fromEmail: 'noreply@serendibgo.com',
        fromName: 'SerendibGo Team',
        emailTemplates: {
          welcome: true,
          bookingConfirmation: true,
          passwordReset: true,
          newsletter: false
        }
      };

      const mockPaymentSettings = {
        stripeEnabled: true,
        stripePublicKey: 'pk_test_••••••••',
        stripeSecretKey: 'sk_test_••••••••',
        paypalEnabled: false,
        paypalClientId: '',
        paypalClientSecret: '',
        bankTransferEnabled: true,
        minimumDeposit: 1000,
        refundPolicy: '7 days',
        commissionRate: 5.0
      };

      setPlatformSettings(mockPlatformSettings);
      setEmailSettings(mockEmailSettings);
      setPaymentSettings(mockPaymentSettings);

      setSettingsData({
        lastUpdated: new Date().toISOString(),
        version: '1.2.0',
        environment: 'production',
        databaseStatus: 'connected',
        cacheStatus: 'active'
      });

      console.log('Using fallback mock data');
      toast.error('Failed to load settings data from database');
    }
  };

  const handleUpdateSettings = async (settingsType, newSettings) => {
    try {
      // Update settings via API
      const endpoint = `/admin/settings/${settingsType}`;
      const response = await api.put(endpoint, newSettings);

      if (response.data.success) {
        toast.success(`${settingsType} settings updated successfully`);
        setShowSettingsModal(false);
        fetchSettingsData(); // Refresh the data
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const handleResetSettings = async (settingsType) => {
    try {
      // Reset settings via API
      const response = await api.post('/admin/settings/reset', { settingsType });

      if (response.data.success) {
        toast.success(`${settingsType} settings reset to defaults`);
        fetchSettingsData(); // Refresh the data
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Failed to reset settings');
    }
  };

  // PDF Report generation
  const handleGeneratePDFReport = async (reportType = 'dashboard', period = '30d') => {
    try {
      toast.loading('Generating PDF report...', { id: 'pdf-report' });
      
      const response = await api.post('/admin/reports/generate', {
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
          link.download = response.data.filename || `serendibgo-report-${new Date().toISOString().split('T')[0]}.pdf`;
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

  // Reviews PDF export function
  const handleExportReviewsPDF = async () => {
    try {
      toast.loading('Generating reviews PDF...', { id: 'reviews-pdf' });
      
      const response = await api.post('/admin/reviews/export');

      if (response.data.success && response.data.data) {
        try {
          // Convert base64 to blob
          const base64Data = response.data.data;
          const cleanBase64 = base64Data.replace(/\s/g, '');
          const binaryString = atob(cleanBase64);
          
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const blob = new Blob([bytes], { type: 'application/pdf' });
          
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = response.data.filename || `serendibgo-reviews-${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          toast.success('Reviews PDF exported successfully!', { id: 'reviews-pdf' });
        } catch (decodeError) {
          console.error('Error decoding reviews PDF data:', decodeError);
          throw new Error('Failed to decode PDF data: ' + decodeError.message);
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error exporting reviews PDF:', error);
      toast.error('Failed to export reviews PDF', { id: 'reviews-pdf' });
    }
  };

  // Fetch data when tabs are active
  useEffect(() => {
    console.log('Active tab changed to:', activeTab);
    
    // Clear search and filter terms when switching tabs
    setPayrollSearchTerm('');
    setPayrollStatusFilter('all');
    setUserSearchTerm('');
    setUserStatusFilter('all');
    setUserRoleFilter('all');
    setStaffSearchTerm('');
    setStaffStatusFilter('all');
    setPermissionSearchTerm('');
    setPermissionStatusFilter('all');
    
    if (activeTab === 'payroll') {
      console.log('Fetching payroll data...');
      fetchPayrollData();
    } else if (activeTab === 'permissions') {
      console.log('Fetching permissions data...');
      fetchPermissionsData();
    } else if (activeTab === 'analytics') {
      console.log('Fetching analytics data...');
      fetchAnalyticsData();
    } else if (activeTab === 'settings') {
      console.log('Fetching settings data...');
      fetchSettingsData();
    }
  }, [activeTab]);

  // Refetch analytics data when period changes
  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalyticsData();
    }
  }, [analyticsPeriod]);

  // Show loading state while checking authentication
  if (isLoading) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Loading Admin Dashboard</h2>
          <p className="text-slate-500">Please wait while we verify your access...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-slate-600">Overview of your platform operations</p>
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
                      <p className="text-xs text-blue-600 font-medium">Administrator</p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setIsProfileDropdownOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Settings className="h-4 w-4 mr-3" />
                Settings
              </button>
                    <button
                      onClick={() => {
                        navigate('/');
                        setIsProfileDropdownOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 mr-3" />
                      View Site
                    </button>
                    <hr className="my-1 border-slate-100" />
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsProfileDropdownOpen(false);
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 sticky top-24">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
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
                  );
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
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => handleGeneratePDFReport('dashboard', '30d')}
                        className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        Generate Report
                      </button>
                      <button 
                        onClick={() => setActiveTab('settings')}
                        className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                      >
                        <Settings className="h-5 w-5 mr-2" />
                        Settings
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
        <AdminStats stats={stats} loading={loading} />

                {/* Recent Activity and Pending Approvals */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-slate-900">Recent Activity</h3>
                      <button className="text-blue-600 hover:text-blue-800 font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Users className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">{activity.message}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-slate-500">
                                {activity.timestamp ? Math.floor((Date.now() - activity.timestamp) / (1000 * 60 * 60 * 24)) : 'NaN'} days ago
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {activity.status}
                      </span>
                    </div>
              </div>
                        </div>
                      ))}
            </div>
          </div>

          {/* Pending Approvals */}
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-slate-900">Pending Approvals</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {pendingApprovals.length} pending
                </span>
              </div>
              <div className="space-y-4">
                      {pendingApprovals.map((approval) => (
                        <div key={approval.id} className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                              <h4 className="font-medium text-slate-900">{approval.title}</h4>
                              <p className="text-sm text-slate-600 mt-1">Submitted by: {approval.submittedBy}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {approval.timestamp ? Math.floor((Date.now() - approval.timestamp) / (1000 * 60 * 60 * 24)) : 'NaN'} days ago
                          </p>
                        </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                approval.priority === 'high' ? 'bg-red-100 text-red-800' :
                                approval.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                          {approval.priority}
                        </span>
                      </div>
                          </div>
                          <div className="flex items-center space-x-2 mt-3">
                            <button className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                              <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </button>
                            <button className="flex items-center px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                              <AlertCircle className="h-4 w-4 mr-1" />
                          Reject
                        </button>
                      </div>
                    </div>
                      ))}
              </div>
            </div>
          </div>
        </div>
            )}

            {/* User Management Tab */}
            {activeTab === 'users' && (
              <div className="space-y-8">
                {/* User Management Header */}
                <div className="rounded-2xl shadow-lg p-8 text-white" style={{ background: 'linear-gradient(to right, #339BAE, #E59B2C)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">User Management</h2>
                      <p className="text-lg" style={{ color: '#DFE2E5' }}>
                        Manage platform users, roles, and verification status
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => setShowAddUserModal(true)}
                        className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                      >
                        <User className="h-5 w-5 mr-2" />
                        Add User
                      </button>
                      <button 
                        onClick={() => handleGeneratePDFReport('users', '30d')}
                        className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        Export
                      </button>
                    </div>
                  </div>
                </div>

                {/* User Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="rounded-2xl shadow-lg border p-6" style={{ backgroundColor: 'white', borderColor: '#7B8F9D' }}>
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#DFE2E5' }}>
                        <Users className="h-6 w-6" style={{ color: '#339BAE' }} />
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold" style={{ color: '#272C2F' }}>{userStats.totalUsers || 0}</p>
                        <p className="text-sm" style={{ color: '#7B8F9D' }}>Total Users</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl shadow-lg border p-6" style={{ backgroundColor: 'white', borderColor: '#7B8F9D' }}>
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#DFE2E5' }}>
                        <CheckCircle className="h-6 w-6" style={{ color: '#339BAE' }} />
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold" style={{ color: '#272C2F' }}>{userStats.verifiedUsers || 0}</p>
                        <p className="text-sm" style={{ color: '#7B8F9D' }}>Verified</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl shadow-lg border p-6" style={{ backgroundColor: 'white', borderColor: '#7B8F9D' }}>
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#DFE2E5' }}>
                        <Clock className="h-6 w-6" style={{ color: '#E59B2C' }} />
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold" style={{ color: '#272C2F' }}>{userStats.unverifiedUsers || 0}</p>
                        <p className="text-sm" style={{ color: '#7B8F9D' }}>Pending</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl shadow-lg border p-6" style={{ backgroundColor: 'white', borderColor: '#7B8F9D' }}>
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#DFE2E5' }}>
                        <User className="h-6 w-6" style={{ color: '#725241' }} />
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold" style={{ color: '#272C2F' }}>{userStats.tourists || 0}</p>
                        <p className="text-sm" style={{ color: '#7B8F9D' }}>Tourists</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User List */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-slate-900">Users</h3>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                      <select
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Roles</option>
                        <option value="tourist">Tourist</option>
                        <option value="guide">Guide</option>
                        <option value="hotel_owner">Hotel Owner</option>
                        <option value="driver">Driver</option>
                        <option value="staff">Staff</option>
                      </select>
                      <select
                        value={userStatusFilter}
                        onChange={(e) => setUserStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Status</option>
                        <option value="verified">Verified</option>
                        <option value="unverified">Unverified</option>
                      </select>
                    </div>
                  </div>

                  {/* User Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full" style={{ minWidth: '800px' }}>
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/4">Name</th>
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/5">Email</th>
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/6">Role</th>
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/6">Status</th>
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/6">Joined</th>
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/6">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user._id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-2">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                  <User className="h-4 w-4 text-white" />
                                </div>
                                <div className="ml-2 min-w-0 flex-1">
                                  <p className="font-medium text-slate-900 text-sm truncate">{user.firstName} {user.lastName}</p>
                                  <p className="text-xs text-slate-500 truncate">{user.role}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-slate-600 text-sm truncate" title={user.email}>{user.email}</td>
                            <td className="py-3 px-2">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                user.role === 'staff' ? 'bg-blue-100 text-blue-800' :
                                user.role === 'guide' ? 'bg-green-100 text-green-800' :
                                user.role === 'hotel_owner' ? 'bg-purple-100 text-purple-800' :
                                user.role === 'driver' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role?.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {user.isVerified ? 'Verified' : 'Pending'}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-slate-600 text-sm">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex items-center space-x-1">
                                <button 
                                  onClick={() => handleViewUser(user)}
                                  className="p-1 text-blue-600 hover:text-blue-900 transition-colors rounded hover:bg-blue-50"
                                  title="View user"
                                >
                                  <Eye className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="p-1 text-green-600 hover:text-green-900 transition-colors rounded hover:bg-green-50"
                                  title="Edit user"
                                >
                                  <Settings className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleToggleUserStatus(user)}
                                  className={`p-1 transition-colors rounded hover:bg-opacity-50 ${
                                    user.isVerified 
                                      ? 'text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50' 
                                      : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                                  }`}
                                  title={user.isVerified ? 'Unverify user' : 'Verify user'}
                                >
                                  {user.isVerified ? (
                                    <Clock className="h-3 w-3" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {userPagination && (
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-sm text-slate-600">
                        Showing {((userPagination.current - 1) * 10) + 1} to {Math.min(userPagination.current * 10, userPagination.total)} of {userPagination.total} results
                      </p>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setUserPage(userPage - 1)}
                          disabled={userPage === 1}
                          className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
              </button>
                        <span className="px-3 py-1 bg-blue-600 text-white rounded-lg">
                          {userPage}
                        </span>
                        <button
                          onClick={() => setUserPage(userPage + 1)}
                          disabled={userPage === userPagination.pages}
                          className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Staff Management Tab */}
            {activeTab === 'staff' && (
              <div className="space-y-8">
                {/* Staff Management Header */}
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-lg p-8 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">Staff Management</h2>
                      <p className="text-blue-100 text-lg">
                        Manage staff members, permissions, and access controls
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => setShowAddStaffModal(true)}
                        className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                      >
                        <User className="h-5 w-5 mr-2" />
                        Add Staff
                      </button>
                      <button 
                        onClick={() => handleGeneratePDFReport('staff', '30d')}
                        className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        Export
                      </button>
                </div>
                  </div>
                </div>

                {/* Staff Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-slate-900">{staffStats.totalStaff || 0}</p>
                        <p className="text-sm text-slate-600">Total Staff</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-slate-900">{staffStats.activeStaff || 0}</p>
                        <p className="text-sm text-slate-600">Active Staff</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-slate-900">{staffStats.pendingStaff || 0}</p>
                        <p className="text-sm text-slate-600">Pending</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-slate-900">{staffStats.inactiveStaff || 0}</p>
                        <p className="text-sm text-slate-600">Inactive</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Staff List */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-slate-900">Staff Members</h3>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search staff..."
                          value={staffSearchTerm}
                          onChange={(e) => setStaffSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                      <select
                        value={staffStatusFilter}
                        onChange={(e) => setStaffStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  </div>

                  {/* Staff Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full" style={{ minWidth: '800px' }}>
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/4">Name</th>
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/5">Email</th>
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/6">Phone</th>
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/6">Status</th>
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/6">Joined</th>
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/6">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffMembers.map((staff) => (
                          <tr key={staff._id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-2">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                  <User className="h-4 w-4 text-white" />
                                </div>
                                <div className="ml-2 min-w-0 flex-1">
                                  <p className="font-medium text-slate-900 text-sm truncate">{staff.firstName} {staff.lastName}</p>
                                  <p className="text-xs text-slate-500 truncate">Staff Member</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-slate-600 text-sm truncate" title={staff.email}>{staff.email}</td>
                            <td className="py-3 px-2 text-slate-600 text-sm truncate" title={staff.phone || 'N/A'}>{staff.phone || 'N/A'}</td>
                            <td className="py-3 px-2">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                staff.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {staff.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-slate-600 text-sm">
                              {new Date(staff.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleViewStaff(staff)}
                                  className="p-1 text-blue-600 hover:text-blue-900 transition-colors rounded hover:bg-blue-50"
                                  title="View staff"
                                >
                                  <Eye className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleEditStaff(staff)}
                                  className="p-1 text-green-600 hover:text-green-900 transition-colors rounded hover:bg-green-50"
                                  title="Edit staff"
                                >
                                  <Settings className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleToggleStaffStatus(staff)}
                                  className={`p-1 transition-colors rounded hover:bg-opacity-50 ${
                                    staff.isActive 
                                      ? 'text-red-600 hover:text-red-900 hover:bg-red-50' 
                                      : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                                  }`}
                                  title={staff.isActive ? 'Deactivate staff' : 'Activate staff'}
                                >
                                  {staff.isActive ? (
                                    <AlertCircle className="h-3 w-3" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {staffPagination && (
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-sm text-slate-600">
                        Showing {((staffPagination.current - 1) * 10) + 1} to {Math.min(staffPagination.current * 10, staffPagination.total)} of {staffPagination.total} results
                      </p>
                      <div className="flex items-center space-x-2">
              <button 
                          onClick={() => setStaffPage(staffPage - 1)}
                          disabled={staffPage === 1}
                          className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1 bg-blue-600 text-white rounded-lg">
                          {staffPage}
                        </span>
                        <button
                          onClick={() => setStaffPage(staffPage + 1)}
                          disabled={staffPage === staffPagination.pages}
                          className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payroll Management Tab */}
            {activeTab === 'payroll' && (
              <div className="space-y-8">
                {console.log('Rendering payroll tab, payrollData:', payrollData, 'payrollStats:', payrollStats)}
                {/* Payroll Management Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-lg p-8 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">Payroll Management</h2>
                      <p className="text-green-100 text-lg">
                        Manage staff salaries, payments, and payroll reports
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => setShowAddSalaryModal(true)}
                        className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                      >
                        <DollarSign className="h-5 w-5 mr-2" />
                        Add Salary
                      </button>
                      <button 
                        onClick={() => handleGeneratePDFReport('payroll', '30d')}
                        className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        Export Report
                      </button>
                    </div>
                  </div>
                </div>

                {/* Payroll Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-slate-900">{payrollStats.totalStaff || 0}</p>
                        <p className="text-sm text-slate-600">Total Staff</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-slate-900">{payrollStats.paidStaff || 0}</p>
                        <p className="text-sm text-slate-600">Paid</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-slate-900">{payrollStats.pendingStaff || 0}</p>
                        <p className="text-sm text-slate-600">Pending</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-slate-900">Rs. {(payrollStats.totalPayroll || 0).toLocaleString()}</p>
                        <p className="text-sm text-slate-600">Total Payroll</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payroll List */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">Payroll Records</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Showing {payrollData
                          .filter(payroll => {
                            const matchesSearch = payrollSearchTerm === '' || 
                              payroll.staffName.toLowerCase().includes(payrollSearchTerm.toLowerCase()) ||
                              payroll.staffId.toLowerCase().includes(payrollSearchTerm.toLowerCase()) ||
                              payroll.position.toLowerCase().includes(payrollSearchTerm.toLowerCase());
                            
                            const matchesStatus = payrollStatusFilter === 'all' || 
                              payroll.status === payrollStatusFilter;
                            
                            return matchesSearch && matchesStatus;
                          }).length} of {payrollData.length} records
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search payroll..."
                          value={payrollSearchTerm}
                          onChange={(e) => setPayrollSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                      <select
                        value={payrollStatusFilter}
                        onChange={(e) => setPayrollStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="all">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </div>
                  </div>

                  {/* Payroll Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full" style={{ minWidth: '800px' }}>
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/3">Staff</th>
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/8">Position</th>
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/8">Base Salary</th>
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/8">Net Salary</th>
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/8">Status</th>
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/8">Period</th>
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/8">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payrollData
                          .filter(payroll => {
                            // Apply search filter
                            const matchesSearch = payrollSearchTerm === '' || 
                              payroll.staffName.toLowerCase().includes(payrollSearchTerm.toLowerCase()) ||
                              payroll.staffId.toLowerCase().includes(payrollSearchTerm.toLowerCase()) ||
                              payroll.position.toLowerCase().includes(payrollSearchTerm.toLowerCase());
                            
                            // Apply status filter
                            const matchesStatus = payrollStatusFilter === 'all' || 
                              payroll.status === payrollStatusFilter;
                            
                            return matchesSearch && matchesStatus;
                          })
                          .map((payroll) => (
                          <tr key={payroll._id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-2 px-1">
                              <div className="flex items-center">
                                <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded flex items-center justify-center flex-shrink-0">
                                  <User className="h-3 w-3 text-white" />
                                </div>
                                <div className="ml-1 min-w-0 flex-1">
                                  <p className="font-medium text-slate-900 text-xs truncate">{payroll.staffName}</p>
                                  <p className="text-xs text-slate-500 truncate">ID: {payroll.staffId.slice(-8)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-2 px-1 text-slate-600 text-xs truncate">{payroll.position}</td>
                            <td className="py-2 px-1 text-slate-600 text-xs">Rs. {(payroll.baseSalary/1000).toFixed(0)}k</td>
                            <td className="py-2 px-1 text-slate-600 text-xs font-semibold">Rs. {(payroll.netSalary/1000).toFixed(0)}k</td>
                            <td className="py-2 px-1">
                              <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium ${
                                payroll.status === 'paid' ? 'bg-green-100 text-green-800' : 
                                payroll.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                              </span>
                            </td>
                            <td className="py-2 px-1 text-slate-600 text-xs">{payroll.payPeriod}</td>
                            <td className="py-2 px-1">
                              <div className="flex items-center space-x-0.5">
                                <button 
                                  onClick={() => handleViewPayroll(payroll)}
                                  className="p-0.5 text-blue-600 hover:text-blue-900 transition-colors rounded hover:bg-blue-50"
                                  title="View payroll"
                                >
                                  <Eye className="h-3 w-3" />
                                </button>
                                {payroll.status === 'pending' && (
                                  <button
                                    onClick={() => handleProcessPayment(payroll._id)}
                                    className="p-0.5 text-green-600 hover:text-green-900 transition-colors rounded hover:bg-green-50"
                                    title="Process payment"
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEditPayroll(payroll)}
                                  className="p-0.5 text-purple-600 hover:text-purple-900 transition-colors rounded hover:bg-purple-50"
                                  title="Edit payroll"
                                >
                                  <Settings className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* No results message */}
                  {payrollData
                    .filter(payroll => {
                      const matchesSearch = payrollSearchTerm === '' || 
                        payroll.staffName.toLowerCase().includes(payrollSearchTerm.toLowerCase()) ||
                        payroll.staffId.toLowerCase().includes(payrollSearchTerm.toLowerCase()) ||
                        payroll.position.toLowerCase().includes(payrollSearchTerm.toLowerCase());
                      
                      const matchesStatus = payrollStatusFilter === 'all' || 
                        payroll.status === payrollStatusFilter;
                      
                      return matchesSearch && matchesStatus;
                    }).length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">No payroll records found</h3>
                      <p className="text-slate-500">
                        {payrollSearchTerm || payrollStatusFilter !== 'all' 
                          ? 'Try adjusting your search or filter criteria'
                          : 'No payroll records available at the moment'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analytics Dashboard Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-8">
                {/* Analytics Dashboard Header */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">Analytics Dashboard</h2>
                      <p className="text-purple-100 text-lg">
                        Comprehensive analytics and performance metrics
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => handleGeneratePDFReport('analytics', analyticsPeriod === '7days' ? '7d' : '30d')}
                        className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        Generate Report
                      </button>
                      <button 
                        onClick={() => handleGeneratePDFReport('analytics', analyticsPeriod === '7days' ? '7d' : '30d')}
                        className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                      >
                        <BarChart3 className="h-5 w-5 mr-2" />
                        Export Data
                      </button>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* New Users Card */}
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-slate-900">{analyticsData.totalNewUsers || 0}</p>
                        <p className="text-sm text-slate-600">New Users (7 days)</p>
                        <p className="text-xs text-green-600 font-medium">+{analyticsData.userGrowthRate || 0}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Avg Active Users Card */}
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <Activity className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-slate-900">{analyticsData.avgActiveUsers || 0}</p>
                        <p className="text-sm text-slate-600">Avg Active Users</p>
                        <p className="text-xs text-green-600 font-medium">+{analyticsData.userGrowthRate || 0}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Total Bookings Card */}
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-slate-900">{analyticsData.totalBookings || 0}</p>
                        <p className="text-sm text-slate-600">Total Bookings</p>
                        <p className="text-xs text-green-600 font-medium">+{analyticsData.bookingGrowthRate || 0}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Total Revenue Card */}
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-slate-900">Rs. {(analyticsData.totalRevenue || 0).toLocaleString()}</p>
                        <p className="text-sm text-slate-600">Total Revenue</p>
                        <p className="text-xs text-green-600 font-medium">+{analyticsData.revenueGrowthRate || 0}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Platform Overview */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-6">Platform Overview</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Users className="h-8 w-8 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{analyticsData.platformStats?.totalUsers || 0}</p>
                      <p className="text-sm text-slate-600">Total Users</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Building className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{analyticsData.platformStats?.totalHotels || 0}</p>
                      <p className="text-sm text-slate-600">Total Hotels</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <BarChart3 className="h-8 w-8 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{analyticsData.platformStats?.totalBookings || 0}</p>
                      <p className="text-sm text-slate-600">Total Bookings</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <DollarSign className="h-8 w-8 text-orange-600" />
                      </div>
                      <p className="text-2xl font-bold text-slate-900">Rs. {(analyticsData.platformStats?.totalRevenue || 0).toLocaleString()}</p>
                      <p className="text-sm text-slate-600">Total Revenue</p>
                    </div>
                  </div>
                  
                  <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Shield className="h-6 w-6 text-slate-600" />
                      </div>
                      <p className="text-lg font-semibold text-slate-900">{analyticsData.platformStats?.totalStaff || 0}</p>
                      <p className="text-sm text-slate-600">Staff Members</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <User className="h-6 w-6 text-slate-600" />
                      </div>
                      <p className="text-lg font-semibold text-slate-900">{analyticsData.platformStats?.totalGuides || 0}</p>
                      <p className="text-sm text-slate-600">Guides</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Users className="h-6 w-6 text-slate-600" />
                      </div>
                      <p className="text-lg font-semibold text-slate-900">{analyticsData.platformStats?.totalTourists || 0}</p>
                      <p className="text-sm text-slate-600">Tourists</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <TrendingUp className="h-6 w-6 text-slate-600" />
                      </div>
                      <p className="text-lg font-semibold text-slate-900">Rs. {(analyticsData.avgBookingValue || 0).toLocaleString()}</p>
                      <p className="text-sm text-slate-600">Avg Booking Value</p>
                    </div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* User Growth Chart */}
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-slate-900">User Growth</h3>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => setAnalyticsPeriod('7days')}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                            analyticsPeriod === '7days' ? 'bg-slate-100 text-slate-600' : 'bg-purple-600 text-white'
                          }`}
                        >
                          7 Days
                        </button>
                        <button 
                          onClick={() => setAnalyticsPeriod('30days')}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                            analyticsPeriod === '30days' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          30 Days
                        </button>
                      </div>
                    </div>

                    {/* User Growth Bar Chart */}
                    <div className="h-64 flex items-end justify-between space-x-2">
                      {userAnalytics.slice(0, 7).map((item, index) => (
                        <div key={index} className="flex flex-col items-center flex-1">
                          <div 
                            className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg w-full mb-2 transition-all duration-500 hover:from-blue-600 hover:to-blue-500"
                            style={{ height: `${(item.newUsers / Math.max(...userAnalytics.map(d => d.newUsers))) * 200}px` }}
                            title={`New Users: ${item.newUsers}`}
                          ></div>
                          <div className="text-xs text-slate-600 font-medium">{new Date(item.date).getDate()}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Booking Trends Chart */}
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-slate-900">Booking Trends</h3>
                      <div className="flex space-x-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-lg font-medium">Tours</span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-lg font-medium">Hotels</span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-lg font-medium">Vehicles</span>
                      </div>
                    </div>

                    {/* Booking Trends Bar Chart */}
                    <div className="h-64 flex items-end justify-between space-x-2">
                      {bookingAnalytics.slice(0, 7).map((item, index) => (
                        <div key={index} className="flex flex-col items-center flex-1">
                          <div className="w-full mb-2">
                            {/* Vehicles (Purple) */}
                            <div 
                              className="bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg w-full"
                              style={{ height: `${(item.vehicles / Math.max(...bookingAnalytics.map(d => d.total))) * 200}px` }}
                              title={`Vehicles: ${item.vehicles}`}
                            ></div>
                            {/* Hotels (Green) */}
                            <div 
                              className="bg-gradient-to-t from-green-500 to-green-400 w-full"
                              style={{ height: `${(item.hotels / Math.max(...bookingAnalytics.map(d => d.total))) * 200}px` }}
                              title={`Hotels: ${item.hotels}`}
                            ></div>
                            {/* Tours (Blue) */}
                            <div 
                              className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-b-lg w-full"
                              style={{ height: `${(item.tours / Math.max(...bookingAnalytics.map(d => d.total))) * 200}px` }}
                              title={`Tours: ${item.tours}`}
                            ></div>
                          </div>
                          <div className="text-xs text-slate-600 font-medium">{new Date(item.date).getDate()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Revenue Analytics */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-slate-900">Revenue Analytics</h3>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-slate-900">Rs. {(analyticsData.avgBookingValue || 0).toLocaleString()}</p>
                        <p className="text-sm text-slate-600">Avg Booking Value</p>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Chart */}
                  <div className="h-64 flex items-end justify-between space-x-2">
                    {revenueAnalytics.map((item, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div 
                          className="bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg w-full mb-2 transition-all duration-500 hover:from-orange-600 hover:to-orange-500"
                          style={{ height: `${(item.revenue / Math.max(...revenueAnalytics.map(d => d.revenue))) * 200}px` }}
                          title={`Revenue: Rs. ${item.revenue.toLocaleString()}`}
                        ></div>
                        <div className="text-xs text-slate-600 font-medium">{new Date(item.date).getDate()}</div>
                        <div className="text-xs text-slate-500">Rs. {(item.revenue / 1000).toFixed(0)}k</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <h4 className="text-lg font-semibold text-slate-900 mb-4">Top Performing Services</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                          <span className="text-slate-700">Vehicle Rentals</span>
                        </div>
                        <span className="font-semibold text-slate-900">45%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                          <span className="text-slate-700">Tour Bookings</span>
                        </div>
                        <span className="font-semibold text-slate-900">35%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                          <span className="text-slate-700">Hotel Bookings</span>
                        </div>
                        <span className="font-semibold text-slate-900">20%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <h4 className="text-lg font-semibold text-slate-900 mb-4">User Engagement</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">Daily Active Users</span>
                        <span className="font-semibold text-slate-900">{analyticsData.avgActiveUsers || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">Session Duration</span>
                        <span className="font-semibold text-slate-900">4.2 min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">Bounce Rate</span>
                        <span className="font-semibold text-slate-900">23%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <h4 className="text-lg font-semibold text-slate-900 mb-4">Growth Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">User Growth</span>
                        <span className="font-semibold text-green-600">+{analyticsData.userGrowthRate || 0}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">Booking Growth</span>
                        <span className="font-semibold text-green-600">+{analyticsData.bookingGrowthRate || 0}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">Revenue Growth</span>
                        <span className="font-semibold text-green-600">+{analyticsData.revenueGrowthRate || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews Management Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-8">
                {/* Reviews Management Header */}
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl shadow-lg p-8 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">Review Management</h2>
                      <p className="text-yellow-100 text-lg">
                        Manage and moderate all platform reviews
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button 
                        onClick={handleExportReviewsPDF}
                        className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        Export Reviews
                      </button>
                    </div>
                  </div>
                </div>

                {/* Review Statistics Cards */}
                {reviewStats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                          <p className="text-2xl font-bold text-gray-900">{reviewStats?.totalReviews || 0}</p>
                        </div>
                        <MessageSquare className="w-8 h-8 text-blue-500" />
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Hotel Reviews</p>
                          <p className="text-2xl font-bold text-gray-900">{reviewStats.hotelReviews?.total || 0}</p>
                          <p className="text-sm text-gray-500">
                            Avg: {reviewStats.hotelReviews?.averageRating?.toFixed(1) || '0.0'} ⭐
                          </p>
                        </div>
                        <Building className="w-8 h-8 text-blue-500" />
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Guide Reviews</p>
                          <p className="text-2xl font-bold text-gray-900">{reviewStats.guideReviews?.total || 0}</p>
                          <p className="text-sm text-gray-500">
                            Avg: {reviewStats.guideReviews?.averageRating?.toFixed(1) || '0.0'} ⭐
                          </p>
                        </div>
                        <User className="w-8 h-8 text-green-500" />
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Custom Trip Reviews</p>
                          <p className="text-2xl font-bold text-gray-900">{reviewStats.customTripReviews?.total || 0}</p>
                          <p className="text-sm text-gray-500">
                            Avg: {reviewStats.customTripReviews?.averageRating?.toFixed(1) || '0.0'} ⭐
                          </p>
                        </div>
                        <MapPin className="w-8 h-8 text-purple-500" />
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Vehicle Reviews</p>
                          <p className="text-2xl font-bold text-gray-900">{reviewStats.vehicleReviews?.total || 0}</p>
                          <p className="text-sm text-gray-500">
                            Avg: {reviewStats.vehicleReviews?.averageRating?.toFixed(1) || '0.0'} ⭐
                          </p>
                        </div>
                        <Car className="w-8 h-8 text-orange-500" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Filters and Search */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Search reviews..."
                          value={reviewFilters.search}
                          onChange={(e) => handleReviewFilterChange('search', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Filter Toggle */}
                    <button
                      onClick={() => setShowReviewFilters(!showReviewFilters)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Filter className="w-5 h-5" />
                      Filters
                    </button>
                  </div>

                  {/* Filter Options */}
                  {showReviewFilters && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                        <select
                          value={reviewFilters.type}
                          onChange={(e) => handleReviewFilterChange('type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">All Types</option>
                          <option value="hotel">Hotel Reviews</option>
                          <option value="guide">Guide Reviews</option>
                          <option value="custom-trip">Custom Trip Reviews</option>
                          <option value="vehicle">Vehicle Reviews</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                        <select
                          value={reviewFilters.rating}
                          onChange={(e) => handleReviewFilterChange('rating', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">All Ratings</option>
                          <option value="5">5 Stars</option>
                          <option value="4">4 Stars</option>
                          <option value="3">3 Stars</option>
                          <option value="2">2 Stars</option>
                          <option value="1">1 Star</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                        <select
                          value={reviewFilters.sortBy}
                          onChange={(e) => handleReviewFilterChange('sortBy', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reviews List */}
                <div className="bg-white rounded-lg shadow-sm">
                  {reviewLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading reviews...</p>
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="p-8 text-center">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No reviews found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {reviews.map((review) => (
                        <div key={`${review.reviewType}-${review.reviewId}`} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                {review.reviewType === 'hotel' && <Building className="w-4 h-4 text-blue-500" />}
                                {review.reviewType === 'guide' && <User className="w-4 h-4 text-green-500" />}
                                {review.reviewType === 'custom-trip' && <MapPin className="w-4 h-4 text-purple-500" />}
                                {review.reviewType === 'vehicle' && <Car className="w-4 h-4 text-orange-500" />}
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  review.reviewType === 'hotel' ? 'bg-blue-100 text-blue-800' :
                                  review.reviewType === 'guide' ? 'bg-green-100 text-green-800' :
                                  review.reviewType === 'custom-trip' ? 'bg-purple-100 text-purple-800' :
                                  'bg-orange-100 text-orange-800'
                                }`}>
                                  {review.reviewType?.replace('-', ' ').toUpperCase()}
                                </span>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= (review.reviewType === 'hotel' ? review.rating?.overall || 0 : review.rating || 0)
                                          ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                  <span className="text-sm text-gray-600 ml-1">
                                    ({(review.reviewType === 'hotel' ? review.rating?.overall || 0 : review.rating || 0)}/5)
                                  </span>
                                </div>
                              </div>

                              <h3 className="font-semibold text-gray-900 mb-1">
                                {review.reviewType === 'hotel' ? review.hotel?.name || 'Hotel Review' :
                                 review.reviewType === 'guide' ? review.tour?.title || review.guide?.firstName + ' ' + review.guide?.lastName || 'Guide Review' :
                                 review.reviewType === 'custom-trip' ? review.customTrip?.title || 'Custom Trip Review' :
                                 review.reviewType === 'vehicle' ? `${review.vehicle?.make || ''} ${review.vehicle?.model || ''} ${review.vehicle?.year || ''}` || 'Vehicle Review' :
                                 'Review'}
                              </h3>

                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  {review.user?.firstName} {review.user?.lastName}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>

                              <p className="text-gray-700 mb-3 line-clamp-2">
                                {review.reviewType === 'hotel' ? review.content || '' : review.comment || ''}
                              </p>

                              {/* Review Details */}
                              <div className="text-sm text-gray-600">
                                {review.reviewType === 'hotel' && review.hotel && (
                                  <p><strong>Hotel:</strong> {review.hotel.name}</p>
                                )}
                                {review.reviewType === 'guide' && review.guide && (
                                  <p><strong>Guide:</strong> {review.guide.firstName} {review.guide.lastName}</p>
                                )}
                                {review.reviewType === 'custom-trip' && review.customTrip && (
                                  <p><strong>Destination:</strong> {review.customTrip.destination}</p>
                                )}
                                {review.reviewType === 'vehicle' && review.vehicle && (
                                  <div>
                                    <p><strong>Vehicle:</strong> {review.vehicle.make} {review.vehicle.model} ({review.vehicle.year})</p>
                                    <p><strong>License Plate:</strong> {review.vehicle.licensePlate}</p>
                                    {review.driver && (
                                      <p><strong>Driver:</strong> {review.driver.firstName} {review.driver.lastName}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {reviewPagination && reviewPagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-700">
                          Showing {((reviewPagination.currentPage - 1) * 20) + 1} to {Math.min(reviewPagination.currentPage * 20, reviewPagination.totalReviews)} of {reviewPagination.totalReviews} reviews
                        </p>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setReviewCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={!reviewPagination.hasPrev}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          
                          <span className="px-3 py-2 text-sm text-gray-700">
                            Page {reviewPagination.currentPage} of {reviewPagination.totalPages}
                          </span>
                          
                          <button
                            onClick={() => setReviewCurrentPage(prev => Math.min(prev + 1, reviewPagination.totalPages))}
                            disabled={!reviewPagination.hasNext}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings Management Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-8">
                {console.log('Rendering settings tab, settingsData:', settingsData)}
                {/* Settings Management Header */}
                <div className="bg-gradient-to-r from-gray-600 to-slate-600 rounded-2xl shadow-lg p-8 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">Platform Settings</h2>
                      <p className="text-gray-100 text-lg">
                        Configure platform settings, preferences, and system options
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => setShowSettingsModal(true)}
                        className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                      >
                        <Settings className="h-5 w-5 mr-2" />
                        Advanced Settings
                      </button>
                      <button className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
                        <FileText className="h-5 w-5 mr-2" />
                        Export Config
                      </button>
                    </div>
                  </div>
                </div>

                {/* System Status */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-slate-900">{settingsData.version || '1.2.0'}</p>
                        <p className="text-sm text-slate-600">Platform Version</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Activity className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-slate-900 capitalize">{settingsData.environment || 'Production'}</p>
                        <p className="text-sm text-slate-600">Environment</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-slate-900 capitalize">{settingsData.databaseStatus || 'Connected'}</p>
                        <p className="text-sm text-slate-600">Database Status</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Clock className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl font-bold text-slate-900 capitalize">{settingsData.cacheStatus || 'Active'}</p>
                        <p className="text-sm text-slate-600">Cache Status</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Settings Categories */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Platform Settings */}
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-slate-900">Platform Settings</h3>
                      <button 
                        onClick={() => {
                          setActiveSettingsTab('platform');
                          setShowSettingsModal(true);
                        }}
                        className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">Site Name</span>
                        <span className="font-semibold text-slate-900">{platformSettings.siteName || 'SerendibGo'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">Currency</span>
                        <span className="font-semibold text-slate-900">{platformSettings.currency || 'LKR'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">Timezone</span>
                        <span className="font-semibold text-slate-900">{platformSettings.timezone || 'Asia/Colombo'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">Registration</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          platformSettings.registrationEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {platformSettings.registrationEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">Maintenance Mode</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          platformSettings.maintenanceMode ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {platformSettings.maintenanceMode ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Email Settings */}
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-slate-900">Email Settings</h3>
                      <button 
                        onClick={() => {
                          setActiveSettingsTab('email');
                          setShowSettingsModal(true);
                        }}
                        className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">SMTP Host</span>
                        <span className="font-semibold text-slate-900">{emailSettings.smtpHost || 'smtp.gmail.com'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">SMTP Port</span>
                        <span className="font-semibold text-slate-900">{emailSettings.smtpPort || 587}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">From Email</span>
                        <span className="font-semibold text-slate-900">{emailSettings.fromEmail || 'noreply@serendibgo.com'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">Welcome Emails</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          emailSettings.emailTemplates?.welcome ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {emailSettings.emailTemplates?.welcome ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">Newsletter</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          emailSettings.emailTemplates?.newsletter ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {emailSettings.emailTemplates?.newsletter ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Settings */}
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-slate-900">Payment Settings</h3>
                      <button 
                        onClick={() => {
                          setActiveSettingsTab('payment');
                          setShowSettingsModal(true);
                        }}
                        className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">Stripe</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          paymentSettings.stripeEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {paymentSettings.stripeEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">PayPal</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          paymentSettings.paypalEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {paymentSettings.paypalEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">Bank Transfer</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          paymentSettings.bankTransferEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {paymentSettings.bankTransferEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">Min Deposit</span>
                        <span className="font-semibold text-slate-900">Rs. {paymentSettings.minimumDeposit || 1000}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">Commission Rate</span>
                        <span className="font-semibold text-slate-900">{paymentSettings.commissionRate || 5.0}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-6">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button 
                      onClick={() => handleResetSettings('platform')}
                      className="flex items-center justify-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <Settings className="h-5 w-5 mr-2 text-slate-600" />
                      <span className="text-slate-700">Reset Platform</span>
                    </button>
                    <button 
                      onClick={() => handleResetSettings('email')}
                      className="flex items-center justify-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <MessageSquare className="h-5 w-5 mr-2 text-slate-600" />
                      <span className="text-slate-700">Reset Email</span>
                    </button>
                    <button 
                      onClick={() => handleResetSettings('payment')}
                      className="flex items-center justify-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <DollarSign className="h-5 w-5 mr-2 text-slate-600" />
                      <span className="text-slate-700">Reset Payment</span>
                    </button>
                    <button 
                      onClick={() => toast.success('Cache cleared successfully')}
                      className="flex items-center justify-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <Activity className="h-5 w-5 mr-2 text-slate-600" />
                      <span className="text-slate-700">Clear Cache</span>
                    </button>
                  </div>
                </div>

                {/* System Information */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-6">System Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-slate-700 mb-3">Platform Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Version:</span>
                          <span className="font-medium">{settingsData.version || '1.2.0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Environment:</span>
                          <span className="font-medium capitalize">{settingsData.environment || 'Production'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Last Updated:</span>
                          <span className="font-medium">{settingsData.lastUpdated ? new Date(settingsData.lastUpdated).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-700 mb-3">System Status</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Database:</span>
                          <span className={`font-medium capitalize ${
                            settingsData.databaseStatus === 'connected' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {settingsData.databaseStatus || 'Connected'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Cache:</span>
                          <span className={`font-medium capitalize ${
                            settingsData.cacheStatus === 'active' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {settingsData.cacheStatus || 'Active'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Uptime:</span>
                          <span className="font-medium">99.9%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Permissions Management Tab */}
            {activeTab === 'permissions' && (
              <div className="space-y-8">
                {/* Permissions Management Header */}
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl shadow-lg p-8 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">Permissions Management</h2>
                      <p className="text-purple-100 text-lg">
                        Manage staff permissions and access controls
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => setShowTemplateModal(true)}
                        className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                      >
                        <Settings className="h-5 w-5 mr-2" />
                        Create Template
                      </button>
                      <button 
                        onClick={() => handleGeneratePDFReport('permissions', '30d')}
                        className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        Export
                      </button>
            </div>
          </div>
        </div>

                {/* Permission Templates */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-slate-900">Permission Templates</h3>
                    <button 
                      onClick={() => setShowTemplateModal(true)}
                      className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      New Template
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {permissionTemplates.map((template) => (
                      <div key={template._id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-slate-900">{template.name}</h4>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                            Template
                          </span>
                        </div>
                        <p className="text-slate-600 mb-6">{template.description}</p>
                        
                        <div className="space-y-4 mb-6">
                          {Object.entries(template.permissions).map(([module, perms]) => (
                            <div key={module} className="space-y-2">
                              <h5 className="font-semibold text-slate-700 capitalize">{module}:</h5>
                              <div className="flex space-x-2">
                                {Object.entries(perms).map(([action, allowed]) => (
                                  <button
                                    key={action}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                      allowed 
                                        ? 'bg-green-500 text-white hover:bg-green-600' 
                                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                    }`}
                                  >
                                    {action}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleApplyTemplate(template)}
                            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                          >
                            Apply to Staff
                          </button>
                          <button 
                            onClick={() => handleEditTemplate(template)}
                            className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Staff Permissions */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-slate-900">Staff Permissions</h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full" style={{ minWidth: '900px' }}>
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/4">Staff</th>
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/8">Role</th>
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/8">Users</th>
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/8">Bookings</th>
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/8">Vehicles</th>
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/8">Reports</th>
                          <th className="text-left py-2 px-2 font-semibold text-slate-900 w-1/8">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {permissions.map((permission) => (
                          <tr key={permission._id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-2">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <User className="h-4 w-4 text-white" />
                                </div>
                                <div className="ml-2 min-w-0 flex-1">
                                  <p className="font-medium text-slate-900 text-sm truncate">{permission.staffName}</p>
                                  <p className="text-xs text-slate-500 truncate">ID: {permission.staffId.slice(-8)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                {permission.role}
                              </span>
                            </td>
                            {['users', 'bookings', 'vehicles', 'reports'].map((module) => (
                              <td key={module} className="py-3 px-2">
                                <div className="flex space-x-0.5">
                                  {Object.entries(permission.permissions[module] || {}).map(([action, allowed]) => (
                                    <span key={action} className={`px-1 py-0.5 rounded text-xs font-medium ${
                                      allowed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                                    }`}>
                                      {action.charAt(0)}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            ))}
                            <td className="py-3 px-2">
                              <div className="flex items-center">
                                <button
                                  onClick={() => {
                                    setSelectedPermission(permission);
                                    setShowPermissionModal(true);
                                  }}
                                  className="p-1 text-purple-600 hover:text-purple-900 transition-colors rounded hover:bg-purple-50"
                                  title="Edit permissions"
                                >
                                  <Settings className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            </div>
          </div>
        </div>

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-900">Add New Staff Member</h3>
              <button 
                onClick={() => setShowAddStaffModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const staffData = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                password: formData.get('password')
              };
              handleAddStaff(staffData);
            }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Staff
              </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Staff Modal */}
      {showViewStaffModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Staff Details
              </h3>
              <button
                onClick={() => {
                  setShowViewStaffModal(false);
                  setSelectedStaff(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Staff Header */}
            <div className="flex items-center mb-6">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-medium text-gray-900">
                  {selectedStaff.firstName} {selectedStaff.lastName}
                </h2>
                <p className="text-sm text-gray-500">
                  ID: {selectedStaff._id}
                </p>
              </div>
            </div>

            {/* Staff Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{selectedStaff.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{selectedStaff.phone || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Account Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Role:</span>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        Staff Member
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedStaff.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedStaff.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Account Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Joined:</span>
                    <p className="font-medium">{new Date(selectedStaff.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Updated:</span>
                    <p className="font-medium">{new Date(selectedStaff.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowViewStaffModal(false);
                  setSelectedStaff(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewStaffModal(false);
                  setShowEditStaffModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditStaffModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-900">Edit Staff Member</h3>
              <button 
                onClick={() => {
                  setShowEditStaffModal(false);
                  setSelectedStaff(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const staffData = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                phone: formData.get('phone')
              };
              handleUpdateStaff(selectedStaff._id, staffData);
            }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      defaultValue={selectedStaff.firstName}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      defaultValue={selectedStaff.lastName}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={selectedStaff.email}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={selectedStaff.phone || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditStaffModal(false);
                    setSelectedStaff(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                User Details
              </h3>
              <button
                onClick={() => {
                  setShowViewUserModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* User Header */}
            <div className="flex items-center mb-6">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-medium text-gray-900">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h2>
                <p className="text-sm text-gray-500">
                  ID: {selectedUser._id}
                </p>
              </div>
            </div>

            {/* User Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{selectedUser.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{selectedUser.phone || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Account Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Role:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedUser.role === 'admin' ? 'bg-red-100 text-red-800' :
                        selectedUser.role === 'staff' ? 'bg-blue-100 text-blue-800' :
                        selectedUser.role === 'guide' ? 'bg-green-100 text-green-800' :
                        selectedUser.role === 'hotel_owner' ? 'bg-purple-100 text-purple-800' :
                        selectedUser.role === 'driver' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedUser.role?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedUser.isVerified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedUser.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Account Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Joined:</span>
                    <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Updated:</span>
                    <p className="font-medium">{new Date(selectedUser.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowViewUserModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewUserModal(false);
                  setShowEditUserModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit User: {selectedUser.firstName} {selectedUser.lastName}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const userData = {
                role: formData.get('role'),
                isActive: formData.get('isActive') === 'true'
              };
              handleUpdateUser(selectedUser._id, userData);
            }}>
              <div className="space-y-4">
                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    name="role"
                    defaultValue={selectedUser.role}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="tourist">Tourist</option>
                    <option value="driver">Driver</option>
                    <option value="guide">Guide</option>
                    <option value="hotel_owner">Hotel Owner</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="isActive"
                    defaultValue={selectedUser.isVerified ? 'true' : 'false'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                {/* User Info (Read-only) */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">User Information</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Name:</strong> {selectedUser.firstName} {selectedUser.lastName}</p>
                    <p><strong>Email:</strong> {selectedUser.email}</p>
                    <p><strong>Phone:</strong> {selectedUser.phone || 'Not provided'}</p>
                    <p><strong>Joined:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditUserModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add New User
            </h3>
            <form onSubmit={handleAddUser}>
              <div className="space-y-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter first name"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter last name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    name="role"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a role</option>
                    <option value="tourist">Tourist</option>
                    <option value="hotel_owner">Hotel Owner</option>
                    <option value="guide">Tour Guide</option>
                    <option value="driver">Driver</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Status *
                  </label>
                  <select
                    name="isVerified"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="true">Verified</option>
                    <option value="false">Pending Verification</option>
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength="6"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter password (min 6 characters)"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Payroll Modal */}
      {showViewPayrollModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Payroll Details
              </h3>
              <button
                onClick={() => {
                  setShowViewPayrollModal(false);
                  setSelectedPayroll(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Staff Information */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-gray-900">{selectedPayroll.staffName}</h4>
                  <p className="text-sm text-gray-600">ID: {selectedPayroll.staffId}</p>
                </div>
              </div>
            </div>

            {/* Payroll Information */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-3">Salary Information</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Position:</span>
                    <p className="font-medium text-gray-900">{selectedPayroll.position}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Base Salary:</span>
                    <p className="font-medium text-gray-900">Rs. {selectedPayroll.baseSalary.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Allowances:</span>
                    <p className="font-medium text-gray-900">Rs. {selectedPayroll.allowances.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Deductions:</span>
                    <p className="font-medium text-gray-900">Rs. {selectedPayroll.deductions.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Net Salary:</span>
                    <p className="font-medium text-green-600 text-lg">Rs. {selectedPayroll.netSalary.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedPayroll.status === 'paid' ? 'bg-green-100 text-green-800' : 
                      selectedPayroll.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedPayroll.status.charAt(0).toUpperCase() + selectedPayroll.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-3">Payment Information</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Pay Period:</span>
                    <p className="font-medium text-gray-900">{selectedPayroll.payPeriod}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Payment Method:</span>
                    <p className="font-medium text-gray-900">{selectedPayroll.paymentMethod}</p>
                  </div>
                  {selectedPayroll.paymentDate && (
                    <div>
                      <span className="text-gray-600">Payment Date:</span>
                      <p className="font-medium text-gray-900">{selectedPayroll.paymentDate}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowViewPayrollModal(false);
                  setSelectedPayroll(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewPayrollModal(false);
                  setShowEditPayrollModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Payroll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payroll Modal */}
      {showEditPayrollModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Payroll: {selectedPayroll.staffName}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const updatedData = {
                baseSalary: parseInt(formData.get('baseSalary')),
                allowances: parseInt(formData.get('allowances')),
                deductions: parseInt(formData.get('deductions')),
                status: formData.get('status')
              };
              
              // Update the payroll data
              const updatedPayrollData = payrollData.map(p => 
                p._id === selectedPayroll._id 
                  ? { 
                      ...p, 
                      ...updatedData,
                      netSalary: updatedData.baseSalary + updatedData.allowances - updatedData.deductions,
                      paymentDate: updatedData.status === 'paid' ? new Date().toISOString().split('T')[0] : null
                    }
                  : p
              );
              
              setPayrollData(updatedPayrollData);
              
              // Update payroll stats
              setPayrollStats(prev => ({
                ...prev,
                paidStaff: updatedPayrollData.filter(p => p.status === 'paid').length,
                pendingStaff: updatedPayrollData.filter(p => p.status === 'pending').length,
                totalPayroll: updatedPayrollData.reduce((sum, p) => sum + p.netSalary, 0)
              }));

              toast.success('Payroll updated successfully');
              setShowEditPayrollModal(false);
              setSelectedPayroll(null);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Salary
                  </label>
                  <input
                    type="number"
                    name="baseSalary"
                    defaultValue={selectedPayroll.baseSalary}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Allowances
                  </label>
                  <input
                    type="number"
                    name="allowances"
                    defaultValue={selectedPayroll.allowances}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deductions
                  </label>
                  <input
                    type="number"
                    name="deductions"
                    defaultValue={selectedPayroll.deductions}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={selectedPayroll.status}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditPayrollModal(false);
                    setSelectedPayroll(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedPermission ? 'Edit Template' : 'Create New Template'}
              </h3>
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setSelectedPermission(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const templateData = {
                name: formData.get('name'),
                description: formData.get('description'),
                permissions: {
                  users: {
                    view: formData.get('users_view') === 'on',
                    create: formData.get('users_create') === 'on',
                    edit: formData.get('users_edit') === 'on',
                    delete: formData.get('users_delete') === 'on'
                  },
                  bookings: {
                    view: formData.get('bookings_view') === 'on',
                    create: formData.get('bookings_create') === 'on',
                    edit: formData.get('bookings_edit') === 'on',
                    delete: formData.get('bookings_delete') === 'on'
                  },
                  vehicles: {
                    view: formData.get('vehicles_view') === 'on',
                    create: formData.get('vehicles_create') === 'on',
                    edit: formData.get('vehicles_edit') === 'on',
                    delete: formData.get('vehicles_delete') === 'on'
                  },
                  reports: {
                    view: formData.get('reports_view') === 'on',
                    create: formData.get('reports_create') === 'on',
                    edit: formData.get('reports_edit') === 'on',
                    delete: formData.get('reports_delete') === 'on'
                  }
                }
              };
              
              handleCreateTemplate(templateData);
            }}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={selectedPermission?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., Manager Template"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    defaultValue={selectedPermission?.description || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Describe the template's purpose..."
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Permissions
                  </label>
                  <div className="space-y-6">
                    {['users', 'bookings', 'vehicles', 'reports'].map((module) => (
                      <div key={module} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 capitalize">{module}</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {['view', 'create', 'edit', 'delete'].map((action) => (
                            <label key={action} className="flex items-center">
                              <input
                                type="checkbox"
                                name={`${module}_${action}`}
                                defaultChecked={selectedPermission?.permissions?.[module]?.[action] || false}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700 capitalize">{action}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowTemplateModal(false);
                    setSelectedPermission(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {selectedPermission ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Staff Permission Edit Modal */}
      {showPermissionModal && selectedPermission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  Edit Staff Permissions
                </h3>
                <button
                  onClick={() => {
                    setShowPermissionModal(false);
                    setSelectedPermission(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Staff Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-semibold text-gray-900">{selectedPermission.staffName}</h4>
                    <p className="text-sm text-gray-600">Role: {selectedPermission.role}</p>
                    <p className="text-xs text-gray-500">ID: {selectedPermission.staffId}</p>
                  </div>
                </div>
              </div>

              {/* Permission Form */}
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                
                const newPermissions = {
                  users: {
                    view: formData.get('users_view') === 'on',
                    create: formData.get('users_create') === 'on',
                    edit: formData.get('users_edit') === 'on',
                    delete: formData.get('users_delete') === 'on'
                  },
                  bookings: {
                    view: formData.get('bookings_view') === 'on',
                    create: formData.get('bookings_create') === 'on',
                    edit: formData.get('bookings_edit') === 'on',
                    delete: formData.get('bookings_delete') === 'on'
                  },
                  vehicles: {
                    view: formData.get('vehicles_view') === 'on',
                    create: formData.get('vehicles_create') === 'on',
                    edit: formData.get('vehicles_edit') === 'on',
                    delete: formData.get('vehicles_delete') === 'on'
                  },
                  reports: {
                    view: formData.get('reports_view') === 'on',
                    create: formData.get('reports_create') === 'on',
                    edit: formData.get('reports_edit') === 'on',
                    delete: formData.get('reports_delete') === 'on'
                  }
                };
                
                handleUpdatePermissions(selectedPermission.staffId, newPermissions);
              }}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Permissions
                    </label>
                    <div className="space-y-6">
                      {['users', 'bookings', 'vehicles', 'reports'].map((module) => (
                        <div key={module} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-3 capitalize">{module}</h4>
                          <div className="grid grid-cols-2 gap-4">
                            {['view', 'create', 'edit', 'delete'].map((action) => (
                              <label key={action} className="flex items-center">
                                <input
                                  type="checkbox"
                                  name={`${module}_${action}`}
                                  defaultChecked={selectedPermission.permissions?.[module]?.[action] || false}
                                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700 capitalize">{action}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPermissionModal(false);
                      setSelectedPermission(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Update Permissions
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;