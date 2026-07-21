import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { discountsAPI } from '../api/discounts';
import AdminLayout from '../components/admin/AdminLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/helpers';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  GiftIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const AdminDiscounts = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [formData, setFormData] = useState({
    ma_code: '',
    ten_chuong_trinh: '',
    loai_giam: 'Phần trăm',
    muc_giam: '',
    giam_toi_da: '',
    so_luong: '',
    ngay_bat_dau: '',
    ngay_ket_thuc: '',
    yeu_cau_toi_thieu: 1,
  });
  const [errors, setErrors] = useState({});

  const { data, isLoading, error } = useQuery(
    ['admin-discounts', page, searchTerm],
    () => discountsAPI.getDiscounts({ page, limit: 20, search: searchTerm }),
    { keepPreviousData: true }
  );

  const discounts = data?.data?.data?.items || [];
  const total = data?.data?.data?.total || 0;
  const totalPages = data?.data?.data?.totalPages || 1;

  // Create/Update discount mutation
  const discountMutation = useMutation(
    (data) => {
      if (editingDiscount) {
        return discountsAPI.updateDiscount(editingDiscount.ma_giam_gia, data);
      }
      return discountsAPI.createDiscount(data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-discounts']);
        queryClient.invalidateQueries(['discounts']);
        setShowForm(false);
        setEditingDiscount(null);
        setFormData({
          ma_code: '',
          ten_chuong_trinh: '',
          loai_giam: 'Phần trăm',
          muc_giam: '',
          giam_toi_da: '',
          so_luong: '',
          ngay_bat_dau: '',
          ngay_ket_thuc: '',
          yeu_cau_toi_thieu: 1,
        });
        alert(editingDiscount ? 'Cập nhật mã giảm giá thành công!' : 'Thêm mã giảm giá thành công!');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Lưu mã giảm giá thất bại');
      }
    }
  );

  // Delete discount mutation
  const deleteMutation = useMutation(
    (id) => discountsAPI.deleteDiscount(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-discounts']);
        alert('Xóa mã giảm giá thành công!');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Xóa mã giảm giá thất bại');
      }
    }
  );

  const handleEdit = (discount) => {
    setEditingDiscount(discount);
    setFormData({
      ma_code: discount.ma_code || '',
      ten_chuong_trinh: discount.ten_chuong_trinh || '',
      loai_giam: discount.loai_giam || 'Phần trăm',
      muc_giam: discount.muc_giam || '',
      giam_toi_da: discount.giam_toi_da || '',
      so_luong: discount.so_luong || '',
      ngay_bat_dau: discount.ngay_bat_dau || '',
      ngay_ket_thuc: discount.ngay_ket_thuc || '',
      yeu_cau_toi_thieu: discount.yeu_cau_toi_thieu || 1,
    });
    setShowForm(true);
  };

  const handleDelete = (id, code) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa mã giảm giá "${code}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.ma_code) newErrors.ma_code = 'Mã code không được để trống';
    if (!formData.ten_chuong_trinh) newErrors.ten_chuong_trinh = 'Tên chương trình không được để trống';
    if (!formData.muc_giam) newErrors.muc_giam = 'Mức giảm không được để trống';
    if (formData.muc_giam && (parseFloat(formData.muc_giam) < 0 || parseFloat(formData.muc_giam) > 100)) {
      newErrors.muc_giam = 'Mức giảm phải từ 0 đến 100';
    }
    if (!formData.so_luong) newErrors.so_luong = 'Số lượng không được để trống';
    if (formData.so_luong && parseInt(formData.so_luong) < 1) {
      newErrors.so_luong = 'Số lượng phải lớn hơn 0';
    }
    if (!formData.ngay_bat_dau) newErrors.ngay_bat_dau = 'Ngày bắt đầu không được để trống';
    if (!formData.ngay_ket_thuc) newErrors.ngay_ket_thuc = 'Ngày kết thúc không được để trống';
    if (formData.ngay_bat_dau && formData.ngay_ket_thuc && 
        new Date(formData.ngay_bat_dau) > new Date(formData.ngay_ket_thuc)) {
      newErrors.ngay_ket_thuc = 'Ngày kết thúc phải sau ngày bắt đầu';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const submitData = {
      ...formData,
      muc_giam: parseFloat(formData.muc_giam),
      so_luong: parseInt(formData.so_luong),
      yeu_cau_toi_thieu: parseInt(formData.yeu_cau_toi_thieu),
    };

    discountMutation.mutate(submitData);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingDiscount(null);
    setFormData({
      ma_code: '',
      ten_chuong_trinh: '',
      loai_giam: 'Phần trăm',
      muc_giam: '',
      giam_toi_da: '',
      so_luong: '',
      ngay_bat_dau: '',
      ngay_ket_thuc: '',
      yeu_cau_toi_thieu: 1,
    });
    setErrors({});
  };

  const getStatusBadge = (discount) => {
    const now = new Date();
    const start = new Date(discount.ngay_bat_dau);
    const end = new Date(discount.ngay_ket_thuc);
    const isActive = discount.trang_thai === 'Đang hoạt động' && now >= start && now <= end;

    if (isActive) {
      return <span className="badge badge-success">Đang hoạt động</span>;
    } else if (discount.so_luong_da_dung >= discount.so_luong) {
      return <span className="badge badge-danger">Đã hết</span>;
    } else if (now > end) {
      return <span className="badge badge-warning">Hết hạn</span>;
    } else {
      return <span className="badge badge-warning">Sắp diễn ra</span>;
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Mã giảm giá</h1>
            <p className="text-gray-600">Quản lý các chương trình khuyến mãi và mã giảm giá</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Thêm mã giảm giá
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm mã giảm giá..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field max-w-md"
          />
        </div>

        {/* Discounts Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {error ? (
            <div className="p-6 text-center text-red-500">
              Có lỗi xảy ra khi tải danh sách mã giảm giá
            </div>
          ) : discounts.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chương trình</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giảm</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {discounts.map((discount) => (
                      <tr key={discount.ma_giam_gia} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-primary-500">{discount.ma_code}</span>
                        </td>
                        <td className="px-6 py-4">{discount.ten_chuong_trinh}</td>
                        <td className="px-6 py-4">
                          {discount.loai_giam === 'Phần trăm' 
                            ? `${discount.muc_giam}%` 
                            : formatCurrency(discount.muc_giam)}
                          {discount.giam_toi_da && (
                            <span className="text-xs text-gray-500 block">
                              Tối đa {formatCurrency(discount.giam_toi_da)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {discount.so_luong_da_dung}/{discount.so_luong}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div>{formatDate(discount.ngay_bat_dau)}</div>
                          <div className="text-gray-500">→ {formatDate(discount.ngay_ket_thuc)}</div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(discount)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(discount)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Sửa"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(discount.ma_giam_gia, discount.ma_code)}
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
                <p className="text-sm text-gray-500">
                  Hiển thị {discounts.length} / {total} mã giảm giá
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded-lg disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <span className="px-3 py-1">
                    Trang {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border rounded-lg disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <GiftIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có mã giảm giá nào</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary mt-4"
              >
                Thêm mã giảm giá đầu tiên
              </button>
            </div>
          )}
        </div>

        {/* Discount Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {editingDiscount ? 'Sửa mã giảm giá' : 'Thêm mã giảm giá mới'}
                  </h2>
                  <button
                    onClick={handleFormClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã code *</label>
                    <input
                      type="text"
                      value={formData.ma_code}
                      onChange={(e) => setFormData({ ...formData, ma_code: e.target.value.toUpperCase() })}
                      className={`input-field ${errors.ma_code ? 'border-red-500' : ''}`}
                      placeholder="SUMMER2024"
                      disabled={!!editingDiscount}
                    />
                    {errors.ma_code && <p className="text-red-500 text-sm mt-1">{errors.ma_code}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên chương trình *</label>
                    <input
                      type="text"
                      value={formData.ten_chuong_trinh}
                      onChange={(e) => setFormData({ ...formData, ten_chuong_trinh: e.target.value })}
                      className={`input-field ${errors.ten_chuong_trinh ? 'border-red-500' : ''}`}
                      placeholder="Khuyến mãi mùa hè 2024"
                    />
                    {errors.ten_chuong_trinh && <p className="text-red-500 text-sm mt-1">{errors.ten_chuong_trinh}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm</label>
                    <select
                      value={formData.loai_giam}
                      onChange={(e) => setFormData({ ...formData, loai_giam: e.target.value })}
                      className="input-field"
                    >
                      <option value="Phần trăm">Phần trăm (%)</option>
                      <option value="Số tiền">Số tiền</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mức giảm *</label>
                    <input
                      type="number"
                      value={formData.muc_giam}
                      onChange={(e) => setFormData({ ...formData, muc_giam: e.target.value })}
                      className={`input-field ${errors.muc_giam ? 'border-red-500' : ''}`}
                      placeholder={formData.loai_giam === 'Phần trăm' ? '10' : '100000'}
                    />
                    {errors.muc_giam && <p className="text-red-500 text-sm mt-1">{errors.muc_giam}</p>}
                    {formData.loai_giam === 'Phần trăm' && (
                      <p className="text-xs text-gray-500 mt-1">Nhập số từ 0-100</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giảm tối đa (không bắt buộc)</label>
                    <input
                      type="number"
                      value={formData.giam_toi_da}
                      onChange={(e) => setFormData({ ...formData, giam_toi_da: e.target.value })}
                      className="input-field"
                      placeholder="500000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng *</label>
                    <input
                      type="number"
                      value={formData.so_luong}
                      onChange={(e) => setFormData({ ...formData, so_luong: e.target.value })}
                      className={`input-field ${errors.so_luong ? 'border-red-500' : ''}`}
                      placeholder="100"
                    />
                    {errors.so_luong && <p className="text-red-500 text-sm mt-1">{errors.so_luong}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Yêu cầu tối thiểu (số khách)</label>
                    <input
                      type="number"
                      value={formData.yeu_cau_toi_thieu}
                      onChange={(e) => setFormData({ ...formData, yeu_cau_toi_thieu: e.target.value })}
                      className="input-field"
                      min="1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu *</label>
                      <input
                        type="date"
                        value={formData.ngay_bat_dau}
                        onChange={(e) => setFormData({ ...formData, ngay_bat_dau: e.target.value })}
                        className={`input-field ${errors.ngay_bat_dau ? 'border-red-500' : ''}`}
                      />
                      {errors.ngay_bat_dau && <p className="text-red-500 text-sm mt-1">{errors.ngay_bat_dau}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc *</label>
                      <input
                        type="date"
                        value={formData.ngay_ket_thuc}
                        onChange={(e) => setFormData({ ...formData, ngay_ket_thuc: e.target.value })}
                        className={`input-field ${errors.ngay_ket_thuc ? 'border-red-500' : ''}`}
                      />
                      {errors.ngay_ket_thuc && <p className="text-red-500 text-sm mt-1">{errors.ngay_ket_thuc}</p>}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={discountMutation.isLoading}
                      className="btn-primary flex-1 disabled:opacity-50"
                    >
                      {discountMutation.isLoading ? 'Đang lưu...' : editingDiscount ? 'Cập nhật' : 'Thêm mã'}
                    </button>
                    <button type="button" onClick={handleFormClose} className="btn-secondary flex-1">
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDiscounts;