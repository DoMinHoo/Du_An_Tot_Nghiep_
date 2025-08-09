import React from 'react';
import RevenueStats from '../../components/dashboard/RevenueStats';
import ProductStats from '../../components/dashboard/ProductStats';
import CustomerStats from '../../components/dashboard/CustomerStats';

const AdminDashboard: React.FC = () => {
  return (
    <div className="container">
      <h1>Bảng điều khiển Admin</h1>
      <RevenueStats />
    </div>
  );
};

export default AdminDashboard;
