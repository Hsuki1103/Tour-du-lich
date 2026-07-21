import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { paymentsAPI } from '../api/payments';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const status = searchParams.get('status');
  const orderId = searchParams.get('order');
  const message = searchParams.get('message');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (orderId) {
        try {
          const response = await paymentsAPI.getPaymentStatus(orderId);
          setPaymentStatus(response.data.data);
        } catch (error) {
          console.error('Check payment status error:', error);
        }
      }
      setLoading(false);
    };

    checkPaymentStatus();
  }, [orderId]);

  if (loading) {
    return (
      <div className="container-custom py-12 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const isSuccess = status === 'success';

  return (
    <div className="container-custom py-12">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
        {isSuccess ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thành công!</h2>
            <p className="text-gray-600 mb-4">Cảm ơn bạn đã thanh toán đơn hàng.</p>
            {orderId && (
              <p className="text-sm text-gray-500 mb-6">
                Mã đơn hàng: <span className="font-medium">#{orderId}</span>
              </p>
            )}
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/my-bookings`)}
                className="w-full btn-primary"
              >
                Xem đơn hàng của tôi
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full btn-secondary"
              >
                Về trang chủ
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircleIcon className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thất bại</h2>
            <p className="text-gray-600 mb-4">
              {message || 'Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.'}
            </p>
            {orderId && (
              <p className="text-sm text-gray-500 mb-6">
                Mã đơn hàng: <span className="font-medium">#{orderId}</span>
              </p>
            )}
            <div className="space-y-3">
              {orderId && (
                <button
                  onClick={() => navigate(`/payment/${orderId}`)}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  Thử lại
                </button>
              )}
              <button
                onClick={() => navigate('/my-bookings')}
                className="w-full btn-secondary"
              >
                Xem đơn hàng
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentResultPage;