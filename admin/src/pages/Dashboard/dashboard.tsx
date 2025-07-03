// components/dashboard/Dashboard.tsx
import React, { useState } from 'react';
import DateFilterForm from '../../DateRangeFilter';
import StatsOverview from '../../components/dashboard/StatsOverview';
import StatsOrders from '../../components/dashboard/StatsOrders';
import StatsProducts from '../../components/dashboard/StatsProducts';
import StatsUsers from '../../components/dashboard/StatsUsers';
import StatsRevenue from '../../components/dashboard/StatsRevenue';


const Dashboard: React.FC = () => {
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();

  const handleDateChange = (
    start: string | undefined,
    end: string | undefined
  ) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Bảng điều khiển quản trị</h1>
      </header>
      <DateFilterForm onDateChange={handleDateChange} />
      <main className="dashboard-main">
        <StatsOverview startDate={startDate} endDate={endDate} />
        <StatsOrders startDate={startDate} endDate={endDate} />
        <StatsProducts startDate={startDate} endDate={endDate} />
        <StatsUsers startDate={startDate} endDate={endDate} />
        <StatsRevenue startDate={startDate} endDate={endDate} />
      </main>
    </div>
  );
};

export default Dashboard;
