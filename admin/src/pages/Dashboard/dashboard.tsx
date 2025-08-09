import React from 'react';
import RevenueStats from '../../components/dashboard/RevenueStats';

const AdminDashboard: React.FC = () => {
  return (
    <div className="container">
      <h1>Bảng điều khiển Admin</h1>
      <RevenueStats />
    </div>
  );
};

export default AdminDashboard;
