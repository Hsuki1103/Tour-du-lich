// frontend/src/api/bookings.js
import axios from './axios';

export const bookingsAPI = {
    // Customer routes
    createBooking: (data) => axios.post('/bookings', data),
    getMyBookings: (params) => axios.get('/bookings/my', { params }),
    getBookingDetail: (id) => axios.get(`/bookings/my/${id}`),
    cancelBooking: (id, data) => axios.put(`/bookings/my/${id}/cancel`, data),
    downloadVoucher: (id) => axios.get(`/bookings/my/${id}/voucher`, {
        responseType: 'blob',
    }),
    updateBookingByCustomer: (id, data) => axios.put(`/bookings/my/${id}/update`, data),
    confirmOfflinePayment: (id) => axios.put(`/bookings/my/${id}/offline-payment`),

    // ⭐ API YÊU CẦU HOÀN TIỀN
    requestRefund: (data) => axios.post('/bookings/refund-request', data),

    // Admin routes
    getAllBookings: (params) => axios.get('/bookings', { params }),
    confirmBooking: (id) => axios.put(`/bookings/${id}/confirm`),
    updateBooking: (id, data) => axios.put(`/bookings/${id}`, data),

    // ⭐ ADMIN REFUND ROUTES
    getRefundRequests: (params) => {
        console.log('📤 Fetching refund requests with params:', params);
        return axios.get('/bookings/refunds', { params });
    },
    
    getRefundDetail: (id) => {
        console.log('📤 Fetching refund detail for:', id);
        return axios.get(`/bookings/refunds/${id}`);
    },
    
    approveRefund: (id, data) => {
        console.log('📤 Approving refund:', { id, data });
        return axios.put(`/bookings/refunds/${id}/approve`, data);
    },
    
    rejectRefund: (id, data) => {
        console.log('📤 Rejecting refund:', { id, data });
        return axios.put(`/bookings/refunds/${id}/reject`, data);
    },
    
    getRefundStats: (params) => axios.get('/bookings/refunds/stats', { params }),
};