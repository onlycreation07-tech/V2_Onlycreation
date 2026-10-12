import { Sparkles, Menu, Plus, User, Bot, Film, MessageSquare } from 'lucide-react';
import { View, BrandProfile } from '../../types';

interface TopNavbarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onToggleDrawer: () => void;
  onNewChat: () => void;
  brandProfile: BrandProfile;
}

export default function TopNavbar({
  currentView,
  onViewChange,
  onToggleDrawer,
  onNewChat,
  brandProfile
}: TopNavbarProps) {
  const isPrimary = (v: View) => currentView === v;

  return (
    <header className="sticky top-0 z-40 bg-sleek-black/95 backdrop-blur-md border-b border-white/10 px-4 md:px-8 py-3 flex items-center justify-between gap-4">
      {/* Zone 1: Wordmark & Drawer Toggle */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleDrawer}
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          title="Open Menu & History"
        >
          <Menu size={20} />
        </button>

        <button
          onClick={() => onViewChange('chat')}
          className="flex items-center gap-2 text-left group"
        >
          <span className="text-base md:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-1.5">
            Creation AI
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-sleek-violet/20 border border-sleek-violet/30 text-sleek-violet font-mono uppercase">
              V2
            </span>
          </span>
        </button>
      </div>

      {/* Zone 2: Primary 3-Section Nav Links */}
      <nav className="hidden sm:flex items-center gap-1 bg-sleek-zinc px-1.5 py-1 rounded-xl border border-white/5 shrink-0">
        <button
          onClick={() => onViewChange('chat')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
            isPrimary('chat')
              ? 'bg-sleek-violet text-white shadow-xs'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Creation AI
        </button>

        <button
          onClick={() => onViewChange('studio')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
            isPrimary('studio') || currentView === 'create'
              ? 'bg-sleek-violet text-white shadow-xs'
              : 'text-white/60 hover:text-white'
          }`}
        >
          AI Studio
        </button>

        <button
          onClick={() => onViewChange('team-hub')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
            isPrimary('team-hub')
              ? 'bg-sleek-violet text-white shadow-xs'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <span>Company Chat</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400" title="Real-time Workspace Active" />
        </button>

        <button
          onClick={() => onViewChange('agents')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
            isPrimary('agents')
              ? 'bg-sleek-violet text-white shadow-xs'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <span>AI Team Hub</span>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="CEO Approvals & Management Active" />
        </button>
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onViewChange('team-hub')}
          className="p-1.5 md:px-2.5 md:py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors flex items-center gap-1.5 border border-white/5 relative"
          title="Company Chat & Channels"
          aria-label="Open Company Chat"
        >
          <MessageSquare size={14} className="text-sleek-violet" />
          <span className="text-xs font-medium hidden lg:inline">Chat</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </button>

        <button
          onClick={onNewChat}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0"
        >
          <Plus size={14} />
          <span>New Chat</span>
        </button>

        <button
          onClick={() => onViewChange('profile')}
          className="flex items-center gap-2 p-1 md:px-2.5 md:py-1.5 rounded-lg hover:bg-white/5 transition-colors border border-white/5"
          title="Profile & Settings"
        >
          <div className="w-6 h-6 rounded-md bg-sleek-violet/20 border border-sleek-violet/40 flex items-center justify-center text-[10px] font-bold text-sleek-violet uppercase shrink-0">
            {(brandProfile.name || 'B').slice(0, 1)}
          </div>
          <span className="text-xs text-white/80 font-medium hidden md:inline truncate max-w-[100px]">
            {brandProfile.name}
          </span>
        </button>
      </div>
    </header>
  );
}
