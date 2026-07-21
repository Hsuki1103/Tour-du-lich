import axios from './axios';

export const toursAPI = {
  getTours: (params) => axios.get('/tours', { params }),
  searchTours: (params) => axios.get('/tours/search', { params }),
  getTourDetail: (id) => axios.get(`/tours/${id}`),
  getScheduleDetail: (id) => axios.get(`/tours/schedules/${id}`), // ⭐ THÊM HÀM NÀY
  createTour: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'hinh_anh' && data[key]) {
        formData.append(key, data[key]);
      } else if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return axios.post('/tours', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateTour: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'hinh_anh' && data[key]) {
        formData.append(key, data[key]);
      } else if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return axios.put(`/tours/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteTour: (id) => axios.delete(`/tours/${id}`),
  createSchedule: (data) => axios.post('/tours/schedules', data),
  updateSchedule: (id, data) => axios.put(`/tours/schedules/${id}`, data),
  deleteSchedule: (id) => axios.delete(`/tours/schedules/${id}`),
};