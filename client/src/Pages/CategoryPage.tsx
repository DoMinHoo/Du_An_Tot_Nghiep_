import React, { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../Components/Common/ProductCard';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Product {
  _id: string;
  [key: string]: any;
}

interface Filters {
  selectedCategory: string;
  priceSort: string;
  color: string;
  size: string;
  productFilter: string;
  minPrice: string;
  maxPrice: string;
}

interface APIResponse {
  data?: Product[];
  breadcrumb?: string[];
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
    priceSort: '',
    color: '',
    size: '',
    productFilter: '',
    minPrice: '',
    maxPrice: '',
  });

  const [activeFilters, setActiveFilters] = useState<{ [key: string]: string }>({});

  // Fetch all categories
  useEffect(() => {
    axios.get('http://localhost:5000/api/categories')
      .then(res => setCategories(res.data || []))
      .catch(err => console.error('Lỗi lấy danh mục:', err));
  }, []);

  // Fetch category by slug
  useEffect(() => {
    if (!slug) {
      setFilters(prev => ({ ...prev, selectedCategory: '' }));
      setActiveFilters({});
      return;
    }

    const fetchCategoryBySlug = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/categories/slug/${slug}`);
        const cat: Category = res.data?.category;
        if (cat && cat._id) {
          setFilters(prev => ({ ...prev, selectedCategory: cat._id }));
          setActiveFilters(prev => ({ ...prev, category: cat._id }));
        }
      } catch (err) {
        setError('Không tìm thấy danh mục');
      }
    };

    fetchCategoryBySlug();
  }, [slug]);

  // Fetch products based on filters
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const query = new URLSearchParams(activeFilters).toString();
        const res = await axios.get<APIResponse>(`http://localhost:5000/api/products?${query}`);
        setProducts(res.data?.data || []);
        setBreadcrumb(res.data?.breadcrumb || []);
      } catch (err) {
        console.error('Lỗi lấy sản phẩm:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [activeFilters]);

  // Handle category select change
  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;

    if (!selectedId) {
      setFilters(prev => ({ ...prev, selectedCategory: '' }));
      setActiveFilters({});
      navigate('/categories');
      return;
    }

    const selected = categories.find(cat => cat._id === selectedId);
    if (selected?.slug) {
      setFilters(prev => ({ ...prev, selectedCategory: selectedId }));
      navigate(`/categories/${selected.slug}`);
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
    setBreadcrumb([]);
    setActiveFilters({});
    navigate('/categories');
  };

  const pageTitle = breadcrumb.length > 1
    ? breadcrumb[breadcrumb.length - 1]
    : 'Tất cả sản phẩm LIVENTO';

  if (loading) return <div className="p-6 text-gray-500">Đang tải...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <nav className="text-sm text-gray-500 mb-4">
        {breadcrumb.length > 0 ? (
          breadcrumb.map((item, idx) => (
            <span key={idx}>
              {idx === 0 ? (
                <Link to="/" className="hover:underline">{item}</Link>
              ) : (
                <span className="text-gray-700 font-medium">{item}</span>
              )}
              {idx < breadcrumb.length - 1 && <span className="mx-2">›</span>}
            </span>
          ))
        ) : (
          <span className="text-gray-700 font-medium">Tất cả sản phẩm</span>
        )}
      </nav>

      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
  <h2 className="text-2xl font-bold">
    {filters.productFilter === "new"
      ? "Sản phẩm mới nhất"
      : filters.productFilter === "hot"
      ? "Sản phẩm bán chạy"
      : pageTitle}
  </h2>

  <select
    className="border px-3 py-1 rounded"
    value={filters.productFilter}
    onChange={(e) => {
      const value = e.target.value;
      setFilters(prev => ({ ...prev, productFilter: value }));

      // Tự động lọc lại khi chọn hot/new
      const newFilters = {
        ...activeFilters,
        ...(value === "hot" || value === "new" ? { filter: value } : {}),
      };

      // Xóa nếu chọn lại "Sản phẩm nổi bật"
      if (value === "") {
        delete newFilters.filter;
      }

      setActiveFilters(newFilters);
    }}
  >
    <option value="">Sản phẩm nổi bật</option>
    <option value="new">Mới nhất</option>
    <option value="hot">Bán chạy</option>
  </select>
</div>


      <div className="flex flex-wrap items-center gap-4 mb-6">
        <span className="font-semibold">Bộ lọc</span>

        <select
          className="border px-3 py-1 rounded"
          value={filters.selectedCategory}
          onChange={handleCategoryChange}
        >
          <option value="">DANH MỤC</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>

        <input
          type="number"
          className="border px-2 py-1 w-24 rounded"
          placeholder="KM từ"
          value={filters.minPrice}
          onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
        />
        <input
          type="number"
          className="border px-2 py-1 w-24 rounded"
          placeholder="KM đến"
          value={filters.maxPrice}
          onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
        />

        <select
          className="border px-3 py-1 rounded"
          value={filters.color}
          onChange={(e) => setFilters(prev => ({ ...prev, color: e.target.value }))}
        >
          <option value="">MÀU SẮC</option>
          <option value="đen">Đen</option>
          <option value="trắng">Trắng</option>
          <option value="xám">Xám</option>
        </select>

        <select
          className="border px-3 py-1 rounded"
          value={filters.size}
          onChange={(e) => setFilters(prev => ({ ...prev, size: e.target.value }))}
        >
          <option value="">KÍCH THƯỚC</option>
          <option value="nhỏ">Nhỏ</option>
          <option value="vừa">Vừa</option>
          <option value="lớn">Lớn</option>
        </select>

        <button
          onClick={handleFilter}
          className="bg-black text-white px-4 py-1 rounded hover:bg-gray-800 text-sm"
        >
          Lọc kết quả
        </button>

        <button
          onClick={handleClearFilters}
          className="text-sm text-red-500 hover:underline"
        >
          Xoá bộ lọc
        </button>
      </div>

      {products.length === 0 ? (
        <p className="text-gray-500">Không có sản phẩm nào.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
