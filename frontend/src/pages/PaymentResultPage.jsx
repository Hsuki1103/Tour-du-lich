import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { paymentsAPI } from '../api/payments';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/helpers';
import { toast } from 'react-toastify';

const PaymentResultPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [orderId, setOrderId] = useState(null);
    const [showToast, setShowToast] = useState(false);

    const status = searchParams.get('status');
    const orderIdParam = searchParams.get('order');
    const messageParam = searchParams.get('message');

    useEffect(() => {
        const checkPaymentStatus = async () => {
            if (orderIdParam) {
                try {
                    setOrderId(orderIdParam);
                    console.log('📊 Checking payment status for order:', orderIdParam);
                    
                    const response = await paymentsAPI.getPaymentStatus(orderIdParam);
                    console.log('📊 Payment status response:', response.data);
                    
                    setPaymentStatus(response.data.data);
                    
                    // ⭐ HIỂN THỊ THÔNG BÁO THÀNH CÔNG
                    if (status === 'success' && response.data.data.trang_thai_thanh_toan !== 'Chưa thanh toán') {
                        setShowToast(true);
                        toast.success('🎉 Thanh toán thành công!', {
                            position: 'top-right',
                            autoClose: 5000,
                        });
                    }
                } catch (error) {
                    console.error('❌ Check payment status error:', error);
                }
            }
            setLoading(false);
        };

        checkPaymentStatus();
    }, [orderIdParam, status]);

    if (loading) {
        return (
            <div className="container-custom py-12 flex justify-center">
                <LoadingSpinner />
                <p className="text-gray-500 mt-4">Đang kiểm tra thanh toán...</p>
            </div>
        );
    }

    const isSuccess = status === 'success' && 
                      paymentStatus && 
                      paymentStatus.trang_thai_thanh_toan !== 'Chưa thanh toán';

    return (
        <div className="container-custom py-12">
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
                        {isSuccess ? '🎉 Thanh toán thành công!' : '❌ Thanh toán thất bại'}
                    </h2>

                    {/* Message */}
                    <p className="text-gray-600 mb-4">
                        {isSuccess 
                            ? 'Cảm ơn bạn đã thanh toán đơn hàng. Đơn hàng của bạn đã được xác nhận.'
                            : messageParam || 'Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.'
                        }
                    </p>

                    {/* Order Details */}
                    {orderId && paymentStatus && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                            <div className="flex justify-between text-sm py-1">
                                <span className="text-gray-500">Mã đơn hàng</span>
                                <span className="font-medium">#{orderId}</span>
                            </div>
                            <div className="flex justify-between text-sm py-1">
                                <span className="text-gray-500">Trạng thái đơn hàng</span>
                                <span className={`badge ${
                                    paymentStatus.trang_thai_don_hang === 'Đã hủy' 
                                        ? 'badge-danger' 
                                        : paymentStatus.trang_thai_don_hang === 'Đã hoàn thành'
                                        ? 'badge-success'
                                        : 'badge-warning'
                                }`}>
                                    {paymentStatus.trang_thai_don_hang}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm py-1">
                                <span className="text-gray-500">Trạng thái thanh toán</span>
                                <span className={`badge ${
                                    paymentStatus.trang_thai_thanh_toan === 'Đã thanh toán' 
                                        ? 'badge-success' 
                                        : paymentStatus.trang_thai_thanh_toan === 'Đã đặt cọc'
                                        ? 'badge-primary'
                                        : 'badge-warning'
                                }`}>
                                    {paymentStatus.trang_thai_thanh_toan}
                                </span>
                            </div>
                            <div className="border-t mt-2 pt-2 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Tổng tiền</span>
                                    <span className="font-bold text-primary-500">
                                        {formatCurrency(paymentStatus.tong_tien)}
                                    </span>
                                </div>
                                {paymentStatus.tien_coc > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Tiền cọc (30%)</span>
                                        <span>{formatCurrency(paymentStatus.tien_coc)}</span>
                                    </div>
                                )}
                                {paymentStatus.tien_con_lai > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Tiền còn lại</span>
                                        <span>{formatCurrency(paymentStatus.tien_con_lai)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3">
                        {!isSuccess && (
                            <button
                                onClick={() => orderId ? navigate(`/payment/${orderId}`) : navigate('/')}
                                className="w-full btn-primary flex items-center justify-center gap-2"
                            >
                                <ArrowPathIcon className="w-5 h-5" />
                                Thử lại
                            </button>
                        )}

                        {isSuccess && (
                            <div className="space-y-3">
                                <Link
                                    to="/my-bookings"
                                    className="block w-full btn-primary text-center"
                                >
                                    📋 Xem đơn hàng của tôi
                                </Link>
                                {orderId && (
                                    <Link
                                        to={`/my-bookings/${orderId}`}
                                        className="block w-full btn-secondary text-center"
                                    >
                                        📄 Xem chi tiết đơn hàng
                                    </Link>
                                )}
                            </div>
                        )}

                        <Link
                            to="/"
                            className="block w-full btn-secondary text-center"
                        >
                            🏠 Về trang chủ
                        </Link>
                    </div>

                    {/* ⭐ HƯỚNG DẪN CHO KHÁCH HÀNG */}
                    {isSuccess && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-left text-sm text-blue-700">
                            <p className="font-medium mb-1">📌 Lưu ý:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Vé điện tử sẽ được gửi đến email của bạn</li>
                                <li>Vui lòng kiểm tra email để tải vé</li>
                                <li>Mang theo CMND/CCCD khi tham gia tour</li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentResultPage;