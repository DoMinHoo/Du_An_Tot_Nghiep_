// components/dashboard/StatsRevenue.tsx
import React, { useState, useEffect } from 'react';
import { fetchStats } from '../../Services/api';
import type { StatsRevenue } from '../../Types/dashboard';
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

interface StatsRevenueProps {
  startDate?: string;
  endDate?: string;
}

const StatsRevenue: React.FC<StatsRevenueProps> = ({ startDate, endDate }) => {
  const [stats, setStats] = useState<StatsRevenue | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetchStats.revenue({ startDate, endDate });
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
    labels: stats?.revenueByCategory.map((item) => item.category) || [],
    datasets: [
      {
        label: 'Doanh thu (VND)',
        data: stats?.revenueByCategory.map((item) => item.total) || [],
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Doanh thu theo danh mục' },
    },
  };

  return (
    <div className="container">
      <h2 className="heading-2xl">Thống kê doanh thu</h2>
      {loading ? (
        <p>Đang tải...</p>
      ) : error ? (
        <p className="text-error">{error}</p>
      ) : stats ? (
        <div className="grid width-full">
          <div className="card">
            <h3 className="heading-3">Doanh thu theo danh mục</h3>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StatsRevenue;
