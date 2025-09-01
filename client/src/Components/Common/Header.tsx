// Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaShoppingCart, FaUser } from 'react-icons/fa';
import { IoIosArrowDown } from 'react-icons/io';
import axios from 'axios';
import logo from '../Common/img/Logo/image 15.png';
import NotificationBell from './NotificationBell';

// Cập nhật interface Category để bao gồm danh mục con
interface Category {
  _id: string;
  name: string;
  slug: string;
  children?: Category[]; // Danh mục con, là một mảng Category
}

const Header: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const [openUserDropdown, setOpenUserDropdown] = useState(false);
  let timeout: ReturnType<typeof setTimeout>;

  // Thêm state để quản lý submenu nào đang mở
  const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null);

  useEffect(() => {
    // Thay đổi endpoint để lấy danh mục có con
    axios
      .get('http://localhost:5000/api/categories/all/with-children')
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
      setOpenSubmenuId(null); // Đóng tất cả submenu khi rời khỏi dropdown chính
    }, 200);
  };

  // Hàm xử lý khi di chuột vào danh mục cha để mở submenu
  const handleParentCategoryMouseEnter = (categoryId: string) => {
    setOpenSubmenuId(categoryId);
  };

  // Hàm xử lý khi di chuột ra khỏi danh mục cha để đóng submenu
  const handleParentCategoryMouseLeave = () => {
    setOpenSubmenuId(null);
  };


  const handleLogout = () => {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('guestId');
    setUser(null);
    setOpenUserDropdown(false);
    navigate(`/`);
    window.location.reload();
  };

  const handleSearch = () => {
    const keyword = searchTerm.trim();
    if (keyword) {
      navigate(`/search?keyword=${encodeURIComponent(keyword)}`);
    }
  };

  return (
    <header className="shadow-sm">
      <div className="container mx-auto px-4 py-3 mt-3 mb-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Livento" className="h-12 object-contain scale-150" />
        </Link>

        <div className="w-1/2 mx-6">
          <div className="flex border rounded overflow-hidden">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full px-4 py-1.5 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
            <button onClick={handleSearch} className="bg-gray-800 text-white px-4">
              <FaSearch />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">

          {user ? (
            <div className="relative">
              <button onClick={() => setOpenUserDropdown(!openUserDropdown)} className="flex items-center gap-1">
                <FaUser className="text-lg" /> {user.name}
                <IoIosArrowDown className="text-xs mt-1" />
              </button>
              {openUserDropdown && (
                <div className="absolute right-0 top-full mt-2  w-40 bg-white border shadow-lg rounded z-50">
                  <div
                    onClick={() => {
                      navigate('/order-history');
                      setOpenUserDropdown(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    Lịch sử đơn hàng
                  </div>
                  <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                    <Link to="/account" className="hidden md:inline">
                      Tài khoản của tôi
                    </Link>
                  </div>
                  <div onClick={handleLogout} className="px-4 py-2 hover:bg-gray-100 text-red-500 cursor-pointer">
                    Đăng xuất
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <FaUser className="text-lg" />
              <Link to="/login">Đăng nhập</Link> / <Link to="/signin">Đăng ký</Link>
            </div>
          )}

          <Link to="/cart" className="flex items-center gap-1">
            <FaShoppingCart className="text-lg" /> Giỏ hàng
          </Link>
          <div className='ml-10 relative'>
            <NotificationBell />
          </div>

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
              <Link to="/categories">Danh mục</Link>
              <IoIosArrowDown className="text-xs mt-[2px]" />
            </div>
            <div
              className={`absolute top-full left-0 mt-2 w-48 bg-white shadow-md z-10 transition-all duration-300 transform origin-top ${openDropdown ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'
                }`}
            >
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className="relative"
                  onMouseEnter={() => cat.children && cat.children.length > 0 && handleParentCategoryMouseEnter(cat._id)}
                  onMouseLeave={() => cat.children && cat.children.length > 0 && handleParentCategoryMouseLeave()}
                >
                  <Link
                    to={`/categories/${cat.slug}`}
                    className="flex items-center justify-between px-4 py-2 hover:bg-gray-100"
                    onClick={() => setOpenDropdown(false)} // Đóng dropdown khi click vào danh mục cha
                  >
                    {cat.name}
                    {cat.children && cat.children.length > 0 && (
                      <IoIosArrowDown className="text-xs rotate-[-90deg]" />
                    )}
                  </Link>

                  {/* Submenu cho danh mục con */}
                  {cat.children && cat.children.length > 0 && (
                    <div
                      className={`absolute top-0 left-full ml-1 w-48 bg-white border shadow-md z-20 transition-all duration-300 transform origin-left ${openSubmenuId === cat._id ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 pointer-events-none'
                        }`}
                    >
                      {cat.children.map((childCat) => (
                        <Link
                          key={childCat._id}
                          to={`/categories/${childCat.slug}`}
                          className="block px-4 py-2 hover:bg-gray-100"
                          onClick={() => { setOpenDropdown(false); setOpenSubmenuId(null); }} // Đóng cả hai dropdown khi click vào danh mục con
                        >
                          {childCat.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Link to="/sales" className="hover:font-semibold">Khuyến mãi</Link>
          <Link to="/news" className="hover:font-semibold">Tin tức</Link>
          <Link to="/contact" className="hover:font-semibold">Liên hệ</Link>
          <Link to="/about" className="hover:font-semibold">Giới thiệu</Link>
          <Link to="/favorites" className="hover:font-semibold flex items-center gap-1">
            Sản phẩm yêu thích
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;