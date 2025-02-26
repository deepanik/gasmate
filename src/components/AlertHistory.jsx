import { useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

function AlertHistory() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAlertHistory = async () => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');

        const alertsRef = collection(db, 'users', user.uid, 'alerts');
        const alertsQuery = query(
          alertsRef,
          orderBy('timestamp', 'desc'),
          limit(50)
        );

        const querySnapshot = await getDocs(alertsQuery);
        const alertsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setAlerts(alertsData);
      } catch (err) {
        console.error('Error loading alert history:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAlertHistory();
  }, []);

  const getAlertTypeStyle = (type) => {
    switch (type) {
      case 'critical':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'danger':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 text-red-500 rounded-lg">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Alert History</h2>
      
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <p className="text-gray-400">No alerts yet</p>
        ) : (
          alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-3 md:p-4 rounded-lg border ${getAlertTypeStyle(alert.type)}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <h3 className="font-semibold">
                    {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} Alert
                  </h3>
                  <p className="text-sm opacity-80">
                    Gas Level: {alert.gasLevel} PPM
                  </p>
                  {alert.isLeak && (
                    <p className="text-sm text-red-500 mt-1">
                      ⚠️ Gas leak detected - Supply closed
                    </p>
                  )}
                </div>
                <time className="text-sm opacity-60 whitespace-nowrap">
                  {new Date(alert.timestamp).toLocaleString()}
                </time>
              </div>
              
              <div className="mt-2 text-sm opacity-80">
                <h4 className="font-medium mb-1">Notifications sent:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {alert.notifications.map((notification, index) => (
                    <li key={index} className="break-all">
                      {notification.type}: {notification.status}
                      {notification.error && (
                        <span className="block ml-4 text-red-400">
                          Error: {notification.error}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AlertHistory; 