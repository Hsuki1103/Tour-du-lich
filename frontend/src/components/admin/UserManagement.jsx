import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminAPI } from '../../api/admin';
import { formatDate } from '../../utils/helpers';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  UserPlusIcon, 
  UserMinusIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const UserManagement = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
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

  const { data, isLoading, error } = useQuery(
    ['admin-users', page, searchTerm, roleFilter],
    () => adminAPI.getUsers({ 
      page, 
      limit: 10, 
      search: searchTerm || undefined,
      role: roleFilter || undefined
    }),
    { keepPreviousData: true }
  );

  const users = data?.data?.data?.items || [];
  const total = data?.data?.data?.total || 0;
  const totalPages = data?.data?.data?.totalPages || 1;

  const createMutation = useMutation(
    (data) => adminAPI.createUser(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-users']);
        setShowForm(false);
        setFormData({ ho_ten: '', email: '', so_dien_thoai: '', mat_khau: '', vai_tro: 'Khách hàng' });
        alert('Thêm người dùng thành công!');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Thêm người dùng thất bại');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => adminAPI.updateUser(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-users']);
        setShowForm(false);
        setEditingUser(null);
        setFormData({ ho_ten: '', email: '', so_dien_thoai: '', mat_khau: '', vai_tro: 'Khách hàng' });
        alert('Cập nhật người dùng thành công!');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Cập nhật người dùng thất bại');
      }
    }
  );

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

  const roleOptions = ['Khách hàng', 'Nhân viên', 'Admin'];
  const filterRoles = ['', 'Khách hàng', 'Nhân viên', 'Admin'];

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

  const handleSubmit = (e) => {
    e.preventDefault();
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
    if (editingUser) {
      delete submitData.mat_khau;
      updateMutation.mutate({ id: editingUser.ma_nguoi_dung, data: submitData });
    } else {
      createMutation.mutate(submitData);
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
          <h2 className="text-2xl font-bold text-gray-800">Quản lý người dùng</h2>
          <p className="text-gray-600">Quản lý tài khoản và phân quyền người dùng</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({ ho_ten: '', email: '', so_dien_thoai: '', mat_khau: '', vai_tro: 'Khách hàng' });
            setShowForm(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Thêm người dùng
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input-field w-40"
        >
          {filterRoles.map((role) => (
            <option key={role} value={role}>
              {role || 'Tất cả vai trò'}
            </option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      {error ? (
        <div className="text-center py-12 text-red-500">
          Có lỗi xảy ra khi tải danh sách người dùng
        </div>
      ) : users.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
          <p className="text-gray-500">Chưa có người dùng nào</p>
        </div>
      )}

      {/* User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingUser ? 'Sửa người dùng' : 'Thêm người dùng'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingUser(null);
                    setFormData({ ho_ten: '', email: '', so_dien_thoai: '', mat_khau: '', vai_tro: 'Khách hàng' });
                    setErrors({});
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                    disabled={createMutation.isLoading || updateMutation.isLoading}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {createMutation.isLoading || updateMutation.isLoading 
                      ? 'Đang lưu...' 
                      : editingUser ? 'Cập nhật' : 'Thêm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingUser(null);
                      setFormData({ ho_ten: '', email: '', so_dien_thoai: '', mat_khau: '', vai_tro: 'Khách hàng' });
                      setErrors({});
                    }}
                    className="btn-secondary flex-1"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;