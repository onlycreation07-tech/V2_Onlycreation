import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  RefreshCw, 
  Globe, 
  ExternalLink, 
  Trash2, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Zap,
  DollarSign,
  Film,
  Users
} from 'lucide-react';
import { AIAgentId, AIAgentInfo, BrandProfile } from '../../types';
import { AI_AGENTS_LIST } from '../../services/agentService';

interface ChatMessage {
  role: 'user' | 'agent';
  text: string;
  timestamp?: string;
  sources?: Array<{ title: string; uri: string }>;
}

interface IsolatedAgentChatProps {
  selectedAgentId: AIAgentId;
  onSelectAgentId: (id: AIAgentId) => void;
  chatHistories: Record<string, ChatMessage[]>;
  onSendMessage: (agentId: AIAgentId, messageText: string, useGoogleGrounding: boolean) => Promise<void>;
  onClearHistory: (agentId: AIAgentId) => void;
  isSending: boolean;
  brandProfile: BrandProfile;
}

export default function IsolatedAgentChat({
  selectedAgentId,
  onSelectAgentId,
  chatHistories,
  onSendMessage,
  onClearHistory,
  isSending,
  brandProfile
}: IsolatedAgentChatProps) {
  const [inputText, setInputText] = useState('');
  const [useGoogleGrounding, setUseGoogleGrounding] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const selectedAgent = AI_AGENTS_LIST.find(a => a.id === selectedAgentId) || AI_AGENTS_LIST[0];
  const currentMessages = chatHistories[selectedAgentId] || [];

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputText).trim();
    if (!textToSend || isSending) return;

    if (!customPrompt) setInputText('');
    await onSendMessage(selectedAgentId, textToSend, useGoogleGrounding);
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-[560px] bg-sleek-zinc rounded-2xl border border-white/10 p-4">
      {/* Bot Selector Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 pb-3 border-b border-white/10">
        {AI_AGENTS_LIST.map((agent) => {
          const isSelected = selectedAgentId === agent.id;
          const msgCount = (chatHistories[agent.id] || []).length;

          return (
            <button
              key={agent.id}
              onClick={() => onSelectAgentId(agent.id)}
              className={`p-2.5 rounded-xl border text-left transition-all relative ${
                isSelected
                  ? 'bg-white/[0.08] border-sleek-violet shadow-sm'
                  : 'bg-black/30 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <span 
                  className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px]"
                  style={{ backgroundColor: `${agent.color}25`, color: agent.color }}
                >
                  {agent.name.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate flex items-center justify-between">
                    <span>{agent.name}</span>
                    {msgCount > 1 && (
                      <span className="text-[9px] font-mono text-white/40">
                        {msgCount}
                      </span>
                    )}
                  </h4>
                  <span className="text-[10px] text-white/40 block truncate">{agent.role.split('&')[0]}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Agent Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5 mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shadow-sm"
            style={{ backgroundColor: `${selectedAgent.color}25`, color: selectedAgent.color }}
          >
            {selectedAgent.name.slice(0, 1)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">{selectedAgent.name}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sleek-violet/20 border border-sleek-violet/30 text-sleek-violet font-mono">
                {selectedAgent.badge}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-emerald-400 font-mono">
                Isolated Thread
              </span>
            </div>
            <p className="text-xs text-white/50">{selectedAgent.tagline}</p>
          </div>
        </div>

        {/* Controls: Google Grounding (for Ketan) & Clear History */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {selectedAgent.isGooglePowered && (
            <label className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 text-xs text-white/80 cursor-pointer">
              <Globe size={13} className={useGoogleGrounding ? 'text-sleek-violet animate-pulse' : 'text-white/40'} />
              <span>Google Search Grounding</span>
              <input
                type="checkbox"
                checked={useGoogleGrounding}
                onChange={(e) => setUseGoogleGrounding(e.target.checked)}
                className="accent-sleek-violet w-3.5 h-3.5 ml-1 cursor-pointer"
              />
            </label>
          )}

          <button
            onClick={() => onClearHistory(selectedAgentId)}
            className="p-1.5 rounded-xl bg-black/40 hover:bg-white/10 border border-white/5 text-white/40 hover:text-white transition-colors"
            title="Reset this agent's chat history"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Quick Suggested Prompts Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 hide-scrollbar">
        {selectedAgent.suggestedPrompts?.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-white/10 border border-white/5 text-[11px] text-white/60 hover:text-white whitespace-nowrap transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 hide-scrollbar min-h-[300px]">
        {currentMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 text-white/40 space-y-2">
            <Bot size={32} className="text-sleek-violet opacity-60" />
            <p className="text-xs">
              This channel is 100% private to {selectedAgent.name}. Ask any question or command.
            </p>
          </div>
        ) : (
          currentMessages.map((msg, idx) => {
            const isUser = msg.role === 'user';

            return (
              <div 
                key={idx}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
              >
                <div className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed whitespace-pre-wrap relative shadow-xs ${
                  isUser
                    ? 'bg-sleek-violet text-white rounded-br-xs'
                    : 'bg-black/50 border border-white/10 text-white/90 rounded-bl-xs'
                }`}>
                  {msg.text}

                  {/* Copy button for agent responses */}
                  {!isUser && (
                    <button
                      onClick={() => handleCopy(msg.text, idx)}
                      className="absolute top-2 right-2 p-1 rounded-md bg-black/40 text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy response"
                    >
                      {copiedIndex === idx ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                  )}

                  {/* Google Grounding Sources (if returned by Ketan) */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-sleek-violet tracking-wider block">
                        Verified Google Search Grounding Citations:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, sIdx) => (
                          <a
                            key={sIdx}
                            href={src.uri}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-cyan-300 hover:text-white transition-colors"
                          >
                            <span>{src.title}</span>
                            <ExternalLink size={9} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-white/30 px-1 mt-1">
                  {msg.timestamp || 'Just now'}
                </span>
              </div>
            );
          })
        )}

        {isSending && (
          <div className="flex items-center gap-2 text-xs text-white/50 p-3 bg-black/30 rounded-xl border border-white/5 w-fit">
            <RefreshCw size={13} className="animate-spin text-sleek-violet" />
            <span>{selectedAgent.name} is querying Google AI and analyzing directives...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/10 mt-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={`Message ${selectedAgent.name} (Direct Channel)...`}
          className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-hidden focus:border-sleek-violet"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim() || isSending}
          className="p-2.5 rounded-xl bg-sleek-violet hover:bg-sleek-violet/90 text-white transition-colors disabled:opacity-40 shadow-xs"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
