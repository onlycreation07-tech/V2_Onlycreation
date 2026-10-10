import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  Users, 
  Bell, 
  CheckCircle2, 
  Copy, 
  Check, 
  TrendingUp, 
  Zap, 
  ArrowRight, 
  RefreshCw, 
  Calendar, 
  Clock, 
  DollarSign, 
  Film, 
  UserCheck, 
  Flame, 
  Share2, 
  ExternalLink,
  User,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AIAgentId, AIAgentInfo, AgentChatMessage, TeamMessageRecord, AppNotification, BrandProfile } from '../../types';
import { agentService, AI_AGENTS_LIST } from '../../services/agentService';

interface CommunicationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandProfile?: BrandProfile;
  initialTab?: 'agents' | 'team' | 'notifications';
  onNavigateToProfile?: () => void;
  onNavigateToDispatch?: () => void;
  onNavigateToCreate?: (prompt?: string) => void;
}

export default function CommunicationCenterModal({
  isOpen,
  onClose,
  brandProfile,
  initialTab = 'agents',
  onNavigateToProfile,
  onNavigateToDispatch,
  onNavigateToCreate
}: CommunicationCenterModalProps) {
  const [activeTab, setActiveTab] = useState<'agents' | 'team' | 'notifications'>(initialTab);
  
  // Agent Chat State
  const [selectedAgentId, setSelectedAgentId] = useState<AIAgentId>('ketan-growth');
  const [messagesByAgent, setMessagesByAgent] = useState<Record<AIAgentId, AgentChatMessage[]>>({
    'ketan-growth': [
      {
        id: 'gm-init',
        agentId: 'ketan-growth',
        sender: 'agent',
        text: `⚡ **Ketan online.** Principal Growth & Google Intelligence Strategist. Powered by Google AI with Live Google Search grounding. What are we scaling today—viral video hooks, Meta ad variations, or a 7-day TikTok sprint?`,
        timestamp: 'Just now',
        metrics: { viralityScore: 98, timeSaved: 'Ready to save 20h/wk' }
      }
    ],
    'grok-marketing': [
      {
        id: 'gm-legacy',
        agentId: 'grok-marketing',
        sender: 'agent',
        text: `⚡ **Ketan online.** Principal Growth & Google Intelligence Strategist. Powered by Google AI with Live Google Search grounding. What are we scaling today?`,
        timestamp: 'Just now'
      }
    ],
    'nova-director': [
      {
        id: 'nd-init',
        agentId: 'nova-director',
        sender: 'agent',
        text: `🎬 **Agent Nova reporting.** Ready to translate your commercial concepts into camera movement directives, 3-point studio lighting, and DaVinci color grading palettes.`,
        timestamp: 'Just now'
      }
    ],
    'echo-outreach': [
      {
        id: 'eo-init',
        agentId: 'echo-outreach',
        sender: 'agent',
        text: `📩 **Agent Echo ready.** I draft creator recruitment DMs and sponsor pitches that secure 80%+ reply rates. Tell me who you want to pitch.`,
        timestamp: 'Just now'
      }
    ],
    'vault-ops': [
      {
        id: 'vo-init',
        agentId: 'vault-ops',
        sender: 'agent',
        text: `💰 **Agent Vault on guard.** I audit production quotes, flag equipment markups, and calculate your target return on ad spend (ROAS). What budget are we reviewing?`,
        timestamp: 'Just now'
      }
    ]
  });

  const [inputMessage, setInputMessage] = useState('');
  const [sendingAgent, setSendingAgent] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Autonomous Campaign Generator State
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignGoal, setCampaignGoal] = useState('Viral Awareness & High-Converting Video Ads');
  const [generatingCampaign, setGeneratingCampaign] = useState(false);
  const [campaignResult, setCampaignResult] = useState<any>(null);

  // Team Messaging State
  const [activeChannel, setActiveChannel] = useState<'general-ops' | 'marketing-crew'>('general-ops');
  const [teamMessages, setTeamMessages] = useState<TeamMessageRecord[]>([]);
  const [teamInput, setTeamInput] = useState('');
  const [sendingTeam, setSendingTeam] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifFilter, setNotifFilter] = useState<'all' | 'ai' | 'ops'>('all');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const teamEndRef = useRef<HTMLDivElement>(null);

  const selectedAgent = AI_AGENTS_LIST.find(a => a.id === selectedAgentId) || AI_AGENTS_LIST[0];

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadTeamMessages(activeChannel);
    }
  }, [isOpen, activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesByAgent, selectedAgentId]);

  useEffect(() => {
    teamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [teamMessages]);

  const loadNotifications = async () => {
    const res = await agentService.getNotifications();
    setNotifications(res.notifications);
    setUnreadCount(res.unreadCount);
  };

  const loadTeamMessages = async (channel: string) => {
    const msgs = await agentService.getTeamMessages(channel);
    setTeamMessages(msgs);
  };

  const handleSendAgentMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || sendingAgent) return;

    const userMsg: AgentChatMessage = {
      id: `usr-${Date.now()}`,
      agentId: selectedAgentId,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessagesByAgent(prev => ({
      ...prev,
      [selectedAgentId]: [...(prev[selectedAgentId] || []), userMsg]
    }));

    if (!textToSend) setInputMessage('');
    setSendingAgent(true);

    try {
      const currentHistory = (messagesByAgent[selectedAgentId] || []).map(m => ({
        role: m.sender as 'user' | 'agent',
        text: m.text
      }));

      const res = await agentService.sendMessage(
        selectedAgentId,
        text,
        currentHistory,
        brandProfile
      );

      const agentReply: AgentChatMessage = {
        id: `agent-${Date.now()}`,
        agentId: selectedAgentId,
        sender: 'agent',
        text: res.reply,
        timestamp: res.timestamp,
        metrics: res.metrics
      };

      setMessagesByAgent(prev => ({
        ...prev,
        [selectedAgentId]: [...(prev[selectedAgentId] || []), agentReply]
      }));
      loadNotifications();
    } catch (e) {
      console.error(e);
    } finally {
      setSendingAgent(false);
    }
  };

  const handleSendTeamMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamInput.trim() || sendingTeam) return;

    const currentText = teamInput.trim();
    setTeamInput('');
    setSendingTeam(true);

    try {
      const sent = await agentService.sendTeamMessage(
        activeChannel,
        currentText,
        brandProfile?.name || 'Studio Owner',
        'Executive Producer'
      );
      setTeamMessages(prev => [...prev, sent]);

      // Refresh after delay to pull simulated response
      setTimeout(async () => {
        const refreshed = await agentService.getTeamMessages(activeChannel);
        setTeamMessages(refreshed);
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSendingTeam(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerateCampaign = async () => {
    setGeneratingCampaign(true);
    try {
      const res = await agentService.generateAutonomousCampaign(campaignGoal, brandProfile);
      if (res.campaign) {
        setCampaignResult(res.campaign);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingCampaign(false);
    }
  };

  const handleMarkAllRead = async () => {
    await agentService.markNotificationRead(undefined, true);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl h-[92vh] max-h-[820px] bg-[#0c0d12] border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl relative"
      >
        {/* Hub Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sleek-violet via-fuchsia-500 to-amber-400 p-[1.5px] shadow-lg shadow-sleek-violet/20">
              <div className="w-full h-full bg-sleek-black rounded-[14px] flex items-center justify-center">
                <Flame size={18} className="text-sleek-violet animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-tight">Command Hub & AI Agents</h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-sleek-violet/20 border border-sleek-violet/40 text-sleek-violet">
                  Grok Mode
                </span>
              </div>
              <p className="text-xs text-white/40">Autonomous marketing agents, crew messaging & live updates</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToProfile && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToProfile();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Open Profile Settings"
              >
                <User size={13} className="text-sleek-violet" />
                <span className="hidden sm:inline">Profile</span>
              </button>
            )}

            <button 
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-white/5 flex items-center justify-between gap-2 shrink-0 bg-white/[0.01]">
          <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab('agents')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'agents' 
                  ? 'bg-sleek-violet text-white shadow-md shadow-sleek-violet/30' 
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Bot size={14} />
              <span>Grok AI Agents</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('team')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'team' 
                  ? 'bg-sleek-violet text-white shadow-md shadow-sleek-violet/30' 
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Users size={14} />
              <span>Team Chat</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-0.5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 relative ${
                activeTab === 'notifications' 
                  ? 'bg-sleek-violet text-white shadow-md shadow-sleek-violet/30' 
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Bell size={14} />
              <span>Alerts</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[9px] font-black rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'agents' && (
            <button
              type="button"
              onClick={() => setShowCampaignModal(true)}
              className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 rounded-xl text-amber-300 text-[11px] font-black uppercase tracking-wider hover:brightness-110 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Zap size={13} className="text-amber-400 fill-amber-400" />
              <span>Auto Campaign</span>
            </button>
          )}

          {activeTab === 'notifications' && unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs text-sleek-violet hover:underline font-semibold"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Tab 1: Grok AI Agents Workspace */}
        {activeTab === 'agents' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Agent Selector Bar */}
            <div className="px-4 py-2.5 border-b border-white/5 bg-black/30 flex items-center gap-2 overflow-x-auto hide-scrollbar shrink-0">
              {AI_AGENTS_LIST.map((agent) => {
                const isSelected = agent.id === selectedAgentId;
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`px-3 py-2 rounded-2xl border transition-all flex items-center gap-2.5 shrink-0 text-left ${
                      isSelected 
                        ? 'bg-white/10 border-sleek-violet text-white shadow-md' 
                        : 'bg-white/[0.02] border-white/5 text-white/50 hover:text-white/80 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="relative">
                      <img 
                        src={agent.avatar} 
                        alt={agent.name} 
                        className="w-7 h-7 rounded-xl object-cover border border-white/10" 
                      />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-white/30'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold leading-none">{agent.name}</span>
                        <span className="text-[9px] font-black px-1 py-0.2 rounded bg-white/10 text-white/70">
                          {agent.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/40 truncate max-w-[120px] mt-0.5">{agent.codename}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Agent Banner */}
            <div className="px-5 py-2 bg-gradient-to-r from-sleek-violet/10 via-transparent to-transparent border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white/70">{selectedAgent.role}:</span>
                <span className="text-xs text-white/50 truncate max-w-[280px] sm:max-w-md">{selectedAgent.tagline}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Autonomous</span>
              </div>
            </div>

            {/* Chat Messages Transcript */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(messagesByAgent[selectedAgentId] || []).map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`flex items-start gap-2.5 max-w-[88%] sm:max-w-[80%] ${isUser ? 'flex-row-reverse' : ''}`}>
                      {!isUser ? (
                        <img 
                          src={selectedAgent.avatar} 
                          alt={selectedAgent.name} 
                          className="w-7 h-7 rounded-xl object-cover border border-white/10 shrink-0 mt-0.5" 
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-xl bg-sleek-violet/30 border border-sleek-violet/40 flex items-center justify-center shrink-0 mt-0.5">
                          <User size={13} className="text-sleek-violet" />
                        </div>
                      )}

                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isUser 
                          ? 'bg-sleek-violet text-white rounded-tr-sm' 
                          : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-sm'
                      }`}>
                        {/* Markdown Formatted Body */}
                        <div className="whitespace-pre-wrap font-sans space-y-1">
                          {msg.text}
                        </div>

                        {/* Agent Metric Chips */}
                        {!isUser && msg.metrics && (
                          <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center gap-2">
                            {msg.metrics.viralityScore && (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                                <TrendingUp size={11} />
                                Virality {msg.metrics.viralityScore}%
                              </span>
                            )}
                            {msg.metrics.timeSaved && (
                              <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-[10px] flex items-center gap-1">
                                <Clock size={11} />
                                {msg.metrics.timeSaved}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleCopyText(msg.id, msg.text)}
                              className="ml-auto text-white/40 hover:text-white flex items-center gap-1 text-[10px] font-semibold transition-colors"
                              title="Copy prompt or copy to clipboard"
                            >
                              {copiedId === msg.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-white/30 px-9 mt-1">{msg.timestamp}</span>
                  </motion.div>
                );
              })}

              {sendingAgent && (
                <div className="flex items-center gap-2.5 text-white/50 text-xs px-2 py-1">
                  <img 
                    src={selectedAgent.avatar} 
                    alt={selectedAgent.name} 
                    className="w-6 h-6 rounded-xl object-cover animate-pulse" 
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sleek-violet animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-sleek-violet animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-sleek-violet animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] text-white/40 ml-1">{selectedAgent.name} is reasoning & drafting assets...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompts Carousel */}
            <div className="px-4 py-2 border-t border-white/5 bg-black/40 flex items-center gap-1.5 overflow-x-auto hide-scrollbar shrink-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/30 shrink-0 mr-1">Fast Prompts:</span>
              {selectedAgent.suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendAgentMessage(prompt)}
                  className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-sleek-violet/20 border border-white/10 hover:border-sleek-violet/40 text-white/70 hover:text-white text-[11px] font-medium whitespace-nowrap transition-all active:scale-95"
                >
                  ⚡ {prompt}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-white/10 bg-black/60 shrink-0">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAgentMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Ask ${selectedAgent.name} to generate hooks, scripts, campaign angles...`}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-sleek-violet transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || sendingAgent}
                  className="px-4 py-3 bg-sleek-violet hover:bg-sleek-violet/90 disabled:opacity-40 text-white rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-sleek-violet/30 active:scale-95"
                >
                  <Send size={14} />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Team Chat (Lead Editor, Ops, DP) */}
        {activeTab === 'team' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Channel Switcher */}
            <div className="px-4 py-2 border-b border-white/5 bg-black/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveChannel('general-ops')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeChannel === 'general-ops' 
                      ? 'bg-white/15 text-white border border-white/10' 
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  #general-ops
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChannel('marketing-crew')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeChannel === 'marketing-crew' 
                      ? 'bg-white/15 text-white border border-white/10' 
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  #marketing-crew
                </button>
              </div>

              <span className="text-[11px] text-white/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                4 Teammates & Agents Active
              </span>
            </div>

            {/* Team Chat Transcript */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {teamMessages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3">
                  <img 
                    src={msg.avatar} 
                    alt={msg.senderName} 
                    className="w-8 h-8 rounded-xl object-cover border border-white/10 shrink-0" 
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white">{msg.senderName}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                        msg.isAiAgent 
                          ? 'bg-sleek-violet/20 border border-sleek-violet/30 text-sleek-violet' 
                          : 'bg-white/10 text-white/60'
                      }`}>
                        {msg.senderRole}
                      </span>
                      <span className="text-[10px] text-white/30 ml-auto">{msg.timestamp}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/5 text-xs text-white/90 leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={teamEndRef} />
            </div>

            {/* Team Input Bar */}
            <div className="p-3 border-t border-white/10 bg-black/60 shrink-0">
              <form onSubmit={handleSendTeamMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={teamInput}
                  onChange={(e) => setTeamInput(e.target.value)}
                  placeholder={`Message #${activeChannel} (Cinematographer, Editor, Ops, Grok)...`}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-sleek-violet transition-colors"
                />
                <button
                  type="submit"
                  disabled={!teamInput.trim() || sendingTeam}
                  className="px-4 py-3 bg-sleek-violet hover:bg-sleek-violet/90 disabled:opacity-40 text-white rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-sleek-violet/30 active:scale-95"
                >
                  <Send size={14} />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 3: Notifications Feed */}
        {activeTab === 'notifications' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Filter Chips */}
            <div className="px-5 py-2.5 border-b border-white/5 bg-black/30 flex items-center gap-2 shrink-0">
              {(['all', 'ai', 'ops'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setNotifFilter(filter)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all ${
                    notifFilter === filter 
                      ? 'bg-white/15 text-white border border-white/10' 
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  {filter === 'ai' ? '🤖 AI Agents' : filter === 'ops' ? '🎬 Production Ops' : 'All Alerts'}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {notifications
                .filter(n => {
                  if (notifFilter === 'ai') return n.type === 'ai-marketing';
                  if (notifFilter === 'ops') return n.type !== 'ai-marketing';
                  return true;
                })
                .map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                      !notif.read 
                        ? 'bg-sleek-violet/10 border-sleek-violet/30' 
                        : 'bg-white/[0.02] border-white/5 opacity-80'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-white/5 shrink-0 mt-0.5">
                      {notif.type === 'ai-marketing' ? (
                        <Sparkles size={16} className="text-amber-400" />
                      ) : notif.type === 'payment' ? (
                        <DollarSign size={16} className="text-emerald-400" />
                      ) : notif.type === 'dispatch' ? (
                        <Zap size={16} className="text-sleek-violet" />
                      ) : (
                        <Film size={16} className="text-rose-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-white truncate">{notif.title}</h4>
                        <span className="text-[10px] text-white/40 shrink-0">{notif.time || 'Today'}</span>
                      </div>
                      <p className="text-xs text-white/70 mt-1 leading-relaxed">{notif.message}</p>
                      
                      {notif.type === 'ai-marketing' && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('agents');
                              setSelectedAgentId('grok-marketing');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-sleek-violet/20 hover:bg-sleek-violet/30 border border-sleek-violet/40 text-sleek-violet text-[10px] font-bold flex items-center gap-1"
                          >
                            <span>Open in Grok-MKT</span>
                            <ArrowRight size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Autonomous Campaign Modal Sub-dialog */}
        <AnimatePresence>
          {showCampaignModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl z-50 p-6 flex flex-col overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center">
                    <Zap size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Autonomous Marketing Campaign Engine</h3>
                    <p className="text-xs text-white/40">Grok-MKT generates 5 hooks, 3 ad copies, & a 7-day Reel schedule</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {!campaignResult ? (
                <div className="mt-6 flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-bold text-white/60 block mb-1.5">Campaign Goal / Product Focus</label>
                    <input 
                      type="text"
                      value={campaignGoal}
                      onChange={(e) => setCampaignGoal(e.target.value)}
                      placeholder="e.g. Launching our summer lifestyle collection with high-retention video ads"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                    <h5 className="text-xs font-bold text-white mb-2">Targeting Insights for {brandProfile?.name || 'Your Brand'}:</h5>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-white/60">
                      <div><strong className="text-white/80">Industry:</strong> {brandProfile?.industry || 'Lifestyle & D2C'}</div>
                      <div><strong className="text-white/80">Audience:</strong> {brandProfile?.targetAudience || 'Gen Z & Millennial'}</div>
                      <div><strong className="text-white/80">Brand Tone:</strong> {brandProfile?.tone || 'High-Energy Premium'}</div>
                      <div><strong className="text-white/80">Engine:</strong> Grok Viral Multiplier</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateCampaign}
                    disabled={generatingCampaign}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-rose-500 to-sleek-violet hover:brightness-110 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 disabled:opacity-50 transition-all"
                  >
                    {generatingCampaign ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Generating Full Campaign Package...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Generate 360° Video Campaign in 5 Seconds</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-4 flex-1">
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-amber-300">{campaignResult.campaignTitle}</h4>
                      <p className="text-[11px] text-white/60">{campaignResult.targetAudienceInsight}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      Viral Ready
                    </span>
                  </div>

                  {/* Viral Hooks */}
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider text-white/50 mb-2">🔥 5 Thumb-Stopping Hooks:</h5>
                    <div className="space-y-1.5">
                      {campaignResult.viralHooks?.map((hook: string, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs text-white flex items-center justify-between gap-2">
                          <span>{idx + 1}. "{hook}"</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(`hook-${idx}`, hook)}
                            className="text-white/40 hover:text-white shrink-0"
                          >
                            {copiedId === `hook-${idx}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ad Copies */}
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider text-white/50 mb-2">🎯 3 Meta/TikTok Ad Variations:</h5>
                    <div className="space-y-2">
                      {campaignResult.adCopies?.map((ad: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                          <p className="font-bold text-sleek-violet">{ad.hook}</p>
                          <p className="text-white/80 my-1">{ad.body}</p>
                          <p className="text-amber-400 font-semibold text-[11px]">{ad.cta}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setCampaignResult(null)}
                      className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold"
                    >
                      Generate New Variant
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCampaignModal(false);
                        if (onNavigateToCreate) {
                          onClose();
                          onNavigateToCreate(campaignResult.viralHooks?.[0]);
                        }
                      }}
                      className="flex-1 py-2.5 bg-sleek-violet hover:bg-sleek-violet/90 text-white rounded-xl text-xs font-bold shadow-lg shadow-sleek-violet/20"
                    >
                      Create Video Reel From Hook
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
