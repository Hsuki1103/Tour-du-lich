import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { paymentsAPI } from '../../api/payments';
import { CreditCardIcon } from '@heroicons/react/24/outline';

const VNPayButton = ({ bookingId, amount, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);

  const mutation = useMutation(
    (data) => paymentsAPI.createVNPay(data),
    {
      onSuccess: (response) => {
        const paymentUrl = response.data.data.payment_url;
        if (paymentUrl) {
          // Open VNPay payment page
          window.location.href = paymentUrl;
        }
        if (onSuccess) onSuccess(response.data);
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Tạo thanh toán thất bại';
        if (onError) onError(message);
        alert(message);
      },
      onSettled: () => {
        setLoading(false);
      }
    }
  );

  const handlePayment = (phuong_thuc = 'full') => {
    setLoading(true);
    mutation.mutate({
      ma_don_hang: bookingId,
      phuong_thuc_thanh_toan: phuong_thuc
    });
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => handlePayment('coc')}
        disabled={loading || mutation.isLoading}
        className="w-full border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <CreditCardIcon className="w-5 h-5" />
        {loading ? 'Đang xử lý...' : `Đặt cọc 30% (${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount * 0.3)})`}
      </button>

      <button
        onClick={() => handlePayment('full')}
        disabled={loading || mutation.isLoading}
        className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <CreditCardIcon className="w-5 h-5" />
        {loading ? 'Đang xử lý...' : `Thanh toán 100% (${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)})`}
      </button>

      <p className="text-center text-sm text-gray-500">
        Bạn sẽ được chuyển đến cổng thanh toán VNPay để hoàn tất giao dịch
      </p>
    </div>
  );
};

export default VNPayButton;