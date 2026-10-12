import React, { useState, useEffect, useRef } from 'react';
import { 
  Hash, 
  Lock, 
  Briefcase, 
  Pin, 
  Search, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  X,
  Loader2,
  Sparkles,
  Sliders,
  Clock,
  TrendingUp,
  Bot
} from 'lucide-react';
import { Channel, WorkspaceMessage, WorkspaceMember, MessageAttachment } from '../../types/teamHub';
import MessageItem from './MessageItem';
import MessageComposer from './MessageComposer';
import AIChannelBar from './AIChannelBar';

interface ConversationViewProps {
  channel: Channel | null;
  messages: WorkspaceMessage[];
  members: WorkspaceMember[];
  currentUserId: string;
  typingUsers: string[];
  isLoading: boolean;
  onSendMessage: (content: string, attachments: MessageAttachment[]) => Promise<void>;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onOpenThread: (message: WorkspaceMessage) => void;
  onTogglePin: (messageId: string) => void;
  onConvertTask: (message: WorkspaceMessage) => void;
  onOpenPreferences?: () => void;
  onToggleChannelAi?: (enabled: boolean) => void;
  onOpenRemindersModal?: () => void;
  onOpenAiControlsModal?: () => void;
  onOpenAttendance?: () => void;
  onOpenWorkProgress?: () => void;
  onOpenDelegations?: () => void;
}

