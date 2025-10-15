import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { TourProvider } from './context/TourContext'
import { HotelProvider } from './context/hotels/HotelContext'
import { VehicleProvider } from './context/vehicles/VehicleContext'
import { NotificationProvider } from './context/NotificationContext'
import { ChatbotProvider } from './context/ChatbotContext'

// Layout Components
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/common/ProtectedRoute'
import StaffProtectedRoute from './components/common/StaffProtectedRoute'


// Pages
import Home from './pages/Home'
import Tours from './pages/Tours'
import TourDetails from './pages/TourDetails'
import Guides from './pages/Guides'
import GuideDetail from './pages/Guide/GuideDetail'
import GuideDashboard from './pages/Guide/GuideDashboard'
import GuideSupport from './pages/Guide/GuideSupport'
import GuideNotifications from './pages/Guide/GuideNotifications'
import GuideSettings from './pages/Guide/GuideSettings'
import GuideSchedule from './pages/Guide/GuideSchedule'
import GuideReviews from './pages/Guide/GuideReviews'
import GuideProfile from './pages/Guide/GuideProfile'
import GuideEarnings from './pages/Guide/GuideEarnings'
import GuideAnalytics from './pages/Guide/GuideAnalytics'
import Hotels from './pages/Hotels'
import Payment from './pages/Payment'
import PaymentSuccess from './pages/PaymentSuccess'
import Vehicles from './pages/Vehicles'
import MyBookings from './pages/MyBookings'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Booking from './pages/Booking'
import CustomTrip from './pages/CustomTrip'
import NotFound from './pages/NotFound'
import Notifications from './pages/Notifications'
import Contact from './pages/Contact'

// Admin Pages
import AdminDashboard from './pages/admin/dashboard/AdminDashboard'
import AdminTours from './pages/admin/AdminTours'
import AdminBookings from './pages/admin/AdminBookings'
import AdminRefundManagement from './pages/admin/AdminRefundManagement'

// Staff Pages
import StaffDashboard from './pages/Staff/StaffDashboard'
import CustomTripApprovalForm from './pages/Staff/CustomTripApprovalForm'

// Hotel Pages
import HotelSearch from './pages/hotels/HotelSearch'
import HotelDetails from './pages/hotels/HotelDetails'
import RoomDetails from './pages/hotels/RoomDetails'
import HotelBooking from './pages/hotels/HotelBooking'
import HotelPayment from './pages/hotels/booking/Payment'
import BookingConfirmation from './pages/hotels/booking/BookingConfirmation'
import HotelReviews from './pages/hotels/reviews/HotelReviews'
import StaffManagement from './pages/admin/staff/StaffManagement'
import AnalyticsDashboard from './pages/admin/analytics/AnalyticsDashboard'
import AdminVehicleManagement from './pages/admin/vehicles/AdminVehicleManagement'
import NotificationManagement from './pages/notifications/NotificationManagement'
import EarningsDashboard from './pages/earnings/EarningsDashboard'
import PricingManagement from './pages/pricing/PricingManagement'
import HotelOwnerRegistration from './pages/hotels/HotelOwnerRegistration'
import HotelOwnerDashboard from './pages/hotels/HotelOwnerDashboard'
import ManageRooms from './pages/hotels/ManageRooms'
import ManageBookings from './pages/hotels/ManageBookings'
import RoomAvailabilityCalendar from './pages/hotels/RoomAvailabilityCalendar'
import EditHotel from './pages/hotels/EditHotel'

// Vehicle Components
import VehicleOwnerRegistration from './pages/vehicles/VehicleOwnerRegistration'
import VehicleOwnerDashboard from './pages/vehicles/VehicleOwnerDashboard'
import AddVehicle from './pages/vehicles/AddVehicle'
import VehicleDetails from './pages/vehicles/VehicleDetails'
import VehicleEdit from './pages/vehicles/VehicleEdit'
import VehicleAvailabilityManagement from './pages/vehicles/VehicleAvailabilityManagement'
import VehiclePricingManagement from './pages/vehicles/VehiclePricingManagement'
import VehicleIntegrationManagement from './pages/vehicles/VehicleIntegrationManagement'
import VehicleBookingRequests from './pages/vehicles/VehicleBookingRequests'
import TripManagement from './pages/vehicles/TripManagement'
import DriverManagement from './pages/vehicles/DriverManagement'
import DriverRegistration from './pages/vehicles/DriverRegistration'
import DriverDashboard from './pages/vehicles/DriverDashboard'
import DriverVehicleRegistration from './pages/vehicles/DriverVehicleRegistration'
import VehicleSearchInterface from './pages/vehicles/VehicleSearchInterface'
import VehicleBookingFlow from './pages/vehicles/VehicleBookingFlow'
import GPSTracking from './pages/vehicles/GPSTracking'
import MaintenanceTracking from './pages/vehicles/MaintenanceTracking'
import RevenueManagement from './pages/vehicles/RevenueManagement'

