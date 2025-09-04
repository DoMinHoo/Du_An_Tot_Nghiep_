import React, { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../Components/Common/ProductCard'; // Đảm bảo đường dẫn này đúng

interface Category {
    _id: string;
    name: string;
    slug: string;
}

interface Product {
    _id: string;
    [key: string]: any; // Dùng any hoặc định nghĩa chi tiết hơn các thuộc tính product
}

interface Filters {
    selectedCategory: string;
    priceSort: string;
    color: string;
    size: string;
    productFilter: string; // hot/new
    minPrice: string;
    maxPrice: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface APIResponse {
    success: boolean;
    data?: Product[];
    breadcrumb?: string[];
    pagination?: Pagination;
    message?: string;
    error?: string;
    category?: Category;
}

const CategoryPage: React.FC = () => {
    const { slug } = useParams<{ slug?: string }>();
    const navigate = useNavigate();

    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [breadcrumb, setBreadcrumb] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState<Filters>({
        selectedCategory: '',
        priceSort: '', // asc/desc
        color: '',
        size: '',
        productFilter: '', // hot/new
        minPrice: '',
        maxPrice: '',
    });

    const [activeFilters, setActiveFilters] = useState<{ [key: string]: string }>({});
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pagination, setPagination] = useState<Pagination | null>(null);

    // Fetch all categories for the dropdown filter
    useEffect(() => {
        axios.get('http://localhost:5000/api/categories')
            .then(res => setCategories(res.data || []))
            .catch(err => console.error('Lỗi lấy danh mục:', err));
    }, []);

    // Fetch category by slug if slug is present in URL
    useEffect(() => {
        if (!slug) {
            setFilters(prev => ({ ...prev, selectedCategory: '' }));
            setActiveFilters({});
            setBreadcrumb(['Trang chủ', 'Tất cả sản phẩm']);
            setCurrentPage(1); // Reset page on slug change
            return;
        }

        const fetchCategoryBySlug = async () => {
            try {
                const res = await axios.get<APIResponse>(`http://localhost:5000/api/categories/slug/${slug}`);
                if (res.data?.success && res.data.category) {
                    const cat: Category = res.data.category;
                    setFilters(prev => ({ ...prev, selectedCategory: cat._id }));
                    setActiveFilters(prev => ({ ...prev, category: cat._id }));
                    setBreadcrumb(['Trang chủ', cat.name]);
                    setCurrentPage(1); // Reset page on slug change
                } else {
                    setError(res.data?.message || 'Không tìm thấy danh mục');
                    setFilters(prev => ({ ...prev, selectedCategory: '' }));
                    setActiveFilters({});
                    setBreadcrumb(['Trang chủ', 'Tất cả sản phẩm']);
                    setCurrentPage(1); // Reset page on slug change
                }
            } catch (err: any) {
                setError(err.response?.data?.message || 'Lỗi khi tìm kiếm danh mục theo slug');
                setFilters(prev => ({ ...prev, selectedCategory: '' }));
                setActiveFilters({});
                setBreadcrumb(['Trang chủ', 'Tất cả sản phẩm']);
                setCurrentPage(1); // Reset page on error
            }
        };

        fetchCategoryBySlug();
    }, [slug, navigate]); // Thêm navigate vào dependency

    // Fetch products based on activeFilters and currentPage
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                // Thêm page và limit vào query
                const queryParams = new URLSearchParams({
                    ...activeFilters,
                    page: currentPage.toString(),
                    limit: '12' // Giới hạn 10 sản phẩm mỗi trang
                }).toString();

                const res = await axios.get<APIResponse>(`http://localhost:5000/api/categories/products?${queryParams}`);

                if (res.data?.success) {
                    setProducts(res.data.data || []);
                    setPagination(res.data.pagination || null); // Cập nhật state phân trang
                    if (res.data.breadcrumb && res.data.breadcrumb.length > 0) {
                        setBreadcrumb(res.data.breadcrumb);
                    } else if (!slug && !filters.selectedCategory) {
                        setBreadcrumb(['Trang chủ', 'Tất cả sản phẩm']);
                    }
                } else {
                    setProducts([]);
                    setPagination(null);
                    setError(res.data?.message || 'Không thể tải sản phẩm');
                    if (!slug && !filters.selectedCategory) {
                        setBreadcrumb(['Trang chủ', 'Tất cả sản phẩm']);
                    }
                }
            } catch (err: any) {
                console.error('Lỗi lấy sản phẩm:', err);
                setProducts([]);
                setPagination(null);
                setError(err.response?.data?.message || 'Lỗi server khi tải sản phẩm');
                if (!slug && !filters.selectedCategory) {
                    setBreadcrumb(['Trang chủ', 'Tất cả sản phẩm']);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [activeFilters, slug, currentPage, filters.selectedCategory]); // Thêm currentPage vào dependency

    // Handle category select change
    const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;

        if (!selectedId) {
            setFilters(prev => ({ ...prev, selectedCategory: '' }));
            setActiveFilters({});
            navigate('/categories');
            setCurrentPage(1); // Reset page
            return;
        }

        const selected = categories.find(cat => cat._id === selectedId);
        if (selected?.slug) {
            setFilters(prev => ({ ...prev, selectedCategory: selectedId }));
            setActiveFilters(prev => ({ ...prev, category: selectedId }));
            navigate(`/categories/${selected.slug}`);
            setCurrentPage(1); // Reset page
        }
    };

    // Apply all filters
    const handleFilter = () => {
        const {
            selectedCategory, priceSort, color, size, productFilter, minPrice, maxPrice
        } = filters;

        const query: { [key: string]: string } = {};
        if (selectedCategory) query.category = selectedCategory;
        if (priceSort === 'asc') query.sort = 'price_asc';
        if (priceSort === 'desc') query.sort = 'price_desc';
        if (productFilter === 'hot' || productFilter === 'new') query.filter = productFilter;
        if (color) query.color = color;
        if (size) query.size = size;
        if (minPrice !== '') query.minPrice = minPrice;
        if (maxPrice !== '') query.maxPrice = maxPrice;

        setActiveFilters(query);
        setCurrentPage(1); // Luôn reset về trang 1 khi áp dụng bộ lọc mới
    };

    // Reset filters
    const handleClearFilters = () => {
        setFilters({
            selectedCategory: '',
            priceSort: '',
            color: '',
            size: '',
            productFilter: '',
            minPrice: '',
            maxPrice: '',
        });
        setActiveFilters({});
        setCurrentPage(1); // Reset page
        navigate('/categories');
    };

    // Xử lý chuyển trang
    const handlePageChange = (page: number) => {
        if (pagination && page >= 1 && page <= pagination.totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const pageTitle = breadcrumb.length > 1
        ? breadcrumb[breadcrumb.length - 1]
        : 'Tất cả sản phẩm LIVENTO';

    const formatNumber = (value: string | number) => {
        if (!value) return "";
        return new Intl.NumberFormat("en-US").format(Number(value));
    };

    if (loading) return <div className="flex items-center justify-center h-48 text-lg text-gray-600">Đang tải sản phẩm...</div>;
    if (error) return <div className="p-8 text-center text-red-600 bg-red-100 rounded-lg mx-auto max-w-lg shadow-md">Đã xảy ra lỗi: {error}</div>;

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <nav className="text-sm text-gray-600 mb-6">
                {breadcrumb.length > 0 ? (
                    breadcrumb.map((item, idx) => (
                        <span key={idx}>
                            {idx === 0 ? (
                                <Link to="/" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200">{item}</Link>
                            ) : (
                                <span className="text-gray-800 font-medium">{item}</span>
                            )}
                            {idx < breadcrumb.length - 1 && <span className="mx-2 text-gray-400">/</span>}
                        </span>
                    ))
                ) : (
                    <span className="text-gray-800 font-medium">Tất cả sản phẩm</span>
                )}
            </nav>

            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
                <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
                    {filters.productFilter === "new"
                        ? "Sản phẩm mới nhất"
                        : filters.productFilter === "hot"
                            ? "Sản phẩm bán chạy"
                            : pageTitle}
                </h1>

                <div className="flex items-center gap-3">
                    <label htmlFor="productFilter" className="text-gray-700 text-sm font-medium hidden sm:block">Sắp xếp:</label>
                    <select
                        id="productFilter"
                        className="border border-gray-300 rounded-md px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out shadow-sm"
                        value={filters.productFilter}
                        onChange={(e) => {
                            const value = e.target.value;
                            setFilters(prev => ({ ...prev, productFilter: value }));

                            const newFilters = { ...activeFilters };
                            if (value === "hot" || value === "new") {
                                newFilters.filter = value;
                            } else {
                                delete newFilters.filter;
                            }
                            setActiveFilters(newFilters);
                            setCurrentPage(1); // Reset page
                        }}
                    >
                        <option value="">Tất cả sản phẩm</option>
                        <option value="new">Mới nhất</option>
                        <option value="hot">Bán chạy</option>
                    </select>
                </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-inner mb-8 border border-gray-200 flex justify-center">
                <div className="flex flex-wrap items-center gap-4 md:gap-6">
                    <span className="font-semibold text-gray-800 text-lg">Bộ lọc:</span>

                    <select
                        className="border border-gray-300 rounded-md px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out shadow-sm w-full sm:w-auto"
                        value={filters.selectedCategory}
                        onChange={handleCategoryChange}
                    >
                        <option value="">TẤT CẢ DANH MỤC</option>
                        {categories.map(cat => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                    </select>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <input
                            type="text"
                            className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out shadow-sm"
                            placeholder="Giá từ"
                            value={filters.minPrice ? formatNumber(filters.minPrice) : ""}
                            onChange={(e) => {
                                const raw = e.target.value.replace(/,/g, ""); // bỏ dấu phẩy
                                const num = raw === "" ? "" : Number(raw);
                                if (!isNaN(num)) {
                                    setFilters((prev) => ({ ...prev, minPrice: num }));
                                }
                            }}
                        />
                        <input
                            type="text"
                            className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out shadow-sm"
                            placeholder="Giá đến"
                            value={filters.maxPrice ? formatNumber(filters.maxPrice) : ""}
                            onChange={(e) => {
                                const raw = e.target.value.replace(/,/g, "");
                                const num = raw === "" ? "" : Number(raw);
                                if (!isNaN(num)) {
                                    setFilters((prev) => ({ ...prev, maxPrice: num }));
                                }
                            }}
                        />
                    </div>

                    <select
                        className="border border-gray-300 rounded-md px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out shadow-sm w-full sm:w-auto"
                        value={filters.color}
                        onChange={(e) => setFilters(prev => ({ ...prev, color: e.target.value }))}
                    >
                        <option value="">TẤT CẢ MÀU</option>
                        <option value="màu tự nhiên">Màu tự nhiên</option>
                        <option value="trắng">Trắng</option>
                        <option value="xám">Xám</option>
                        <option value="nâu">Nâu</option>
                    </select>
                    <div className="flex gap-3 w-full sm:w-auto justify-end sm:justify-start">
                        <button
                            onClick={handleFilter}
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ease-in-out font-medium shadow-md flex-grow sm:flex-grow-0"
                        >
                            Áp dụng
                        </button>

                        <button
                            onClick={handleClearFilters}
                            className="text-red-600 bg-red-50 px-6 py-2 rounded-md hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 ease-in-out font-medium shadow-sm flex-grow sm:flex-grow-0"
                        >
                            Xóa bộ lọc
                        </button>
                    </div>
                </div>
            </div>

            {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-md">
                    <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p className="text-xl text-gray-600 font-semibold">Không có sản phẩm nào phù hợp với lựa chọn của bạn.</p>
                    <button
                        onClick={handleClearFilters}
                        className="mt-6 text-blue-600 bg-blue-50 px-5 py-2 rounded-lg hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ease-in-out font-medium"
                    >
                        Quay lại tất cả sản phẩm
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                    {/* Pagination component */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-8">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Trang trước
                            </button>

                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pageNumber => (
                                <button
                                    key={pageNumber}
                                    onClick={() => handlePageChange(pageNumber)}
                                    className={`px-4 py-2 border rounded-md transition-colors ${currentPage === pageNumber ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                                >
                                    {pageNumber}
                                </button>
                            ))}

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === pagination.totalPages}
                                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Trang sau
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CategoryPage;