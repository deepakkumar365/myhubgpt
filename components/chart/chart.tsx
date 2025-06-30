import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { useRef } from 'react';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Chart component to render different chart types
export const ChartComponent = ({ 
  type, 
  data, 
  options,
  width,
  height 
}: { 
  type: string; 
  data: ChartData<any>; 
  options?: ChartOptions<any>;
  width?: number;
  height?: number;
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);

  const defaultOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: data.datasets?.[0]?.label || 'Chart',
      },
    },
  };

  const mergedOptions = { ...defaultOptions, ...options };

  switch (type.toLowerCase()) {
    case 'bar':
      return <Bar data={data} options={mergedOptions} width={width} height={height} />;
    case 'line':
      return <Line data={data} options={mergedOptions} width={width} height={height} />;
    case 'pie':
      return <Pie data={data} options={mergedOptions} width={width} height={height} />;
    case 'doughnut':
      return <Doughnut data={data} options={mergedOptions} width={width} height={height} />;
    default:
      return <Bar data={data} options={mergedOptions} width={width} height={height} />;
  }
};