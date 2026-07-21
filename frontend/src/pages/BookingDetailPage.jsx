import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { bookingsAPI } from '../api/bookings';
import { toursAPI } from '../api/tours';
import { reviewsAPI } from '../api/reviews';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/helpers';
import { 
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon,
  XCircleIcon,
  StarIcon as StarOutlineIcon,
  CalendarIcon,
  UserIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

const BookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    so_sao: 0,
    noi_dung: '',
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [editData, setEditData] = useState({
    so_luong_nguoi_lon: 0,
    so_luong_tre_em: 0,
  });
  const [diffInfo, setDiffInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduleInfo, setScheduleInfo] = useState(null);

  // Fetch booking detail
  const { data, isLoading, error, refetch } = useQuery(
    ['booking-detail', id],
    () => bookingsAPI.getBookingDetail(id),
    { enabled: !!id }
  );

  const booking = data?.data?.data;

  // Fetch schedule info for edit
  useEffect(() => {
    const fetchScheduleInfo = async () => {
      if (booking?.ma_lich_khoi_hanh) {
        try {
          const response = await toursAPI.getScheduleDetail(booking.ma_lich_khoi_hanh);
          setScheduleInfo(response.data.data);
        } catch (error) {
          console.error('Error fetching schedule:', error);
        }
      }
    };
    if (booking) {
      fetchScheduleInfo();
      setEditData({
        so_luong_nguoi_lon: booking.so_luong_nguoi_lon || 0,
        so_luong_tre_em: booking.so_luong_tre_em || 0,
      });
    }
  }, [booking]);

  // Calculate total price for edit
  const calculateTotal = (adultCount, childCount) => {
    if (!scheduleInfo) return { tong_tien: 0, tien_coc: 0 };
    
    const giaNguoiLon = parseFloat(scheduleInfo.gia_nguoi_lon) || 0;
    const giaTreEm = parseFloat(scheduleInfo.gia_tre_em) || 0;
    
    const tongTien = (adultCount * giaNguoiLon) + (childCount * giaTreEm);
    const tienCoc = tongTien * 0.3;
    
    return { tong_tien: tongTien, tien_coc: tienCoc };
  };

  // Update total when edit data changes
  useEffect(() => {
    if (scheduleInfo) {
      const { tong_tien, tien_coc } = calculateTotal(
        parseInt(editData.so_luong_nguoi_lon) || 0,
        parseInt(editData.so_luong_tre_em) || 0
      );
      // Store for display
    }
  }, [editData, scheduleInfo]);

  // Cancel booking mutation
  const cancelMutation = useMutation(
    ({ id, ly_do }) => bookingsAPI.cancelBooking(id, { ly_do }),
    {
      onSuccess: (response) => {
        const refund = response.data.data.so_tien_hoan_lai || 0;
        queryClient.invalidateQueries(['booking-detail', id]);
        queryClient.invalidateQueries(['my-bookings']);
        alert(`✅ Hủy đơn hàng thành công!\n💰 Số tiền hoàn lại: ${formatCurrency(refund)}`);
        refetch();
      },
      onError: (error) => {
        alert(error.response?.data?.message || '❌ Hủy đơn thất bại');
      }
    }
  );

  // Update booking by customer
  const updateMutation = useMutation(
    ({ id, data }) => bookingsAPI.updateBookingByCustomer(id, data),
    {
      onSuccess: (response) => {
        const data = response.data.data;
        setDiffInfo({
          diff_amount: data.diff_amount,
          additional_amount: data.additional_amount,
          refund_amount: data.refund_amount,
          message: data.message,
          days_until_departure: data.days_until_departure
        });
        queryClient.invalidateQueries(['booking-detail', id]);
        queryClient.invalidateQueries(['my-bookings']);
        setIsEditing(false);
        setIsSubmitting(false);
        alert(data.message);
        refetch();
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Cập nhật đơn hàng thất bại');
        setIsSubmitting(false);
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
        alert('✅ Cảm ơn bạn đã đánh giá!');
        refetch();
      },
      onError: (error) => {
        alert(error.response?.data?.message || '❌ Gửi đánh giá thất bại');
      }
    }
  );

  const handleCancelBooking = () => {
    const ly_do = prompt('Nhập lý do hủy đơn hàng:');
    if (ly_do !== null) {
      cancelMutation.mutate({ id: parseInt(id), ly_do: ly_do || 'Khách hàng hủy' });
    }
  };

  const handleDownloadVoucher = async () => {
    try {
      const response = await bookingsAPI.downloadVoucher(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `voucher_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert(error.response?.data?.message || 'Tải vé thất bại');
    }
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditData({
      so_luong_nguoi_lon: booking.so_luong_nguoi_lon || 0,
      so_luong_tre_em: booking.so_luong_tre_em || 0,
    });
    setDiffInfo(null);
  };

  const handleSaveEdit = () => {
    const totalGuests = (parseInt(editData.so_luong_nguoi_lon) || 0) + (parseInt(editData.so_luong_tre_em) || 0);
    if (totalGuests === 0) {
      alert('Vui lòng chọn ít nhất 1 khách');
      return;
    }

    setIsSubmitting(true);
    updateMutation.mutate({
      id: parseInt(id),
      data: {
        so_luong_nguoi_lon: parseInt(editData.so_luong_nguoi_lon) || 0,
        so_luong_tre_em: parseInt(editData.so_luong_tre_em) || 0,
      }
    });
  };

  const handleSubmitReview = () => {
    if (reviewData.so_sao === 0) {
      alert('Vui lòng chọn số sao đánh giá');
      return;
    }
    if (reviewData.noi_dung.length < 10) {
      alert('Vui lòng nhập nội dung đánh giá (tối thiểu 10 ký tự)');
      return;
    }

    reviewMutation.mutate({
      ma_don_hang: parseInt(id),
      so_sao: reviewData.so_sao,
      noi_dung: reviewData.noi_dung,
    });
  };

  const renderStars = (rating, interactive = false) => {
    const stars = [];
    const displayRating = interactive ? (hoverRating || reviewData.so_sao) : rating;
    for (let i = 1; i <= 5; i++) {
      stars.push(
        interactive ? (
          <button
            key={i}
            type="button"
            onClick={() => setReviewData({ ...reviewData, so_sao: i })}
            onMouseEnter={() => setHoverRating(i)}
            onMouseLeave={() => setHoverRating(0)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            {i <= displayRating ? (
              <StarSolidIcon className="w-8 h-8 text-yellow-400" />
            ) : (
              <StarOutlineIcon className="w-8 h-8 text-gray-300" />
            )}
          </button>
        ) : (
          <span key={i}>
            {i <= rating ? (
              <StarSolidIcon className="w-4 h-4 text-yellow-400 inline" />
            ) : (
              <StarOutlineIcon className="w-4 h-4 text-gray-300 inline" />
            )}
          </span>
        )
      );
    }
    return stars;
  };

  const getDaysUntilDeparture = (departureDate) => {
    if (!departureDate) return 0;
    return Math.ceil((new Date(departureDate) - new Date()) / (1000 * 60 * 60 * 24));
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="container-custom py-12 text-center">
        <p className="text-red-500">Có lỗi xảy ra khi tải thông tin đơn hàng</p>
        <button onClick={() => navigate('/my-bookings')} className="btn-primary mt-4">
          Quay lại
        </button>
      </div>
    );
  }
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

  const daysUntilDeparture = getDaysUntilDeparture(booking.lichKhoiHanh?.ngay_khoi_hanh);
  const canCancel = (booking.trang_thai_don_hang === 'Chờ xác nhận' || 
                   booking.trang_thai_don_hang === 'Đã xác nhận') &&
                   daysUntilDeparture > 0;
  const canDownloadVoucher = booking.trang_thai_thanh_toan === 'Đã thanh toán' ||
                            booking.trang_thai_thanh_toan === 'Đã đặt cọc';
  const canEdit = daysUntilDeparture >= 7 && 
                  booking.trang_thai_don_hang !== 'Đã hủy' && 
                  booking.trang_thai_don_hang !== 'Đã hoàn thành' &&
                  booking.trang_thai_don_hang !== 'Đang diễn ra';
  const canReview = booking.trang_thai_don_hang === 'Đã hoàn thành' && !booking.danhGia;

  // Calculate edit total
  const editTotal = scheduleInfo ? calculateTotal(
    parseInt(editData.so_luong_nguoi_lon) || 0,
    parseInt(editData.so_luong_tre_em) || 0
  ) : { tong_tien: 0, tien_coc: 0 };

  return (
    <div className="container-custom py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/my-bookings')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Quay lại danh sách đơn hàng
      </button>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-primary-50 to-white">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Đơn hàng #{booking.ma_don_hang}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Ngày đặt: {formatDate(booking.ngay_dat)}
              </p>
              {booking.lichKhoiHanh?.ngay_khoi_hanh && (
                <p className="text-sm mt-1">
                  <span className="text-gray-500">Ngày khởi hành:</span>{' '}
                  <span className="font-medium">{formatDate(booking.lichKhoiHanh.ngay_khoi_hanh)}</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    daysUntilDeparture >= 7 ? 'bg-green-100 text-green-700' : 
                    daysUntilDeparture > 0 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {daysUntilDeparture > 0 ? `Còn ${daysUntilDeparture} ngày` : 'Đã quá hạn'}
                  </span>
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {canDownloadVoucher && (
                <button
                  onClick={handleDownloadVoucher}
                  className="btn-primary flex items-center gap-2"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Tải vé
                </button>
              )}
              {canCancel && (
                <button
                  onClick={handleCancelBooking}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                  disabled={cancelMutation.isLoading}
                >
                  <XMarkIcon className="w-5 h-5" />
                  {cancelMutation.isLoading ? 'Đang xử lý...' : 'Hủy đơn hàng'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ⭐ EDIT SECTION - GIỐNG FORM ĐẶT TOUR */}
        {isEditing ? (
          <div className="p-6 bg-yellow-50 border-b border-yellow-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-700 text-lg">✏️ Chỉnh sửa đơn hàng</h3>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setDiffInfo(null);
                }}
                className="text-gray-500 hover:text-gray-700"
                disabled={isSubmitting}
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Người lớn</label>
                <input
                  type="number"
                  min="0"
                  value={editData.so_luong_nguoi_lon}
                  onChange={(e) => setEditData({ 
                    ...editData, 
                    so_luong_nguoi_lon: parseInt(e.target.value) || 0 
                  })}
                  className="input-field"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trẻ em</label>
                <input
                  type="number"
                  min="0"
                  value={editData.so_luong_tre_em}
                  onChange={(e) => setEditData({ 
                    ...editData, 
                    so_luong_tre_em: parseInt(e.target.value) || 0 
                  })}
                  className="input-field"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* ⭐ HIỂN THỊ GIÁ CHI TIẾT - GIỐNG FORM ĐẶT TOUR */}
            {scheduleInfo && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4 max-w-md">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Người lớn x {editData.so_luong_nguoi_lon || 0}</span>
                  <span>{formatCurrency((scheduleInfo.gia_nguoi_lon || 0) * (editData.so_luong_nguoi_lon || 0))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Trẻ em x {editData.so_luong_tre_em || 0}</span>
                  <span>{formatCurrency((scheduleInfo.gia_tre_em || 0) * (editData.so_luong_tre_em || 0))}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                  <span>Tổng tiền mới</span>
                  <span className="text-primary-500">{formatCurrency(editTotal.tong_tien)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Tiền cọc (30%)</span>
                  <span>{formatCurrency(editTotal.tien_coc)}</span>
                </div>
              </div>
            )}

            {diffInfo && (
              <div className={`mt-4 p-3 rounded-lg max-w-md ${
                diffInfo.diff_amount > 0 ? 'bg-red-50 border border-red-200' : 
                diffInfo.diff_amount < 0 ? 'bg-green-50 border border-green-200' : 
                'bg-gray-50 border border-gray-200'
              }`}>
                <p className={`font-medium ${
                  diffInfo.diff_amount > 0 ? 'text-red-600' : 
                  diffInfo.diff_amount < 0 ? 'text-green-600' : 
                  'text-gray-600'
                }`}>
                  {diffInfo.message}
                </p>
                {diffInfo.additional_amount > 0 && (
                  <p className="text-sm text-red-500 mt-1">
                    💰 Cần thanh toán thêm: <strong>{formatCurrency(diffInfo.additional_amount)}</strong>
                  </p>
                )}
                {diffInfo.refund_amount > 0 && (
                  <p className="text-sm text-green-500 mt-1">
                    💰 Số tiền hoàn lại: <strong>{formatCurrency(diffInfo.refund_amount)}</strong>
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSaveEdit}
                disabled={isSubmitting}
                className="btn-primary flex items-center gap-2"
              >
                {isSubmitting ? (
                  'Đang xử lý...'
                ) : (
                  <><CheckIcon className="w-4 h-4" /> Cập nhật</>
                )}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setDiffInfo(null);
                }}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Hủy
              </button>
            </div>
          </div>
        ) : (
          /* ⭐ NÚT CHỈNH SỬA */
          canEdit && (
            <div className="p-4 bg-blue-50 border-b border-blue-200 flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-700">✏️ Bạn có thể chỉnh sửa số lượng khách</p>
                <p className="text-xs text-blue-500">Còn {daysUntilDeparture} ngày trước khi khởi hành</p>
              </div>
              <button
                onClick={handleStartEdit}
                className="btn-primary flex items-center gap-2"
              >
                <PencilIcon className="w-4 h-4" />
                Chỉnh sửa
              </button>
            </div>
          )
        )}

        {/* ⭐ NỘI DUNG CHI TIẾT */}
        <div className="p-6 space-y-6">
          {/* Tour Info */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3 text-lg flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Thông tin tour
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-lg p-4">
              <div>
                <p className="text-gray-500">Tour</p>
                <p className="font-medium">{booking.lichKhoiHanh?.tour?.ten_tour}</p>
              </div>
              <div>
                <p className="text-gray-500">Điểm đến</p>
                <p>{booking.lichKhoiHanh?.tour?.diem_den}</p>
              </div>
              <div>
                <p className="text-gray-500">Ngày khởi hành</p>
                <p className="font-medium">{formatDate(booking.lichKhoiHanh?.ngay_khoi_hanh)}</p>
              </div>
              <div>
                <p className="text-gray-500">Số ngày</p>
                <p>{booking.lichKhoiHanh?.tour?.so_ngay} ngày</p>
              </div>
            </div>
          </div>

          {/* Guest Info */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3 text-lg flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Thông tin khách
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
                      <span>{guest.ho_ten}</span>
                      <span className="text-gray-500">
                        {guest.loai_khach === 'nguoi_lon' ? 'Người lớn' : 'Trẻ em'}
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
              <CurrencyDollarIcon className="w-5 h-5" />
              Thông tin thanh toán
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
                <span className={`badge ${
                  booking.trang_thai_thanh_toan === 'Đã thanh toán' ? 'badge-success' :
                  booking.trang_thai_thanh_toan === 'Đã đặt cọc' ? 'badge-primary' : 'badge-warning'
                }`}>
                  {booking.trang_thai_thanh_toan}
                </span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3 text-lg">📊 Trạng thái</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Trạng thái đơn hàng</span>
                <span className={`badge ${
                  booking.trang_thai_don_hang === 'Đã xác nhận' || booking.trang_thai_don_hang === 'Đã hoàn thành'
                    ? 'badge-success'
                    : booking.trang_thai_don_hang === 'Đã hủy'
                    ? 'badge-danger'
                    : 'badge-warning'
                }`}>
                  {booking.trang_thai_don_hang}
                </span>
              </div>
              {booking.ly_do_huy && (
                <div className="flex justify-between text-sm text-red-600 pt-2 border-t">
                  <span className="text-gray-500">Lý do hủy</span>
                  <span>{booking.ly_do_huy}</span>
                </div>
              )}
            </div>
          </div>

          {/* ⭐ ĐÁNH GIÁ SAU TOUR */}
          {canReview && !showReviewForm && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-sm text-green-700">⭐ Đánh giá tour của bạn</p>
                <p className="text-xs text-green-500">Chia sẻ trải nghiệm của bạn về tour này</p>
              </div>
              <button
                onClick={() => setShowReviewForm(true)}
                className="btn-primary flex items-center gap-2"
              >
                <ChatBubbleLeftIcon className="w-4 h-4" />
                Đánh giá
              </button>
            </div>
          )}

          {showReviewForm && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-gray-700">⭐ Đánh giá tour</h4>
                <button
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewData({ so_sao: 0, noi_dung: '' });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn số sao</label>
                <div className="flex gap-1">
                  {renderStars(0, true)}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {reviewData.so_sao > 0 ? `Bạn đã chọn ${reviewData.so_sao} sao` : 'Nhấn vào sao để đánh giá'}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung đánh giá *</label>
                <textarea
                  value={reviewData.noi_dung}
                  onChange={(e) => setReviewData({ ...reviewData, noi_dung: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Chia sẻ trải nghiệm của bạn về tour này..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {reviewData.noi_dung.length}/10 ký tự tối thiểu
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSubmitReview}
                  disabled={reviewMutation.isLoading}
                  className="btn-primary flex items-center gap-2"
                >
                  {reviewMutation.isLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
                <button
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewData({ so_sao: 0, noi_dung: '' });
                  }}
                  className="btn-secondary"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* ⭐ HIỂN THỊ ĐÁNH GIÁ ĐÃ CÓ */}
          {booking.danhGia && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">⭐ Đánh giá của bạn</h4>
              <div className="flex items-center gap-2 mb-2">
                {renderStars(booking.danhGia.so_sao)}
                <span className="text-sm text-gray-500">
                  {formatDate(booking.danhGia.ngay_danh_gia)}
                </span>
              </div>
              <p className="text-gray-600">{booking.danhGia.noi_dung}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            {booking.trang_thai_don_hang === 'Chờ xác nhận' && 
             booking.trang_thai_thanh_toan === 'Chưa thanh toán' && (
              <button
                onClick={() => navigate(`/payment/${booking.ma_don_hang}`)}
                className="btn-primary"
              >
                Thanh toán ngay
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailPage;