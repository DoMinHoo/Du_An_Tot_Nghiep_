// 📁 src/components/Header.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaShoppingCart, FaUser } from "react-icons/fa";
import { IoIosArrowDown } from "react-icons/io";
import axios from "axios";
import logo from "../Common/img/Logo/image 15.png";

const Header = () => {
    const [openDropdown, setOpenDropdown] = useState(false);
    const [categories, setCategories] = useState([]);
    const dropdownRef = useRef(null);
    let timeout;

    const handleMouseEnter = () => {
        clearTimeout(timeout);
        setOpenDropdown(true);
    };

    const handleMouseLeave = () => {
        timeout = setTimeout(() => {
            setOpenDropdown(false);
        }, 200);
    };

    // 🔄 Lấy danh mục từ API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/categories");
                console.log("✅ Danh mục lấy về:", res.data); // 👈 log dữ liệu
    
                setCategories(res.data);
            } catch (err) {
                console.error("❌ Lỗi khi lấy danh mục:", err);
            }
        };
    
        fetchCategories();
    }, []);

    return (
        <header className="shadow-sm">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <img src={logo} alt="Livento" className="h-12 object-contain scale-150" />
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
                    <Link to="/account" className="hidden md:inline">Tài khoản của tôi</Link>
                    <Link to="/cart" className="flex items-center gap-1">
                        <FaShoppingCart className="text-lg" /> Giỏ hàng
                    </Link>
                </div>
            </div>

            {/* Bottom nav */}
            <nav className="bg-white text-sm relative">
                <div className="container mx-auto px-4 py-3 flex gap-8 text-black text-base">
                    {/* Dropdown - Sản phẩm */}
                    <div
                        className="relative cursor-pointer"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        ref={dropdownRef}
                    >
                        <div className="flex items-center gap-1 hover:font-semibold">
                            <Link to="/categories" className="hover:font-semibold">Sản phẩm</Link>
                            <IoIosArrowDown className="text-xs mt-[2px]" />
                        </div>
                        <div
  className={`absolute top-full left-0 mt-2 w-48 bg-white border shadow-md z-10 transition-all duration-700 ease-in-out transform origin-top
  ${openDropdown ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0 pointer-events-none"}
  `}
  style={{ overflow: 'visible' }} // 👈 thêm dòng này
                        >
                            

                            
                            {categories.map(cat => (
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

                    <Link to="/sales" className="hover:font-semibold">Khuyến mãi</Link>
                    <Link to="/news" className="hover:font-semibold">Tin tức</Link>
                    <Link to="/contact" className="hover:font-semibold">Liên hệ</Link>
                    <Link to="/about" className="hover:font-semibold">Giới thiệu</Link>
                    <Link to="/showroom" className="hover:font-semibold">Showroom</Link>
                </div>
            </nav>
        </header>
    );
};

export default Header;
