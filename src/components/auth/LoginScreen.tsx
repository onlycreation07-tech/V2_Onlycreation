import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Building2, 
  ShieldCheck, 
  Zap, 
  Smartphone, 
  Camera, 
  Film, 
  Scissors, 
  Truck, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  BadgeCheck,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type LoginPortalMode = 'client' | 'partner';
type AuthFormMode = 'signin' | 'signup' | 'forgot';

interface PartnerRoleOption {
  id: string;
  title: string;
  category: string;
  icon: any;
  perk: string;
}

const PARTNER_ROLES: PartnerRoleOption[] = [
  {
    id: 'reel_creator',
    title: 'Video Reel Creator',
    category: 'iPhone 16 Pro / Gimbal',
    icon: Smartphone,
    perk: '₹1,500 - ₹4,500 per gig • On-demand dispatch'
  },
  {
    id: 'videographer',
    title: 'Cinema Videographer',
    category: 'Sony FX3 / RED / Arri',
    icon: Camera,
    perk: '₹4,000 - ₹15,000 per gig • 4K color graded'
  },
  {
    id: 'video_editor',
    title: 'Video Editor & Colorist',
    category: 'Premiere / DaVinci',
    icon: Scissors,
    perk: 'Remote queue • Per reel edited'
  },
  {
    id: 'studio_owner',
    title: 'Studio Space Owner',
    category: 'Acoustic / Cyclorama',
    icon: Building2,
    perk: 'Hourly slot monetization'
  },
  {
    id: 'rental_vendor',
    title: 'Camera & Gear Rental',
    category: 'Lenses / Lights / Drones',
    icon: Truck,
    perk: 'Gear dispatch to active sets'
  },
  {
    id: 'agency_owner',
    title: 'Creative Agency Owner',
    category: 'Full Production Crews',
    icon: Film,
    perk: 'Turnkey brand contracts across India'
  }
];

