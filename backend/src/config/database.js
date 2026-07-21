import { Sequelize } from 'sequelize';

// === CẤU HÌNH KẾT NỐI WAMP ===
// Nếu WAMP của bạn có mật khẩu, thay đổi password
const DB_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',  // ← Nếu có mật khẩu, điền vào đây
  database: 'tour_booking_db'
};

console.log('📊 Database Config:');
console.log(`   Host: ${DB_CONFIG.host}`);
console.log(`   Port: ${DB_CONFIG.port}`);
console.log(`   User: ${DB_CONFIG.user}`);
console.log(`   Database: ${DB_CONFIG.database}`);

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
      paranoid: true
    },
    timezone: '+07:00'
  }
);

// Thêm hàm test kết nối
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

export default sequelize;