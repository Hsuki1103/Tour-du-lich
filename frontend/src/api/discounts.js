// frontend/src/api/discounts.js
import axios from './axios';

export const discountsAPI = {
  // Admin
  createDiscount: (data) => axios.post('/discounts', data),
  getDiscounts: (params) => axios.get('/discounts', { params }),
  getDiscountDetail: (id) => axios.get(`/discounts/${id}`),
  updateDiscount: (id, data) => axios.put(`/discounts/${id}`, data),
  deleteDiscount: (id) => axios.delete(`/discounts/${id}`),
  
  // ⭐ GỬI MÃ GIẢM GIÁ CHO KHÁCH HÀNG
  sendDiscountToCustomers: (data) => axios.post('/discounts/send-to-customers', data),
  
  // Public
  validateDiscount: (data) => axios.post('/discounts/validate', data),
  getPublicDiscounts: (params) => axios.get('/discounts/public', { params }),
  getPublicDiscountDetail: (id) => axios.get(`/discounts/public/${id}`),
  
  // ⭐ LẤY MÃ GIẢM GIÁ CỦA TÔI
  getMyDiscounts: () => axios.get('/discounts/my-discounts'),
};