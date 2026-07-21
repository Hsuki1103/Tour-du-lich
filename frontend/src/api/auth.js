import axios from './axios';

export const authAPI = {
  register: (data) => axios.post('/auth/register', data),
  login: (email, password) => axios.post('/auth/login', { email, mat_khau: password }),
  logout: () => axios.post('/auth/logout'),
  refreshToken: (refreshToken) => axios.post('/auth/refresh-token', { refreshToken }),
  getProfile: () => axios.get('/users/profile'),
  verifyOTP: (email, otpCode, type) => axios.post('/auth/verify-otp', { email, otp_code: otpCode, loai: type }),
  resendOTP: (email, type) => axios.post('/auth/resend-otp', { email, loai: type }),
  forgotPassword: (email) => axios.post('/auth/forgot-password', { email }),
  resetPassword: (data) => axios.post('/auth/reset-password', data),
  changePassword: (data) => axios.put('/auth/change-password', data),
  updateProfile: (data) => axios.put('/users/profile', data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return axios.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};