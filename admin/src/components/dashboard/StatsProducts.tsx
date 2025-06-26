import React, { useState, useEffect } from 'react';
import { fetchStats } from '../../Services/api';
import type { StatsProducts } from '../../Types/dashboard';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StatsProducts: React.FC = () => {
  const [stats, setStats] = useState<StatsProducts | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>();
  // new Date(new Date().setDate(new Date().getDate() - 7))
  //   .toISOString()
  //   .split('T')[0]
  const [endDate, setEndDate] = useState<string>();
  // new Date().toISOString().split('T')[0]

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetchStats.products({
        startDate,
        endDate,
      });
      if (response.data.success) {
        setStats(response.data.data);
        setError(null);
      } else {
        setError(response.data.message || 'Không thể tải dữ liệu thống kê');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const chartData = {
    labels: stats?.bestSellingProducts.map((item) => item.productName) || [],
    datasets: [
      {
        label: 'Số lượng bán',
        data:
          stats?.bestSellingProducts.map((item) => item.totalQuantity) || [],
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Sản phẩm bán chạy' },
    },
  };

  const getImageUrl = (product: any) => {
    const isFullUrl = (url: string) => /^https?:\/\//.test(url);
    const baseUrl = 'http://localhost:5000';
    if (product.colorImageUrl && typeof product.colorImageUrl === 'string') {
      return isFullUrl(product.colorImageUrl)
        ? product.colorImageUrl
        : `${baseUrl}${product.colorImageUrl}`;
    }
    return '/placeholder.png';
  };

  return (
    <div className="container-no-shadow">
      <h2 className="heading-2xl">Thống kê sản phẩm</h2>
      <div className="input-group">
        <div className="input-wrapper">
          <label htmlFor="startDate" className="input-label">
            Ngày bắt đầu
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input"
          />
        </div>
        <div className="input-wrapper">
          <label htmlFor="endDate" className="input-label">
            Ngày kết thúc
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input"
          />
        </div>
      </div>
      {loading ? (
        <p>Đang tải...</p>
      ) : error ? (
        <p className="text-error">{error}</p>
      ) : stats ? (
        <div className="grid">
          <div className="card">
            <h3 className="heading-3">Sản phẩm tồn kho thấp</h3>
            <ul className="list">
              {stats.lowStockProducts.map((product, index) => (
                <li key={index} className="list-item">
                  <img
                    src={getImageUrl(product)}
                    alt={product.name || 'Product image'}
                    className="product-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.png';
                    }}
                  />
                  <span>
                    {product.productId?.name || 'Unknown'} -{' '}
                    {product.stockQuantity} còn lại
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3 className="heading-3">Sản phẩm hoàn trả nhiều</h3>
            <ul className="list">
              {stats.highReturnProducts.map((product, index) => (
                <li key={index} className="list-item">
                  {product.productName || 'Unknown'} - {product.totalReturns}{' '}
                  lần
                </li>
              ))}
            </ul>
          </div>
          <div className="card grid-full">
            <h3 className="heading-3">Sản phẩm không bán được</h3>
            <ul className="list grid ">
              {stats.unsoldProducts.length > 0 ? (
                stats.unsoldProducts.map((product, index) => (
                  <li key={index} className="list-item">
                    <img
                      src={getImageUrl(product)}
                      alt={product.productName || 'Product image'}
                      className="product-image "
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.png';
                      }}
                    />
                    <span>
                      {product.productName || 'Unknown'} -{' '}
                      {product.variationName} ({product.stockQuantity} trong
                      kho)
                    </span>
                  </li>
                ))
              ) : (
                <li className="list-item">
                  Không có sản phẩm nào không bán được
                </li>
              )}
            </ul>
          </div>
          <div className="card grid-full">
            <h3 className="heading-3">Sản phẩm bán chạy</h3>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StatsProducts;
