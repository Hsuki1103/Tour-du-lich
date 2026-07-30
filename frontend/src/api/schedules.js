// frontend/src/api/schedules.js
import axios from './axios';

export const schedulesAPI = {
    // Lấy danh sách lịch khởi hành
    getSchedules: (params) => {
        // ⭐ LỌC BỎ CÁC PARAMS RỖNG
        const cleanParams = {};
        if (params) {
            Object.keys(params).forEach(key => {
                const value = params[key];
                // ⭐ CHỈ GIỮ LẠI GIÁ TRỊ HỢP LỆ
                if (value !== undefined && value !== null && value !== '' && 
                    value !== 'undefined' && value !== 'null') {
                    // ⭐ RIÊNG ma_tour PHẢI LÀ SỐ
                    if (key === 'ma_tour') {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue > 0) {
                            cleanParams[key] = numValue;
                        }
                        // BỎ QUA NẾU KHÔNG PHẢI SỐ HỢP LỆ
                    } else {
                        cleanParams[key] = value;
                    }
                }
            });
        }
        console.log('📤 schedulesAPI.getSchedules - cleanParams:', cleanParams);
        return axios.get('/tours/schedules', { params: cleanParams });
    },

    // Lấy chi tiết lịch khởi hành
    getScheduleDetail: (id) => {
        console.log('📤 schedulesAPI.getScheduleDetail - id:', id);
        return axios.get(`/tours/schedules/${id}`);
    },

    // Thêm lịch khởi hành
    createSchedule: (data) => {
        console.log('📤 schedulesAPI.createSchedule - data:', data);
        return axios.post('/tours/schedules', data);
    },

    // Cập nhật lịch khởi hành
    updateSchedule: (id, data) => {
        console.log('📤 schedulesAPI.updateSchedule - id:', id, 'data:', data);
        return axios.put(`/tours/schedules/${id}`, data);
    },

    // Xóa lịch khởi hành
    deleteSchedule: (id) => {
        console.log('📤 schedulesAPI.deleteSchedule - id:', id);
        return axios.delete(`/tours/schedules/${id}`);
    },
};