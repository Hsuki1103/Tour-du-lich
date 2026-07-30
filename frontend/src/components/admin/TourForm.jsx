// frontend/src/components/admin/TourForm.jsx
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import { toursAPI } from '../../api/tours';
import { vehiclesAPI } from '../../api/vehicles';
import { formatCurrency, getImageUrl } from '../../utils/helpers';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

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
    hinh_anh_phu: [],
  });
  
  const [schedules, setSchedules] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({
    ngay_khoi_hanh: '',
    so_chot_toi_da: '',
    gia_nguoi_lon: '',
    gia_tre_em: '',
    phuong_tiens: [],
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [vehicleSelect, setVehicleSelect] = useState({ ma_phuong_tien: '' });

  // Fetch vehicles
  const { data: vehiclesData } = useQuery(
    ['active-vehicles-for-tour'],
    () => vehiclesAPI.getActiveVehicles(),
    { enabled: true }
  );
  const vehicles = vehiclesData?.data?.data || [];

  // ⭐ TÍNH TỔNG SỐ CHỖ TỪ CÁC XE
  const calculateTotalSeatsFromVehicles = (phuongTiens) => {
    let total = 0;
    phuongTiens.forEach(pt => {
      const vehicle = vehicles.find(v => v.ma_phuong_tien === pt.ma_phuong_tien);
      if (vehicle) {
        total += (vehicle.so_cho_ngoi - 1);
      }
    });
    return total;
  };

  // ⭐⭐⭐ QUAN TRỌNG: KHI EDIT TOUR - LOAD ẢNH PHỤ
  useEffect(() => {
    if (tour) {
      console.log('📝 Loading tour data for edit:', tour.ma_tour);
      console.log('📸 RAW hinh_anh_phu from API:', tour.hinh_anh_phu);
      
      // ⭐⭐⭐ XỬ LÝ ẢNH PHỤ
      let hinhAnhPhu = [];
      
      // ⭐ NẾU LÀ STRING -> PARSE JSON
      if (typeof tour.hinh_anh_phu === 'string') {
        try {
          const parsed = JSON.parse(tour.hinh_anh_phu);
          console.log('📸 Parsed JSON:', parsed);
          if (Array.isArray(parsed)) {
            hinhAnhPhu = parsed;
          }
        } catch (e) {
          console.error('❌ Parse JSON error:', e);
        }
      } 
      // ⭐ NẾU LÀ ARRAY -> DÙNG TRỰC TIẾP
      else if (Array.isArray(tour.hinh_anh_phu)) {
        hinhAnhPhu = tour.hinh_anh_phu;
      }
      
      console.log('📸 FINAL hinhAnhPhu array:', hinhAnhPhu);
      console.log('📸 Number of images:', hinhAnhPhu.length);

      // ⭐ CẬP NHẬT FORM DATA
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
        hinh_anh_phu: hinhAnhPhu,
      });
      
      // ⭐ ẢNH CHÍNH PREVIEW
      setImagePreview(tour.hinh_anh ? getImageUrl(tour.hinh_anh) : null);
      
      // ⭐⭐⭐ HIỂN THỊ ẢNH PHỤ
      const previews = hinhAnhPhu.map(img => getImageUrl(img));
      setImagePreviews(previews);
      console.log('📸 Image previews set:', previews);
      
      // Load schedules
      const loadedSchedules = (tour.lichKhoiHanhs || []).map(s => {
        let totalSeats = 0;
        const phuongTiens = (s.phuongTiens || []).map(pt => {
          const vehicle = vehicles.find(v => v.ma_phuong_tien === pt.ma_phuong_tien);
          const seats = vehicle ? (vehicle.so_cho_ngoi - 1) : 0;
          totalSeats += seats;
          return {
            ma_phuong_tien: pt.ma_phuong_tien,
            ten_xe: pt.ten_xe || vehicle?.ten_xe || '',
            bien_so_xe: pt.bien_so_xe || vehicle?.bien_so_xe || '',
            so_cho_ngoi: pt.so_cho_ngoi || vehicle?.so_cho_ngoi || 0,
          };
        });
        
        return {
          ma_lich_khoi_hanh: s.ma_lich_khoi_hanh,
          ngay_khoi_hanh: s.ngay_khoi_hanh,
          so_chot_toi_da: s.so_chot_toi_da || totalSeats,
          gia_nguoi_lon: s.gia_nguoi_lon,
          gia_tre_em: s.gia_tre_em,
          trang_thai: s.trang_thai,
          phuong_tiens: phuongTiens,
        };
      });
      setSchedules(loadedSchedules);
    }
  }, [tour, vehicles]);

  // Mutation
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
        toast.success(tour ? '✅ Cập nhật tour thành công!' : '✅ Thêm tour thành công!');
        onSuccess();
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Lưu tour thất bại';
        setSubmitError(message);
        toast.error('❌ ' + message);
      }
    }
  );

  // ⭐ HANDLE TEXT CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    setSubmitError('');
  };

  // ⭐ HANDLE ẢNH CHÍNH
  const handleMainImageChange = (e) => {
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

  // ⭐⭐⭐ HANDLE NHIỀU ẢNH PHỤ
  const handleMultipleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    
    console.log('📸 Files selected:', files.length);
    console.log('📸 File names:', files.map(f => f.name));
    
    if (files.length === 0) return;
    
    const currentImages = formData.hinh_anh_phu || [];
    console.log('📸 Current images count:', currentImages.length);
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    
    setFormData({
      ...formData,
      hinh_anh_phu: [...currentImages, ...files]
    });
    setImagePreviews([...imagePreviews, ...newPreviews]);
    
    e.target.value = '';
    
    console.log('📸 Total images after add:', formData.hinh_anh_phu.length + files.length);
  };

  // ⭐ XÓA ẢNH PHỤ
  const removeImage = (index) => {
    const newImages = [...formData.hinh_anh_phu];
    const newPreviews = [...imagePreviews];
    
    // Kiểm tra nếu là ảnh cũ (string URL) hay ảnh mới (File)
    if (typeof newImages[index] === 'string' && newImages[index].startsWith('/uploads/')) {
      // Ảnh cũ - chỉ xóa khỏi state, không xóa file vật lý (sẽ được xử lý ở backend)
      newImages.splice(index, 1);
      newPreviews.splice(index, 1);
    } else {
      // Ảnh mới (File) - revoke URL để giải phóng bộ nhớ
      URL.revokeObjectURL(newPreviews[index]);
      newImages.splice(index, 1);
      newPreviews.splice(index, 1);
    }
    
    setFormData({ ...formData, hinh_anh_phu: newImages });
    setImagePreviews(newPreviews);
  };

  // ⭐ HANDLE THÊM XE VÀO LỊCH
  const handleAddVehicleToSchedule = () => {
    if (!vehicleSelect.ma_phuong_tien) {
      toast.warning('Vui lòng chọn phương tiện');
      return;
    }
    
    const vehicleId = parseInt(vehicleSelect.ma_phuong_tien);
    const vehicle = vehicles.find(v => v.ma_phuong_tien === vehicleId);
    if (!vehicle) {
      toast.warning('Không tìm thấy phương tiện');
      return;
    }
    
    const exists = scheduleForm.phuong_tiens.find(p => p.ma_phuong_tien === vehicleId);
    if (exists) {
      toast.warning('Phương tiện này đã được chọn');
      return;
    }
    
    const currentTotal = calculateTotalSeatsFromVehicles(scheduleForm.phuong_tiens);
    const newSeats = vehicle.so_cho_ngoi - 1;
    const newTotal = currentTotal + newSeats;
    const maxSeatsInput = parseInt(scheduleForm.so_chot_toi_da);
    
    // ⭐ VALIDATION: SỐ CHỖ TỐI ĐA PHẢI <= TỔNG CHỖ XE
    if (maxSeatsInput > 0 && maxSeatsInput > newTotal) {
      toast.error(`❌ Số chỗ tối đa (${maxSeatsInput}) vượt quá tổng chỗ xe (${newTotal}). Vui lòng giảm số chỗ tối đa.`);
      return;
    }
    
    setScheduleForm({
      ...scheduleForm,
      phuong_tiens: [
        ...scheduleForm.phuong_tiens,
        {
          ma_phuong_tien: vehicleId,
          ten_xe: vehicle.ten_xe,
          bien_so_xe: vehicle.bien_so_xe,
          so_cho_ngoi: vehicle.so_cho_ngoi,
        }
      ],
      so_chot_toi_da: maxSeatsInput > 0 && maxSeatsInput <= newTotal ? maxSeatsInput : newTotal
    });
    
    setVehicleSelect({ ma_phuong_tien: '' });
    toast.success(`✅ Đã thêm ${vehicle.ten_xe} (${newSeats} chỗ khách)`);
  };

  // ⭐ HANDLE XÓA XE KHỎI LỊCH
  const handleRemoveVehicleFromSchedule = (index) => {
    const newPhuongTiens = [...scheduleForm.phuong_tiens];
    newPhuongTiens.splice(index, 1);
    const newTotal = calculateTotalSeatsFromVehicles(newPhuongTiens);
    
    setScheduleForm({
      ...scheduleForm,
      phuong_tiens: newPhuongTiens,
      so_chot_toi_da: scheduleForm.so_chot_toi_da && parseInt(scheduleForm.so_chot_toi_da) > newTotal 
        ? newTotal 
        : scheduleForm.so_chot_toi_da
    });
  };

  // ⭐ HANDLE THÊM LỊCH KHỞI HÀNH
  const handleAddSchedule = () => {
    const { ngay_khoi_hanh, so_chot_toi_da, gia_nguoi_lon, gia_tre_em, phuong_tiens } = scheduleForm;

    if (!ngay_khoi_hanh) {
      toast.warning('Vui lòng chọn ngày khởi hành');
      return;
    }
    if (!so_chot_toi_da || parseInt(so_chot_toi_da) <= 0) {
      toast.warning('Vui lòng nhập số chỗ tối đa hợp lệ');
      return;
    }
    if (!gia_nguoi_lon || parseFloat(gia_nguoi_lon) <= 0) {
      toast.warning('Vui lòng nhập giá người lớn hợp lệ');
      return;
    }
    if (gia_tre_em === undefined || gia_tre_em === null || parseFloat(gia_tre_em) < 0) {
      toast.warning('Vui lòng nhập giá trẻ em hợp lệ');
      return;
    }
    if (phuong_tiens.length === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 phương tiện');
      return;
    }

    const totalSeatsFromVehicles = calculateTotalSeatsFromVehicles(phuong_tiens);
    const maxSeats = parseInt(so_chot_toi_da);
    
    // ⭐ VALIDATION: SỐ CHỖ TỐI ĐA PHẢI <= TỔNG CHỖ XE
    if (maxSeats > totalSeatsFromVehicles) {
      toast.error(`❌ Số chỗ tối đa (${maxSeats}) vượt quá tổng chỗ xe (${totalSeatsFromVehicles}). Vui lòng giảm số chỗ tối đa.`);
      return;
    }

    const newSchedule = {
      ngay_khoi_hanh,
      so_chot_toi_da: maxSeats,
      gia_nguoi_lon: parseFloat(gia_nguoi_lon),
      gia_tre_em: parseFloat(gia_tre_em),
      phuong_tiens: phuong_tiens,
    };

    setSchedules([...schedules, newSchedule]);
    setScheduleForm({
      ngay_khoi_hanh: '',
      so_chot_toi_da: '',
      gia_nguoi_lon: '',
      gia_tre_em: '',
      phuong_tiens: [],
    });
    setVehicleSelect({ ma_phuong_tien: '' });
    toast.success('✅ Đã thêm lịch khởi hành');
  };

  // ⭐ HANDLE XÓA LỊCH
  const handleRemoveSchedule = (index) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch khởi hành này?')) {
      setSchedules(schedules.filter((_, i) => i !== index));
    }
  };

  // ⭐ VALIDATE FORM
  const validateForm = () => {
    const newErrors = {};
    if (!formData.ten_tour) newErrors.ten_tour = 'Tên tour không được để trống';
    if (!formData.diem_den) newErrors.diem_den = 'Điểm đến không được để trống';
    if (!formData.so_ngay) newErrors.so_ngay = 'Số ngày không được để trống';
    if (formData.so_ngay && (parseInt(formData.so_ngay) < 1 || parseInt(formData.so_ngay) > 30)) {
      newErrors.so_ngay = 'Số ngày phải từ 1 đến 30';
    }
    if (!tour && schedules.length === 0) {
      toast.warning('⚠️ Vui lòng thêm ít nhất một lịch khởi hành');
      return false;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ⭐ SUBMIT
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitError('');
    
    if (!validateForm()) return;

    setUploading(true);
    const submitData = new FormData();
    
    // Text fields
    Object.keys(formData).forEach(key => {
      if (key === 'hinh_anh' || key === 'hinh_anh_phu') return;
      const value = formData[key];
      if (value !== null && value !== undefined && value !== '') {
        submitData.append(key, value);
      }
    });

    // Ảnh chính
    if (formData.hinh_anh instanceof File) {
      submitData.append('hinh_anh', formData.hinh_anh);
    }

    // ⭐⭐⭐ XỬ LÝ ẢNH PHỤ
    if (formData.hinh_anh_phu && formData.hinh_anh_phu.length > 0) {
      const oldImages = formData.hinh_anh_phu.filter(item => typeof item === 'string');
      const newFiles = formData.hinh_anh_phu.filter(item => item instanceof File);
      
      if (oldImages.length > 0) {
        submitData.append('hinh_anh_phu_existing', JSON.stringify(oldImages));
        console.log('📤 Keeping old images:', oldImages);
      }
      
      if (newFiles.length > 0) {
        newFiles.forEach(file => {
          submitData.append('hinh_anh_phu', file);
          console.log('📤 Uploading new image:', file.name);
        });
      }
    } else {
      // ⭐ QUAN TRỌNG: Nếu không có ảnh phụ nào, gửi mảng rỗng
      submitData.append('hinh_anh_phu_existing', JSON.stringify([]));
    }

    // Schedules
    if (schedules.length > 0) {
      const schedulesJson = JSON.stringify(schedules.map(s => ({
        ngay_khoi_hanh: s.ngay_khoi_hanh,
        so_chot_toi_da: parseInt(s.so_chot_toi_da),
        gia_nguoi_lon: parseFloat(s.gia_nguoi_lon),
        gia_tre_em: parseFloat(s.gia_tre_em),
        phuong_tiens: s.phuong_tiens.map(pt => ({
          ma_phuong_tien: pt.ma_phuong_tien,
        }))
      })));
      submitData.append('lich_khoi_hanh', schedulesJson);
    }

    mutation.mutate(submitData);
    setUploading(false);
  };

  const trangThaiOptions = [
    { value: 'Đang hoạt động', label: '🟢 Đang hoạt động' },
    { value: 'Hết chỗ', label: '🔴 Hết chỗ' },
    { value: 'Ngừng bán', label: '⚫ Ngừng bán' },
  ];

  const khuVucOptions = [
    { value: '', label: 'Chọn khu vực' },
    { value: 'Miền Bắc', label: '🏔️ Miền Bắc' },
    { value: 'Miền Trung', label: '🏖️ Miền Trung' },
    { value: 'Miền Nam', label: '🌴 Miền Nam' },
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
            {khuVucOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
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

        {/* ⭐⭐⭐ PHẦN HIỂN THỊ ẢNH */}
        <div className="md:col-span-2 border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📸 Hình ảnh</h3>
          
          {/* Ảnh chính */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh đại diện</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleMainImageChange}
              className="input-field"
            />
            <p className="text-xs text-gray-400 mt-1">Hỗ trợ: JPG, PNG, GIF, WEBP, SVG, BMP</p>
            {imagePreview && (
              <div className="mt-2">
                <img 
                  src={imagePreview || '/images/no-image.png'}
                  alt="Preview" 
                  className="w-32 h-32 object-cover rounded-lg border"
                  onError={(e) => {
                    e.target.src = '/images/no-image.png';
                  }}
                />
              </div>
            )}
          </div>

          {/* ⭐⭐⭐ Ảnh phụ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ảnh phụ (chọn nhiều)
              {imagePreviews.length > 0 && (
                <span className="text-xs text-gray-400 ml-2">({imagePreviews.length} ảnh)</span>
              )}
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleMultipleImagesChange}
              className="input-field"
            />
            <p className="text-xs text-gray-400 mt-1">Có thể chọn nhiều ảnh cùng lúc</p>
            
            {/* ⭐ HIỂN THỊ ẢNH PHỤ */}
            {imagePreviews.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview || '/images/no-image.png'}
                      alt={`Ảnh phụ ${index + 1}`}
                      className="w-24 h-24 object-cover rounded-lg border-2 hover:border-primary-500 transition-all"
                      onError={(e) => {
                        e.target.src = '/images/no-image.png';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                      title="Xóa ảnh này"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-400">
                <p>📷 Chưa có ảnh phụ nào</p>
                <p className="text-xs">Chọn ảnh để thêm vào thư viện</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ⭐⭐⭐ LỊCH KHỞI HÀNH */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          📅 Lịch khởi hành
          <span className="text-sm font-normal text-gray-500">
            ({schedules.length} lịch đã thêm)
          </span>
        </h3>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày khởi hành *</label>
              <input
                type="date"
                name="ngay_khoi_hanh"
                value={scheduleForm.ngay_khoi_hanh}
                onChange={(e) => setScheduleForm({ ...scheduleForm, ngay_khoi_hanh: e.target.value })}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số chỗ tối đa *
                {scheduleForm.phuong_tiens.length > 0 && (
                  <span className="text-xs text-blue-500 font-normal">
                    (phải {'<= '}{calculateTotalSeatsFromVehicles(scheduleForm.phuong_tiens)})
                  </span>
                )}
              </label>
              <input
                type="number"
                name="so_chot_toi_da"
                value={scheduleForm.so_chot_toi_da}
                onChange={(e) => setScheduleForm({ ...scheduleForm, so_chot_toi_da: e.target.value })}
                className="input-field w-full"
                placeholder="Số chỗ tối đa"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá người lớn *</label>
              <input
                type="number"
                name="gia_nguoi_lon"
                value={scheduleForm.gia_nguoi_lon}
                onChange={(e) => setScheduleForm({ ...scheduleForm, gia_nguoi_lon: e.target.value })}
                className="input-field w-full"
                placeholder="Giá người lớn"
                min="0"
                step="1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá trẻ em *</label>
              <input
                type="number"
                name="gia_tre_em"
                value={scheduleForm.gia_tre_em}
                onChange={(e) => setScheduleForm({ ...scheduleForm, gia_tre_em: e.target.value })}
                className="input-field w-full"
                placeholder="Giá trẻ em"
                min="0"
                step="1000"
              />
            </div>
          </div>

          {/* Chọn xe cho lịch khởi hành */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Chọn phương tiện</label>
              <select
                value={vehicleSelect.ma_phuong_tien}
                onChange={(e) => setVehicleSelect({ ma_phuong_tien: e.target.value })}
                className="input-field w-full"
              >
                <option value="">-- Chọn xe --</option>
                {vehicles.map((v) => {
                  const maxSeats = (v.so_cho_ngoi - 1);
                  return (
                    <option key={v.ma_phuong_tien} value={v.ma_phuong_tien}>
                      {v.bien_so_xe} - {v.ten_xe} ({maxSeats} chỗ khách)
                    </option>
                  );
                })}
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddVehicleToSchedule}
              className="btn-primary h-10 whitespace-nowrap px-6"
            >
              <PlusIcon className="w-4 h-4 inline mr-1" />
              Thêm xe
            </button>
          </div>

          {/* Danh sách xe đã chọn */}
          {scheduleForm.phuong_tiens.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium text-gray-600">📋 Xe đã chọn:</p>
              {scheduleForm.phuong_tiens.map((pt, idx) => {
                const vehicle = vehicles.find(v => v.ma_phuong_tien === pt.ma_phuong_tien);
                const seats = vehicle ? (vehicle.so_cho_ngoi - 1) : 0;
                return (
                  <div key={idx} className="flex justify-between items-center p-2 bg-white rounded-lg border">
                    <div>
                      <span className="font-medium">{pt.ten_xe}</span>
                      <span className="text-sm text-gray-500 ml-2">({pt.bien_so_xe})</span>
                      <span className="text-sm text-blue-500 ml-2">🪑 {seats} chỗ khách</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVehicleFromSchedule(idx)}
                      className="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-50"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ⭐⭐⭐ THÔNG BÁO TỔNG SỐ CHỖ */}
          {scheduleForm.phuong_tiens.length > 0 && scheduleForm.so_chot_toi_da && (
            (() => {
              const totalSeats = calculateTotalSeatsFromVehicles(scheduleForm.phuong_tiens);
              const maxSeats = parseInt(scheduleForm.so_chot_toi_da);
              const isValid = maxSeats <= totalSeats;
              
              return (
                <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 ${
                  isValid 
                    ? 'bg-green-50 border border-green-200 text-green-600' 
                    : 'bg-red-50 border border-red-200 text-red-600'
                }`}>
                  <span className="text-lg">{isValid ? '✅' : '⚠️'}</span>
                  <div>
                    <p className="font-medium">
                      Tổng chỗ xe: <strong>{totalSeats}</strong> chỗ
                      {isValid && ` | Số chỗ tối đa: ${maxSeats} chỗ`}
                    </p>
                    {!isValid && (
                      <p className="text-xs">
                        ❌ Số chỗ tối đa ({maxSeats}) phải {'<= '} tổng chỗ xe ({totalSeats})
                      </p>
                    )}
                    {isValid && (
                      <p className="text-xs text-green-500">
                        ✅ Số chỗ tối đa ({maxSeats}) {'<= '} tổng chỗ xe ({totalSeats})
                      </p>
                    )}
                  </div>
                </div>
              );
            })()
          )}

          <button
            type="button"
            onClick={handleAddSchedule}
            className="mt-3 btn-primary w-full py-2.5"
            disabled={scheduleForm.phuong_tiens.length === 0}
          >
            <PlusIcon className="w-4 h-4 inline mr-1" />
            {scheduleForm.phuong_tiens.length === 0 ? 'Vui lòng thêm xe' : 'Thêm lịch khởi hành'}
          </button>
        </div>

        {/* Danh sách lịch khởi hành đã thêm */}
        {schedules.length > 0 && (
          <div className="space-y-2">
            {schedules.map((schedule, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow">
                <div className="flex-1">
                  <div className="flex items-center gap-4 flex-wrap">
                    <p className="font-medium text-gray-800">
                      📅 {schedule.ngay_khoi_hanh}
                    </p>
                    <p className="text-sm text-gray-500">
                      🪑 {schedule.so_chot_toi_da} chỗ
                    </p>
                    <p className="text-sm text-primary-500 font-medium">
                      💰 {formatCurrency(schedule.gia_nguoi_lon)}/người lớn
                    </p>
                    <p className="text-sm text-blue-500">
                      👶 {formatCurrency(schedule.gia_tre_em)}/trẻ em
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {schedule.phuong_tiens.map((pt, idx) => {
                      const vehicle = vehicles.find(v => v.ma_phuong_tien === pt.ma_phuong_tien);
                      const seats = vehicle ? (vehicle.so_cho_ngoi - 1) : 0;
                      return (
                        <span key={idx} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          🚌 {pt.ten_xe} ({seats} chỗ)
                        </span>
                      );
                    })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSchedule(index)}
                  className="text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors ml-2 flex-shrink-0"
                >
                  🗑️ Xóa
                </button>
              </div>
            ))}
          </div>
        )}

        {!tour && schedules.length === 0 && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
            ⚠️ Vui lòng thêm ít nhất 1 lịch khởi hành để tạo tour
          </div>
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