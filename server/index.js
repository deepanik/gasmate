const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const admin = require('firebase-admin');

// Initialize Firebase Admin with Vercel environment
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
  });
}

const app = express();

// Enable CORS for your frontend domain
app.use(cors({
  origin: process.env.VERCEL_URL || 'http://localhost:5173'
}));
app.use(express.json());

// Initialize Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// WhatsApp test endpoint
app.post('/api/notifications/whatsapp', async (req, res) => {
  try {
    const { to, message } = req.body;
    
    const response = await twilioClient.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`
    });

    res.json({ success: true, messageId: response.sid });
  } catch (error) {
    console.error('WhatsApp error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Gas alert endpoint with Firebase Authentication
app.post('/api/notifications/alert', async (req, res) => {
  try {
    // Verify Firebase ID token
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) throw new Error('No ID token provided');

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get user's notification settings from Firestore
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const settings = userDoc.data()?.settings?.notifications;

    if (!settings) throw new Error('User settings not found');

    const { alertId, gasLevel, timestamp, isLeak, alertType } = req.body;

    // Send notifications based on user settings
    const notifications = [];
    const notificationResults = [];

    if (settings.whatsapp?.enabled) {
      try {
        await twilioClient.messages.create({
          body: `🚨 GasMate Alert!\nGas Level: ${gasLevel} PPM\nStatus: ${alertType.toUpperCase()}\nTime: ${new Date(timestamp).toLocaleString()}${isLeak ? '\n⚠️ Gas leak detected! Supply has been closed.' : ''}`,
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${settings.whatsapp.number}`
        });
        notificationResults.push({ type: 'whatsapp', status: 'sent' });
      } catch (error) {
        notificationResults.push({ type: 'whatsapp', status: 'failed', error: error.message });
      }
    }

    // Send FCM notification
    if (settings.firebase) {
      notifications.push(
        admin.messaging().sendToDevice(settings.fcmToken, {
          notification: {
            title: `GasMate ${alertType.toUpperCase()} Alert`,
            body: `Gas level: ${gasLevel} PPM${isLeak ? ' - Gas leak detected!' : ''}`,
          },
          data: {
            gasLevel: String(gasLevel),
            timestamp: timestamp,
            isLeak: String(isLeak),
            alertType: alertType,
          },
        })
      );
    }

    await Promise.all(notifications);

    // Update alert document with notification results
    await admin.firestore()
      .collection('users')
      .doc(uid)
      .collection('alerts')
      .doc(alertId)
      .update({
        notifications: notificationResults
      });

    res.json({ success: true });
  } catch (error) {
    console.error('Alert error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for Vercel serverless function
module.exports = app; 