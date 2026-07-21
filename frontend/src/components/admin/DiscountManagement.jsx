import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { discountsAPI } from '../../api/discounts';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  XMarkIcon,
  GiftIcon
} from '@heroicons/react/24/outline';
import DiscountForm from './DiscountForm';

const DiscountManagement = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);

  const { data, isLoading, error } = useQuery(
    ['admin-discounts', page, searchTerm],
    () => discountsAPI.getDiscounts({ 
      page, 
      limit: 10, 
      search: searchTerm || undefined 
    }),
    { keepPreviousData: true }
  );

  const discounts = data?.data?.data?.items || [];
  const total = data?.data?.data?.total || 0;
  const totalPages = data?.data?.data?.totalPages || 1;

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

  const handleDelete = (id, code) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa mã giảm giá "${code}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (discount) => {
    setEditingDiscount(discount);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries(['admin-discounts']);
    setShowForm(false);
    setEditingDiscount(null);
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Mã giảm giá</h2>
          <p className="text-gray-600">Quản lý các chương trình khuyến mãi và mã giảm giá</p>
        </div>
        <button
          onClick={() => {
            setEditingDiscount(null);
            setShowForm(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Thêm mã giảm giá
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm mã giảm giá..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Discounts Table */}
      {error ? (
        <div className="text-center py-12 text-red-500">
          Có lỗi xảy ra khi tải danh sách mã giảm giá
        </div>
      ) : discounts.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
                className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Trước
              </button>
              <span className="px-3 py-1">
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl">
          <GiftIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Chưa có mã giảm giá nào</p>
          <button
            onClick={() => {
              setEditingDiscount(null);
              setShowForm(true);
            }}
            className="btn-primary mt-4"
          >
            Thêm mã giảm giá đầu tiên
          </button>
        </div>
      )}

      {/* Discount Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingDiscount ? 'Sửa mã giảm giá' : 'Thêm mã giảm giá mới'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingDiscount(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <DiscountForm
                discount={editingDiscount}
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setShowForm(false);
                  setEditingDiscount(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountManagement;