import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Loader2, Send } from 'lucide-react';
import { WorkspaceMessage, MessageAttachment } from '../../types/teamHub';
import { teamHubChatService } from '../../services/teamHubChatService';
import MessageItem from './MessageItem';
import MessageComposer from './MessageComposer';

interface ThreadPanelProps {
  workspaceId: string;
  channelId: string;
  parentMessage: WorkspaceMessage | null;
  currentUserId: string;
  onClose: () => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onConvertTask: (message: WorkspaceMessage) => void;
}

export default function ThreadPanel({
  workspaceId,
  channelId,
  parentMessage,
  currentUserId,
  onClose,
  onToggleReaction,
  onConvertTask
}: ThreadPanelProps) {
  const [replies, setReplies] = useState<WorkspaceMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const repliesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!parentMessage) return;

    let mounted = true;
    setLoading(true);

    teamHubChatService.getThreadReplies(workspaceId, channelId, parentMessage.id)
      .then((data) => {
        if (mounted) {
          setReplies(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load thread replies:', err);
        if (mounted) setLoading(false);
      });

    // Subscribe to new replies coming in via WebSocket
    const unsubscribe = teamHubChatService.subscribe((event) => {
      if (event.type === 'message:new' && event.payload?.parentMessageId === parentMessage.id) {
        setReplies(prev => {
          if (prev.some(r => r.id === event.payload.id)) return prev;
          return [...prev, event.payload];
        });
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [workspaceId, channelId, parentMessage?.id]);

  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies]);

  if (!parentMessage) return null;

  const handleSendReply = async (content: string, attachments: MessageAttachment[]) => {
    const newReply = await teamHubChatService.sendMessage(workspaceId, channelId, {
      content,
      attachments,
      parentMessageId: parentMessage.id
    });
    setReplies(prev => [...prev, newReply]);
  };

  return (
    <aside aria-label="Message Thread Panel" className="w-80 md:w-96 bg-[#0B0F19] border-l border-white/10 flex flex-col h-full shrink-0 z-10 shadow-2xl">
      {/* Thread Header */}
      <div className="h-14 border-b border-white/10 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-sleek-violet" />
          <h3 className="font-bold text-sm text-white">Thread</h3>
          <span className="text-xs text-white/40">#{parentMessage.senderName}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close thread panel"
          className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Thread Scroll Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {/* Parent Message Card */}
        <div className="bg-white/[0.02]">
          <MessageItem
            message={parentMessage}
            currentUserId={currentUserId}
            onToggleReaction={onToggleReaction}
            onOpenThread={() => {}}
            onTogglePin={() => {}}
            onConvertTask={onConvertTask}
          />
        </div>

        {/* Reply Count Separator */}
        <div className="px-4 py-2 bg-black/20 flex items-center gap-2">
          <div className="h-[1px] flex-1 bg-white/10" />
          <span className="text-[11px] font-mono text-white/40">
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </span>
          <div className="h-[1px] flex-1 bg-white/10" />
        </div>

        {/* Replies Stream */}
        <div className="py-2">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-white/40">
              <Loader2 size={20} className="animate-spin text-sleek-violet" />
            </div>
          ) : replies.length === 0 ? (
            <div className="text-center py-8 text-xs text-white/40">
              No replies yet. Start the conversation!
            </div>
          ) : (
            replies.map((reply) => (
              <MessageItem
                key={reply.id}
                message={reply}
                currentUserId={currentUserId}
                onToggleReaction={onToggleReaction}
                onOpenThread={() => {}}
                onTogglePin={() => {}}
                onConvertTask={onConvertTask}
              />
            ))
          )}
          <div ref={repliesEndRef} />
        </div>
      </div>

      {/* Reply Composer */}
      <div className="border-t border-white/10">
        <MessageComposer
          channelName="thread"
          onSendMessage={handleSendReply}
          placeholder="Reply in thread..."
        />
      </div>
    </aside>
  );
}
