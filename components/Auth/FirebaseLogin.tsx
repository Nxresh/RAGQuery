import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';

export const FirebaseLogin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) {
            setError('Firebase not configured');
            return;
        }
        setError('');
        setIsLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Sync user to local database
            try {
                const user = userCredential.user;
                const displayName = user.displayName || '';
                const [firstName, ...lastNameParts] = displayName.split(' ');
                const lastName = lastNameParts.join(' ');

                await fetch('/api/auth/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        uid: user.uid,
                        email: user.email,
                        firstName: firstName || '',
                        lastName: lastName || '',
                        // Country not available on login, sending undefined to keep existing
                    })
                });
            } catch (syncError) {
                console.error('Failed to sync user to local db:', syncError);
            }

            // Firebase will automatically update auth state
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 overflow-hidden relative">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute w-96 h-96 bg-orange-500/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
                <div className="absolute w-96 h-96 bg-orange-600/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Main container */}
            <div className="relative z-10 w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold mb-2">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 animate-pulse">
                            ARES
                        </span>
                    </h1>
                    <p className="text-neutral-400 text-sm">Enterprise Intelligence System</p>
                </div>

                {/* Login Form */}
                <div className="bg-neutral-900/50 border-2 border-orange-500/30 rounded-2xl p-8 backdrop-blur-sm animate-slideUp">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Email Input */}
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-black/50 border-2 border-neutral-700 focus:border-orange-500 rounded-lg px-4 py-3 text-white placeholder-neutral-500 transition-all duration-300 focus:shadow-lg focus:shadow-orange-500/20 outline-none"
                                placeholder="Email Address"
                            />
                        </div>

                        {/* Password Input */}
                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-black/50 border-2 border-neutral-700 focus:border-orange-500 rounded-lg px-4 py-3 text-white placeholder-neutral-500 transition-all duration-300 focus:shadow-lg focus:shadow-orange-500/20 outline-none"
                                placeholder="Password"
                            />
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                        >
                            <span className="relative z-10">
                                {isLoading ? 'Authenticating...' : 'Access System'}
                            </span>
                        </button>

                        {/* Signup Link */}
                        <div className="text-center pt-4 border-t border-neutral-800">
                            <p className="text-neutral-400 text-sm">
                                New to the system?{' '}
                                <a href="#/signup" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
                                    Create Account
                                </a>
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: 100%; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }
      }`}</style>
        </div>
    );
};
