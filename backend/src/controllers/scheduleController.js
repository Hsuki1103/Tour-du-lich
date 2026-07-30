// backend/src/controllers/scheduleController.js
import { LichKhoiHanh, Tour, PhuongTien, DonDatTour, NguoiDung, LichKhoiHanhPhuongTien } from '../models/index.js';
import { Op } from 'sequelize';

// ============================================
// LẤY DANH SÁCH LỊCH KHỞI HÀNH (ADMIN)
// ============================================
export const getSchedules = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            ma_tour,
            trang_thai,
            tu_ngay,
            den_ngay
        } = req.query;

        console.log('📊 getSchedules - Raw query params:', req.query);

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const where = {};

        // XỬ LÝ ma_tour
        if (ma_tour !== undefined && ma_tour !== null && ma_tour !== '' && ma_tour !== 'undefined' && ma_tour !== 'null') {
            const tourId = parseInt(ma_tour);
            if (!isNaN(tourId) && tourId > 0) {
                where.ma_tour = tourId;
            }
        }

        // XỬ LÝ trang_thai
        if (trang_thai && trang_thai !== '' && trang_thai !== 'undefined' && trang_thai !== 'null') {
            where.trang_thai = trang_thai;
        }

        // XỬ LÝ ngày tháng
        if (tu_ngay && tu_ngay !== '' && tu_ngay !== 'undefined' && tu_ngay !== 'null') {
            const date = new Date(tu_ngay);
            if (!isNaN(date.getTime())) {
                where.ngay_khoi_hanh = {};
                where.ngay_khoi_hanh[Op.gte] = date;
            }
        }

        if (den_ngay && den_ngay !== '' && den_ngay !== 'undefined' && den_ngay !== 'null') {
            const date = new Date(den_ngay);
            if (!isNaN(date.getTime())) {
                if (!where.ngay_khoi_hanh) where.ngay_khoi_hanh = {};
                where.ngay_khoi_hanh[Op.lte] = date;
            }
        }

        // TÌM KIẾM THEO TÊN TOUR
        if (search && search !== '' && search !== 'undefined' && search !== 'null') {
            const tours = await Tour.findAll({
                where: {
                    ten_tour: { [Op.like]: `%${search}%` }
                },
                attributes: ['ma_tour']
            });
            const tourIds = tours.map(t => t.ma_tour);
            if (tourIds.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        items: [],
                        total: 0,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: 0
                    }
                });
            }
            where.ma_tour = { [Op.in]: tourIds };
        }

        console.log('📊 getSchedules - Final WHERE:', JSON.stringify(where, null, 2));

        // LẤY DANH SÁCH VỚI NHIỀU PHƯƠNG TIỆN
        const schedules = await LichKhoiHanh.findAndCountAll({
            where: Object.keys(where).length > 0 ? where : {},
            distinct: true,
            include: [
                {
                    model: Tour,
                    as: 'tour',
                    attributes: ['ma_tour', 'ten_tour', 'diem_den', 'so_ngay']
                },
                {
                    model: PhuongTien,
                    as: 'phuongTiens',
                    through: { attributes: [] },
                    attributes: ['ma_phuong_tien', 'bien_so_xe', 'ten_xe', 'so_cho_ngoi', 'loai_xe', 'hang_xe']
                }
            ],
            order: [['ngay_khoi_hanh', 'ASC']],
            limit: parseInt(limit),
            offset: offset
        });

        // TÍNH TỔNG SỐ CHỖ TỪ NHIỀU XE (MỖI XE 1 CHIẾC)
        const items = schedules.rows.map(schedule => {
            const scheduleData = schedule.toJSON();
            
            let totalSeats = 0;
            let vehicleDetails = [];

            if (schedule.phuongTiens && schedule.phuongTiens.length > 0) {
                schedule.phuongTiens.forEach(vehicle => {
                    const seatsPerVehicle = vehicle.so_cho_ngoi - 1;
                    totalSeats += seatsPerVehicle;
                    
                    vehicleDetails.push({
                        ...vehicle.toJSON(),
                        so_chot_cua_xe: seatsPerVehicle
                    });
                });
            }

            return {
                ...scheduleData,
                so_chot_toi_da: totalSeats > 0 ? totalSeats : schedule.so_chot_toi_da,
                so_chot_con_lai: (totalSeats > 0 ? totalSeats : schedule.so_chot_toi_da) - schedule.so_chot_da_dat,
                phuongTiens: vehicleDetails,
                tong_so_xe: vehicleDetails.length
            };
        });

        res.json({
            success: true,
            data: {
                items,
                total: schedules.count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(schedules.count / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('❌ getSchedules error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy danh sách lịch khởi hành: ' + error.message
        });
    }
};

// ============================================
// LẤY CHI TIẾT LỊCH KHỞI HÀNH
// ============================================
export const getScheduleDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const schedule = await LichKhoiHanh.findByPk(id, {
            include: [
                {
                    model: Tour,
                    as: 'tour',
                    attributes: ['ma_tour', 'ten_tour', 'diem_den', 'so_ngay', 'mo_ta_ngan']
                },
                {
                    model: PhuongTien,
                    as: 'phuongTiens',
                    through: { attributes: [] },
                    attributes: ['ma_phuong_tien', 'bien_so_xe', 'ten_xe', 'so_cho_ngoi', 'loai_xe', 'hang_xe']
                }
            ]
        });

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch khởi hành'
            });
        }

        // Tính tổng số chỗ
        let totalSeats = 0;
        if (schedule.phuongTiens && schedule.phuongTiens.length > 0) {
            schedule.phuongTiens.forEach(vehicle => {
                totalSeats += vehicle.so_cho_ngoi - 1;
            });
        }

        const bookings = await DonDatTour.findAll({
            where: {
                ma_lich_khoi_hanh: id,
                trang_thai_don_hang: {
                    [Op.notIn]: ['Đã hủy']
                }
            },
            include: [
                {
                    model: NguoiDung,
                    as: 'nguoiDung',
                    attributes: ['ho_ten', 'email', 'so_dien_thoai']
                }
            ],
            order: [['ngay_dat', 'DESC']]
        });

        const data = schedule.toJSON();
        data.so_chot_toi_da = totalSeats > 0 ? totalSeats : schedule.so_chot_toi_da;
        data.so_chot_con_lai = data.so_chot_toi_da - schedule.so_chot_da_dat;
        data.don_hang = bookings;

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('❌ getScheduleDetail error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy chi tiết lịch khởi hành: ' + error.message
        });
    }
};

