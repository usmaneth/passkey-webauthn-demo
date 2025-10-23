'use client';

import { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import StepIndicator from './StepIndicator';

interface RegisterFormProps {
  onSuccess: (username: string) => void;
  onSwitchToLogin: () => void;
}

type RegistrationStep = 'idle' | 'getting-options' | 'biometric' | 'verifying' | 'complete';

const STEPS = [
  { id: 'getting-options', label: 'Getting ready', description: 'Contacting server for options' },
  { id: 'biometric', label: 'Biometric prompt', description: 'Use Touch ID, Face ID, or fingerprint' },
  { id: 'verifying', label: 'Verifying', description: 'Confirming your new passkey' },
];

export default function RegisterForm({ onSuccess, onSwitchToRegister }: RegisterFormProps) {
  const [username, setUsername] = useState('');
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('idle');
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const isLoading = currentStep !== 'idle';
  const completedSteps = {
    'getting-options': currentStep !== 'idle',
    'biometric': ['biometric', 'verifying', 'complete'].includes(currentStep),
    'verifying': ['verifying', 'complete'].includes(currentStep),
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCurrentStep('getting-options');

    try {
      // Step 1: Get registration options from server
      setCurrentStep('getting-options');
      const optionsResponse = await fetch('/api/register/generate-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
        credentials: 'include',
      });

      if (!optionsResponse.ok) {
        const errorData = await optionsResponse.json();
        throw new Error(errorData.error || 'Failed to get registration options');
      }

      const options = await optionsResponse.json();

      // Step 2: Prompt user to authenticate with their passkey
      setCurrentStep('biometric');
      const credential = await startRegistration(options);

      // Step 3: Verify the registration with server
      setCurrentStep('verifying');
      const verifyResponse = await fetch('/api/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential),
        credentials: 'include',
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const result = await verifyResponse.json();

      if (result.verified) {
        setCurrentStep('complete');
        setTimeout(() => {
          onSuccess(result.username);
        }, 800);
      } else {
        throw new Error('Registration failed');
      }
    } catch (err: any) {
      setCurrentStep('idle');
      console.error('Registration error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Authentication was cancelled or timed out');
      } else if (err.name === 'NotSupportedError') {
        setError('Passkeys are not supported on this device or browser');
      } else {
        setError(err.message || 'Failed to register');
      }
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-6">
      {/* Username Input */}
      <div>
        <label htmlFor="register-username" className="block text-sm font-medium mb-2">
          Username
        </label>
        <input
          id="register-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          maxLength={20}
          pattern="[a-zA-Z0-9_\-]+"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 disabled:text-gray-500"
          placeholder="Choose a username"
          autoComplete="username webauthn"
          disabled={isLoading}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          3-20 characters, letters, numbers, hyphens and underscores only
        </p>
      </div>

      {/* Step Indicator */}
      {isLoading && <StepIndicator steps={STEPS} currentStep={currentStep} completed={completedSteps} />}

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="p-4 text-sm text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-900/30 rounded-lg border border-red-300 dark:border-red-800"
        >
          <div className="font-semibold mb-1">Registration failed</div>
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
                What happens next
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                You'll be prompted to use your device's biometric authentication (Touch ID, Face ID, or fingerprint) to create a secure passkey.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-3 text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>{currentStep === 'biometric' ? 'Waiting for biometric...' : 'Creating passkey...'}</span>
          </div>
        ) : (
          'Register with Passkey'
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
              <strong>What's being sent:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Your username (plaintext)</li>
                <li>A random challenge from the server</li>
              </ul>
            </div>
            <div>
              <strong>What your device creates:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>A public key (sent to server)</li>
                <li>A private key (stays on your device)</li>
              </ul>
            </div>
            <div>
              <strong>Security:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Your biometric data never leaves your device</li>
                <li>No password is transmitted</li>
                <li>Cryptographically verified</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Switch to Login */}
      <div className="text-center text-sm">
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
        >
          Already have an account? Login
        </button>
      </div>
    </form>
  );
}

