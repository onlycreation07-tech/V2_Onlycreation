import React, { useState } from 'react';
import { 
  Smile, 
  MessageSquare, 
  Pin, 
  CheckSquare, 
  Paperclip, 
  Download, 
  Play, 
  FileText, 
  MoreHorizontal,
  Bot
} from 'lucide-react';
import { WorkspaceMessage, MessageAttachment } from '../../types/teamHub';

interface MessageItemProps {
  key?: React.Key;
  message: WorkspaceMessage;
  currentUserId: string;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onOpenThread: (message: WorkspaceMessage) => void;
  onTogglePin: (messageId: string) => void;
  onConvertTask: (message: WorkspaceMessage) => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '🔥', '🚀', '🎬', '💡', '👀'];

export default function MessageItem({
  message,
  currentUserId,
  onToggleReaction,
  onOpenThread,
  onTogglePin,
  onConvertTask
}: MessageItemProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'owner':
        return 'text-amber-400';
      case 'admin':
        return 'text-purple-400';
      case 'manager':
        return 'text-blue-400';
      case 'employee':
        return 'text-emerald-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className={`group relative flex gap-3 px-4 py-2 hover:bg-white/[0.03] transition-colors ${
      message.isPinned ? 'bg-amber-500/[0.04] border-l-2 border-amber-500' : ''
    }`}>
      {/* Sender Avatar */}
      <div className="shrink-0 pt-0.5">
        <div className="w-9 h-9 rounded-xl bg-white/10 overflow-hidden border border-white/10">
          {message.senderAvatar ? (
            <img src={message.senderAvatar} alt={message.senderName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-xs text-white">
              {message.senderName?.slice(0, 2).toUpperCase() || 'U'}
            </div>
          )}
        </div>
      </div>

      {/* Message Body */}
      <div className="flex-1 min-w-0">
        {/* Header Metadata (Zero-Pill Discipline: Unboxed Text with Separators) */}
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-xs text-white">{message.senderName}</span>
          
          <span className={`text-[10px] uppercase font-bold tracking-wider ${getRoleBadgeStyle(message.senderRole)}`}>
            {message.senderRole}
          </span>

          {message.senderTitle && (
            <>
              <span className="text-white/30 text-xs" aria-hidden="true">·</span>
              <span className="text-[11px] text-white/50 truncate max-w-[180px]">{message.senderTitle}</span>
            </>
          )}

          <span className="text-white/30 text-xs" aria-hidden="true">·</span>
          <span className="text-[11px] font-mono text-white/40">{formattedTime}</span>

          {message.isPinned && (
            <span className="text-[10px] text-amber-400 flex items-center gap-1 font-mono">
              <Pin size={10} className="fill-amber-400" /> Pinned
            </span>
          )}
        </div>

        {/* Content Text */}
        <div className="text-xs text-white/90 leading-relaxed break-words whitespace-pre-wrap">
          {message.content}
        </div>

        {/* Attachments Section */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((att) => {
              const isImage = att.mimeType.startsWith('image/');
              const isVideo = att.mimeType.startsWith('video/');

              if (isImage) {
                return (
                  <div key={att.id} className="relative rounded-xl overflow-hidden border border-white/10 max-w-sm max-h-60 bg-black/40">
                    <img src={att.url} alt={att.name} className="w-full h-auto object-cover max-h-56" />
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 backdrop-blur-md rounded text-[10px] text-white/80">
                      {att.name}
                    </div>
                  </div>
                );
              }

              if (isVideo) {
                return (
                  <div key={att.id} className="relative rounded-xl overflow-hidden border border-white/10 max-w-sm bg-black/50 p-2">
                    {playingVideoId === att.id ? (
                      <video src={att.url} controls className="w-full rounded-lg max-h-52" autoPlay />
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setPlayingVideoId(att.id)}
                          className="w-10 h-10 rounded-lg bg-sleek-violet text-white flex items-center justify-center shrink-0 hover:bg-sleek-violet/80 transition-colors"
                        >
                          <Play size={16} className="fill-white ml-0.5" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-white truncate">{att.name}</p>
                          <p className="text-[10px] text-white/50 font-mono">
                            {(att.sizeBytes / (1024 * 1024)).toFixed(1)} MB · Video
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // Document or other file
              return (
                <a
                  key={att.id}
                  href={att.url}
                  download={att.name}
                  className="flex items-center gap-2.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors max-w-xs"
                >
                  <FileText size={18} className="text-sleek-violet shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white truncate">{att.name}</p>
                    <p className="text-[10px] text-white/40 font-mono">
                      {(att.sizeBytes / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <Download size={14} className="text-white/40 hover:text-white" />
                </a>
              );
            })}
          </div>
        )}

        {/* Reactions List */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {Object.entries(message.reactions).map(([emoji, userIds]) => {
              const hasReacted = userIds.includes(currentUserId);
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onToggleReaction(message.id, emoji)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs transition-colors ${
                    hasReacted
                      ? 'bg-sleek-violet/20 border-sleek-violet/50 text-white'
                      : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="font-mono text-[11px] font-bold">{userIds.length}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Thread Replies Button */}
        {message.replyCount > 0 && (
          <button
            type="button"
            onClick={() => onOpenThread(message)}
            className="mt-2 flex items-center gap-1.5 text-xs text-sleek-violet hover:text-fuchsia-400 font-semibold transition-colors group/thread"
          >
            <MessageSquare size={13} />
            <span>{message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}</span>
            <span className="text-white/40 text-[10px] font-mono group-hover/thread:translate-x-0.5 transition-transform">
              View thread →
            </span>
          </button>
        )}
      </div>

      {/* Hover Floating Action Bar */}
      <div className="absolute right-4 top-2 hidden group-hover:flex items-center gap-0.5 bg-[#1E293B] border border-white/15 rounded-lg px-1 py-0.5 shadow-xl z-10">
        {/* Quick Reaction Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors"
            title="Add reaction"
          >
            <Smile size={14} />
          </button>

          {showEmojiPicker && (
            <div className="absolute right-0 bottom-7 bg-[#0F172A] border border-white/15 rounded-xl p-1.5 shadow-2xl flex items-center gap-1 z-30">
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onToggleReaction(message.id, emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="p-1 hover:bg-white/15 rounded-md text-sm transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reply in Thread */}
        <button
          type="button"
          onClick={() => onOpenThread(message)}
          className="p-1 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors"
          title="Reply in thread"
        >
          <MessageSquare size={14} />
        </button>

        {/* Pin Message */}
        <button
          type="button"
          onClick={() => onTogglePin(message.id)}
          className={`p-1 hover:bg-white/10 rounded transition-colors ${
            message.isPinned ? 'text-amber-400' : 'text-white/70 hover:text-white'
          }`}
          title={message.isPinned ? 'Unpin message' : 'Pin message'}
        >
          <Pin size={14} />
        </button>

        {/* Convert to Task */}
        <button
          type="button"
          onClick={() => onConvertTask(message)}
          className="p-1 hover:bg-white/10 rounded text-white/70 hover:text-emerald-400 transition-colors"
          title="Create task from message"
        >
          <CheckSquare size={14} />
        </button>
      </div>
    </div>
  );
}
