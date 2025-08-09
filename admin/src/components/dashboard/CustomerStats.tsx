import React, { useEffect, useState } from 'react';
import { CustomerStats as CustomerStatsType } from '../../Types/dashboard';
import ChartComponent from './ChartComponent';
import '../../CustomerStats.css'; // Import CSS

const CustomerStats: React.FC = () => {
  const [stats, setStats] = useState<CustomerStatsType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('month');
  const [chartType, setChartType] = useState<'bar' | 'pie'>('pie');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/stats/customers?period=${period}&chartType=${chartType}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);
      const data: CustomerStatsType = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu khách hàng:', err);
      setError('Không thể tải dữ liệu khách hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, chartType]);

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;
  if (error)
    return (
      <div className="error">
        {error}
        <button onClick={fetchData}>Thử lại</button>
      </div>
    );

  return (
    <div className="card">
      <div className="controls">
        <h2>Thống kê Khách hàng</h2>
        <div>
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
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as 'bar' | 'pie')}
          >
            <option value="pie">Tròn</option>
            <option value="bar">Thanh</option>
          </select>
        </div>
      </div>
      <div className="card-grid">
        <div>
          <p>
            Tổng khách hàng: <strong>{stats?.customerStats.total || 0}</strong>
          </p>
          <p>
            Khách hàng mới: <strong>{stats?.customerStats.new || 0}</strong>
          </p>
          <p>
            Khách hàng quay lại:{' '}
            <strong>{stats?.customerStats.returning || 0}</strong>
          </p>
          <p>
            Khách hàng mới trong tháng:{' '}
            <strong>{stats?.newCustomersThisMonth || 0}</strong>
          </p>
          <h3>Trạng thái đơn hàng</h3>
          <ul>
            {stats?.orderStatus &&
              Object.entries(stats.orderStatus).map(([status, count]) => (
                <li key={status} style={{ textTransform: 'capitalize' }}>
                  {status}: {count} đơn
                </li>
              ))}
          </ul>
          <h3>Top 5 địa điểm</h3>
          <ul>
            {stats?.topLocations.map((location, index) => (
              <li key={index}>
                {location._id}: {location.count} đơn
              </li>
            ))}
          </ul>
        </div>
        <div>
          {stats?.chart && (
            <ChartComponent
              chartData={{
                ...stats.chart,
                type: stats.chart.type as 'bar' | 'line' | 'pie',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerStats;
