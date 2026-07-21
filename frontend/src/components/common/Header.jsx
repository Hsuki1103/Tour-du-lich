import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  Bars3Icon, 
  XMarkIcon,
  UserCircleIcon,
  ShoppingBagIcon,
  CalendarIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  ChartBarIcon,
  TicketIcon,
  GiftIcon
} from '@heroicons/react/24/outline';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.vaiTro?.ten_vai_tro === 'Admin';
  const isStaff = user?.vaiTro?.ten_vai_tro === 'Nhân viên' || isAdmin;
  const isCustomer = user?.vaiTro?.ten_vai_tro === 'Khách hàng';

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsDropdownOpen(false);
  };

  // ⭐ HÀM XỬ LÝ CLICK VÀO LOGO - VỀ TRANG CHỦ
  const handleLogoClick = () => {
    navigate('/'); // Chuyển về trang chủ
  };

  const getNavLinks = () => {
    const links = [
      { to: '/', label: 'Trang chủ' },
      { to: '/tours', label: 'Tour du lịch' },
    ];

    if (isAuthenticated && isCustomer) {
      links.push({ to: '/my-bookings', label: 'Đơn hàng của tôi' });
    }

    return links;
  };

  const navLinks = getNavLinks();

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container-custom">
        <div className="flex justify-between items-center h-16">
          {/* ⭐ LOGO - BẤM VÀO VỀ TRANG CHỦ */}
          <button 
            onClick={handleLogoClick}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <span className="text-4xl font-bold text-primary-500">Du Lịch</span>
            <span className="text-4xl font-bold text-gray-700">Việt</span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-600 hover:text-primary-500 font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}

            {isStaff && (
              <Link
                to="/admin/dashboard"
                className="text-gray-600 hover:text-primary-500 font-medium transition-colors"
              >
                Quản trị
              </Link>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-500"
                >
                  <UserCircleIcon className="w-8 h-8" />
                  <span className="font-medium">{user?.ho_ten?.split(' ').pop()}</span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 border border-gray-100">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <UserCircleIcon className="w-5 h-5 mr-2" />
                      Hồ sơ của tôi
                    </Link>
                    {isCustomer && (
                      <Link
                        to="/my-bookings"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <CalendarIcon className="w-5 h-5 mr-2" />
                        Đơn hàng của tôi
                      </Link>
                    )}
                    {isStaff && (
                      <>
                        <hr className="my-1" />
                        <Link
                          to="/admin/dashboard"
                          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <ChartBarIcon className="w-5 h-5 mr-2" />
                          Bảng điều khiển
                        </Link>
                      </>
                    )}
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="text-gray-600 hover:text-primary-500">
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {isMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block py-2 text-gray-600 hover:text-primary-500"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isStaff && (
              <Link
                to="/admin/dashboard"
                className="block py-2 text-gray-600 hover:text-primary-500"
                onClick={() => setIsMenuOpen(false)}
              >
                Quản trị
              </Link>
            )}
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="block py-2 text-gray-600 hover:text-primary-500"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Hồ sơ
                </Link>
                {isCustomer && (
                  <Link
                    to="/my-bookings"
                    className="block py-2 text-gray-600 hover:text-primary-500"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Đơn hàng của tôi
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-red-600"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <div className="space-y-2 pt-2">
                <Link
                  to="/login"
                  className="block w-full text-center py-2 text-gray-600 hover:text-primary-500"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="block w-full text-center btn-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;