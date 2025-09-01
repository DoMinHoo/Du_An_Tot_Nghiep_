import React, { useEffect, useState } from 'react';
import ProductSection from '../Components/Common/ProductSection';
import ProductList from '../Components/Common/ProductList';
import { Link } from 'react-router-dom';
import type { Product } from '../types/Product';
import type { Variation } from '../types/Variations';

type PostPreview = {
  _id: string;
  title: string;
  slug?: string;
  coverImage?: string;
  content?: string;
  createdAt?: string;
  published?: boolean;
};

const HomePage = () => {
  const [newProducts, setNewProducts] = useState<(Product & Variation)[]>([]);
  const [hotProducts, setHotProducts] = useState<(Product & Variation)[]>([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState<(Product & Variation)[]>([]);

  // Posts (news) state with pagination
  const [posts, setPosts] = useState<PostPreview[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [newsPage, setNewsPage] = useState(1);
  const [newsLimit] = useState(3); // items per page
  const [newsTotalPages, setNewsTotalPages] = useState(1);
  const [newsTotalItems, setNewsTotalItems] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const baseUrl = 'http://localhost:5000/api/products?limit=8';

        const urls = [
          `${baseUrl}&filter=new`,
          `${baseUrl}&filter=hot`,
          `${baseUrl}&flashSaleOnly=true`,
        ];

        const [resNew, resHot, resFlash] = await Promise.all(
          urls.map((url) => fetch(url))
        );

        const [dataNew, dataHot, dataFlash] = await Promise.all([
          resNew.json(),
          resHot.json(),
          resFlash.json(),
        ]);

        setNewProducts(dataNew.data || []);
        setHotProducts(dataHot.data || []);
        setFlashSaleProducts(dataFlash.data || []);
      } catch (err) {
        console.error('Lỗi khi load sản phẩm:', err);
      }
    };

    fetchAll();
  }, []);

  // Helper strip html
  const stripHtml = (html?: string, maxLength = 140) => {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || div.innerText || '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Fetch posts for news section (with pagination)
  const fetchPosts = async (page = 1) => {
    setPostsLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/posts?page=${page}&limit=${newsLimit}`);
      const json = await res.json();

      const list: PostPreview[] = json?.data || [];
      const published = list.filter((p) => p.published !== false); // nếu có field published
      setPosts(published);

      // read pagination from backend (adjust keys if your backend uses different names)
      const pagination = json?.pagination || {};
      const totalItems = pagination.totalPosts ?? pagination.total ?? published.length;
      const totalPages = pagination.totalPages ?? Math.ceil(totalItems / newsLimit);

      setNewsTotalItems(totalItems);
      setNewsTotalPages(totalPages);
      setNewsPage(pagination.currentPage ?? page);
    } catch (err) {
      console.error('Lỗi khi load posts:', err);
      setPosts([]);
      setNewsTotalItems(0);
      setNewsTotalPages(1);
      setNewsPage(1);
    } finally {
      setPostsLoading(false);
    }
  };

  // Load first page on mount
  useEffect(() => {
    fetchPosts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewsPageChange = (page: number) => {
    if (page < 1 || page > newsTotalPages || page === newsPage) return;
    fetchPosts(page);
  };

  // Render page buttons (limit number shown if many pages)
  const renderPageButtons = () => {
    const pages: number[] = [];
    const maxButtons = 7; // show at most 7 page buttons
    let start = 1;
    let end = newsTotalPages;

    if (newsTotalPages > maxButtons) {
      const half = Math.floor(maxButtons / 2);
      start = Math.max(1, newsPage - half);
      end = Math.min(newsTotalPages, start + maxButtons - 1);
      if (end - start < maxButtons - 1) {
        start = Math.max(1, end - maxButtons + 1);
      }
    }

    for (let i = start; i <= end; i++) pages.push(i);

    return (
      <div className="flex items-center justify-center mt-4 space-x-2">
        <button
          onClick={() => handleNewsPageChange(1)}
          disabled={newsPage === 1 || postsLoading}
          className={`px-3 py-1 rounded border ${newsPage === 1 ? 'text-gray-400 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-100'}`}
        >
          «
        </button>

        <button
          onClick={() => handleNewsPageChange(newsPage - 1)}
          disabled={newsPage === 1 || postsLoading}
          className={`px-3 py-1 rounded border ${newsPage === 1 ? 'text-gray-400 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-100'}`}
        >
          ‹
        </button>

        {start > 1 && (
          <>
            <button onClick={() => handleNewsPageChange(1)} className="px-3 py-1 rounded border hover:bg-gray-100">1</button>
            {start > 2 && <span className="px-2">...</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => handleNewsPageChange(p)}
            className={`px-3 py-1 rounded border ${p === newsPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
            disabled={postsLoading}
          >
            {p}
          </button>
        ))}

        {end < newsTotalPages && (
          <>
            {end < newsTotalPages - 1 && <span className="px-2">...</span>}
            <button onClick={() => handleNewsPageChange(newsTotalPages)} className="px-3 py-1 rounded border hover:bg-gray-100">{newsTotalPages}</button>
          </>
        )}

        <button
          onClick={() => handleNewsPageChange(newsPage + 1)}
          disabled={newsPage === newsTotalPages || postsLoading}
          className={`px-3 py-1 rounded border ${newsPage === newsTotalPages ? 'text-gray-400 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-100'}`}
        >
          ›
        </button>

        <button
          onClick={() => handleNewsPageChange(newsTotalPages)}
          disabled={newsPage === newsTotalPages || postsLoading}
          className={`px-3 py-1 rounded border ${newsPage === newsTotalPages ? 'text-gray-400 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-100'}`}
        >
          »
        </button>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <ProductSection title="Flash Sale" products={flashSaleProducts} />
      <ProductSection title="Sản phẩm mới" products={newProducts} filterType="new" />
      <ProductSection title="Bán chạy nhất" products={hotProducts} filterType="hot" />

      <h1 className="text-2xl md:text-3xl mb-4 mt-3 font-bold text-gray-800">Gợi Ý</h1>
      <ProductList />

      {/* News / Blog previews with pagination */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Tin tức &amp; Cẩm nang</h2>
          <div className="flex items-center gap-3">
            <Link to="/news" className="text-sm text-blue-600 hover:underline">Xem tất cả »</Link>
          </div>
        </div>

        <div className="relative bg-transparent">
          {/* LEFT / RIGHT arrow buttons (overlay like banner) */}
          <button
            onClick={() => handleNewsPageChange(Math.max(1, newsPage - 1))}
            disabled={newsPage === 1 || postsLoading}
            aria-label="Previous news page"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/90 shadow hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {/* left chevron SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={() => handleNewsPageChange(Math.min(newsTotalPages, newsPage + 1))}
            disabled={newsPage === newsTotalPages || postsLoading}
            aria-label="Next news page"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/90 shadow hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {/* right chevron SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* content area */}
          {postsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-56 bg-gray-100 animate-pulse rounded" />
              <div className="h-56 bg-gray-100 animate-pulse rounded" />
              <div className="h-56 bg-gray-100 animate-pulse rounded" />
            </div>
          ) : posts.length === 0 ? (
            <p className="text-gray-500">Hiện chưa có bài viết nào.</p>
          ) : (
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <article
                    key={post._id}
                    className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition"
                  >
                    <Link to={`/news/${post.slug || post._id}`}>
                      <div className="h-44 w-full overflow-hidden">
                        <img
                          src={post.coverImage ? `http://localhost:5000${post.coverImage}` : '/placeholder.png'}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>

                    <div className="p-4 flex flex-col h-44">
                      <Link to={`/news/${post.slug || post._id}`}>
                        <h3 className="text-lg font-semibold mb-2 line-clamp-2">{post.title}</h3>
                      </Link>

                      <p className="text-sm text-gray-600 flex-grow">{stripHtml(post.content, 120)}</p>

                      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                        <time>{post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : ''}</time>
                        <Link to={`/news/${post.slug || post._id}`} className="text-blue-600">Xem thêm »</Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* DOTS (center bottom) - like banner */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-[-18px] z-30 flex items-center gap-2">
                {Array.from({ length: newsTotalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const active = pageNum === newsPage;
                  return (
                    <button
                      key={pageNum}
                      aria-label={`Go to page ${pageNum}`}
                      onClick={() => handleNewsPageChange(pageNum)}
                      className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${active ? 'bg-white border border-gray-300 shadow' : 'bg-white/60 hover:bg-white'} transition`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* bottom quick controls (optional) */}
        <div className="mt-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNewsPageChange(1)}
              disabled={newsPage === 1 || postsLoading}
              className="px-3 py-1 rounded border text-sm hover:bg-gray-100 disabled:opacity-50"
            >
              Đầu
            </button>
            <button
              onClick={() => handleNewsPageChange(newsPage - 1)}
              disabled={newsPage === 1 || postsLoading}
              className="px-3 py-1 rounded border text-sm hover:bg-gray-100 disabled:opacity-50"
            >
              Trước
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Trang {newsPage} / {newsTotalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNewsPageChange(newsPage + 1)}
              disabled={newsPage === newsTotalPages || postsLoading}
              className="px-3 py-1 rounded border text-sm hover:bg-gray-100 disabled:opacity-50"
            >
              Sau
            </button>
            <button
              onClick={() => handleNewsPageChange(newsTotalPages)}
              disabled={newsPage === newsTotalPages || postsLoading}
              className="px-3 py-1 rounded border text-sm hover:bg-gray-100 disabled:opacity-50"
            >
              Cuối
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
