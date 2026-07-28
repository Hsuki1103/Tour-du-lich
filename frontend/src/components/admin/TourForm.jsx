import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toursAPI } from '../../api/tours';
import { formatCurrency } from '../../utils/helpers';

const TourForm = ({ tour = null, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    ten_tour: '',
    diem_den: '',
    khu_vuc: '',
    so_ngay: '',
    mo_ta_ngan: '',
    mo_ta_chi_tiet: '',
    lich_trinh: '',
    dich_vu_bao_gom: '',
    chinh_sach_huy: '',
    trang_thai: 'Đang hoạt động',
    hinh_anh: null,
  });
  const [schedules, setSchedules] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({
    ngay_khoi_hanh: '',
    so_chot_toi_da: '',
    gia_nguoi_lon: '',
    gia_tre_em: '',
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (tour) {
      setFormData({
        ten_tour: tour.ten_tour || '',
        diem_den: tour.diem_den || '',
        khu_vuc: tour.khu_vuc || '',
        so_ngay: tour.so_ngay || '',
        mo_ta_ngan: tour.mo_ta_ngan || '',
        mo_ta_chi_tiet: tour.mo_ta_chi_tiet || '',
        lich_trinh: tour.lich_trinh || '',
        dich_vu_bao_gom: tour.dich_vu_bao_gom || '',
        chinh_sach_huy: tour.chinh_sach_huy || '',
        trang_thai: tour.trang_thai || 'Đang hoạt động',
        hinh_anh: null,
      });
      setImagePreview(tour.hinh_anh);
      setSchedules(tour.lichKhoiHanhs || []);
    }
  }, [tour]);

  const mutation = useMutation(
    (data) => {
      if (tour) {
        return toursAPI.updateTour(tour.ma_tour, data);
      }
      return toursAPI.createTour(data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-tours']);
        queryClient.invalidateQueries(['tour-detail']);
        setSubmitError('');
        onSuccess();
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Lưu tour thất bại';
        setSubmitError(message);
        alert('❌ ' + message);
      }
    }
  );

  const scheduleMutation = useMutation(
    (data) => toursAPI.createSchedule(data),
    {
      onSuccess: (response) => {
        setSchedules([...schedules, response.data.data]);
        setScheduleForm({
          ngay_khoi_hanh: '',
          so_chot_toi_da: '',
          gia_nguoi_lon: '',
          gia_tre_em: '',
        });
        alert('✅ Thêm lịch khởi hành thành công!');
      },
      onError: (error) => {
        alert('❌ ' + (error.response?.data?.message || 'Thêm lịch khởi hành thất bại'));
      }
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    setSubmitError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, hinh_anh: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScheduleChange = (e) => {
    const { name, value } = e.target;
    setScheduleForm({ ...scheduleForm, [name]: value });
  };

  const handleAddSchedule = (e) => {
    e.preventDefault();
    const { ngay_khoi_hanh, so_chot_toi_da, gia_nguoi_lon, gia_tre_em } = scheduleForm;

    if (!ngay_khoi_hanh || !so_chot_toi_da || !gia_nguoi_lon || !gia_tre_em) {
      alert('⚠️ Vui lòng nhập đầy đủ thông tin lịch khởi hành');
      return;
    }

    // ⭐ NẾU ĐANG SỬA TOUR, GỌI API TẠO LỊCH KHỞI HÀNH
    if (tour) {
      scheduleMutation.mutate({
        ma_tour: tour.ma_tour,
        ...scheduleForm
      });
    } else {
      // ⭐ NẾU ĐANG THÊM MỚI, LƯU VÀO STATE TẠM
      const newSchedule = {
        ...scheduleForm,
        ma_lich_khoi_hanh: Date.now() + Math.random() * 1000,
        so_chot_da_dat: 0
      };
      setSchedules([...schedules, newSchedule]);
      setScheduleForm({
        ngay_khoi_hanh: '',
        so_chot_toi_da: '',
        gia_nguoi_lon: '',
        gia_tre_em: '',
      });
      alert('✅ Đã thêm lịch khởi hành vào danh sách tạm');
    }
  };

  const handleRemoveSchedule = (index) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch khởi hành này?')) {
      setSchedules(schedules.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.ten_tour) newErrors.ten_tour = 'Tên tour không được để trống';
    if (!formData.diem_den) newErrors.diem_den = 'Điểm đến không được để trống';
    if (!formData.so_ngay) newErrors.so_ngay = 'Số ngày không được để trống';
    if (formData.so_ngay && (parseInt(formData.so_ngay) < 1 || parseInt(formData.so_ngay) > 30)) {
      newErrors.so_ngay = 'Số ngày phải từ 1 đến 30';
    }
    if (!tour && schedules.length === 0) {
      alert('⚠️ Vui lòng thêm ít nhất một lịch khởi hành');
      return false;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitError('');
    
    if (!validateForm()) return;

    setUploading(true);
    const submitData = new FormData();
    
    // ⭐ THÊM TẤT CẢ DỮ LIỆU VÀO FORM DATA
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
        submitData.append(key, formData[key]);
      }
    });

    // ⭐ THÊM LỊCH KHỞI HÀNH VÀO FORM DATA (QUAN TRỌNG)
    if (!tour && schedules.length > 0) {
      const schedulesJson = JSON.stringify(schedules.map(s => ({
        ngay_khoi_hanh: s.ngay_khoi_hanh,
        so_chot_toi_da: parseInt(s.so_chot_toi_da),
        gia_nguoi_lon: parseFloat(s.gia_nguoi_lon),
        gia_tre_em: parseFloat(s.gia_tre_em)
      })));
      submitData.append('lich_khoi_hanh', schedulesJson);
      console.log('📝 Schedules JSON:', schedulesJson);
    }

    // ⭐ LOG DỮ LIỆU GỬI ĐI
    console.log('📝 Submitting tour data:');
    for (let pair of submitData.entries()) {
      console.log(pair[0] + ': ' + (pair[0] === 'hinh_anh' ? '[FILE]' : pair[1]));
    }

    mutation.mutate(submitData);
    setUploading(false);
  };

  const trangThaiOptions = [
    { value: 'Đang hoạt động', label: 'Đang hoạt động' },
    { value: 'Hết chỗ', label: 'Hết chỗ' },
    { value: 'Ngừng bán', label: 'Ngừng bán' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          ❌ {submitError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên tour *</label>
          <input
            type="text"
            name="ten_tour"
            value={formData.ten_tour}
            onChange={handleChange}
            className={`input-field ${errors.ten_tour ? 'border-red-500' : ''}`}
            placeholder="Tour Đà Nẵng 3 ngày 2 đêm"
            required
          />
          {errors.ten_tour && <p className="text-red-500 text-sm mt-1">{errors.ten_tour}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Điểm đến *</label>
          <input
            type="text"
            name="diem_den"
            value={formData.diem_den}
            onChange={handleChange}
            className={`input-field ${errors.diem_den ? 'border-red-500' : ''}`}
            placeholder="Đà Nẵng, Hội An, Huế"
            required
          />
          {errors.diem_den && <p className="text-red-500 text-sm mt-1">{errors.diem_den}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực</label>
          <select
            name="khu_vuc"
            value={formData.khu_vuc}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">Chọn khu vực</option>
            <option value="Miền Bắc">Miền Bắc</option>
            <option value="Miền Trung">Miền Trung</option>
            <option value="Miền Nam">Miền Nam</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Số ngày *</label>
          <input
            type="number"
            name="so_ngay"
            value={formData.so_ngay}
            onChange={handleChange}
            className={`input-field ${errors.so_ngay ? 'border-red-500' : ''}`}
            placeholder="3"
            min="1"
            max="30"
            required
          />
          {errors.so_ngay && <p className="text-red-500 text-sm mt-1">{errors.so_ngay}</p>}
        </div>

        {/* ⭐ TRẠNG THÁI TOUR */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
          <select
            name="trang_thai"
            value={formData.trang_thai}
            onChange={handleChange}
            className="input-field"
          >
            {trangThaiOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Chọn trạng thái hiển thị cho tour
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
          <textarea
            name="mo_ta_ngan"
            value={formData.mo_ta_ngan}
            onChange={handleChange}
            className="input-field"
            rows="2"
            placeholder="Mô tả ngắn gọn về tour..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
          <textarea
            name="mo_ta_chi_tiet"
            value={formData.mo_ta_chi_tiet}
            onChange={handleChange}
            className="input-field"
            rows="4"
            placeholder="Mô tả chi tiết về tour..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Lịch trình</label>
          <textarea
            name="lich_trinh"
            value={formData.lich_trinh}
            onChange={handleChange}
            className="input-field"
            rows="4"
            placeholder="Ngày 1: ...&#10;Ngày 2: ..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Dịch vụ bao gồm</label>
          <textarea
            name="dich_vu_bao_gom"
            value={formData.dich_vu_bao_gom}
            onChange={handleChange}
            className="input-field"
            rows="3"
            placeholder="- Khách sạn&#10;- Ăn uống&#10;- Vé tham quan"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Chính sách hủy</label>
          <textarea
            name="chinh_sach_huy"
            value={formData.chinh_sach_huy}
            onChange={handleChange}
            className="input-field"
            rows="3"
            placeholder="Hủy trước 7 ngày: Hoàn 100%&#10;Hủy trước 3 ngày: Hoàn 50%"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="input-field"
          />
          {imagePreview && (
            <div className="mt-2">
              <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
            </div>
          )}
        </div>
      </div>

      {/* ⭐ SCHEDULES SECTION */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          📅 Lịch khởi hành
          <span className="text-sm font-normal text-gray-500">
            ({schedules.length} lịch đã thêm)
          </span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <input
            type="date"
            name="ngay_khoi_hanh"
            value={scheduleForm.ngay_khoi_hanh}
            onChange={handleScheduleChange}
            className="input-field"
          />
          <input
            type="number"
            name="so_chot_toi_da"
            value={scheduleForm.so_chot_toi_da}
            onChange={handleScheduleChange}
            className="input-field"
            placeholder="Số chỗ tối đa"
          />
          <input
            type="number"
            name="gia_nguoi_lon"
            value={scheduleForm.gia_nguoi_lon}
            onChange={handleScheduleChange}
            className="input-field"
            placeholder="Giá người lớn"
          />
          <input
            type="number"
            name="gia_tre_em"
            value={scheduleForm.gia_tre_em}
            onChange={handleScheduleChange}
            className="input-field"
            placeholder="Giá trẻ em"
          />
        </div>
        
        <button
          type="button"
          onClick={handleAddSchedule}
          disabled={scheduleMutation.isLoading}
          className="btn-primary"
        >
          {scheduleMutation.isLoading ? 'Đang thêm...' : '➕ Thêm lịch khởi hành'}
        </button>

        {/* ⭐ HIỂN THỊ DANH SÁCH LỊCH KHỞI HÀNH ĐÃ THÊM */}
        {schedules.length > 0 && (
          <div className="mt-4 space-y-2">
            {schedules.map((schedule, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                <div>
                  <p className="font-medium text-gray-800">
                    📅 {schedule.ngay_khoi_hanh}
                  </p>
                  <p className="text-sm text-gray-500">
                    👤 {schedule.so_chot_toi_da} chỗ - 
                    💰 {formatCurrency(schedule.gia_nguoi_lon)}/người lớn - 
                    👶 {formatCurrency(schedule.gia_tre_em)}/trẻ em
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSchedule(index)}
                  className="text-red-500 hover:text-red-600 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                >
                  🗑️ Xóa
                </button>
              </div>
            ))}
          </div>
        )}

        {!tour && schedules.length === 0 && (
          <p className="text-yellow-600 text-sm mt-2">
            ⚠️ Vui lòng thêm ít nhất 1 lịch khởi hành để tạo tour
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={mutation.isLoading || uploading}
          className="btn-primary disabled:opacity-50 flex-1 py-3"
        >
          {mutation.isLoading || uploading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang lưu...
            </span>
          ) : (
            tour ? '💾 Cập nhật tour' : '➕ Thêm tour'
          )}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary flex-1 py-3">
          ❌ Hủy
        </button>
      </div>
    </form>
  );
};

export default TourForm;