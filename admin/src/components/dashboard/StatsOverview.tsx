// components/dashboard/StatsOverview.tsx
import React, { useState, useEffect } from 'react';
import { fetchStats } from '../../Services/api';
import type { StatsOverview } from '../../Types/dashboard';
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

interface StatsOverviewProps {
  startDate?: string;
  endDate?: string;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({
  startDate,
  endDate,
}) => {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetchStats.overview({ startDate, endDate });
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
    labels: stats?.revenueByTime.map((item) => item.time) || [],
    datasets: [
      {
        label: 'Doanh thu',
        data: stats?.revenueByTime.map((item) => item.total) || [],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Doanh thu theo thời gian' },
    },
  };

  return (
    <div className="card">
      <h3 className="card-title">Tổng quan thống kê</h3>
      {loading ? (
        <p>Đang tải...</p>
      ) : error ? (
        <p className="text-error">{error}</p>
      ) : stats ? (
        <div className="stats-overview">
          <div className="stat-item">
            <h4>Tổng số đơn hàng</h4>
            <p className="stat-value">{stats.totalOrders}</p>
          </div>
          <div className="stat-item">
            <h4>Tổng doanh thu</h4>
            <p className="stat-value">
              {stats.totalRevenue.toLocaleString()} VND
            </p>
          </div>
          <div className="stat-item">
            <h4>Tổng số khách hàng</h4>
            <p className="stat-value">{stats.totalUsers}</p>
          </div>
          <div className="stat-item">
            <h4>Tổng sản phẩm bán</h4>
            <p className="stat-value">{stats.totalProductsSold}</p>
          </div>
          <div className="chart-container">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StatsOverview;
