import axios from './axios';

export const discountsAPI = {
  createDiscount: (data) => axios.post('/discounts', data),
  getDiscounts: (params) => axios.get('/discounts', { params }),
  getDiscountDetail: (id) => axios.get(`/discounts/${id}`),
  updateDiscount: (id, data) => axios.put(`/discounts/${id}`, data),
  deleteDiscount: (id) => axios.delete(`/discounts/${id}`),
  validateDiscount: (data) => axios.post('/discounts/validate', data),
};