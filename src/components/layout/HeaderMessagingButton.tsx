import React, { useState, useEffect } from 'react';
import { MessageSquare, Bell, Sparkles } from 'lucide-react';
import { agentService } from '../../services/agentService';

interface HeaderMessagingButtonProps {
  onClick: () => void;
  className?: string;
}

export default function HeaderMessagingButton({ onClick, className = '' }: HeaderMessagingButtonProps) {
  const [unreadCount, setUnreadCount] = useState(2);

  useEffect(() => {
    agentService.getNotifications().then(res => {
      setUnreadCount(res.unreadCount || 2);
    }).catch(() => setUnreadCount(2));
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative group p-2 bg-gradient-to-r from-sleek-violet/20 to-fuchsia-500/20 hover:from-sleek-violet/30 hover:to-fuchsia-500/30 border border-sleek-violet/40 hover:border-sleek-violet/60 rounded-2xl text-white transition-all active:scale-95 flex items-center gap-1.5 shadow-lg shadow-sleek-violet/10 ${className}`}
      title="Team Chat, Grok AI Marketing Agents & Alerts"
      aria-label="Open Team and AI Messaging Hub"
    >
      <div className="relative flex items-center justify-center">
        {/* Dual glyph badge: Message + Bell indicator */}
        <MessageSquare size={16} className="text-sleek-violet group-hover:text-fuchsia-400 transition-colors" />
        
        {/* Subtle pulsing indicator */}
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
        </span>
      </div>

      <div className="flex items-center gap-1 hidden sm:flex">
        <span className="text-[10px] font-black uppercase tracking-wider text-white/90">
          Grok Hub
        </span>
        <Sparkles size={11} className="text-amber-400" />
      </div>

      {unreadCount > 0 && (
        <span className="ml-0.5 px-1.5 py-0.2 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[9px] font-black rounded-full shadow-sm">
          {unreadCount}
        </span>
      )}
    </button>
  );
}
