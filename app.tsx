import { useState, useEffect } from 'react';
import { onAuthStateChanged, User, sendEmailVerification } from 'firebase/auth';
import { auth } from './firebase';
import { NotebookLMLayout } from './components/NotebookLMLayout';
import { AuthPage } from './components/Auth/AuthPage';
import { Button } from './components/ui/button';
import * as Sentry from '@sentry/react';

// Initialize Sentry for frontend monitoring (only if DSN configured)
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
  console.log('📊 Sentry frontend monitoring initialized');
}

import { CinematicLanding } from './components/CinematicLanding';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [showLanding, setShowLanding] = useState(true); // Control Landing Page visibility
  const [verificationSent, setVerificationSent] = useState(false);
  const [resendError, setResendError] = useState('');

  console.log('RENDER APP: User:', user, 'ShowLanding:', showLanding, 'Loading:', loading);

  useEffect(() => {
    // Handle initial hash
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === '/signup') {
        setView('signup');
      } else {
        setView('login');
      }
    };

    // Set initial view
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleResendVerification = async () => {
    if (!user) return;
    try {
      await sendEmailVerification(user);
      setVerificationSent(true);
      setResendError('');
      setTimeout(() => setVerificationSent(false), 5000); // Reset success message after 5s
    } catch (err: any) {
      console.error("Error sending verification email:", err);
      setResendError(err.message || "Failed to resend verification email.");
    }
  };

  const handleCheckVerification = async () => {
    if (!user) return;
    try {
      await user.reload();
      // Force state update by creating a new object reference
      if (user.emailVerified) {
        setUser({ ...user } as User);
      } else {
        alert("Email is not verified yet. Please click the link in your email.");
      }
    } catch (err) {
      console.error("Error reloading user:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show Cinematic Landing Page for unauthenticated users
  if (!user && showLanding) {
    return <CinematicLanding onComplete={() => setShowLanding(false)} />;
  }

  if (!user) {
    return <AuthPage initialView={view} />;
  }


  // Check if email is verified
  if (!user.emailVerified) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-neutral-900/50 border-2 border-orange-500/30 rounded-2xl p-8 backdrop-blur-sm text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Email Not Verified</h2>
          <p className="text-neutral-300 mb-6">
            Please check your email <span className="text-orange-400 font-medium">({user.email})</span> and click the verification link.
          </p>

          {verificationSent && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
              Verification email sent! Check your inbox (and spam).
            </div>
          )}

          {resendError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {resendError}
            </div>
          )}

          <div className="flex flex-col space-y-3">
            <Button
              onClick={handleCheckVerification}
              variant="premium"
              className="w-full"
            >
              I've Verified My Email
            </Button>
            <Button
              onClick={handleResendVerification}
              variant="secondary"
              className="w-full"
            >
              Resend Verification Email
            </Button>
            <Button
              onClick={() => auth.signOut()}
              variant="ghost"
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <NotebookLMLayout user={user} onSignOut={() => auth.signOut()} />;
}

export default App;
