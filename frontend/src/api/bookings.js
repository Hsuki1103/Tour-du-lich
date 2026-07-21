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
  updateBookingByCustomer: (id, data) => axios.put(`/bookings/my/${id}/update`, data), // ⭐ THÊM

  // Admin routes
  getAllBookings: (params) => axios.get('/bookings', { params }),
  confirmBooking: (id) => axios.put(`/bookings/${id}/confirm`),
  updateBooking: (id, data) => axios.put(`/bookings/${id}`, data),
};