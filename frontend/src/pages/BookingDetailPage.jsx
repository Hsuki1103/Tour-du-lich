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
    BuildingLibraryIcon,
    IdentificationIcon,
    UserCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

// ⭐ HÀM HELPER ĐỂ PARSE thong_tin_khach
const parseGuestList = (thongTinKhach) => {
    if (!thongTinKhach) return [];
    if (Array.isArray(thongTinKhach)) return thongTinKhach;
    if (typeof thongTinKhach === 'string') {
        try {
            const parsed = JSON.parse(thongTinKhach);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }
    return [];
};

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
    // ⭐ HÀM HIỂN THỊ THÔNG TIN HOÀN TIỀN
    // ============================================
    const renderRefundInfo = () => {
        if (!booking || booking.trang_thai_don_hang !== 'Đã hủy') return null;

        const thongTin = booking.thong_tin_hoan_tien || {};
        const isRejected = booking.hoan_tien === 'Từ chối';
        const isApproved = booking.hoan_tien === 'Đã hoàn';
        const isPending = booking.hoan_tien === 'Đã yêu cầu';
        const hasRefundStatus = booking.hoan_tien && booking.hoan_tien !== 'Chưa yêu cầu';
        
        if (!hasRefundStatus) return null;
        
        // ⭐ XÁC ĐỊNH SỐ TIỀN HIỂN THỊ
        let displayAmount = 0;
        let displayLabel = '';
        
        if (isRejected) {
            displayAmount = thongTin.so_tien_yeu_cau || booking.so_tien_hoan || 0;
            displayLabel = 'Số tiền yêu cầu (đã bị từ chối)';
        } else if (isApproved) {
            displayAmount = booking.so_tien_hoan || 0;
            displayLabel = 'Số tiền đã hoàn';
        } else {
            displayAmount = booking.so_tien_hoan || 0;
            displayLabel = 'Số tiền yêu cầu';
        }
        
        // ⭐ XÁC ĐỊNH MÀU SẮC
        let bgColor = 'bg-gray-50 border-gray-200';
        let iconColor = 'text-gray-400';
        let headerBg = 'bg-gray-100';
        let headerText = 'text-gray-700';
        let borderColor = 'border-gray-300';
        
        if (isRejected) {
            bgColor = 'bg-red-50 border-red-200';
            iconColor = 'text-red-500';
            headerBg = 'bg-red-100';
            headerText = 'text-red-700';
            borderColor = 'border-red-300';
        } else if (isApproved) {
            bgColor = 'bg-green-50 border-green-200';
            iconColor = 'text-green-500';
            headerBg = 'bg-green-100';
            headerText = 'text-green-700';
            borderColor = 'border-green-300';
        } else if (isPending) {
            bgColor = 'bg-yellow-50 border-yellow-200';
            iconColor = 'text-yellow-500';
            headerBg = 'bg-yellow-100';
            headerText = 'text-yellow-700';
            borderColor = 'border-yellow-300';
        }

        const bankInfo = thongTin;
        const isBankTransfer = bankInfo?.phuong_thuc === 'chuyen_khoan';

        return (
            <div className={`p-4 border-b ${bgColor}`}>
                {/* HEADER */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${headerBg}`}>
                            {isRejected ? (
                                <XCircleIcon className={`w-6 h-6 ${iconColor}`} />
                            ) : isApproved ? (
                                <CheckCircleIcon className={`w-6 h-6 ${iconColor}`} />
                            ) : (
                                <ClockIcon className={`w-6 h-6 ${iconColor}`} />
                            )}
                        </div>
                        <div>
                            <p className={`font-bold text-lg ${headerText}`}>
                                {isRejected ? '❌ Từ chối hoàn tiền' : 
                                 isApproved ? '✅ Đã hoàn tiền' : 
                                 '⏳ Đang chờ xử lý'}
                            </p>
                            {isRejected && (
                                <p className="text-sm text-red-600">
                                    Yêu cầu hoàn tiền của bạn đã bị từ chối
                                </p>
                            )}
                            {isApproved && (
                                <p className="text-sm text-green-600">
                                    Tiền đã được hoàn vào tài khoản của bạn
                                </p>
                            )}
                            {isPending && (
                                <p className="text-sm text-yellow-600">
                                    Đang xử lý yêu cầu của bạn
                                </p>
                            )}
                        </div>
                    </div>
                    <div>
                        {getRefundStatusBadge(booking.hoan_tien, thongTin)}
                    </div>
                </div>

                {/* THÔNG TIN SỐ TIỀN */}
                <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-white rounded-lg border ${borderColor} mb-3`}>
                    <div>
                        <p className="text-xs text-gray-500">{displayLabel}</p>
                        <p className={`font-bold text-lg ${
                            isRejected ? 'text-red-500 line-through' : 
                            isApproved ? 'text-green-500' : 
                            'text-primary-500'
                        }`}>
                            {formatCurrency(displayAmount)}
                        </p>
                        {isRejected && (
                            <p className="text-xs text-red-500">⚠️ Đã từ chối, không hoàn tiền</p>
                        )}
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Tổng tiền đơn hàng</p>
                        <p className="font-medium text-gray-700">
                            {formatCurrency(booking.tong_tien)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Trạng thái thanh toán</p>
                        <p className="font-medium text-gray-700">
                            {booking.trang_thai_thanh_toan || 'N/A'}
                        </p>
                    </div>
                </div>

                {/* THÔNG TIN CHI TIẾT */}
                <div className="space-y-3">
                    {/* Thông tin ngân hàng */}
                    {bankInfo && Object.keys(bankInfo).length > 0 && (
                        <div className={`bg-white rounded-lg p-3 border ${borderColor}`}>
                            <h4 className={`font-semibold ${headerText} mb-2 flex items-center gap-2`}>
                                {isBankTransfer ? (
                                    <BuildingLibraryIcon className="w-5 h-5" />
                                ) : (
                                    <BanknotesIcon className="w-5 h-5" />
                                )}
                                {isBankTransfer ? 'Thông tin chuyển khoản' : 'Phương thức nhận tiền'}
                            </h4>
                            
                            {isBankTransfer ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    {bankInfo.ten_ngan_hang && (
                                        <div className="flex justify-between border-b border-gray-100 pb-1">
                                            <span className="text-gray-500">Ngân hàng</span>
                                            <span className="font-medium text-gray-700">{bankInfo.ten_ngan_hang}</span>
                                        </div>
                                    )}
                                    {bankInfo.so_tai_khoan && (
                                        <div className="flex justify-between border-b border-gray-100 pb-1">
                                            <span className="text-gray-500">Số tài khoản</span>
                                            <span className="font-mono font-bold text-gray-700">{bankInfo.so_tai_khoan}</span>
                                        </div>
                                    )}
                                    {bankInfo.chu_tai_khoan && (
                                        <div className="flex justify-between border-b border-gray-100 pb-1">
                                            <span className="text-gray-500">Chủ tài khoản</span>
                                            <span className="font-medium text-gray-700">{bankInfo.chu_tai_khoan}</span>
                                        </div>
                                    )}
                                    {bankInfo.chi_nhanh && (
                                        <div className="flex justify-between border-b border-gray-100 pb-1">
                                            <span className="text-gray-500">Chi nhánh</span>
                                            <span className="font-medium text-gray-700">{bankInfo.chi_nhanh}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-600 text-sm">💵 Nhận tiền mặt tại văn phòng</p>
                            )}
                            
                            {bankInfo.so_dien_thoai && (
                                <div className="mt-2 text-sm flex items-center gap-2 text-gray-600">
                                    <span>📞</span>
                                    <span>SĐT liên hệ: <strong>{bankInfo.so_dien_thoai}</strong></span>
                                </div>
                            )}
                            
                            {bankInfo.ghi_chu && (
                                <div className="mt-2 p-2 bg-yellow-50 rounded-lg text-sm text-yellow-700">
                                    📝 Ghi chú: {bankInfo.ghi_chu}
                                </div>
                            )}
                        </div>
                    )}

                    {/* THỜI GIAN YÊU CẦU */}
                    {bankInfo.ngay_yeu_cau && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white rounded-lg p-2 border border-gray-100">
                            <CalendarIcon className="w-4 h-4" />
                            <span>Yêu cầu vào: <strong>{formatDateTime(bankInfo.ngay_yeu_cau)}</strong></span>
                        </div>
                    )}

                    {/* HIỂN THỊ THÔNG TIN DUYỆT - CHỈ KHI ĐÃ HOÀN */}
                    {isApproved && bankInfo.ngay_duyet && (
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                            <div className="flex items-center gap-2 text-sm text-green-700">
                                <CheckCircleIcon className="w-4 h-4" />
                                <span><strong>Đã duyệt:</strong> {formatDateTime(bankInfo.ngay_duyet)}</span>
                            </div>
                            {bankInfo.ghi_chu_admin && (
                                <p className="text-sm text-green-600 mt-1">
                                    📝 Ghi chú: {bankInfo.ghi_chu_admin}
                                </p>
                            )}
                        </div>
                    )}

                    {/* HIỂN THỊ THÔNG TIN TỪ CHỐI - CHỈ KHI BỊ TỪ CHỐI */}
                    {isRejected && (
                        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                            <div className="flex items-start gap-2">
                                <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-red-700">Lý do từ chối:</p>
                                    <p className="text-sm text-red-600 mt-1">
                                        {bankInfo.ly_do_tu_choi || 'Không có lý do cụ thể'}
                                    </p>
                                    {bankInfo.ngay_tu_choi && (
                                        <p className="text-xs text-red-500 mt-2">
                                            📅 Từ chối vào: {formatDateTime(bankInfo.ngay_tu_choi)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* HIỂN THỊ TRẠNG THÁI ĐANG CHỜ XỬ LÝ */}
                    {isPending && (
                        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                            <div className="flex items-center gap-2 text-sm text-yellow-700">
                                <ClockIcon className="w-4 h-4 animate-spin" />
                                <span>Yêu cầu đang được xử lý, vui lòng chờ trong 3-5 ngày làm việc</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* NÚT YÊU CẦU HOÀN TIỀN */}
                {booking.hoan_tien === 'Chưa yêu cầu' && (
                    <div className="mt-3">
                        <button 
                            onClick={() => setShowRefundForm(true)}
                            className="btn-primary text-sm whitespace-nowrap flex items-center gap-2"
                        >
                            <BanknotesIcon className="w-4 h-4" />
                            Yêu cầu hoàn tiền
                        </button>
                    </div>
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
    
    const isDepositPaid = booking.trang_thai_thanh_toan === 'Đã đặt cọc' && booking.tien_con_lai > 0;

    // ⭐ PARSE GUEST LIST
    const guestList = parseGuestList(booking.thong_tin_khach);

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
                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${booking.trang_thai_thanh_toan === 'Đã thanh toán' ? 'bg-green-100 text-green-700' : booking.trang_thai_thanh_toan === 'Đã đặt cọc' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
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

                {/* HIỂN THỊ THÔNG TIN HOÀN TIỀN */}
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

                    {/* Guest Info - ĐÃ SỬA LỖI */}
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
                        
                        {/* ⭐ HIỂN THỊ DANH SÁCH HÀNH KHÁCH - ĐÃ SỬA LỖI */}
                        {guestList.length > 0 && (
                            <div className="mt-3">
                                <p className="text-gray-500 text-sm mb-2">Danh sách hành khách:</p>
                                <div className="bg-white rounded-lg border p-3 space-y-1">
                                    {guestList.map((guest, index) => (
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
                                    <span className={`font-bold ${
                                        booking.hoan_tien === 'Từ chối' ? 'text-red-500' : 
                                        booking.hoan_tien === 'Đã hoàn' ? 'text-green-600' : 
                                        'text-yellow-600'
                                    }`}>
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

                {/* MODAL XÁC NHẬN HỦY ĐƠN HÀNG */}
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

                {/* FORM YÊU CẦU HOÀN TIỀN */}
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