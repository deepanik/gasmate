import { useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { getDoc, setDoc, doc } from 'firebase/firestore';
import { updateEmail, updatePassword } from 'firebase/auth';
import { sendTestEmail, sendTestWhatsApp } from '../services/notifications'; // You'll need to create this

function Settings() {
  const [settings, setSettings] = useState({
    notifications: {
      providers: {
        firebase: true,
        smtp: false,
        twilio: false
      },
      email: {
        enabled: true,
        address: '',
        smtp: {
          host: '',
          port: '',
          secure: true,
          auth: {
            user: '',
            pass: ''
          }
        }
      },
      whatsapp: {
        enabled: true,
        number: '',
        twilio: {
          accountSid: '',
          authToken: '',
          fromNumber: ''
        }
      },
      sound: {
        enabled: true,
        type: 'default'
      }
    },
    thresholds: {
      critical: 4,
      danger: 6
    },
    account: {
      email: '',
      newPassword: '',
      confirmPassword: ''
    },
    display: {
      theme: 'dark',
      chartInterval: '1h',
      temperature: 'celsius',
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Add testStatus state
  const [testStatus, setTestStatus] = useState({
    whatsapp: '',
    email: '',
    sound: ''
  });

  // Load user settings from Firebase
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setSettings(prev => ({
            ...prev,
            ...userDoc.data().settings,
            account: {
              ...prev.account,
              email: user.email
            }
          }));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const handleProviderChange = (provider, enabled) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        providers: {
          ...prev.notifications.providers,
          [provider]: enabled
        }
      }
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      // Update email if changed
      if (settings.account.email !== user.email) {
        await updateEmail(user, settings.account.email);
      }

      // Update password if provided
      if (settings.account.newPassword) {
        if (settings.account.newPassword !== settings.account.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await updatePassword(user, settings.account.newPassword);
      }

      // Save settings to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        settings: {
          notifications: settings.notifications,
          thresholds: settings.thresholds
        }
      });

      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Add test functions
  const testSound = () => {
    try {
      // Get the sound type from settings
      const soundType = settings.notifications.sound.type || 'default';
      const audio = new Audio(`/sounds/${soundType}.mp3`);
      setTestStatus(prev => ({ ...prev, sound: 'playing' }));
      
      audio.play()
        .then(() => {
          setTestStatus(prev => ({ ...prev, sound: 'success' }));
          setTimeout(() => {
            setTestStatus(prev => ({ ...prev, sound: '' }));
          }, 3000);
        })
        .catch((error) => {
          console.error('Error playing sound:', error);
          setTestStatus(prev => ({ ...prev, sound: 'error' }));
          setTimeout(() => {
            setTestStatus(prev => ({ ...prev, sound: '' }));
          }, 3000);
        });
    } catch (error) {
      console.error('Error testing sound:', error);
      setTestStatus(prev => ({ ...prev, sound: 'error' }));
      setTimeout(() => {
        setTestStatus(prev => ({ ...prev, sound: '' }));
      }, 3000);
    }
  };

  const testWhatsApp = async () => {
    try {
      setTestStatus(prev => ({ ...prev, whatsapp: 'sending' }));
      await sendTestWhatsApp(settings.notifications.whatsapp.number);
      setTestStatus(prev => ({ ...prev, whatsapp: 'success' }));
      setTimeout(() => {
        setTestStatus(prev => ({ ...prev, whatsapp: '' }));
      }, 3000);
    } catch (error) {
      console.error('Error testing WhatsApp:', error);
      setTestStatus(prev => ({ ...prev, whatsapp: 'error' }));
      setTimeout(() => {
        setTestStatus(prev => ({ ...prev, whatsapp: '' }));
      }, 3000);
    }
  };

  const testEmail = async () => {
    try {
      setTestStatus(prev => ({ ...prev, email: 'sending' }));
      await sendTestEmail(settings.notifications.email.address);
      setTestStatus(prev => ({ ...prev, email: 'success' }));
      setTimeout(() => {
        setTestStatus(prev => ({ ...prev, email: '' }));
      }, 3000);
    } catch (error) {
      console.error('Error testing email:', error);
      setTestStatus(prev => ({ ...prev, email: 'error' }));
      setTimeout(() => {
        setTestStatus(prev => ({ ...prev, email: '' }));
      }, 3000);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>

      {error && (
        <div className="bg-red-900/20 text-red-500 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 text-green-500 p-4 rounded-lg mb-6">
          {success}
        </div>
      )}

      <div className="space-y-4 md:space-y-6 max-w-4xl">
        {/* Account Settings */}
        <div className="bg-[#1a2234] rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Account Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-white mb-2">Email Address</label>
              <input
                type="email"
                value={settings.account.email}
                onChange={(e) => handleSettingChange('account', 'email', e.target.value)}
                className="bg-[#0f1520] text-white px-4 py-2 rounded-lg w-full"
              />
            </div>
            <div>
              <label className="block text-white mb-2">New Password</label>
              <input
                type="password"
                value={settings.account.newPassword}
                onChange={(e) => handleSettingChange('account', 'newPassword', e.target.value)}
                className="bg-[#0f1520] text-white px-4 py-2 rounded-lg w-full"
              />
            </div>
            <div>
              <label className="block text-white mb-2">Confirm Password</label>
              <input
                type="password"
                value={settings.account.confirmPassword}
                onChange={(e) => handleSettingChange('account', 'confirmPassword', e.target.value)}
                className="bg-[#0f1520] text-white px-4 py-2 rounded-lg w-full"
              />
            </div>
          </div>
        </div>

        {/* Notification Providers */}
        <div className="bg-[#1a2234] rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Notification Providers</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Firebase</p>
                <p className="text-sm text-gray-400">Use Firebase Cloud Messaging</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.providers.firebase}
                  onChange={(e) => handleProviderChange('firebase', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Custom SMTP</p>
                <p className="text-sm text-gray-400">Use your own SMTP server</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.providers.smtp}
                  onChange={(e) => handleProviderChange('smtp', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {settings.notifications.providers.smtp && (
              <div className="ml-6 space-y-4 mt-4">
                <div>
                  <label className="block text-white mb-2">SMTP Host</label>
                  <input
                    type="text"
                    value={settings.notifications.email.smtp.host}
                    onChange={(e) => handleSettingChange('notifications', 'email', {
                      ...settings.notifications.email,
                      smtp: { ...settings.notifications.email.smtp, host: e.target.value }
                    })}
                    className="bg-[#0f1520] text-white px-4 py-2 rounded-lg w-full"
                    placeholder="smtp.gmail.com"
                  />
                </div>
                {/* Add other SMTP fields similarly */}
              </div>
            )}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-[#1a2234] rounded-lg p-4 md:p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Notifications</h3>
          
          {/* WhatsApp Notifications */}
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-white">WhatsApp Alerts</p>
                <p className="text-sm text-gray-400">Receive alerts via WhatsApp</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <button 
                  onClick={testWhatsApp}
                  disabled={!settings.notifications.whatsapp.enabled || testStatus.whatsapp === 'sending'}
                  className={`px-3 py-1 rounded text-sm ${
                    testStatus.whatsapp === 'sending' ? 'bg-gray-600 text-gray-300' :
                    testStatus.whatsapp === 'success' ? 'bg-green-600 text-white' :
                    testStatus.whatsapp === 'error' ? 'bg-red-600 text-white' :
                    'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {testStatus.whatsapp === 'sending' ? 'Sending...' :
                   testStatus.whatsapp === 'success' ? 'Sent!' :
                   testStatus.whatsapp === 'error' ? 'Failed!' :
                   'Test'}
                </button>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.whatsapp.enabled}
                    onChange={(e) => handleSettingChange('notifications', 'whatsapp', {
                      ...settings.notifications.whatsapp,
                      enabled: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
            {settings.notifications.whatsapp.enabled && (
              <input
                type="tel"
                value={settings.notifications.whatsapp.number}
                onChange={(e) => handleSettingChange('notifications', 'whatsapp', {
                  ...settings.notifications.whatsapp,
                  number: e.target.value
                })}
                placeholder="+1234567890"
                className="bg-[#0f1520] text-white px-4 py-2 rounded-lg w-full"
              />
            )}
          </div>

          {/* Email Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Email Alerts</p>
                <p className="text-sm text-gray-400">Receive alerts via email</p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={testEmail}
                  disabled={!settings.notifications.email.enabled || testStatus.email === 'sending'}
                  className={`px-3 py-1 rounded text-sm ${
                    testStatus.email === 'sending' ? 'bg-gray-600 text-gray-300' :
                    testStatus.email === 'success' ? 'bg-green-600 text-white' :
                    testStatus.email === 'error' ? 'bg-red-600 text-white' :
                    'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {testStatus.email === 'sending' ? 'Sending...' :
                   testStatus.email === 'success' ? 'Sent!' :
                   testStatus.email === 'error' ? 'Failed!' :
                   'Test'}
                </button>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.email.enabled}
                    onChange={(e) => handleSettingChange('notifications', 'email', {
                      ...settings.notifications.email,
                      enabled: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
            {settings.notifications.email.enabled && (
              <input
                type="email"
                value={settings.notifications.email.address}
                onChange={(e) => handleSettingChange('notifications', 'email', {
                  ...settings.notifications.email,
                  address: e.target.value
                })}
                placeholder="your@email.com"
                className="bg-[#0f1520] text-white px-4 py-2 rounded-lg w-full"
              />
            )}
          </div>

          {/* Sound Alerts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Sound Alerts</p>
                <p className="text-sm text-gray-400">Play sound on critical alerts</p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={testSound}
                  disabled={!settings.notifications.sound.enabled || testStatus.sound === 'playing'}
                  className={`px-3 py-1 rounded text-sm ${
                    testStatus.sound === 'success' ? 'bg-green-600 text-white' :
                    testStatus.sound === 'error' ? 'bg-red-600 text-white' :
                    'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {testStatus.sound === 'success' ? 'Played!' :
                   testStatus.sound === 'error' ? 'Failed!' :
                   'Test'}
                </button>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.sound.enabled}
                    onChange={(e) => handleSettingChange('notifications', 'sound', {
                      ...settings.notifications.sound,
                      enabled: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
            {settings.notifications.sound.enabled && (
              <select
                value={settings.notifications.sound.type}
                onChange={(e) => handleSettingChange('notifications', 'sound', {
                  ...settings.notifications.sound,
                  type: e.target.value
                })}
                className="bg-[#0f1520] text-white px-4 py-2 rounded-lg w-full"
              >
                <option value="default">Default Alert</option>
                <option value="urgent">Urgent Alert</option>
                <option value="gentle">Gentle Alert</option>
              </select>
            )}
          </div>
        </div>

        {/* Threshold Settings */}
        <div className="bg-[#1a2234] rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Alert Thresholds</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-white mb-2">Critical Level (PPM)</label>
              <input
                type="number"
                value={settings.thresholds.critical}
                onChange={(e) => handleSettingChange('thresholds', 'critical', Number(e.target.value))}
                className="bg-[#0f1520] text-white px-4 py-2 rounded-lg w-full"
                min="1"
                max="10"
              />
            </div>
            <div>
              <label className="block text-white mb-2">Danger Level (PPM)</label>
              <input
                type="number"
                value={settings.thresholds.danger}
                onChange={(e) => handleSettingChange('thresholds', 'danger', Number(e.target.value))}
                className="bg-[#0f1520] text-white px-4 py-2 rounded-lg w-full"
                min="1"
                max="10"
              />
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="bg-[#1a2234] rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Display Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-white mb-2">Theme</label>
              <select
                value={settings.display.theme}
                onChange={(e) => handleSettingChange('display', 'theme', e.target.value)}
                className="bg-[#0f1520] text-white px-4 py-2 rounded-lg w-full"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
            <div>
              <label className="block text-white mb-2">Chart Time Interval</label>
              <select
                value={settings.display.chartInterval}
                onChange={(e) => handleSettingChange('display', 'chartInterval', e.target.value)}
                className="bg-[#0f1520] text-white px-4 py-2 rounded-lg w-full"
              >
                <option value="1h">1 Hour</option>
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button 
            onClick={handleSaveSettings}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-600"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings; 