export default function ConversationView({
  channel,
  messages,
  members,
  currentUserId,
  typingUsers,
  isLoading,
  onSendMessage,
  onToggleReaction,
  onOpenThread,
  onTogglePin,
  onConvertTask,
  onOpenPreferences,
  onToggleChannelAi,
  onOpenRemindersModal,
  onOpenAiControlsModal,
  onOpenAttendance,
  onOpenWorkProgress,
  onOpenDelegations
}: ConversationViewProps) {
  const [showPinned, setShowPinned] = useState(false);
  const [messageSearch, setMessageSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#090D16] text-white/40 text-xs">
        Select a channel or direct message to begin.
      </div>
    );
  }

  // Pinned messages list
  const pinnedMessages = messages.filter(m => m.isPinned);

  // Filter messages by search if search open
  const displayMessages = messageSearch.trim()
    ? messages.filter(m => m.content.toLowerCase().includes(messageSearch.toLowerCase()))
    : messages;

  const getChannelIcon = (type: Channel['type']) => {
    switch (type) {
      case 'private':
        return <Lock size={16} className="text-amber-400" />;
      case 'department':
        return <Briefcase size={16} className="text-purple-400" />;
      default:
        return <Hash size={16} className="text-sleek-violet" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090D16] min-w-0 overflow-hidden">
      {/* Channel Header */}
      <header className="h-14 border-b border-white/10 px-4 flex items-center justify-between shrink-0 bg-[#090D16]/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-white/5">
            {getChannelIcon(channel.type)}
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm text-white truncate flex items-center gap-2">
              <span>{channel.name}</span>
            </h1>
            {channel.topic && (
              <p className="text-[11px] text-white/50 truncate max-w-md hidden sm:block">
                {channel.topic}
              </p>
            )}
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Pinned Messages Trigger */}
          {pinnedMessages.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPinned(!showPinned)}
              aria-label="Toggle pinned messages"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                showPinned
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Pin size={12} className="fill-current" />
              <span className="font-mono text-[11px] font-bold">{pinnedMessages.length}</span>
              <span className="hidden md:inline">Pinned</span>
            </button>
          )}

          {/* Search Trigger */}
          <button
            type="button"
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (isSearchOpen) setMessageSearch('');
            }}
            aria-label="Search channel"
            className={`p-1.5 rounded-lg border transition-colors ${
              isSearchOpen
                ? 'bg-sleek-violet text-white border-sleek-violet'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Search size={15} />
          </button>

          {/* Crew Attendance & Shift Schedule */}
          {onOpenAttendance && (
            <button
              type="button"
              onClick={onOpenAttendance}
              aria-label="Crew Attendance & Shifts"
              className="p-1.5 rounded-lg border bg-white/5 border-white/10 text-white/70 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40 transition-colors"
              title="Crew Attendance & Shift Schedule"
            >
              <Clock size={15} />
            </button>
          )}

          {/* Work Progress & Velocity */}
          {onOpenWorkProgress && (
            <button
              type="button"
              onClick={onOpenWorkProgress}
              aria-label="Work Progress & Velocity"
              className="p-1.5 rounded-lg border bg-white/5 border-white/10 text-white/70 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors"
              title="Work Progress & Velocity Dashboards"
            >
              <TrendingUp size={15} />
            </button>
          )}

          {/* Delegated AI Assistant & Approvals */}
          {onOpenDelegations && (
            <button
              type="button"
              onClick={onOpenDelegations}
              aria-label="Delegated AI Assistant"
              className="p-1.5 rounded-lg border bg-white/5 border-white/10 text-white/70 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40 transition-colors"
              title="Delegated AI Assistant & Approvals"
            >
              <Bot size={15} />
            </button>
          )}

          {/* Manager & CXO Preferences Trigger */}
          {onOpenPreferences && (
            <button
              type="button"
              onClick={onOpenPreferences}
              aria-label="Manager & CXO Preferences"
              className="p-1.5 rounded-lg border bg-white/5 border-white/10 text-white/70 hover:bg-sleek-violet/20 hover:text-white hover:border-sleek-violet/40 transition-colors"
              title="Manager & CXO Preference Profile"
            >
              <Sliders size={15} />
            </button>
          )}
        </div>
      </header>

      {/* AI Assistant Participation Bar & Insights */}
      <AIChannelBar
        workspaceId={channel.workspaceId}
        channel={channel}
        onOpenTaskModalWithItem={(title) => {
          onConvertTask({
            id: `msg-ai-${Date.now()}`,
            workspaceId: channel.workspaceId,
            channelId: channel.id,
            senderId: 'ai-coordinator',
            senderName: 'AI Operations Coordinator',
            senderRole: 'manager',
            content: title,
            replyCount: 0,
            isPinned: false,
            status: 'delivered',
            createdAt: new Date().toISOString()
          });
        }}
        onToggleAi={onToggleChannelAi || (() => {})}
        onOpenRemindersModal={onOpenRemindersModal}
        onOpenAiControlsModal={onOpenAiControlsModal}
        onPostClarifyingQuestion={(question) => {
          onSendMessage(`❓ **Clarifying Question from AI Coordinator**: ${question}`, []);
        }}
      />

      {/* In-Channel Search Bar */}
      {isSearchOpen && (
        <div className="px-4 py-2 bg-[#0F172A] border-b border-white/10 flex items-center gap-2">
          <Search size={14} className="text-white/40" />
          <input
            type="text"
            value={messageSearch}
            onChange={(e) => setMessageSearch(e.target.value)}
            placeholder={`Search in #${channel.name}...`}
            className="flex-1 bg-transparent text-xs text-white placeholder-white/40 focus:outline-none"
            autoFocus
          />
          {messageSearch && (
            <button
              type="button"
              onClick={() => setMessageSearch('')}
              className="text-white/40 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Pinned Messages Drawer */}
      {showPinned && pinnedMessages.length > 0 && (
        <div className="bg-[#1E293B]/90 border-b border-white/10 p-3 max-h-48 overflow-y-auto space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-amber-400">
            <span className="flex items-center gap-1.5">
              <Pin size={12} /> Pinned Messages in #{channel.name}
            </span>
            <button
              type="button"
              onClick={() => setShowPinned(false)}
              className="text-white/40 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
          {pinnedMessages.map(msg => (
            <div key={msg.id} className="p-2 rounded-lg bg-black/30 border border-white/5 text-xs">
              <div className="flex items-center justify-between text-white/50 text-[10px] mb-1">
                <span className="font-semibold text-white/80">{msg.senderName}</span>
                <span className="font-mono">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-white/90 line-clamp-2">{msg.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Message Feed Canvas */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto py-3 space-y-1"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-white/40">
            <Loader2 size={24} className="animate-spin text-sleek-violet" />
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 mx-auto flex items-center justify-center text-white/30 mb-3">
              {getChannelIcon(channel.type)}
            </div>
            <h3 className="font-bold text-sm text-white">
              Welcome to #{channel.name}
            </h3>
            <p className="text-xs text-white/50 max-w-sm mx-auto mt-1">
              {channel.description || 'This is the start of this channel. Drop a message to say hello!'}
            </p>
          </div>
        ) : (
          displayMessages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              currentUserId={currentUserId}
              onToggleReaction={onToggleReaction}
              onOpenThread={onOpenThread}
              onTogglePin={onTogglePin}
              onConvertTask={onConvertTask}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator Bar */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-1 text-[11px] text-white/40 italic flex items-center gap-1.5 bg-[#090D16]">
          <span className="w-1.5 h-1.5 rounded-full bg-sleek-violet animate-pulse" />
          <span>
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </span>
        </div>
      )}

      {/* Central Message Composer */}
      <MessageComposer
        channelName={channel.name}
        workspaceId={channel.workspaceId}
        channelId={channel.id}
        onSendMessage={onSendMessage}
      />
    </div>
  );
}
