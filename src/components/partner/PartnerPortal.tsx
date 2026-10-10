import React, { useState } from 'react';
import { 
  Briefcase, 
  DollarSign, 
  Film, 
  User, 
  Sparkles, 
  Smartphone, 
  Camera, 
  Scissors, 
  Building2, 
  Truck, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  LogOut, 
  MapPin, 
  Award,
  Layers,
  ChevronDown,
  Wallet as WalletIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { StakeholderRole, PartnerProfile } from '../../types/stakeholder';
import { INITIAL_PARTNER_PROFILES } from '../../constants/stakeholderData';
import PartnerWorkSection from './PartnerWorkSection';
import PartnerEarningsSection from './PartnerEarningsSection';
import TrainingReelsSection from './TrainingReelsSection';
import PartnerNotificationCenter from './PartnerNotificationCenter';
import WalletScreen from '../wallet/WalletScreen';
import { PartnerNotification } from '../../types/notifications';

type PartnerTab = 'work' | 'earnings' | 'reels' | 'profile';

interface PartnerPortalProps {
  onSwitchToClientMode?: () => void;
}

const INITIAL_PARTNER_NOTIFICATIONS: PartnerNotification[] = [
  {
    id: 'notif_1',
    type: 'new_order',
    title: '🚨 New Reel Shoot Order Nearby',
    message: 'Cult Fitness requested an instant iPhone 16 Pro reel shoot at Indiranagar 100ft Rd (1.8 km away).',
    amount: 5500,
    timestamp: '2m ago',
    read: false,
    priority: 'high',
    location: 'Indiranagar 100ft Rd',
    clientName: 'Cult Fitness',
    actionPayload: {
      orderId: 'ord_cult_101',
      gigTitle: 'Cult Fitness 3x Reels',
      amount: 5500
    }
  },
  {
    id: 'notif_2',
    type: 'payout_processed',
    title: '💰 Daily Shoot Payout Credited',
    message: '₹4,500 transferred to upi@okhdfcbank via instant IMPS payout gateway. Transaction Ref: IMPS-982144',
    amount: 4500,
    timestamp: '1h ago',
    read: false,
    priority: 'high'
  },
  {
    id: 'notif_3',
    type: 'status_changed',
    title: '🎬 S-Log3 4K Footage Ingested',
    message: 'Videographer uploaded raw Sony FX3 footage cards for "Cafe Espresso Commercial". DaVinci Resolve color grading queue is now active.',
    timestamp: '3h ago',
    read: true,
    priority: 'normal'
  }
];

const ROLE_OPTIONS: { id: StakeholderRole; title: string; icon: any; color: string }[] = [
  { id: 'reel_creator', title: 'Video Reel Creator', icon: Smartphone, color: 'text-sleek-violet' },
  { id: 'videographer', title: 'Cinema Videographer', icon: Camera, color: 'text-purple-400' },
  { id: 'video_editor', title: 'Video Editor & Colorist', icon: Scissors, color: 'text-emerald-400' },
  { id: 'studio_owner', title: 'Studio Space Owner', icon: Building2, color: 'text-amber-400' },
  { id: 'rental_vendor', title: 'Camera & Gear Rental', icon: Truck, color: 'text-rose-400' },
  { id: 'agency_owner', title: 'Creative Agency Owner', icon: Film, color: 'text-cyan-400' }
];

export default function PartnerPortal({ onSwitchToClientMode }: PartnerPortalProps) {
  const { user, partnerRole, logoutUser } = useAuth();
  
  // Active role state (defaults to Auth context role or 'reel_creator')
  const [currentRole, setCurrentRole] = useState<StakeholderRole>(
    (partnerRole as StakeholderRole) || 'reel_creator'
  );

  // Show full wallet & immutable ledger screen
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Role selector dropdown open state
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Online / Ready status toggle
  const [isOnline, setIsOnline] = useState(true);

  // Active Tab: work | earnings | reels | profile
  const [activeTab, setActiveTab] = useState<PartnerTab>('work');

  // Real-time notifications state for gig alerts, payouts, and project statuses
  const [notifications, setNotifications] = useState<PartnerNotification[]>(INITIAL_PARTNER_NOTIFICATIONS);

  // Dynamic profile data based on selected role
  const [profiles, setProfiles] = useState<Record<StakeholderRole, PartnerProfile>>(INITIAL_PARTNER_PROFILES);
  const activeProfile = profiles[currentRole];

  if (showWalletModal) {
    return (
      <div className="min-h-screen bg-sleek-black text-white p-4 max-w-md mx-auto w-full">
        <WalletScreen 
          onBack={() => setShowWalletModal(false)} 
          isPartner={true} 
          partnerRole={currentRole} 
        />
      </div>
    );
  }

  // Helper to credit partner wallet when work is uploaded / gigs completed
  const handleCreditWallet = (amount: number, note: string) => {
    setProfiles(prev => ({
      ...prev,
      [currentRole]: {
        ...prev[currentRole],
        walletBalance: prev[currentRole].walletBalance + amount,
        totalEarnings: prev[currentRole].totalEarnings + amount,
        completedJobs: prev[currentRole].completedJobs + 1
      }
    }));
  };

  // Helper to accept an incoming gig from notification
  const handleAcceptOrderNotification = (notif: PartnerNotification) => {
    if (notif.amount) {
      handleCreditWallet(notif.amount, `Accepted gig: ${notif.title}`);
    }
    setActiveTab('work');
  };

  // Helper for withdrawals
  const handleWithdrawFunds = (amount: number, upiId: string) => {
    setProfiles(prev => ({
      ...prev,
      [currentRole]: {
        ...prev[currentRole],
        walletBalance: Math.max(0, prev[currentRole].walletBalance - amount)
      }
    }));
  };

  const currentRoleObj = ROLE_OPTIONS.find(r => r.id === currentRole) || ROLE_OPTIONS[0];
  const CurrentIcon = currentRoleObj.icon;

  return (
    <div className="flex flex-col min-h-screen text-white select-none">
      {/* Top Partner Navigation Bar */}
      <header className="sticky top-0 z-40 bg-sleek-black/90 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          
          {/* Partner Avatar & Role Dropdown Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-2xl transition-all"
            >
              <div className="relative">
                <img 
                  src={activeProfile.avatar} 
                  alt={activeProfile.name} 
                  className="w-8 h-8 rounded-full object-cover border border-white/20"
                />
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-sleek-black ${
                  isOnline ? 'bg-emerald-500' : 'bg-zinc-500'
                }`} />
              </div>

              <div className="text-left">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black text-white">{activeProfile.name}</span>
                  <ChevronDown size={12} className="text-white/50" />
                </div>
                <div className="flex items-center gap-1">
                  <CurrentIcon size={10} className={currentRoleObj.color} />
                  <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider">{currentRoleObj.title}</span>
                </div>
              </div>
            </button>

            {/* Role Switcher Menu */}
            <AnimatePresence>
              {roleDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute left-0 mt-2 w-64 bg-sleek-dark border border-white/20 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1"
                >
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40 px-2 py-1">
                    Switch Stakeholder Role:
                  </span>
                  {ROLE_OPTIONS.map((role) => {
                    const Icon = role.icon;
                    const isSelected = currentRole === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => {
                          setCurrentRole(role.id);
                          setRoleDropdownOpen(false);
                        }}
                        className={`p-2.5 rounded-xl text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-sleek-violet text-white shadow-md'
                            : 'hover:bg-white/5 text-white/70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={14} className={isSelected ? 'text-white' : role.color} />
                          <span className="text-xs font-bold">{role.title}</span>
                        </div>
                        {isSelected && <CheckCircle2 size={12} className="text-white" />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Header Actions: Online Toggle, Real-time Notification Center, Switch to Client Mode */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsOnline(!isOnline)}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                isOnline
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'}`} />
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </button>

            {/* Real-Time Notification Center */}
            <PartnerNotificationCenter
              notifications={notifications}
              onNotificationsChange={setNotifications}
              onAcceptOrder={handleAcceptOrderNotification}
              onNavigateTab={(tab) => setActiveTab(tab)}
              currentRoleTitle={currentRoleObj.title}
            />

            {/* Quick Wallet Button */}
            <button
              type="button"
              onClick={() => setShowWalletModal(true)}
              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl transition-all"
              title="Open Partner Wallet & Immutable Ledger"
            >
              <WalletIcon size={14} />
            </button>

            {onSwitchToClientMode && (
              <button
                type="button"
                onClick={onSwitchToClientMode}
                className="p-2 rounded-xl bg-white/5 hover:bg-sleek-violet/20 border border-white/10 hover:border-sleek-violet/40 text-white/70 hover:text-white transition-all text-[10px] font-extrabold uppercase tracking-wider"
                title="Switch to Brand Client view"
              >
                Client View
              </button>
            )}
          </div>
        </div>

        {/* Section Tabs: Work | Earnings | Reel Academy | Profile */}
        <div className="flex items-center bg-sleek-dark p-1 rounded-2xl border border-white/10 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('work')}
            className={`flex-1 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'work'
                ? 'bg-sleek-violet text-white shadow-md'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Briefcase size={13} />
            <span>Work & Gigs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('earnings')}
            className={`flex-1 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'earnings'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-md'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <DollarSign size={13} />
            <span>Earnings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reels')}
            className={`flex-1 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all relative ${
              activeTab === 'reels'
                ? 'bg-sleek-fuchsia text-white shadow-md'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Film size={13} />
            <span>Reels Tab</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-1.5 right-2" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'profile'
                ? 'bg-white/20 text-white shadow-md'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <User size={13} />
            <span>Profile</span>
          </button>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full">
        {activeTab === 'work' && (
          <PartnerWorkSection 
            currentRole={currentRole} 
            roleTitle={currentRoleObj.title} 
            onCreditWallet={handleCreditWallet}
          />
        )}

        {activeTab === 'earnings' && (
          <PartnerEarningsSection 
            currentRole={currentRole}
            walletBalance={activeProfile.walletBalance}
            totalEarnings={activeProfile.totalEarnings}
            completedJobs={activeProfile.completedJobs}
            onWithdrawFunds={handleWithdrawFunds}
            onOpenWallet={() => setShowWalletModal(true)}
          />
        )}

        {activeTab === 'reels' && (
          <TrainingReelsSection 
            currentRole={currentRole}
            roleTitle={currentRoleObj.title}
          />
        )}

        {activeTab === 'profile' && (
          <div className="flex flex-col gap-4 text-left pb-12">
            <div className="bg-sleek-dark p-4 rounded-3xl border border-white/10 flex flex-col items-center text-center gap-3 shadow-xl">
              <div className="relative">
                <img 
                  src={activeProfile.avatar} 
                  alt={activeProfile.name} 
                  className="w-20 h-20 rounded-full object-cover border-2 border-sleek-violet shadow-xl"
                />
                <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full border-2 border-sleek-dark">
                  <CheckCircle2 size={12} className="text-white" />
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-white">{activeProfile.name}</h3>
                <p className="text-xs font-bold text-sleek-violet mt-0.5">{currentRoleObj.title}</p>
                <div className="flex items-center justify-center gap-2 mt-1 text-[11px] text-white/50">
                  <span className="flex items-center gap-1 text-amber-400 font-bold">★ {activeProfile.rating}</span>
                  <span>•</span>
                  <span>{activeProfile.completedJobs} Completed Shoots</span>
                </div>
              </div>
            </div>

            {/* Equipment & Verification */}
            <div className="bg-sleek-dark p-4 rounded-3xl border border-white/10 flex flex-col gap-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/50">
                Verified Equipment Manifest
              </span>
              <p className="text-xs text-white/90 leading-relaxed font-mono bg-white/5 p-3 rounded-2xl border border-white/5">
                {activeProfile.equipmentSummary}
              </p>
            </div>

            {/* Base Dispatch Location */}
            <div className="bg-sleek-dark p-4 rounded-3xl border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MapPin size={16} className="text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-white/40 block">Primary Base City</span>
                  <span className="text-xs font-extrabold text-white">{activeProfile.city}</span>
                </div>
              </div>
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">
                Active Radius
              </span>
            </div>

            {/* Logout Action */}
            <button
              type="button"
              onClick={() => logoutUser()}
              className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all mt-2"
            >
              <LogOut size={14} />
              <span>Log Out Partner Account</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
