import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase, ref, onValue, set, push, serverTimestamp, limitToLast, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// Export the services
export { auth, db, rtdb };

export const subscribeToGasReadings = (callback) => {
  const dbRef = ref(rtdb);
  
  onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      // Use the isLeak value from hardware to determine gas supply state
      callback({
        checkValue: data.checkValue || 0,
        isLeak: data.isLeak || 0,
        gasSupply: data.isLeak === 1 ? 0 : 1 // If isLeak is 1, gas supply is closed
      });
    }
  });
};

const handleGasLeak = async (isLeaking) => {
  try {
    // Update leak status in Firebase
    await set(ref(rtdb, 'alerts/isLeak'), isLeaking ? 1 : 0);
    
    if (isLeaking) {
      // Send notification
      sendNotification('Gas Leak Detected!', 'High gas levels detected. System has automatically closed the gas supply.');
      
      // Store in history
      const historyRef = ref(rtdb, 'history');
      push(historyRef, {
        checkValue: (await get(ref(rtdb, 'alerts/checkValue'))).val(),
        isLeak: 1,
        timestamp: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error handling gas leak:', error);
  }
};

const sendNotification = (title, body) => {
  if (!("Notification" in window)) {
    alert("This browser does not support notifications");
    return;
  }

  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      new Notification(title, { body });
    }
  });
};

export const getGasReadings = () => {
  return new Promise((resolve, reject) => {
    const dbRef = ref(rtdb);
    onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      resolve({
        checkValue: data?.checkValue || 0,
        isLeak: data?.isLeak || 0,
        gasSupply: data?.isLeak === 1 ? 0 : 1 // If isLeak is 1, gas supply is closed
      });
    }, reject, { onlyOnce: true });
  });
};

export const getGasHistory = (limit = 10) => {
  return new Promise((resolve, reject) => {
    const historyRef = ref(rtdb, 'history');
    onValue(historyRef, (snapshot) => {
      const data = snapshot.val() || {};
      const historyArray = Object.entries(data)
        .map(([key, value]) => ({
          id: key,
          ...value
        }))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, limit);
      
      resolve(historyArray);
    }, reject, { onlyOnce: true });
  });
};

export const acknowledgeAlert = (alertId) => {
  return set(ref(rtdb, `alerts/${alertId}/acknowledged`), true);
};

export const setGasSupply = async (value) => {
  try {
    // Validate value according to rules
    if (value !== 0 && value !== 1) {
      throw new Error('Gas supply value must be 0 or 1');
    }
    await set(ref(rtdb, 'gasSupply'), value);
    
    // If we're closing the supply (value = 0), also set isLeak to 1
    if (value === 0) {
      await set(ref(rtdb, 'isLeak'), 1);
    }
  } catch (error) {
    console.error('Error setting gas supply:', error);
    throw error;
  }
}; 