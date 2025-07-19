import React, { useEffect, useState } from 'react';
import SaleProductSection from '../Components/Common/SaleProductSection';

const SalePage = () => {
  const [timedSaleProducts, setTimedSaleProducts] = useState([]);
  const [normalSaleProducts, setNormalSaleProducts] = useState([]);

  useEffect(() => {
    const fetchSaleProducts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/sale');
        const data = await response.json();
        const now = new Date();
        const products = data.data || [];

        // Sản phẩm có ngày/giờ khuyến mãi và đang trong thời gian sale
        const timedSale = products.filter((product: any) => {
          if (product.flashSaleStart && product.flashSaleEnd && product.salePrice) {
            const start = new Date(product.flashSaleStart);
            const end = new Date(product.flashSaleEnd);
            return start <= now && now <= end;
          }
          return false;
        });

        // Sản phẩm có giá sale nhưng KHÔNG có thời gian sale
        const normalSale = products.filter((product: any) => {
          const hasNoTime = !product.flashSaleStart && !product.flashSaleEnd;
          return hasNoTime && product.salePrice;
        });

        setTimedSaleProducts(timedSale);
        setNormalSaleProducts(normalSale);
      } catch (err) {
        console.error('Lỗi khi load sản phẩm khuyến mãi:', err);
      }
    };

    fetchSaleProducts();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Sản phẩm khuyến mãi</h1>
      {/* Sản phẩm có ngày/giờ khuyến mãi */}
      {timedSaleProducts.length > 0 && (
        <SaleProductSection title="Khuyến mãi Hot" products={timedSaleProducts} />
      )}
      {/* Sản phẩm khuyến mãi thường */}
      {normalSaleProducts.length > 0 && (
        <SaleProductSection title="Đang khuyến mãi" products={normalSaleProducts} />
      )}
    </div>
  );
};

export default SalePage;
