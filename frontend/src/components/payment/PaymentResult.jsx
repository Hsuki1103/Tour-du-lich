import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '../../utils/helpers';

const PaymentResult = ({ status, orderId, amount, message, onRetry }) => {
  const navigate = useNavigate();
  const isSuccess = status === 'success';

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
      <div className="text-center">
        {/* Icon */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
          isSuccess ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {isSuccess ? (
            <CheckCircleIcon className="w-12 h-12 text-green-500" />
          ) : (
            <XCircleIcon className="w-12 h-12 text-red-500" />
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
        </h2>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          {message || (isSuccess 
            ? 'Cảm ơn bạn đã thanh toán đơn hàng.' 
            : 'Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.'
          )}
        </p>

        {/* Order Details */}
        {orderId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex justify-between text-sm py-1">
              <span className="text-gray-500">Mã đơn hàng</span>
              <span className="font-medium">#{orderId}</span>
            </div>
            {amount && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-gray-500">Số tiền</span>
                <span className="font-bold text-primary-500">{formatCurrency(amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm py-1">
              <span className="text-gray-500">Thời gian</span>
              <span className="font-medium">{formatDate(new Date())}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {!isSuccess && onRetry && (
            <button
              onClick={onRetry}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Thử lại
            </button>
          )}

          {isSuccess && (
            <button
              onClick={() => navigate('/my-bookings')}
              className="w-full btn-primary"
            >
              Xem đơn hàng của tôi
            </button>
          )}

          <button
            onClick={() => navigate('/')}
            className="w-full btn-secondary flex items-center justify-center gap-2"
          >
            <HomeIcon className="w-5 h-5" />
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;