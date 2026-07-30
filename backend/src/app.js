// backend/src/app.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('🔑 VNP_TMN_CODE:', process.env.VNP_TMN_CODE ? '✅ SET' : '❌ MISSING');

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import fs from 'fs';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import tourRoutes from './routes/tourRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import discountRoutes from './routes/discountRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';

import { errorHandler, notFound } from './middleware/errorHandler.js';
import { sequelize } from './models/index.js';

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting Tour Booking System...');

// ============================================
// TẠO THƯ MỤC UPLOADS
// ============================================
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.mkdirSync(path.join(uploadsDir, 'tours'), { recursive: true });
  fs.mkdirSync(path.join(uploadsDir, 'avatars'), { recursive: true });
  fs.mkdirSync(path.join(uploadsDir, 'vouchers'), { recursive: true });
  console.log('📁 Uploads directory created');
}

// ⭐⭐⭐ QUAN TRỌNG: STATIC FILES - PHẢI ĐẶT TRƯỚC CÁC MIDDLEWARE KHÁC
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
console.log('📁 Static files served from: /uploads');
console.log('📁 Path:', path.join(__dirname, '../uploads'));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
    },
  },
}));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 999999,
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/vehicles', vehicleRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    console.log('🔄 Connecting to MySQL database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully!');

    console.log('🔄 Syncing models with database...');
    await sequelize.sync({ alter: true });
    console.log('✅ Models synchronized successfully!');

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📡 API URL: http://localhost:${PORT}/api`);
      console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
      console.log(`📁 Static files: http://localhost:${PORT}/uploads`);
      console.log(`📊 Database: MySQL (WAMP)`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('🎉 Server ready to accept requests!');
    });
  } catch (error) {
    console.error('❌ Unable to start server:');
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }
};

startServer();

export default app;