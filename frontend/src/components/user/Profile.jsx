import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import ChangePassword from './ChangePassword';
import BookingHistory from './BookingHistory';
import { CameraIcon, PencilIcon } from '@heroicons/react/24/outline';

const Profile = () => {
  const { user, updateProfile, uploadAvatar } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    ho_ten: user?.ho_ten || '',
    so_dien_thoai: user?.so_dien_thoai || '',
    ngay_sinh: user?.ngay_sinh || '',
    gioi_tinh: user?.gioi_tinh || '',
    dia_chi: user?.dia_chi || '',
    so_cccd: user?.so_cccd || '',
  });
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateProfile(formData);
    setLoading(false);
    if (result.success) {
      setIsEditing(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      await uploadAvatar(file);
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Avatar Section */}
        <div className="bg-primary-50 p-6 text-center">
          <div className="relative inline-block">
            <img
              src={user.anh_dai_dien || 'https://via.placeholder.com/120'}
              alt={user.ho_ten}
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <label className="absolute bottom-0 right-0 bg-primary-500 text-white p-2 rounded-full cursor-pointer hover:bg-primary-600 transition-colors">
              <CameraIcon className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={loading}
              />
            </label>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mt-4">{user.ho_ten}</h2>
          <p className="text-gray-500">{user.vaiTro?.ten_vai_tro}</p>
          <p className="text-gray-500 text-sm">{user.email}</p>
        </div>

        {/* Profile Info */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Thông tin cá nhân</h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary flex items-center gap-2"
              >
                <PencilIcon className="w-4 h-4" />
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
                  disabled={loading}
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      ho_ten: user.ho_ten || '',
                      so_dien_thoai: user.so_dien_thoai || '',
                      ngay_sinh: user.ngay_sinh || '',
                      gioi_tinh: user.gioi_tinh || '',
                      dia_chi: user.dia_chi || '',
                      so_cccd: user.so_cccd || '',
                    });
                  }}
                  className="btn-secondary"
                >
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Họ tên</p>
                <p className="font-medium">{user.ho_ten}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Số điện thoại</p>
                <p className="font-medium">{user.so_dien_thoai}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ngày sinh</p>
                <p className="font-medium">{user.ngay_sinh || 'Chưa cập nhật'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Giới tính</p>
                <p className="font-medium">{user.gioi_tinh || 'Chưa cập nhật'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Địa chỉ</p>
                <p className="font-medium">{user.dia_chi || 'Chưa cập nhật'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Số CCCD/Hộ chiếu</p>
                <p className="font-medium">{user.so_cccd || 'Chưa cập nhật'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="p-6 border-t">
          <ChangePassword />
        </div>

        {/* Booking History */}
        <div className="p-6 border-t">
          <BookingHistory />
        </div>
      </div>
    </div>
  );
};

export default Profile;