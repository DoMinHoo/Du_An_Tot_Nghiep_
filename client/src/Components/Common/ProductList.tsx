    import React from 'react';
    import { useQuery } from '@tanstack/react-query';
    import { fetchProducts } from '../../services/apiService';
    import ProductCard from './ProductCard';

    const ProductList: React.FC = () => {
    const {
        data: products,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['products'],
        queryFn: () =>
        fetchProducts({
            page: 1,
            limit: 10,
            sort: 'created_at',
            status: 'active',
        }),
    });

    if (isLoading) {
        return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array(4)
            .fill(0)
            .map((_, i) => (
                <div
                key={i}
                className="animate-pulse bg-gray-200 h-[300px] rounded-md"
                >
                <div className="h-[240px] bg-gray-300"></div>
                <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
                </div>
            ))}
        </div>
        );
    }

    if (error) {
        return (
        <div className="text-center text-red-500">
            Lỗi: {(error as Error).message}
        </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products?.length ? (
            products.map((product) => (
            <ProductCard key={product._id} product={product} />
            ))
        ) : (
            <div className="text-center text-gray-500">Không có sản phẩm nào.</div>
        )}
        </div>
    );
    };

    export default ProductList;
