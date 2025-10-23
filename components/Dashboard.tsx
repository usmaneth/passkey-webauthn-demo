'use client';

import { useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import StepIndicator from './StepIndicator';

interface DashboardProps {
  username: string;
  onLogout: () => void;
}

type DemoTab = 'portfolio' | 'transactions' | 'operations';
type OperationStep = 'idle' | 'getting-options' | 'biometric' | 'verifying' | 'complete';

const OPERATION_STEPS = [
  { id: 'getting-options', label: 'Preparing', description: 'Setting up security challenge' },
  { id: 'biometric', label: 'Authenticate', description: 'Use your fingerprint or face' },
  { id: 'verifying', label: 'Approving', description: 'Confirming your identity' },
];

export default function Dashboard({ username, onLogout }: DashboardProps) {
  const [loading, setLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('what-happened');
  const [showFinanceDemo, setShowFinanceDemo] = useState(false);
  const [demoTab, setDemoTab] = useState<DemoTab>('portfolio');
  const [showWithdrawalPrompt, setShowWithdrawalPrompt] = useState(false);
  const [operationStep, setOperationStep] = useState<OperationStep>('idle');
  const [withdrawalApproved, setWithdrawalApproved] = useState(false);
  const [operationError, setOperationError] = useState('');

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleWithdrawalApproval = async () => {
    setOperationError('');
    setOperationStep('getting-options');

    try {
      // Step 1: Get authentication options for sensitive operation
      setOperationStep('getting-options');
      const optionsResponse = await fetch('/api/sensitive-operation/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!optionsResponse.ok) {
        const errorData = await optionsResponse.json();
        throw new Error(errorData.error || 'Failed to prepare authentication');
      }

      const options = await optionsResponse.json();

      // Step 2: Prompt user to authenticate with biometric
      setOperationStep('biometric');
      const credential = await startAuthentication(options);

      // Step 3: Verify the authentication
      setOperationStep('verifying');
      const verifyResponse = await fetch('/api/sensitive-operation/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential),
        credentials: 'include',
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Operation verification failed');
      }

      const result = await verifyResponse.json();

      if (result.operationApproved) {
        setOperationStep('complete');
        setWithdrawalApproved(true);
        setShowWithdrawalPrompt(false);
        await new Promise(r => setTimeout(r, 1500));
        setWithdrawalApproved(false);
        setOperationStep('idle');
      }
    } catch (err: any) {
      console.error('Operation error:', err);
      setOperationStep('idle');
      if (err.name === 'NotAllowedError') {
        setOperationError('Authentication was cancelled');
      } else {
        setOperationError(err.message || 'Failed to approve operation');
      }
    }
  };

  const operationCompleted = operationStep === 'complete';
  const operationInProgress = operationStep !== 'idle';
  const operationCompletedSteps = {
    'getting-options': operationStep !== 'idle',
    'biometric': ['biometric', 'verifying', 'complete'].includes(operationStep),
    'verifying': ['verifying', 'complete'].includes(operationStep),
  };

  // Mock portfolio data
  const portfolio = [
    { symbol: 'BTC', name: 'Bitcoin', amount: '0.5234', value: '$21,847' },
    { symbol: 'ETH', name: 'Ethereum', amount: '8.45', value: '$15,320' },
    { symbol: 'AAPL', name: 'Apple Stock', amount: '25', value: '$4,150' },
    { symbol: 'SPY', name: 'S&P 500 ETF', amount: '10', value: '$4,890' },
  ];

  const transactions = [
    { date: '2025-01-14', type: 'deposit', asset: 'USDC', amount: '+$5,000', status: 'completed' },
    { date: '2025-01-13', type: 'trade', from: 'ETH', to: 'BTC', status: 'completed' },
    { date: '2025-01-12', type: 'withdrawal', asset: 'BTC', amount: '-0.1', status: 'completed' },
    { date: '2025-01-11', type: 'dividend', asset: 'AAPL', amount: '+$12.50', status: 'completed' },
  ];

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 mb-4 animate-bounce">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          You're logged in!
        </h2>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Welcome back, <span className="font-semibold text-blue-600 dark:text-blue-400">{username}</span>
        </p>
      </div>

      {/* Easter Egg Finance Demo Button */}
      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <button
          onClick={() => setShowFinanceDemo(!showFinanceDemo)}
          className="w-full text-left flex items-center justify-between hover:opacity-80 transition-opacity"
        >
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">
              🎁 Easter Egg: Imagine a Fintech App...
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
              See how passkeys could secure financial operations in real-world apps
            </p>
          </div>
          <svg
            className={`w-6 h-6 text-amber-600 dark:text-amber-400 transition-transform ${
              showFinanceDemo ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        {showFinanceDemo && (
          <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800 space-y-4">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              ✨ <strong>What if this was a financial app?</strong> Here's how passkey authentication would work:
            </p>

            {/* Demo Tabs */}
            <div className="flex space-x-2 bg-white dark:bg-gray-800 rounded p-1">
              {(['portfolio', 'transactions', 'operations'] as DemoTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDemoTab(tab)}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    demoTab === tab
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab === 'portfolio' && '💼 Portfolio'}
                  {tab === 'transactions' && '📝 History'}
                  {tab === 'operations' && '🔐 Actions'}
                </button>
              ))}
            </div>

            {/* Portfolio Tab */}
            {demoTab === 'portfolio' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                  <span>Your Assets</span>
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                    Protected by Passkey
                  </span>
                </h4>
                <div className="space-y-2">
                  {portfolio.map((asset) => (
                    <div
                      key={asset.symbol}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{asset.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{asset.amount} {asset.symbol}</p>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{asset.value}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Total Portfolio:</strong> $50,207
                  </p>
                </div>
              </div>
            )}

            {/* Transactions Tab */}
            {demoTab === 'transactions' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Recent Transactions</h4>
                <div className="space-y-2">
                  {transactions.map((tx, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span>
                            {tx.type === 'deposit' && '📥'}
                            {tx.type === 'withdrawal' && '📤'}
                            {tx.type === 'trade' && '⚡'}
                            {tx.type === 'dividend' && '💰'}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{tx.type}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{tx.date}</p>
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {tx.type === 'trade' ? `${tx.from} → ${tx.to}` : tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Operations Tab */}
            {demoTab === 'operations' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                  <span>🔐 Sensitive Operations</span>
                  <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded">
                    Biometric Required
                  </span>
                </h4>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-100 mb-3">
                    With passkeys, every sensitive operation requires your device's biometric authentication. Try it now! 👇
                  </p>

                  {!operationInProgress && !withdrawalApproved && (
                    <button
                      onClick={() => setShowWithdrawalPrompt(true)}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                    >
                      Try: Request Withdrawal
                    </button>
                  )}

                  {operationInProgress && (
                    <StepIndicator 
                      steps={OPERATION_STEPS}
                      currentStep={operationStep}
                      completed={operationCompletedSteps as Record<string, boolean>}
                    />
                  )}

                  {withdrawalApproved && (
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded border border-green-300 dark:border-green-700 flex items-center space-x-2">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>✓ Withdrawal approved! Your biometric confirmed your identity.</span>
                    </div>
                  )}
                </div>

                {showWithdrawalPrompt && !operationInProgress && !withdrawalApproved && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800 space-y-3">
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                      🔐 Confirm withdrawal of 0.5 BTC ($21,847)
                    </p>
                    <button
                      onClick={handleWithdrawalApproval}
                      className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
                    >
                      Approve with Biometric (Touch ID/Face ID/Fingerprint)
                    </button>
                    <button
                      onClick={() => {
                        setShowWithdrawalPrompt(false);
                        setOperationError('');
                      }}
                      className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {operationError && (
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded border border-red-300 dark:border-red-700">
                    ❌ {operationError}
                  </div>
                )}

                <div className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded text-xs text-gray-700 dark:text-gray-300 space-y-2">
                  <p>
                    <strong>Why this matters:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>No one can withdraw without YOUR actual biometric</li>
                    <li>Impossible to phish or social engineer</li>
                    <li>Works even if your password is compromised</li>
                    <li>Private key never leaves your device</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current State */}
      <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-green-600 dark:bg-green-500">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
              ✓ Authentication Successful
            </h3>
            <p className="mt-1 text-sm text-green-800 dark:text-green-200">
              You are now authenticated and have a session cookie. Your passkey can be used to log in anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Educational Sections */}
      <div className="space-y-3">
        {/* What Happened */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => toggleSection('what-happened')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🔐</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">What Just Happened</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Step-by-step explanation</p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${
                expandedSection === 'what-happened' ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          {expandedSection === 'what-happened' && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <div className="space-y-3">
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-bold">
                      1
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Server Generated Challenge</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      The server created a unique random string and stored it temporarily. This prevents replay attacks.
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-bold">
                      2
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Your Device Authenticated You</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your biometric data (Face ID/Touch ID/Fingerprint) was verified locally on your device. This never leaves your device!
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-bold">
                      3
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Challenge Was Signed</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your device used your private key to cryptographically sign the challenge. The private key never left your device.
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-bold">
                      4
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Server Verified Signature</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      The server verified the signature using your public key. No password needed! You're now authenticated.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Why It's Secure */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => toggleSection('why-secure')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🛡️</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Why This Is Secure</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Security properties</p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${
                expandedSection === 'why-secure' ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          {expandedSection === 'why-secure' && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Phishing-Resistant</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Your passkey only works on this domain. Even if you visit a fake site, it won't authenticate.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Private Key Never Leaves Your Device</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Only the public key is stored on servers. Even if they're hacked, your private key is safe.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Biometric Data Never Shared</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Your Face ID/Touch ID is verified only on your device. No server ever sees it.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Replay Protection</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Each authentication uses a unique challenge. Old authentications can't be replayed.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        disabled={loading}
        className="w-full px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      >
        {loading ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  );
}

