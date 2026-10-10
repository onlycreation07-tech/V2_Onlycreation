import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  FolderOpen, 
  Calendar, 
  Image as ImageIcon, 
  Settings, 
  User, 
  ShieldCheck, 
  X, 
  Sliders, 
  MapPin, 
  Zap, 
  Tv, 
  Briefcase,
  ChevronRight,
  Sparkles,
  Search,
  Bell,
  Trash2
} from 'lucide-react';
import { View, BrandProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface AppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: View;
  onViewChange: (view: View) => void;
  onNewChat: () => void;
  brandProfile: BrandProfile;
  showLegacyMarketplace: boolean;
  onToggleLegacyMarketplace: (enabled: boolean) => void;
}

export default function AppDrawer({
  isOpen,
  onClose,
  currentView,
  onViewChange,
  onNewChat,
  brandProfile,
  showLegacyMarketplace,
  onToggleLegacyMarketplace
}: AppDrawerProps) {
  const { user, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Example recent conversation threads
  const [recentChats, setRecentChats] = useState([
    { id: '1', title: '20s Perfume Reel Campaign', time: 'Today' },
    { id: '2', title: 'Streetwear 9:16 Video Ad', time: 'Yesterday' },
    { id: '3', title: 'Coffee Brand Hook Breakdown', time: '3 days ago' },
  ]);

  if (!isOpen) return null;

  const handleSelectNav = (view: View) => {
    onViewChange(view);
    onClose();
  };

  const filteredChats = recentChats.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
      />

      {/* Drawer Panel */}
      <div className="relative w-80 max-w-[85vw] bg-sleek-zinc border-r border-white/10 h-full flex flex-col z-10 shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-sleek-violet/20 text-sleek-violet font-bold text-xs">
              AI
            </span>
            <span className="font-bold text-sm text-white">Creation AI Hub</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action: New Chat */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onViewChange('chat');
              onClose();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-sleek-violet hover:bg-sleek-violet/90 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={15} />
            <span>New Creation Chat</span>
          </button>
        </div>

        {/* Search Chats */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-2.5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-black/40 border border-white/5 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 hide-scrollbar">
          {/* Main Workspaces */}
          <div className="space-y-1">
            <span className="px-2 text-[10px] font-semibold text-white/40 uppercase tracking-wider block mb-1">
              Workspaces
            </span>

            <button
              onClick={() => handleSelectNav('chat')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                currentView === 'chat' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Sparkles size={15} className="text-sleek-violet" />
              <span>Creation AI Chat</span>
            </button>

            <button
              onClick={() => handleSelectNav('studio')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                currentView === 'studio' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <ImageIcon size={15} className="text-pink-400" />
              <span>AI Studio Suite</span>
            </button>

            <button
              onClick={() => handleSelectNav('agents')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                currentView === 'agents' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Zap size={15} className="text-emerald-400" />
              <span>AI Team Hub</span>
            </button>

            <button
              onClick={() => handleSelectNav('projects')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                currentView === 'projects' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <FolderOpen size={15} className="text-blue-400" />
              <span>My Projects</span>
            </button>

            <button
              onClick={() => handleSelectNav('calendar')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                currentView === 'calendar' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Calendar size={15} className="text-amber-400" />
              <span>Content Calendar</span>
            </button>

            <button
              onClick={() => handleSelectNav('library')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                currentView === 'library' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <ImageIcon size={15} className="text-purple-400" />
              <span>Creative Asset Library</span>
            </button>
          </div>

          {/* Recent Conversations */}
          <div className="space-y-1">
            <span className="px-2 text-[10px] font-semibold text-white/40 uppercase tracking-wider block mb-1">
              Recent Chats
            </span>

            {filteredChats.map(chat => (
              <button
                key={chat.id}
                onClick={() => handleSelectNav('chat')}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-white/70 hover:bg-white/5 hover:text-white transition-colors text-left group"
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare size={13} className="text-white/40 shrink-0" />
                  <span className="truncate">{chat.title}</span>
                </div>
                <span className="text-[10px] text-white/30 shrink-0">{chat.time}</span>
              </button>
            ))}
          </div>

          {/* Legacy Marketplace Section (Feature Flagged) */}
          <div className="pt-2 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                Legacy Marketplace
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showLegacyMarketplace}
                  onChange={(e) => onToggleLegacyMarketplace(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-7 h-4 bg-white/20 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-sleek-violet"></div>
              </label>
            </div>

            {showLegacyMarketplace ? (
              <div className="space-y-1 pl-1">
                <button
                  onClick={() => handleSelectNav('studios')}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    currentView === 'studios' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <MapPin size={13} />
                  <span>Studios Marketplace</span>
                </button>

                <button
                  onClick={() => handleSelectNav('dispatch')}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    currentView === 'dispatch' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Zap size={13} />
                  <span>Creator Dispatch</span>
                </button>

                <button
                  onClick={() => handleSelectNav('billboards')}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    currentView === 'billboards' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Tv size={13} />
                  <span>Billboard Requests</span>
                </button>

                <button
                  onClick={() => handleSelectNav('partner')}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    currentView === 'partner' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Briefcase size={13} />
                  <span>Partner Portal</span>
                </button>
              </div>
            ) : (
              <p className="px-2 text-[10px] text-white/30 italic">
                Toggle to access physical studio bookings & creator dispatch.
              </p>
            )}
          </div>
        </div>

        {/* Footer / Profile */}
        <div className="p-3 border-t border-white/5 space-y-1">
          {isAdmin && (
            <button
              onClick={() => handleSelectNav('admin')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                currentView === 'admin' ? 'bg-sleek-violet text-white' : 'text-sleek-violet hover:bg-white/5'
              }`}
            >
              <ShieldCheck size={15} />
              <span>Admin Operations</span>
            </button>
          )}

          <button
            onClick={() => handleSelectNav('profile')}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-white/80 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              <div className="w-6 h-6 rounded-md bg-sleek-violet/20 flex items-center justify-center text-[10px] font-bold text-sleek-violet uppercase shrink-0">
                {(brandProfile.name || 'U').slice(0, 1)}
              </div>
              <div className="truncate text-left">
                <span className="block truncate font-medium">{brandProfile.name}</span>
                <span className="block text-[10px] text-white/40">{user?.email || 'Authenticated User'}</span>
              </div>
            </div>
            <Settings size={14} className="text-white/40 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
