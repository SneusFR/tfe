import React from 'react';
import ReactApexChart from 'react-apexcharts';

/**
 * LineChart component using ApexCharts
 */
export const LineChart = ({ data, dataKey, xAxisKey, name }) => {
  const chartData = {
    series: [
      {
        name: name,
        data: data.map(item => item[dataKey])
      }
    ],
    options: {
      chart: {
        type: 'line',
        height: 300,
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        }
      },
      colors: ['#6366f1'],
      stroke: {
        curve: 'smooth',
        width: 3
      },
      xaxis: {
        categories: data.map(item => item[xAxisKey])
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.5,
          gradientToColors: ['#818cf8'],
          opacityFrom: 0.7,
          opacityTo: 0.2
        }
      }
    }
  };

  return (
    <div className="chart-container">
      <ReactApexChart
        options={chartData.options}
        series={chartData.series}
        type="line"
        height={300}
      />
    </div>
  );
};

/**
 * BarChart component using ApexCharts
 */
export const BarChart = ({ data, dataKey, xAxisKey, name }) => {
  const chartData = {
    series: [
      {
        name: name,
        data: data.map(item => item[dataKey])
      }
    ],
    options: {
      chart: {
        type: 'bar',
        height: 300,
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        }
      },
      colors: ['#6366f1'],
      plotOptions: {
        bar: {
          borderRadius: 4,
          columnWidth: '60%'
        }
      },
      xaxis: {
        categories: data.map(item => item[xAxisKey])
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.2,
          gradientToColors: ['#818cf8'],
          opacityFrom: 1,
          opacityTo: 0.8
        }
      }
    }
  };

  return (
    <div className="chart-container">
      <ReactApexChart
        options={chartData.options}
        series={chartData.series}
        type="bar"
        height={300}
      />
    </div>
  );
};

/**
 * PieChart component using ApexCharts
 */
export const PieChart = ({ data, dataKey, nameKey, name }) => {
  const chartData = {
    series: data.map(item => item[dataKey]),
    options: {
      chart: {
        type: 'donut',
        height: 300
      },
      labels: data.map(item => item[nameKey]),
      colors: ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
      legend: {
        position: 'bottom'
      }
    }
  };

  return (
    <div className="chart-container">
      <ReactApexChart
        options={chartData.options}
        series={chartData.series}
        type="donut"
        height={300}
      />
    </div>
  );
};
