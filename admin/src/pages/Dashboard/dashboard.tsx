import React from 'react';
import StatsOverview from '../../components/dashboard/StatsOverview';
import StatsOrders from '../../components/dashboard/StatsOrders';
import StatsProducts from '../../components/dashboard/StatsProducts';
import StatsUsers from '../../components/dashboard/StatsUsers';
import StatsRevenue from '../../components/dashboard/StatsRevenue';
const Dashboard: React.FC = () => {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Bảng điều khiển quản trị</h1>
      </header>
      <main className="dashboard-main">
        <StatsOverview />
        <StatsOrders />
        <StatsProducts />
        <StatsUsers />
        <StatsRevenue />
      </main>
    </div>
  );
};

export default Dashboard;
