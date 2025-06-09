import React from 'react';
import ProductCard from './ProductCard';

const ProductSection = ({ title, products }) => {
    if (!products?.length) return null;

    return (
        <section className="my-6">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-5 ">{title}</h2>
                <a href="#" className="text-sm text-red-500 hover:underline">Xem thêm</a>
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
