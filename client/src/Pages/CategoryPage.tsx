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
  category?: Category; // Added for the category by slug response
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

  // Fetch all categories for the dropdown filter
  useEffect(() => {
    axios.get('http://localhost:5000/api/categories')
      .then(res => setCategories(res.data || []))
      .catch(err => console.error('Lỗi lấy danh mục:', err));
  }, []);

  // Fetch category by slug if slug is present in URL
  useEffect(() => {
    if (!slug) {
      // If no slug, clear category filter and active filters
      setFilters(prev => ({ ...prev, selectedCategory: '' }));
      setActiveFilters({}); // Clear all filters if navigating to /categories without slug
      setBreadcrumb(['Trang chủ', 'Tất cả sản phẩm']); // Default breadcrumb
      return;
    }

    const fetchCategoryBySlug = async () => {
      try {
        const res = await axios.get<APIResponse>(`http://localhost:5000/api/categories/slug/${slug}`);
        if (res.data?.success && res.data.category) {
          const cat: Category = res.data.category;
          setFilters(prev => ({ ...prev, selectedCategory: cat._id }));
          // Update active filters including the category ID from slug
          setActiveFilters(prev => ({ ...prev, category: cat._id }));
          setBreadcrumb(['Trang chủ', cat.name]); // Update breadcrumb for specific category
        } else {
          setError(res.data?.message || 'Không tìm thấy danh mục');
          setFilters(prev => ({ ...prev, selectedCategory: '' })); // Clear category filter if not found
          setActiveFilters({}); // Clear all active filters if category not found
          setBreadcrumb(['Trang chủ', 'Tất cả sản phẩm']); // Fallback breadcrumb
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Lỗi khi tìm kiếm danh mục theo slug');
        setFilters(prev => ({ ...prev, selectedCategory: '' })); // Clear category filter on error
        setActiveFilters({}); // Clear all active filters on error
        setBreadcrumb(['Trang chủ', 'Tất cả sản phẩm']); // Fallback breadcrumb
      }
    };

    fetchCategoryBySlug();
  }, [slug]);

  // Fetch products based on activeFilters
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null); // Clear previous errors
      try {
        const query = new URLSearchParams(activeFilters).toString();
        // THAY ĐỔI URL API TẠI ĐÂY để gọi đến endpoint mới
        const res = await axios.get<APIResponse>(`http://localhost:5000/api/categories/products?${query}`);
        if (res.data?.success) {
          setProducts(res.data.data || []);
          // Only update breadcrumb if API provides it and it's more specific
          if (res.data.breadcrumb && res.data.breadcrumb.length > 0) {
            setBreadcrumb(res.data.breadcrumb);
          } else if (!slug && !filters.selectedCategory) {
             setBreadcrumb(['Trang chủ', 'Tất cả sản phẩm']); // Default if no specific category or slug
          }
        } else {
          setProducts([]);
          setError(res.data?.message || 'Không thể tải sản phẩm');
           if (!slug && !filters.selectedCategory) {
             setBreadcrumb(['Trang chủ', 'Tất cả sản phẩm']); // Default if no specific category or slug
          }
        }
      } catch (err: any) {
        console.error('Lỗi lấy sản phẩm:', err);
        setProducts([]);
        setError(err.response?.data?.message || 'Lỗi server khi tải sản phẩm');
         if (!slug && !filters.selectedCategory) {
             setBreadcrumb(['Trang chủ', 'Tất cả sản phẩm']); // Default if no specific category or slug
          }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [activeFilters, slug, filters.selectedCategory]); // Added slug and filters.selectedCategory as dependencies

  // Handle category select change
  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;

    if (!selectedId) {
      setFilters(prev => ({ ...prev, selectedCategory: '' }));
      setActiveFilters({}); // Clear all filters if no category selected
      navigate('/categories'); // Navigate to base category page
      return;
    }

    const selected = categories.find(cat => cat._id === selectedId);
    if (selected?.slug) {
      setFilters(prev => ({ ...prev, selectedCategory: selectedId }));
      navigate(`/categories/${selected.slug}`); // Navigate to category slug URL
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
    navigate('/categories'); // Navigate back to default category page
  };

  const pageTitle = breadcrumb.length > 1
    ? breadcrumb[breadcrumb.length - 1]
    : 'Tất cả sản phẩm LIVENTO';

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
                delete newFilters.filter; // Clear filter if "All Products" is selected
              }
              setActiveFilters(newFilters);
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
              type="number"
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out shadow-sm"
              placeholder="Giá từ"
              value={filters.minPrice}
              onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
            />
            <input
              type="number"
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out shadow-sm"
              placeholder="Giá đến"
              value={filters.maxPrice}
              onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
            />
          </div>

          <select
            className="border border-gray-300 rounded-md px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out shadow-sm w-full sm:w-auto"
            value={filters.color}
            onChange={(e) => setFilters(prev => ({ ...prev, color: e.target.value }))}
          >
            <option value="">TẤT CẢ MÀU</option>
            <option value="đen">Đen</option>
            <option value="trắng">Trắng</option>
            <option value="xám">Xám</option>
            <option value="xanh">Xanh</option>
            <option value="đỏ">Đỏ</option>
            {/* Thêm các màu khác nếu cần */}
          </select>
            {/* You can add size filter similarly if needed */}
            {/*
            <select
                className="border border-gray-300 rounded-md px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out shadow-sm w-full sm:w-auto"
                value={filters.size}
                onChange={(e) => setFilters(prev => ({ ...prev, size: e.target.value }))}
            >
                <option value="">KÍCH CỠ</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
            </select>
            */}

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;