import axios from './axios';

export const reviewsAPI = {
  createReview: (data) => axios.post('/reviews', data),
  getTourReviews: (tourId) => axios.get(`/reviews/tour/${tourId}`),
  getMyReviews: () => axios.get('/reviews/my'),
  updateReview: (id, data) => axios.put(`/reviews/${id}`, data),
  deleteReview: (id) => axios.delete(`/reviews/${id}`),
};