function App() {
  return (
    <AuthProvider>
      <TourProvider>
        <HotelProvider>
          <VehicleProvider>
            <NotificationProvider>
              <ChatbotProvider>
                <div className="min-h-screen bg-base-100" data-theme="serendibgo">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              
              
              {/* Protected Routes with Layout */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="tours" element={<Tours />} />
                <Route path="tours/:id" element={<TourDetails />} />
                <Route path="guides" element={<Guides />} />
                <Route path="guides/:id" element={<GuideDetail />} />
                
                {/* Staff Dashboard Route */}
                <Route path="staff" element={
                  <StaffProtectedRoute allowedRoles={['staff', 'admin', 'super_admin', 'manager', 'support_staff']}>
                    <StaffDashboard />
                  </StaffProtectedRoute>
                } />
                <Route path="guide/dashboard" element={
                  <ProtectedRoute allowedRoles={['guide']}>
                    <GuideDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="guide" element={
                  <ProtectedRoute allowedRoles={['guide']}>
                    <GuideDashboard />
                  </ProtectedRoute>
                } />
                <Route path="guide-support" element={
                  <ProtectedRoute allowedRoles={['guide']}>
                    <GuideSupport />
                  </ProtectedRoute>
                } />
                <Route path="guide-notifications" element={
                  <ProtectedRoute allowedRoles={['guide']}>
                    <GuideNotifications />
                  </ProtectedRoute>
                } />
                <Route path="guide/settings" element={
                  <ProtectedRoute allowedRoles={['guide']}>
                    <GuideSettings />
                  </ProtectedRoute>
                } />
                <Route path="guide/schedule" element={
                  <ProtectedRoute allowedRoles={['guide']}>
                    <GuideSchedule />
                  </ProtectedRoute>
                } />
                <Route path="guide/reviews" element={
                  <ProtectedRoute allowedRoles={['guide']}>
                    <GuideReviews />
                  </ProtectedRoute>
                } />
                <Route path="guide/profile" element={
                  <ProtectedRoute allowedRoles={['guide']}>
                    <GuideProfile />
                  </ProtectedRoute>
                } />
                <Route path="guide/earnings" element={
                  <ProtectedRoute allowedRoles={['guide']}>
                    <GuideEarnings />
                  </ProtectedRoute>
                } />
                <Route path="guide/analytics" element={
                  <ProtectedRoute allowedRoles={['guide']}>
                    <GuideAnalytics />
                  </ProtectedRoute>
                } />
                <Route path="hotels" element={<HotelSearch />} />
                <Route path="hotels/:id" element={<HotelDetails />} />
                <Route path="hotels/:hotelId/rooms/:roomId" element={<RoomDetails />} />
                <Route path="hotels/:id/booking" element={<HotelBooking />} />
                <Route path="hotel-payment/:bookingId" element={<HotelPayment />} />
                <Route path="booking-confirmation/:bookingId" element={<BookingConfirmation />} />
                <Route path="hotels/:id/reviews" element={<HotelReviews />} />
                
                {/* Admin Routes */}
                <Route path="admin/dashboard" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="admin/staff" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <StaffManagement />
                  </ProtectedRoute>
                } />
                <Route path="admin/analytics" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AnalyticsDashboard />
                  </ProtectedRoute>
                } />
                <Route path="admin/notifications" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <NotificationManagement />
                  </ProtectedRoute>
                } />
                <Route path="admin/hotels" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                      <div className="bg-white p-8 rounded-lg shadow-sm border">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Hotel Management</h2>
                        <p className="text-gray-600">Hotel approval and management features coming soon...</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="admin/vehicles" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminVehicleManagement />
                  </ProtectedRoute>
                } />
                <Route path="admin/settings" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                      <div className="bg-white p-8 rounded-lg shadow-sm border">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Platform Settings</h2>
                        <p className="text-gray-600">Platform configuration features coming soon...</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="earnings" element={
                  <ProtectedRoute allowedRoles={['hotel_owner']}>
                    <EarningsDashboard />
                  </ProtectedRoute>
                } />
                <Route path="pricing" element={
                  <ProtectedRoute allowedRoles={['hotel_owner']}>
                    <PricingManagement />
                  </ProtectedRoute>
                } />
                <Route path="vehicles" element={<Vehicles />} />
                <Route path="vehicles/:vehicleId" element={<VehicleDetails />} />
                
                {/* User Dashboard */}
                <Route path="dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                {/* Profile */}
                <Route path="profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                
                {/* My Bookings */}
                <Route path="my-bookings" element={
                  <ProtectedRoute>
                    <MyBookings />
                  </ProtectedRoute>
                } />
                
                {/* Notifications */}
                <Route path="notifications" element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                } />
                
                {/* Contact/Support */}
                <Route path="contact" element={<Contact />} />
                
                {/* Booking Flow */}
                <Route path="booking/:tourId" element={
                  <ProtectedRoute>
                    <Booking />
                  </ProtectedRoute>
                } />
                
                {/* Vehicle Booking */}
                <Route path="booking" element={
                  <ProtectedRoute>
                    <Booking />
                  </ProtectedRoute>
                } />
                
                 <Route path="payment" element={
                   <ProtectedRoute>
                     <Payment />
                   </ProtectedRoute>
                 } />
                 
                 <Route path="payment/:bookingId" element={
                   <ProtectedRoute>
                     <Payment />
                   </ProtectedRoute>
                 } />
                
                <Route path="payment-success" element={
                  <ProtectedRoute>
                    <PaymentSuccess />
                  </ProtectedRoute>
                } />
                
                {/* Custom Trip */}
                <Route path="custom-trip" element={<CustomTrip />} />
                
                {/* Admin Routes */}
                <Route path="admin" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="admin/tours" element={
                  <ProtectedRoute allowedRoles={['admin', 'guide']}>
                    <AdminTours />
                  </ProtectedRoute>
                } />
                
                
                <Route path="admin/bookings" element={
                  <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <AdminBookings />
                  </ProtectedRoute>
                } />
                
                <Route path="admin/refunds" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminRefundManagement />
                  </ProtectedRoute>
                } />
                
                <Route path="staff/custom-trips/:tripId/approve" element={
                  <ProtectedRoute allowedRoles={['staff', 'admin']}>
                    <CustomTripApprovalForm />
                  </ProtectedRoute>
                } />
                
                {/* Hotel Owner Routes */}
                <Route path="hotel-owner/register" element={
                  <ProtectedRoute allowedRoles={['hotel_owner']}>
                    <HotelOwnerRegistration />
                  </ProtectedRoute>
                } />
                
                <Route path="hotel-owner/dashboard" element={
                  <ProtectedRoute allowedRoles={['hotel_owner']}>
                    <HotelOwnerDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="hotel-owner" element={
                  <ProtectedRoute allowedRoles={['hotel_owner']}>
                    <HotelOwnerDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="hotel-owner/hotels/:hotelId/rooms" element={
                  <ProtectedRoute allowedRoles={['hotel_owner']}>
                    <ManageRooms />
                  </ProtectedRoute>
                } />
                
                <Route path="hotel-owner/hotels/:hotelId/bookings" element={
                  <ProtectedRoute allowedRoles={['hotel_owner']}>
                    <ManageBookings />
                  </ProtectedRoute>
                } />
                
                <Route path="hotel-owner/rooms/:roomId/availability" element={
                  <ProtectedRoute allowedRoles={['hotel_owner']}>
                    <RoomAvailabilityCalendar />
                  </ProtectedRoute>
                } />
                
                <Route path="hotel-owner/hotels/:hotelId/edit" element={
                  <ProtectedRoute allowedRoles={['hotel_owner']}>
                    <EditHotel />
                  </ProtectedRoute>
                } />
                
                {/* Vehicle Owner Routes */}
                <Route path="vehicle-owner/register" element={
                  <ProtectedRoute allowedRoles={['vehicle_owner']}>
                    <VehicleOwnerRegistration />
                  </ProtectedRoute>
                } />
                
                <Route path="vehicle-owner/dashboard" element={
                  <ProtectedRoute allowedRoles={['vehicle_owner']}>
                    <VehicleOwnerDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="vehicle-owner" element={
                  <ProtectedRoute allowedRoles={['vehicle_owner']}>
                    <VehicleOwnerDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="vehicle-owner/add-vehicle" element={
                  <ProtectedRoute allowedRoles={['vehicle_owner']}>
                    <AddVehicle />
                  </ProtectedRoute>
                } />
                
                    <Route path="vehicle-owner/vehicles/:vehicleId" element={
                      <ProtectedRoute allowedRoles={['vehicle_owner']}>
                        <VehicleDetails />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="vehicle-owner/vehicles/:vehicleId/availability" element={
                      <ProtectedRoute allowedRoles={['vehicle_owner']}>
                        <VehicleAvailabilityManagement />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="vehicle-owner/vehicles/:vehicleId/pricing" element={
                      <ProtectedRoute allowedRoles={['vehicle_owner']}>
                        <VehiclePricingManagement />
                      </ProtectedRoute>
                    } />
                    
        <Route path="vehicle-owner/vehicles/:vehicleId/integrations" element={
          <ProtectedRoute allowedRoles={['vehicle_owner']}>
            <VehicleIntegrationManagement />
          </ProtectedRoute>
        } />

        <Route path="vehicle-owner/booking-requests" element={
          <ProtectedRoute allowedRoles={['vehicle_owner']}>
            <VehicleBookingRequests />
          </ProtectedRoute>
        } />

        <Route path="customer/booking-requests" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <VehicleBookingRequests />
          </ProtectedRoute>
        } />

        <Route path="trips" element={
          <ProtectedRoute allowedRoles={['customer', 'vehicle_owner', 'driver']}>
            <TripManagement />
          </ProtectedRoute>
        } />

        <Route path="drivers" element={
          <ProtectedRoute allowedRoles={['admin', 'vehicle_owner']}>
            <DriverManagement />
          </ProtectedRoute>
        } />

        <Route path="driver/register" element={
          <ProtectedRoute allowedRoles={['customer', 'tourist']}>
            <DriverRegistration />
          </ProtectedRoute>
        } />

        <Route path="driver/dashboard" element={
          <ProtectedRoute allowedRoles={['driver']}>
            <DriverDashboard />
          </ProtectedRoute>
        } />

        <Route path="driver" element={
          <ProtectedRoute allowedRoles={['driver']}>
            <DriverDashboard />
          </ProtectedRoute>
        } />

        <Route path="driver/vehicle-registration" element={
          <ProtectedRoute allowedRoles={['driver']}>
            <DriverVehicleRegistration />
          </ProtectedRoute>
        } />

        <Route path="driver/vehicles/:vehicleId" element={
          <ProtectedRoute allowedRoles={['driver']}>
            <VehicleDetails />
          </ProtectedRoute>
        } />

        <Route path="driver/vehicles/:vehicleId/edit" element={
          <ProtectedRoute allowedRoles={['driver']}>
            <VehicleEdit />
          </ProtectedRoute>
        } />

        <Route path="search" element={<VehicleSearchInterface />} />

        <Route path="vehicles/:vehicleId/book" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <VehicleBookingFlow />
          </ProtectedRoute>
        } />

        <Route path="trips/:tripId/tracking" element={
          <ProtectedRoute allowedRoles={['customer', 'vehicle_owner', 'driver']}>
            <GPSTracking />
          </ProtectedRoute>
        } />

        <Route path="maintenance" element={
          <ProtectedRoute allowedRoles={['vehicle_owner', 'admin']}>
            <MaintenanceTracking />
          </ProtectedRoute>
        } />

        <Route path="revenue" element={
          <ProtectedRoute allowedRoles={['vehicle_owner', 'admin']}>
            <RevenueManagement />
          </ProtectedRoute>
        } />
              </Route>
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            </ChatbotProvider>
            </NotificationProvider>
          </VehicleProvider>
        </HotelProvider>
      </TourProvider>
    </AuthProvider>
  )
}

export default App