// ============================================
// TẠO LỊCH KHỞI HÀNH VỚI NHIỀU PHƯƠNG TIỆN
// ============================================
export const createSchedule = async (req, res) => {
    const transaction = await LichKhoiHanh.sequelize.transaction();

    try {
        console.log('📝 createSchedule - Body:', JSON.stringify(req.body, null, 2));

        const {
            ma_tour,
            ngay_khoi_hanh,
            so_chot_toi_da,
            gia_nguoi_lon,
            gia_tre_em,
            trang_thai,
            phuong_tiens
        } = req.body;

        // KIỂM TRA DỮ LIỆU ĐẦU VÀO
        if (!ma_tour || isNaN(parseInt(ma_tour))) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn tour hợp lệ'
            });
        }
        if (!ngay_khoi_hanh) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn ngày khởi hành'
            });
        }
        if (!gia_nguoi_lon || parseFloat(gia_nguoi_lon) <= 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập giá người lớn hợp lệ'
            });
        }
        if (gia_tre_em === undefined || gia_tre_em === null || parseFloat(gia_tre_em) < 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập giá trẻ em hợp lệ'
            });
        }

        // Kiểm tra tour tồn tại
        const tour = await Tour.findByPk(parseInt(ma_tour));
        if (!tour) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tour'
            });
        }

        // KIỂM TRA PHƯƠNG TIỆN VÀ TÍNH TỔNG SỐ CHỖ (MỖI XE 1 CHIẾC)
        let totalSeats = 0;
        const vehicleList = [];

        if (phuong_tiens && phuong_tiens.length > 0) {
            for (const item of phuong_tiens) {
                const vehicle = await PhuongTien.findByPk(parseInt(item.ma_phuong_tien));
                if (!vehicle) {
                    await transaction.rollback();
                    return res.status(404).json({
                        success: false,
                        message: `Không tìm thấy phương tiện với mã ${item.ma_phuong_tien}`
                    });
                }
                if (vehicle.trang_thai !== 'Đang hoạt động') {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `Phương tiện ${vehicle.ten_xe} không hoạt động`
                    });
                }
                
                const seatsFromVehicle = vehicle.so_cho_ngoi - 1;
                totalSeats += seatsFromVehicle;
                
                vehicleList.push({
                    ma_phuong_tien: parseInt(item.ma_phuong_tien)
                });
            }
        }

        // ⭐ VALIDATION: KIỂM TRA SỐ CHỖ TỐI ĐA
        const maxSeatsInput = parseInt(so_chot_toi_da);

        // Kiểm tra số chỗ tối đa phải > 0
        if (isNaN(maxSeatsInput) || maxSeatsInput <= 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: '❌ Số chỗ tối đa phải lớn hơn 0. Vui lòng nhập số chỗ hợp lệ.'
            });
        }

        // Kiểm tra số chỗ tối đa không được vượt quá tổng chỗ xe
        if (totalSeats > 0 && maxSeatsInput > totalSeats) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `❌ Số chỗ tối đa (${maxSeatsInput}) không được vượt quá tổng số chỗ của xe (${totalSeats} chỗ). Vui lòng giảm số chỗ tối đa.`
            });
        }

        // Nếu không có phương tiện nào, dùng so_chot_toi_da từ input
        if (totalSeats === 0) {
            if (!so_chot_toi_da || parseInt(so_chot_toi_da) <= 0) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nhập số chỗ tối đa hoặc chọn phương tiện'
                });
            }
            totalSeats = parseInt(so_chot_toi_da);
        }

        // Kiểm tra trùng ngày khởi hành
        const existing = await LichKhoiHanh.findOne({
            where: {
                ma_tour: parseInt(ma_tour),
                ngay_khoi_hanh: new Date(ngay_khoi_hanh)
            }
        });

        if (existing) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Ngày khởi hành này đã có lịch cho tour này'
            });
        }

        // TẠO SCHEDULE
        const schedule = await LichKhoiHanh.create({
            ma_tour: parseInt(ma_tour),
            ngay_khoi_hanh: new Date(ngay_khoi_hanh),
            so_chot_toi_da: totalSeats,
            so_chot_da_dat: 0,
            gia_nguoi_lon: parseFloat(gia_nguoi_lon),
            gia_tre_em: parseFloat(gia_tre_em),
            trang_thai: trang_thai || 'Còn chỗ'
        }, { transaction });

        // LƯU PHƯƠNG TIỆN VÀO BẢNG TRUNG GIAN
        if (vehicleList.length > 0) {
            for (const item of vehicleList) {
                await LichKhoiHanhPhuongTien.create({
                    ma_lich_khoi_hanh: schedule.ma_lich_khoi_hanh,
                    ma_phuong_tien: item.ma_phuong_tien,
                    so_luong_xe: 1
                }, { transaction });
            }
        }

        await transaction.commit();

        // Lấy lại với include
        const result = await LichKhoiHanh.findByPk(schedule.ma_lich_khoi_hanh, {
            include: [
                { model: Tour, as: 'tour', attributes: ['ten_tour', 'diem_den'] },
                {
                    model: PhuongTien,
                    as: 'phuongTiens',
                    through: { attributes: [] }
                }
            ]
        });

        console.log('✅ Schedule created:', result.ma_lich_khoi_hanh);

        res.status(201).json({
            success: true,
            message: 'Tạo lịch khởi hành thành công',
            data: result
        });
    } catch (error) {
        if (transaction && transaction.finished === undefined) {
            await transaction.rollback();
        }
        console.error('❌ createSchedule error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo lịch khởi hành: ' + error.message
        });
    }
};

