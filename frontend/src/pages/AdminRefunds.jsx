// frontend/src/pages/AdminRefunds.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminAPI } from '../api/admin';
import { bookingsAPI } from '../api/bookings';
import AdminLayout from '../components/admin/AdminLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate, formatDateTime } from '../utils/helpers';
import { toast } from 'react-toastify';
import {
    CheckIcon,
    XMarkIcon,
    ClockIcon,
    BanknotesIcon,
    UserIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    DocumentTextIcon,
    XCircleIcon,
    CheckCircleIcon,
    MagnifyingGlassIcon,
    BuildingLibraryIcon,
    IdentificationIcon,
    UserCircleIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

const AdminRefunds = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRefund, setSelectedRefund] = useState(null);
    
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    
    const [adminNote, setAdminNote] = useState('');
    const [rejectReason, setRejectReason] = useState('');

    // Fetch refund requests
    const { data, isLoading, error, refetch } = useQuery(
        ['admin-refunds', page, filter, searchTerm],
        () => bookingsAPI.getRefundRequests({
            page,
            limit: 20,
            status: filter || undefined,
            search: searchTerm || undefined
        }),
        { keepPreviousData: true }
    );

    const refunds = data?.data?.data?.items || [];
    const total = data?.data?.data?.total || 0;
    const totalPages = data?.data?.data?.totalPages || 1;
    const stats = data?.data?.data?.stats || {};

    // Approve refund mutation
    const approveMutation = useMutation(
        ({ id, note }) => bookingsAPI.approveRefund(id, { ghi_chu_admin: note }),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['admin-refunds']);
                toast.success('✅ Xác nhận hoàn tiền thành công!');
                setShowApproveModal(false);
                setAdminNote('');
                refetch();
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || '❌ Xác nhận hoàn tiền thất bại');
            }
        }
    );

    // Reject refund mutation
    const rejectMutation = useMutation(
        ({ id, reason }) => bookingsAPI.rejectRefund(id, { ly_do_tu_choi: reason }),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['admin-refunds']);
                toast.success('✅ Từ chối hoàn tiền thành công!');
                setShowRejectModal(false);
                setRejectReason('');
                refetch();
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || '❌ Từ chối hoàn tiền thất bại');
            }
        }
    );

    // ⭐ HÀM LẤY TRẠNG THÁI BADGE
    const getStatusBadge = (status) => {
        const configs = {
            'Chưa yêu cầu': { color: 'badge-gray', icon: <ClockIcon className="w-4 h-4" />, label: 'Chưa yêu cầu' },
            'Đã yêu cầu': { color: 'badge-warning', icon: <ClockIcon className="w-4 h-4" />, label: 'Đang chờ xử lý' },
            'Đã hoàn': { color: 'badge-success', icon: <CheckCircleIcon className="w-4 h-4" />, label: 'Đã hoàn tiền' },
            'Từ chối': { color: 'badge-danger', icon: <XCircleIcon className="w-4 h-4" />, label: 'Từ chối' },
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
    // ⭐ HÀM RENDER THÔNG TIN CHUYỂN KHOẢN
    // ============================================
    const renderBankingInfo = (thongTinHoanTien) => {
        if (!thongTinHoanTien) return null;
        
        if (thongTinHoanTien.phuong_thuc === 'tien_mat') {
            return (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-gray-500">💵 Khách hàng chọn nhận tiền mặt tại văn phòng</p>
                </div>
            );
        }

        return (
            <div className="bg-blue-50 rounded-lg p-4 space-y-3 border border-blue-200">
                <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                    <BuildingLibraryIcon className="w-5 h-5" />
                    Thông tin tài khoản nhận hoàn tiền
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {thongTinHoanTien.ten_ngan_hang && (
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <BuildingLibraryIcon className="w-3 h-3" />
                                Ngân hàng
                            </p>
                            <p className="font-medium text-gray-800">{thongTinHoanTien.ten_ngan_hang}</p>
                        </div>
                    )}
                    
                    {thongTinHoanTien.so_tai_khoan && (
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <IdentificationIcon className="w-3 h-3" />
                                Số tài khoản
                            </p>
                            <p className="font-mono font-bold text-gray-800">{thongTinHoanTien.so_tai_khoan}</p>
                        </div>
                    )}
                    
                    {thongTinHoanTien.chu_tai_khoan && (
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <UserCircleIcon className="w-3 h-3" />
                                Chủ tài khoản
                            </p>
                            <p className="font-medium text-gray-800">{thongTinHoanTien.chu_tai_khoan}</p>
                        </div>
                    )}
                    
                    {thongTinHoanTien.chi_nhanh && (
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                            <p className="text-xs text-gray-500">Chi nhánh</p>
                            <p className="font-medium text-gray-800">{thongTinHoanTien.chi_nhanh}</p>
                        </div>
                    )}
                </div>
                
                {thongTinHoanTien.so_dien_thoai && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-500">📞 Số điện thoại liên hệ</p>
                        <p className="font-medium text-gray-800">{thongTinHoanTien.so_dien_thoai}</p>
                    </div>
                )}
                
                {thongTinHoanTien.ghi_chu && (
                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <p className="text-xs text-yellow-700">📝 Ghi chú</p>
                        <p className="text-sm text-yellow-800">{thongTinHoanTien.ghi_chu}</p>
                    </div>
                )}

                {thongTinHoanTien.ngay_yeu_cau && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-500">📅 Ngày yêu cầu</p>
                        <p className="font-medium text-gray-800">{formatDateTime(thongTinHoanTien.ngay_yeu_cau)}</p>
                    </div>
                )}

                {thongTinHoanTien.ngay_duyet && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <p className="text-sm text-green-700 flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4" />
                            <strong>Đã duyệt:</strong> {formatDateTime(thongTinHoanTien.ngay_duyet)}
                        </p>
                        {thongTinHoanTien.ghi_chu_admin && (
                            <p className="text-sm text-green-600 mt-1">
                                📝 Ghi chú: {thongTinHoanTien.ghi_chu_admin}
                            </p>
                        )}
                    </div>
                )}

                {thongTinHoanTien.ngay_tu_choi && (
                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                        <p className="text-sm text-red-700 flex items-center gap-2">
                            <XCircleIcon className="w-4 h-4" />
                            <strong>Đã từ chối:</strong> {formatDateTime(thongTinHoanTien.ngay_tu_choi)}
                        </p>
                        <p className="text-sm text-red-600 mt-1">
                            📝 Lý do: {thongTinHoanTien.ly_do_tu_choi}
                        </p>
                    </div>
                )}
            </div>
        );
    };

    // ============================================
    // ⭐ HÀM HIỂN THỊ THÔNG TIN HOÀN TIỀN - SỐ TIỀN KHÔNG GẠCH NGANG
    // ============================================
    const renderRefundInfo = (refundData) => {
        if (!refundData) return null;
        
        const isRejected = refundData.hoan_tien === 'Từ chối';
        const isApproved = refundData.hoan_tien === 'Đã hoàn';
        const isPending = refundData.hoan_tien === 'Đã yêu cầu';
        
        return (
            <div className={`border rounded-lg p-4 ${
                isRejected ? 'bg-red-50 border-red-200' :
                isApproved ? 'bg-green-50 border-green-200' :
                isPending ? 'bg-yellow-50 border-yellow-200' :
                'bg-gray-50'
            }`}>
                {/* ⭐ HEADER VỚI TRẠNG THÁI RÕ RÀNG */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {isRejected ? (
                            <XCircleIcon className="w-5 h-5 text-red-500" />
                        ) : isApproved ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        ) : (
                            <ClockIcon className="w-5 h-5 text-yellow-500" />
                        )}
                        <h3 className="font-semibold text-gray-700">
                            {isRejected ? '❌ Từ chối hoàn tiền' :
                             isApproved ? '✅ Đã hoàn tiền' :
                             '⏳ Đang chờ xử lý'}
                        </h3>
                    </div>
                    {getStatusBadge(refundData.hoan_tien)}
                </div>
                
                {/* ⭐ THÔNG TIN SỐ TIỀN - KHÔNG GẠCH NGANG */}
                <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Số tiền cần hoàn</span>
                        <span className={`font-bold text-xl ${
                            isRejected ? 'text-red-500' : 
                            isApproved ? 'text-green-500' : 
                            'text-yellow-500'
                        }`}>
                            {formatCurrency(refundData.so_tien_hoan)}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>Tổng tiền đơn hàng</span>
                        <span>{formatCurrency(refundData.tong_tien)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>Trạng thái thanh toán</span>
                        <span>{refundData.trang_thai_thanh_toan || 'N/A'}</span>
                    </div>
                </div>

                {/* ⭐ THÔNG TIN NGÂN HÀNG */}
                {renderBankingInfo(refundData.thong_tin_hoan_tien)}
                
                {/* ⭐ HIỂN THỊ LÝ DO TỪ CHỐI */}
                {isRejected && refundData.thong_tin_hoan_tien?.ly_do_tu_choi && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                        <p className="text-sm font-medium text-red-700 flex items-center gap-2">
                            <XCircleIcon className="w-4 h-4" />
                            Lý do từ chối:
                        </p>
                        <p className="text-sm text-red-600 mt-1">
                            {refundData.thong_tin_hoan_tien.ly_do_tu_choi}
                        </p>
                        {refundData.thong_tin_hoan_tien.ngay_tu_choi && (
                            <p className="text-xs text-red-500 mt-1">
                                📅 Từ chối vào: {formatDateTime(refundData.thong_tin_hoan_tien.ngay_tu_choi)}
                            </p>
                        )}
                    </div>
                )}
                
                {/* ⭐ HIỂN THỊ THÔNG BÁO ĐÃ HOÀN */}
                {isApproved && refundData.thong_tin_hoan_tien?.ngay_duyet && (
                    <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded-lg">
                        <p className="text-sm font-medium text-green-700 flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4" />
                            Đã hoàn tiền vào: {formatDateTime(refundData.thong_tin_hoan_tien.ngay_duyet)}
                        </p>
                        {refundData.thong_tin_hoan_tien.ghi_chu_admin && (
                            <p className="text-sm text-green-600 mt-1">
                                📝 Ghi chú: {refundData.thong_tin_hoan_tien.ghi_chu_admin}
                            </p>
                        )}
                    </div>
                )}
                
                {/* ⭐ HIỂN THỊ THÔNG BÁO ĐANG CHỜ */}
                {isPending && (
                    <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                        <p className="text-sm font-medium text-yellow-700 flex items-center gap-2">
                            <ClockIcon className="w-4 h-4" />
                            Đang chờ xử lý
                        </p>
                        <p className="text-sm text-yellow-600 mt-1">
                            Yêu cầu từ: {formatDateTime(refundData.ngay_cap_nhat)}
                        </p>
                    </div>
                )}
            </div>
        );
    };

    // ============================================
    // ⭐ HANDLERS
    // ============================================

    const handleOpenApprove = (refund) => {
        setSelectedRefund(refund);
        setAdminNote('');
        setShowApproveModal(true);
    };

    const handleOpenReject = (refund) => {
        setSelectedRefund(refund);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const handleApprove = () => {
        if (!selectedRefund) return;
        approveMutation.mutate({ 
            id: selectedRefund.ma_don_hang, 
            note: adminNote 
        });
    };

    const handleReject = () => {
        if (!selectedRefund) return;
        if (!rejectReason.trim()) {
            toast.warning('Vui lòng nhập lý do từ chối');
            return;
        }
        rejectMutation.mutate({ 
            id: selectedRefund.ma_don_hang, 
            reason: rejectReason 
        });
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <AdminLayout>
            <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Quản lý hoàn tiền</h1>
                        <p className="text-gray-600">Xem và xử lý các yêu cầu hoàn tiền từ khách hàng</p>
                    </div>
                    <button onClick={() => refetch()} className="btn-secondary flex items-center gap-2">
                        <ArrowPathIcon className="w-4 h-4" />
                        Làm mới
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Tổng yêu cầu</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.total_requests || 0}</p>
                            </div>
                            <DocumentTextIcon className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Đang chờ xử lý</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.pending_count || 0}</p>
                            </div>
                            <ClockIcon className="w-8 h-8 text-yellow-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Đã hoàn tiền</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatCurrency(stats.total_refund_amount || 0)}
                                </p>
                            </div>
                            <CheckCircleIcon className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Từ chối</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {refunds.filter(r => r.hoan_tien === 'Từ chối').length || 0}
                                </p>
                            </div>
                            <XCircleIcon className="w-8 h-8 text-red-500" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo mã đơn, tên khách hàng..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-field pl-10"
                            />
                        </div>
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="input-field w-40"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="Đã yêu cầu">Đang chờ xử lý</option>
                        <option value="Đã hoàn">Đã hoàn tiền</option>
                        <option value="Từ chối">Từ chối</option>
                    </select>
                    {(searchTerm || filter) && (
                        <button
                            onClick={() => { setSearchTerm(''); setFilter(''); }}
                            className="btn-secondary whitespace-nowrap"
                        >
                            Xóa bộ lọc
                        </button>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {error ? (
                        <div className="p-6 text-center text-red-500">Có lỗi xảy ra khi tải danh sách</div>
                    ) : refunds.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tour</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phương thức</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày yêu cầu</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {refunds.map((refund) => (
                                            <tr key={refund.ma_don_hang} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium">#{refund.ma_don_hang}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <img
                                                            src={refund.nguoiDung?.anh_dai_dien || 'https://via.placeholder.com/40'}
                                                            alt={refund.nguoiDung?.ho_ten}
                                                            className="w-8 h-8 rounded-full object-cover"
                                                        />
                                                        <div>
                                                            <p className="font-medium">{refund.nguoiDung?.ho_ten}</p>
                                                            <p className="text-xs text-gray-500">{refund.nguoiDung?.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm">{refund.lichKhoiHanh?.tour?.ten_tour}</p>
                                                    <p className="text-xs text-gray-500">{formatDate(refund.lichKhoiHanh?.ngay_khoi_hanh)}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className={`font-bold ${
                                                        refund.hoan_tien === 'Từ chối' ? 'text-red-500' : 
                                                        refund.hoan_tien === 'Đã hoàn' ? 'text-green-500' : 
                                                        'text-primary-500'
                                                    }`}>
                                                        {formatCurrency(refund.so_tien_hoan)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">Tổng: {formatCurrency(refund.tong_tien)}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm">
                                                        {refund.thong_tin_hoan_tien?.phuong_thuc === 'chuyen_khoan' 
                                                            ? '🏦 Chuyển khoản' 
                                                            : '💵 Tiền mặt'}
                                                    </span>
                                                    {refund.thong_tin_hoan_tien?.ten_ngan_hang && (
                                                        <p className="text-xs text-gray-500">{refund.thong_tin_hoan_tien.ten_ngan_hang}</p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    {formatDateTime(refund.ngay_cap_nhat)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(refund.hoan_tien)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {refund.hoan_tien === 'Đã yêu cầu' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleOpenApprove(refund)}
                                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                    title="Xác nhận hoàn tiền"
                                                                >
                                                                    <CheckIcon className="w-5 h-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleOpenReject(refund)}
                                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Từ chối"
                                                                >
                                                                    <XMarkIcon className="w-5 h-5" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {(refund.hoan_tien === 'Đã hoàn' || refund.hoan_tien === 'Từ chối') && (
                                                            <span className="text-sm text-gray-400">Đã xử lý</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination */}
                            <div className="px-6 py-4 border-t flex justify-between items-center">
                                <p className="text-sm text-gray-500">Hiển thị {refunds.length} / {total} yêu cầu</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-3 py-1 border rounded-lg disabled:opacity-50"
                                    >
                                        Trước
                                    </button>
                                    <span className="px-3 py-1">Trang {page} / {totalPages}</span>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="px-3 py-1 border rounded-lg disabled:opacity-50"
                                    >
                                        Sau
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="p-12 text-center">
                            <BanknotesIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Chưa có yêu cầu hoàn tiền nào</p>
                            <p className="text-sm text-gray-400">Yêu cầu sẽ xuất hiện khi khách hàng hủy đơn và yêu cầu hoàn tiền</p>
                        </div>
                    )}
                </div>

                {/* ============================================ */}
                {/* ⭐ MODAL XÁC NHẬN HOÀN TIỀN */}
                {/* ============================================ */}
                {showApproveModal && selectedRefund && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">✅ Xác nhận hoàn tiền</h3>
                            
                            <div className="bg-green-50 rounded-lg p-4 mb-4">
                                <div className="space-y-2">
                                    <p className="text-sm text-green-700">
                                        💰 Số tiền: <strong>{formatCurrency(selectedRefund.so_tien_hoan)}</strong>
                                    </p>
                                    <p className="text-sm text-green-600">
                                        👤 Khách hàng: {selectedRefund.nguoiDung?.ho_ten}
                                    </p>
                                    <p className="text-sm text-green-600">
                                        📅 Ngày yêu cầu: {formatDateTime(selectedRefund.ngay_cap_nhat)}
                                    </p>
                                    
                                    {selectedRefund.thong_tin_hoan_tien && selectedRefund.thong_tin_hoan_tien.phuong_thuc === 'chuyen_khoan' && (
                                        <div className="mt-3 pt-3 border-t border-green-200">
                                            <p className="text-sm font-medium text-green-700 mb-2">🏦 Thông tin tài khoản nhận hoàn tiền:</p>
                                            <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                                                {selectedRefund.thong_tin_hoan_tien.ten_ngan_hang && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Ngân hàng:</span>
                                                        <span className="font-medium text-gray-700">{selectedRefund.thong_tin_hoan_tien.ten_ngan_hang}</span>
                                                    </div>
                                                )}
                                                {selectedRefund.thong_tin_hoan_tien.so_tai_khoan && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Số tài khoản:</span>
                                                        <span className="font-mono font-bold text-gray-700">{selectedRefund.thong_tin_hoan_tien.so_tai_khoan}</span>
                                                    </div>
                                                )}
                                                {selectedRefund.thong_tin_hoan_tien.chu_tai_khoan && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Chủ tài khoản:</span>
                                                        <span className="font-medium text-gray-700">{selectedRefund.thong_tin_hoan_tien.chu_tai_khoan}</span>
                                                    </div>
                                                )}
                                                {selectedRefund.thong_tin_hoan_tien.chi_nhanh && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Chi nhánh:</span>
                                                        <span className="font-medium text-gray-700">{selectedRefund.thong_tin_hoan_tien.chi_nhanh}</span>
                                                    </div>
                                                )}
                                                {selectedRefund.thong_tin_hoan_tien.so_dien_thoai && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">SĐT liên hệ:</span>
                                                        <span className="font-medium text-gray-700">{selectedRefund.thong_tin_hoan_tien.so_dien_thoai}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {selectedRefund.thong_tin_hoan_tien && selectedRefund.thong_tin_hoan_tien.phuong_thuc === 'tien_mat' && (
                                        <div className="mt-3 pt-3 border-t border-green-200">
                                            <p className="text-sm text-gray-500">💵 Khách hàng chọn nhận tiền mặt tại văn phòng</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (không bắt buộc)</label>
                                <textarea
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    className="input-field"
                                    rows="3"
                                    placeholder="Nhập ghi chú (nếu có)..."
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleApprove}
                                    disabled={approveMutation.isLoading}
                                    className="btn-primary flex-1 disabled:opacity-50"
                                >
                                    {approveMutation.isLoading ? 'Đang xử lý...' : 'Xác nhận hoàn tiền'}
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowApproveModal(false);
                                        setSelectedRefund(null);
                                    }} 
                                    className="btn-secondary flex-1"
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================ */}
                {/* ⭐ MODAL TỪ CHỐI HOÀN TIỀN */}
                {/* ============================================ */}
                {showRejectModal && selectedRefund && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">❌ Từ chối hoàn tiền</h3>
                            
                            <div className="bg-red-50 rounded-lg p-4 mb-4">
                                <div className="space-y-2">
                                    <p className="text-sm text-red-700">
                                        ⚠️ Bạn đang từ chối hoàn tiền cho đơn hàng #{selectedRefund.ma_don_hang}
                                    </p>
                                    <p className="text-sm text-red-600">
                                        💰 Số tiền: <strong>{formatCurrency(selectedRefund.so_tien_hoan)}</strong>
                                    </p>
                                    <p className="text-sm text-red-600">
                                        👤 Khách hàng: {selectedRefund.nguoiDung?.ho_ten}
                                    </p>
                                    <p className="text-sm text-red-600">
                                        📅 Ngày yêu cầu: {formatDateTime(selectedRefund.ngay_cap_nhat)}
                                    </p>
                                    
                                    {selectedRefund.thong_tin_hoan_tien && selectedRefund.thong_tin_hoan_tien.phuong_thuc === 'chuyen_khoan' && (
                                        <div className="mt-3 pt-3 border-t border-red-200">
                                            <p className="text-sm font-medium text-red-700 mb-2">🏦 Thông tin tài khoản nhận hoàn tiền:</p>
                                            <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                                                {selectedRefund.thong_tin_hoan_tien.ten_ngan_hang && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Ngân hàng:</span>
                                                        <span className="font-medium text-gray-700">{selectedRefund.thong_tin_hoan_tien.ten_ngan_hang}</span>
                                                    </div>
                                                )}
                                                {selectedRefund.thong_tin_hoan_tien.so_tai_khoan && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Số tài khoản:</span>
                                                        <span className="font-mono font-bold text-gray-700">{selectedRefund.thong_tin_hoan_tien.so_tai_khoan}</span>
                                                    </div>
                                                )}
                                                {selectedRefund.thong_tin_hoan_tien.chu_tai_khoan && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Chủ tài khoản:</span>
                                                        <span className="font-medium text-gray-700">{selectedRefund.thong_tin_hoan_tien.chu_tai_khoan}</span>
                                                    </div>
                                                )}
                                                {selectedRefund.thong_tin_hoan_tien.chi_nhanh && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Chi nhánh:</span>
                                                        <span className="font-medium text-gray-700">{selectedRefund.thong_tin_hoan_tien.chi_nhanh}</span>
                                                    </div>
                                                )}
                                                {selectedRefund.thong_tin_hoan_tien.so_dien_thoai && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">SĐT liên hệ:</span>
                                                        <span className="font-medium text-gray-700">{selectedRefund.thong_tin_hoan_tien.so_dien_thoai}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {selectedRefund.thong_tin_hoan_tien && selectedRefund.thong_tin_hoan_tien.phuong_thuc === 'tien_mat' && (
                                        <div className="mt-3 pt-3 border-t border-red-200">
                                            <p className="text-sm text-gray-500">💵 Khách hàng chọn nhận tiền mặt tại văn phòng</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lý do từ chối *</label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="input-field"
                                    rows="3"
                                    placeholder="Nhập lý do từ chối..."
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleReject}
                                    disabled={rejectMutation.isLoading || !rejectReason.trim()}
                                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex-1 disabled:opacity-50"
                                >
                                    {rejectMutation.isLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setSelectedRefund(null);
                                    }} 
                                    className="btn-secondary flex-1"
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminRefunds;