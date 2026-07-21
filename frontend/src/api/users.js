import axios from './axios';

export const usersAPI = {
  // Admin routes
  getUsers: (params) => axios.get('/admin/users', { params }),
  getUserDetail: (id) => axios.get(`/admin/users/${id}`),
  createUser: (data) => axios.post('/admin/users', data),
  updateUser: (id, data) => axios.put(`/admin/users/${id}`, data),
  deleteUser: (id) => axios.delete(`/admin/users/${id}`),
  toggleUserStatus: (id) => axios.patch(`/admin/users/${id}/toggle-status`),
  assignRole: (id, data) => axios.patch(`/admin/users/${id}/role`, data),
  
  // ⭐ THÊM HÀM TÌM USER PUBLIC (KHÔNG CẦN QUYỀN ADMIN)
  findUserByEmail: (email) => axios.get(`/users/find?email=${email}`),
};