import React, { useEffect, useState, useCallback } from 'react';
import { CustomerStats as CustomerStatsType } from '../../Types/dashboard';
import ChartComponent from './ChartComponent';
import '../../RevenueStats.css';

const CustomerStats: React.FC = () => {
  const [stats, setStats] = useState<CustomerStatsType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Chỉ giữ lại 2 filter
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('month');
  const [chartType, setChartType] = useState<'bar' | 'pie'>('pie');
  const [filterOpen, setFilterOpen] = useState<boolean>(true);

  /** 📊 Fetch API chỉ theo period + chartType */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({ period, chartType });

      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/stats/customers?${query.toString()}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      if (!response.ok) {
        let errorMessage = `Lỗi HTTP: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData?.message) errorMessage = errorData.message;
        } catch {
          /* ignore */
        }
        throw new Error(errorMessage);
      }

      const data: CustomerStatsType = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu khách hàng:', err);
      setError('Không thể tải dữ liệu khách hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [period, chartType]);

  // fetch khi thay đổi filter
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ESC để đóng filter
  useEffect(() => {
    const onKey = (e: KeyboardEvent) =>
      e.key === 'Escape' && setFilterOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
          <h2>Thống kê Khách hàng</h2>

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
                      <option value="pie">Tròn</option>
                      <option value="bar">Thanh</option>
                    </select>
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

      <div className="card-grid">
        <div>
          <div className="stats1">
            <p className="total-revenue">
              Tổng khách hàng:{' '}
              <strong>{stats?.customerStats?.total || 0}</strong>
            </p>
            <p className="total-revenue">
              Khách hàng mới: <strong>{stats?.customerStats?.new || 0}</strong>
            </p>
            <p className="total-revenue">
              Khách hàng quay lại:{' '}
              <strong>{stats?.customerStats?.returning || 0}</strong>
            </p>
            <p className="total-revenue">
              Khách hàng mới trong tháng:{' '}
              <strong>{stats?.newCustomersThisMonth || 0}</strong>
            </p>
          </div>

          <div className="order-status1">
            <h3>Trạng thái đơn hàng:</h3>
            <ul className="order-status">
              {stats?.orderStatus &&
                Object.entries(stats.orderStatus).map(([status, count]) => (
                  <li
                    key={status}
                    style={{ textTransform: 'capitalize' }}
                    className="capitalize"
                  >
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
                    })()}
                    : {count} đơn
                  </li>
                ))}
            </ul>
          </div>
          <div className="stats-content">
            <h3>Top 5 địa điểm</h3>
            <ul>
              {stats?.topLocations?.map((location, index) => (
                <li key={index}>
                  {location._id}: {location.count} đơn
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="chart-container1">
          <h3 className="chart-title">Biểu đồ trạng thái đơn hàng</h3>
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
