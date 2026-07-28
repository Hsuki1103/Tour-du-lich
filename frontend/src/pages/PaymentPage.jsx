// frontend/src/pages/PaymentPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { bookingsAPI } from '../api/bookings';
import { paymentsAPI } from '../api/payments';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/helpers';
import { 
    CreditCardIcon, 
    CheckCircleIcon, 
    BuildingOfficeIcon,
    ShieldCheckIcon,
    ArrowLeftIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const PaymentPage = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const [paymentMethod, setPaymentMethod] = useState('coc');
    const [paymentType, setPaymentType] = useState('online');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [offlineSuccess, setOfflineSuccess] = useState(false);

    // ⭐ LẤY STATE TỪ LOCATION (CHO THANH TOÁN BỔ SUNG)
    const isAdditionalPayment = location.state?.isAdditionalPayment || false;
    const additionalAmount = location.state?.additionalAmount || 0;
    const newTotal = location.state?.newTotal || 0;
    const currentTotal = location.state?.currentTotal || 0;

    console.log('📊 PaymentPage - isAdditionalPayment:', isAdditionalPayment);
    console.log('📊 PaymentPage - additionalAmount:', additionalAmount);

    // Fetch booking detail
    const { data: bookingData, isLoading, refetch } = useQuery(
        ['booking-detail', bookingId],
        () => bookingsAPI.getBookingDetail(bookingId),
        { enabled: !!bookingId }
    );

    const booking = bookingData?.data?.data;

    // Create payment mutation (VNPay)
    const paymentMutation = useMutation(
        (data) => paymentsAPI.createVNPay(data),
        {
            onSuccess: (response) => {
                console.log('✅ Payment response:', response.data);
                const paymentUrl = response.data.data?.payment_url;
                if (paymentUrl) {
                    toast.info('🔄 Đang chuyển hướng đến VNPay...');
                    window.location.href = paymentUrl;
                } else {
                    setError('Không nhận được URL thanh toán từ VNPay');
                    setLoading(false);
                    toast.error('❌ Không nhận được URL thanh toán');
                }
            },
            onError: (error) => {
                console.error('❌ Payment error:', error);
                const message = error.response?.data?.message || 'Tạo thanh toán thất bại. Vui lòng thử lại.';
                setError(message);
                setLoading(false);
                toast.error(`❌ ${message}`);
            }
        }
    );

    // Mutation cho offline payment
    const offlinePaymentMutation = useMutation(
        (id) => bookingsAPI.confirmOfflinePayment(id),
        {
            onSuccess: (response) => {
                console.log('✅ Offline payment success:', response.data);
                
                queryClient.invalidateQueries(['booking-detail', bookingId]);
                queryClient.invalidateQueries(['my-bookings']);
                
                setOfflineSuccess(true);
                setLoading(false);
                toast.success('✅ Đã ghi nhận yêu cầu thanh toán tại văn phòng!');
                toast.info('📋 Vui lòng đến văn phòng công ty để hoàn tất thanh toán.');
            },
            onError: (error) => {
                console.error('❌ Offline payment error:', error);
                const message = error.response?.data?.message || 'Không thể ghi nhận thanh toán. Vui lòng thử lại.';
                setError(message);
                setLoading(false);
                toast.error(`❌ ${message}`);
            }
        }
    );

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const response = await paymentsAPI.getPaymentStatus(bookingId);
                const data = response.data.data;
                if (data?.trang_thai_thanh_toan === 'Đã thanh toán' || 
                    data?.trang_thai_thanh_toan === 'Đã đặt cọc') {
                    clearInterval(interval);
                    toast.success('🎉 Thanh toán thành công!');
                    navigate('/my-bookings');
                }
            } catch (error) {
                console.error('Check payment status error:', error);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [bookingId, navigate]);

    const handleOfflinePayment = async () => {
        if (!booking) {
            setError('Không tìm thấy thông tin đơn hàng');
            return;
        }

        setLoading(true);
        setError('');
        setOfflineSuccess(false);

        try {
            await offlinePaymentMutation.mutateAsync(parseInt(bookingId));
        } catch (error) {
            setLoading(false);
        }
    };

    const handleOnlinePayment = async () => {
        if (!booking) {
            setError('Không tìm thấy thông tin đơn hàng');
            return;
        }

        let amount;
        let phuong_thuc_thanh_toan;

        if (isAdditionalPayment) {
            // ⭐ THANH TOÁN BỔ SUNG - CHỈ THANH TOÁN PHẦN CHÊNH LỆCH
            amount = additionalAmount;
            phuong_thuc_thanh_toan = 'full'; // Luôn là thanh toán full phần còn lại
        } else {
            // ⭐ THANH TOÁN LẦN ĐẦU
            amount = paymentMethod === 'coc' ? booking.tien_coc : booking.tong_tien;
            phuong_thuc_thanh_toan = paymentMethod;
        }

        if (amount <= 0) {
            setError('Số tiền thanh toán không hợp lệ');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // ⭐ GỬI THÊM THAM SỐ is_additional CHO BACKEND
            await paymentMutation.mutateAsync({
                ma_don_hang: parseInt(bookingId),
                phuong_thuc_thanh_toan: phuong_thuc_thanh_toan,
                so_tien: amount,
                is_additional: isAdditionalPayment // ⭐ QUAN TRỌNG
            });
        } catch (err) {
            setLoading(false);
        }
    };

    const handlePayment = () => {
        if (paymentType === 'online') {
            handleOnlinePayment();
        } else {
            handleOfflinePayment();
        }
    };

    const goToBookings = () => {
        queryClient.invalidateQueries(['my-bookings']);
        navigate('/my-bookings');
    };

    // ⭐ KIỂM TRA TRẠNG THÁI ĐƠN HÀNG
    const isPaid = booking?.trang_thai_thanh_toan === 'Đã thanh toán';

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

    // ⭐ NẾU ĐÃ THANH TOÁN ĐẦY ĐỦ
    if (isPaid && !isAdditionalPayment) {
        return (
            <div className="container-custom py-12">
                <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircleIcon className="w-12 h-12 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Đã thanh toán!</h2>
                    <p className="text-gray-600 mb-6">Đơn hàng #{bookingId} đã được thanh toán thành công.</p>
                    <button onClick={goToBookings} className="btn-primary">
                        Xem đơn hàng
                    </button>
                </div>
            </div>
        );
    }

    // ⭐ NẾU ĐÃ THANH TOÁN OFFLINE THÀNH CÔNG
    if (offlineSuccess) {
        return (
            <div className="container-custom py-12">
                <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BuildingOfficeIcon className="w-12 h-12 text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-blue-600 mb-2">✅ Đã ghi nhận!</h2>
                    <p className="text-gray-600 mb-4">
                        Yêu cầu thanh toán tại văn phòng đã được ghi nhận.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                        <p className="text-sm font-medium text-blue-800 mb-2">📍 Thông tin văn phòng:</p>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li><strong>Địa chỉ:</strong> 123 Đường ABC, Quận 1, TP.HCM</li>
                            <li><strong>Giờ làm việc:</strong> Thứ 2 - Thứ 7 (8:00 - 17:30)</li>
                            <li><strong>Hotline:</strong> 1900 1234</li>
                        </ul>
                    </div>
                    <button onClick={goToBookings} className="btn-primary">
                        Xem đơn hàng của tôi
                    </button>
                </div>
            </div>
        );
    }

    // ⭐ XÁC ĐỊNH SỐ TIỀN HIỂN THỊ
    let displayAmount;
    let displayLabel;
    let isDepositPayment = false;

    if (isAdditionalPayment) {
        // ⭐ THANH TOÁN BỔ SUNG (PHẦN CÒN LẠI)
        displayAmount = additionalAmount;
        displayLabel = 'Thanh toán phần còn lại';
        isDepositPayment = false;
    } else {
        // ⭐ THANH TOÁN LẦN ĐẦU
        if (paymentMethod === 'coc') {
            displayAmount = booking.tien_coc;
            displayLabel = 'Đặt cọc 30%';
            isDepositPayment = true;
        } else {
            displayAmount = booking.tong_tien;
            displayLabel = 'Thanh toán 100%';
            isDepositPayment = false;
        }
    }

    // ⭐ KIỂM TRA NẾU ĐÃ ĐẶT CỌC VÀ ĐANG THANH TOÁN BỔ SUNG
    const isDepositPaid = booking.trang_thai_thanh_toan === 'Đã đặt cọc';

    return (
        <div className="container-custom py-8">
            <button 
                onClick={() => navigate(-1)} 
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
            >
                <ArrowLeftIcon className="w-5 h-5" /> Quay lại
            </button>

            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                    {isAdditionalPayment ? 'Thanh toán phần còn lại' : 'Thanh toán'}
                </h1>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                        {error}
                    </div>
                )}

                {/* ⭐ THÔNG BÁO THANH TOÁN BỔ SUNG */}
                {isAdditionalPayment && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <p className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-5 h-5" />
                            Thanh toán bổ sung
                        </p>
                        <p className="text-sm text-yellow-700">
                            Bạn đang thanh toán phần còn lại sau khi đã đặt cọc.
                        </p>
                        <div className="mt-2 p-3 bg-white rounded-lg">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tiền đã đặt cọc</span>
                                <span className="text-green-600 font-medium">{formatCurrency(currentTotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold">
                                <span className="text-gray-600">Tổng tiền tour</span>
                                <span className="text-primary-500">{formatCurrency(newTotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-red-600 border-t pt-2 mt-2">
                                <span className="font-medium">Số tiền cần thanh toán</span>
                                <span className="font-bold text-lg">{formatCurrency(additionalAmount)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ⭐ THÔNG BÁO ĐÃ ĐẶT CỌC */}
                {isDepositPaid && !isAdditionalPayment && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <p className="text-sm font-medium text-green-800 flex items-center gap-2">
                            <CheckCircleIcon className="w-5 h-5" />
                            Đã đặt cọc 30%
                        </p>
                        <p className="text-sm text-green-700">
                            Bạn đã đặt cọc {formatCurrency(booking.tien_coc)}. 
                            Vui lòng thanh toán phần còn lại {formatCurrency(booking.tien_con_lai)}.
                        </p>
                        <button 
                            onClick={() => {
                                // Chuyển sang thanh toán phần còn lại
                                navigate(`/payment/${bookingId}`, { 
                                    state: { 
                                        isAdditionalPayment: true,
                                        additionalAmount: booking.tien_con_lai,
                                        newTotal: booking.tong_tien,
                                        currentTotal: booking.tien_coc
                                    }
                                });
                            }} 
                            className="btn-primary text-sm mt-2"
                        >
                            Thanh toán phần còn lại ngay
                        </button>
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
                            {!isAdditionalPayment && (
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Tiền cọc (30%)</span>
                                    <span>{formatCurrency(booking.tien_coc)}</span>
                                </div>
                            )}
                            {isAdditionalPayment && (
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Đã thanh toán</span>
                                    <span className="text-green-600">{formatCurrency(currentTotal)}</span>
                                </div>
                            )}
                            {isAdditionalPayment && (
                                <div className="flex justify-between text-sm text-red-600 font-medium border-t pt-2">
                                    <span>Cần thanh toán</span>
                                    <span>{formatCurrency(additionalAmount)}</span>
                                </div>
                            )}
                            {!isAdditionalPayment && booking.tien_con_lai > 0 && (
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Tiền còn lại</span>
                                    <span>{formatCurrency(booking.tien_con_lai)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ⭐ CHỌN HÌNH THỨC THANH TOÁN - CHỈ HIỂN THỊ KHI KHÔNG PHẢI THANH TOÁN BỔ SUNG */}
                {!isAdditionalPayment && (
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Hình thức thanh toán</h2>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <button
                                onClick={() => { setPaymentType('online'); setOfflineSuccess(false); }}
                                className={`p-4 border-2 rounded-lg text-center transition-all ${paymentType === 'online' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}
                            >
                                <CreditCardIcon className={`w-8 h-8 mx-auto mb-2 ${paymentType === 'online' ? 'text-primary-500' : 'text-gray-400'}`} />
                                <p className={`font-medium ${paymentType === 'online' ? 'text-primary-500' : 'text-gray-600'}`}>
                                    Thanh toán online
                                </p>
                                <p className="text-xs text-gray-400">VNPay, MoMo</p>
                            </button>

                            <button
                                onClick={() => { setPaymentType('offline'); setOfflineSuccess(false); }}
                                className={`p-4 border-2 rounded-lg text-center transition-all ${paymentType === 'offline' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}
                            >
                                <BuildingOfficeIcon className={`w-8 h-8 mx-auto mb-2 ${paymentType === 'offline' ? 'text-primary-500' : 'text-gray-400'}`} />
                                <p className={`font-medium ${paymentType === 'offline' ? 'text-primary-500' : 'text-gray-600'}`}>
                                    Thanh toán tại văn phòng
                                </p>
                                <p className="text-xs text-gray-400">Đến công ty thanh toán</p>
                            </button>
                        </div>

                        {paymentType === 'offline' && (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <BuildingOfficeIcon className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-blue-800">Thanh toán tại văn phòng</h4>
                                        <ul className="text-sm text-blue-700 space-y-1 mt-2">
                                            <li>📍 <strong>Địa chỉ:</strong> 123 Đường ABC, Quận 1, TP.HCM</li>
                                            <li>⏰ <strong>Giờ làm việc:</strong> Thứ 2 - Thứ 7 (8:00 - 17:30)</li>
                                            <li>📞 <strong>Hotline:</strong> 1900 1234</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ⭐ CHỌN PHƯƠNG THỨC THANH TOÁN ONLINE - CHỈ HIỂN THỊ KHI KHÔNG PHẢI THANH TOÁN BỔ SUNG */}
                {paymentType === 'online' && !isAdditionalPayment && !isDepositPaid && (
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Phương thức thanh toán online</h2>
                        
                        <div className="space-y-3">
                            <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'coc' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}>
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
                            <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'full' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}>
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
                )}

                {/* ⭐ NẾU ĐÃ ĐẶT CỌC VÀ KHÔNG PHẢI THANH TOÁN BỔ SUNG, HIỂN THỊ NÚT CHUYỂN */}
                {isDepositPaid && !isAdditionalPayment && (
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                        <div className="text-center py-4">
                            <p className="text-gray-600 mb-2">Bạn đã đặt cọc 30%</p>
                            <p className="text-sm text-gray-500 mb-4">
                                Số tiền còn lại cần thanh toán: <strong className="text-primary-500">{formatCurrency(booking.tien_con_lai)}</strong>
                            </p>
                            <button 
                                onClick={() => {
                                    navigate(`/payment/${bookingId}`, { 
                                        state: { 
                                            isAdditionalPayment: true,
                                            additionalAmount: booking.tien_con_lai,
                                            newTotal: booking.tong_tien,
                                            currentTotal: booking.tien_coc
                                        }
                                    });
                                }} 
                                className="btn-primary"
                            >
                                Thanh toán phần còn lại
                            </button>
                        </div>
                    </div>
                )}

                {/* ⭐ HIỂN THỊ SỐ TIỀN VÀ NÚT THANH TOÁN */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-semibold">
                            {isAdditionalPayment ? 'Số tiền cần thanh toán' : 'Số tiền thanh toán'}
                        </span>
                        <span className="text-2xl font-bold text-primary-500">
                            {formatCurrency(displayAmount)}
                        </span>
                    </div>

                    {/* ⭐ HIỂN THỊ NÚT THANH TOÁN - CHỈ HIỂN THỊ KHI CÓ SỐ TIỀN > 0 */}
                    {displayAmount > 0 ? (
                        <button
                            onClick={handlePayment}
                            disabled={loading}
                            className={`w-full py-4 text-lg font-semibold text-white rounded-lg transition-colors flex items-center justify-center gap-3 ${loading ? 'bg-gray-400 cursor-not-allowed' : paymentType === 'offline' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-primary-500 hover:bg-primary-600'}`}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang xử lý...
                                </>
                            ) : paymentType === 'offline' ? (
                                <>
                                    <BuildingOfficeIcon className="w-6 h-6" />
                                    Xác nhận thanh toán tại văn phòng
                                </>
                            ) : (
                                <>
                                    <CreditCardIcon className="w-6 h-6" />
                                    {isAdditionalPayment ? 'Thanh toán phần còn lại' : paymentMethod === 'coc' ? 'Đặt cọc 30%' : 'Thanh toán 100%'}
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="text-center py-4 text-gray-500">
                            <p>✅ Không có số tiền cần thanh toán</p>
                            <button onClick={goToBookings} className="btn-primary mt-4">
                                Xem đơn hàng của tôi
                            </button>
                        </div>
                    )}

                    {paymentType === 'online' && displayAmount > 0 && (
                        <p className="text-center text-sm text-gray-500 mt-3">
                            Bạn sẽ được chuyển đến cổng thanh toán VNPay để hoàn tất giao dịch
                        </p>
                    )}

                    {paymentType === 'offline' && displayAmount > 0 && (
                        <p className="text-center text-sm text-gray-500 mt-3">
                            Vui lòng đến văn phòng công ty để hoàn tất thanh toán
                        </p>
                    )}
                </div>

                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                    <ShieldCheckIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-green-800">Thanh toán an toàn</p>
                        <p className="text-sm text-green-600">
                            {paymentType === 'online' 
                                ? 'Giao dịch được bảo mật bởi VNPay. Thông tin thanh toán của bạn được mã hóa.'
                                : 'Thanh toán trực tiếp tại văn phòng công ty với hóa đơn đầy đủ.'
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;