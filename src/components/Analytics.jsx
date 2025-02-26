import { useState, useEffect } from 'react';
import { getGasHistory } from '../services/firebase';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Analytics() {
  const [history, setHistory] = useState([]);
  const [timeRange, setTimeRange] = useState('1h');
  const [stats, setStats] = useState({
    average: 0,
    max: 0,
    min: 0,
    criticalEvents: 0,
    dangerEvents: 0
  });

  // Fetch gas history data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getGasHistory(100); // Get last 100 readings
        const filteredData = filterDataByTimeRange(data);
        setHistory(filteredData);
        calculateStats(filteredData);
      } catch (error) {
        console.error('Error fetching gas history:', error);
      }
    };

    fetchData();
    // Set up interval to fetch data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const filterDataByTimeRange = (data) => {
    const now = Date.now();
    const ranges = {
      '1h': now - 3600000,
      '24h': now - 86400000,
      '7d': now - 604800000,
      '30d': now - 2592000000
    };
    return data.filter(h => h.timestamp > ranges[timeRange]);
  };

  const calculateStats = (data) => {
    if (data.length === 0) {
      setStats({
        average: 'NaN',
        max: '-Infinity',
        min: 'Infinity',
        criticalEvents: 0,
        dangerEvents: 0
      });
      return;
    }

    const values = data.map(h => h.checkValue);
    setStats({
      average: values.reduce((a, b) => a + b, 0) / values.length,
      max: Math.max(...values),
      min: Math.min(...values),
      criticalEvents: data.filter(h => h.checkValue > 4).length,
      dangerEvents: data.filter(h => h.checkValue > 6).length
    });
  };

  const chartData = {
    labels: history.map(h => new Date(h.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Gas Level (PPM)',
        data: history.map(h => h.checkValue),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Critical Level (4 PPM)',
        data: Array(history.length).fill(4),
        borderColor: '#F59E0B',
        borderDash: [5, 5],
        fill: false
      },
      {
        label: 'Danger Level (6 PPM)',
        data: Array(history.length).fill(6),
        borderColor: '#DC2626',
        borderDash: [5, 5],
        fill: false
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#1F2937'
        },
        ticks: {
          color: '#9CA3AF'
        }
      },
      x: {
        grid: {
          color: '#1F2937'
        },
        ticks: {
          color: '#9CA3AF',
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#9CA3AF'
        }
      }
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">Analytics</h2>
        <select 
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="bg-[#1a2234] text-gray-300 px-4 py-2 rounded-lg"
        >
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-5 gap-6 mb-8">
        <div className="bg-[#1a2234] rounded-lg p-4">
          <p className="text-gray-400 text-sm">Average Level</p>
          <p className="text-2xl font-bold text-white">
            {typeof stats.average === 'number' ? stats.average.toFixed(1) : stats.average} PPM
          </p>
        </div>
        <div className="bg-[#1a2234] rounded-lg p-4">
          <p className="text-gray-400 text-sm">Maximum Level</p>
          <p className="text-2xl font-bold text-red-500">
            {stats.max} PPM
          </p>
        </div>
        <div className="bg-[#1a2234] rounded-lg p-4">
          <p className="text-gray-400 text-sm">Minimum Level</p>
          <p className="text-2xl font-bold text-green-500">
            {stats.min} PPM
          </p>
        </div>
        <div className="bg-[#1a2234] rounded-lg p-4">
          <p className="text-gray-400 text-sm">Critical Events</p>
          <p className="text-2xl font-bold text-yellow-500">
            {stats.criticalEvents}
          </p>
        </div>
        <div className="bg-[#1a2234] rounded-lg p-4">
          <p className="text-gray-400 text-sm">Danger Events</p>
          <p className="text-2xl font-bold text-red-500">
            {stats.dangerEvents}
          </p>
        </div>
      </div>

      {/* Gas Level Trends Chart */}
      <div className="bg-[#1a2234] rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Gas Level Trends</h3>
        <div className="h-96">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Event Timeline */}
      <div className="bg-[#1a2234] rounded-lg p-6 mt-6">
        <h3 className="text-xl font-semibold text-white mb-6">Event Timeline</h3>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {history.map((event, index) => (
            <div key={index} className="flex items-center space-x-4 bg-[#0f1520] p-4 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${
                event.checkValue > 6 ? 'bg-red-500' :
                event.checkValue > 4 ? 'bg-yellow-500' :
                'bg-green-500'
              }`} />
              <div className="flex-1">
                <p className="text-white">Gas Level: {event.checkValue} PPM</p>
                <p className="text-sm text-gray-400">
                  {new Date(event.timestamp).toLocaleString()}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                event.checkValue > 6 ? 'bg-red-900/20 text-red-500' :
                event.checkValue > 4 ? 'bg-yellow-900/20 text-yellow-500' :
                'bg-green-900/20 text-green-500'
              }`}>
                {event.checkValue > 6 ? 'Danger' :
                 event.checkValue > 4 ? 'Critical' :
                 'Normal'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Analytics; 