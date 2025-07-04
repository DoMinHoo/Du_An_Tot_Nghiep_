import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const benefits = [
  {
    title: "Gia tăng uy tín và vị thế thương hiệu",
    icon: "/icons/icon1.svg",
    description:
      "Hợp tác cùng LIVENTO, thương hiệu thuộc SAVIMEX CORPORATION danh tiếng với 40 năm kinh nghiệm và uy tín đã được khẳng định thông qua các giải thưởng. Giúp nâng tầm vị thế và niềm tin từ khách hàng."
  },
  {
    title: "Tiếp cận tệp khách hàng chất lượng cao",
    icon: "/icons/icon2.svg",
    description:
      "LIVENTO sở hữu tệp khách hàng đa dạng và trung thành, với tỉ lệ quay lại mua hàng gần 25%, mở ra cơ hội tiếp cận phân khúc thị trường tiềm năng và gia tăng giá trị đơn hàng."
  },
  {
    title: "Khai thác hiệu quả hệ thống showroom chuyên nghiệp",
    icon: "/icons/icon3.svg",
    description:
      "Sản phẩm của bạn có cơ hội trưng bày tại hệ thống showroom hiện đại của LIVENTO trên toàn quốc với nhiều showroom đang triển khai."
  },
  {
    title: "Hưởng lợi từ chiến lược marketing đa kênh",
    icon: "/icons/icon4.svg",
    description:
      "LIVENTO đầu tư mạnh vào hoạt động marketing đa kênh, giúp sản phẩm của đối tác được quảng bá rộng rãi, tăng cường nhận diện và thúc đẩy quyết định mua hàng."
  },
  {
    title: "Mở rộng kênh phân phối & quảng bá mạnh mẽ",
    icon: "/icons/icon5.svg",
    description:
      "Sản phẩm của bạn sẽ được niêm yết trên các nền tảng Online và Offline của LIVENTO, tiếp cận hàng triệu khách hàng tiềm năng trên toàn quốc."
  },
  {
    title: "Nền tảng phát triển bền vững",
    icon: "/icons/icon6.svg",
    description:
      "LIVENTO cam kết xây dựng mối quan hệ hợp tác dài hạn và bền vững, dựa trên nguyên tắc win-win, cùng đối tác phát triển."
  }
];

const BenefitAccordion: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-gray-50 py-16 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h3 className="text-lg font-semibold mb-8 bg-red-600 inline-block text-white px-6 py-2 rounded">
          LỢI ÍCH KHI HỢP TÁC CÙNG LIVENTO
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {benefits.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition duration-300"
            >
              <div
                className="flex items-start gap-4 cursor-pointer"
                onClick={() => toggle(index)}
              >
                <img src={item.icon} alt="icon" className="w-10 h-10" />
                <div className="flex-1">
                  <h4 className="font-semibold text-base text-red-700">
                    {item.title}
                  </h4>
                </div>
                {openIndex === index ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              {openIndex === index && (
                <p className="mt-4 text-sm text-gray-700 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitAccordion;
