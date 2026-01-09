import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { auth } from '../../firebase';

interface AuthPageProps {
    initialView?: 'login' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialView = 'login' }) => {
    const [isActive, setIsActive] = useState(initialView === 'signup');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [introStage, setIntroStage] = useState<'start' | 'walking' | 'zoom' | 'swiping' | 'reveal' | 'complete'>('start');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [signupData, setSignupData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        country: ''
    });

    useEffect(() => {
        setIsActive(initialView === 'signup');
    }, [initialView]);

    useEffect(() => {
        const zoomTimer = setTimeout(() => setIntroStage('zoom'), 100);
        const swipeTimer = setTimeout(() => setIntroStage('swiping'), 600);
        const revealTimer = setTimeout(() => setIntroStage('reveal'), 1300);
        const completeTimer = setTimeout(() => setIntroStage('complete'), 2500);
        return () => {
            clearTimeout(zoomTimer);
            clearTimeout(swipeTimer);
            clearTimeout(revealTimer);
            clearTimeout(completeTimer);
        };
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) {
            setError('Firebase not configured');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);

            // Sync user details on login (update last_login and ensure name is synced)
            const displayName = userCredential.user.displayName || '';
            const [firstName, ...lastNameParts] = displayName.split(' ');
            const lastName = lastNameParts.join(' ');

            await fetch('/api/auth/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: userCredential.user.uid,
                    email: userCredential.user.email,
                    firstName: firstName || '',
                    lastName: lastName || ''
                })
            });

            // 🔐 Get backend JWT token for secure API access
            const tokenResponse = await fetch('/api/auth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: userCredential.user.uid,
                    email: userCredential.user.email
                })
            });

            if (tokenResponse.ok) {
                const { token } = await tokenResponse.json();
                // Store JWT securely (will be picked up by API requests)
                localStorage.setItem('auth_token', token);
                console.log('[Auth] JWT token obtained and stored');
            }

        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) {
            setError('Firebase not configured');
            return;
        }
        setError('');
        setSuccessMsg('');
        if (signupData.password !== signupData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, signupData.email, signupData.password);
            await updateProfile(userCredential.user, {
                displayName: `${signupData.firstName} ${signupData.lastName}`
            });

            // Sync user details to backend
            await fetch('/api/auth/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: userCredential.user.uid,
                    email: signupData.email,
                    firstName: signupData.firstName,
                    lastName: signupData.lastName,
                    country: signupData.country
                })
            });

            // 🔐 Get backend JWT token for secure API access
            const tokenResponse = await fetch('/api/auth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: userCredential.user.uid,
                    email: signupData.email
                })
            });

            if (tokenResponse.ok) {
                const { token } = await tokenResponse.json();
                localStorage.setItem('auth_token', token);
                console.log('[Auth] JWT token obtained and stored');
            }

            await sendEmailVerification(userCredential.user);
            setSuccessMsg(`Account created! Verification email sent to ${signupData.email}`);
        } catch (err: any) {
            setError(err.message || 'Signup failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-[#2a2a2a] to-[#111]" />

            {/* Alien Space Background with Planets, Buildings, Shuttles */}
            <div className={`absolute inset-0 z-5 transition-opacity duration-1000 ${introStage === 'walking' || introStage === 'zoom' || introStage === 'swiping' ? 'opacity-100' : 'opacity-0'}`}>
                <svg viewBox="0 0 1000 600" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                    <defs>
                        <linearGradient id="space-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#0a0a0a" />
                            <stop offset="100%" stopColor="#1a0a00" />
                        </linearGradient>
                        <radialGradient id="planet-grad" cx="50%" cy="50%">
                            <stop offset="0%" stopColor="#ff6b00" />
                            <stop offset="100%" stopColor="#8b2500" />
                        </radialGradient>
                        <linearGradient id="building-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#1a1a1a" />
                            <stop offset="100%" stopColor="#000" />
                        </linearGradient>
                    </defs>

                    <rect width="1000" height="600" fill="url(#space-grad)" />

                    {/* Stars */}
                    <circle cx="100" cy="50" r="1" fill="#f97316" opacity="0.8" className="animate-pulse" />
                    <circle cx="300" cy="100" r="1.5" fill="#fff" opacity="0.6" />
                    <circle cx="500" cy="80" r="1" fill="#f97316" opacity="0.9" />
                    <circle cx="700" cy="120" r="1.5" fill="#fff" opacity="0.7" className="animate-pulse" />
                    <circle cx="850" cy="60" r="1" fill="#f97316" opacity="0.8" />
                    <circle cx="200" cy="150" r="1" fill="#fff" opacity="0.5" />
                    <circle cx="600" cy="40" r="1.5" fill="#f97316" opacity="0.9" className="animate-pulse" />
                    <circle cx="900" cy="140" r="1" fill="#fff" opacity="0.6" />

                    {/* Large Planet */}
                    <circle cx="850" cy="150" r="80" fill="url(#planet-grad)" opacity="0.6" />
                    <ellipse cx="850" cy="150" rx="90" ry="15" fill="none" stroke="#f97316" strokeWidth="2" opacity="0.4" />

                    {/* Small Moon */}
                    <circle cx="200" cy="200" r="30" fill="#2a2a2a" opacity="0.5" />

                    {/* Alien City Buildings */}
                    <g opacity="0.7">
                        <rect x="50" y="400" width="60" height="200" fill="url(#building-grad)" />
                        <rect x="50" y="400" width="60" height="10" fill="#f97316" opacity="0.3" />
                        <rect x="65" y="420" width="5" height="5" fill="#f97316" className="animate-pulse" />
                        <rect x="85" y="440" width="5" height="5" fill="#f97316" opacity="0.7" />

                        <rect x="150" y="350" width="70" height="250" fill="url(#building-grad)" />
                        <rect x="150" y="350" width="70" height="12" fill="#f97316" opacity="0.4" />
                        <rect x="170" y="380" width="6" height="6" fill="#f97316" />
                        <rect x="190" y="400" width="6" height="6" fill="#f97316" className="animate-pulse" />

                        <rect x="700" y="380" width="65" height="220" fill="url(#building-grad)" />
                        <rect x="700" y="380" width="65" height="10" fill="#f97316" opacity="0.3" />
                        <rect x="720" y="410" width="5" height="5" fill="#f97316" className="animate-pulse" />

                        <rect x="800" y="420" width="80" height="180" fill="url(#building-grad)" />
                        <rect x="820" y="450" width="6" height="6" fill="#f97316" />
                    </g>

                    {/* Space Shuttles */}
                    <g className="animate-shuttle-1">
                        <path d="M400,250 L420,245 L425,250 L420,255 Z" fill="#f97316" opacity="0.8" />
                        <circle cx="405" cy="250" r="2" fill="#fff" />
                        <path d="M420,250 L435,250 L433,248 L433,252 Z" fill="#ff8c00" />
                    </g>

                    <g className="animate-shuttle-2">
                        <path d="M600,180 L615,177 L618,180 L615,183 Z" fill="#f97316" opacity="0.7" />
                        <circle cx="605" cy="180" r="1.5" fill="#fff" />
                        <path d="M615,180 L625,180 L623,178 L623,182 Z" fill="#ff8c00" />
                    </g>

                    <g opacity="0.4">
                        <path d="M250,320 L260,318 L262,320 L260,322 Z" fill="#f97316" />
                        <path d="M260,320 L268,320 L267,319 L267,321 Z" fill="#ff8c00" />
                    </g>
                </svg>
            </div>

            {/* Hand Swiping Card Animation */}
            <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-1000 ${introStage === 'complete' ? 'opacity-0' : 'opacity-100'}`}>
                <div className="relative w-full h-full flex items-center justify-center">
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${introStage === 'zoom' || introStage === 'swiping' || introStage === 'reveal' ? 'opacity-100' : 'opacity-0'}`}>

                        {/* Scanner */}
                        <div className={`absolute right-[10%] top-1/2 -translate-y-1/2 w-12 h-[60vh] bg-neutral-900 border-l border-orange-500/50 shadow-[0_0_50px_rgba(249,115,22,0.2)] transition-transform duration-1000 ${introStage === 'swiping' ? 'translate-x-0' : 'translate-x-[200px]'}`}>
                            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-2 h-40 bg-orange-500 shadow-[0_0_30px_orange] rounded-r-full animate-pulse" />
                        </div>

                        {/* Hand Holding Card */}
                        <div className={`relative w-[600px] h-[600px] transition-transform duration-[800ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] ${introStage === 'swiping' ? 'translate-x-[200px]' : introStage === 'reveal' ? 'translate-x-[800px]' : '-translate-x-[400px]'}`}>
                            <svg viewBox="0 0 500 500" className="w-full h-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                                <defs>
                                    <linearGradient id="sleeve-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#171717" />
                                        <stop offset="100%" stopColor="#000000" />
                                    </linearGradient>
                                    <linearGradient id="skin-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#fdba74" />
                                        <stop offset="100%" stopColor="#fb923c" />
                                    </linearGradient>
                                </defs>
                                {/* Sleeve */}
                                <path d="M-100,500 L200,300 L280,380 L-50,550 Z" fill="url(#sleeve-grad)" stroke="#f97316" strokeWidth="2" />
                                <path d="200,300 L280,380" stroke="#f97316" strokeWidth="4" />

                                {/* Hand */}
                                <path d="M210,310 Q260,260 310,290 L330,330 Q290,390 260,360 Z" fill="url(#skin-grad)" />
                                <ellipse cx="320" cy="300" rx="18" ry="45" transform="rotate(-30 320 300)" fill="url(#skin-grad)" />
                                <ellipse cx="340" cy="320" rx="18" ry="45" transform="rotate(-30 340 320)" fill="url(#skin-grad)" />

                                {/* Card */}
                                <g transform="rotate(-10 360 260)">
                                    <rect x="300" y="200" width="220" height="130" rx="12" fill="#000" stroke="#f97316" strokeWidth="2" />
                                    <rect x="300" y="230" width="220" height="40" fill="rgba(249,115,22,0.1)" />
                                    <circle cx="340" cy="270" r="25" fill="rgba(249,115,22,0.2)" />
                                    <rect x="380" y="260" width="100" height="10" rx="2" fill="rgba(249,115,22,0.4)" />
                                    <rect x="380" y="280" width="60" height="10" rx="2" fill="rgba(249,115,22,0.4)" />
                                    <text x="480" y="310" fontFamily="sans-serif" fontSize="16" fill="#f97316" fontWeight="bold" textAnchor="end">ARES</text>
                                </g>

                                {/* Thumb */}
                                <ellipse cx="350" cy="350" rx="25" ry="60" transform="rotate(-60 350 350)" fill="url(#skin-grad)" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Login Form Container */}
            <div className={`relative bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden w-[900px] max-w-full min-h-[600px] border border-neutral-800 z-50 transition-all duration-800 ${introStage === 'reveal' || introStage === 'complete' ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>

                {/* Sign Up Form */}
                <div className={`absolute top-0 h-full transition-all duration-600 left-0 w-1/2 opacity-0 z-10 ${isActive ? 'translate-x-full opacity-100 z-50' : ''}`}>
                    <form onSubmit={handleSignup} className="bg-neutral-900 flex flex-col items-center justify-center h-full px-10 space-y-4">
                        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>


                        {error && <div className="text-red-400 text-xs bg-red-500/10 p-2 rounded w-full">{error}</div>}
                        {successMsg && <div className="text-green-400 text-xs bg-green-500/10 p-2 rounded w-full">{successMsg}</div>}
                        <div className="w-full grid grid-cols-2 gap-2">
                            <input type="text" placeholder="First Name" value={signupData.firstName} onChange={e => setSignupData({ ...signupData, firstName: e.target.value })} className="bg-neutral-800 border-none p-3 rounded-lg text-sm text-white outline-none focus:ring-1 focus:ring-orange-500 w-full" required />
                            <input type="text" placeholder="Last Name" value={signupData.lastName} onChange={e => setSignupData({ ...signupData, lastName: e.target.value })} className="bg-neutral-800 border-none p-3 rounded-lg text-sm text-white outline-none focus:ring-1 focus:ring-orange-500 w-full" required />
                        </div>
                        <input type="text" placeholder="Country" value={signupData.country} onChange={e => setSignupData({ ...signupData, country: e.target.value })} className="bg-neutral-800 border-none p-3 rounded-lg text-sm text-white outline-none focus:ring-1 focus:ring-orange-500 w-full" required />
                        <input type="email" placeholder="Email" value={signupData.email} onChange={e => setSignupData({ ...signupData, email: e.target.value })} className="bg-neutral-800 border-none p-3 rounded-lg text-sm text-white outline-none focus:ring-1 focus:ring-orange-500 w-full" required />
                        <input type="password" placeholder="Password" value={signupData.password} onChange={e => setSignupData({ ...signupData, password: e.target.value })} className="bg-neutral-800 border-none p-3 rounded-lg text-sm text-white outline-none focus:ring-1 focus:ring-orange-500 w-full" required />
                        <input type="password" placeholder="Confirm Password" value={signupData.confirmPassword} onChange={e => setSignupData({ ...signupData, confirmPassword: e.target.value })} className="bg-neutral-800 border-none p-3 rounded-lg text-sm text-white outline-none focus:ring-1 focus:ring-orange-500 w-full" required />
                        <button type="submit" disabled={isLoading} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold py-3 px-10 rounded-lg uppercase tracking-wider mt-4 hover:shadow-lg hover:shadow-orange-500/30 transition-all transform hover:scale-105 disabled:opacity-50">
                            {isLoading ? 'Creating...' : 'Sign Up'}
                        </button>
                    </form>
                </div>

                {/* Sign In Form */}
                <div className={`absolute top-0 h-full transition-all duration-600 left-0 w-1/2 z-20 ${isActive ? 'translate-x-full' : ''}`}>
                    <form onSubmit={handleLogin} className="bg-neutral-900 flex flex-col items-center justify-center h-full px-10 space-y-4">
                        <h1 className="text-3xl font-bold text-white mb-2">Sign In</h1>


                        {error && <div className="text-red-400 text-xs bg-red-500/10 p-2 rounded w-full">{error}</div>}
                        <input type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="bg-neutral-800 border-none p-3 rounded-lg text-sm text-white outline-none focus:ring-1 focus:ring-orange-500 w-full" required />
                        <input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="bg-neutral-800 border-none p-3 rounded-lg text-sm text-white outline-none focus:ring-1 focus:ring-orange-500 w-full" required />
                        <button type="submit" disabled={isLoading} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold py-3 px-10 rounded-lg uppercase tracking-wider mt-4 hover:shadow-lg hover:shadow-orange-500/30 transition-all transform hover:scale-105 disabled:opacity-50">
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                {/* Toggle Panel */}
                <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-all duration-600 z-[100] rounded-l-[100px] ${isActive ? '-translate-x-full rounded-l-none rounded-r-[100px]' : ''}`}>
                    <div className={`bg-gradient-to-r from-orange-600 to-orange-500 text-white relative -left-full h-full w-[200%] transition-all duration-600 ${isActive ? 'translate-x-1/2' : 'translate-x-0'}`}>
                        <div className={`absolute w-1/2 h-full flex flex-col items-center justify-center px-8 text-center top-0 transition-all duration-600 ${isActive ? 'translate-x-0' : '-translate-x-[200%]'}`}>
                            <h1 className="text-3xl font-bold mb-4">Welcome Back!</h1>
                            <p className="text-sm mb-8">Enter your details to access all features</p>
                            <button onClick={() => setIsActive(false)} className="bg-transparent border border-white text-white text-xs font-bold py-3 px-10 rounded-lg uppercase hover:bg-white hover:text-orange-600 transition-all">Sign In</button>
                        </div>
                        <div className={`absolute w-1/2 h-full flex flex-col items-center justify-center px-8 text-center top-0 right-0 transition-all duration-600 ${isActive ? 'translate-x-[200%]' : 'translate-x-0'}`}>
                            <h1 className="text-3xl font-bold mb-4">Hello, Friend!</h1>
                            <p className="text-sm mb-8">Register to access all features</p>
                            <button onClick={() => setIsActive(true)} className="bg-transparent border border-white text-white text-xs font-bold py-3 px-10 rounded-lg uppercase hover:bg-white hover:text-orange-600 transition-all">Sign Up</button>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes move {
                    0%, 49.99% { opacity: 0; z-index: 1; }
                    50%, 100% { opacity: 1; z-index: 5; }
                }
                .animate-move {
                    animation: move 0.6s;
                }
                @keyframes shuttle-1 {
                    0% { transform: translate(0, 0); }
                    50% { transform: translate(30px, -10px); }
                    100% { transform: translate(60px, -5px); }
                }
                .animate-shuttle-1 {
                    animation: shuttle-1 8s ease-in-out infinite;
                }
                @keyframes shuttle-2 {
                    0% { transform: translate(0, 0); }
                    50% { transform: translate(-25px, 8px); }
                    100% { transform: translate(-50px, 3px); }
                }
                .animate-shuttle-2 {
                    animation: shuttle-2 10s ease-in-out infinite;
                }
            `}</style>
        </div >
    );
};
