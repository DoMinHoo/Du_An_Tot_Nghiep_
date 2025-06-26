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

const StatsOverview: React.FC = () => {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>();
  const [endDate, setEndDate] = useState<string>();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetchStats.overview({
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
    <div className="container-no-shadow">
      <h2 className="heading-2xl">Tổng quan thống kê</h2>
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
            <h3 className="heading-3">Tổng số đơn hàng</h3>
            <p className="text-xl">{stats.totalOrders}</p>
          </div>
          <div className="card">
            <h3 className="heading-3">Tổng doanh thu</h3>
            <p className="text-xl">{stats.totalRevenue.toLocaleString()} VND</p>
          </div>
          <div className="card">
            <h3 className="heading-3">Tổng số khách hàng</h3>
            <p className="text-xl">{stats.totalUsers}</p>
          </div>
          <div className="card">
            <h3 className="heading-3">Tổng sản phẩm bán</h3>
            <p className="text-xl">{stats.totalProductsSold}</p>
          </div>
          <div className="card grid-full">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StatsOverview;
