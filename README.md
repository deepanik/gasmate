# GasMate - Smart Gas Leak Detection System

GasMate is a real-time gas leak detection and monitoring system that provides instant alerts and comprehensive gas level monitoring. Built with modern web technologies, it offers a responsive interface for both desktop and mobile devices.

## Features

### Real-time Monitoring
- 📊 Live gas level monitoring with visual graphs
- 🚨 Instant alerts for critical and dangerous gas levels
- 🎛️ Automatic gas supply control
- 📱 Mobile-responsive interface

### Smart Notifications
- 📱 WhatsApp alerts via Twilio
- 🔔 Browser notifications
- 🔊 Customizable sound alerts

### Data Analysis
- 📈 Historical data visualization
- 📊 Daily average gas levels
- 🔍 Detailed alert history
- 📉 Trend analysis

## Tech Stack

- **Frontend:**
  - React 19
  - Vite
  - Tailwind CSS
  - Chart.js
  - Material Icons

- **Backend:**
  - Firebase (Auth, Firestore)
  - Express.js
  - Node.js

- **Notifications:**
  - Twilio (WhatsApp)
  - Web Push Notifications

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)
- Firebase account
- Twilio account

### Installation

1. Clone and install:
```bash
git clone https://github.com/yourusername/gasmate.git
cd gasmate
npm install
```

2. Create `.env` file:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=your_whatsapp_number

# API Configuration
VITE_API_BASE_URL=http://localhost:5000
```

## Project Structure

gasmate/
├── public/
│ └── sounds/ # Alert sound files
├── server/
│ ├── index.js # Express server
│ └── .env # Server environment variables
├── src/
│ ├── components/
│ │ ├── Dashboard.jsx
│ │ ├── AlertHistory.jsx
│ │ ├── Settings.jsx
│ │ └── Analytics.jsx
│ ├── services/
│ │ ├── firebase.js
│ │ └── notifications.js
│ ├── App.jsx
│ └── main.jsx
└── package.json

## Available Scripts

- `npm run dev` - Start Vite development server
- `npm run server` - Start Express server
- `npm run dev:all` - Start both frontend and backend
- `npm run build` - Build for production
- `npm run create-sounds` - Generate alert sounds
- `npm run firebase:deploy` - Deploy to Firebase

## Firebase Setup

1. Create a Firebase project
2. Enable Authentication with email/password
3. Create a Firestore database
4. Add security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /alerts/{alertId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## Features in Detail

### Dashboard
- Real-time gas level monitoring
- Visual status indicators
- Historical data graph
- Quick actions for gas supply control

### Alert History
- Chronological list of alerts
- Filter by severity
- Notification delivery status
- Detailed alert information

### Settings
- Notification preferences
- Alert thresholds
- Sound alert customization
- Account management

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [React](https://reactjs.org/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Chart.js](https://www.chartjs.org/)
- [Twilio](https://www.twilio.com/)
- [Material Icons](https://material.io/icons/)

## Support

For support, email support@deepanik.com or join our Slack channel.