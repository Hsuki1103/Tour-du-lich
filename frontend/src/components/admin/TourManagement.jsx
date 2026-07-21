import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toursAPI } from '../../api/tours';
import { formatCurrency } from '../../utils/helpers';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CalendarIcon,
  EyeIcon,
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import TourForm from './TourForm';
import ScheduleManagement from './ScheduleManagement';

const TourManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingTour, setEditingTour] = useState(null);
  const [selectedTour, setSelectedTour] = useState(null);
  const [showSchedules, setShowSchedules] = useState(false);

  const { data, isLoading, error } = useQuery(
    ['admin-tours', page, searchTerm],
    () => toursAPI.getTours({ 
      page, 
      limit: 10, 
      search: searchTerm || undefined 
    }),
    { keepPreviousData: true }
  );

  const tours = data?.data?.data?.items || [];
  const total = data?.data?.data?.total || 0;
  const totalPages = data?.data?.data?.totalPages || 1;

  const deleteMutation = useMutation(
    (id) => toursAPI.deleteTour(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-tours']);
        alert('Xóa tour thành công!');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Xóa tour thất bại');
      }
    }
  );

  const handleDelete = (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa tour "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (tour) => {
    setEditingTour(tour);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries(['admin-tours']);
    setShowForm(false);
    setEditingTour(null);
  };

  const handleViewSchedules = (tour) => {
    setSelectedTour(tour);
    setShowSchedules(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quản lý tour</h2>
          <p className="text-gray-600">Thêm, sửa, xóa và quản lý các tour du lịch</p>
        </div>
        <button
          onClick={() => {
            setEditingTour(null);
            setShowForm(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Thêm tour
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tour..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Tour List */}
      {error ? (
        <div className="text-center py-12 text-red-500">
          Có lỗi xảy ra khi tải danh sách tour
        </div>
      ) : tours.length > 0 ? (
        <>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tour</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điểm đến</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số ngày</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tours.map((tour) => (
                    <tr key={tour.ma_tour} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={tour.hinh_anh || '/images/tour-placeholder.jpg'}
                            alt={tour.ten_tour}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <span className="font-medium text-gray-800 line-clamp-2">
                            {tour.ten_tour}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{tour.diem_den}</td>
                      <td className="px-6 py-4">{tour.so_ngay} ngày</td>
                      <td className="px-6 py-4 font-medium text-primary-500">
                        {tour.lichKhoiHanhs?.length > 0 
                          ? formatCurrency(Math.min(...tour.lichKhoiHanhs.map(l => l.gia_nguoi_lon)))
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${
                          tour.trang_thai === 'Đang hoạt động' 
                            ? 'badge-success' 
                            : tour.trang_thai === 'Hết chỗ'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}>
                          {tour.trang_thai}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewSchedules(tour)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem lịch khởi hành"
                          >
                            <CalendarIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(tour)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Sửa"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tour.ma_tour, tour.ten_tour)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Hiển thị {tours.length} / {total} tour
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Trước
                </button>
                <span className="px-3 py-1">
                  Trang {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl">
          <p className="text-gray-500">Chưa có tour nào</p>
          <button
            onClick={() => {
              setEditingTour(null);
              setShowForm(true);
            }}
            className="btn-primary mt-4"
          >
            Thêm tour đầu tiên
          </button>
        </div>
      )}

      {/* Tour Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingTour ? 'Sửa tour' : 'Thêm tour mới'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingTour(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <TourForm
                tour={editingTour}
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setShowForm(false);
                  setEditingTour(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Schedules Modal */}
      {showSchedules && selectedTour && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Lịch khởi hành - {selectedTour.ten_tour}
                </h2>
                <button
                  onClick={() => {
                    setShowSchedules(false);
                    setSelectedTour(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <ScheduleManagement tourId={selectedTour.ma_tour} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourManagement;