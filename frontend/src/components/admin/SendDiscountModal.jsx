// frontend/src/components/admin/SendDiscountModal.jsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminAPI } from '../../api/admin';
import { discountsAPI } from '../../api/discounts';
import { XMarkIcon, UserIcon, CurrencyDollarIcon, EnvelopeIcon, LockClosedIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/helpers';
import { toast } from 'react-toastify';

const SendDiscountModal = ({ discount, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [sendToAll, setSendToAll] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [minSpent, setMinSpent] = useState('');
  const [maxSpent, setMaxSpent] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch customers by spending
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (minSpent) params.min_spent = minSpent;
      if (maxSpent) params.max_spent = maxSpent;
      params.limit = 500;
      
      const response = await adminAPI.getCustomersBySpending(params);
      setCustomers(response.data.data.customers || []);
    } catch (error) {
      toast.error('Lỗi tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sendToAll) {
      fetchCustomers();
    }
  }, [minSpent, maxSpent, sendToAll]);

  // Send discount mutation
  const sendMutation = useMutation(
    (data) => discountsAPI.sendDiscountToCustomers(data),
    {
      onSuccess: (response) => {
        toast.success(response.data.message || 'Gửi mã giảm giá thành công!');
        queryClient.invalidateQueries(['admin-discounts']);
        onSuccess?.();
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gửi mã giảm giá thất bại');
      }
    }
  );

  const handleSend = () => {
    let customerIds = [];
    if (!sendToAll) {
      if (selectedCustomers.length === 0) {
        toast.warning('Vui lòng chọn ít nhất 1 khách hàng');
        return;
      }
      customerIds = selectedCustomers;
    }

    const data = {
      ma_giam_gia: discount?.ma_giam_gia,
      customer_ids: customerIds,
      send_to_all: sendToAll,
      min_spent: minSpent || 0,
      max_spent: maxSpent || null
    };

    sendMutation.mutate(data);
  };

  const toggleCustomer = (customerId) => {
    if (selectedCustomers.includes(customerId)) {
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId));
    } else {
      setSelectedCustomers([...selectedCustomers, customerId]);
    }
  };

  const toggleAllCustomers = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c.ma_nguoi_dung));
    }
  };

  const isPrivate = discount?.loai_ma === 'private';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">📤 Gửi mã giảm giá</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-500">
                Mã: <span className="font-mono font-bold text-primary-500">{discount?.ma_code}</span>
              </p>
              {isPrivate ? (
                <span className="badge badge-primary text-xs flex items-center gap-1">
                  <LockClosedIcon className="w-3 h-3" />
                  Riêng tư
                </span>
              ) : (
                <span className="badge badge-info text-xs flex items-center gap-1">
                  <GlobeAltIcon className="w-3 h-3" />
                  Công khai
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* ⭐ THÔNG BÁO NẾU LÀ MÃ PUBLIC */}
          {!isPrivate && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                ℹ️ Mã này là <strong>mã công khai</strong>, ai cũng có thể sử dụng.
                Bạn không cần gửi riêng. Tuy nhiên, bạn vẫn có thể gửi thông báo cho khách hàng biết về chương trình này.
              </p>
            </div>
          )}

          {/* Send options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn đối tượng nhận
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setSendToAll(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  !sendToAll 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                Chọn khách hàng cụ thể
              </button>
              <button
                onClick={() => setSendToAll(true)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  sendToAll 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                Gửi cho tất cả
              </button>
            </div>
          </div>

          {/* Filter by spending */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              <CurrencyDollarIcon className="w-5 h-5 text-gray-500" />
              Lọc theo tổng chi tiêu
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tối thiểu</label>
                <input
                  type="number"
                  placeholder="0"
                  value={minSpent}
                  onChange={(e) => setMinSpent(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tối đa</label>
                <input
                  type="number"
                  placeholder="Không giới hạn"
                  value={maxSpent}
                  onChange={(e) => setMaxSpent(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
            {!sendToAll && (
              <button
                onClick={fetchCustomers}
                disabled={loading}
                className="mt-3 btn-secondary text-sm"
              >
                {loading ? 'Đang tải...' : '🔄 Cập nhật danh sách'}
              </button>
            )}
          </div>

          {/* Customer list */}
          {!sendToAll && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-gray-500" />
                  Danh sách khách hàng ({customers.length})
                </h4>
                {customers.length > 0 && (
                  <button
                    onClick={toggleAllCustomers}
                    className="text-sm text-primary-500 hover:text-primary-600"
                  >
                    {selectedCustomers.length === customers.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                )}
              </div>
              
              {loading ? (
                <div className="text-center py-4 text-gray-500">Đang tải...</div>
              ) : customers.length === 0 ? (
                <div className="text-center py-4 text-gray-400">
                  Không tìm thấy khách hàng nào
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left w-10">
                          <input
                            type="checkbox"
                            checked={selectedCustomers.length === customers.length && customers.length > 0}
                            onChange={toggleAllCustomers}
                            className="rounded"
                          />
                        </th>
                        <th className="px-3 py-2 text-left">Khách hàng</th>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-right">Tổng chi tiêu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {customers.map((customer) => (
                        <tr key={customer.ma_nguoi_dung} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selectedCustomers.includes(customer.ma_nguoi_dung)}
                              onChange={() => toggleCustomer(customer.ma_nguoi_dung)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-3 py-2 font-medium">{customer.ho_ten}</td>
                          <td className="px-3 py-2 text-gray-500">{customer.email}</td>
                          <td className="px-3 py-2 text-right text-primary-500 font-medium">
                            {formatCurrency(customer.tong_chi_tieu)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {sendToAll && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                📨 Mã giảm giá sẽ được gửi cho tất cả khách hàng đáp ứng điều kiện chi tiêu ở trên.
              </p>
            </div>
          )}

          {/* Summary */}
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-700">
              <strong>Số khách hàng nhận được:</strong>{' '}
              {sendToAll ? 'Tất cả khách hàng' : `${selectedCustomers.length} khách hàng`}
            </p>
            <p className="text-sm text-yellow-700">
              <strong>Mã giảm giá:</strong> {discount?.ma_code} - {discount?.ten_chuong_trinh}
            </p>
            <p className="text-sm text-yellow-700">
              <strong>Loại mã:</strong> {isPrivate ? '🔒 Riêng tư' : '🌐 Công khai'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex gap-3">
          <button
            onClick={handleSend}
            disabled={sendMutation.isLoading}
            className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
          >
            {sendMutation.isLoading ? (
              'Đang gửi...'
            ) : (
              <>
                <EnvelopeIcon className="w-5 h-5" />
                Gửi mã giảm giá
              </>
            )}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendDiscountModal;