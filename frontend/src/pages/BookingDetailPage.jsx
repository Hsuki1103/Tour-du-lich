// frontend/src/pages/BookingDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { bookingsAPI } from '../api/bookings';
import { toursAPI } from '../api/tours';
import { paymentsAPI } from '../api/payments';
import { reviewsAPI } from '../api/reviews';
import RefundRequestForm from '../components/booking/RefundRequestForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate, formatDateTime } from '../utils/helpers';
import { toast } from 'react-toastify';
import { 
    ArrowLeftIcon,
    DocumentArrowDownIcon,
    XMarkIcon,
    XCircleIcon,
    StarIcon as StarOutlineIcon,
    CalendarIcon,
    UserIcon,
    CurrencyDollarIcon,
    ChatBubbleLeftIcon,
    BuildingOfficeIcon,
    BanknotesIcon,
    CreditCardIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

const BookingDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [showRefundForm, setShowRefundForm] = useState(false);
    const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
    const [reviewData, setReviewData] = useState({ so_sao: 0, noi_dung: '' });
    const [hoverRating, setHoverRating] = useState(0);
    const [cancelReason, setCancelReason] = useState('');
    const [refundInfo, setRefundInfo] = useState(null);

    // Fetch booking detail
    const { data, isLoading, error, refetch } = useQuery(
        ['booking-detail', id],
        () => bookingsAPI.getBookingDetail(id),
        { enabled: !!id }
    );

    const booking = data?.data?.data;

    // ============================================
    // MUTATIONS
    // ============================================

    // Cancel mutation
    const cancelMutation = useMutation(
        ({ id, ly_do }) => bookingsAPI.cancelBooking(id, { ly_do }),
        {
            onSuccess: (response) => {
                const refund = response.data.data.so_tien_hoan_lai || 0;
                const refundLabel = response.data.data.refund_label || 'Không hoàn tiền';
                
                queryClient.invalidateQueries(['booking-detail', id]);
                queryClient.invalidateQueries(['my-bookings']);
                
                if (refund > 0) {
                    toast.success(`✅ Hủy đơn hàng thành công! Số tiền hoàn lại: ${formatCurrency(refund)}`);
                    setShowRefundForm(true);
                } else {
                    toast.success(`✅ Hủy đơn hàng thành công! (${refundLabel})`);
                }
                setShowCancelConfirmModal(false);
                refetch();
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || '❌ Hủy đơn thất bại');
            }
        }
    );

    // Review mutation
    const reviewMutation = useMutation(
        (data) => reviewsAPI.createReview(data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['booking-detail', id]);
                setShowReviewForm(false);
                setReviewData({ so_sao: 0, noi_dung: '' });
                toast.success('✅ Cảm ơn bạn đã đánh giá!');
                refetch();
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || '❌ Gửi đánh giá thất bại');
            }
        }
    );

    // Download voucher
    const downloadMutation = useMutation(
        (id) => bookingsAPI.downloadVoucher(id),
        {
            onSuccess: (response) => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `voucher_${Date.now()}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                toast.success('📄 Tải vé thành công!');
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || 'Tải vé thất bại');
            }
        }
    );

    // ============================================
    // HANDLERS
    // ============================================

    const handleCancelClick = () => {
        const refund = calculateRefundPercentage(
            booking.lichKhoiHanh?.ngay_khoi_hanh,
            booking.trang_thai_thanh_toan
        );
        setRefundInfo(refund);
        setCancelReason('');
        setShowCancelConfirmModal(true);
    };

    const handleConfirmCancel = () => {
        if (!cancelReason.trim()) {
            toast.warning('Vui lòng nhập lý do hủy');
            return;
        }
        cancelMutation.mutate({ 
            id: parseInt(id), 
            ly_do: cancelReason 
        });
    };

    const handleDownloadVoucher = () => {
        downloadMutation.mutate(parseInt(id));
    };

    const handleSubmitReview = () => {
        if (reviewData.so_sao === 0) {
            toast.warning('Vui lòng chọn số sao đánh giá');
            return;
        }
        if (reviewData.noi_dung.length < 10) {
            toast.warning('Vui lòng nhập nội dung đánh giá (tối thiểu 10 ký tự)');
            return;
        }
        reviewMutation.mutate({
            ma_don_hang: parseInt(id),
            so_sao: reviewData.so_sao,
            noi_dung: reviewData.noi_dung,
        });
    };

    // ============================================
    // RENDER FUNCTIONS
    // ============================================

    const renderStars = (rating, interactive = false) => {
        const stars = [];
        const displayRating = interactive ? (hoverRating || reviewData.so_sao) : rating;
        for (let i = 1; i <= 5; i++) {
            stars.push(
                interactive ? (
                    <button key={i} type="button" onClick={() => setReviewData({ ...reviewData, so_sao: i })} 
                        onMouseEnter={() => setHoverRating(i)} onMouseLeave={() => setHoverRating(0)} 
                        className="focus:outline-none transition-transform hover:scale-110">
                        {i <= displayRating ? <StarSolidIcon className="w-8 h-8 text-yellow-400" /> : <StarOutlineIcon className="w-8 h-8 text-gray-300" />}
                    </button>
                ) : (
                    <span key={i}>{i <= rating ? <StarSolidIcon className="w-4 h-4 text-yellow-400 inline" /> : <StarOutlineIcon className="w-4 h-4 text-gray-300 inline" />}</span>
                )
            );
        }
        return stars;
    };

    const getDaysUntilDeparture = (departureDate) => {
        if (!departureDate) return 0;
        return Math.ceil((new Date(departureDate) - new Date()) / (1000 * 60 * 60 * 24));
    };

    const calculateRefundPercentage = (departureDate, paymentStatus) => {
        if (!departureDate) {
            return { percentage: 0, label: 'Không hoàn tiền', color: 'text-red-500', days: 0, note: 'Không có ngày khởi hành' };
        }
        
        if (paymentStatus !== 'Đã thanh toán') {
            if (paymentStatus === 'Đã đặt cọc') {
                return { percentage: 0, label: 'Không hoàn tiền (đã đặt cọc)', color: 'text-red-500', days: 0, note: 'Đơn hàng đã đặt cọc không được hoàn tiền' };
            }
            return { percentage: 0, label: 'Không hoàn tiền (chưa thanh toán)', color: 'text-red-500', days: 0, note: 'Chỉ áp dụng hoàn tiền cho đơn đã thanh toán' };
        }
        
        const now = new Date();
        const departure = new Date(departureDate);
        const daysUntilDeparture = Math.ceil((departure - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDeparture >= 7) {
            return { percentage: 100, label: 'Hoàn 100%', color: 'text-green-500', days: daysUntilDeparture, note: 'Hủy trước 7 ngày - Hoàn 100% tiền' };
        } else if (daysUntilDeparture >= 3) {
            return { percentage: 50, label: 'Hoàn 50%', color: 'text-yellow-500', days: daysUntilDeparture, note: 'Hủy trước 3 ngày - Hoàn 50% tiền' };
        } else if (daysUntilDeparture > 0) {
            return { percentage: 0, label: 'Không hoàn tiền', color: 'text-red-500', days: daysUntilDeparture, note: 'Hủy dưới 3 ngày - Không hoàn tiền' };
        } else {
            return { percentage: 0, label: 'Đã quá hạn hủy', color: 'text-gray-500', days: 0, note: 'Tour đã khởi hành hoặc đã quá hạn hủy' };
        }
    };

    // ============================================
    // ⭐ HÀM LẤY TRẠNG THÁI HOÀN TIỀN
    // ============================================
    const getRefundStatusBadge = (status, thongTinHoanTien) => {
        const configs = {
            'Chưa yêu cầu': { 
                color: 'badge-gray', 
                icon: <ClockIcon className="w-4 h-4" />, 
                label: 'Chưa yêu cầu' 
            },
            'Đã yêu cầu': { 
                color: 'badge-warning', 
                icon: <ClockIcon className="w-4 h-4" />, 
                label: 'Đang chờ xử lý' 
            },
            'Đã hoàn': { 
                color: 'badge-success', 
                icon: <CheckCircleIcon className="w-4 h-4" />, 
                label: 'Đã hoàn tiền' 
            },
            'Từ chối': { 
                color: 'badge-danger', 
                icon: <XCircleIcon className="w-4 h-4" />, 
                label: 'Từ chối' 
            },
        };
        const config = configs[status] || configs['Chưa yêu cầu'];
        return (
            <span className={`badge ${config.color} flex items-center gap-1`}>
                {config.icon}
                {config.label}
            </span>
        );
    };

    // ============================================
    // ⭐ HÀM HIỂN THỊ THÔNG TIN HOÀN TIỀN (BAO GỒM TỪ CHỐI)
    // ============================================
    const renderRefundInfo = () => {
        if (!booking || booking.trang_thai_don_hang !== 'Đã hủy') return null;
        if (parseFloat(booking.so_tien_hoan || 0) <= 0) return null;

        const thongTin = booking.thong_tin_hoan_tien || {};
        const isRejected = booking.hoan_tien === 'Từ chối';
        const isApproved = booking.hoan_tien === 'Đã hoàn';
        const isPending = booking.hoan_tien === 'Đã yêu cầu';
        
        // ⭐ XÁC ĐỊNH MÀU SẮC THEO TRẠNG THÁI
        let bgColor = 'bg-gray-50 border-gray-200';
        let iconColor = 'text-gray-400';
        if (isRejected) {
            bgColor = 'bg-red-50 border-red-200';
            iconColor = 'text-red-500';
        } else if (isApproved) {
            bgColor = 'bg-green-50 border-green-200';
            iconColor = 'text-green-500';
        } else if (isPending) {
            bgColor = 'bg-yellow-50 border-yellow-200';
            iconColor = 'text-yellow-500';
        }

        return (
            <div className={`p-4 border-b flex items-start gap-3 ${bgColor}`}>
                <BanknotesIcon className={`w-6 h-6 flex-shrink-0 mt-1 ${iconColor}`} />
                <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-sm font-medium">
                            💰 Số tiền hoàn lại: <strong className="text-primary-500">{formatCurrency(booking.so_tien_hoan)}</strong>
                        </p>
                        <span className="text-xs text-gray-500">|</span>
                        <div>
                            {getRefundStatusBadge(booking.hoan_tien, thongTin)}
                        </div>
                    </div>
                    
                    {/* ⭐ HIỂN THỊ THÔNG TIN CHUYỂN KHOẢN */}
                    {thongTin.phuong_thuc && (
                        <div className="mt-1 text-xs text-gray-500">
                            {thongTin.phuong_thuc === 'chuyen_khoan' ? (
                                <span>
                                    🏦 Phương thức: Chuyển khoản - {thongTin.ten_ngan_hang || 'N/A'} 
                                    ({thongTin.so_tai_khoan || 'N/A'})
                                </span>
                            ) : (
                                <span>💵 Phương thức: Tiền mặt tại văn phòng</span>
                            )}
                            {thongTin.ngay_yeu_cau && (
                                <span className="ml-2">📅 Yêu cầu: {formatDateTime(thongTin.ngay_yeu_cau)}</span>
                            )}
                        </div>
                    )}

                    {/* ⭐ HIỂN THỊ LÝ DO TỪ CHỐI (QUAN TRỌNG) */}
                    {isRejected && thongTin.ly_do_tu_choi && (
                        <div className="mt-2 p-3 bg-red-100 border border-red-300 rounded-lg">
                            <p className="text-sm font-medium text-red-700 flex items-center gap-2">
                                <XCircleIcon className="w-4 h-4" />
                                Lý do từ chối:
                            </p>
                            <p className="text-sm text-red-600 mt-1">{thongTin.ly_do_tu_choi}</p>
                            {thongTin.ngay_tu_choi && (
                                <p className="text-xs text-red-500 mt-1">
                                    📅 Từ chối vào: {formatDateTime(thongTin.ngay_tu_choi)}
                                </p>
                            )}
                        </div>
                    )}

                    {/* ⭐ HIỂN THỊ THÔNG BÁO ĐÃ HOÀN */}
                    {isApproved && thongTin.ngay_duyet && (
                        <div className="mt-2 p-3 bg-green-100 border border-green-300 rounded-lg">
                            <p className="text-sm font-medium text-green-700 flex items-center gap-2">
                                <CheckCircleIcon className="w-4 h-4" />
                                Đã hoàn tiền vào: {formatDateTime(thongTin.ngay_duyet)}
                            </p>
                            {thongTin.ghi_chu_admin && (
                                <p className="text-sm text-green-600 mt-1">
                                    📝 Ghi chú: {thongTin.ghi_chu_admin}
                                </p>
                            )}
                        </div>
                    )}

                    {/* ⭐ HIỂN THỊ THÔNG BÁO ĐANG CHỜ */}
                    {isPending && (
                        <div className="mt-2 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                            <p className="text-sm font-medium text-yellow-700 flex items-center gap-2">
                                <ClockIcon className="w-4 h-4" />
                                Yêu cầu đang được xử lý
                            </p>
                            <p className="text-sm text-yellow-600 mt-1">
                                Vui lòng chờ trong 3-5 ngày làm việc
                            </p>
                        </div>
                    )}
                </div>

                {/* ⭐ NÚT YÊU CẦU HOÀN TIỀN (CHỈ HIỆN KHI CHƯA YÊU CẦU) */}
                {booking.hoan_tien === 'Chưa yêu cầu' && parseFloat(booking.so_tien_hoan || 0) > 0 && (
                    <button 
                        onClick={() => setShowRefundForm(true)}
                        className="btn-primary text-sm whitespace-nowrap flex-shrink-0"
                    >
                        <BanknotesIcon className="w-4 h-4 inline mr-1" />
                        Yêu cầu hoàn tiền
                    </button>
                )}
            </div>
        );
    };

    const hasOfflinePaymentNote = booking?.yeu_cau_dac_biet?.includes('KHÁCH HÀNG CHỌN THANH TOÁN TẠI VĂN PHÒNG');

    if (isLoading) return <LoadingSpinner />;
    if (error) {
        return (
            <div className="container-custom py-12 text-center">
                <p className="text-red-500">Có lỗi xảy ra khi tải thông tin đơn hàng</p>
                <button onClick={() => navigate('/my-bookings')} className="btn-primary mt-4">Quay lại</button>
            </div>
        );
    }
    if (!booking) {
        return (
            <div className="container-custom py-12 text-center">
                <p className="text-gray-500">Không tìm thấy đơn hàng</p>
                <button onClick={() => navigate('/my-bookings')} className="btn-primary mt-4">Quay lại</button>
            </div>
        );
    }

    const daysUntilDeparture = getDaysUntilDeparture(booking.lichKhoiHanh?.ngay_khoi_hanh);
    const canCancel = (booking.trang_thai_don_hang === 'Chờ xác nhận' || booking.trang_thai_don_hang === 'Đã xác nhận') && daysUntilDeparture > 0;
    const canDownloadVoucher = booking.trang_thai_thanh_toan === 'Đã thanh toán' || booking.trang_thai_thanh_toan === 'Đã đặt cọc';
    const canReview = booking.trang_thai_don_hang === 'Đã hoàn thành' && !booking.danhGia;
    
    const canRequestRefund = booking.trang_thai_don_hang === 'Đã hủy' && 
                             booking.hoan_tien === 'Chưa yêu cầu' && 
                             parseFloat(booking.so_tien_hoan || 0) > 0;
    
    const isDepositPaid = booking.trang_thai_thanh_toan === 'Đã đặt cọc' && booking.tien_con_lai > 0;

    return (
        <div className="container-custom py-8">
            <button onClick={() => navigate('/my-bookings')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors">
                <ArrowLeftIcon className="w-5 h-5" /> Quay lại danh sách đơn hàng
            </button>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b bg-gradient-to-r from-primary-50 to-white">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Đơn hàng #{booking.ma_don_hang}</h1>
                            <p className="text-gray-500 text-sm mt-1">Ngày đặt: {formatDate(booking.ngay_dat)}</p>
                            {booking.lichKhoiHanh?.ngay_khoi_hanh && (
                                <p className="text-sm mt-1">
                                    <span className="text-gray-500">Ngày khởi hành:</span>{' '}
                                    <span className="font-medium">{formatDate(booking.lichKhoiHanh.ngay_khoi_hanh)}</span>
                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${daysUntilDeparture >= 7 ? 'bg-green-100 text-green-700' : daysUntilDeparture > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                        {daysUntilDeparture > 0 ? `Còn ${daysUntilDeparture} ngày` : 'Đã quá hạn'}
                                    </span>
                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                        booking.trang_thai_thanh_toan === 'Đã thanh toán' ? 'bg-green-100 text-green-700' :
                                        booking.trang_thai_thanh_toan === 'Đã đặt cọc' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-gray-100 text-gray-500'
                                    }`}>
                                        {booking.trang_thai_thanh_toan}
                                    </span>
                                </p>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {canDownloadVoucher && (
                                <button onClick={handleDownloadVoucher} className="btn-primary flex items-center gap-2" disabled={downloadMutation.isLoading}>
                                    <DocumentArrowDownIcon className="w-5 h-5" /> 
                                    {downloadMutation.isLoading ? 'Đang tải...' : 'Tải vé'}
                                </button>
                            )}
                            
                            {isDepositPaid && (
                                <button 
                                    onClick={() => navigate(`/payment/${booking.ma_don_hang}`, { 
                                        state: { 
                                            isAdditionalPayment: true,
                                            additionalAmount: booking.tien_con_lai,
                                            newTotal: booking.tong_tien,
                                            currentTotal: booking.tong_tien - booking.tien_con_lai
                                        }
                                    })} 
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <CreditCardIcon className="w-5 h-5" />
                                    Thanh toán còn lại ({formatCurrency(booking.tien_con_lai)})
                                </button>
                            )}
                            
                            {canCancel && (
                                <button onClick={handleCancelClick} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2" disabled={cancelMutation.isLoading}>
                                    <XMarkIcon className="w-5 h-5" />
                                    {cancelMutation.isLoading ? 'Đang xử lý...' : 'Hủy đơn hàng'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {hasOfflinePaymentNote && (
                    <div className="p-4 bg-blue-50 border-b border-blue-200 flex items-center gap-3">
                        <BuildingOfficeIcon className="w-6 h-6 text-blue-500 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-blue-700">Đã ghi nhận thanh toán tại văn phòng</p>
                            <p className="text-xs text-blue-500">Vui lòng đến văn phòng công ty để hoàn tất thanh toán</p>
                        </div>
                    </div>
                )}

                {booking.trang_thai_thanh_toan === 'Đã thanh toán' && (
                    <div className="p-4 bg-green-50 border-b border-green-200 flex items-center gap-3">
                        <CheckCircleIcon className="w-6 h-6 text-green-500" />
                        <div>
                            <p className="text-sm font-medium text-green-700">Đơn hàng đã được thanh toán</p>
                        </div>
                    </div>
                )}

                {booking.trang_thai_thanh_toan === 'Chưa thanh toán' && booking.trang_thai_don_hang === 'Chờ xác nhận' && (
                    <div className="p-4 bg-yellow-50 border-b border-yellow-200 flex items-center gap-3">
                        <CreditCardIcon className="w-6 h-6 text-yellow-500" />
                        <div>
                            <p className="text-sm font-medium text-yellow-700">Đơn hàng chưa thanh toán</p>
                            <p className="text-xs text-yellow-500">Vui lòng thanh toán để xác nhận đơn hàng</p>
                        </div>
                    </div>
                )}

                {/* ⭐ HIỂN THỊ THÔNG TIN HOÀN TIỀN (BAO GỒM TỪ CHỐI) */}
                {renderRefundInfo()}

                {/* Chi tiết đơn hàng */}
                <div className="p-6 space-y-6">
                    {/* Tour Info */}
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-3 text-lg flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5" /> Thông tin tour
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-lg p-4">
                            <div><p className="text-gray-500">Tour</p><p className="font-medium">{booking.lichKhoiHanh?.tour?.ten_tour}</p></div>
                            <div><p className="text-gray-500">Điểm đến</p><p>{booking.lichKhoiHanh?.tour?.diem_den}</p></div>
                            <div><p className="text-gray-500">Ngày khởi hành</p><p className="font-medium">{formatDate(booking.lichKhoiHanh?.ngay_khoi_hanh)}</p></div>
                            <div><p className="text-gray-500">Số ngày</p><p>{booking.lichKhoiHanh?.tour?.so_ngay} ngày</p></div>
                        </div>
                    </div>

                    {/* Guest Info */}
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-3 text-lg flex items-center gap-2">
                            <UserIcon className="w-5 h-5" /> Thông tin khách
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-lg p-4">
                            <div>
                                <p className="text-gray-500">Người lớn</p>
                                <p className="font-medium text-lg">{booking.so_luong_nguoi_lon}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Trẻ em</p>
                                <p className="font-medium text-lg">{booking.so_luong_tre_em || 0}</p>
                            </div>
                        </div>
                        {booking.thong_tin_khach && booking.thong_tin_khach.length > 0 && (
                            <div className="mt-3">
                                <p className="text-gray-500 text-sm mb-2">Danh sách hành khách:</p>
                                <div className="bg-white rounded-lg border p-3 space-y-1">
                                    {booking.thong_tin_khach.map((guest, index) => (
                                        <div key={index} className="flex justify-between text-sm py-1 border-b last:border-0">
                                            <div>
                                                <span className="font-medium">{guest.ho_ten}</span>
                                                <span className="text-gray-500 text-xs ml-2">
                                                    {guest.ngay_sinh && `Ngày sinh: ${formatDate(guest.ngay_sinh)}`}
                                                </span>
                                            </div>
                                            <span className="text-gray-500">
                                                {guest.loai_khach === 'nguoi_lon' ? 'Người lớn' : 'Trẻ em'} | {guest.gioi_tinh || 'N/A'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Payment Info */}
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-3 text-lg flex items-center gap-2">
                            <CurrencyDollarIcon className="w-5 h-5" /> Thông tin thanh toán
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Tổng tiền</span>
                                <span className="font-bold text-primary-500 text-lg">{formatCurrency(booking.tong_tien)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Tiền cọc (30%)</span>
                                <span>{formatCurrency(booking.tien_coc)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Tiền còn lại</span>
                                <span>{formatCurrency(booking.tien_con_lai)}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t">
                                <span className="text-gray-500">Trạng thái thanh toán</span>
                                <span className={`badge ${booking.trang_thai_thanh_toan === 'Đã thanh toán' ? 'badge-success' : booking.trang_thai_thanh_toan === 'Đã đặt cọc' ? 'badge-primary' : 'badge-warning'}`}>
                                    {booking.trang_thai_thanh_toan}
                                </span>
                            </div>
                            {booking.trang_thai_don_hang === 'Đã hủy' && booking.so_tien_hoan > 0 && (
                                <div className="flex justify-between text-sm pt-2 border-t border-dashed border-yellow-300">
                                    <span className="text-gray-500">Số tiền hoàn lại</span>
                                    <span className={`font-bold ${booking.hoan_tien === 'Từ chối' ? 'text-red-500' : 'text-green-600'}`}>
                                        {formatCurrency(booking.so_tien_hoan)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-3 text-lg">📊 Trạng thái</h3>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Trạng thái đơn hàng</span>
                                <span className={`badge ${booking.trang_thai_don_hang === 'Đã xác nhận' || booking.trang_thai_don_hang === 'Đã hoàn thành' ? 'badge-success' : booking.trang_thai_don_hang === 'Đã hủy' ? 'badge-danger' : 'badge-warning'}`}>
                                    {booking.trang_thai_don_hang}
                                </span>
                            </div>
                            {booking.trang_thai_don_hang === 'Đã hủy' && (
                                <div className="flex justify-between text-sm pt-2 border-t">
                                    <span className="text-gray-500">Trạng thái hoàn tiền</span>
                                    <div>
                                        {getRefundStatusBadge(booking.hoan_tien, booking.thong_tin_hoan_tien)}
                                    </div>
                                </div>
                            )}
                            {booking.ly_do_huy && (
                                <div className="flex justify-between text-sm text-red-600 pt-2 border-t">
                                    <span className="text-gray-500">Lý do hủy</span>
                                    <span className="text-right max-w-[60%]">{booking.ly_do_huy}</span>
                                </div>
                            )}
                            {/* ⭐ HIỂN THỊ LÝ DO TỪ CHỐI NẾU CÓ */}
                            {booking.trang_thai_don_hang === 'Đã hủy' && 
                             booking.hoan_tien === 'Từ chối' && 
                             booking.thong_tin_hoan_tien?.ly_do_tu_choi && (
                                <div className="flex justify-between text-sm text-red-600 pt-2 border-t">
                                    <span className="text-gray-500">Lý do từ chối hoàn tiền</span>
                                    <span className="text-right max-w-[60%]">{booking.thong_tin_hoan_tien.ly_do_tu_choi}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ĐÁNH GIÁ */}
                    {canReview && !showReviewForm && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="text-sm text-green-700">⭐ Đánh giá tour của bạn</p>
                                <p className="text-xs text-green-500">Chia sẻ trải nghiệm của bạn về tour này</p>
                            </div>
                            <button onClick={() => setShowReviewForm(true)} className="btn-primary flex items-center gap-2">
                                <ChatBubbleLeftIcon className="w-4 h-4" /> Đánh giá
                            </button>
                        </div>
                    )}

                    {showReviewForm && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold text-gray-700">⭐ Đánh giá tour</h4>
                                <button onClick={() => { setShowReviewForm(false); setReviewData({ so_sao: 0, noi_dung: '' }); }} className="text-gray-500 hover:text-gray-700">
                                    <XCircleIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn số sao</label>
                                <div className="flex gap-1">{renderStars(0, true)}</div>
                                <p className="text-sm text-gray-500 mt-1">{reviewData.so_sao > 0 ? `Bạn đã chọn ${reviewData.so_sao} sao` : 'Nhấn vào sao để đánh giá'}</p>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung đánh giá *</label>
                                <textarea value={reviewData.noi_dung} onChange={(e) => setReviewData({ ...reviewData, noi_dung: e.target.value })} className="input-field" rows="3" placeholder="Chia sẻ trải nghiệm của bạn về tour này..." />
                                <p className="text-xs text-gray-500 mt-1">{reviewData.noi_dung.length}/10 ký tự tối thiểu</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={handleSubmitReview} disabled={reviewMutation.isLoading} className="btn-primary flex items-center gap-2">
                                    {reviewMutation.isLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
                                </button>
                                <button onClick={() => { setShowReviewForm(false); setReviewData({ so_sao: 0, noi_dung: '' }); }} className="btn-secondary">Hủy</button>
                            </div>
                        </div>
                    )}

                    {booking.danhGia && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h4 className="font-semibold text-gray-700 mb-2">⭐ Đánh giá của bạn</h4>
                            <div className="flex items-center gap-2 mb-2">
                                {renderStars(booking.danhGia.so_sao)}
                                <span className="text-sm text-gray-500">{formatDate(booking.danhGia.ngay_danh_gia)}</span>
                            </div>
                            <p className="text-gray-600">{booking.danhGia.noi_dung}</p>
                        </div>
                    )}
                </div>

                {/* ============================================ */}
                {/* MODAL XÁC NHẬN HỦY ĐƠN HÀNG */}
                {/* ============================================ */}
                {showCancelConfirmModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-gray-800">Xác nhận hủy đơn hàng</h2>
                                <button onClick={() => setShowCancelConfirmModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <XCircleIcon className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <p className="font-medium text-gray-800">Đơn hàng #{booking.ma_don_hang}</p>
                                <p className="text-sm text-gray-500">{booking.lichKhoiHanh?.tour?.ten_tour}</p>
                                <p className="text-sm text-gray-500">Ngày khởi hành: {formatDate(booking.lichKhoiHanh?.ngay_khoi_hanh)}</p>
                                <p className="text-sm text-gray-500">Trạng thái thanh toán: {booking.trang_thai_thanh_toan}</p>
                            </div>

                            <div className={`p-4 rounded-lg mb-4 border ${
                                refundInfo?.percentage === 100 ? 'bg-green-50 border-green-200' : 
                                refundInfo?.percentage === 50 ? 'bg-yellow-50 border-yellow-200' : 
                                'bg-red-50 border-red-200'
                            }`}>
                                <h3 className="font-semibold text-gray-700 mb-2">📋 Chính sách hoàn tiền</h3>
                                
                                <div className="flex justify-between items-center text-sm border-b pb-2 mb-2">
                                    <span className="text-gray-600">Trạng thái thanh toán</span>
                                    <span className={`font-bold ${
                                        booking.trang_thai_thanh_toan === 'Đã thanh toán' 
                                            ? 'text-green-600' 
                                            : booking.trang_thai_thanh_toan === 'Đã đặt cọc'
                                            ? 'text-yellow-600'
                                            : 'text-gray-500'
                                    }`}>
                                        {booking.trang_thai_thanh_toan}
                                    </span>
                                </div>

                                {booking.trang_thai_thanh_toan !== 'Đã thanh toán' && (
                                    <div className="p-3 bg-red-100 rounded-lg mb-2">
                                        <p className="text-sm text-red-700 font-medium">
                                            ⚠️ {refundInfo?.note || 'Chỉ áp dụng hoàn tiền cho đơn đã thanh toán'}
                                        </p>
                                    </div>
                                )}

                                {booking.trang_thai_thanh_toan === 'Đã thanh toán' && (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Số ngày còn lại</span>
                                            <span className="font-bold">{refundInfo?.days || 0} ngày</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Tỷ lệ hoàn tiền</span>
                                            <span className={`font-bold text-lg ${refundInfo?.color}`}>
                                                {refundInfo?.label}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center border-t pt-2">
                                            <span className="text-gray-600">Số tiền hoàn lại</span>
                                            <span className={`font-bold text-lg ${refundInfo?.percentage > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                                {refundInfo?.percentage > 0 
                                                    ? formatCurrency((booking.tong_tien * refundInfo.percentage) / 100)
                                                    : '0₫'}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lý do hủy *</label>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    className="input-field"
                                    rows="3"
                                    placeholder="Vui lòng nhập lý do hủy đơn hàng..."
                                />
                            </div>

                            {refundInfo?.percentage > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-blue-700">💰 Số tiền sẽ được hoàn trong vòng 3-5 ngày làm việc</p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={handleConfirmCancel} disabled={cancelMutation.isLoading} className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors flex-1 disabled:opacity-50">
                                    {cancelMutation.isLoading ? 'Đang xử lý...' : 'Xác nhận hủy đơn'}
                                </button>
                                <button onClick={() => setShowCancelConfirmModal(false)} className="btn-secondary flex-1">
                                    Quay lại
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 text-center mt-4">* Hành động này không thể hoàn tác</p>
                        </div>
                    </div>
                )}

                {/* ============================================ */}
                {/* FORM YÊU CẦU HOÀN TIỀN */}
                {/* ============================================ */}
                {showRefundForm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                            <RefundRequestForm
                                bookingId={parseInt(id)}
                                refundAmount={parseFloat(booking.so_tien_hoan || 0)}
                                onSuccess={() => {
                                    setShowRefundForm(false);
                                    refetch();
                                }}
                                onCancel={() => setShowRefundForm(false)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingDetailPage;