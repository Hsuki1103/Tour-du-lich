import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toursAPI } from '../api/tours';
import AdminLayout from '../components/admin/AdminLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TourForm from '../components/admin/TourForm';
import { formatCurrency, formatDate } from '../utils/helpers';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CalendarIcon,
  EyeIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const AdminTours = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingTour, setEditingTour] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTour, setSelectedTour] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKhuVuc, setFilterKhuVuc] = useState('');
  const [filterTrangThai, setFilterTrangThai] = useState('');
  const [page, setPage] = useState(1);

  const isEditing = !!id;

  // ⭐ Fetch tours với bộ lọc
  const { data, isLoading, error } = useQuery(
    ['admin-tours', page, searchTerm, filterKhuVuc, filterTrangThai],
    () => toursAPI.getTours({ 
      page, 
      limit: 20, 
      search: searchTerm || undefined,
      khu_vuc: filterKhuVuc || undefined,
      trang_thai: filterTrangThai || undefined
    })
  );

  const tours = data?.data?.data?.items || [];
  const total = data?.data?.data?.total || 0;
  const totalPages = data?.data?.data?.totalPages || 1;

  // ⭐ THỐNG KÊ TOUR
  const stats = {
    total: tours.length,
    active: tours.filter(t => t.trang_thai === 'Đang hoạt động').length,
    hetCho: tours.filter(t => t.trang_thai === 'Hết chỗ').length,
    ngungBan: tours.filter(t => t.trang_thai === 'Ngừng bán').length,
  };

  // Delete mutation
  const deleteMutation = useMutation(
    (tourId) => toursAPI.deleteTour(tourId),
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

  // Fetch single tour for editing
  const { data: tourData, isLoading: tourLoading } = useQuery(
    ['tour-detail', id],
    () => toursAPI.getTourDetail(id),
    { enabled: !!id }
  );

  useEffect(() => {
    if (id && tourData) {
      setEditingTour(tourData.data.data);
      setShowForm(true);
    }
  }, [id, tourData]);

  const handleDelete = (tourId, tourName) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa tour "${tourName}"?`)) {
      deleteMutation.mutate(tourId);
    }
  };

  const handleEdit = (tour) => {
    setEditingTour(tour);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTour(null);
    if (id) {
      navigate('/admin/tours');
    }
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries(['admin-tours']);
    handleFormClose();
  };

  const handleViewSchedules = (tour) => {
    setSelectedTour(tour);
    setShowScheduleModal(true);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterKhuVuc('');
    setFilterTrangThai('');
    setPage(1);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Quản lý tour</h1>
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

        {/* ⭐ THỐNG KÊ TOUR */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-sm text-gray-500">Tổng số tour</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-green-50 rounded-xl shadow-sm p-4 text-center border border-green-200">
            <p className="text-sm text-green-600">Đang hoạt động</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-red-50 rounded-xl shadow-sm p-4 text-center border border-red-200">
            <p className="text-sm text-red-600">Hết chỗ</p>
            <p className="text-2xl font-bold text-red-600">{stats.hetCho}</p>
          </div>
          <div className="bg-gray-50 rounded-xl shadow-sm p-4 text-center border border-gray-200">
            <p className="text-sm text-gray-500">Ngừng bán</p>
            <p className="text-2xl font-bold text-gray-500">{stats.ngungBan}</p>
          </div>
        </div>

        {/* ⭐ TÌM KIẾM NÂNG CAO */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, điểm đến..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          <select
            value={filterKhuVuc}
            onChange={(e) => setFilterKhuVuc(e.target.value)}
            className="input-field w-40"
          >
            <option value="">Tất cả khu vực</option>
            <option value="Miền Bắc">Miền Bắc</option>
            <option value="Miền Trung">Miền Trung</option>
            <option value="Miền Nam">Miền Nam</option>
          </select>

          <select
            value={filterTrangThai}
            onChange={(e) => setFilterTrangThai(e.target.value)}
            className="input-field w-40"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Đang hoạt động">Đang hoạt động</option>
            <option value="Hết chỗ">Hết chỗ</option>
            <option value="Ngừng bán">Ngừng bán</option>
          </select>

          {(searchTerm || filterKhuVuc || filterTrangThai) && (
            <button
              onClick={handleResetFilters}
              className="btn-secondary whitespace-nowrap"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Tours Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {error ? (
            <div className="p-6 text-center text-red-500">
              Có lỗi xảy ra khi tải danh sách tour
            </div>
          ) : tours.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tour</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điểm đến</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khu vực</th>
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
                              onError={(e) => { e.target.src = 'https://picsum.photos/seed/tour/100/100'; }}
                            />
                            <span className="font-medium text-gray-800 line-clamp-2">{tour.ten_tour}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{tour.diem_den}</td>
                        <td className="px-6 py-4">
                          <span className="badge badge-primary">{tour.khu_vuc || 'N/A'}</span>
                        </td>
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
                              disabled={deleteMutation.isLoading}
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
                    className="px-3 py-1 border rounded-lg disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <span className="px-3 py-1">
                    Trang {page} / {totalPages}
                  </span>
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
              <p className="text-gray-500">Không tìm thấy tour nào</p>
              <button
                onClick={handleResetFilters}
                className="btn-secondary mt-2 mr-2"
              >
                Xóa bộ lọc
              </button>
              <button
                onClick={() => {
                  setEditingTour(null);
                  setShowForm(true);
                }}
                className="btn-primary mt-2"
              >
                Thêm tour đầu tiên
              </button>
            </div>
          )}
        </div>

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
                    onClick={handleFormClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                <TourForm
                  tour={editingTour}
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormClose}
                />
              </div>
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        {showScheduleModal && selectedTour && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Lịch khởi hành - {selectedTour.ten_tour}
                  </h2>
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                
                {selectedTour.lichKhoiHanhs?.length > 0 ? (
                  <div className="space-y-3">
                    {selectedTour.lichKhoiHanhs.map((schedule) => (
                      <div key={schedule.ma_lich_khoi_hanh} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-800">
                              {formatDate(schedule.ngay_khoi_hanh)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Chỗ: {schedule.so_chot_da_dat}/{schedule.so_chot_toi_da}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-primary-500">
                              {formatCurrency(schedule.gia_nguoi_lon)} / người lớn
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatCurrency(schedule.gia_tre_em)} / trẻ em
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Chưa có lịch khởi hành</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTours;