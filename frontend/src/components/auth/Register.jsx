import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Register = () => {
  const [formData, setFormData] = useState({
    ho_ten: '',
    email: '',
    so_dien_thoai: '',
    mat_khau: '',
    xac_nhan_mat_khau: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!formData.ho_ten) newErrors.ho_ten = 'Vui lòng nhập họ tên';
    if (!formData.email) newErrors.email = 'Vui lòng nhập email';
    if (!formData.so_dien_thoai) newErrors.so_dien_thoai = 'Vui lòng nhập số điện thoại';
    if (formData.so_dien_thoai && !/^[0-9]{10,11}$/.test(formData.so_dien_thoai)) {
      newErrors.so_dien_thoai = 'Số điện thoại không hợp lệ';
    }
    if (!formData.mat_khau) newErrors.mat_khau = 'Vui lòng nhập mật khẩu';
    if (formData.mat_khau && formData.mat_khau.length < 6) {
      newErrors.mat_khau = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    if (formData.mat_khau !== formData.xac_nhan_mat_khau) {
      newErrors.xac_nhan_mat_khau = 'Mật khẩu xác nhận không khớp';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user types
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const result = await register(formData);
    setLoading(false);

    if (result.success) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Đăng ký</h2>
          <p className="text-gray-600 mt-2">Tạo tài khoản để bắt đầu đặt tour</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ tên
            </label>
            <input
              type="text"
              name="ho_ten"
              value={formData.ho_ten}
              onChange={handleChange}
              className={`input-field ${errors.ho_ten ? 'border-red-500' : ''}`}
              placeholder="Nguyễn Văn A"
            />
            {errors.ho_ten && (
              <p className="text-red-500 text-sm mt-1">{errors.ho_ten}</p>
            )}
          </div>

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
              Số điện thoại
            </label>
            <input
              type="tel"
              name="so_dien_thoai"
              value={formData.so_dien_thoai}
              onChange={handleChange}
              className={`input-field ${errors.so_dien_thoai ? 'border-red-500' : ''}`}
              placeholder="0912345678"
            />
            {errors.so_dien_thoai && (
              <p className="text-red-500 text-sm mt-1">{errors.so_dien_thoai}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="mat_khau"
                value={formData.mat_khau}
                onChange={handleChange}
                className={`input-field ${errors.mat_khau ? 'border-red-500' : ''}`}
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
            {errors.mat_khau && (
              <p className="text-red-500 text-sm mt-1">{errors.mat_khau}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              name="xac_nhan_mat_khau"
              value={formData.xac_nhan_mat_khau}
              onChange={handleChange}
              className={`input-field ${errors.xac_nhan_mat_khau ? 'border-red-500' : ''}`}
              placeholder="••••••••"
            />
            {errors.xac_nhan_mat_khau && (
              <p className="text-red-500 text-sm mt-1">{errors.xac_nhan_mat_khau}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;