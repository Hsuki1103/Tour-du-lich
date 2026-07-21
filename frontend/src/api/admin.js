import axios from './axios';

export const adminAPI = {
  getUsers: (params) => axios.get('/admin/users', { params }),
  getUserDetail: (id) => axios.get(`/admin/users/${id}`),
  createUser: (data) => axios.post('/admin/users', data),
  updateUser: (id, data) => axios.put(`/admin/users/${id}`, data),
  deleteUser: (id) => axios.delete(`/admin/users/${id}`),
  toggleUserStatus: (id) => axios.patch(`/admin/users/${id}/toggle-status`),
  assignRole: (id, data) => axios.patch(`/admin/users/${id}/role`, data),
  getDashboardStats: () => axios.get('/dashboard/stats'),
  getRevenueStats: (params) => axios.get('/dashboard/revenue', { params }),
  getTopTours: (params) => axios.get('/dashboard/top-tours', { params }),
  getCancellationStats: (params) => axios.get('/dashboard/cancellations', { params }),
  exportReport: (params) => axios.get('/dashboard/export', {
    params,
    responseType: 'blob',
  }),
};