// backend/src/models/LichKhoiHanh.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const LichKhoiHanh = sequelize.define('LichKhoiHanh', {
    ma_lich_khoi_hanh: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ma_tour: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tour',
            key: 'ma_tour'
        }
    },
    // ⭐ ĐÃ XÓA ma_phuong_tien - KHÔNG CÒN DÙNG NỮA
    ngay_khoi_hanh: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    so_chot_toi_da: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    so_chot_da_dat: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    gia_nguoi_lon: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    gia_tre_em: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    so_chot_con_lai: {
        type: DataTypes.VIRTUAL,
        get() {
            return this.so_chot_toi_da - this.so_chot_da_dat;
        }
    },
    trang_thai: {
        type: DataTypes.ENUM('Còn chỗ', 'Hết chỗ', 'Đã khởi hành', 'Đã hủy'),
        defaultValue: 'Còn chỗ'
    },
    ngay_tao: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    ngay_cap_nhat: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'lich_khoi_hanh',
    timestamps: true,
    createdAt: 'ngay_tao',
    updatedAt: 'ngay_cap_nhat'
});

export default LichKhoiHanh;