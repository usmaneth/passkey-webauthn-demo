'use client';

import { useState, useEffect } from 'react';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';
import Dashboard from '@/components/Dashboard';

type View = 'login' | 'register' | 'dashboard';

export default function Home() {
  const [view, setView] = useState<View>('login');
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include', // Important: send cookies!
        });
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setUsername(data.username);
            setView('dashboard');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleSuccess = (user: string) => {
    setUsername(user);
    setView('dashboard');
  };

  const handleLogout = () => {
    setUsername('');
    setView('login');
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div
          className="text-gray-600 dark:text-gray-400"
          role="status"
          aria-live="polite"
        >
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main
      id="main-content"
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4"
    >
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {view === 'dashboard' ? 'Dashboard' : 'Passkey Login Demo'}
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {view === 'dashboard'
                ? 'Your secure, passwordless account'
                : 'Secure, passwordless authentication with WebAuthn'}
            </p>
          </div>

          {/* Content */}
          {view === 'login' && (
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchToRegister={() => setView('register')}
            />
          )}

          {view === 'register' && (
            <RegisterForm
              onSuccess={handleSuccess}
              onSwitchToLogin={() => setView('login')}
            />
          )}

          {view === 'dashboard' && (
            <Dashboard username={username} onLogout={handleLogout} />
          )}
        </div>

        {/* Info Section */}
        {view !== 'dashboard' && (
          <div className="mt-6 p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              What are Passkeys?
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Passkeys are a modern, secure alternative to passwords. They use your device's 
              biometric authentication (like Face ID or fingerprint) to log you in—no password 
              to remember or type! They're phishing-resistant and never leave your device.
            </p>
          </div>
        )}

        {/* Browser Support Notice */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Passkeys require a modern browser and device with biometric authentication
          </p>
        </div>
      </div>
    </main>
  );
}

