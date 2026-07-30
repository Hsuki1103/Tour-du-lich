// frontend/src/api/vehicles.js
import axios from './axios';

export const vehiclesAPI = {
  // Lấy danh sách phương tiện
  getVehicles: (params) => axios.get('/vehicles', { params }),
  
  // Lấy chi tiết phương tiện
  getVehicleDetail: (id) => axios.get(`/vehicles/${id}`),
  
  // Thêm phương tiện
  createVehicle: (data) => axios.post('/vehicles', data),
  
  // Cập nhật phương tiện
  updateVehicle: (id, data) => axios.put(`/vehicles/${id}`, data),
  
  // Xóa phương tiện
  deleteVehicle: (id) => axios.delete(`/vehicles/${id}`),
  
  // Lấy danh sách phương tiện đang hoạt động
  getActiveVehicles: () => axios.get('/vehicles/active'),
  
  // Tính số chỗ tối đa
  calculateMaxSeats: (data) => axios.post('/vehicles/calculate-max-seats', data),
};