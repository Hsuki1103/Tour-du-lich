// frontend/src/pages/AdminSchedules.jsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { schedulesAPI } from '../api/schedules';
import { vehiclesAPI } from '../api/vehicles';
import { toursAPI } from '../api/tours';
import AdminLayout from '../components/admin/AdminLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate, getStatusColor } from '../utils/helpers';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    XMarkIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
    CalendarIcon,
    UsersIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    TruckIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const AdminSchedules = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [tourFilter, setTourFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [formData, setFormData] = useState({
        ma_tour: '',
        ngay_khoi_hanh: '',
        so_chot_toi_da: '',
        gia_nguoi_lon: '',
        gia_tre_em: '',
        trang_thai: 'Còn chỗ'
    });
    const [errors, setErrors] = useState({});

    // ⭐ STATE CHO NHIỀU PHƯƠNG TIỆN
    const [selectedVehicles, setSelectedVehicles] = useState([]);
    const [vehicleForm, setVehicleForm] = useState({
        ma_phuong_tien: ''
    });
    const [totalSeatsFromVehicles, setTotalSeatsFromVehicles] = useState(0);

    // Fetch tours for dropdown
    const { data: toursData } = useQuery(
        ['admin-tours-dropdown'],
        () => toursAPI.getTours({ limit: 100 })
    );
    const tours = toursData?.data?.data?.items || [];

    // Fetch active vehicles for dropdown
    const { data: vehiclesData } = useQuery(
        ['active-vehicles'],
        () => vehiclesAPI.getActiveVehicles()
    );
    const vehicles = vehiclesData?.data?.data || [];

    // Fetch schedules
    const { data, isLoading, error, refetch } = useQuery(
        ['admin-schedules', page, searchTerm, tourFilter, statusFilter],
        () => {
            const params = {};
            params.page = page;
            params.limit = 20;

            if (searchTerm && searchTerm.trim() !== '') {
                params.search = searchTerm.trim();
            }

            if (tourFilter && tourFilter !== '' && tourFilter !== 'undefined' && tourFilter !== 'null') {
                const tourId = parseInt(tourFilter);
                if (!isNaN(tourId) && tourId > 0) {
                    params.ma_tour = tourId;
                }
            }

            if (statusFilter && statusFilter !== '' && statusFilter !== 'undefined' && statusFilter !== 'null') {
                params.trang_thai = statusFilter;
            }

            return schedulesAPI.getSchedules(params);
        },
        {
            keepPreviousData: true,
            onError: (err) => {
                console.error('❌ Fetch schedules error:', err.response?.data || err.message);
                const errorMsg = err.response?.data?.message || 'Lỗi tải danh sách lịch khởi hành';
                toast.error(errorMsg);
            }
        }
    );

    const schedules = data?.data?.data?.items || [];
    const total = data?.data?.data?.total || 0;
    const totalPages = data?.data?.data?.totalPages || 1;

    // ⭐ THỐNG KÊ LỊCH KHỞI HÀNH
    const stats = {
        total: schedules.length,
        available: schedules.filter(s => s.trang_thai === 'Còn chỗ').length,
        full: schedules.filter(s => s.trang_thai === 'Hết chỗ').length,
        departed: schedules.filter(s => s.trang_thai === 'Đã khởi hành').length,
        cancelled: schedules.filter(s => s.trang_thai === 'Đã hủy').length,
        totalSeats: schedules.reduce((sum, s) => sum + s.so_chot_toi_da, 0),
        totalBooked: schedules.reduce((sum, s) => sum + s.so_chot_da_dat, 0),
        totalRemaining: schedules.reduce((sum, s) => sum + (s.so_chot_toi_da - s.so_chot_da_dat), 0),
        upcoming: schedules.filter(s => new Date(s.ngay_khoi_hanh) > new Date()).length
    };

    // ⭐ TÍNH TỔNG SỐ CHỖ TỪ CÁC XE ĐÃ CHỌN
    useEffect(() => {
        let total = 0;
        selectedVehicles.forEach(item => {
            total += item.so_chot_toi_da || 0;
        });
        setTotalSeatsFromVehicles(total);
        
        if (total > 0 && formData.so_chot_toi_da === '') {
            setFormData(prev => ({
                ...prev,
                so_chot_toi_da: String(total)
            }));
        }
    }, [selectedVehicles]);

    // ⭐ THÊM XE VÀO DANH SÁCH
    const handleAddVehicle = () => {
        if (!vehicleForm.ma_phuong_tien) {
            toast.warning('Vui lòng chọn phương tiện');
            return;
        }
        
        const exists = selectedVehicles.find(v => v.ma_phuong_tien === parseInt(vehicleForm.ma_phuong_tien));
        if (exists) {
            toast.warning('Phương tiện này đã được chọn');
            return;
        }
        
        const vehicle = vehicles.find(v => v.ma_phuong_tien === parseInt(vehicleForm.ma_phuong_tien));
        const soLuongXe = 1;
        const soChot = (vehicle.so_cho_ngoi - 1) * soLuongXe;
        
        setSelectedVehicles([...selectedVehicles, {
            ma_phuong_tien: parseInt(vehicleForm.ma_phuong_tien),
            so_luong_xe: soLuongXe,
            ten_xe: vehicle?.ten_xe || '',
            bien_so_xe: vehicle?.bien_so_xe || '',
            so_cho_ngoi: vehicle?.so_cho_ngoi || 0,
            hang_xe: vehicle?.hang_xe || '',
            loai_xe: vehicle?.loai_xe || '',
            so_chot_toi_da: soChot
        }]);
        
        setVehicleForm({ ma_phuong_tien: '' });
    };

    // ⭐ XÓA XE KHỎI DANH SÁCH
    const handleRemoveVehicle = (index) => {
        setSelectedVehicles(selectedVehicles.filter((_, i) => i !== index));
    };

    // ⭐ RESET FORM
    const resetForm = () => {
        setFormData({
            ma_tour: '',
            ngay_khoi_hanh: '',
            so_chot_toi_da: '',
            gia_nguoi_lon: '',
            gia_tre_em: '',
            trang_thai: 'Còn chỗ'
        });
        setSelectedVehicles([]);
        setVehicleForm({ ma_phuong_tien: '' });
        setTotalSeatsFromVehicles(0);
        setErrors({});
    };

    // ⭐ KHI SỬA - LOAD DỮ LIỆU
    const handleEdit = (schedule) => {
        setEditingSchedule(schedule);
        setFormData({
            ma_tour: schedule.ma_tour || '',
            ngay_khoi_hanh: schedule.ngay_khoi_hanh || '',
            so_chot_toi_da: schedule.so_chot_toi_da ? String(schedule.so_chot_toi_da) : '',
            gia_nguoi_lon: schedule.gia_nguoi_lon || '',
            gia_tre_em: schedule.gia_tre_em || '',
            trang_thai: schedule.trang_thai || 'Còn chỗ'
        });

        if (schedule.phuongTiens && schedule.phuongTiens.length > 0) {
            const vehiclesList = schedule.phuongTiens.map(v => ({
                ma_phuong_tien: v.ma_phuong_tien,
                so_luong_xe: 1,
                ten_xe: v.ten_xe || '',
                bien_so_xe: v.bien_so_xe || '',
                so_cho_ngoi: v.so_cho_ngoi || 0,
                hang_xe: v.hang_xe || '',
                loai_xe: v.loai_xe || '',
                so_chot_toi_da: (v.so_cho_ngoi - 1) * 1
            }));
            setSelectedVehicles(vehiclesList);
        } else {
            setSelectedVehicles([]);
        }

        setShowForm(true);
    };

    // ⭐ MUTATIONS
    const scheduleMutation = useMutation(
        (data) => {
            const submitData = {
                ...data,
                phuong_tiens: selectedVehicles.map(v => ({
                    ma_phuong_tien: v.ma_phuong_tien,
                    so_luong_xe: 1
                }))
            };

            if (editingSchedule) {
                return schedulesAPI.updateSchedule(editingSchedule.ma_lich_khoi_hanh, submitData);
            }
            return schedulesAPI.createSchedule(submitData);
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['admin-schedules']);
                setShowForm(false);
                setEditingSchedule(null);
                resetForm();
                toast.success(editingSchedule ? 'Cập nhật lịch khởi hành thành công!' : 'Thêm lịch khởi hành thành công!');
            },
            onError: (error) => {
                console.error('❌ Mutation error:', error.response?.data);
                toast.error(error.response?.data?.message || 'Lưu lịch khởi hành thất bại');
            }
        }
    );

    const deleteMutation = useMutation(
        (id) => schedulesAPI.deleteSchedule(id),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['admin-schedules']);
                toast.success('Xóa lịch khởi hành thành công!');
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || 'Xóa lịch khởi hành thất bại');
            }
        }
    );

    const handleDelete = (id, tourName) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa lịch khởi hành của tour "${tourName}"?`)) {
            deleteMutation.mutate(id);
        }
    };

    const handleViewDetail = (schedule) => {
        setSelectedSchedule(schedule);
        setShowDetail(true);
    };

    // ⭐ SUBMIT
    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!formData.ma_tour) newErrors.ma_tour = 'Vui lòng chọn tour';
        if (!formData.ngay_khoi_hanh) newErrors.ngay_khoi_hanh = 'Vui lòng chọn ngày khởi hành';
        
        if (!formData.so_chot_toi_da || formData.so_chot_toi_da === '') {
            newErrors.so_chot_toi_da = 'Vui lòng nhập số chỗ tối đa';
        } else {
            const maxSeats = parseInt(formData.so_chot_toi_da);
            if (isNaN(maxSeats)) {
                newErrors.so_chot_toi_da = 'Số chỗ tối đa phải là số nguyên';
            } else if (selectedVehicles.length > 0 && maxSeats > totalSeatsFromVehicles) {
                newErrors.so_chot_toi_da = `Số chỗ tối đa (${maxSeats}) không được vượt quá tổng chỗ xe (${totalSeatsFromVehicles})`;
            }
        }
        
        if (!formData.gia_nguoi_lon || formData.gia_nguoi_lon <= 0) {
            newErrors.gia_nguoi_lon = 'Vui lòng nhập giá người lớn hợp lệ';
        }
        if (!formData.gia_tre_em || formData.gia_tre_em < 0) {
            newErrors.gia_tre_em = 'Vui lòng nhập giá trẻ em hợp lệ';
        }

        if (selectedVehicles.length === 0) {
            toast.warning('Vui lòng chọn ít nhất 1 phương tiện');
            return;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.warning('Vui lòng kiểm tra lại thông tin');
            return;
        }

        const submitData = {
            ma_tour: parseInt(formData.ma_tour),
            ngay_khoi_hanh: formData.ngay_khoi_hanh,
            so_chot_toi_da: parseInt(formData.so_chot_toi_da),
            gia_nguoi_lon: parseFloat(formData.gia_nguoi_lon),
            gia_tre_em: parseFloat(formData.gia_tre_em),
            trang_thai: formData.trang_thai || 'Còn chỗ'
        };

        try {
            await scheduleMutation.mutateAsync(submitData);
        } catch (error) {
            console.error('❌ Submit error:', error.response?.data);
            const message = error.response?.data?.message || 'Lưu lịch khởi hành thất bại';
            toast.error(message);
        }
    };

    const getStatusBadge = (status) => {
        const configs = {
            'Còn chỗ': { color: 'badge-success', icon: '🟢' },
            'Hết chỗ': { color: 'badge-danger', icon: '🔴' },
            'Đã khởi hành': { color: 'badge-info', icon: '🔵' },
            'Đã hủy': { color: 'badge-secondary', icon: '⚫' }
        };
        const config = configs[status] || configs['Còn chỗ'];
        return (
            <span className={`badge ${config.color}`}>
                {config.icon} {status}
            </span>
        );
    };

    const statusOptions = ['Còn chỗ', 'Hết chỗ', 'Đã khởi hành', 'Đã hủy'];

    if (isLoading) return <LoadingSpinner />;

    return (
        <AdminLayout>
            <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Quản lý lịch khởi hành</h1>
                        <p className="text-gray-600">Quản lý lịch trình xuất bến cho các tour</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingSchedule(null);
                            resetForm();
                            setShowForm(true);
                        }}
                        className="btn-primary flex items-center gap-2"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Thêm lịch khởi hành
                    </button>
                </div>

                {/* ⭐ THỐNG KÊ LỊCH KHỞI HÀNH */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-200">
                        <div className="flex items-center justify-center mb-2">
                            <CalendarIcon className="w-6 h-6 text-blue-500" />
                        </div>
                        <p className="text-sm text-gray-500">Tổng lịch</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl shadow-sm p-4 text-center border border-green-200">
                        <div className="flex items-center justify-center mb-2">
                            <CheckCircleIcon className="w-6 h-6 text-green-500" />
                        </div>
                        <p className="text-sm text-green-600">Còn chỗ</p>
                        <p className="text-2xl font-bold text-green-600">{stats.available}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl shadow-sm p-4 text-center border border-red-200">
                        <div className="flex items-center justify-center mb-2">
                            <XCircleIcon className="w-6 h-6 text-red-500" />
                        </div>
                        <p className="text-sm text-red-600">Hết chỗ / Đã hủy</p>
                        <p className="text-2xl font-bold text-red-600">{stats.full + stats.cancelled}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl shadow-sm p-4 text-center border border-blue-200">
                        <div className="flex items-center justify-center mb-2">
                            <ClockIcon className="w-6 h-6 text-blue-500" />
                        </div>
                        <p className="text-sm text-blue-600">Sắp khởi hành</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
                    </div>
                </div>

                {/* ⭐ THỐNG KÊ CHỖ NGỒI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500">Tổng chỗ</p>
                        <p className="text-xl font-bold text-gray-700">{stats.totalSeats}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-orange-600">Đã đặt</p>
                        <p className="text-xl font-bold text-orange-600">{stats.totalBooked}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-green-600">Còn trống</p>
                        <p className="text-xl font-bold text-green-600">{stats.totalRemaining}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-blue-600">Tỷ lệ lấp đầy</p>
                        <p className="text-xl font-bold text-blue-600">
                            {stats.totalSeats > 0 ? Math.round((stats.totalBooked / stats.totalSeats) * 100) : 0}%
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm lịch khởi hành..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-field pl-10"
                            />
                        </div>
                    </div>
                    <select
                        value={tourFilter}
                        onChange={(e) => setTourFilter(e.target.value)}
                        className="input-field w-48"
                    >
                        <option value="">Tất cả tour</option>
                        {tours.map((tour) => (
                            <option key={tour.ma_tour} value={tour.ma_tour}>{tour.ten_tour}</option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input-field w-48"
                    >
                        <option value="">Tất cả trạng thái</option>
                        {statusOptions.map((status) => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                    {(searchTerm || tourFilter || statusFilter) && (
                        <button onClick={() => { setSearchTerm(''); setTourFilter(''); setStatusFilter(''); }} className="btn-secondary whitespace-nowrap">
                            <ArrowPathIcon className="w-4 h-4 inline mr-1" />
                            Xóa bộ lọc
                        </button>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {error ? (
                        <div className="p-6 text-center text-red-500">
                            Có lỗi xảy ra khi tải danh sách lịch khởi hành: {error.response?.data?.message || error.message}
                        </div>
                    ) : schedules.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tour</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phương tiện</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày KH</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số chỗ</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đã đặt</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Còn lại</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {schedules.map((schedule, index) => (
                                            <tr key={schedule.ma_lich_khoi_hanh} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">{(page - 1) * 20 + index + 1}</td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-medium text-gray-800">{schedule.tour?.ten_tour}</p>
                                                        <p className="text-xs text-gray-500">{schedule.tour?.diem_den}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {schedule.phuongTiens && schedule.phuongTiens.length > 0 ? (
                                                        <div>
                                                            {schedule.phuongTiens.map((v, idx) => (
                                                                <div key={idx} className="text-sm">
                                                                    <span className="font-mono text-primary-500">{v.bien_so_xe}</span>
                                                                    <span className="text-gray-500 text-xs ml-1">
                                                                        ({v.so_cho_ngoi} chỗ)
                                                                    </span>
                                                                    {idx < schedule.phuongTiens.length - 1 && <span className="text-gray-300 mx-1">|</span>}
                                                                </div>
                                                            ))}
                                                            <p className="text-xs text-blue-500 mt-1">
                                                                🚌 {schedule.tong_so_xe || schedule.phuongTiens.length} loại xe
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">Chưa chọn</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-medium">{formatDate(schedule.ngay_khoi_hanh)}</td>
                                                <td className="px-6 py-4 text-center">{schedule.so_chot_toi_da}</td>
                                                <td className="px-6 py-4 text-center">{schedule.so_chot_da_dat}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`font-bold ${schedule.so_chot_con_lai > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                        {schedule.so_chot_con_lai}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">{getStatusBadge(schedule.trang_thai)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleViewDetail(schedule)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Chi tiết"
                                                        >
                                                            <EyeIcon className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(schedule)}
                                                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                                            title="Sửa"
                                                        >
                                                            <PencilIcon className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(schedule.ma_lich_khoi_hanh, schedule.tour?.ten_tour)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Xóa"
                                                            disabled={schedule.so_chot_da_dat > 0 || deleteMutation.isLoading}
                                                        >
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination */}
                            <div className="px-6 py-4 border-t flex justify-between items-center">
                                <p className="text-sm text-gray-500">Hiển thị {schedules.length} / {total} lịch khởi hành</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                                    >
                                        Trước
                                    </button>
                                    <span className="px-3 py-1">Trang {page} / {totalPages}</span>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                                    >
                                        Sau
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="p-12 text-center">
                            <p className="text-gray-500">Chưa có lịch khởi hành nào</p>
                            <button
                                onClick={() => {
                                    setEditingSchedule(null);
                                    resetForm();
                                    setShowForm(true);
                                }}
                                className="btn-primary mt-4"
                            >
                                Thêm lịch khởi hành đầu tiên
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ⭐ FORM MODAL - Giữ nguyên */}
            {showForm && (
                // ... (giữ nguyên form modal của bạn)
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-800">
                                {editingSchedule ? '✏️ Sửa lịch khởi hành' : '➕ Thêm lịch khởi hành mới'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingSchedule(null);
                                    resetForm();
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Thông tin cơ bản */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tour *</label>
                                    <select
                                        value={formData.ma_tour}
                                        onChange={(e) => setFormData({ ...formData, ma_tour: e.target.value })}
                                        className={`input-field ${errors.ma_tour ? 'border-red-500' : ''}`}
                                    >
                                        <option value="">-- Chọn tour --</option>
                                        {tours.map((tour) => (
                                            <option key={tour.ma_tour} value={tour.ma_tour}>
                                                {tour.ten_tour} ({tour.diem_den})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.ma_tour && <p className="text-red-500 text-sm mt-1">{errors.ma_tour}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày khởi hành *</label>
                                    <input
                                        type="date"
                                        value={formData.ngay_khoi_hanh}
                                        onChange={(e) => setFormData({ ...formData, ngay_khoi_hanh: e.target.value })}
                                        className={`input-field ${errors.ngay_khoi_hanh ? 'border-red-500' : ''}`}
                                    />
                                    {errors.ngay_khoi_hanh && <p className="text-red-500 text-sm mt-1">{errors.ngay_khoi_hanh}</p>}
                                </div>
                            </div>

                            {/* Số chỗ tối đa */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Số chỗ tối đa *
                                    {selectedVehicles.length > 0 && (
                                        <span className="text-xs text-blue-500 font-normal ml-2">
                                            (Tổng chỗ xe: {totalSeatsFromVehicles})
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formData.so_chot_toi_da}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || /^\d+$/.test(value)) {
                                            setFormData({ ...formData, so_chot_toi_da: value });
                                        }
                                    }}
                                    className={`input-field ${errors.so_chot_toi_da ? 'border-red-500' : ''}`}
                                    placeholder={selectedVehicles.length > 0 ? `Tối đa ${totalSeatsFromVehicles}` : 'Nhập số chỗ'}
                                />
                                {errors.so_chot_toi_da && <p className="text-red-500 text-sm mt-1">{errors.so_chot_toi_da}</p>}
                                
                                {selectedVehicles.length > 0 && formData.so_chot_toi_da !== '' && (
                                    <div className={`mt-2 p-2 rounded-lg text-sm ${parseInt(formData.so_chot_toi_da) <= totalSeatsFromVehicles ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                                        {parseInt(formData.so_chot_toi_da) <= totalSeatsFromVehicles ? (
                                            <span>✅ Số chỗ tối đa ({formData.so_chot_toi_da}) {'<= '} tổng chỗ xe ({totalSeatsFromVehicles})</span>
                                        ) : (
                                            <span>⚠️ Số chỗ tối đa ({formData.so_chot_toi_da || 0}) phải {'<= '} tổng chỗ xe ({totalSeatsFromVehicles})</span>
                                        )}
                                    </div>
                                )}
                                
                                <p className="text-xs text-gray-400 mt-1">
                                    💡 Số chỗ tối đa không được vượt quá tổng số chỗ của các xe đã chọn.
                                </p>
                            </div>

                            {/* Phần chọn nhiều phương tiện */}
                            <div className="border-t pt-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">🚌 Chọn phương tiện</h3>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Chọn xe</label>
                                        <select
                                            value={vehicleForm.ma_phuong_tien}
                                            onChange={(e) => setVehicleForm({ ...vehicleForm, ma_phuong_tien: e.target.value })}
                                            className="input-field"
                                        >
                                            <option value="">-- Chọn xe --</option>
                                            {vehicles.map((v) => (
                                                <option key={v.ma_phuong_tien} value={v.ma_phuong_tien}>
                                                    {v.bien_so_xe} - {v.ten_xe} ({v.so_cho_ngoi} chỗ) {v.hang_xe ? `- ${v.hang_xe}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            type="button"
                                            onClick={handleAddVehicle}
                                            className="btn-primary w-full"
                                        >
                                            ➕ Thêm xe
                                        </button>
                                    </div>
                                </div>

                                {selectedVehicles.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        <p className="text-sm font-medium text-gray-700">📋 Danh sách xe đã chọn:</p>
                                        {selectedVehicles.map((item, index) => (
                                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                                                <div>
                                                    <p className="font-medium text-gray-800">
                                                        {item.ten_xe} - {item.bien_so_xe}
                                                        <span className="text-sm text-gray-500 ml-2">({item.hang_xe})</span>
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {item.so_cho_ngoi} chỗ = {item.so_chot_toi_da} chỗ khách
                                                        <span className="text-xs text-blue-500 ml-2">| {item.loai_xe}</span>
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveVehicle(index)}
                                                    className="text-red-500 hover:text-red-600 px-3 py-1 rounded hover:bg-red-50"
                                                >
                                                    🗑️ Xóa
                                                </button>
                                            </div>
                                        ))}
                                        
                                        <div className="p-3 bg-blue-50 rounded-lg">
                                            <p className="text-sm font-medium text-blue-700">
                                                🚌 Tổng số chỗ từ xe: <strong>{totalSeatsFromVehicles}</strong> chỗ
                                            </p>
                                            <p className="text-xs text-blue-500">
                                                * Đã trừ {selectedVehicles.length} tài xế | Số loại xe: {selectedVehicles.length}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {selectedVehicles.length === 0 && (
                                    <p className="text-sm text-yellow-600 mt-2">⚠️ Vui lòng thêm ít nhất 1 phương tiện</p>
                                )}
                            </div>

                            {/* Giá */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá người lớn *</label>
                                    <input
                                        type="number"
                                        value={formData.gia_nguoi_lon}
                                        onChange={(e) => setFormData({ ...formData, gia_nguoi_lon: e.target.value })}
                                        className={`input-field ${errors.gia_nguoi_lon ? 'border-red-500' : ''}`}
                                        placeholder="1,500,000"
                                    />
                                    {errors.gia_nguoi_lon && <p className="text-red-500 text-sm mt-1">{errors.gia_nguoi_lon}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá trẻ em *</label>
                                    <input
                                        type="number"
                                        value={formData.gia_tre_em}
                                        onChange={(e) => setFormData({ ...formData, gia_tre_em: e.target.value })}
                                        className={`input-field ${errors.gia_tre_em ? 'border-red-500' : ''}`}
                                        placeholder="1,000,000"
                                    />
                                    {errors.gia_tre_em && <p className="text-red-500 text-sm mt-1">{errors.gia_tre_em}</p>}
                                </div>
                            </div>

                            {/* Trạng thái */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                                <select
                                    value={formData.trang_thai}
                                    onChange={(e) => setFormData({ ...formData, trang_thai: e.target.value })}
                                    className="input-field"
                                >
                                    {statusOptions.map((status) => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-2 border-t">
                                <button
                                    type="submit"
                                    disabled={scheduleMutation.isLoading || selectedVehicles.length === 0}
                                    className="btn-primary flex-1 disabled:opacity-50"
                                >
                                    {scheduleMutation.isLoading ? 'Đang lưu...' : editingSchedule ? 'Cập nhật' : 'Thêm lịch khởi hành'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingSchedule(null);
                                        resetForm();
                                    }}
                                    className="btn-secondary flex-1"
                                >
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ⭐ MODAL CHI TIẾT - Giữ nguyên */}
            {showDetail && selectedSchedule && (
                // ... (giữ nguyên detail modal của bạn)
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-800">📋 Chi tiết lịch khởi hành</h2>
                            <button
                                onClick={() => {
                                    setShowDetail(false);
                                    setSelectedSchedule(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Mã lịch</p>
                                    <p className="font-bold text-lg">#{selectedSchedule.ma_lich_khoi_hanh}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Trạng thái</p>
                                    {getStatusBadge(selectedSchedule.trang_thai)}
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">Tour</p>
                                <p className="font-medium">{selectedSchedule.tour?.ten_tour}</p>
                                <p className="text-sm text-gray-500">Điểm đến: {selectedSchedule.tour?.diem_den}</p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">Phương tiện</p>
                                {selectedSchedule.phuongTiens && selectedSchedule.phuongTiens.length > 0 ? (
                                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                        {selectedSchedule.phuongTiens.map((v, idx) => (
                                            <div key={idx} className="flex justify-between items-center border-b last:border-0 pb-2 last:pb-0">
                                                <div>
                                                    <p className="font-mono font-bold text-primary-500">{v.bien_so_xe}</p>
                                                    <p className="text-sm">{v.ten_xe}</p>
                                                    <p className="text-xs text-gray-500">{v.hang_xe} - {v.loai_xe}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium">
                                                        {v.so_cho_ngoi} chỗ
                                                    </p>
                                                    <p className="text-xs text-blue-500">
                                                        = {(v.so_cho_ngoi - 1)} chỗ khách
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="pt-2 border-t border-dashed">
                                            <p className="text-sm font-medium text-blue-600">
                                                🚌 Tổng: {selectedSchedule.phuongTiens.length} loại xe | {selectedSchedule.so_chot_toi_da} chỗ
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-400">Chưa chọn phương tiện</p>
                                )}
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">Ngày khởi hành</p>
                                <p className="font-medium">{formatDate(selectedSchedule.ngay_khoi_hanh)}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gray-50 rounded-lg p-3 text-center">
                                    <p className="text-sm text-gray-500">Số chỗ tối đa</p>
                                    <p className="text-xl font-bold text-gray-800">{selectedSchedule.so_chot_toi_da}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 text-center">
                                    <p className="text-sm text-gray-500">Đã đặt</p>
                                    <p className="text-xl font-bold text-orange-500">{selectedSchedule.so_chot_da_dat}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 text-center">
                                    <p className="text-sm text-gray-500">Còn lại</p>
                                    <p className={`text-xl font-bold ${selectedSchedule.so_chot_con_lai > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {selectedSchedule.so_chot_con_lai}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 rounded-lg p-3">
                                    <p className="text-sm text-green-600">💵 Giá người lớn</p>
                                    <p className="text-xl font-bold text-green-600">{formatCurrency(selectedSchedule.gia_nguoi_lon)}</p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-3">
                                    <p className="text-sm text-blue-600">👶 Giá trẻ em</p>
                                    <p className="text-xl font-bold text-blue-600">{formatCurrency(selectedSchedule.gia_tre_em)}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setShowDetail(false);
                                    setSelectedSchedule(null);
                                }}
                                className="btn-secondary w-full"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminSchedules;