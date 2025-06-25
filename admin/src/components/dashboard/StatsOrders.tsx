import React, { useState, useEffect } from 'react';
import { fetchStats } from '../../Services/api';
import type { StatsOrders } from '../../Types/dashboard';
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

const StatsOrders: React.FC = () => {
  const [stats, setStats] = useState<StatsOrders | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>();
  const [endDate, setEndDate] = useState<string>();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetchStats.orders({
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
    labels: stats?.ordersByStatus.map((item) => item.status) || [],
    datasets: [
      {
        label: 'Số lượng đơn hàng',
        data: stats?.ordersByStatus.map((item) => item.count) || [],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Đơn hàng theo trạng thái' },
    },
  };

  return (
    <div className="container">
      <h2 className="heading-2xl">Thống kê đơn hàng</h2>
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
            <h3 className="heading-3">Đơn hàng theo trạng thái</h3>
            <Bar data={chartData} options={chartOptions} />
          </div>
          <div className="card">
            <h3 className="heading-3">Giá trị đơn hàng trung bình</h3>
            <p className="text-xl">
              {stats.avgOrderValue.toLocaleString()} VND
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StatsOrders;
