import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminAPI } from '../api/admin';
import AdminLayout from '../components/admin/AdminLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate, getStatusColor } from '../utils/helpers';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  UserMinusIcon,
  XMarkIcon,
  UserCircleIcon,
  UsersIcon,
  UserGroupIcon,
  UserIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    ho_ten: '',
    email: '',
    so_dien_thoai: '',
    mat_khau: '',
    vai_tro: 'Khách hàng',
  });
  const [errors, setErrors] = useState({});

  // Fetch users
  const { data, isLoading, error, refetch } = useQuery(
    ['admin-users', page, searchTerm],
    () => adminAPI.getUsers({ page, limit: 20, search: searchTerm }),
    { keepPreviousData: true }
  );

  const users = data?.data?.data?.items || [];
  const total = data?.data?.data?.total || 0;
  const totalPages = data?.data?.data?.totalPages || 1;

  // ⭐ THỐNG KÊ NGƯỜI DÙNG
  const stats = {
    total: users.length,
    active: users.filter(u => u.trang_thai === 'Đang hoạt động').length,
    locked: users.filter(u => u.trang_thai === 'Đã khóa').length,
    admin: users.filter(u => u.vaiTro?.ten_vai_tro === 'Admin').length,
    employee: users.filter(u => u.vaiTro?.ten_vai_tro === 'Nhân viên').length,
    customer: users.filter(u => u.vaiTro?.ten_vai_tro === 'Khách hàng').length,
  };

  // Create/Update user mutation
  const userMutation = useMutation(
    (data) => {
      if (editingUser) {
        return adminAPI.updateUser(editingUser.ma_nguoi_dung, data);
      }
      return adminAPI.createUser(data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-users']);
        setShowForm(false);
        setEditingUser(null);
        setFormData({ ho_ten: '', email: '', so_dien_thoai: '', mat_khau: '', vai_tro: 'Khách hàng' });
        alert(editingUser ? 'Cập nhật người dùng thành công!' : 'Thêm người dùng thành công!');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Lưu người dùng thất bại');
      }
    }
  );

  // Delete user mutation
  const deleteMutation = useMutation(
    (id) => adminAPI.deleteUser(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-users']);
        alert('Xóa người dùng thành công!');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Xóa người dùng thất bại');
      }
    }
  );

  // Toggle user status
  const toggleStatusMutation = useMutation(
    (id) => adminAPI.toggleUserStatus(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-users']);
        alert('Cập nhật trạng thái thành công!');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Cập nhật trạng thái thất bại');
      }
    }
  );

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      ho_ten: user.ho_ten || '',
      email: user.email || '',
      so_dien_thoai: user.so_dien_thoai || '',
      mat_khau: '',
      vai_tro: user.vaiTro?.ten_vai_tro || 'Khách hàng',
    });
    setShowForm(true);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (id) => {
    toggleStatusMutation.mutate(id);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Validation
    const newErrors = {};
    if (!formData.ho_ten) newErrors.ho_ten = 'Họ tên không được để trống';
    if (!formData.email) newErrors.email = 'Email không được để trống';
    if (!formData.so_dien_thoai) newErrors.so_dien_thoai = 'Số điện thoại không được để trống';
    if (!editingUser && !formData.mat_khau) newErrors.mat_khau = 'Mật khẩu không được để trống';
    if (formData.mat_khau && formData.mat_khau.length < 6) {
      newErrors.mat_khau = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const submitData = { ...formData };
    if (!editingUser) {
      submitData.mat_khau = formData.mat_khau;
    } else {
      delete submitData.mat_khau;
    }

    userMutation.mutate(submitData);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({ ho_ten: '', email: '', so_dien_thoai: '', mat_khau: '', vai_tro: 'Khách hàng' });
    setErrors({});
  };

  const roleOptions = ['Khách hàng', 'Nhân viên', 'Admin'];

  if (isLoading) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Quản lý người dùng</h1>
            <p className="text-gray-600">Quản lý tài khoản và phân quyền người dùng</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Thêm người dùng
          </button>
        </div>

        {/* ⭐ THỐNG KÊ NGƯỜI DÙNG */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-200">
            <div className="flex items-center justify-center mb-2">
              <UsersIcon className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-sm text-gray-500">Tổng người dùng</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-green-50 rounded-xl shadow-sm p-4 text-center border border-green-200">
            <div className="flex items-center justify-center mb-2">
              <UserCircleIcon className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-sm text-green-600">Đang hoạt động</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-red-50 rounded-xl shadow-sm p-4 text-center border border-red-200">
            <div className="flex items-center justify-center mb-2">
              <UserMinusIcon className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm text-red-600">Đã khóa</p>
            <p className="text-2xl font-bold text-red-600">{stats.locked}</p>
          </div>
          <div className="bg-purple-50 rounded-xl shadow-sm p-4 text-center border border-purple-200">
            <div className="flex items-center justify-center mb-2">
              <ShieldCheckIcon className="w-6 h-6 text-purple-500" />
            </div>
            <p className="text-sm text-purple-600">Admin</p>
            <p className="text-2xl font-bold text-purple-600">{stats.admin}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl shadow-sm p-4 text-center border border-yellow-200">
            <div className="flex items-center justify-center mb-2">
              <UserGroupIcon className="w-6 h-6 text-yellow-500" />
            </div>
            <p className="text-sm text-yellow-600">Nhân viên</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.employee}</p>
          </div>
          <div className="bg-blue-50 rounded-xl shadow-sm p-4 text-center border border-blue-200">
            <div className="flex items-center justify-center mb-2">
              <UserIcon className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-sm text-blue-600">Khách hàng</p>
            <p className="text-2xl font-bold text-blue-600">{stats.customer}</p>
          </div>
        </div>

        {/* ⭐ BỘ LỌC VAI TRÒ */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>
          <select
            value={formData.vai_tro}
            onChange={(e) => {
              // Filter by role
              const role = e.target.value;
              if (role) {
                // Set filter
              }
            }}
            className="input-field w-40"
          >
            <option value="">Tất cả vai trò</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setSearchTerm('');
              // Reset filters
            }}
            className="btn-secondary whitespace-nowrap"
          >
            Xóa bộ lọc
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {error ? (
            <div className="p-6 text-center text-red-500">
              Có lỗi xảy ra khi tải danh sách người dùng
            </div>
          ) : users.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người dùng</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SĐT</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vai trò</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.ma_nguoi_dung} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.anh_dai_dien || 'https://via.placeholder.com/40'}
                              alt={user.ho_ten}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <span className="font-medium text-gray-800">{user.ho_ten}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">{user.email}</td>
                        <td className="px-6 py-4 text-sm">{user.so_dien_thoai}</td>
                        <td className="px-6 py-4">
                          <span className={`badge ${
                            user.vaiTro?.ten_vai_tro === 'Admin' 
                              ? 'badge-danger' 
                              : user.vaiTro?.ten_vai_tro === 'Nhân viên'
                              ? 'badge-warning'
                              : 'badge-success'
                          }`}>
                            {user.vaiTro?.ten_vai_tro || 'Khách hàng'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge ${
                            user.trang_thai === 'Đang hoạt động' 
                              ? 'badge-success' 
                              : 'badge-danger'
                          }`}>
                            {user.trang_thai}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Sửa"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(user.ma_nguoi_dung)}
                              className={`p-2 ${
                                user.trang_thai === 'Đang hoạt động'
                                  ? 'text-red-600 hover:bg-red-50'
                                  : 'text-green-600 hover:bg-green-50'
                              } rounded-lg transition-colors`}
                              title={user.trang_thai === 'Đang hoạt động' ? 'Khóa' : 'Mở khóa'}
                            >
                              {user.trang_thai === 'Đang hoạt động' ? (
                                <UserMinusIcon className="w-5 h-5" />
                              ) : (
                                <UserPlusIcon className="w-5 h-5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(user.ma_nguoi_dung, user.ho_ten)}
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
                  Hiển thị {users.length} / {total} người dùng
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
              <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có người dùng nào</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary mt-4"
              >
                Thêm người dùng đầu tiên
              </button>
            </div>
          )}
        </div>

        {/* User Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {editingUser ? 'Sửa người dùng' : 'Thêm người dùng'}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
                    <input
                      type="text"
                      value={formData.ho_ten}
                      onChange={(e) => setFormData({ ...formData, ho_ten: e.target.value })}
                      className={`input-field ${errors.ho_ten ? 'border-red-500' : ''}`}
                      placeholder="Nguyễn Văn A"
                    />
                    {errors.ho_ten && <p className="text-red-500 text-sm mt-1">{errors.ho_ten}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="your@email.com"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                    <input
                      type="tel"
                      value={formData.so_dien_thoai}
                      onChange={(e) => setFormData({ ...formData, so_dien_thoai: e.target.value })}
                      className={`input-field ${errors.so_dien_thoai ? 'border-red-500' : ''}`}
                      placeholder="0912345678"
                    />
                    {errors.so_dien_thoai && <p className="text-red-500 text-sm mt-1">{errors.so_dien_thoai}</p>}
                  </div>

                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu *</label>
                      <input
                        type="password"
                        value={formData.mat_khau}
                        onChange={(e) => setFormData({ ...formData, mat_khau: e.target.value })}
                        className={`input-field ${errors.mat_khau ? 'border-red-500' : ''}`}
                        placeholder="••••••••"
                      />
                      {errors.mat_khau && <p className="text-red-500 text-sm mt-1">{errors.mat_khau}</p>}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                    <select
                      value={formData.vai_tro}
                      onChange={(e) => setFormData({ ...formData, vai_tro: e.target.value })}
                      className="input-field"
                    >
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={userMutation.isLoading}
                      className="btn-primary flex-1 disabled:opacity-50"
                    >
                      {userMutation.isLoading ? 'Đang lưu...' : editingUser ? 'Cập nhật' : 'Thêm người dùng'}
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

export default AdminUsers;