export default function LoginScreen() {
  const { 
    loginWithGoogleUser, 
    loginWithEmail, 
    signUpWithEmail, 
    resetUserPassword 
  } = useAuth();

  const [portalMode, setPortalMode] = useState<LoginPortalMode>('client');
  const [formMode, setFormMode] = useState<AuthFormMode>('signin');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  
  // Partner Specific Fields
  const [selectedRole, setSelectedRole] = useState<string>('reel_creator');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await loginWithGoogleUser();
    } catch (err: any) {
      console.warn("Google Sign-In notice:", err);
      setErrorMsg("Google sign-in was interrupted. Please try again or use email & password.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (formMode === 'signin') {
        if (!email.trim() || !password.trim()) {
          setErrorMsg('Please enter both email and password.');
          setLoading(false);
          return;
        }
        await loginWithEmail(email.trim(), password);
      } else if (formMode === 'signup') {
        if (!email.trim() || !password.trim() || !displayName.trim()) {
          setErrorMsg('Please complete all required fields.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        await signUpWithEmail(
          email.trim(), 
          password, 
          displayName.trim(), 
          portalMode === 'partner' ? selectedRole : 'CLIENT',
          portalMode === 'partner'
        );
      } else if (formMode === 'forgot') {
        if (!email.trim()) {
          setErrorMsg('Please enter your email to receive a password reset link.');
          setLoading(false);
          return;
        }
        await resetUserPassword(email.trim());
        setSuccessMsg('Password reset email sent! Check your inbox.');
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = err.message || 'Authentication failed. Please check credentials.';
      if (msg.includes('user-not-found') || msg.includes('invalid-credential') || msg.includes('wrong-password')) {
        msg = 'Invalid email or password. Please verify your credentials or create an account.';
      } else if (msg.includes('email-already-in-use')) {
        msg = 'An account already exists with this email address. Please sign in instead.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sleek-black text-white w-full flex flex-col justify-center items-center py-10 px-4 select-none">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        
        {/* Brand Icon & Title */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative">
            <div className="w-18 h-18 bg-gradient-to-tr from-sleek-violet via-purple-600 to-rose-500 rounded-[24px] flex items-center justify-center shadow-2xl shadow-sleek-violet/40 border border-white/20">
              <Sparkles className="text-white w-9 h-9 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-500 rounded-full border-2 border-sleek-black shadow-lg">
              <Zap size={11} className="text-white fill-current" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-md">
              OnlyCreation
            </h1>
            <p className="text-white/60 text-[9px] font-extrabold uppercase tracking-[0.25em]">
              Creative Studio • Creator Marketplace • Production
            </p>
          </div>
        </div>

        {/* Portal Switcher (Client vs Creator/Partner) */}
        <div className="w-full bg-sleek-dark p-1.5 rounded-2xl border border-white/10 flex items-center shadow-xl">
          <button
            type="button"
            onClick={() => {
              setPortalMode('client');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              portalMode === 'client'
                ? 'bg-sleek-violet text-white shadow-lg shadow-sleek-violet/30'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Building2 size={13} />
            <span>Brand / Client</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPortalMode('partner');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 relative ${
              portalMode === 'partner'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Zap size={13} className="fill-current text-amber-300" />
            <span>Creator / Partner</span>
            <span className="absolute -top-1.5 -right-1 bg-amber-400 text-black text-[7px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter shadow">
              Earn
            </span>
          </button>
        </div>

        {/* Mode 2: Partner Role Selector when in partner mode */}
        {portalMode === 'partner' && (
          <div className="w-full bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-500/30 rounded-2xl p-3 flex flex-col gap-1 text-left shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <BadgeCheck size={13} /> Creator / Partner Production Portal
              </span>
              <span className="text-[8px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                Verified
              </span>
            </div>
            <p className="text-xs font-bold text-white">Select Your Craft / Specialty</p>
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              {PARTNER_ROLES.slice(0, 4).map(role => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  className={`p-2 rounded-xl border text-left text-[10px] transition-all ${
                    selectedRole === role.id
                      ? 'bg-emerald-500/20 border-emerald-400 text-white font-bold'
                      : 'bg-black/20 border-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  <p className="truncate font-semibold">{role.title}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form Mode Selector: Sign In vs Sign Up */}
        <div className="w-full flex justify-between items-center px-1 border-b border-white/10 pb-2">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => { setFormMode('signin'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`text-xs font-bold transition-colors ${
                formMode === 'signin' ? 'text-sleek-violet border-b-2 border-sleek-violet pb-1' : 'text-white/40 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setFormMode('signup'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`text-xs font-bold transition-colors ${
                formMode === 'signup' ? 'text-sleek-violet border-b-2 border-sleek-violet pb-1' : 'text-white/40 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {formMode !== 'forgot' && (
            <button
              type="button"
              onClick={() => { setFormMode('forgot'); setErrorMsg(null); setSuccessMsg(null); }}
              className="text-[10px] text-white/40 hover:text-white underline"
            >
              Forgot Password?
            </button>
          )}
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="w-full flex flex-col gap-3 text-left">
          {formMode === 'signup' && (
            <div>
              <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest block mb-1">
                Full Name
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-3.5 text-white/40" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  required
                  className="w-full bg-sleek-dark border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-sleek-violet"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-3.5 text-white/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full bg-sleek-dark border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-sleek-violet"
              />
            </div>
          </div>

          {formMode !== 'forgot' && (
            <div>
              <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-3.5 text-white/40 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-sleek-dark border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-sleek-violet"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1 cursor-pointer focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff size={14} />
                  ) : (
                    <Eye size={14} />
                  )}
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2 text-rose-300 text-[11px]">
              <AlertTriangle size={14} className="shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2 text-emerald-300 text-[11px]">
              <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sleek-violet hover:bg-purple-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-sleek-violet/30 active:scale-[0.99] disabled:opacity-50 transition-all mt-1"
          >
            {loading ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : formMode === 'signin' ? (
              <><span>Sign In</span> <ArrowRight size={14} /></>
            ) : formMode === 'signup' ? (
              <><span>Create Account</span> <ArrowRight size={14} /></>
            ) : (
              <span>Send Reset Link</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="w-full flex items-center gap-3">
          <div className="h-px bg-white/10 flex-1" />
          <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider">or continue with</span>
          <div className="h-px bg-white/10 flex-1" />
        </div>

        {/* Alternative Auth Methods */}
        <div className="w-full flex flex-col gap-2.5">
          {/* Google Button */}
          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-zinc-950 py-3 px-4 rounded-xl font-bold text-xs transition-all active:scale-[0.99] hover:bg-zinc-100 disabled:opacity-50 shadow-md"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Security Assurance Footer */}
        <div className="flex items-center gap-1.5 text-[10px] text-white/40">
          <ShieldCheck size={12} className="text-emerald-400" />
          <span>Authoritative Firebase Authentication</span>
        </div>

      </div>
    </div>
  );
}
