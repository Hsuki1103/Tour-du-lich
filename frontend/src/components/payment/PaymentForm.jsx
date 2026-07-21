import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { paymentsAPI } from '../../api/payments';
import { formatCurrency } from '../../utils/helpers';
import { CreditCardIcon, BanknotesIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const PaymentForm = ({ bookingId, totalAmount, depositAmount, onSuccess, onError }) => {
  const [paymentMethod, setPaymentMethod] = useState('coc');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const mutation = useMutation(
    (data) => paymentsAPI.createVNPay(data),
    {
      onSuccess: (response) => {
        const paymentUrl = response.data.data.payment_url;
        if (paymentUrl) {
          // Open VNPay payment page in new window
          window.open(paymentUrl, '_blank');
        }
        if (onSuccess) onSuccess(response.data);
        setLoading(false);
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Tạo thanh toán thất bại';
        if (onError) onError(message);
        alert(message);
        setLoading(false);
      }
    }
  );

  const handlePayment = () => {
    setLoading(true);
    const amount = paymentMethod === 'coc' ? depositAmount : totalAmount;
    
    mutation.mutate({
      ma_don_hang: bookingId,
      phuong_thuc_thanh_toan: paymentMethod,
      so_tien: amount
    });
  };

  const paymentOptions = [
    {
      id: 'coc',
      label: 'Đặt cọc 30%',
      description: `Thanh toán ${formatCurrency(depositAmount)} để giữ chỗ`,
      amount: depositAmount,
      icon: BanknotesIcon
    },
    {
      id: 'full',
      label: 'Thanh toán 100%',
      description: `Thanh toán toàn bộ ${formatCurrency(totalAmount)}`,
      amount: totalAmount,
      icon: CreditCardIcon
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Chọn phương thức thanh toán
        </h3>
        
        <div className="space-y-3">
          {paymentOptions.map((option) => (
            <label
              key={option.id}
              className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                paymentMethod === option.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={option.id}
                checked={paymentMethod === option.id}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{option.label}</p>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                  <span className="font-bold text-primary-500">
                    {formatCurrency(option.amount)}
                  </span>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
        <ShieldCheckIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-green-800">Thanh toán an toàn</p>
          <p className="text-sm text-green-600">
            Giao dịch được bảo mật bởi VNPay. Thông tin thanh toán của bạn được mã hóa.
          </p>
        </div>
      </div>

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={loading || mutation.isLoading}
        className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading || mutation.isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            Đang xử lý...
          </div>
        ) : (
          <>
            <CreditCardIcon className="w-6 h-6" />
            Thanh toán {paymentMethod === 'coc' ? 'cọc' : '100%'}
          </>
        )}
      </button>

      <p className="text-center text-sm text-gray-500">
        Bạn sẽ được chuyển đến cổng thanh toán VNPay để hoàn tất giao dịch
      </p>
    </div>
  );
};

export default PaymentForm;