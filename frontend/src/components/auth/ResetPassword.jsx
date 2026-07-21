import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    email: '',
    otp_code: '',
    mat_khau_moi: '',
    xac_nhan_mat_khau_moi: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Vui lòng nhập email';
    if (!formData.otp_code) newErrors.otp_code = 'Vui lòng nhập mã OTP';
    if (formData.otp_code && !/^[0-9]{6}$/.test(formData.otp_code)) {
      newErrors.otp_code = 'Mã OTP phải là 6 chữ số';
    }
    if (!formData.mat_khau_moi) newErrors.mat_khau_moi = 'Vui lòng nhập mật khẩu mới';
    if (formData.mat_khau_moi && formData.mat_khau_moi.length < 6) {
      newErrors.mat_khau_moi = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    if (formData.mat_khau_moi !== formData.xac_nhan_mat_khau_moi) {
      newErrors.xac_nhan_mat_khau_moi = 'Mật khẩu xác nhận không khớp';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const result = await resetPassword(formData);
    setLoading(false);

    if (result.success) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Đặt lại mật khẩu</h2>
          <p className="text-gray-600 mt-2">Nhập mã OTP và tạo mật khẩu mới</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`input-field ${errors.email ? 'border-red-500' : ''}`}
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mã OTP
            </label>
            <input
              type="text"
              name="otp_code"
              value={formData.otp_code}
              onChange={handleChange}
              className={`input-field ${errors.otp_code ? 'border-red-500' : ''}`}
              placeholder="Nhập mã 6 chữ số"
              maxLength={6}
            />
            {errors.otp_code && (
              <p className="text-red-500 text-sm mt-1">{errors.otp_code}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="mat_khau_moi"
                value={formData.mat_khau_moi}
                onChange={handleChange}
                className={`input-field ${errors.mat_khau_moi ? 'border-red-500' : ''}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
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
              name="xac_nhan_mat_khau_moi"
              value={formData.xac_nhan_mat_khau_moi}
              onChange={handleChange}
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
            className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;