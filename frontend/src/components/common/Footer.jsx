import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">Công Ty Du Lịch Việt</h3>
            <p className="text-gray-400 text-sm">
              Chuyên cung cấp các tour du lịch trong nước chất lượng cao.
            </p>
            <div className="mt-4 space-y-2 text-sm text-gray-400">
              <p>📍 123 Đường ABC, Quận 1, TP.HCM</p>
              <p>📞 1900 1234</p>
              <p>✉️ info@dulichviet.com</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Liên kết nhanh</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/tours" className="hover:text-white">Tour du lịch</Link></li>
              <li><Link to="/about" className="hover:text-white">Giới thiệu</Link></li>
              <li><Link to="/contact" className="hover:text-white">Liên hệ</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
              <li><Link to="/terms" className="hover:text-white">Điều khoản</Link></li>
              <li><Link to="/privacy" className="hover:text-white">Chính sách bảo mật</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold mb-4">Theo dõi chúng tôi</h4>
            <p className="text-sm text-gray-400 mb-4">
              Đăng ký nhận thông tin khuyến mãi
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Email của bạn"
                className="flex-1 px-4 py-2 rounded-l-lg text-gray-800"
              />
              <button className="btn-primary rounded-l-none">
                Đăng ký
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>© 2024 Công Ty Du Lịch Việt. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;