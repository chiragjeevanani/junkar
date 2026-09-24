import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers,
  FaTruck,
  FaClock,
  FaCheckCircle,
  FaRupeeSign,
  FaFileInvoice,
  FaArrowUp,
  FaArrowDown,
  FaUserShield,
} from 'react-icons/fa';
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
import { Line } from 'react-chartjs-2';

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
import { adminAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import { INDIAN_STATES } from './locationConstants';
import IndiaMap from './IndiaMap';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalScrappers: 0,
    activeRequests: 0,
    kycPending: 0,
    revenue: 0,
    todayPickups: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState({ states: [], cities: [] });
  const [stateDistribution, setStateDistribution] = useState([]); // For Heatmap
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const staticTexts = [
    "Failed to load dashboard stats",
    "Failed to load dashboard data",
    "{count} KYC submissions pending review",
    "{count} pickup requests pending",
    "{count} orders completed",
    "{count} scrappers registered",
    "New KYC submission pending review",
    "New pickup request created",
    "Order completed successfully",
    "New scrapper registered",
    "Total Users",
    "Total Scrappers",
    "Active Requests",
    "KYC Pending",
    "Total Revenue",
    "Today's Pickups",
    "Welcome back, Admin! 👋",
    "Here's what's happening with your platform today",
    "Request Trends",
    "Chart visualization will be added here",
    "Recent Activity",
    "Quick Actions",
    "Review KYC",
    "Manage Users",
    "View Requests",
    "Update Prices"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  // Load dashboard data and locations from backend
  useEffect(() => {
    loadDashboardData();
  }, [selectedState, selectedCity]);

  useEffect(() => {
    fetchLocations();
  }, [selectedState]);

  const fetchLocations = async () => {
    try {
      const query = selectedState ? `state=${selectedState}` : '';
      const response = await adminAPI.getLocations(query);
      if (response.success) {
        setLocations(response.data);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (selectedState) queryParams.append('state', selectedState);
      if (selectedCity) queryParams.append('city', selectedCity);

      const response = await adminAPI.getDashboardStats(queryParams.toString());

      if (response.success && response.data?.stats) {
        const backendStats = response.data.stats;

        setStats({
          totalUsers: backendStats.users?.total || 0,
          totalScrappers: backendStats.scrappers?.total || 0,
          activeRequests: backendStats.orders?.pending || 0,
          kycPending: backendStats.scrappers?.pendingKyc || 0,
          revenue: backendStats.payments?.monthlyRevenue || 0,
          todayPickups: backendStats.orders?.today || 0
        });

        // Mock recent activity (can be replaced with backend activity feed later)
        const activity = [
          { id: 1, type: 'kyc', message: getTranslatedText("{count} KYC submissions pending review", { count: backendStats.scrappers?.pendingKyc || 0 }), time: 'Just now', icon: FaClock },
          { id: 2, type: 'request', message: getTranslatedText("{count} pickup requests pending", { count: backendStats.orders?.pending || 0 }), time: 'Just now', icon: FaFileInvoice },
          { id: 3, type: 'order', message: getTranslatedText("{count} orders completed", { count: backendStats.orders?.completed || 0 }), time: 'Just now', icon: FaCheckCircle },
          { id: 4, type: 'scrapper', message: getTranslatedText("{count} scrappers registered", { count: backendStats.scrappers?.total || 0 }), time: 'Just now', icon: FaTruck }
        ];
        setRecentActivity(activity);

        if (response.data.stats.stateDistribution) {
          setStateDistribution(response.data.stats.stateDistribution);
        }
      } else {
        throw new Error(response.message || getTranslatedText('Failed to load dashboard stats'));
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');

      // Fallback to localStorage if backend fails
      const userAuth = localStorage.getItem('isAuthenticated');
      const userData = localStorage.getItem('user');
      const totalUsers = userAuth === 'true' && userData ? 1 : 0;

      const scrapperAuth = localStorage.getItem('scrapperAuthenticated');
      const scrapperUser = localStorage.getItem('scrapperUser');
      const totalScrappers = scrapperAuth === 'true' && scrapperUser ? 1 : 0;

      const kycStatus = localStorage.getItem('scrapperKYCStatus');
      const kycPending = kycStatus === 'pending' ? 1 : 0;

      const activeRequest = localStorage.getItem('activeRequest');
      const activeRequests = activeRequest ? 1 : 0;

      const completedOrders = JSON.parse(localStorage.getItem('scrapperCompletedOrders') || '[]');
      const revenue = completedOrders.reduce((sum, order) => sum + (parseFloat(order.paidAmount) || 0), 0);
      const todayPickups = completedOrders.filter(order => {
        const orderDate = new Date(order.completedAt || order.pickedUpAt);
        const today = new Date();
        return orderDate.toDateString() === today.toDateString();
      }).length;

      setStats({
        totalUsers,
        totalScrappers,
        activeRequests,
        kycPending,
        revenue,
        todayPickups
      });

      const activity = [
        { id: 1, type: 'kyc', message: getTranslatedText('New KYC submission pending review'), time: '2 minutes ago', icon: FaClock },
        { id: 2, type: 'request', message: getTranslatedText('New pickup request created'), time: '15 minutes ago', icon: FaFileInvoice },
        { id: 3, type: 'order', message: getTranslatedText('Order completed successfully'), time: '1 hour ago', icon: FaCheckCircle },
        { id: 4, type: 'scrapper', message: getTranslatedText('New scrapper registered'), time: '2 hours ago', icon: FaTruck }
      ];
      setRecentActivity(activity);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        fill: true,
        label: getTranslatedText('Requests'),
        data: [
          Math.max(0, stats.activeRequests - 2),
          Math.max(0, stats.activeRequests + 1),
          Math.max(0, stats.activeRequests - 1),
          Math.max(0, stats.activeRequests + 3),
          Math.max(0, stats.activeRequests - 2),
          stats.activeRequests,
          stats.todayPickups
        ],
        borderColor: '#64946e',
        backgroundColor: 'rgba(100, 148, 110, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#64946e',
        pointBorderColor: '#ffffff',
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#1a202c',
        padding: 10,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: '#f1f5f9',
        },
        ticks: {
          font: { size: 11 },
          color: '#94a3b8',
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 11 },
          color: '#94a3b8',
        }
      },
    },
  };

  const statCards = [
    {
      title: getTranslatedText('Total Users'),
      value: stats.totalUsers,
      icon: FaUsers,
      color: '#3b82f6',
      bgColor: '#dbeafe',
      change: '+12%',
      trend: 'up',
      path: '/admin/users'
    },
    {
      title: getTranslatedText('Total Scrappers'),
      value: stats.totalScrappers,
      icon: FaTruck,
      color: '#10b981',
      bgColor: '#d1fae5',
      change: '+5%',
      trend: 'up',
      path: '/admin/scrappers'
    },
    {
      title: getTranslatedText('Active Requests'),
      value: stats.activeRequests,
      icon: FaClock,
      color: '#f59e0b',
      bgColor: '#fef3c7',
      change: '-3%',
      trend: 'down',
      path: '/admin/requests'
    },
    {
      title: getTranslatedText('KYC Pending'),
      value: stats.kycPending,
      icon: FaUserShield,
      color: '#ef4444',
      bgColor: '#fee2e2',
      change: '+2',
      trend: 'up',
      path: '/admin/kyc'
    },
    {
      title: getTranslatedText('Total Revenue'),
      value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.revenue || 0),
      icon: FaRupeeSign,
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      change: '+18%',
      trend: 'up',
      path: '/admin/earnings'
    },
    {
      title: getTranslatedText("Today's Pickups"),
      value: stats.todayPickups,
      icon: FaCheckCircle,
      color: '#06b6d4',
      bgColor: '#cffafe',
      change: '+8%',
      trend: 'up',
      path: '/admin/orders'
    }
  ];

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl md:rounded-2xl shadow-lg p-3 md:p-6"
      >
        <h1 className="text-lg md:text-2xl lg:text-3xl font-bold mb-1 md:mb-2" style={{ color: '#2d3748' }}>
          {getTranslatedText("Welcome back, Admin! 👋")}
        </h1>
        <p className="text-xs md:text-sm lg:text-base" style={{ color: '#718096' }}>
          {getTranslatedText("Here's what's happening with your platform today")}
        </p>

        {/* Location Filters */}
        <div className="mt-4 flex flex-wrap gap-2 md:gap-4">
          <div className="flex-1 min-w-[120px] md:min-w-[200px]">
            <label className="block text-[10px] md:text-xs font-bold uppercase mb-1" style={{ color: '#718096' }}>
              State
            </label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedCity(''); // Reset city when state changes
              }}
              className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg border focus:outline-none transition-all text-xs md:text-sm"
              style={{ borderColor: '#e2e8f0', color: '#2d3748' }}
            >
              <option value="">All States</option>
              {INDIAN_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[120px] md:min-w-[200px]">
            <label className="block text-[10px] md:text-xs font-bold uppercase mb-1" style={{ color: '#718096' }}>
              City
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg border focus:outline-none transition-all text-xs md:text-sm"
              style={{ borderColor: '#e2e8f0', color: '#2d3748' }}
            >
              <option value="">All Cities</option>
              {locations.cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Heatmap Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <IndiaMap
          stateDistribution={stateDistribution}
          selectedState={selectedState}
          onStateClick={(state) => {
            if (selectedState === state) {
              setSelectedState(''); // Toggle off
            } else {
              setSelectedState(state);
            }
            setSelectedCity('');
          }}
        />
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4 lg:gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              onClick={() => navigate(card.path)} // Navigate on click
              className="bg-white rounded-xl md:rounded-2xl shadow-lg p-3 md:p-6 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2 md:mb-4">
                <div
                  className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: card.bgColor }}
                >
                  <Icon style={{ color: card.color, fontSize: '16px' }} className="md:text-2xl" />
                </div>
                <div className={`flex items-center gap-0.5 md:gap-1 text-xs md:text-sm font-semibold ${card.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {card.trend === 'up' ? <FaArrowUp className="text-xs" /> : <FaArrowDown className="text-xs" />}
                  <span className="text-[10px] md:text-sm">{card.change}</span>
                </div>
              </div>
              <h3 className="text-lg md:text-2xl lg:text-3xl font-bold mb-0.5 md:mb-1" style={{ color: '#2d3748' }}>
                {card.value}
              </h3>
              <p className="text-[10px] md:text-sm lg:text-base leading-tight" style={{ color: '#718096' }}>
                {card.title}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
        {/* Quick Stats Chart Placeholder */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl md:rounded-2xl shadow-lg p-3 md:p-6"
        >
          <h2 className="text-base md:text-xl font-bold mb-2 md:mb-4" style={{ color: '#2d3748' }}>
            {getTranslatedText("Request Trends")}
          </h2>
          <div className="h-48 md:h-64 flex items-center justify-center">
            <Line data={chartData} options={chartOptions} />
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl md:rounded-2xl shadow-lg p-3 md:p-6"
        >
          <h2 className="text-base md:text-xl font-bold mb-2 md:mb-4" style={{ color: '#2d3748' }}>
            {getTranslatedText("Recent Activity")}
          </h2>
          <div className="space-y-2 md:space-y-4">
            {recentActivity.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-start gap-2 md:gap-4 p-2 md:p-4 rounded-lg md:rounded-xl hover:shadow-md transition-all"
                  style={{ backgroundColor: '#f7fafc' }}
                >
                  <div
                    className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#e2e8f0' }}
                  >
                    <Icon style={{ color: '#64946e', fontSize: '14px' }} className="md:text-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-medium leading-tight" style={{ color: '#2d3748' }}>
                      {activity.message}
                    </p>
                    <p className="text-[10px] md:text-xs mt-0.5 md:mt-1" style={{ color: '#718096' }}>
                      {activity.time}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl md:rounded-2xl shadow-lg p-3 md:p-6"
      >
        <h2 className="text-base md:text-xl font-bold mb-2 md:mb-4" style={{ color: '#2d3748' }}>
          {getTranslatedText("Quick Actions")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          {[
            { label: 'Review KYC', path: '/admin/kyc', icon: FaUserShield },
            { label: 'Manage Users', path: '/admin/users', icon: FaUsers },
            { label: 'View Requests', path: '/admin/requests', icon: FaFileInvoice },
            { label: 'Update Prices', path: '/admin/prices', icon: FaRupeeSign }
          ].map((action) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 md:p-4 rounded-lg md:rounded-xl flex flex-col items-center gap-1 md:gap-2 transition-all"
                style={{ backgroundColor: '#f7fafc' }}
                onClick={() => window.location.href = action.path}
              >
                <Icon style={{ color: '#64946e', fontSize: '18px' }} className="md:text-2xl" />
                <span className="text-[10px] md:text-sm font-medium text-center leading-tight" style={{ color: '#2d3748' }}>
                  {getTranslatedText(action.label)}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;

