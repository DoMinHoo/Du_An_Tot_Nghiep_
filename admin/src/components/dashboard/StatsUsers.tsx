import React, { useState, useEffect } from 'react';
import { fetchStats } from '../../Services/api';
import type { StatsUsers } from '../../Types/dashboard';

const StatsUsers: React.FC = () => {
  const [stats, setStats] = useState<StatsUsers | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>();
  // new Date(new Date().setDate(new Date().getDate() - 7))
  // .toISOString()
  // .split('T')[0]
  const [endDate, setEndDate] = useState<string>();
  // new Date().toISOString().split('T')[0]

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetchStats.users({
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

  return (
    <div className="container">
      <h2 className="heading-2xl">Thống kê người dùng</h2>
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
            <h3 className="heading-3">Khách hàng mới</h3>
            <p className="text-xl">{stats.newUsers}</p>
          </div>
          <div className="card">
            <h3 className="heading-3">Khách hàng tích cực nhất</h3>
            <ul className="list">
              {stats.activeUsers.map((user, index) => (
                <li key={index} className="list-item">
                  {user.name} - {user.totalOrders} đơn
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StatsUsers;
