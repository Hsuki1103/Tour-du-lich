import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './hooks/useAuth';

// Components
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Home from './pages/Home';
import ToursPage from './pages/ToursPage';
import TourDetailPage from './pages/TourDetailPage';
import BookingPage from './pages/BookingPage';
import PaymentPage from './pages/PaymentPage';
import PaymentResultPage from './pages/PaymentResultPage';
import MyBookingsPage from './pages/MyBookingsPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import AdminTours from './pages/AdminTours';
import AdminBookings from './pages/AdminBookings';
import AdminUsers from './pages/AdminUsers';
import AdminDiscounts from './pages/AdminDiscounts';
import AdminReports from './pages/AdminReports';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import BookingDetailPage from './pages/BookingDetailPage';

function App() {
    const { user, loadUser } = useAuth();
    const location = useLocation();

    const isAdmin = user?.vaiTro?.ten_vai_tro === 'Admin';
    const isStaff = user?.vaiTro?.ten_vai_tro === 'Nhân viên' || isAdmin;

    useEffect(() => {
        if (location.pathname === '/') {
            loadUser();
        }
    }, [location.pathname, loadUser]);

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/tours" element={<ToursPage />} />
                    <Route path="/tours/:id" element={<TourDetailPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/payment-result" element={<PaymentResultPage />} />

                    {/* Protected Routes - Customer */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/booking/:tourId" element={<BookingPage />} />
                        <Route path="/payment/:bookingId" element={<PaymentPage />} />
                        <Route path="/my-bookings" element={<MyBookingsPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/my-bookings/:id" element={<BookingDetailPage />} />
                    </Route>

                    {/* Protected Routes - Admin & Staff */}
                    <Route element={<ProtectedRoute allowedRoles={['Admin', 'Nhân viên']} />}>
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/admin/tours" element={<AdminTours />} />
                        <Route path="/admin/tours/new" element={<AdminTours />} />
                        <Route path="/admin/tours/edit/:id" element={<AdminTours />} />
                        <Route path="/admin/bookings" element={<AdminBookings />} />
                        <Route path="/admin/users" element={<AdminUsers />} />
                        <Route path="/admin/discounts" element={<AdminDiscounts />} />
                        <Route path="/admin/reports" element={<AdminReports />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            <Footer />
            
            {/* ⭐ TOAST CONTAINER */}
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
        </div>
    );
}

export default App;