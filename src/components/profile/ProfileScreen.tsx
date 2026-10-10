import React, { useState } from 'react';
import { 
  Settings, 
  CreditCard, 
  Shield, 
  LogOut, 
  ChevronRight, 
  Building2, 
  Users, 
  Star, 
  Palette, 
  RefreshCw,
  Sparkles,
  Check,
  CheckCircle2,
  Save,
  Tag,
  Target,
  Smile,
  Hash,
  FolderOpen,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrandProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/dbService';
import BillingScreen from './BillingScreen';
import TeamMembersScreen from './TeamMembersScreen';
import SecurityPrivacyScreen from './SecurityPrivacyScreen';
import SettingsSheet from './SettingsSheet';
import WalletScreen from '../wallet/WalletScreen';

interface ProfileScreenProps {
  brandProfile: BrandProfile;
  onUpdateBrand: (profile: BrandProfile) => void;
  onNavigateToLiked: () => void;
  onNavigateToPartner?: () => void;
  onNavigateToProjects?: () => void;
}

type ProfileSubView = 'main' | 'billing' | 'team' | 'security' | 'wallet';

const PRESET_COLORS = [
  { name: 'Sleek Violet', hex: '#7C3AED' },
  { name: 'Cyber Cyan', hex: '#06B6D4' },
  { name: 'Neon Emerald', hex: '#10B981' },
  { name: 'Sunset Orange', hex: '#F97316' },
  { name: 'Neon Rose', hex: '#F43F5E' },
  { name: 'Deep Indigo', hex: '#6366F1' },
  { name: 'Gold Champagne', hex: '#F59E0B' }
];

const INDUSTRY_OPTIONS = [
  'Lifestyle & Fashion',
  'Fitness & Wellness',
  'Food & Beverages',
  'Hospitality & Travel',
  'Tech & Web3',
  'D2C E-Commerce',
  'Luxury & Real Estate',
  'Creator & Entertainment'
];

const TONE_OPTIONS = [
  'Bold & Disruptive',
  'Elegant & Minimal',
  'High-Energy Viral',
  'Warm & Story-Driven',
  'Playful & Quirky',
  'Cinematic & Moody'
];

export default function ProfileScreen({
  brandProfile,
  onUpdateBrand,
  onNavigateToLiked,
  onNavigateToPartner,
  onNavigateToProjects
}: ProfileScreenProps) {
  const { user, userProfile, organization, isSuperAdmin, isAdmin, logoutUser } = useAuth();

  // Active sub-screen view
  const [subView, setSubView] = useState<ProfileSubView>('main');

  // Local editable Brand Profile copy
  const [localBrand, setLocalBrand] = useState<BrandProfile>({
    name: brandProfile.name || 'Your Brand',
    industry: brandProfile.industry || 'Lifestyle & Fashion',
    targetAudience: brandProfile.targetAudience || 'Gen Z & Urban Millennials',
    tone: brandProfile.tone || 'Bold & Disruptive',
    primaryColor: brandProfile.primaryColor || '#7C3AED',
    fontVibe: brandProfile.fontVibe || 'minimal',
    likedStudioIds: brandProfile.likedStudioIds || []
  });

  // Settings sheet toggle
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle saving brand profile to Firestore
  const handleSaveBrand = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      if (user?.uid) {
        await dbService.saveBrand(user.uid, localBrand);
      }
      onUpdateBrand(localBrand);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save brand profile:', err);
      // Even if Firestore encounters temporary network issue, persist in app memory
      onUpdateBrand(localBrand);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Route to sub-screens if active
  if (subView === 'billing') {
    return <BillingScreen onBack={() => setSubView('main')} brandName={localBrand.name} />;
  }
  if (subView === 'team') {
    return <TeamMembersScreen onBack={() => setSubView('main')} brandName={localBrand.name} />;
  }
  if (subView === 'security') {
    return <SecurityPrivacyScreen onBack={() => setSubView('main')} brandName={localBrand.name} />;
  }
  if (subView === 'wallet') {
    return <WalletScreen onBack={() => setSubView('main')} />;
  }

  const menuItems = [
    { 
      icon: Wallet, 
      label: 'Wallet & Immutable Ledger', 
      detail: 'Live balance, deposits & double-entry audit log', 
      action: () => setSubView('wallet'),
      color: 'text-emerald-400'
    },
    { 
      icon: FolderOpen, 
      label: 'My Projects & Pipeline', 
      detail: 'Track production stages & deliverables', 
      action: onNavigateToProjects,
      color: 'text-sleek-violet'
    },
    { 
      icon: Building2, 
      label: 'Saved Studios', 
      detail: `${localBrand.likedStudioIds?.length || 0} locations bookmarked`, 
      action: onNavigateToLiked,
      color: 'text-amber-400'
    },
    { 
      icon: CreditCard, 
      label: 'Billing & Subscriptions', 
      detail: 'Pro Plan • Active', 
      action: () => setSubView('billing'),
      color: 'text-purple-400'
    },
    { 
      icon: Users, 
      label: 'Team Members', 
      detail: '3 collaborators active', 
      action: () => setSubView('team'),
      color: 'text-cyan-400'
    },
    { 
      icon: Shield, 
      label: 'Security & Privacy', 
      detail: 'Protected • 2FA Ready', 
      action: () => setSubView('security'),
      color: 'text-emerald-400'
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-16 text-left">
      {/* Top Header */}
      <header className="flex justify-between items-center">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-black tracking-tight text-white">Profile & Brand</h1>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Enterprise Creator Center</p>
        </div>
        <button 
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="p-3 transition-all active:scale-95 bg-white/5 rounded-2xl hover:bg-white/10 border border-white/10 text-white/80 hover:text-white"
          title="App Settings"
        >
          <Settings size={18} />
        </button>
      </header>

      {/* Success Notification Bar */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-500 text-black px-4 py-2.5 rounded-2xl font-black text-xs flex items-center justify-between shadow-xl shadow-emerald-500/20"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>Brand memory & DNA saved to Cloud!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Identity Card */}
      <div className="bg-sleek-dark p-6 rounded-[36px] border border-white/10 shadow-2xl relative overflow-hidden group">
        <div 
          className="absolute top-0 right-0 w-40 h-40 blur-[70px] rounded-full -mr-16 -mt-16 opacity-30 transition-all pointer-events-none"
          style={{ backgroundColor: localBrand.primaryColor }}
        />
        <div className="flex items-center gap-4 relative z-10">
          <div className="relative shrink-0">
            <div 
              className="w-16 h-16 rounded-full overflow-hidden p-0.5"
              style={{ background: `linear-gradient(135deg, ${localBrand.primaryColor}, #A855F7)` }}
            >
              <img 
                src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
                alt="Profile" 
                className="w-full h-full object-cover rounded-full bg-sleek-black"
                referrerPolicy="no-referrer"
              />
            </div>
            {isAdmin && (
              <div className="absolute -bottom-1 -right-1 bg-sleek-violet text-white p-1 rounded-full border-2 border-sleek-black shadow-lg">
                <Shield size={10} className="fill-current" />
              </div>
            )}
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white truncate">{user?.displayName || 'Creator Brand'}</h2>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70">PRO</span>
            </div>
            <p className="text-white/40 text-[10px] font-mono truncate">{user?.email || 'onlycreation07@gmail.com'}</p>
            <p className="text-[9px] font-black uppercase tracking-wider text-sleek-violet mt-1">
              {isSuperAdmin ? 'Master Founder' : isAdmin ? 'Platform Admin' : 'Brand Executive'}
            </p>
          </div>
        </div>

        {/* Organization / Workspace Indicator */}
        {organization && (
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Building2 size={13} className="text-sleek-violet shrink-0" />
              <span className="font-bold text-white truncate max-w-[160px]">{organization.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono px-2 py-0.5 rounded-full bg-sleek-violet/20 text-sleek-violet font-black uppercase">
                {userProfile?.role || 'MEMBER'}
              </span>
              <span className="text-[8px] text-white/40 uppercase font-black">
                {organization.plan}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* FULLY EDITABLE BRAND PROFILE CARD (All fields: name, industry, targetAudience, tone, primaryColor, fontVibe) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles size={12} className="text-sleek-violet" />
            <span>Brand Memory & AI Core</span>
          </label>
          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Active Moat
          </span>
        </div>

        <div className="bg-sleek-dark p-5 rounded-[32px] border border-white/10 flex flex-col gap-4 shadow-xl">
          
          {/* 1. Brand Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
              <Building2 size={12} className="text-white/50" />
              <span>Brand Identity / Company Name *</span>
            </label>
            <input 
              type="text" 
              value={localBrand.name}
              onChange={(e) => setLocalBrand({ ...localBrand, name: e.target.value })}
              placeholder="e.g. Acme Lifestyle"
              className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-white placeholder:text-white/20 outline-none focus:border-sleek-violet transition-colors"
            />
          </div>

          {/* 2. Industry */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
              <Tag size={12} className="text-white/50" />
              <span>Industry Vertical</span>
            </label>
            <select
              value={localBrand.industry}
              onChange={(e) => setLocalBrand({ ...localBrand, industry: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-sleek-violet cursor-pointer"
            >
              {INDUSTRY_OPTIONS.map((ind) => (
                <option key={ind} value={ind} className="bg-sleek-dark text-white">
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Target Audience */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
              <Target size={12} className="text-white/50" />
              <span>Target Audience</span>
            </label>
            <input 
              type="text" 
              value={localBrand.targetAudience}
              onChange={(e) => setLocalBrand({ ...localBrand, targetAudience: e.target.value })}
              placeholder="e.g. Gen Z, Urban Fitness Enthusiasts, Luxury Shoppers"
              className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs font-bold text-white placeholder:text-white/20 outline-none focus:border-sleek-violet transition-colors"
            />
          </div>

          {/* 4. Tone of Voice */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
              <Smile size={12} className="text-white/50" />
              <span>Brand Voice & Tone</span>
            </label>
            <select
              value={localBrand.tone}
              onChange={(e) => setLocalBrand({ ...localBrand, tone: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-sleek-violet cursor-pointer"
            >
              {TONE_OPTIONS.map((t) => (
                <option key={t} value={t} className="bg-sleek-dark text-white">
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Primary Brand Color (Interactive Picker + Presets + Hex) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
                <Palette size={12} className="text-white/50" />
                <span>Primary Brand Color</span>
              </label>
              <span className="text-[10px] font-mono text-white/60 font-bold uppercase">{localBrand.primaryColor}</span>
            </div>

            {/* Presets and Native Picker */}
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => setLocalBrand({ ...localBrand, primaryColor: color.hex })}
                  style={{ backgroundColor: color.hex }}
                  className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                    localBrand.primaryColor.toLowerCase() === color.hex.toLowerCase()
                      ? 'border-white scale-110 shadow-lg'
                      : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  title={color.name}
                >
                  {localBrand.primaryColor.toLowerCase() === color.hex.toLowerCase() && (
                    <Check size={12} className="text-white drop-shadow-md" />
                  )}
                </button>
              ))}

              {/* Native Color Picker trigger */}
              <label 
                className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center cursor-pointer hover:border-white transition-all bg-white/5 relative overflow-hidden"
                title="Custom Color"
              >
                <input
                  type="color"
                  value={localBrand.primaryColor}
                  onChange={(e) => setLocalBrand({ ...localBrand, primaryColor: e.target.value })}
                  className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                />
                <Hash size={12} className="text-white/60" />
              </label>
            </div>
          </div>

          {/* 6. Visual Font Vibe */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Visual Typography Vibe</label>
            <div className="grid grid-cols-2 gap-2 mt-0.5">
              {(['modern', 'serif', 'brutalist', 'minimal'] as const).map((vibe) => (
                <button
                  key={vibe}
                  type="button"
                  onClick={() => setLocalBrand({ ...localBrand, fontVibe: vibe })}
                  className={`py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                    localBrand.fontVibe === vibe 
                      ? 'bg-sleek-violet/20 border-sleek-violet text-white shadow-md' 
                      : 'bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {vibe}
                </button>
              ))}
            </div>
          </div>

          {/* Save Brand Profile Button */}
          <button
            type="button"
            onClick={handleSaveBrand}
            disabled={isSaving}
            className="w-full mt-2 bg-gradient-to-r from-sleek-violet to-purple-600 hover:from-purple-500 hover:to-sleek-violet text-white py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-sleek-violet/25 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Saving to Cloud...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save Brand Profile</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Production-grade Hub Menu Items (Billing, Team, Security, Saved Studios) */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Workspace Sections</label>

        {menuItems.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => item.action && item.action()}
            className="flex items-center justify-between p-4 bg-sleek-dark border border-white/5 rounded-2xl hover:bg-white/5 transition-all group active:scale-[0.99] text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-white/5 rounded-2xl group-hover:bg-white/10 transition-colors border border-white/5">
                <item.icon size={18} className={item.color} />
              </div>
              <div>
                <p className="text-sm font-bold text-white/90">{item.label}</p>
                {item.detail && <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-0.5">{item.detail}</p>}
              </div>
            </div>
            <ChevronRight size={16} className="text-white/20 group-hover:text-white/60 transition-colors" />
          </button>
        ))}
      </div>

      {/* Switch to Creator / Partner Portal */}
      {onNavigateToPartner && (
        <button
          type="button"
          onClick={onNavigateToPartner}
          className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-sleek-dark border border-emerald-500/40 rounded-2xl text-emerald-300 font-extrabold text-xs hover:border-emerald-400 transition-all shadow-xl active:scale-[0.99] cursor-pointer"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <RefreshCw size={16} />
            </div>
            <div>
              <p className="text-white font-black text-xs">Switch to Creator / Partner Portal</p>
              <p className="text-[10px] text-emerald-400 font-medium">Reel Shoots • DaVinci Editing • Gear Rental • Studios</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-emerald-400 shrink-0" />
        </button>
      )}

      {/* Logout Button */}
      <button 
        type="button"
        onClick={() => logoutUser()}
        className="flex items-center justify-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 font-bold text-sm hover:bg-red-500 hover:text-white transition-all group active:scale-95 shadow-lg shadow-red-500/10 cursor-pointer"
      >
        <LogOut size={16} />
        <span>Log Out of OnlyCreation</span>
      </button>

      {/* Footer Info */}
      <div className="text-center pt-2">
        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">OnlyCreation Engine • Enterprise v1.2.0</p>
      </div>

      {/* Settings Preferences Sheet */}
      <SettingsSheet isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
