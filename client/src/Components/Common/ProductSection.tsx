    import React from 'react';
    import { Link } from 'react-router-dom';
    import ProductCard from './ProductCard';
import type { Product } from '../../types/Product';

    interface ProductSectionProps {
    title: string;
    products: Product[];
    }

    const ProductSection: React.FC<ProductSectionProps> = ({ title, products }) => {
    if (!products?.length) return null;

    return (
        <section className="my-8">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            {title}
            </h2>
            <Link to="/products" className="text-sm text-red-500 hover:underline">
            Xem thêm
            </Link>
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
