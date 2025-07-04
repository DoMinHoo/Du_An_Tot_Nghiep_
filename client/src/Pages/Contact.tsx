import React from "react";
import BenefitAccordion from "../Components/BenefitAccordion"; // nhớ tạo file này theo phần trước

const ContactPage: React.FC = () => {
  return (
    <div className="bg-white text-gray-800 font-sans">
      {/* Hero section */}
      <section className="bg-gray-100 py-12 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-sm font-semibold text-red-600 uppercase">Livento Home Living Partnership</h2>
            <h1 className="text-3xl md:text-4xl font-bold mt-2">
              Trở Thành <br /> <span className="text-red-600">Nhà Cung Cấp Chiến Lược</span>
            </h1>
            <p className="mt-4 text-gray-600">Cùng Nội Thất LIVENTO Mở Rộng Thị Trường</p>
            <a
              href="#form"
              className="inline-block mt-6 px-6 py-3 bg-red-600 text-white font-semibold rounded hover:bg-red-700"
            >
              Liên Hệ Hợp Tác
            </a>
            <p className="mt-2 text-sm text-gray-500">Email: https://caodang.fpt.edu.vn</p>
          </div>
          <img src="/banner-moho.jpg" alt="Moho Banner" className="w-full rounded-lg shadow-md" />
        </div>
      </section>

      {/* Giới thiệu chương trình */}
      <section className="py-16 px-4 bg-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-sm font-semibold text-red-600 uppercase mb-2">Chương Trình</h2>
          <h3 className="text-2xl font-bold mb-4">LIVENTO HOME LIVING PARTNERSHIP LÀ GÌ?</h3>
          <p className="text-gray-700 leading-relaxed">
            LIVENTO đang tìm kiếm các đối tác chiến lược trong lĩnh vực sản xuất và phân phối các sản phẩm như: vật phẩm
            trang trí, đồ dùng bếp, vải, đồ sơn, sản phẩm liên quan, nhằm mở rộng thị trường cùng phát triển.
          </p>
          <p className="mt-4 text-gray-700 leading-relaxed">
            LIVENTO là thương hiệu nội thất hiện đại tại Việt Nam, trực thuộc Savimex với 40 năm kinh nghiệm xuất khẩu.
          </p>
        </div>
      </section>

      {/* Lợi ích hợp tác */}
      <BenefitAccordion />

      {/* Thống kê & Báo chí */}
      <section className="py-16 bg-white px-4">
        <div className="max-w-6xl mx-auto grid gap-8">
          <div className="grid grid-cols-2 md:grid-cols-4 text-center text-sm font-semibold">
            <div>
              <p className="text-3xl text-red-600 font-bold">40 năm</p>
              <p>Kinh nghiệm xuất khẩu</p>
            </div>
            <div>
              <p className="text-3xl text-red-600 font-bold">Top 500</p>
              <p>Thương hiệu hàng đầu Việt Nam</p>
            </div>
            <div>
              <p className="text-3xl text-red-600 font-bold">4000</p>
              <p>Traffic mỗi ngày</p>
            </div>
            <div>
              <p className="text-3xl text-red-600 font-bold">25%</p>
              <p>Tỉ lệ mua lại</p>
            </div>
          </div>

          <div className="text-center">
            <h4 className="text-white inline-block bg-red-600 px-6 py-2 font-semibold rounded">
              BÁO CHÍ NÓI VỀ LIVENTO
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <img src="/news1.jpg" alt="Báo chí 1" className="rounded shadow-md" />
              <img src="/news2.jpg" alt="Báo chí 2" className="rounded shadow-md" />
            </div>
          </div>
        </div>
      </section>

      {/* Logo khách hàng */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-6">KHÁCH HÀNG CỦA LIVENTO</h3>
          <div className="flex flex-wrap justify-center items-center gap-6">
            <img src="/logos/phu-dong.png" className="h-12" />
            <img src="/logos/vinhomes.png" className="h-12" />
            <img src="/logos/vinpearl.png" className="h-12" />
            <img src="/logos/ecopark.png" className="h-12" />
          </div>
        </div>
      </section>

      {/* Form liên hệ */}
      <section id="form" className="bg-white py-20 px-4">
        <div className="max-w-md mx-auto text-center">
          <h3 className="text-lg font-semibold mb-2 text-red-600">LIÊN HỆ VỚI LIVENTO</h3>
          <p className="mb-6 text-gray-600">Để trao đổi chi tiết về chính sách hợp tác</p>
          <form className="space-y-4 text-left">
            {["Họ và tên", "Email", "Số điện thoại", "Tên thương hiệu", "Dòng sản phẩm"].map((label, idx) => (
              <input
                key={idx}
                type="text"
                placeholder={label}
                className="w-full border border-gray-300 rounded px-4 py-3 text-sm"
                required
              />
            ))}
            <textarea
              placeholder="Thông tin thêm về cửa hàng/website"
              className="w-full border border-gray-300 rounded px-4 py-3 text-sm"
              rows={4}
            ></textarea>
            <button
              type="submit"
              className="bg-red-600 text-white px-6 py-3 rounded font-semibold hover:bg-red-700 w-full"
            >
              GỬI YÊU CẦU
            </button>
          </form>
          <div className="flex justify-between mt-6 text-sm text-gray-500">
            <a href="/" className="underline">
              XEM SẢN PHẨM LIVENTO
            </a>
            <span>Phone: 024 6327 6402</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
