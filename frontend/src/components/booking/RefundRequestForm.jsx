import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { bookingsAPI } from '../../api/bookings';
import { formatCurrency } from '../../utils/helpers';
import { toast } from 'react-toastify';
import { BanknotesIcon, CheckIcon, XCircleIcon } from '@heroicons/react/24/outline';

const RefundRequestForm = ({ bookingId, refundAmount, onSuccess, onCancel }) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        phuong_thuc: 'chuyen_khoan',
        ten_ngan_hang: '',
        so_tai_khoan: '',
        chu_tai_khoan: '',
        chi_nhanh: '',
        so_dien_thoai: '',
        ghi_chu: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const refundMutation = useMutation(
        (data) => bookingsAPI.requestRefund(data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['booking-detail', bookingId]);
                queryClient.invalidateQueries(['my-bookings']);
                toast.success('✅ Yêu cầu hoàn tiền đã được gửi!');
                setIsSubmitting(false);
                if (onSuccess) onSuccess();
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || '❌ Gửi yêu cầu hoàn tiền thất bại');
                setIsSubmitting(false);
            }
        }
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validation
        if (formData.phuong_thuc === 'chuyen_khoan') {
            if (!formData.ten_ngan_hang) {
                toast.warning('Vui lòng nhập tên ngân hàng');
                return;
            }
            if (!formData.so_tai_khoan) {
                toast.warning('Vui lòng nhập số tài khoản');
                return;
            }
            if (!formData.chu_tai_khoan) {
                toast.warning('Vui lòng nhập tên chủ tài khoản');
                return;
            }
        }
        
        if (!formData.so_dien_thoai) {
            toast.warning('Vui lòng nhập số điện thoại liên hệ');
            return;
        }

        setIsSubmitting(true);
        refundMutation.mutate({
            ma_don_hang: parseInt(bookingId),
            ...formData,
            so_tien_hoan: refundAmount
        });
    };

    return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-700 text-lg flex items-center gap-2">
                    <BanknotesIcon className="w-5 h-5 text-green-500" />
                    Nhận hoàn tiền
                </h3>
                {onCancel && (
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                )}
            </div>

            <div className="mb-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                    💰 Số tiền được hoàn: <strong>{formatCurrency(refundAmount)}</strong>
                </p>
                <p className="text-xs text-green-500">Vui lòng điền thông tin để nhận hoàn tiền</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức nhận hoàn tiền *</label>
                    <select
                        value={formData.phuong_thuc}
                        onChange={(e) => setFormData({ ...formData, phuong_thuc: e.target.value })}
                        className="input-field"
                        disabled={isSubmitting}
                    >
                        <option value="chuyen_khoan">Chuyển khoản ngân hàng</option>
                        <option value="tien_mat">Tiền mặt (tại văn phòng)</option>
                    </select>
                </div>

                {formData.phuong_thuc === 'chuyen_khoan' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên ngân hàng *</label>
                                <input
                                    type="text"
                                    value={formData.ten_ngan_hang}
                                    onChange={(e) => setFormData({ ...formData, ten_ngan_hang: e.target.value })}
                                    className="input-field"
                                    placeholder="Vietcombank, Techcombank, ..."
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chi nhánh</label>
                                <input
                                    type="text"
                                    value={formData.chi_nhanh}
                                    onChange={(e) => setFormData({ ...formData, chi_nhanh: e.target.value })}
                                    className="input-field"
                                    placeholder="Chi nhánh TP.HCM"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số tài khoản *</label>
                                <input
                                    type="text"
                                    value={formData.so_tai_khoan}
                                    onChange={(e) => setFormData({ ...formData, so_tai_khoan: e.target.value })}
                                    className="input-field"
                                    placeholder="0123456789"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên chủ tài khoản *</label>
                                <input
                                    type="text"
                                    value={formData.chu_tai_khoan}
                                    onChange={(e) => setFormData({ ...formData, chu_tai_khoan: e.target.value })}
                                    className="input-field"
                                    placeholder="Nguyễn Văn A"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    </>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại liên hệ *</label>
                    <input
                        type="tel"
                        value={formData.so_dien_thoai}
                        onChange={(e) => setFormData({ ...formData, so_dien_thoai: e.target.value })}
                        className="input-field"
                        placeholder="0912345678"
                        disabled={isSubmitting}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                    <textarea
                        value={formData.ghi_chu}
                        onChange={(e) => setFormData({ ...formData, ghi_chu: e.target.value })}
                        className="input-field"
                        rows="2"
                        placeholder="Ghi chú thêm (nếu có)..."
                        disabled={isSubmitting}
                    />
                </div>

                <div className="flex gap-3">
                    <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2 flex-1">
                        {isSubmitting ? 'Đang xử lý...' : <><CheckIcon className="w-4 h-4" /> Gửi yêu cầu hoàn tiền</>}
                    </button>
                    {onCancel && (
                        <button type="button" onClick={onCancel} className="btn-secondary flex-1" disabled={isSubmitting}>
                            Hủy
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default RefundRequestForm;