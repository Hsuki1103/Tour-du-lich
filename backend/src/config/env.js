import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Export biến môi trường
export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  },
  
  // VNPay
  vnpay: {
    tmnCode: process.env.VNP_TMN_CODE,
    hashSecret: process.env.VNP_HASH_SECRET,
    url: process.env.VNP_URL,
    returnUrl: process.env.VNP_RETURN_URL,
    ipnUrl: process.env.VNP_IPN_URL,
  },
  
  // Frontend
  clientUrl: process.env.CLIENT_URL,
};

console.log('✅ Config loaded:');
console.log('🔑 VNP_TMN_CODE:', config.vnpay.tmnCode ? '✅ SET' : '❌ MISSING');
console.log('🔑 VNP_HASH_SECRET:', config.vnpay.hashSecret ? '✅ SET' : '❌ MISSING');

export default config;