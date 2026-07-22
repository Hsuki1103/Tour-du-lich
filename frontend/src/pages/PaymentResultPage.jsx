import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon, HomeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { paymentsAPI } from '../api/payments';
import { bookingsAPI } from '../api/bookings';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDateTime } from '../utils/helpers';
import { toast } from 'react-toastify';

const PaymentResultPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [orderId, setOrderId] = useState(null);
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [downloading, setDownloading] = useState(false);

    // ⭐ LẤY PARAMETERS TỪ URL
    const status = searchParams.get('status');
    const orderIdParam = searchParams.get('order');
    const codeParam = searchParams.get('code');
    const messageParam = searchParams.get('message');

    useEffect(() => {
        console.log('🔍 SearchParams:', searchParams.toString());
        console.log('📌 status:', status);
        console.log('📌 order:', orderIdParam);

        const checkPaymentStatus = async () => {
            if (orderIdParam) {
                try {
                    setOrderId(orderIdParam);
                    console.log('📊 Checking payment status for order:', orderIdParam);
                    
                    // ⭐ GỌI API BACKEND KIỂM TRA TRẠNG THÁI
                    const response = await paymentsAPI.getPaymentStatus(orderIdParam);
                    console.log('📊 Payment status response:', response.data);
                    
                    const data = response.data.data;
                    setPaymentStatus(data);
                    
                    // ⭐ KIỂM TRA TRẠNG THÁI THANH TOÁN
                    const isPaid = data.trang_thai_thanh_toan === 'Đã thanh toán' || 
                                   data.trang_thai_thanh_toan === 'Đã đặt cọc';
                    
                    if (isPaid) {
                        toast.success('🎉 Thanh toán thành công!');
                        
                        // Lấy thông tin thanh toán chi tiết
                        const paymentDetail = data.thanhToan;
                        if (paymentDetail) {
                            setPaymentInfo({
                                so_tien: paymentDetail.so_tien || data.tong_tien,
                                phuong_thuc: paymentDetail.phuong_thuc || 'VNPay',
                                ma_giao_dich: paymentDetail.ma_giao_dich || orderIdParam,
                                ngay_thanh_toan: paymentDetail.ngay_thanh_toan || new Date().toISOString(),
                                trang_thai: paymentDetail.trang_thai || data.trang_thai_thanh_toan
                            });
                        } else {
                            setPaymentInfo({
                                so_tien: data.tong_tien || 0,
                                phuong_thuc: 'VNPay',
                                ma_giao_dich: orderIdParam,
                                ngay_thanh_toan: new Date().toISOString(),
                                trang_thai: data.trang_thai_thanh_toan
                            });
                        }
                    } else {
                        // ⭐ NẾU CHƯA CẬP NHẬT, KIỂM TRA LẠI SAU 3 GIÂY
                        setTimeout(async () => {
                            try {
                                const retryResponse = await paymentsAPI.getPaymentStatus(orderIdParam);
                                const retryData = retryResponse.data.data;
                                if (retryData.trang_thai_thanh_toan === 'Đã thanh toán' || 
                                    retryData.trang_thai_thanh_toan === 'Đã đặt cọc') {
                                    setPaymentStatus(retryData);
                                    toast.success('🎉 Thanh toán thành công!');
                                }
                            } catch (error) {
                                console.error('Retry check error:', error);
                            }
                        }, 3000);
                    }
                } catch (error) {
                    console.error('❌ Check payment status error:', error);
                }
            }
            setLoading(false);
        };

        checkPaymentStatus();
    }, [orderIdParam, status]);

    const handleDownloadVoucher = async () => {
        if (!orderId) return;
        setDownloading(true);
        try {
            const response = await bookingsAPI.downloadVoucher(orderId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `voucher_${orderId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('📄 Tải vé thành công!');
        } catch (error) {
            console.error('Download voucher error:', error);
            toast.error('❌ Tải vé thất bại');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="container-custom py-12 flex flex-col items-center justify-center min-h-[60vh]">
                <LoadingSpinner />
                <p className="text-gray-500 mt-4">Đang kiểm tra thanh toán...</p>
            </div>
        );
    }

    // ⭐ KIỂM TRA THÀNH CÔNG
    const isSuccess = status === 'success' || 
                      (paymentStatus && 
                       (paymentStatus.trang_thai_thanh_toan === 'Đã thanh toán' || 
                        paymentStatus.trang_thai_thanh_toan === 'Đã đặt cọc'));

    // ⭐ TRANG THẤT BẠI
    if (!isSuccess) {
        let errorMessage = messageParam ? decodeURIComponent(messageParam) : 'Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.';
        let errorCode = codeParam || 'UNKNOWN';

        return (
            <div className="container-custom py-12">
                <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircleIcon className="w-14 h-14 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-red-600 mb-3">❌ Thanh toán thất bại</h2>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left">
                            <p className="text-red-700 font-medium">{errorMessage}</p>
                            {errorCode && <p className="text-sm text-red-500 mt-1">Mã lỗi: {errorCode}</p>}
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left text-sm">
                            <p className="text-yellow-700 font-medium mb-1">💡 Gợi ý:</p>
                            <ul className="text-yellow-600 space-y-1">
                                <li>• Kiểm tra lại thông tin thẻ thanh toán</li>
                                <li>• Đảm bảo số dư tài khoản đủ để thanh toán</li>
                                <li>• Liên hệ ngân hàng nếu thẻ bị từ chối</li>
                                <li>• Thử lại giao dịch sau vài phút</li>
                            </ul>
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={() => orderId ? navigate(`/payment/${orderId}`) : navigate('/')}
                                className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                            >
                                <ArrowPathIcon className="w-5 h-5" />
                                Thử lại
                            </button>
                            <Link to="/" className="block w-full btn-secondary text-center py-3">
                                🏠 Về trang chủ
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ⭐ TRANG THÀNH CÔNG
    return (
        <div className="container-custom py-12">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-10 text-center">
                        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <CheckCircleIcon className="w-14 h-14 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">🎉 Thanh toán thành công!</h1>
                        <p className="text-green-100">Cảm ơn bạn đã thanh toán đơn hàng. Đơn hàng của bạn đã được xác nhận.</p>
                    </div>

                    <div className="p-8">
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <DocumentTextIcon className="w-5 h-5 text-primary-500" />
                                Chi tiết thanh toán
                            </h3>
                            <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                    <span className="text-gray-500">Mã đơn hàng</span>
                                    <span className="font-bold text-gray-800 text-lg">#{orderId}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                    <span className="text-gray-500">Số tiền thanh toán</span>
                                    <span className="font-bold text-primary-500 text-xl">
                                        {formatCurrency(paymentInfo?.so_tien || paymentStatus?.tong_tien || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                    <span className="text-gray-500">Phương thức</span>
                                    <span className="font-medium text-gray-700">💳 {paymentInfo?.phuong_thuc || 'VNPay'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                    <span className="text-gray-500">Mã giao dịch</span>
                                    <span className="font-mono text-sm text-gray-600">{paymentInfo?.ma_giao_dich || orderId}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Thời gian</span>
                                    <span className="text-gray-700">{formatDateTime(paymentInfo?.ngay_thanh_toan || new Date())}</span>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t-2 border-green-200">
                                    <span className="text-gray-600 font-medium">Trạng thái</span>
                                    <span className="badge badge-success text-lg px-4 py-1">
                                        ✅ {paymentStatus?.trang_thai_thanh_toan || 'Đã thanh toán'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-8 bg-blue-50 rounded-xl p-5 border border-blue-100">
                            <h4 className="font-semibold text-blue-800 mb-2">📌 Lưu ý quan trọng</h4>
                            <ul className="space-y-2 text-sm text-blue-700">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 font-bold">•</span>
                                    <span>Vé điện tử sẽ được gửi đến email đăng ký của bạn</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 font-bold">•</span>
                                    <span>Vui lòng kiểm tra email (cả hộp thư Spam) để tải vé</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 font-bold">•</span>
                                    <span>Mang theo CMND/CCCD và vé đã in khi tham gia tour</span>
                                </li>
                            </ul>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to="/my-bookings" className="flex-1 btn-primary flex items-center justify-center gap-2 py-3 text-center">
                                📋 Xem đơn hàng
                            </Link>
                            <Link to="/" className="flex-1 btn-secondary flex items-center justify-center gap-2 py-3 text-center">
                                <HomeIcon className="w-5 h-5" />
                                🏠 Về trang chủ
                            </Link>
                        </div>

                        {orderId && (
                            <div className="mt-4 text-center">
                                <button
                                    onClick={handleDownloadVoucher}
                                    disabled={downloading}
                                    className="text-primary-500 hover:text-primary-600 font-medium text-sm flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
                                >
                                    {downloading ? '⏳ Đang tải...' : '📄 Tải vé điện tử (PDF)'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="text-center mt-6">
                    <p className="text-sm text-gray-400">Công Ty Du Lịch Việt - Hotline: 1900 1234</p>
                </div>
            </div>
        </div>
    );
};

export default PaymentResultPage;