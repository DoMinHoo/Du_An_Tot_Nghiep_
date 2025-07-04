import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const AboutPage: React.FC = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <div className="bg-white text-gray-800 font-sans">
      {/* Hero Banner */}
      <section className="bg-gray-100 py-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div data-aos="fade-right">
            <h1 className="text-4xl font-bold mb-4 text-red-600">Về LIVENTO</h1>
            <p className="text-gray-700 text-lg">
              LIVENTO là thương hiệu nội thất hiện đại tại Việt Nam, trực thuộc Công ty Cổ phần Savimex với hơn 40 năm
              kinh nghiệm trong lĩnh vực sản xuất và xuất khẩu nội thất sang các thị trường lớn trên thế giới.
            </p>
          </div>
          <img
            data-aos="fade-left"
            src="/about-hero.jpg"
            alt="About LIVENTO"
            className="w-full rounded shadow-lg"
          />
        </div>
      </section>

      {/* Sứ mệnh - Tầm nhìn */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-start">
          <div data-aos="fade-up">
            <h2 className="text-2xl font-semibold text-red-600 mb-3">Sứ mệnh</h2>
            <p className="text-gray-700 leading-relaxed">
              Mang đến giải pháp nội thất hiện đại, tiện nghi và thân thiện với môi trường, nâng tầm không gian sống của
              mọi gia đình Việt.
            </p>
          </div>
          <div data-aos="fade-up" data-aos-delay="200">
            <h2 className="text-2xl font-semibold text-red-600 mb-3">Tầm nhìn</h2>
            <p className="text-gray-700 leading-relaxed">
              Trở thành thương hiệu nội thất Việt hàng đầu khu vực Đông Nam Á, tiên phong trong xu hướng sống hiện đại
              và phát triển bền vững.
            </p>
          </div>
        </div>
      </section>

      {/* Giá trị cốt lõi */}
      <section className="bg-gray-50 py-16 px-4 text-center">
        <h2 className="text-2xl font-bold mb-8 text-red-600" data-aos="fade-up">Giá trị cốt lõi</h2>
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          {["Chất lượng", "Sáng tạo", "Bền vững"].map((value, idx) => (
            <div
              key={idx}
              className="bg-white shadow p-6 rounded border border-gray-200"
              data-aos="fade-up"
              data-aos-delay={idx * 150}
            >
              <h4 className="text-lg font-semibold mb-2 text-red-500">{value}</h4>
              <p className="text-gray-600 text-sm">
                {value === "Chất lượng"
                  ? "Sản phẩm đạt chuẩn quốc tế, kiểm định nghiêm ngặt từ nguyên liệu đến hoàn thiện."
                  : value === "Sáng tạo"
                  ? "Thiết kế hiện đại, phù hợp xu hướng nội thất toàn cầu."
                  : "Cam kết phát triển bền vững, thân thiện với môi trường và cộng đồng."}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Thành tựu */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-8" data-aos="fade-up">Thành tựu & Chứng nhận</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm" data-aos="fade-up" data-aos-delay="100">
            <div>
              <p className="text-3xl font-bold text-red-600">40+</p>
              <p>Kinh nghiệm xuất khẩu</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-red-600">500+</p>
              <p>Đối tác toàn cầu</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-red-600">100%</p>
              <p>Nguyên liệu đạt chuẩn FSC</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-red-600">ISO</p>
              <p>Chứng nhận quản lý chất lượng</p>
            </div>
          </div>
        </div>
      </section>

      {/* Hình ảnh văn phòng / showroom */}
      <section className="bg-gray-100 py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-8" data-aos="fade-up">Không gian LIVENTO</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {["showroom1.jpg", "showroom2.jpg", "factory.jpg"].map((src, i) => (
              <img
                key={i}
                src={`/${src}`}
                alt="livento space"
                className="rounded shadow"
                data-aos="zoom-in"
                data-aos-delay={i * 150}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA liên hệ */}
      <section className="bg-white py-12 px-4 text-center" data-aos="fade-up">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Cùng LIVENTO nâng tầm không gian sống cho khách hàng Việt
        </h3>
        <a
          href="/contact"
          className="inline-block px-6 py-3 bg-red-600 text-white rounded font-semibold hover:bg-red-700"
        >
          Liên hệ hợp tác
        </a>
      </section>
    </div>
  );
};

export default AboutPage;
