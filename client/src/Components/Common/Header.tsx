// 📁 src/components/Header.jsx
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaShoppingCart, FaUser } from 'react-icons/fa';
import { IoIosArrowDown } from 'react-icons/io';
import logo from './img/Logo/image 15.png';

const Header = () => {
  const [openDropdown, setOpenDropdown] = useState(false);
  const dropdownRef = useRef(null);
  let timeout: any;

  const handleMouseEnter = () => {
    clearTimeout(timeout);
    setOpenDropdown(true);
  };

  const handleMouseLeave = () => {
    timeout = setTimeout(() => {
      setOpenDropdown(false);
    }, 200);
  };

  return (
    <header className="shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img
            src={logo}
            alt="Livento"
            className="h-12 object-contain scale-150"
          />
        </Link>

        <div className="w-1/2 mx-6">
          <div className="flex border rounded overflow-hidden">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full px-4 py-1.5 focus:outline-none"
            />
            <button className="bg-gray-800 text-white px-4">
              <FaSearch />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <Link to="/login" className="flex items-center gap-1">
            <FaUser className="text-lg" /> Đăng nhập / Đăng ký
          </Link>
          <Link to="/account" className="hidden md:inline">
            Tài khoản của tôi
          </Link>
          <Link to="/cart" className="flex items-center gap-1">
            <FaShoppingCart className="text-lg" /> Giỏ hàng
          </Link>
        </div>
      </div>

      {/* Bottom nav */}
      <nav className="bg-white  text-sm relative">
        <div className="container mx-auto px-4 py-3 flex gap-8 text-black text-base">
          {/* Dropdown - Sản phẩm */}
          <div
            className="relative cursor-pointer"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            ref={dropdownRef}
          >
            <div className="flex items-center gap-1 hover:font-semibold">
              <span>Sản phẩm</span>
              <IoIosArrowDown className="text-xs mt-[2px]" />
            </div>
            <div
              className={`absolute top-full left-0 mt-2 w-48 bg-white border shadow-md z-10 transition-all duration-700 ease-in-out overflow-hidden transform ${
                openDropdown
                  ? 'opacity-100 scale-y-100'
                  : 'opacity-0 scale-y-0 pointer-events-none'
              } origin-top`}
            >
              <Link
                to="/products/shirts"
                className="block px-4 py-2 hover:bg-gray-100"
              >
                Áo
              </Link>
              <Link
                to="/products/pants"
                className="block px-4 py-2 hover:bg-gray-100"
              >
                Quần
              </Link>
              <Link
                to="/products/shoes"
                className="block px-4 py-2 hover:bg-gray-100"
              >
                Giày
              </Link>
            </div>
          </div>

          <Link to="/sales" className="hover:font-semibold">
            Khuyến mãi
          </Link>
          <Link to="/news" className="hover:font-semibold">
            Tin tức
          </Link>
          <Link to="/contact" className="hover:font-semibold">
            Liên hệ
          </Link>
          <Link to="/about" className="hover:font-semibold">
            Giới thiệu
          </Link>
          <Link to="/showroom" className="hover:font-semibold">
            Showroom
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;

// ✅ Cập nhật:
// - Tăng bottom nav to hơn (py-3, gap-8, text-base)
// - Dropdown giờ giữ được khi hover con menu
// - Thời gian dropdown mượt hơn (700ms)
// - Delay ẩn dropdown nhẹ khi rời chuột (200ms)
