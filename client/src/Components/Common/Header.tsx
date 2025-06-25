import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaShoppingCart, FaUser } from 'react-icons/fa';
import { IoIosArrowDown } from 'react-icons/io';
import axios from 'axios';
import logo from '../Common/img/Logo/image 15.png';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

const Header: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [user, setUser] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const [openUserDropdown, setOpenUserDropdown] = useState(false);
  let timeout: ReturnType<typeof setTimeout>;

  useEffect(() => {
    axios
      .get('http://localhost:5000/api/categories')
      .then((res) => setCategories(res.data))
      .catch((err) => console.error('Lỗi lấy danh mục:', err));
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem('currentUser');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleMouseEnter = () => {
    clearTimeout(timeout);
    setOpenDropdown(true);
  };

  const handleMouseLeave = () => {
    timeout = setTimeout(() => {
      setOpenDropdown(false);
    }, 200);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('guestId');
    setUser(null);
    navigate('/');
  };

  return (
    <header className="shadow-sm">
      <div className="container mx-auto px-4 py-3 mt-3 mb-5 flex items-center justify-between">
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
          {user ? (
            <div className="relative">
              <button
                onClick={() => setOpenUserDropdown(!openUserDropdown)}
                className="flex items-center gap-1"
              >
                <FaUser className="text-lg" /> {user.name}
                <IoIosArrowDown className="text-xs mt-1" />
              </button>

              {openUserDropdown && (
                <div className="absolute right-0 mt-2 w-44 bg-white border rounded shadow z-50">
                  <div
                    onClick={() => {
                      navigate('/order-history');
                      setOpenUserDropdown(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    Lịch sử đơn hàng
                  </div>
                  <div
                    onClick={() => {
                      handleLogout();
                      setOpenUserDropdown(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-100 text-red-500 cursor-pointer"
                  >
                    Đăng xuất
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <FaUser className="text-lg" />
              <Link to="/login">Đăng nhập</Link> /{' '}
              <Link to="/signin">Đăng ký</Link>
            </div>
          )}
          <Link to="/account" className="hidden md:inline">
            Tài khoản của tôi
          </Link>
          <Link to="/cart" className="flex items-center gap-1">
            <FaShoppingCart className="text-lg" /> Giỏ hàng
          </Link>
        </div>
      </div>

      <nav className="bg-white text-sm relative">
        <div className="container mx-auto px-4 py-3 mb-3 flex gap-8 text-black text-base">
          <div
            className="relative cursor-pointer"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            ref={dropdownRef}
          >
            <div className="flex items-center gap-1 hover:font-semibold">
              <Link to="/categories">Sản phẩm</Link>
              <IoIosArrowDown className="text-xs mt-[2px]" />
            </div>
            <div
              className={`absolute top-full left-0 mt-2 w-48 bg-white border shadow-md z-10 transition-all duration-300 transform origin-top ${
                openDropdown
                  ? 'opacity-100 scale-y-100'
                  : 'opacity-0 scale-y-0 pointer-events-none'
              }`}
            >
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  to={`/categories/${cat.slug}`}
                  className="block px-4 py-2 hover:bg-gray-100"
                >
                  {cat.name}
                </Link>
              ))}
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
