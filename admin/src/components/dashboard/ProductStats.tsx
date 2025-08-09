import React, { useEffect, useState } from 'react';
import { ProductStats as ProductStatsType } from '../../Types/dashboard';
import ChartComponent from './ChartComponent';
import '../../index.css'; // Import CSS

const ProductStats: React.FC = () => {
  const [stats, setStats] = useState<ProductStatsType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateError, setDateError] = useState<string | null>(null);

  const currentDate = new Date().toISOString().split('T')[0]; // Lấy ngày hiện tại (08/08/2025)

  const validateDates = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (startDate && endDate) {
      if (end < start) {
        setDateError('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.');
        return false;
      }
      if (end > now || start > now) {
        setDateError('Ngày không thể lớn hơn ngày hiện tại.');
        return false;
      }
    }
    setDateError(null);
    return true;
  };

  const fetchData = async () => {
    if (!validateDates()) return;
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({ chartType, period });
      if (startDate && endDate) {
        query.append('startDate', startDate);
        query.append('endDate', endDate);
      }
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
    } catch (err: any) {
      console.error('Lỗi khi lấy dữ liệu sản phẩm:', err);
      setError(
        err.message || 'Không thể tải dữ liệu sản phẩm. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [chartType, period, startDate, endDate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Đang tải dữ liệu...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button className="retry-btn" onClick={fetchData}>
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="card product-stats">
      <div className="controls">
        <h2>Thống kê Sản phẩm</h2>
        <div className="filter-group">
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
              onChange={(e) => setChartType(e.target.value as 'bar' | 'pie')}
            >
              <option value="bar">Thanh</option>
              <option value="pie">Tròn</option>
            </select>
          </div>
          <div className="filter-item">
            <label>Từ ngày:</label>
            <input
              type="date"
              value={startDate}
              max={currentDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="filter-item">
            <label>Đến ngày:</label>
            <input
              type="date"
              value={endDate}
              max={currentDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        {dateError && <p className="date-error">{dateError}</p>}
      </div>

      {stats?.message && (
        <div className="no-data-message">
          <p>{stats.message}</p>
        </div>
      )}

      <div className="card-grid">
        <div className="stats-content">
          <h3>Thông tin tổng quan</h3>
          <p>
            Sản phẩm active:{' '}
            <strong>{formatNumber(stats?.productStats.active || 0)}</strong>
          </p>
          <p>
            Sản phẩm inactive:{' '}
            <strong>{formatNumber(stats?.productStats.inactive || 0)}</strong>
          </p>
          <p>
            Sản phẩm đang khuyến mãi:{' '}
            <strong>{formatNumber(stats?.productStats.flashSale || 0)}</strong>
          </p>
          <p>
            Tổng tồn kho:{' '}
            <strong>{formatNumber(stats?.productStats.totalStock || 0)}</strong>
          </p>
          <p>
            Tỷ lệ sản phẩm bán:{' '}
            <strong>{formatNumber(stats?.soldRatio || 0)}%</strong>
          </p>
          <p>
            Sản phẩm chưa bán:{' '}
            <strong>{formatNumber(stats?.unsoldProducts || 0)}</strong>
          </p>

          <h3>Top 5 sản phẩm bán chạy</h3>
          {stats?.topProducts.length ? (
            <ul>
              {stats.topProducts.map((product, index) => (
                <li key={index}>
                  {product.productName || 'Không xác định'}:{' '}
                  {formatNumber(product.totalSold)} sản phẩm,{' '}
                  {formatCurrency(product.totalRevenue)}
                  <img
                    src={`http://localhost:5000${product.colorImageUrl}`}
                    style={{
                      width: '50px',
                      height: '50px',
                      objectFit: 'cover',
                      marginRight: '10px',
                    }}
                  />
                  <span>
                    {product.dimensions || 'Không xác định'} -{' '}
                    {product.colorName || 'Không xác định'} -{' '}
                  </span>
                </li>
              ))}
            </ul>
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

        <div className="chart-container">
          {stats?.chart ? (
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
