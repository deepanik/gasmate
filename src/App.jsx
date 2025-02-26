import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { subscribeToGasReadings, getGasReadings, getGasHistory, setGasSupply } from './services/firebase'
import './App.css'
import Analytics from './components/Analytics'
import Dashboard from './components/Dashboard'
import Settings from './components/Settings'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './services/firebase'
import Login from './components/auth/Login'
import SignUp from './components/auth/SignUp'
import AlertHistory from './components/AlertHistory'

// Create a new component for the app content
function AppContent() {
  const [gasData, setGasData] = useState({
    checkValue: 0,
    isLeak: 0,
    gasSupply: 1
  })
  const [history, setHistory] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [stats, setStats] = useState({
    dailyAvg: 0,
    maxLevel: 0,
    criticalAlerts: 0
  })

  // Gas level thresholds
  const CRITICAL_LEVEL = 4;
  const DANGER_LEVEL = 6;

  // Add canvas ref
  const canvasRef = useRef(null);

  const location = useLocation();

  // Add state for audio permission
  const [audioPermission, setAudioPermission] = useState(false);
  const audioRef = useRef(new Audio('/alert.mp3'));

  // Add state for notification permission
  const [notificationPermission, setNotificationPermission] = useState('default');

  // Add new state for notification block status
  const [isNotificationBlocked, setIsNotificationBlocked] = useState(false);

  // Add mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Add handleLogout function
  const handleLogout = async () => {
    try {
      await auth.signOut();
      // The ProtectedRoute component will automatically redirect to login
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Initialize notifications and audio
  useEffect(() => {
    if ("Notification" in window) {
      // Check if notifications are blocked
      if (Notification.permission === 'denied') {
        setIsNotificationBlocked(true);
      }
      setNotificationPermission(Notification.permission);
    }

    // Audio initialization remains the same
    return () => {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    };
  }, []);

  // Handle real-time data updates
  useEffect(() => {
    // Initial fetch
    getGasReadings().then(setGasData).catch(console.error)
    getGasHistory(10).then(setHistory).catch(console.error)

    // Subscribe to real-time updates
    const unsubscribe = subscribeToGasReadings((data) => {
      setGasData(data)
      getGasHistory(10).then(setHistory).catch(console.error)
    })

    return () => {
      unsubscribe && unsubscribe()
    }
  }, []);

  // Handle statistics calculations
  useEffect(() => {
    if (history.length > 0) {
      const today = new Date().setHours(0, 0, 0, 0)
      const todayReadings = history.filter(h => 
        new Date(h.timestamp).setHours(0, 0, 0, 0) === today
      )
      
      setStats({
        dailyAvg: todayReadings.reduce((acc, curr) => acc + curr.checkValue, 0) / todayReadings.length || 0,
        maxLevel: Math.max(...history.map(h => h.checkValue)),
        criticalAlerts: history.filter(h => h.checkValue > 4).length
      })
    }
  }, [history]);

  const handleGasSupplyToggle = async () => {
    try {
      await setGasSupply(0); // Close the supply
    } catch (error) {
      console.error('Failed to toggle gas supply:', error);
    }
  };

  // Get status based on gas level
  const getGasStatus = () => {
    const { checkValue } = gasData;
    if (checkValue > 6) return 'Danger';
    if (checkValue > 4) return 'Critical';
    return 'Normal';
  }

  // Get color based on gas level
  const getStatusColor = () => {
    const { checkValue } = gasData;
    if (checkValue > 6) return 'bg-red-600';
    if (checkValue > 4) return 'bg-red-500';
    return 'bg-green-500';
  }

  // Get text color based on status
  const getTextColor = () => {
    const { checkValue } = gasData;
    if (checkValue > 6) return 'text-red-600';
    if (checkValue > 4) return 'text-red-500';
    return 'text-green-500';
  }

  // Calculate gas level height for visualization
  const getGasLevelHeight = () => {
    const percentage = (gasData.checkValue / 10) * 100;
    return `${percentage}%`;
  }

  // Add timestamp formatting
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  }

  // Function to draw the graph
  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get the container dimensions
    const container = canvas.parentElement;
    const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();

    // Set canvas size to match container
    canvas.width = containerWidth;
    canvas.height = containerHeight;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;

    // Vertical grid lines
    const gridGap = width / 20;
    for (let x = 0; x < width; x += gridGap) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal grid lines and labels
    ctx.textAlign = 'right';
    ctx.font = '12px Inter';
    ctx.fillStyle = '#6B7280';
    
    const yAxisWidth = 30;
    const padding = 20;
    
    for (let i = 0; i <= 10; i += 2) {
      const y = height - ((i / 10) * (height - padding * 2) + padding);
      
      // Grid line
      ctx.beginPath();
      ctx.moveTo(yAxisWidth, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      
      // Label
      ctx.fillText(i.toString(), yAxisWidth - 5, y + 4);
    }

    // Draw threshold lines
    // Danger threshold (6 PPM)
    ctx.strokeStyle = '#DC2626';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    const dangerY = height - ((6 / 10) * (height - padding * 2) + padding);
    ctx.moveTo(yAxisWidth, dangerY);
    ctx.lineTo(width - padding, dangerY);
    ctx.stroke();

    // Critical threshold (4 PPM)
    ctx.strokeStyle = '#F59E0B';
    ctx.beginPath();
    const criticalY = height - ((4 / 10) * (height - padding * 2) + padding);
    ctx.moveTo(yAxisWidth, criticalY);
    ctx.lineTo(width - padding, criticalY);
    ctx.stroke();

    // Reset line dash
    ctx.setLineDash([]);

    // Draw gas level bar
    const barWidth = 60;
    const barX = yAxisWidth + 20;
    const barHeight = (gasData.checkValue / 10) * (height - padding * 2);
    const barY = height - (barHeight + padding);

    // Bar color based on gas level
    let barColor = '#10B981'; // green
    if (gasData.checkValue > 6) barColor = '#DC2626'; // red
    else if (gasData.checkValue > 4) barColor = '#EF4444'; // light red

    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Draw PPM value label
    const labelPadding = 8;
    const labelHeight = 24;
    const labelWidth = 70;
    const labelX = barX;
    const labelY = barY - labelHeight - labelPadding;

    // Draw label background
    ctx.fillStyle = barColor;
    ctx.beginPath();
    ctx.roundRect(labelX, labelY, labelWidth, labelHeight, 4);
    ctx.fill();

    // Draw PPM value
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Inter';
    ctx.fillText(`${gasData.checkValue} PPM`, labelX + labelWidth/2, labelY + labelHeight/2 + 5);
  };

  // Update graph when gas data changes
  useEffect(() => {
    drawGraph();
  }, [gasData]);

  // Modified playAlert function with better permission handling
  const playAlert = () => {
    if (audioPermission) {
      audioRef.current.play().catch(error => {
        console.log('Audio playback failed:', error);
      });
    }

    // Only attempt to show notification if not blocked
    if (notificationPermission === "granted" && !isNotificationBlocked) {
      try {
        new Notification("Gas Alert!", {
          body: `Gas level is critical: ${gasData.checkValue} PPM`,
          icon: "/alert-icon.png"
        });
      } catch (error) {
        console.error('Failed to show notification:', error);
        // If notification fails due to being blocked, update state
        if (error.message.includes('blocked')) {
          setIsNotificationBlocked(true);
        }
      }
    }
  };

  // Add a function to request notification permission
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      // Update blocked status based on permission result
      if (permission === 'denied') {
        setIsNotificationBlocked(true);
      } else {
        setIsNotificationBlocked(false);
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      // If error indicates blocking, update state
      if (error.message.includes('blocked')) {
        setIsNotificationBlocked(true);
      }
    }
  };

  // Update the NotificationSettings component
  const NotificationSettings = () => (
    <div className="bg-[#1a2234] rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">Notifications</h3>
          {isNotificationBlocked ? (
            <div className="text-sm text-gray-400">
              <p className="mb-2">Notifications are blocked. To enable:</p>
              <ol className="mt-2 ml-4 list-decimal">
                <li>Click the lock icon 🔒 in your browser's address bar</li>
                <li>Find "Notifications" in the site settings</li>
                <li>Change the setting to "Allow"</li>
              </ol>
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              {notificationPermission === 'granted' 
                ? 'Notifications are enabled'
                : 'Enable notifications to get alerts'
              }
            </p>
          )}
        </div>
        {!isNotificationBlocked && notificationPermission !== 'granted' && (
          <button
            onClick={requestNotificationPermission}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Enable Notifications
          </button>
        )}
      </div>
    </div>
  );

  const navigation = [
    { name: 'Dashboard', href: '/', icon: 'home' },
    { name: 'Analytics', href: '/analytics', icon: 'bar_chart' },
    { name: 'Alerts', href: '/alerts', icon: 'notifications' },
    { name: 'Settings', href: '/settings', icon: 'settings' },
  ];

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#0f1520] overflow-hidden flex">
      {/* Sidebar */}
      <div className={`${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed md:relative md:translate-x-0 left-0 top-0 bottom-0 w-64 bg-[#1a2234] p-6 overflow-y-auto transition-transform z-20`}>
        {/* Mobile menu close button */}
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <span className="material-icons">close</span>
        </button>
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">GasMate</h1>
          <p className="text-gray-400 text-sm">gas@deepanik.com</p>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center ${
                location.pathname === item.href
                  ? 'text-white bg-[#2a334a]'
                  : 'text-gray-400 hover:text-white hover:bg-[#2a334a]/50'
              } px-4 py-3 rounded-lg`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="material-icons mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        <button 
          onClick={handleLogout}
          className="absolute bottom-6 left-6 flex items-center text-gray-400 hover:text-white"
        >
          <span className="material-icons mr-2">logout</span>
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-screen overflow-y-auto">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-[#1a2234]">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-gray-400 hover:text-white"
          >
            <span className="material-icons">menu</span>
          </button>
          <h1 className="text-xl font-bold text-white">GasMate</h1>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-gray-400 hover:text-white"
          >
            <span className="material-icons">notifications</span>
          </button>
        </div>

        {/* Routes */}
        <Routes>
          <Route 
            path="/" 
            element={
              <>
                <NotificationSettings />
                <Dashboard 
                  gasData={gasData} 
                  canvasRef={canvasRef} 
                  drawGraph={drawGraph}
                />
              </>
            } 
          />
          <Route 
            path="/analytics" 
            element={<Analytics />} 
          />
          <Route path="/settings" element={<Settings />} />
          <Route path="/alerts" element={<AlertHistory />} />
        </Routes>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed right-0 top-0 bottom-0 w-full md:w-80 bg-[#1a2234] shadow-xl p-6 overflow-y-auto z-30">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-white">Notifications</h3>
            <button 
              onClick={() => setShowNotifications(false)}
              className="text-gray-400 hover:text-white"
            >
              <span className="material-icons">close</span>
            </button>
          </div>
          <div className="space-y-4">
            {history.map((alert, index) => (
              <div key={index} className="bg-[#0f1520] rounded-lg p-4">
                <div className="flex items-start">
                  <span className={`material-icons mr-3 ${
                    alert.checkValue > 6 ? 'text-red-500' :
                    alert.checkValue > 4 ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {alert.checkValue > 4 ? 'warning' : 'info'}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Gas Level: {alert.checkValue} PPM
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#0f1520] flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Main App component
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/" element={
        <ProtectedRoute>
          <AppContent />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute>
          <Analytics />
        </ProtectedRoute>
      } />
      <Route path="/alerts" element={
        <ProtectedRoute>
          <AlertHistory />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App
