import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { bookingsAPI } from '../api/bookings';
import { paymentsAPI } from '../api/payments';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/helpers';
import { CreditCardIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('coc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch booking detail
  const { data: bookingData, isLoading, refetch } = useQuery(
    ['booking-detail', bookingId],
    () => bookingsAPI.getBookingDetail(bookingId),
    { enabled: !!bookingId }
  );

  const booking = bookingData?.data?.data;

  // Create payment mutation
  const paymentMutation = useMutation(
    (data) => paymentsAPI.createVNPay(data),
    {
      onSuccess: (response) => {
        console.log('✅ Payment response:', response.data);
        const paymentUrl = response.data.data?.payment_url;
        if (paymentUrl) {
          console.log('🔗 Redirecting to:', paymentUrl);
          // Chuyển hướng đến VNPay
          window.location.href = paymentUrl;
        } else {
          setError('Không nhận được URL thanh toán từ VNPay');
          setLoading(false);
        }
      },
      onError: (error) => {
        console.error('❌ Payment error:', error);
        const message = error.response?.data?.message || 'Tạo thanh toán thất bại. Vui lòng thử lại.';
        setError(message);
        setLoading(false);
        alert(message);
      }
    }
  );

  useEffect(() => {
    // Check payment status periodically
    const interval = setInterval(async () => {
      try {
        const response = await paymentsAPI.getPaymentStatus(bookingId);
        if (response.data.data?.trang_thai === 'Đã thanh toán') {
          clearInterval(interval);
          navigate('/my-bookings');
        }
      } catch (error) {
        console.error('Check payment status error:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [bookingId, navigate]);

  const handlePayment = async () => {
    if (!booking) {
      setError('Không tìm thấy thông tin đơn hàng');
      return;
    }

    // Kiểm tra số tiền > 0
    const amount = paymentMethod === 'coc' ? booking.tien_coc : booking.tong_tien;
    if (amount <= 0) {
      setError('Số tiền thanh toán không hợp lệ');
      return;
    }

    setLoading(true);
    setError('');
    console.log('💳 Starting payment for order:', bookingId);
    console.log('📦 Payment method:', paymentMethod);
    console.log('💰 Amount:', amount);

    try {
      await paymentMutation.mutateAsync({
        ma_don_hang: parseInt(bookingId),
        phuong_thuc_thanh_toan: paymentMethod
      });
    } catch (err) {
      // Error already handled in mutation
      setLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!booking) {
    return (
      <div className="container-custom py-12 text-center">
        <p className="text-gray-500">Không tìm thấy đơn hàng</p>
        <button onClick={() => navigate('/my-bookings')} className="btn-primary mt-4">
          Quay lại
        </button>
      </div>
    );
  }

  const isPaid = booking.trang_thai_thanh_toan === 'Đã thanh toán' || 
                  booking.trang_thai_thanh_toan === 'Đã đặt cọc';

  if (isPaid) {
    return (
      <div className="container-custom py-12">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Đã thanh toán!</h2>
          <p className="text-gray-600 mb-6">Đơn hàng #{bookingId} đã được thanh toán thành công.</p>
          <button onClick={() => navigate('/my-bookings')} className="btn-primary">
            Xem đơn hàng
          </button>
        </div>
      </div>
    );
  }

  const amount = paymentMethod === 'coc' ? booking.tien_coc : booking.tong_tien;

  return (
    <div className="container-custom py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Thanh toán</h1>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Order Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Thông tin đơn hàng</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Mã đơn hàng</span>
              <span className="font-medium">#{booking.ma_don_hang}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tour</span>
              <span>{booking.lichKhoiHanh?.tour?.ten_tour}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ngày khởi hành</span>
              <span>{formatDate(booking.lichKhoiHanh?.ngay_khoi_hanh)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Khách</span>
              <span>{booking.so_luong_nguoi_lon} người lớn, {booking.so_luong_tre_em} trẻ em</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span>Tổng tiền</span>
                <span className="text-primary-500">{formatCurrency(booking.tong_tien)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tiền cọc (30%)</span>
                <span>{formatCurrency(booking.tien_coc)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Phương thức thanh toán</h2>
          <div className="space-y-3">
            <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
              paymentMethod === 'coc' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'
            }`}>
              <input
                type="radio"
                name="paymentMethod"
                value="coc"
                checked={paymentMethod === 'coc'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-3"
              />
              <div>
                <p className="font-medium">Đặt cọc 30%</p>
                <p className="text-sm text-gray-500">Thanh toán {formatCurrency(booking.tien_coc)} để giữ chỗ</p>
              </div>
            </label>
            <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
              paymentMethod === 'full' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'
            }`}>
              <input
                type="radio"
                name="paymentMethod"
                value="full"
                checked={paymentMethod === 'full'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-3"
              />
              <div>
                <p className="font-medium">Thanh toán 100%</p>
                <p className="text-sm text-gray-500">Thanh toán toàn bộ {formatCurrency(booking.tong_tien)}</p>
              </div>
            </label>
          </div>
        </div>

        {/* Payment Button */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold">Số tiền thanh toán</span>
            <span className="text-2xl font-bold text-primary-500">
              {formatCurrency(amount)}
            </span>
          </div>
          <button
            onClick={handlePayment}
            disabled={loading || paymentMutation.isLoading}
            className={`w-full py-4 text-lg font-semibold text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
              loading || paymentMutation.isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-primary-500 hover:bg-primary-600'
            }`}
          >
            {loading || paymentMutation.isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </>
            ) : (
              <>
                <CreditCardIcon className="w-5 h-5" />
                Thanh toán qua VNPay
              </>
            )}
          </button>
          <p className="text-center text-sm text-gray-500 mt-3">
            Bạn sẽ được chuyển đến cổng thanh toán VNPay để hoàn tất giao dịch
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;