import React, { useEffect, useState, useCallback } from 'react';
import { RevenueStats as RevenueStatsType } from '../../Types/dashboard';
import ChartComponent from './ChartComponent';
import '../../RevenueStats.css'; // Import CSS

const RevenueStats: React.FC = () => {
  const [stats, setStats] = useState<RevenueStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('month');
  const [chartType, setChartType] = useState<'bar' | 'line'>('line');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(true);
  const currentDate = new Date().toISOString().split('T')[0]; // yyyy-mm-dd

  /** 🔎 Validate ngày */
  const validateDates = useCallback(() => {
    if (!startDate || !endDate) return true;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (end < start) {
      setDateError('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.');
      return false;
    }
    if (end > now || start > now) {
      setDateError('Ngày không thể lớn hơn ngày hiện tại.');
      return false;
    }
    setDateError(null);
    return true;
  }, [startDate, endDate]);

  /** 📊 Fetch API */
  const fetchData = useCallback(async () => {
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
  }, [period, chartType, startDate, endDate, validateDates]);

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
      <div className="controls1">
        <div className="tit1">
          <h2>Thống kê Doanh thu</h2>

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
                        setPeriod(e.target.value as typeof period)
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
                        setChartType(e.target.value as typeof chartType)
                      }
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

                  <div className="filter-actions">
                    <button onClick={fetchData} className="btn-apply">
                      Áp dụng
                    </button>
                    <button
                      onClick={() => {
                        setStartDate('');
                        setEndDate('');
                        setPeriod('month');
                        setChartType('line');
                        setDateError(null);
                      }}
                      className="btn-reset"
                    >
                      Đặt lại
                    </button>
                  </div>
                </div>
                {dateError && <p className="date-error">{dateError}</p>}
              </div>
            </div>
          </div>

          {/* nút mở lại khi collapsed */}
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

      <div className="card-grid">
        {/* Số liệu tổng quan */}
        <div>
          <div className="stats">
            <p className="total-revenue">
              Doanh thu hiện tại:{' '}
              <strong>
                {(stats?.currentRevenue || 0).toLocaleString('vi-VN')} VND
              </strong>
            </p>
            <p className="total-revenue">
              Doanh thu kỳ trước:{' '}
              <strong>
                {(stats?.previousRevenue || 0).toLocaleString('vi-VN')} VND
              </strong>
            </p>
            <p className="total-revenue">
              Tỷ lệ tăng trưởng: <strong>{stats?.growthRate || 0}%</strong>
            </p>
            <p className="total-revenue">
              Doanh thu trung bình/đơn:{' '}
              <strong>
                {(stats?.avgRevenuePerOrder || 0).toLocaleString('vi-VN')} VND
              </strong>
            </p>
            <p className="total-revenue">
              Thanh toán COD:{' '}
              <strong>{stats?.paymentMethods?.cod || 0} người</strong>
            </p>
            <p className="total-revenue">
              Thanh toán ZaloPay:{' '}
              <strong>{stats?.paymentMethods?.zaloPay || 0} người</strong>
            </p>
          </div>

          {/* Trạng thái đơn */}
          <div className="order-status1">
            <h3>Trạng thái đơn hàng:</h3>
            <ul className="order-status">
              {stats?.orderStatus &&
                Object.entries(stats.orderStatus).map(([status, count]) => (
                  <li key={status} className="capitalize">
                    {(() => {
                      switch (status) {
                        case 'pending':
                          return 'Chờ xử lý';
                        case 'confirmed':
                          return 'Đã xác nhận';
                        case 'completed':
                          return 'Hoàn thành';
                        case 'canceled':
                          return 'Đã hủy';
                        case 'shipping':
                          return 'Đang giao hàng';
                        default:
                          return status;
                      }
                    })()}{' '}
                    : {count} đơn
                  </li>
                ))}
            </ul>
          </div>
        </div>

        {/* Biểu đồ */}
        <div className="chart-container1">
          {stats?.chart && (
            <ChartComponent
              chartData={{
                ...stats.chart,
                type: stats.chart.type as 'bar' | 'line',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueStats;
