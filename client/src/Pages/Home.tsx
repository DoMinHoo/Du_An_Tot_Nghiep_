import React, { useEffect, useState } from 'react';
import ProductSection from '../Components/Common/ProductSection';
import ProductList from '../Components/Common/ProductList';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import type { Product } from '../types/Product';
import type { Variation } from '../types/Variations';
import type { Swiper as SwiperType } from "swiper";

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

  const [posts, setPosts] = useState<PostPreview[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [newsPage, setNewsPage] = useState(1);
  const [newsLimit] = useState(6);
  const [newsTotalPages, setNewsTotalPages] = useState(1);

  // fetch sản phẩm
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const baseUrl = 'http://localhost:5000/api/products?limit=8';
        const urls = [
          `${baseUrl}&filter=new`,
          `${baseUrl}&filter=hot`,
          `${baseUrl}&flashSaleOnly=true`,
        ];
        const [resNew, resHot, resFlash] = await Promise.all(urls.map(url => fetch(url)));
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

  // helper
  const stripHtml = (html?: string, maxLength = 120) => {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || div.innerText || '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // fetch posts
  const fetchPosts = async (page = 1) => {
    setPostsLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/posts?page=${page}&limit=${newsLimit}`);
      const json = await res.json();
      const list: PostPreview[] = json?.data || [];
      const published = list.filter((p) => p.published !== false);
      setPosts(prev => [...prev, ...published]);

      const pagination = json?.pagination || {};
      const totalPages = pagination.totalPages ?? page;
      setNewsTotalPages(totalPages);
      setNewsPage(page);
    } catch (err) {
      console.error('Lỗi khi load posts:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <ProductSection title="Flash Sale" products={flashSaleProducts} />
      <ProductSection title="Sản phẩm mới" products={newProducts} filterType="new" />
      <ProductSection title="Bán chạy nhất" products={hotProducts} filterType="hot" />

      <h1 className="text-2xl md:text-3xl mb-4 mt-3 font-bold text-gray-800">Gợi Ý</h1>
      <ProductList />

      {/* Tin tức & Cẩm nang */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl md:text-3xl mb-4 mt-3 font-bold text-gray-800">
            Tin tức &amp; Cẩm nang
          </h2>
          <Link to="/news" className="text-sm text-blue-600 hover:underline">
            Xem tất cả »
          </Link>
        </div>

        {postsLoading && posts.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-56 bg-gray-100 animate-pulse rounded" />
            <div className="h-56 bg-gray-100 animate-pulse rounded" />
            <div className="h-56 bg-gray-100 animate-pulse rounded" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-gray-500">Hiện chưa có bài viết nào.</p>
        ) : (
          <Swiper
            spaceBetween={20}
            slidesPerView={1.2}
            breakpoints={{
              640: { slidesPerView: 2.2 },
              1024: { slidesPerView: 3.2 },
            }}
            onReachEnd={() => {
              if (newsPage < newsTotalPages && !postsLoading) {
                fetchPosts(newsPage + 1);
              }
            }}
          >
            {posts.map((post) => (
              <SwiperSlide key={post._id}>
                <article className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition">
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
                    <p className="text-sm text-gray-600 flex-grow">{stripHtml(post.content, 100)}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                      <time>
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : ''}
                      </time>
                      <Link to={`/news/${post.slug || post._id}`} className="text-blue-600">Xem thêm »</Link>
                    </div>
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </section>
    </div>
  );
};

export default HomePage;