// ============================================
// CẬP NHẬT LỊCH KHỞI HÀNH
// ============================================
export const updateSchedule = async (req, res) => {
    const transaction = await LichKhoiHanh.sequelize.transaction();

    try {
        const { id } = req.params;
        const {
            ma_tour,
            ngay_khoi_hanh,
            so_chot_toi_da,
            gia_nguoi_lon,
            gia_tre_em,
            trang_thai,
            phuong_tiens
        } = req.body;

        console.log('📝 updateSchedule - ID:', id, 'Body:', JSON.stringify(req.body, null, 2));

        const schedule = await LichKhoiHanh.findByPk(id, {
            include: [
                {
                    model: PhuongTien,
                    as: 'phuongTiens',
                    through: { attributes: [] }
                }
            ]
        });

        if (!schedule) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch khởi hành'
            });
        }

        // KIỂM TRA VÀ TÍNH LẠI SỐ CHỖ TỪ PHƯƠNG TIỆN
        let totalSeats = 0;
        const vehicleList = [];

        if (phuong_tiens && phuong_tiens.length > 0) {
            for (const item of phuong_tiens) {
                const vehicle = await PhuongTien.findByPk(parseInt(item.ma_phuong_tien));
                if (!vehicle) {
                    await transaction.rollback();
                    return res.status(404).json({
                        success: false,
                        message: `Không tìm thấy phương tiện với mã ${item.ma_phuong_tien}`
                    });
                }
                if (vehicle.trang_thai !== 'Đang hoạt động') {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `Phương tiện ${vehicle.ten_xe} không hoạt động`
                    });
                }
                
                const seatsFromVehicle = vehicle.so_cho_ngoi - 1;
                totalSeats += seatsFromVehicle;
                
                vehicleList.push({
                    ma_phuong_tien: parseInt(item.ma_phuong_tien)
                });
            }
        }

        // ⭐ VALIDATION: KIỂM TRA SỐ CHỖ TỐI ĐA
        const maxSeatsInput = parseInt(so_chot_toi_da);

        // Kiểm tra số chỗ tối đa phải > 0
        if (isNaN(maxSeatsInput) || maxSeatsInput <= 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: '❌ Số chỗ tối đa phải lớn hơn 0. Vui lòng nhập số chỗ hợp lệ.'
            });
        }

        // Kiểm tra số chỗ tối đa không được vượt quá tổng chỗ xe
        if (totalSeats > 0 && maxSeatsInput > totalSeats) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `❌ Số chỗ tối đa (${maxSeatsInput}) không được vượt quá tổng số chỗ của xe (${totalSeats} chỗ). Vui lòng giảm số chỗ tối đa.`
            });
        }

        // Nếu không có phương tiện nào, dùng so_chot_toi_da từ input
        if (totalSeats === 0) {
            if (!so_chot_toi_da || parseInt(so_chot_toi_da) <= 0) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nhập số chỗ tối đa hoặc chọn phương tiện'
                });
            }
            totalSeats = parseInt(so_chot_toi_da);
        }

        // Kiểm tra số chỗ đã đặt không vượt quá tổng chỗ mới
        if (schedule.so_chot_da_dat > totalSeats) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Số chỗ đã đặt (${schedule.so_chot_da_dat}) vượt quá số chỗ tối đa mới (${totalSeats})`
            });
        }

        // Kiểm tra trùng ngày khởi hành
        if (ma_tour && ngay_khoi_hanh) {
            const existing = await LichKhoiHanh.findOne({
                where: {
                    ma_tour: parseInt(ma_tour),
                    ngay_khoi_hanh: new Date(ngay_khoi_hanh),
                    ma_lich_khoi_hanh: { [Op.ne]: parseInt(id) }
                }
            });

            if (existing) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Ngày khởi hành này đã có lịch cho tour này'
                });
            }
        }

        // Tự động cập nhật trạng thái
        let finalTrangThai = trang_thai || schedule.trang_thai;
        if (schedule.so_chot_da_dat >= totalSeats) {
            finalTrangThai = 'Hết chỗ';
        } else if (finalTrangThai === 'Hết chỗ') {
            finalTrangThai = 'Còn chỗ';
        }

        // CẬP NHẬT SCHEDULE
        await schedule.update({
            ma_tour: ma_tour ? parseInt(ma_tour) : schedule.ma_tour,
            ngay_khoi_hanh: ngay_khoi_hanh ? new Date(ngay_khoi_hanh) : schedule.ngay_khoi_hanh,
            so_chot_toi_da: totalSeats,
            gia_nguoi_lon: gia_nguoi_lon ? parseFloat(gia_nguoi_lon) : schedule.gia_nguoi_lon,
            gia_tre_em: gia_tre_em ? parseFloat(gia_tre_em) : schedule.gia_tre_em,
            trang_thai: finalTrangThai
        }, { transaction });

        // XÓA PHƯƠNG TIỆN CŨ VÀ THÊM MỚI
        await LichKhoiHanhPhuongTien.destroy({
            where: { ma_lich_khoi_hanh: parseInt(id) },
            transaction
        });

        if (vehicleList.length > 0) {
            for (const item of vehicleList) {
                await LichKhoiHanhPhuongTien.create({
                    ma_lich_khoi_hanh: parseInt(id),
                    ma_phuong_tien: item.ma_phuong_tien,
                    so_luong_xe: 1
                }, { transaction });
            }
        }

        await transaction.commit();

        const result = await LichKhoiHanh.findByPk(id, {
            include: [
                { model: Tour, as: 'tour', attributes: ['ten_tour', 'diem_den'] },
                {
                    model: PhuongTien,
                    as: 'phuongTiens',
                    through: { attributes: [] }
                }
            ]
        });

        res.json({
            success: true,
            message: 'Cập nhật lịch khởi hành thành công',
            data: result
        });
    } catch (error) {
        if (transaction && transaction.finished === undefined) {
            await transaction.rollback();
        }
        console.error('❌ updateSchedule error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi cập nhật lịch khởi hành: ' + error.message
        });
    }
};

// ============================================
// XÓA LỊCH KHỞI HÀNH
// ============================================
export const deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;

        const schedule = await LichKhoiHanh.findByPk(id);

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch khởi hành'
            });
        }

        // Kiểm tra có đơn hàng không
        const bookingCount = await DonDatTour.count({
            where: {
                ma_lich_khoi_hanh: id,
                trang_thai_don_hang: {
                    [Op.notIn]: ['Đã hủy']
                }
            }
        });

        if (bookingCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa lịch khởi hành vì đã có đơn hàng đặt'
            });
        }

        // XÓA CÁC PHƯƠNG TIỆN TRONG BẢNG TRUNG GIAN
        await LichKhoiHanhPhuongTien.destroy({
            where: { ma_lich_khoi_hanh: id }
        });

        await schedule.destroy();

        res.json({
            success: true,
            message: 'Xóa lịch khởi hành thành công'
        });
    } catch (error) {
        console.error('❌ deleteSchedule error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi xóa lịch khởi hành: ' + error.message
        });
    }
};