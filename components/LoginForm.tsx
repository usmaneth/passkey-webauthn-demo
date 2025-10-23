'use client';

import { useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import StepIndicator from './StepIndicator';

interface LoginFormProps {
  onSuccess: (username: string) => void;
  onSwitchToRegister: () => void;
}

type LoginStep = 'idle' | 'getting-options' | 'biometric' | 'verifying' | 'complete';

const STEPS = [
  { id: 'getting-options', label: 'Finding your passkey', description: 'Contacting server' },
  { id: 'biometric', label: 'Authenticating', description: 'Verify your identity' },
  { id: 'verifying', label: 'Verifying', description: 'Confirming your identity' },
];

export default function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [currentStep, setCurrentStep] = useState<LoginStep>('idle');
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const isLoading = currentStep !== 'idle';
  const completedSteps = {
    'getting-options': currentStep !== 'idle',
    'biometric': ['biometric', 'verifying', 'complete'].includes(currentStep),
    'verifying': ['verifying', 'complete'].includes(currentStep),
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCurrentStep('getting-options');

    try {
      // Step 1: Get authentication options from server
      setCurrentStep('getting-options');
      const optionsResponse = await fetch('/api/login/generate-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
        credentials: 'include',
      });

      if (!optionsResponse.ok) {
        const errorData = await optionsResponse.json();
        throw new Error(errorData.error || 'Failed to get authentication options');
      }

      const options = await optionsResponse.json();

      // Step 2: Prompt user to authenticate with their passkey
      setCurrentStep('biometric');
      const credential = await startAuthentication(options);

      // Step 3: Verify the authentication with server
      setCurrentStep('verifying');
      const verifyResponse = await fetch('/api/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential),
        credentials: 'include',
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const result = await verifyResponse.json();

      if (result.verified) {
        setCurrentStep('complete');
        setTimeout(() => {
          onSuccess(result.username);
        }, 800);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (err: any) {
      setCurrentStep('idle');
      console.error('Login error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Authentication was cancelled or timed out');
      } else {
        setError(err.message || 'Failed to login');
      }
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      {/* Username Input */}
      <div>
        <label htmlFor="login-username" className="block text-sm font-medium mb-2">
          Username
        </label>
        <input
          id="login-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 disabled:text-gray-500"
          placeholder="Enter your username"
          autoComplete="username webauthn"
          disabled={isLoading}
        />
      </div>

      {/* Step Indicator */}
      {isLoading && <StepIndicator steps={STEPS} currentStep={currentStep} completed={completedSteps} />}

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="p-4 text-sm text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-900/30 rounded-lg border border-red-300 dark:border-red-800"
        >
          <div className="font-semibold mb-1">Login failed</div>
          <div>{error}</div>
        </div>
      )}

      {/* Educational Callout */}
      {!isLoading && !error && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-3">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Phishing-resistant authentication
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Your passkey is cryptographically bound to this domain. Even if you're tricked into visiting a fake site, your passkey won't work there.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>{currentStep === 'biometric' ? 'Waiting for biometric...' : 'Logging in...'}</span>
          </div>
        ) : (
          'Login with Passkey'
        )}
      </button>

      {/* Technical Details Toggle */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center space-x-1"
        >
          <span>🔧 Technical details</span>
          <span className={`transform transition-transform ${showDetails ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {showDetails && (
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded text-xs text-gray-600 dark:text-gray-400 space-y-2 font-mono">
            <div>
              <strong>How it works:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Server generates a unique challenge</li>
                <li>Your device signs it with the private key</li>
                <li>Server verifies with your public key</li>
              </ul>
            </div>
            <div>
              <strong>Why it's secure:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Private key never leaves your device</li>
                <li>Challenge prevents replays</li>
                <li>Domain-bound (phishing-resistant)</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Switch to Register */}
      <div className="text-center text-sm">
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
        >
          Don't have an account? Register
        </button>
      </div>
    </form>
  );
}

