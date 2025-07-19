import React from 'react';
import SaleProductCard from './SaleProductCard';

interface SaleProductSectionProps {
  title: string;
  products: any[];
}

const SaleProductSection: React.FC<SaleProductSectionProps> = ({ title, products }) => {
  if (!products?.length) return null;

  return (
    <section className="my-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl md:text-3xl mb-4 mt-3 font-bold text-gray-800">
          {title}
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <SaleProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default SaleProductSection;
