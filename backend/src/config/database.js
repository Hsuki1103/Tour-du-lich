import { Sequelize } from 'sequelize';

const DB_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'tour_booking_db'
};

const sequelize = new Sequelize(
  DB_CONFIG.database,
  DB_CONFIG.user,
  DB_CONFIG.password,
  {
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true,
      // ⭐ THÊM DÒNG NÀY ĐỂ TẮT TỰ ĐỘNG TẠO INDEX
      indexes: []
    },
    timezone: '+07:00'
  }
);

export default sequelize;