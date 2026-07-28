import axios from './axios';

export const toursAPI = {
    getTours: (params) => axios.get('/tours', { params }),
    searchTours: (params) => axios.get('/tours/search', { params }),
    getTourDetail: (id) => axios.get(`/tours/${id}`),
    getScheduleDetail: (id) => axios.get(`/tours/schedules/${id}`),
    
    createTour: (data) => {
        const formData = new FormData();
        // ⭐ THÊM TẤT CẢ FIELD
        const fields = ['ten_tour', 'diem_den', 'khu_vuc', 'so_ngay', 'mo_ta_ngan', 
                       'mo_ta_chi_tiet', 'lich_trinh', 'dich_vu_bao_gom', 
                       'chinh_sach_huy', 'trang_thai'];
        
        fields.forEach(key => {
            if (data.get(key) && data.get(key) !== '') {
                formData.append(key, data.get(key));
            }
        });
        
        // ⭐ XỬ LÝ FILE RIÊNG
        if (data.get('hinh_anh') && data.get('hinh_anh') !== 'null') {
            formData.append('hinh_anh', data.get('hinh_anh'));
        }
        
        // ⭐ LOG ĐỂ DEBUG
        console.log('📤 Sending createTour data:');
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + (pair[0] === 'hinh_anh' ? '[FILE]' : pair[1]));
        }
        
        return axios.post('/tours', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    
    updateTour: (id, data) => {
        const formData = new FormData();
        const fields = ['ten_tour', 'diem_den', 'khu_vuc', 'so_ngay', 'mo_ta_ngan', 
                       'mo_ta_chi_tiet', 'lich_trinh', 'dich_vu_bao_gom', 
                       'chinh_sach_huy', 'trang_thai'];
        
        fields.forEach(key => {
            if (data.get(key) && data.get(key) !== '') {
                formData.append(key, data.get(key));
            }
        });
        
        if (data.get('hinh_anh') && data.get('hinh_anh') !== 'null') {
            formData.append('hinh_anh', data.get('hinh_anh'));
        }
        
        console.log('📤 Sending updateTour data:');
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + (pair[0] === 'hinh_anh' ? '[FILE]' : pair[1]));
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