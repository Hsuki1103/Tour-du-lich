import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';

const OTPVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(180); // 3 phút
  const [canResend, setCanResend] = useState(false);
  const { verifyOTP, resendOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email || '';
  const type = location.state?.type || 'dang_ky';

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, 6);
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      const lastInput = document.getElementById('otp-5');
      if (lastInput) lastInput.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Vui lòng nhập đủ 6 chữ số');
      return;
    }

    setLoading(true);
    setError('');
    const result = await verifyOTP(email, otpCode, type);
    setLoading(false);

    if (result.success) {
      if (type === 'dang_ky') {
        navigate('/login', { state: { message: 'Đăng ký thành công! Vui lòng đăng nhập.' } });
      } else if (type === 'quen_mat_khau') {
        navigate('/reset-password', { state: { email } });
      } else {
        navigate('/profile');
      }
    } else {
      setError(result.message || 'Xác thực OTP thất bại');
    }
  };

  const handleResend = async () => {
    setLoading(true);
    const result = await resendOTP(email, type);
    setLoading(false);

    if (result.success) {
      setCountdown(180);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      setError('');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Xác thực OTP</h2>
          <p className="text-gray-600 mt-2">
            Nhập mã OTP đã được gửi đến email của bạn
          </p>
          <p className="text-sm text-gray-500 mt-1">{email}</p>
        </div>

        <div className="mb-6">
          <div className="flex justify-center gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all"
                autoFocus={index === 0}
                disabled={loading}
              />
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center mt-3">{error}</p>
          )}

          <div className="text-center mt-4">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={loading}
                className="text-primary-500 hover:text-primary-600 font-medium disabled:opacity-50"
              >
                Gửi lại mã OTP
              </button>
            ) : (
              <p className="text-gray-500 text-sm">
                Gửi lại sau: <span className="font-mono">{formatTime(countdown)}</span>
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleVerify}
          disabled={loading || otp.some(d => !d)}
          className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <LoadingSpinner size="sm" /> : 'Xác thực'}
        </button>

        <p className="text-center text-gray-600 mt-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-700"
          >
            Quay lại
          </button>
        </p>
      </div>
    </div>
  );
};

export default OTPVerification;