import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const ChangePassword = () => {
  const { changePassword } = useAuth();
  const [formData, setFormData] = useState({
    mat_khau_cu: '',
    mat_khau_moi: '',
    xac_nhan_mat_khau_moi: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.mat_khau_cu) newErrors.mat_khau_cu = 'Vui lòng nhập mật khẩu cũ';
    if (!formData.mat_khau_moi) newErrors.mat_khau_moi = 'Vui lòng nhập mật khẩu mới';
    if (formData.mat_khau_moi && formData.mat_khau_moi.length < 6) {
      newErrors.mat_khau_moi = 'Mật khẩu mới phải có ít nhất 6 ký tự';
    }
    if (formData.mat_khau_moi !== formData.xac_nhan_mat_khau_moi) {
      newErrors.xac_nhan_mat_khau_moi = 'Mật khẩu xác nhận không khớp';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const result = await changePassword(formData);
    setLoading(false);

    if (result.success) {
      setFormData({
        mat_khau_cu: '',
        mat_khau_moi: '',
        xac_nhan_mat_khau_moi: '',
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Đổi mật khẩu</h2>

      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mật khẩu hiện tại
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.mat_khau_cu}
              onChange={(e) => setFormData({ ...formData, mat_khau_cu: e.target.value })}
              className={`input-field ${errors.mat_khau_cu ? 'border-red-500' : ''}`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
          {errors.mat_khau_cu && (
            <p className="text-red-500 text-sm mt-1">{errors.mat_khau_cu}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mật khẩu mới
          </label>
          <input
            type="password"
            value={formData.mat_khau_moi}
            onChange={(e) => setFormData({ ...formData, mat_khau_moi: e.target.value })}
            className={`input-field ${errors.mat_khau_moi ? 'border-red-500' : ''}`}
            placeholder="••••••••"
          />
          {errors.mat_khau_moi && (
            <p className="text-red-500 text-sm mt-1">{errors.mat_khau_moi}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Xác nhận mật khẩu mới
          </label>
          <input
            type="password"
            value={formData.xac_nhan_mat_khau_moi}
            onChange={(e) => setFormData({ ...formData, xac_nhan_mat_khau_moi: e.target.value })}
            className={`input-field ${errors.xac_nhan_mat_khau_moi ? 'border-red-500' : ''}`}
            placeholder="••••••••"
          />
          {errors.xac_nhan_mat_khau_moi && (
            <p className="text-red-500 text-sm mt-1">{errors.xac_nhan_mat_khau_moi}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;