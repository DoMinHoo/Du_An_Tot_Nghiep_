import React from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { ChartData } from '../../Types/dashboard';
import '../../index.css'; // Import CSS

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartComponentProps {
  chartData: ChartData;
}

const ChartComponent: React.FC<ChartComponentProps> = ({ chartData }) => {
  const hasData =
    chartData.data.datasets.length > 0 && chartData.data.labels.length > 0;

  if (!hasData) {
    return (
      <div className="chart-container loading">
        Không có dữ liệu để hiển thị biểu đồ.
      </div>
    );
  }

  const isDarkMode = true; // Giả sử lấy từ context theme, thay bằng logic thực tế
  const textColor = isDarkMode ? '#ffffff' : '#000000';

  const chartProps = {
    data: chartData.data,
    options: {
      ...chartData.options,
      plugins: {
        legend: { position: 'top' as const, labels: { color: textColor } },
        title: {
          display: true,
          text: chartData.data.datasets[0].label,
          color: textColor,
          font: { size: 16 },
        },
      },
      maintainAspectRatio: false,
    },
  };

  return (
    <div className="chart-container">
      {chartData.type === 'bar' && <Bar {...chartProps} />}
      {chartData.type === 'line' && <Line {...chartProps} />}
      {chartData.type === 'pie' && <Pie {...chartProps} />}
    </div>
  );
};

export default ChartComponent;
