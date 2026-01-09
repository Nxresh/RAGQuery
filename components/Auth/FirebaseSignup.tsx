import React, { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { auth } from '../../firebase';

const COUNTRIES = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France',
    'India', 'Japan', 'China', 'Brazil', 'Mexico', 'Spain', 'Italy', 'Netherlands',
    'Sweden', 'Norway', 'Denmark', 'Finland', 'Switzerland', 'Austria', 'Belgium',
    'Ireland', 'New Zealand', 'Singapore', 'South Korea', 'Other'
];

export const FirebaseSignup: React.FC = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        country: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const getPasswordStrength = (password: string) => {
        if (password.length === 0) return { strength: 0, label: '', color: '' };
        if (password.length < 6) return { strength: 25, label: 'Weak', color: 'bg-red-500' };
        if (password.length < 10) return { strength: 50, label: 'Fair', color: 'bg-yellow-500' };
        if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { strength: 75, label: 'Good', color: 'bg-blue-500' };
        return { strength: 100, label: 'Strong', color: 'bg-green-500' };
    };

    const passwordStrength = getPasswordStrength(formData.password);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) {
            setError('Firebase not configured');
            return;
        }
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            // Create user
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

            // Update profile with name
            await updateProfile(userCredential.user, {
                displayName: `${formData.firstName} ${formData.lastName}`
            });

            // Send verification email with redirect URL
            const actionCodeSettings = {
                url: 'http://localhost:5173/#/login', // Hardcoded for development
                handleCodeInApp: true,
            };
            await sendEmailVerification(userCredential.user, actionCodeSettings);

            // Sync user to local database
            try {
                await fetch('/api/auth/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        uid: userCredential.user.uid,
                        email: formData.email,
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        country: formData.country
                    })
                });
            } catch (syncError) {
                console.error('Failed to sync user to local db:', syncError);
                // Continue anyway as auth is successful
            }

            setSuccess(true);
        } catch (err: any) {
            console.error("Signup error:", err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Account already exists. Please sign in instead.');
            } else {
                setError(err.message || 'Signup failed');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4 relative">
                <div className="absolute inset-0">
                    <div className="absolute w-96 h-96 bg-orange-500/10 rounded-full blur-3xl top-1/4 left-1/4 animate-pulse"></div>
                </div>

                <div className="relative z-10 w-full max-w-md">
                    <div className="bg-neutral-900/50 border-2 border-orange-500/30 rounded-2xl p-8 backdrop-blur-sm text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Account Created!</h2>
                        <p className="text-neutral-300 mb-6">
                            We've sent a verification email to <span className="text-orange-400 font-medium">{formData.email}</span>
                        </p>
                        <p className="text-neutral-400 text-sm mb-6">
                            Please check your inbox and click the verification link to activate your account.
                        </p>
                        <a
                            href="#/login"
                            className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                        >
                            Go to Login
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0">
                <div className="absolute w-96 h-96 bg-orange-500/10 rounded-full blur-3xl top-1/4 left-1/4 animate-pulse"></div>
                <div className="absolute w-96 h-96 bg-orange-600/10 rounded-full blur-3xl bottom-1/4 right-1/4 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                            Join ARES
                        </span>
                    </h1>
                    <p className="text-neutral-400 text-sm">Create your enterprise account</p>
                </div>

                <div className="bg-neutral-900/50 border-2 border-orange-500/30 rounded-2xl p-8 backdrop-blur-sm">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                required
                                className="bg-black/50 border-2 border-neutral-700 focus:border-orange-500 rounded-lg px-4 py-3 text-white placeholder-neutral-500 transition-all duration-300 outline-none"
                                placeholder="First Name"
                            />
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                required
                                className="bg-black/50 border-2 border-neutral-700 focus:border-orange-500 rounded-lg px-4 py-3 text-white placeholder-neutral-500 transition-all duration-300 outline-none"
                                placeholder="Last Name"
                            />
                        </div>

                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="w-full bg-black/50 border-2 border-neutral-700 focus:border-orange-500 rounded-lg px-4 py-3 text-white placeholder-neutral-500 transition-all duration-300 outline-none"
                            placeholder="Email Address"
                        />

                        <select
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            required
                            className="w-full bg-black/50 border-2 border-neutral-700 focus:border-orange-500 rounded-lg px-4 py-3 text-white transition-all duration-300 outline-none"
                        >
                            <option value="">Select Country</option>
                            {COUNTRIES.map(country => (
                                <option key={country} value={country}>{country}</option>
                            ))}
                        </select>

                        <div>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                className="w-full bg-black/50 border-2 border-neutral-700 focus:border-orange-500 rounded-lg px-4 py-3 text-white placeholder-neutral-500 transition-all duration-300 outline-none"
                                placeholder="Password"
                            />
                            {formData.password && (
                                <div className="mt-2">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-neutral-500">Password Strength</span>
                                        <span className={`font-semibold ${passwordStrength.strength === 100 ? 'text-green-400' : passwordStrength.strength >= 75 ? 'text-blue-400' : passwordStrength.strength >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                    <div className="w-full bg-neutral-800 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                                            style={{ width: `${passwordStrength.strength}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            required
                            className="w-full bg-black/50 border-2 border-neutral-700 focus:border-orange-500 rounded-lg px-4 py-3 text-white placeholder-neutral-500 transition-all duration-300 outline-none"
                            placeholder="Confirm Password"
                        />

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>

                        <div className="text-center pt-4 border-t border-neutral-800">
                            <p className="text-neutral-400 text-sm">
                                Already have an account?{' '}
                                <a href="#/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
                                    Sign In
                                </a>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
