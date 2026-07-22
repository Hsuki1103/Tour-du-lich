import axios from './axios';

export const paymentsAPI = {
    createVNPay: (data) => axios.post('/payments/vnpay', data),
    getPaymentStatus: (bookingId) => axios.get(`/payments/status/${bookingId}`),
};