import { auth, db } from './firebase';
import { sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const sendTestWhatsApp = async (phoneNumber) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phoneNumber,
        message: 'This is a test alert from GasMate. Your WhatsApp notifications are working!'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send WhatsApp message');
    }

    return await response.json();
  } catch (error) {
    console.error('WhatsApp notification error:', error);
    throw error;
  }
};

export const sendTestEmail = async (email) => {
  try {
    // Get current user
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    // Send verification email as a test
    await sendEmailVerification(user, {
      url: window.location.origin,
      handleCodeInApp: true,
    });

    return { success: true };
  } catch (error) {
    console.error('Email notification error:', error);
    throw error;
  }
};

// For actual gas alerts, use Firebase Cloud Messaging
export const sendGasAlert = async (data) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    const idToken = await user.getIdToken();

    // Create alert document in Firestore
    const alertRef = doc(collection(db, 'users', user.uid, 'alerts'));
    await setDoc(alertRef, {
      type: data.checkValue > 6 ? 'danger' : 'critical',
      gasLevel: data.checkValue,
      isLeak: data.isLeak,
      timestamp: serverTimestamp(),
      notifications: []
    });

    const response = await fetch(`${API_BASE_URL}/api/notifications/alert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        alertId: alertRef.id,
        gasLevel: data.checkValue,
        timestamp: new Date().toISOString(),
        isLeak: data.isLeak,
        alertType: data.checkValue > 6 ? 'danger' : 'critical'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send alert');
    }

    return await response.json();
  } catch (error) {
    console.error('Alert notification error:', error);
    throw error;
  }
}; 