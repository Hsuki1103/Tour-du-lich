import React from 'react';

const BookingStatus = ({ status, paymentStatus }) => {
    const getStatusConfig = () => {
        const configs = {
            'Chờ xác nhận': { color: 'badge-warning', label: 'Chờ xác nhận' },
            'Đã xác nhận': { color: 'badge-success', label: 'Đã xác nhận' },
            'Đang diễn ra': { color: 'badge-primary', label: 'Đang diễn ra' },
            'Đã hoàn thành': { color: 'badge-success', label: 'Đã hoàn thành' },
            'Đã hủy': { color: 'badge-danger', label: 'Đã hủy' },
        };
        return configs[status] || { color: 'badge-warning', label: status };
    };

    const getPaymentConfig = () => {
        const configs = {
            'Chưa thanh toán': { color: 'badge-warning', label: 'Chưa thanh toán' },
            'Đã đặt cọc': { color: 'badge-primary', label: 'Đã đặt cọc' },
            'Đã thanh toán': { color: 'badge-success', label: 'Đã thanh toán' },
        };
        return configs[paymentStatus] || { color: 'badge-warning', label: paymentStatus };
    };

    const statusConfig = getStatusConfig();
    const paymentConfig = getPaymentConfig();

    return (
        <div className="flex flex-col gap-1">
            <span className={`badge ${statusConfig.color}`}>
                {statusConfig.label}
            </span>
            <span className={`badge ${paymentConfig.color} text-xs`}>
                {paymentConfig.label}
            </span>
        </div>
    );
};

export default BookingStatus;