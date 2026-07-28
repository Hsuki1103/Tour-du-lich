// frontend/src/pages/MyBookingsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { bookingsAPI } from '../api/bookings';
import { toursAPI } from '../api/tours';
import { paymentsAPI } from '../api/payments';
import RefundRequestForm from '../components/booking/RefundRequestForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import BookingStatus from '../components/booking/BookingStatus';
import { formatCurrency, formatDate } from '../utils/helpers';
import { toast } from 'react-toastify';
import {
    EyeIcon,
    DocumentArrowDownIcon,
    XMarkIcon,
    PencilIcon,
    CheckIcon,
    XCircleIcon,
    ArrowPathIcon,
    CreditCardIcon,
    BuildingOfficeIcon,
    UserIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    BanknotesIcon,
    TrashIcon,
    PlusIcon
} from '@heroicons/react/24/outline';

const MyBookingsPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState('');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State cho modal hủy
    const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
    const [cancelBookingItem, setCancelBookingItem] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [refundInfo, setRefundInfo] = useState(null);

    // State cho form hoàn tiền
    const [showRefundForm, setShowRefundForm] = useState(false);
    const [refundBooking, setRefundBooking] = useState(null);
    const [refundAmount, setRefundAmount] = useState(0);

    // Refetch khi quay lại trang
    useEffect(() => {
        refetch();
        const handleFocus = () => refetch();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    // Fetch bookings
    const { data, isLoading, error, refetch } = useQuery(
        ['my-bookings', page, filter],
        () => bookingsAPI.getMyBookings({ page, limit: 10, trang_thai: filter || undefined }),
        {
            keepPreviousData: true,
            refetchOnWindowFocus: true,
            refetchOnMount: true,
            staleTime: 0
        }
    );

    const bookings = data?.data?.data?.items || [];
    const total = data?.data?.data?.total || 0;
    const totalPages = data?.data?.data?.totalPages || 1;

    // ============================================
    // TÍNH TOÁN % HOÀN TIỀN
    // ============================================
    const calculateRefundPercentage = (departureDate, paymentStatus) => {
        if (!departureDate) {
            return { 
                percentage: 0, 
                label: 'Không hoàn tiền', 
                color: 'text-red-500', 
                days: 0,
                note: 'Không có ngày khởi hành'
            };
        }
        
        if (paymentStatus !== 'Đã thanh toán') {
            if (paymentStatus === 'Đã đặt cọc') {
                return { 
                    percentage: 0, 
                    label: 'Không hoàn tiền (đã đặt cọc)', 
                    color: 'text-red-500', 
                    days: 0,
                    note: 'Đơn hàng đã đặt cọc không được hoàn tiền'
                };
            }
            return { 
                percentage: 0, 
                label: 'Không hoàn tiền (chưa thanh toán)', 
                color: 'text-red-500', 
                days: 0,
                note: 'Chỉ áp dụng hoàn tiền cho đơn đã thanh toán'
            };
        }
        
        const now = new Date();
        const departure = new Date(departureDate);
        const daysUntilDeparture = Math.ceil((departure - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDeparture >= 7) {
            return { 
                percentage: 100, 
                label: 'Hoàn 100%', 
                color: 'text-green-500', 
                days: daysUntilDeparture,
                note: 'Hủy trước 7 ngày - Hoàn 100% tiền'
            };
        } else if (daysUntilDeparture >= 3) {
            return { 
                percentage: 50, 
                label: 'Hoàn 50%', 
                color: 'text-yellow-500', 
                days: daysUntilDeparture,
                note: 'Hủy trước 3 ngày - Hoàn 50% tiền'
            };
        } else if (daysUntilDeparture > 0) {
            return { 
                percentage: 0, 
                label: 'Không hoàn tiền', 
                color: 'text-red-500', 
                days: daysUntilDeparture,
                note: 'Hủy dưới 3 ngày - Không hoàn tiền'
            };
        } else {
            return { 
                percentage: 0, 
                label: 'Đã quá hạn hủy', 
                color: 'text-gray-500', 
                days: 0,
                note: 'Tour đã khởi hành hoặc đã quá hạn hủy'
            };
        }
    };

    // ============================================
    // MUTATIONS
    // ============================================
    const cancelMutation = useMutation(
        ({ id, ly_do }) => bookingsAPI.cancelBooking(id, { ly_do }),
        {
            onSuccess: (response) => {
                const refund = response.data.data.so_tien_hoan_lai || 0;
                const refundLabel = response.data.data.refund_label || 'Không hoàn tiền';
                
                queryClient.invalidateQueries(['my-bookings']);
                
                if (refund > 0) {
                    toast.success(`✅ Hủy đơn hàng thành công! Số tiền hoàn lại: ${formatCurrency(refund)}`);
                    setRefundBooking(cancelBookingItem);
                    setRefundAmount(refund);
                    setShowRefundForm(true);
                } else {
                    toast.success(`✅ Hủy đơn hàng thành công! (${refundLabel})`);
                }
                setShowCancelConfirmModal(false);
                setCancelBookingItem(null);
                refetch();
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || '❌ Hủy đơn thất bại');
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
    const handleViewDetail = (bookingId) => {
        navigate(`/my-bookings/${bookingId}`);
    };

    const handleCancelClick = (booking) => {
        const refund = calculateRefundPercentage(
            booking.lichKhoiHanh?.ngay_khoi_hanh,
            booking.trang_thai_thanh_toan
        );
        setRefundInfo(refund);
        setCancelBookingItem(booking);
        setCancelReason('');
        setShowCancelConfirmModal(true);
    };

    const handleConfirmCancel = () => {
        if (!cancelReason.trim()) {
            toast.warning('Vui lòng nhập lý do hủy');
            return;
        }
        cancelMutation.mutate({
            id: cancelBookingItem.ma_don_hang,
            ly_do: cancelReason
        });
    };

    const handleDownloadVoucher = (bookingId) => {
        downloadMutation.mutate(bookingId);
    };

    const getDaysUntilDeparture = (departureDate) => {
        if (!departureDate) return 0;
        return Math.ceil((new Date(departureDate) - new Date()) / (1000 * 60 * 60 * 24));
    };

    const hasOfflinePaymentNote = (booking) => {
        return booking?.yeu_cau_dac_biet?.includes('KHÁCH HÀNG CHỌN THANH TOÁN TẠI VĂN PHÒNG');
    };

    const filters = [
        { value: '', label: 'Tất cả' },
        { value: 'Chờ xác nhận', label: 'Chờ xác nhận' },
        { value: 'Đã xác nhận', label: 'Đã xác nhận' },
        { value: 'Đang diễn ra', label: 'Đang diễn ra' },
        { value: 'Đã hoàn thành', label: 'Đã hoàn thành' },
        { value: 'Đã hủy', label: 'Đã hủy' },
    ];

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="container-custom py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Đơn hàng của tôi</h1>
                    <p className="text-gray-600 mt-1">Quản lý các tour đã đặt</p>
                </div>
                <button onClick={() => refetch()} className="btn-secondary flex items-center gap-2">
                    <ArrowPathIcon className="w-4 h-4" />
                    Làm mới
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
                {filters.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            filter === f.value ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {error ? (
                <div className="text-center py-12">
                    <p className="text-red-500">Có lỗi xảy ra khi tải danh sách đơn hàng</p>
                    <button onClick={() => refetch()} className="btn-primary mt-4">Thử lại</button>
                </div>
            ) : bookings.length > 0 ? (
                <>
                    <div className="space-y-4">
                        {bookings.map((booking) => {
                            const daysUntilDeparture = getDaysUntilDeparture(booking.lichKhoiHanh?.ngay_khoi_hanh);
                            const canCancel = (booking.trang_thai_don_hang === 'Chờ xác nhận' || booking.trang_thai_don_hang === 'Đã xác nhận') && daysUntilDeparture > 0;
                            const canDownloadVoucher = booking.trang_thai_thanh_toan === 'Đã thanh toán' || booking.trang_thai_thanh_toan === 'Đã đặt cọc';
                            const hasOfflineNote = hasOfflinePaymentNote(booking);
                            const isDepositPaid = booking.trang_thai_thanh_toan === 'Đã đặt cọc' && booking.tien_con_lai > 0;

                            return (
                                <div key={booking.ma_don_hang} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                    {hasOfflineNote && (
                                        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 flex items-center gap-2">
                                            <BuildingOfficeIcon className="w-4 h-4 text-blue-500" />
                                            <span className="text-xs text-blue-600">Đã ghi nhận thanh toán tại văn phòng</span>
                                        </div>
                                    )}
                                    <div className="p-4 md:p-6 border-b">
                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Mã đơn hàng</p>
                                                <p className="font-semibold text-lg">#{booking.ma_don_hang}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Tour</p>
                                                <p className="font-medium">{booking.lichKhoiHanh?.tour?.ten_tour || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Ngày khởi hành</p>
                                                <p className="font-medium">{formatDate(booking.lichKhoiHanh?.ngay_khoi_hanh)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Tổng tiền</p>
                                                <p className="font-bold text-primary-500 text-lg">{formatCurrency(booking.tong_tien)}</p>
                                            </div>
                                            <div>
                                                <BookingStatus status={booking.trang_thai_don_hang} paymentStatus={booking.trang_thai_thanh_toan} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex flex-wrap gap-2">
                                            {/* Nút Chi tiết */}
                                            <button onClick={() => handleViewDetail(booking.ma_don_hang)} className="btn-secondary text-sm flex items-center gap-1">
                                                <EyeIcon className="w-4 h-4" /> Chi tiết
                                            </button>
                                            
                                            {/* Nút Tải vé */}
                                            {canDownloadVoucher && (
                                                <button onClick={() => handleDownloadVoucher(booking.ma_don_hang)} className="btn-secondary text-sm flex items-center gap-1" disabled={downloadMutation.isLoading}>
                                                    <DocumentArrowDownIcon className="w-4 h-4" />
                                                    {downloadMutation.isLoading ? 'Đang tải...' : 'Tải vé'}
                                                </button>
                                            )}
                                            
                                            {/* ⭐ NÚT THANH TOÁN PHẦN CÒN LẠI - KHI ĐÃ ĐẶT CỌC */}
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
                                                    className="btn-primary text-sm flex items-center gap-1"
                                                >
                                                    <CreditCardIcon className="w-4 h-4" />
                                                    Thanh toán còn lại ({formatCurrency(booking.tien_con_lai)})
                                                </button>
                                            )}
                                            
                                            {/* ⭐ NÚT THANH TOÁN LẦN ĐẦU - KHI CHƯA THANH TOÁN */}
                                            {booking.trang_thai_don_hang === 'Chờ xác nhận' && booking.trang_thai_thanh_toan === 'Chưa thanh toán' && (
                                                <button onClick={() => navigate(`/payment/${booking.ma_don_hang}`)} className="btn-primary text-sm">
                                                    Thanh toán
                                                </button>
                                            )}
                                            
                                          {/* ⭐ NÚT HỦY ĐƠN - Ở SAU CÙNG */}
                                                                      {canCancel && (
                                                                          <button onClick={handleCancelClick} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2" disabled={cancelMutation.isLoading}>
                                                                              <XMarkIcon className="w-5 h-5" />
                                                                              {cancelMutation.isLoading ? 'Đang xử lý...' : 'Hủy đơn hàng'}
                                                                          </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                </>
            ) : (
                <div className="text-center py-16 bg-white rounded-xl">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <DocumentArrowDownIcon className="w-12 h-12 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg">Bạn chưa có đơn hàng nào</p>
                    <p className="text-gray-400 text-sm mt-1">Hãy đặt tour ngay hôm nay!</p>
                    <button onClick={() => navigate('/tours')} className="btn-primary mt-4">Khám phá tour</button>
                </div>
            )}

            {/* ============================================ */}
            {/* MODAL XÁC NHẬN HỦY ĐƠN HÀNG */}
            {/* ============================================ */}
            {showCancelConfirmModal && cancelBookingItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-800">Xác nhận hủy đơn hàng</h2>
                            <button onClick={() => setShowCancelConfirmModal(false)} className="text-gray-500 hover:text-gray-700">
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <p className="font-medium text-gray-800">Đơn hàng #{cancelBookingItem.ma_don_hang}</p>
                            <p className="text-sm text-gray-500">{cancelBookingItem.lichKhoiHanh?.tour?.ten_tour}</p>
                            <p className="text-sm text-gray-500">Ngày khởi hành: {formatDate(cancelBookingItem.lichKhoiHanh?.ngay_khoi_hanh)}</p>
                            <p className="text-sm text-gray-500">Trạng thái thanh toán: {cancelBookingItem.trang_thai_thanh_toan}</p>
                        </div>

                        <div className={`p-4 rounded-lg mb-4 border ${
                            refundInfo?.percentage === 100 ? 'bg-green-50 border-green-200' : 
                            refundInfo?.percentage === 50 ? 'bg-yellow-50 border-yellow-200' : 
                            'bg-red-50 border-red-200'
                        }`}>
                            <h3 className="font-semibold text-gray-700 mb-2">Chính sách hoàn tiền</h3>
                            
                            <div className="flex justify-between items-center text-sm border-b pb-2 mb-2">
                                <span className="text-gray-600">Trạng thái thanh toán</span>
                                <span className={`font-bold ${
                                    cancelBookingItem.trang_thai_thanh_toan === 'Đã thanh toán' 
                                        ? 'text-green-600' 
                                        : cancelBookingItem.trang_thai_thanh_toan === 'Đã đặt cọc'
                                        ? 'text-yellow-600'
                                        : 'text-gray-500'
                                }`}>
                                    {cancelBookingItem.trang_thai_thanh_toan}
                                </span>
                            </div>

                            {cancelBookingItem.trang_thai_thanh_toan !== 'Đã thanh toán' && (
                                <div className="p-3 bg-red-100 rounded-lg mb-2">
                                    <p className="text-sm text-red-700 font-medium">
                                        ⚠️ {refundInfo?.note || 'Chỉ áp dụng hoàn tiền cho đơn đã thanh toán'}
                                    </p>
                                </div>
                            )}

                            {cancelBookingItem.trang_thai_thanh_toan === 'Đã thanh toán' && (
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
                                                ? formatCurrency((cancelBookingItem.tong_tien * refundInfo.percentage) / 100)
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
                                <p className="text-sm text-blue-700">Số tiền sẽ được hoàn trong vòng 3-5 ngày làm việc</p>
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
            {showRefundForm && refundBooking && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <RefundRequestForm
                            bookingId={refundBooking.ma_don_hang}
                            refundAmount={refundAmount}
                            onSuccess={() => {
                                setShowRefundForm(false);
                                setRefundBooking(null);
                                setRefundAmount(0);
                                refetch();
                            }}
                            onCancel={() => {
                                setShowRefundForm(false);
                                setRefundBooking(null);
                                setRefundAmount(0);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyBookingsPage;