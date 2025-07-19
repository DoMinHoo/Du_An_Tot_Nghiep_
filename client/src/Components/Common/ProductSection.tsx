import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import type { Product } from '../../types/Product';
import type { Variation } from '../../types/Variations';

export interface ProductSectionProps {
  title: string;
  products: (Product & Variation)[];
  filterType?: 'new' | 'hot'; // optional
}

const ProductSection: React.FC<ProductSectionProps> = ({ title, products, filterType }) => {
  if (!products?.length) return null;

  return (
    <section className="my-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl md:text-3xl mb-4 mt-3 font-bold text-gray-800">
          {title}
        </h2>
        {filterType && (
          <Link
            to={`/products?filter=${filterType}`}
            className="text-sm text-red-500 hover:underline"
          >
            Xem thêm
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default ProductSection;
