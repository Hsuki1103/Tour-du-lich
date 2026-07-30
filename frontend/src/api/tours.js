// frontend/src/api/tours.js
import axios from './axios';

export const toursAPI = {
    getTours: (params) => axios.get('/tours', { params }),
    searchTours: (params) => axios.get('/tours/search', { params }),
    getTourDetail: (id) => axios.get(`/tours/${id}`),
    getScheduleDetail: (id) => axios.get(`/tours/schedules/${id}`),
    
    createTour: (data) => {
        const formData = new FormData();
        
        // Thêm tất cả text fields
        const textFields = [
            'ten_tour', 'diem_den', 'khu_vuc', 'so_ngay', 
            'mo_ta_ngan', 'mo_ta_chi_tiet', 'lich_trinh', 
            'dich_vu_bao_gom', 'chinh_sach_huy', 'trang_thai',
            'lich_khoi_hanh'
        ];
        
        textFields.forEach(key => {
            const value = data.get(key);
            if (value !== undefined && value !== null && value !== '') {
                formData.append(key, value);
            }
        });
        
        // Xử lý ảnh chính
        const mainImage = data.get('hinh_anh');
        if (mainImage && mainImage instanceof File) {
            formData.append('hinh_anh', mainImage);
        }
        
        // Xử lý nhiều ảnh phụ
        const images = data.getAll('hinh_anh_phu');
        if (images && images.length > 0) {
            images.forEach(file => {
                if (file instanceof File) {
                    formData.append('hinh_anh_phu', file);
                }
            });
        }
        
        // Log để debug
        console.log('📤 Sending createTour data:');
        for (let pair of formData.entries()) {
            const value = pair[0] === 'hinh_anh' || pair[0] === 'hinh_anh_phu' 
                ? `[FILE] ${pair[1].name || pair[1]}` 
                : pair[1];
            console.log(pair[0] + ': ' + value);
        }
        
        return axios.post('/tours', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    
    updateTour: (id, data) => {
        const formData = new FormData();
        
        const textFields = [
            'ten_tour', 'diem_den', 'khu_vuc', 'so_ngay', 
            'mo_ta_ngan', 'mo_ta_chi_tiet', 'lich_trinh', 
            'dich_vu_bao_gom', 'chinh_sach_huy', 'trang_thai',
            'hinh_anh_phu' // JSON string của ảnh phụ cũ
        ];
        
        textFields.forEach(key => {
            const value = data.get(key);
            if (value !== undefined && value !== null && value !== '') {
                formData.append(key, value);
            }
        });
        
        // Xử lý ảnh chính mới
        const mainImage = data.get('hinh_anh');
        if (mainImage && mainImage instanceof File) {
            formData.append('hinh_anh', mainImage);
        }
        
        // Xử lý ảnh phụ mới (upload thêm)
        const images = data.getAll('hinh_anh_phu_new');
        if (images && images.length > 0) {
            images.forEach(file => {
                if (file instanceof File) {
                    formData.append('hinh_anh_phu', file);
                }
            });
        }
        
        console.log('📤 Sending updateTour data:');
        for (let pair of formData.entries()) {
            const value = pair[0] === 'hinh_anh' || pair[0] === 'hinh_anh_phu' 
                ? `[FILE] ${pair[1].name || pair[1]}` 
                : pair[1];
            console.log(pair[0] + ': ' + value);
        }
        
        return axios.put(`/tours/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    
    deleteTour: (id) => axios.delete(`/tours/${id}`),
    createSchedule: (data) => axios.post('/tours/schedules', data),
    updateSchedule: (id, data) => axios.put(`/tours/schedules/${id}`, data),
    deleteSchedule: (id) => axios.delete(`/tours/schedules/${id}`),
};