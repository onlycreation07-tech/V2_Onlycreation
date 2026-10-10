import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Globe, 
  Moon, 
  Volume2, 
  Bell, 
  RotateCcw, 
  Check, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsSheet({ isOpen, onClose }: SettingsSheetProps) {
  const [language, setLanguage] = useState<'English' | 'हिंदी (Hindi)' | 'ಕನ್ನಡ (Kannada)' | 'தமிழ் (Tamil)' | 'తెలుగు (Telugu)'>('English');
  const [theme, setTheme] = useState<'midnight' | 'slate' | 'cyber'>('midnight');
  const [pushDispatches, setPushDispatches] = useState(true);
  const [pushPayouts, setPushPayouts] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [cacheCleared, setCacheCleared] = useState(false);

  if (!isOpen) return null;

  const handleClearCache = () => {
    try {
      localStorage.clear();
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="bg-sleek-dark border-t sm:border border-white/15 rounded-t-[36px] sm:rounded-[36px] p-6 w-full max-w-md shadow-2xl flex flex-col gap-5 text-left max-h-[90vh] overflow-y-auto hide-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-sleek-violet/20 text-sleek-violet rounded-2xl">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">App Preferences</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">OnlyCreation Engine Config</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white rounded-xl hover:bg-white/5 transition-all"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Language Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
            <Globe size={13} className="text-sleek-violet" />
            <span>Regional Language</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['English', 'हिंदी (Hindi)', 'ಕನ್ನಡ (Kannada)', 'தமிழ் (Tamil)', 'తెలుగు (Telugu)'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition-all ${
                  language === lang
                    ? 'bg-sleek-violet border-sleek-violet text-white shadow-md'
                    : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <span>{lang}</span>
                {language === lang && <Check size={13} />}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Preference */}
        <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
            <Moon size={13} className="text-purple-400" />
            <span>Theme Aesthetics</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'midnight', label: 'OLED Black', desc: '#050505' },
              { id: 'slate', label: 'Deep Slate', desc: '#0D0F17' },
              { id: 'cyber', label: 'Cyber Violet', desc: '#130B24' }
            ].map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => setTheme(th.id as any)}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                  theme === th.id
                    ? 'bg-sleek-violet/20 border-sleek-violet text-white'
                    : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                <span className="text-xs font-black">{th.label}</span>
                <span className="text-[9px] font-mono opacity-60">{th.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notifications & Sound Toggles */}
        <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
            <Bell size={13} className="text-amber-400" />
            <span>Alerts & Chimes</span>
          </label>

          <div className="flex items-center justify-between bg-white/[0.03] p-3 rounded-2xl border border-white/5">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-white">Live Shoot Dispatches</span>
              <span className="text-[10px] text-white/40">Radar alerts when a nearby order is submitted</span>
            </div>
            <input
              type="checkbox"
              checked={pushDispatches}
              onChange={(e) => setPushDispatches(e.target.checked)}
              className="accent-sleek-violet w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between bg-white/[0.03] p-3 rounded-2xl border border-white/5">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-white">Instant UPI Receipts</span>
              <span className="text-[10px] text-white/40">Push alert whenever a shoot escrow clears</span>
            </div>
            <input
              type="checkbox"
              checked={pushPayouts}
              onChange={(e) => setPushPayouts(e.target.checked)}
              className="accent-sleek-violet w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between bg-white/[0.03] p-3 rounded-2xl border border-white/5">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-white">Synthesizer Sound Effects</span>
              <span className="text-[10px] text-white/40">Synthesized audio cues on incoming orders</span>
            </div>
            <input
              type="checkbox"
              checked={soundEffects}
              onChange={(e) => setSoundEffects(e.target.checked)}
              className="accent-sleek-violet w-4 h-4 cursor-pointer"
            />
          </div>
        </div>
        {/* Legacy Marketplace Toggle */}
        <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles size={13} className="text-sleek-violet" />
            <span>Workspace Features</span>
          </label>

          <div className="flex items-center justify-between bg-white/[0.03] p-3 rounded-2xl border border-white/5">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-white">Physical Marketplace & Dispatch</span>
              <span className="text-[10px] text-white/40">Show studio bookings, creator dispatch, and billboard tools</span>
            </div>
            <input
              type="checkbox"
              defaultChecked={localStorage.getItem('creation_ai_legacy_marketplace') === 'true'}
              onChange={(e) => {
                localStorage.setItem('creation_ai_legacy_marketplace', String(e.target.checked));
                window.dispatchEvent(new Event('storage'));
              }}
              className="accent-sleek-violet w-4 h-4 cursor-pointer"
            />
          </div>
        </div>

        {/* Maintenance / Cache */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-white">Cache & Session Storage</span>
            <span className="text-[10px] text-white/40">Flush local drafts & telemetry logs</span>
          </div>

          <button
            type="button"
            onClick={handleClearCache}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-[10px] font-bold text-white/70 hover:text-white flex items-center gap-1.5 transition-all"
          >
            <RotateCcw size={12} className={cacheCleared ? 'text-emerald-400' : ''} />
            <span>{cacheCleared ? 'Cleared!' : 'Flush Cache'}</span>
          </button>
        </div>

        {/* Done Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-sleek-violet hover:bg-purple-600 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-sleek-violet/25 active:scale-[0.99] transition-all"
        >
          Save & Close
        </button>
      </motion.div>
    </div>
  );
}
