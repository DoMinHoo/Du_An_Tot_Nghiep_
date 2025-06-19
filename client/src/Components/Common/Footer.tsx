// 📁 src/components/Footer.jsx
import React from "react";
import { FaFacebookF, FaYoutube, FaTiktok } from "react-icons/fa";
import { HiOutlinePhone, HiOutlineMail } from "react-icons/hi";
import { MdLocationOn } from "react-icons/md";
import Service1 from "./img/Service/vice_item_1_thumb.webp"; // Adjust the path as necessary
import Service2 from "./img/Service/vice_item_2_thumb.webp"; // Adjust the path as necessary
import Service3 from "./img/Service/vice_item_3_thumb.webp"; // Adjust the path as necessary  
import Service4 from "./img/Service/vice_item_4_thumb.webp"; // Adjust the path as necessary

const Footer = () => {
    return (
        <footer className="text-sm mt-12">
            {/* Top Services */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b py-6 text-center">
                <div className="transition duration-300 hover:shadow-lg hover:bg-white p-4 rounded">
                    <img src={Service1} alt="Giao Hàng" className="h-12 mx-auto mb-2" />
                    <p className="font-semibold">Giao Hàng & Lắp Đặt</p>
                    <p className="text-gray-600">Miễn Phí</p>
                </div>
                <div className="transition duration-300 hover:shadow-lg hover:bg-white p-4 rounded">
                    <img src={Service2} alt="Đổi Trả" className="h-12 mx-auto mb-2" />
                    <p className="font-semibold">Đổi trả 1 - 1</p>
                    <p className="text-gray-600">Miễn Phí</p>
                </div>
                <div className="transition duration-300 hover:shadow-lg hover:bg-white p-4 rounded">
                    <img src={Service3} alt="Bảo Hành" className="h-12 mx-auto mb-2" />
                    <p className="font-semibold">Bảo Hành 2 Năm</p>
                    <p className="text-gray-600">Miễn Phí</p>
                </div>
                <div className="transition duration-300 hover:shadow-lg hover:bg-white p-4 rounded">
                    <img src={Service4} alt="Tư Vấn" className="h-12 mx-auto mb-2" />
                    <p className="font-semibold">Tư Vấn Thiết Kế</p>
                    <p className="text-gray-600">Miễn Phí</p>
                </div>
            </div>

            {/* Main Footer */}
            <div className="container mx-auto px-4 py-10 grid md:grid-cols-3 gap-8  ">
                <div>
                    <h4 className="font-bold mb-3">NỘI THẤT LIVENTO</h4>
                    <p className="text-sm mb-4">
                        Nội Thất MOHO là thương hiệu đến từ Savimex với gần 40 năm kinh nghiệm trong việc sản xuất và xuất khẩu nội thất đạt chuẩn quốc tế.
                    </p>
                    <div className="flex gap-4">
                        <img src="/assets/verified.png" alt="Bộ Công Thương" className="h-10" />
                        <img src="/assets/dmca.png" alt="DMCA" className="h-10" />
                    </div>
                </div>

                <div>
                    <h4 className="font-bold mb-3">NỘI THẤT LIVENTO</h4>
                    <ul className="space-y-2">
                        <li>Chính Sách Bán Hàng</li>
                        <li>Chính Sách Giao Hàng & Lắp Đặt</li>
                        <li>Chính Sách Bảo Hành & Bảo Trì</li>
                        <li>Chính Sách Đổi Trả</li>
                        <li>Khách Hàng Thân Thiết – MOHOmie</li>
                        <li>Chính Sách Đối Tác Bán Hàng</li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold mb-3">THÔNG TIN LIÊN HỆ</h4>
                    <p className="mb-2 flex items-start gap-2"><MdLocationOn className="mt-1" /> Trường Cao đẳng FPT Polytechnic – Cơ sở Hà Nội (Trịnh Văn Bô)</p>
                    <p className="mb-2 flex items-start gap-2"><HiOutlinePhone /> 024 6327 6402</p>
                    <p className="mb-2 flex items-start gap-2"><HiOutlineMail /> caodang@fpt.edu.vn</p>
                    <p className="mb-2">Website: https://caodang.fpt.edu.vn</p>
                    <p className="mb-2">Fanpage: https://www.facebook.com/caodangfptpoly</p>
                    <div className="flex gap-4 text-xl mt-4">
                        <FaFacebookF className="hover:text-blue-600 cursor-pointer" />
                        <FaYoutube className="hover:text-red-600 cursor-pointer" />
                        <FaTiktok className="hover:text-black cursor-pointer" />
                    </div>
                </div>
            </div>

            {/* Bottom */}
            <div className="bg-black text-white text-center py-4">
                Copyright © 2025 Nội thất LIVENTO.
            </div>
        </footer>
    );
};

export default Footer;
