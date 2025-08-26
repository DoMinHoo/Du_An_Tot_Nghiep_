import React, { useEffect, useState, useCallback } from 'react';
import { ProductStats as ProductStatsType } from '../../Types/dashboard';
import ChartComponent from './ChartComponent';
import '../../ProductStats.css';

const ProductStats: React.FC = () => {
  const [stats, setStats] = useState<ProductStatsType | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('month');
  const [filterOpen, setFilterOpen] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  /** 📊 Fetch API */
  const fetchData = useCallback(async () => {
    setIsFetching(true);
    setError(null);

    try {
      const query = new URLSearchParams({ chartType, period });
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/stats/products?${query.toString()}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Lỗi HTTP: ${response.status}`);
      }
      const data: ProductStatsType = await response.json();
      setStats(data);
      setCurrentPage(1);
    } catch (err: any) {
      console.error('Lỗi khi lấy dữ liệu sản phẩm:', err);
      setError(
        err.message || 'Không thể tải dữ liệu sản phẩm. Vui lòng thử lại.'
      );
    } finally {
      setIsFetching(false);
    }
  }, [chartType, period]);

  /** ⌨️ ESC để đóng filter */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) =>
      e.key === 'Escape' && setFilterOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const paginatedProducts = stats?.topProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil((stats?.topProducts.length || 0) / itemsPerPage);

  return (
    <div className="stats-panel">
      <div className="stats-controls">
        <div className="tit1">
          <h2>Thống kê Sản phẩm</h2>

          {/* Bộ lọc */}
          <div
            className={`filter-group1 ${filterOpen ? '' : 'collapsed'}`}
            role="complementary"
          >
            <button
              className="filter-close"
              onClick={() => setFilterOpen(false)}
              aria-label="Đóng bộ lọc"
            >
              ✕
            </button>
            <div className="filter-body">
              <div className="filter-group">
                <div className="filter-item1">
                  <div className="filter-item">
                    <label>Khoảng thời gian:</label>
                    <select
                      value={period}
                      onChange={(e) =>
                        setPeriod(e.target.value as 'day' | 'month' | 'year')
                      }
                    >
                      <option value="day">Ngày</option>
                      <option value="month">Tháng</option>
                      <option value="year">Năm</option>
                    </select>
                  </div>

                  <div className="filter-item">
                    <label>Loại biểu đồ:</label>
                    <select
                      value={chartType}
                      onChange={(e) =>
                        setChartType(e.target.value as 'bar' | 'pie')
                      }
                    >
                      <option value="bar">Thanh</option>
                      <option value="pie">Tròn</option>
                    </select>
                  </div>

                  <div className="filter-actions">
                    <button onClick={fetchData} className="btn-apply">
                      Áp dụng
                    </button>
                    <button
                      onClick={() => {
                        setPeriod('month');
                        setChartType('bar');
                      }}
                      className="btn-reset"
                    >
                      Đặt lại
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!filterOpen && (
            <button
              className="filter-toggle"
              onClick={() => setFilterOpen(true)}
              aria-label="Mở bộ lọc"
            >
              ☰
            </button>
          )}
        </div>
      </div>

      {isFetching && (
        <div className="stats-fetching">
          <div className="stats-spinner"></div>
          Đang cập nhật dữ liệu...
        </div>
      )}

      {error && (
        <div className="stats-error">
          <p>{error}</p>
          <button className="stats-retry-btn" onClick={fetchData}>
            Thử lại
          </button>
        </div>
      )}

      {stats?.message && (
        <div className="stats-no-data">
          <p>{stats.message}</p>
        </div>
      )}

      {chartType === 'pie' && stats?.topProducts.length > 10 && (
        <p className="stats-chart-warning">
          Biểu đồ tròn chỉ hiển thị tối đa 10 sản phẩm để đảm bảo tính trực
          quan.
        </p>
      )}

      <div className="stats-grid">
        <div className="stats-content">
          <h3>Thông tin tổng quan</h3>
          {stats ? (
            <div className="stats">
              <p className="total-revenue">
                Sản phẩm active:{' '}
                <strong>{formatNumber(stats.productStats.active || 0)}</strong>
              </p>
              <p className="total-revenue">
                Sản phẩm inactive:{' '}
                <strong>
                  {formatNumber(stats.productStats.inactive || 0)}
                </strong>
              </p>
              <p className="total-revenue">
                Sản phẩm đang khuyến mãi:{' '}
                <strong>
                  {formatNumber(stats.productStats.flashSale || 0)}
                </strong>
              </p>
              <p className="total-revenue">
                Tổng tồn kho:{' '}
                <strong>
                  {formatNumber(stats.productStats.totalStock || 0)}
                </strong>
              </p>
              <p className="total-revenue">
                Tỷ lệ sản phẩm bán:{' '}
                <strong>{formatNumber(stats.soldRatio || 0)}%</strong>
              </p>
              <p className="total-revenue">
                Sản phẩm chưa bán:{' '}
                <strong>{formatNumber(stats.unsoldProducts || 0)}</strong>
              </p>
            </div>
          ) : (
            <p>Không có dữ liệu tổng quan.</p>
          )}

          <h3>Top sản phẩm bán chạy</h3>
          {paginatedProducts?.length ? (
            <>
              <ul>
                {paginatedProducts.map((product, index) => (
                  <li key={index}>
                    <img
                      src={`http://localhost:5000${product.colorImageUrl}`}
                      alt={product.productName}
                      className="stats-product-image"
                    />
                    <span>
                      {product.productName || 'Không xác định'}:{' '}
                      {formatNumber(product.totalSold)} sản phẩm,{' '}
                      {formatCurrency(product.totalRevenue)} -{' '}
                      {product.dimensions || 'Không xác định'} -{' '}
                      {product.colorName || 'Không xác định'}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="stats-pagination">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Trước
                </button>
                <span>
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Sau
                </button>
              </div>
            </>
          ) : (
            <p>Không có sản phẩm bán chạy.</p>
          )}

          <h3>Sản phẩm tồn kho thấp</h3>
          {stats?.lowStockProducts.length ? (
            <ul>
              {stats.lowStockProducts.map((product, index) => (
                <li key={index}>
                  {product.name}: {formatNumber(product.stockQuantity)} sản phẩm
                </li>
              ))}
            </ul>
          ) : (
            <p>Không có sản phẩm tồn kho thấp.</p>
          )}

          <h3>Top 5 danh mục phổ biến</h3>
          {stats?.popularCategories.length ? (
            <ul>
              {stats.popularCategories.map((category, index) => (
                <li key={index}>
                  {category._id.categoryName || 'Không xác định'}:{' '}
                  {formatNumber(category.totalSold)} sản phẩm
                </li>
              ))}
            </ul>
          ) : (
            <p>Không có danh mục phổ biến.</p>
          )}
        </div>

        <div className="stats-chart">
          <h3 className="chart-title">Biểu đồ số lượng sản phẩm đã bán</h3>
          {isFetching ? (
            <div className="chart-loading">
              <div className="stats-spinner"></div>
              Đang tải biểu đồ...
            </div>
          ) : stats?.chart ? (
            <ChartComponent
              chartData={{
                ...stats.chart,
                type: stats.chart.type as 'bar' | 'pie',
              }}
            />
          ) : (
            <p>Không có dữ liệu để hiển thị biểu đồ.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductStats;
