import React, { useEffect, useState } from 'react';
import { RevenueStats as RevenueStatsType } from '../../Types/dashboard';
import ChartComponent from './ChartComponent';
import '../../index.css'; // Import CSS

const RevenueStats: React.FC = () => {
  const [stats, setStats] = useState<RevenueStatsType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('month');
  const [chartType, setChartType] = useState<'bar' | 'line'>('line');
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
      const query = new URLSearchParams({ period, chartType });
      if (startDate && endDate) {
        query.append('startDate', startDate);
        query.append('endDate', endDate);
      }
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/stats/revenue?${query.toString()}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Lỗi HTTP: ${response.status}`);
      }
      const data: RevenueStatsType = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu doanh thu:', err);
      setError('Không thể tải dữ liệu doanh thu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, chartType, startDate, endDate]);

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;
  if (error) {
    return (
      <div className="error">
        {error}
        <button onClick={fetchData}>Thử lại</button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="controls">
        <h2>Thống kê Doanh thu</h2>
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
              onChange={(e) => setChartType(e.target.value as 'bar' | 'line')}
            >
              <option value="line">Đường</option>
              <option value="bar">Thanh</option>
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
      <div className="card-grid">
        <div>
          <p>
            Doanh thu hiện tại:{' '}
            <strong>
              {(stats?.currentRevenue || 0).toLocaleString('vi-VN')} VND
            </strong>
          </p>
          <p>
            Doanh thu kỳ trước:{' '}
            <strong>
              {(stats?.previousRevenue || 0).toLocaleString('vi-VN')} VND
            </strong>
          </p>
          <p>
            Tỷ lệ tăng trưởng: <strong>{stats?.growthRate || 0}%</strong>
          </p>
          <p>
            Doanh thu trung bình/đơn:{' '}
            <strong>
              {(stats?.avgRevenuePerOrder || 0).toLocaleString('vi-VN')} VND
            </strong>
          </p>
          <h3>Trạng thái đơn hàng</h3>
          <ul>
            {stats?.orderStatus &&
              Object.entries(stats.orderStatus).map(([status, count]) => (
                <li key={status} className="capitalize">
                  {(() => {
                    switch (status) {
                      case 'pending':
                        return 'Chờ xử lý';
                      case 'processing':
                        return 'Đang xử lý';
                      case 'completed':
                        return 'Hoàn thành';
                      case 'cancelled':
                        return 'Đã hủy';
                      default:
                        return status;
                    }
                  })()}
                  : {count} đơn
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

export default RevenueStats;
