// frontend/src/pages/AdminVehicles.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { vehiclesAPI } from '../api/vehicles';
import AdminLayout from '../components/admin/AdminLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate } from '../utils/helpers';
import { toast } from 'react-toastify';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowPathIcon,
  TruckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const AdminVehicles = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [loaiXeFilter, setLoaiXeFilter] = useState('');
  const [trangThaiFilter, setTrangThaiFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [formData, setFormData] = useState({
    bien_so_xe: '',
    ten_xe: '',
    hang_xe: '',
    so_cho_ngoi: 45,
    so_luong_xe: 1,
    loai_xe: 'Xe khách',
    trang_thai: 'Đang hoạt động'
  });
  const [errors, setErrors] = useState({});

  // Fetch vehicles
  const { data, isLoading, error, refetch } = useQuery(
    ['admin-vehicles', page, searchTerm, loaiXeFilter, trangThaiFilter],
    () => vehiclesAPI.getVehicles({
      page,
      limit: 20,
      search: searchTerm || undefined,
      loai_xe: loaiXeFilter || undefined,
      trang_thai: trangThaiFilter || undefined
    }),
    { keepPreviousData: true }
  );

  const vehicles = data?.data?.data?.items || [];
  const total = data?.data?.data?.total || 0;
  const totalPages = data?.data?.data?.totalPages || 1;

  // ⭐ THỐNG KÊ PHƯƠNG TIỆN
  const stats = {
    total: vehicles.length,
    active: vehicles.filter(v => v.trang_thai === 'Đang hoạt động').length,
    maintenance: vehicles.filter(v => v.trang_thai === 'Đang bảo trì').length,
    inactive: vehicles.filter(v => v.trang_thai === 'Ngừng hoạt động').length,
    totalSeats: vehicles.reduce((sum, v) => sum + (v.so_cho_ngoi * v.so_luong_xe), 0),
    byType: vehicles.reduce((acc, v) => {
      acc[v.loai_xe] = (acc[v.loai_xe] || 0) + 1;
      return acc;
    }, {})
  };

  // Create/Update mutation
  const vehicleMutation = useMutation(
    (data) => {
      if (editingVehicle) {
        return vehiclesAPI.updateVehicle(editingVehicle.ma_phuong_tien, data);
      }
      return vehiclesAPI.createVehicle(data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-vehicles']);
        setShowForm(false);
        setEditingVehicle(null);
        resetForm();
        toast.success(editingVehicle ? 'Cập nhật phương tiện thành công!' : 'Thêm phương tiện thành công!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Lưu phương tiện thất bại');
      }
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id) => vehiclesAPI.deleteVehicle(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-vehicles']);
        toast.success('Xóa phương tiện thành công!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Xóa phương tiện thất bại');
      }
    }
  );

  const resetForm = () => {
    setFormData({
      bien_so_xe: '',
      ten_xe: '',
      hang_xe: '',
      so_cho_ngoi: 45,
      so_luong_xe: 1,
      loai_xe: 'Xe khách',
      trang_thai: 'Đang hoạt động'
    });
    setErrors({});
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      bien_so_xe: vehicle.bien_so_xe || '',
      ten_xe: vehicle.ten_xe || '',
      hang_xe: vehicle.hang_xe || '',
      so_cho_ngoi: vehicle.so_cho_ngoi || 45,
      so_luong_xe: vehicle.so_luong_xe || 1,
      loai_xe: vehicle.loai_xe || 'Xe khách',
      trang_thai: vehicle.trang_thai || 'Đang hoạt động'
    });
    setShowForm(true);
  };

  const handleDelete = (id, bienSo) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa phương tiện "${bienSo}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewDetail = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetail(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.bien_so_xe) newErrors.bien_so_xe = 'Biển số xe không được để trống';
    if (!formData.ten_xe) newErrors.ten_xe = 'Tên xe không được để trống';
    if (!formData.so_cho_ngoi) newErrors.so_cho_ngoi = 'Số chỗ ngồi không được để trống';
    if (formData.so_cho_ngoi < 4 || formData.so_cho_ngoi > 60) {
      newErrors.so_cho_ngoi = 'Số chỗ ngồi phải từ 4 đến 60';
    }
    if (formData.so_luong_xe < 1 || formData.so_luong_xe > 10) {
      newErrors.so_luong_xe = 'Số lượng xe phải từ 1 đến 10';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const submitData = {
      ...formData,
      so_cho_ngoi: parseInt(formData.so_cho_ngoi),
      so_luong_xe: parseInt(formData.so_luong_xe)
    };

    vehicleMutation.mutate(submitData);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setLoaiXeFilter('');
    setTrangThaiFilter('');
    setPage(1);
  };

  const getStatusBadge = (status) => {
    const configs = {
      'Đang hoạt động': { color: 'badge-success', icon: '🟢' },
      'Đang bảo trì': { color: 'badge-warning', icon: '🟡' },
      'Ngừng hoạt động': { color: 'badge-danger', icon: '🔴' }
    };
    const config = configs[status] || configs['Đang hoạt động'];
    return (
      <span className={`badge ${config.color}`}>
        {config.icon} {status}
      </span>
    );
  };

  const loaiXeOptions = ['Xe khách', 'Xe limousine', 'Xe van', 'Xe giường nằm', 'Xe buýt'];
  const trangThaiOptions = ['Đang hoạt động', 'Đang bảo trì', 'Ngừng hoạt động'];

  if (isLoading) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Quản lý phương tiện</h1>
            <p className="text-gray-600">Quản lý danh sách xe phục vụ tour</p>
          </div>
          <button
            onClick={() => {
              setEditingVehicle(null);
              resetForm();
              setShowForm(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Thêm phương tiện
          </button>
        </div>

        {/* ⭐ THỐNG KÊ PHƯƠNG TIỆN */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-200">
            <div className="flex items-center justify-center mb-2">
              <TruckIcon className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-sm text-gray-500">Tổng phương tiện</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-green-50 rounded-xl shadow-sm p-4 text-center border border-green-200">
            <div className="flex items-center justify-center mb-2">
              <CheckCircleIcon className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-sm text-green-600">Đang hoạt động</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl shadow-sm p-4 text-center border border-yellow-200">
            <div className="flex items-center justify-center mb-2">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />
            </div>
            <p className="text-sm text-yellow-600">Đang bảo trì</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
          </div>
          <div className="bg-red-50 rounded-xl shadow-sm p-4 text-center border border-red-200">
            <div className="flex items-center justify-center mb-2">
              <XCircleIcon className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm text-red-600">Ngừng hoạt động</p>
            <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
          </div>
        </div>

        {/* ⭐ THỐNG KÊ THEO LOẠI XE */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-6">
          {Object.entries(stats.byType).map(([type, count]) => (
            <div key={type} className="bg-gray-50 rounded-lg p-2 text-center text-sm">
              <span className="font-medium text-gray-700">{type}</span>
              <span className="ml-1 text-gray-500">({count})</span>
            </div>
          ))}
          <div className="bg-blue-50 rounded-lg p-2 text-center text-sm">
            <span className="font-medium text-blue-700">🪑 Tổng chỗ</span>
            <span className="ml-1 text-blue-600 font-bold">{stats.totalSeats}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm phương tiện..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <select
            value={loaiXeFilter}
            onChange={(e) => setLoaiXeFilter(e.target.value)}
            className="input-field w-48"
          >
            <option value="">Tất cả loại xe</option>
            {loaiXeOptions.map((loai) => (
              <option key={loai} value={loai}>{loai}</option>
            ))}
          </select>
          <select
            value={trangThaiFilter}
            onChange={(e) => setTrangThaiFilter(e.target.value)}
            className="input-field w-48"
          >
            <option value="">Tất cả trạng thái</option>
            {trangThaiOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          {(searchTerm || loaiXeFilter || trangThaiFilter) && (
            <button onClick={handleResetFilters} className="btn-secondary whitespace-nowrap">
              <ArrowPathIcon className="w-4 h-4 inline mr-1" />
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {error ? (
            <div className="p-6 text-center text-red-500">
              Có lỗi xảy ra khi tải danh sách phương tiện
            </div>
          ) : vehicles.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biển số</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên xe</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số chỗ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SL xe</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại xe</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {vehicles.map((vehicle, index) => (
                      <tr key={vehicle.ma_phuong_tien} className="hover:bg-gray-50">
                        <td className="px-6 py-4">{(page - 1) * 20 + index + 1}</td>
                        <td className="px-6 py-4 font-mono font-bold text-primary-500">
                          {vehicle.bien_so_xe}
                        </td>
                        <td className="px-6 py-4">{vehicle.ten_xe}</td>
                        <td className="px-6 py-4">{vehicle.so_cho_ngoi}</td>
                        <td className="px-6 py-4">{vehicle.so_luong_xe}</td>
                        <td className="px-6 py-4">
                          <span className="badge badge-info">{vehicle.loai_xe}</span>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(vehicle.trang_thai)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetail(vehicle)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Chi tiết"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleEdit(vehicle)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Sửa"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(vehicle.ma_phuong_tien, vehicle.bien_so_xe)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa"
                              disabled={deleteMutation.isLoading}
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
                <p className="text-sm text-gray-500">Hiển thị {vehicles.length} / {total} phương tiện</p>
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
              <p className="text-gray-500">Chưa có phương tiện nào</p>
              <button
                onClick={() => {
                  setEditingVehicle(null);
                  resetForm();
                  setShowForm(true);
                }}
                className="btn-primary mt-4"
              >
                Thêm phương tiện đầu tiên
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal - Giữ nguyên như cũ */}
      {showForm && (
        // ... (giữ nguyên form modal của bạn)
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingVehicle ? '✏️ Sửa phương tiện' : '➕ Thêm phương tiện mới'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingVehicle(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ... giữ nguyên form fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Biển số xe *</label>
                <input
                  type="text"
                  value={formData.bien_so_xe}
                  onChange={(e) => setFormData({ ...formData, bien_so_xe: e.target.value.toUpperCase() })}
                  className={`input-field ${errors.bien_so_xe ? 'border-red-500' : ''}`}
                  placeholder="51A-12345"
                  disabled={!!editingVehicle}
                />
                {errors.bien_so_xe && <p className="text-red-500 text-sm mt-1">{errors.bien_so_xe}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên xe *</label>
                <input
                  type="text"
                  value={formData.ten_xe}
                  onChange={(e) => setFormData({ ...formData, ten_xe: e.target.value })}
                  className={`input-field ${errors.ten_xe ? 'border-red-500' : ''}`}
                  placeholder="Xe khách 45 chỗ"
                />
                {errors.ten_xe && <p className="text-red-500 text-sm mt-1">{errors.ten_xe}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hãng xe</label>
                <input
                  type="text"
                  value={formData.hang_xe}
                  onChange={(e) => setFormData({ ...formData, hang_xe: e.target.value })}
                  className="input-field"
                  placeholder="Hyundai, Thaco, Mercedes..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số chỗ ngồi *</label>
                  <input
                    type="number"
                    value={formData.so_cho_ngoi}
                    onChange={(e) => setFormData({ ...formData, so_cho_ngoi: parseInt(e.target.value) || 4 })}
                    className={`input-field ${errors.so_cho_ngoi ? 'border-red-500' : ''}`}
                    min="4"
                    max="60"
                  />
                  {errors.so_cho_ngoi && <p className="text-red-500 text-sm mt-1">{errors.so_cho_ngoi}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng xe *</label>
                  <input
                    type="number"
                    value={formData.so_luong_xe}
                    onChange={(e) => setFormData({ ...formData, so_luong_xe: parseInt(e.target.value) || 1 })}
                    className={`input-field ${errors.so_luong_xe ? 'border-red-500' : ''}`}
                    min="1"
                    max="10"
                  />
                  {errors.so_luong_xe && <p className="text-red-500 text-sm mt-1">{errors.so_luong_xe}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại xe</label>
                <select
                  value={formData.loai_xe}
                  onChange={(e) => setFormData({ ...formData, loai_xe: e.target.value })}
                  className="input-field"
                >
                  {loaiXeOptions.map((loai) => (
                    <option key={loai} value={loai}>{loai}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={formData.trang_thai}
                  onChange={(e) => setFormData({ ...formData, trang_thai: e.target.value })}
                  className="input-field"
                >
                  {trangThaiOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
                <p className="font-medium">📊 Thông tin tính toán:</p>
                <p className="mt-1">
                  Số chỗ tối đa cho tour = ({formData.so_cho_ngoi} - 1) × {formData.so_luong_xe} = {' '}
                  <strong className="text-blue-800">{(formData.so_cho_ngoi - 1) * formData.so_luong_xe}</strong> chỗ
                </p>
                <p className="text-xs text-blue-500 mt-1">* Đã trừ tài xế</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={vehicleMutation.isLoading}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {vehicleMutation.isLoading ? 'Đang lưu...' : editingVehicle ? 'Cập nhật' : 'Thêm phương tiện'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingVehicle(null);
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

      {/* Detail Modal - Giữ nguyên */}
      {showDetail && selectedVehicle && (
        // ... (giữ nguyên detail modal)
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">📋 Chi tiết phương tiện</h2>
              <button
                onClick={() => {
                  setShowDetail(false);
                  setSelectedVehicle(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Biển số xe</p>
                  <p className="font-mono font-bold text-primary-500 text-lg">{selectedVehicle.bien_so_xe}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Trạng thái</p>
                  {getStatusBadge(selectedVehicle.trang_thai)}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Tên xe</p>
                <p className="font-medium">{selectedVehicle.ten_xe}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Hãng xe</p>
                <p>{selectedVehicle.hang_xe || 'Chưa cập nhật'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Số chỗ ngồi</p>
                  <p className="font-medium">{selectedVehicle.so_cho_ngoi} chỗ</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Số lượng xe</p>
                  <p className="font-medium">{selectedVehicle.so_luong_xe} xe</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Loại xe</p>
                <span className="badge badge-info">{selectedVehicle.loai_xe}</span>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>📊 Số chỗ tối đa:</strong> {(selectedVehicle.so_cho_ngoi - 1) * selectedVehicle.so_luong_xe} chỗ
                </p>
                <p className="text-xs text-blue-500">* Đã trừ {selectedVehicle.so_luong_xe} tài xế</p>
              </div>

              {selectedVehicle.dang_su_dung && (
                <div className="bg-yellow-50 rounded-lg p-3 text-sm text-yellow-700 border border-yellow-200">
                  ⚠️ Phương tiện này đang được sử dụng trong lịch khởi hành
                </div>
              )}

              <button
                onClick={() => {
                  setShowDetail(false);
                  setSelectedVehicle(null);
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

export default AdminVehicles;