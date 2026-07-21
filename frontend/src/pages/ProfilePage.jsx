import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMutation, useQueryClient } from 'react-query';
import { authAPI } from '../api/auth';
import ChangePassword from '../components/user/ChangePassword';
import BookingHistory from '../components/user/BookingHistory';
import { UserCircleIcon, CameraIcon } from '@heroicons/react/24/outline';

const ProfilePage = () => {
  const { user, loadUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    ho_ten: user?.ho_ten || '',
    so_dien_thoai: user?.so_dien_thoai || '',
    ngay_sinh: user?.ngay_sinh || '',
    gioi_tinh: user?.gioi_tinh || '',
    dia_chi: user?.dia_chi || '',
    so_cccd: user?.so_cccd || '',
  });
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  const updateMutation = useMutation(
    (data) => authAPI.updateProfile(data),
    {
      onSuccess: () => {
        loadUser();
        setIsEditing(false);
        alert('Cập nhật thông tin thành công!');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Cập nhật thất bại');
      }
    }
  );

  const avatarMutation = useMutation(
    (file) => authAPI.uploadAvatar(file),
    {
      onSuccess: () => {
        loadUser();
        alert('Cập nhật ảnh đại diện thành công!');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Cập nhật ảnh thất bại');
      },
      onSettled: () => {
        setUploading(false);
      }
    }
  );

  const handleUpdate = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      avatarMutation.mutate(file);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Thông tin cá nhân' },
    { id: 'password', label: 'Đổi mật khẩu' },
    { id: 'bookings', label: 'Lịch sử đặt tour' },
  ];

  return (
    <div className="container-custom py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="relative inline-block">
              <img
                src={user?.anh_dai_dien || 'https://via.placeholder.com/150'}
                alt="Avatar"
                className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-primary-500"
              />
              <label className="absolute bottom-0 right-0 bg-primary-500 text-white p-2 rounded-full cursor-pointer hover:bg-primary-600 transition-colors">
                <CameraIcon className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mt-4">{user?.ho_ten}</h3>
            <p className="text-gray-500 text-sm">{user?.vaiTro?.ten_vai_tro}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 mt-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-500 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Thông tin cá nhân</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-primary"
                  >
                    Chỉnh sửa
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                      <input
                        type="text"
                        value={formData.ho_ten}
                        onChange={(e) => setFormData({ ...formData, ho_ten: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                      <input
                        type="tel"
                        value={formData.so_dien_thoai}
                        onChange={(e) => setFormData({ ...formData, so_dien_thoai: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                      <input
                        type="date"
                        value={formData.ngay_sinh}
                        onChange={(e) => setFormData({ ...formData, ngay_sinh: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                      <select
                        value={formData.gioi_tinh}
                        onChange={(e) => setFormData({ ...formData, gioi_tinh: e.target.value })}
                        className="input-field"
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                      <input
                        type="text"
                        value={formData.dia_chi}
                        onChange={(e) => setFormData({ ...formData, dia_chi: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số CCCD/Hộ chiếu</label>
                      <input
                        type="text"
                        value={formData.so_cccd}
                        onChange={(e) => setFormData({ ...formData, so_cccd: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={updateMutation.isLoading}
                      className="btn-primary disabled:opacity-50"
                    >
                      {updateMutation.isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          ho_ten: user?.ho_ten || '',
                          so_dien_thoai: user?.so_dien_thoai || '',
                          ngay_sinh: user?.ngay_sinh || '',
                          gioi_tinh: user?.gioi_tinh || '',
                          dia_chi: user?.dia_chi || '',
                          so_cccd: user?.so_cccd || '',
                        });
                      }}
                      className="btn-secondary"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Họ tên</p>
                      <p className="font-medium">{user?.ho_ten}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Số điện thoại</p>
                      <p className="font-medium">{user?.so_dien_thoai}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ngày sinh</p>
                      <p className="font-medium">{user?.ngay_sinh || 'Chưa cập nhật'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Giới tính</p>
                      <p className="font-medium">{user?.gioi_tinh || 'Chưa cập nhật'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Địa chỉ</p>
                      <p className="font-medium">{user?.dia_chi || 'Chưa cập nhật'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Số CCCD/Hộ chiếu</p>
                      <p className="font-medium">{user?.so_cccd || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'password' && (
            <ChangePassword />
          )}

          {activeTab === 'bookings' && (
            <BookingHistory />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;