import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  Smartphone, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  ToggleLeft, 
  ToggleRight,
  ExternalLink,
  Shield,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

interface SecurityPrivacyScreenProps {
  onBack: () => void;
  brandName: string;
}

export default function SecurityPrivacyScreen({ onBack, brandName }: SecurityPrivacyScreenProps) {
  const { user, logoutUser } = useAuth();

  // Privacy toggles
  const [publicPortfolio, setPublicPortfolio] = useState(true);
  const [anonymousDispatch, setAnonymousDispatch] = useState(false);
  const [gpsLocationSharing, setGpsLocationSharing] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  // Password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Delete account confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isGoogleUser = user?.providerData?.some(p => p.providerId === 'google.com') || user?.email?.includes('gmail');

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      alert('New passwords do not match');
      return;
    }
    if (newPass.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    setShowPasswordModal(false);
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    showToast('Password updated securely');
  };

  const handleDeleteAccount = () => {
    if (deleteInput.trim().toUpperCase() !== 'DELETE') {
      alert('Please type "DELETE" to confirm account deletion.');
      return;
    }
    showToast('Account scheduled for deletion. Logging out...');
    setTimeout(() => {
      logoutUser();
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-6 text-left pb-16">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 inset-x-4 max-w-sm mx-auto z-50 bg-emerald-500 text-black px-4 py-2.5 rounded-2xl shadow-2xl font-black text-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-white/80 hover:text-white transition-all active:scale-95"
          aria-label="Back to Profile"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-black tracking-tight text-white">Security & Privacy</h1>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Authentication, Privacy & Data Protection</p>
        </div>
      </header>

      {/* Account Security & Password */}
      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Authentication Credentials</label>

        <div className="bg-sleek-dark p-4 rounded-3xl border border-white/10 flex flex-col gap-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/5 rounded-2xl border border-white/5 text-white/80">
                <KeyRound size={18} className="text-sleek-violet" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">Access Credentials</h4>
                <p className="text-[10px] text-white/50">
                  {isGoogleUser ? 'Connected via Google OAuth (Fast Auth)' : 'Email & Password authentication'}
                </p>
              </div>
            </div>

            {isGoogleUser ? (
              <span className="text-[9px] font-black uppercase text-sleek-violet bg-sleek-violet/10 border border-sleek-violet/20 px-2 py-0.5 rounded-full">
                Google SSO
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-[10px] font-bold text-white"
              >
                Change
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-white/60 text-[11px]">Primary Account Email</span>
            <span className="text-white font-mono text-[11px] font-bold">{user?.email || 'creator@onlycreation.io'}</span>
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Connected Identities</label>

        <div className="flex flex-col gap-2">
          {/* Google */}
          <div className="bg-sleek-dark p-3.5 rounded-2xl border border-white/10 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center font-black text-xs text-white">
                G
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Google Workspace</span>
                <span className="text-[9px] text-emerald-400 font-mono">Linked & Verified</span>
              </div>
            </div>
            <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Active
            </span>
          </div>

          {/* Apple ID */}
          <div className="bg-sleek-dark p-3.5 rounded-2xl border border-white/5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center font-black text-xs text-white">
                
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Apple ID</span>
                <span className="text-[9px] text-white/40">Not linked</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => showToast('Apple ID linking requested')}
              className="text-[10px] font-bold text-sleek-violet hover:text-white px-2 py-1"
            >
              Connect
            </button>
          </div>

          {/* WhatsApp / Phone OTP */}
          <div className="bg-sleek-dark p-3.5 rounded-2xl border border-white/5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <Smartphone size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">SMS & WhatsApp Alerts</span>
                <span className="text-[9px] text-white/50">+91 98765 ••••• (Verified)</span>
              </div>
            </div>
            <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Linked
            </span>
          </div>
        </div>
      </div>

      {/* Privacy Toggles */}
      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Privacy & Safety Controls</label>

        <div className="bg-sleek-dark p-4 rounded-3xl border border-white/10 flex flex-col gap-4 shadow-lg">
          {/* Public Portfolio */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5 max-w-[80%]">
              <span className="text-xs font-bold text-white">Public Creative Portfolio</span>
              <span className="text-[10px] text-white/50">Showcase your brand shoots in the community inspiration feed</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setPublicPortfolio(!publicPortfolio);
                showToast(`Public portfolio ${!publicPortfolio ? 'enabled' : 'disabled'}`);
              }}
              className="p-1"
            >
              {publicPortfolio ? <ToggleRight size={28} className="text-sleek-violet" /> : <ToggleLeft size={28} className="text-white/30" />}
            </button>
          </div>

          {/* Anonymous Dispatch */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex flex-col gap-0.5 max-w-[80%]">
              <span className="text-xs font-bold text-white">Anonymous Creator Dispatch</span>
              <span className="text-[10px] text-white/50">Mask brand identity until gig worker arrives at shoot location</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setAnonymousDispatch(!anonymousDispatch);
                showToast(`Anonymous dispatch ${!anonymousDispatch ? 'enabled' : 'disabled'}`);
              }}
              className="p-1"
            >
              {anonymousDispatch ? <ToggleRight size={28} className="text-sleek-violet" /> : <ToggleLeft size={28} className="text-white/30" />}
            </button>
          </div>

          {/* GPS Tracking on Shoots */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex flex-col gap-0.5 max-w-[80%]">
              <span className="text-xs font-bold text-white">Real-Time Dispatch GPS</span>
              <span className="text-[10px] text-white/50">Share live route telemetry with incoming creators during shoots</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setGpsLocationSharing(!gpsLocationSharing);
                showToast(`Live GPS sharing ${!gpsLocationSharing ? 'enabled' : 'disabled'}`);
              }}
              className="p-1"
            >
              {gpsLocationSharing ? <ToggleRight size={28} className="text-sleek-violet" /> : <ToggleLeft size={28} className="text-white/30" />}
            </button>
          </div>

          {/* 2-Factor Authentication */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex flex-col gap-0.5 max-w-[80%]">
              <span className="text-xs font-bold text-white">Two-Factor Authentication (2FA)</span>
              <span className="text-[10px] text-white/50">Require SMS OTP for payouts and billing updates</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setTwoFactorAuth(!twoFactorAuth);
                showToast(`2FA ${!twoFactorAuth ? 'activated' : 'deactivated'}`);
              }}
              className="p-1"
            >
              {twoFactorAuth ? <ToggleRight size={28} className="text-emerald-400" /> : <ToggleLeft size={28} className="text-white/30" />}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone: Delete Account */}
      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-bold text-red-400/80 uppercase tracking-widest px-1">Danger Zone</label>

        <div className="bg-red-500/5 p-4 rounded-3xl border border-red-500/20 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-black text-red-400">Permanently Delete Account</span>
            <span className="text-[10px] text-white/40">Erase brand data, scripts, and studio history</span>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-3.5 py-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-sleek-dark border border-white/20 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 text-left"
            >
              <h3 className="text-sm font-black text-white">Change Account Password</h3>
              <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
                <input
                  type="password"
                  required
                  placeholder="Current Password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-sleek-violet"
                />
                <input
                  type="password"
                  required
                  placeholder="New Password (min 6 chars)"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-sleek-violet"
                />
                <input
                  type="password"
                  required
                  placeholder="Confirm New Password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-sleek-violet"
                />
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 py-2.5 bg-white/5 text-white rounded-xl text-xs font-bold uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-sleek-violet text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-sleek-violet/25"
                  >
                    Update
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-sleek-dark border border-red-500/40 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 text-left"
            >
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle size={20} />
                <h3 className="text-sm font-black text-white">Permanently Delete Account?</h3>
              </div>

              <p className="text-xs text-white/70 leading-relaxed">
                This action is irreversible. All brand profile memories, AI video scripts, liked studios, and team collaborator links will be wiped from OnlyCreation database.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                  Type <span className="text-red-400 font-mono">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="DELETE"
                  className="bg-white/5 border border-red-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-red-400 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteInput('');
                  }}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  Erase Everything
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
