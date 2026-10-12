import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Smile, 
  X, 
  Image as ImageIcon, 
  Film, 
  FileText,
  Loader2,
  Sparkles,
  Bot
} from 'lucide-react';
import { MessageAttachment } from '../../types/teamHub';
import { teamHubChatService } from '../../services/teamHubChatService';

interface MessageComposerProps {
  channelName: string;
  onSendMessage: (content: string, attachments: MessageAttachment[]) => Promise<void>;
  placeholder?: string;
  workspaceId?: string;
  channelId?: string;
}

const EMOJIS = ['👍', '❤️', '🔥', '🚀', '🎬', '💡', '✅', '👏', '🙌', '💯', '🎯', '✨'];

export default function MessageComposer({
  channelName,
  onSendMessage,
  placeholder,
  workspaceId,
  channelId
}: MessageComposerProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAiDraftMenu, setShowAiDraftMenu] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftDisclosure, setDraftDisclosure] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [content]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Emit typing indicator to WebSocket
    teamHubChatService.sendTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      teamHubChatService.sendTyping(false);
    }, 2500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if ((!content.trim() && attachments.length === 0) || isSending || isUploading) return;

    try {
      setIsSending(true);
      teamHubChatService.sendTyping(false);
      await onSendMessage(content.trim(), attachments);
      setContent('');
      setAttachments([]);
      setShowEmojiPicker(false);
      setShowAiDraftMenu(false);
      setDraftDisclosure(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploaded = await teamHubChatService.uploadAttachment(file);
        setAttachments(prev => [...prev, uploaded]);
      }
    } catch (err: any) {
      alert(err.message || 'Attachment upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleInsertEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleDraftWithAi = async (actionType: 'reply' | 'agenda') => {
    if (!workspaceId || !channelId) return;
    try {
      setIsDrafting(true);
      setShowAiDraftMenu(false);
      const res = await teamHubChatService.draftReply(
        workspaceId, 
        channelId, 
        actionType, 
        content.trim()
      );
      setContent(res.draft);
      setDraftDisclosure(res.disclosure || 'AI assistant draft');
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } catch (err: any) {
      alert(err.message || 'AI drafting failed. Check if AI is enabled for this workspace.');
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <div className="p-3 bg-[#090D16] border-t border-white/10">
      {/* Draft Disclosure Pill */}
      {draftDisclosure && (
        <div className="mb-2 flex items-center justify-between px-3 py-1 bg-sleek-violet/15 border border-sleek-violet/30 rounded-xl text-[11px] text-sleek-violet animate-fade-in">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles size={12} />
            <span>{draftDisclosure}</span>
          </div>
          <button
            type="button"
            onClick={() => setDraftDisclosure(null)}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Attachments Preview Bar */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 border border-white/15 rounded-lg text-xs text-white"
            >
              <Paperclip size={12} className="text-sleek-violet" />
              <span className="truncate max-w-[150px]">{att.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(att.id)}
                className="p-0.5 hover:text-rose-400 transition-colors ml-1"
                aria-label="Remove attachment"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Composer Box */}
      <div className="relative rounded-2xl bg-[#0F172A] border border-white/10 focus-within:border-sleek-violet/60 transition-all shadow-inner">
        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={placeholder || `Message #${channelName}... (Enter to send, Shift+Enter for new line)`}
          className="w-full bg-transparent text-xs text-white placeholder-white/40 px-3.5 pt-3 pb-2 focus:outline-none resize-none min-h-[44px] max-h-[160px] leading-relaxed"
        />

        {/* Action Toolbar */}
        <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-white/5">
          <div className="flex items-center gap-1 text-white/60">
            {/* Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              aria-label="Attach file"
              className="p-1.5 hover:bg-white/10 rounded-lg hover:text-white transition-colors"
              title="Attach files, media, or documents"
            >
              {isUploading ? <Loader2 size={16} className="animate-spin text-sleek-violet" /> : <Paperclip size={16} />}
            </button>

            {/* Emoji Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                aria-label="Choose emoji"
                className="p-1.5 hover:bg-white/10 rounded-lg hover:text-white transition-colors"
                title="Insert emoji"
              >
                <Smile size={16} />
              </button>

              {showEmojiPicker && (
                <div className="absolute left-0 bottom-8 bg-[#1E293B] border border-white/15 rounded-xl p-2 shadow-2xl flex flex-wrap gap-1 w-52 z-30">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => handleInsertEmoji(e)}
                      className="p-1.5 hover:bg-white/15 rounded-md text-base transition-transform hover:scale-125"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* AI Draft Helper Trigger */}
            {workspaceId && channelId && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAiDraftMenu(!showAiDraftMenu)}
                  disabled={isDrafting}
                  aria-label="Draft with AI"
                  className="p-1.5 hover:bg-sleek-violet/20 hover:text-white rounded-lg text-sleek-violet transition-colors flex items-center gap-1"
                  title="Draft reply or meeting agenda aligned with your tone profile"
                >
                  {isDrafting ? (
                    <Loader2 size={16} className="animate-spin text-sleek-violet" />
                  ) : (
                    <Sparkles size={16} />
                  )}
                </button>

                {showAiDraftMenu && (
                  <div className="absolute left-0 bottom-8 bg-[#1E293B] border border-white/15 rounded-xl p-1.5 shadow-2xl w-48 z-30 space-y-1 text-xs">
                    <button
                      type="button"
                      onClick={() => handleDraftWithAi('reply')}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-white flex items-center gap-2"
                    >
                      <Sparkles size={13} className="text-sleek-violet" />
                      <span>Draft Contextual Reply</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDraftWithAi('agenda')}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-white flex items-center gap-2"
                    >
                      <FileText size={13} className="text-purple-400" />
                      <span>Draft Meeting Agenda</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={(!content.trim() && attachments.length === 0) || isSending || isUploading}
            aria-label="Send message"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sleek-violet hover:bg-sleek-violet/80 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold rounded-xl transition-all shadow-md active:scale-95"
          >
            {isSending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                <span>Send</span>
                <Send size={12} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
