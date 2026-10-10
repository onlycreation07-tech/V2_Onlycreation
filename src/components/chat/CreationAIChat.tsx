import { apiFetch } from '../../services/apiClient';
import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Paperclip, 
  Video, 
  Camera, 
  Layers, 
  Play, 
  CheckCircle2, 
  ArrowRight, 
  Cpu, 
  Zap, 
  Bot, 
  RefreshCw, 
  Clock, 
  Plus, 
  ChevronDown, 
  FileText,
  Volume2,
  Sliders,
  Share2,
  FolderPlus,
  Compass,
  Film,
  Music,
  Check,
  Copy,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BrandProfile, 
  CreationAIChatMessage, 
  ProductionAdPlan, 
  AIAgentId,
  AdCreative
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/dbService';

interface CreationAIChatProps {
  brandProfile: BrandProfile;
  onOpenStudio: (tab?: string, prompt?: string) => void;
  onOpenAgents: (agentId?: AIAgentId) => void;
  onOpenProjects: () => void;
  onConvertToProject?: (creative: AdCreative) => void;
}

const STARTER_PROMPTS = [
  {
    title: 'Create an Ad',
    subtitle: 'Generate cinematic product videos & 9:16 Instagram Reels',
    icon: Film,
    accent: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    prompt: 'Create a premium 20-second luxury perfume commercial with cinematic lighting, a studio backdrop, an elegant voiceover, and Instagram Reel formatting.'
  },
  {
    title: 'Generate Images',
    subtitle: 'Studio-quality visual assets & product photography',
    icon: Camera,
    accent: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    prompt: 'Generate 3 studio-grade product shots with diffused softbox lighting on a dark reflective surface, 8k resolution commercial look.'
  },
  {
    title: 'AI Team Hub',
    subtitle: 'Collaborate with your specialized AI bots',
    icon: Bot,
    accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    prompt: 'Assign tasks to Ketan for 5 viral hooks with Google Search grounding, Nova for visual storyboards, and Echo for captions for our brand launch.'
  },
  {
    title: 'Content Engine',
    subtitle: 'Build Shorts, Reels, and YouTube faceless video packages',
    icon: Video,
    accent: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    prompt: 'Build a faceless 3-part YouTube Shorts series on tech minimalism with script, visual prompts, and voiceover timing.'
  }
];

export default function CreationAIChat({
  brandProfile,
  onOpenStudio,
  onOpenAgents,
  onOpenProjects,
  onConvertToProject
}: CreationAIChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CreationAIChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [modelPreference, setModelPreference] = useState<'auto' | 'pro'>('auto');
  const [selectedRatio, setSelectedRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isGeneratingPlan]);

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorNotice('Please select an image file (PNG, JPG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    setErrorNotice(null);
    const userMsgId = `msg_user_${Date.now()}`;
    const newUserMsg: CreationAIChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    if (!textToSend) setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsLoading(true);

    // Detect if this is an explicit full ad creation request
    const isAdRequest = /create.*(ad|commercial|video|reel|short|campaign)|produce.*(ad|commercial)|make.*(video|commercial)/i.test(text);

    try {
      if (isAdRequest) {
        setIsGeneratingPlan(true);
        // Step 1: Call structured ad plan generator
        const planRes = await apiFetch('/api/creation-ai/create-ad-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: text,
            brandProfile,
            aspectRatio: selectedRatio,
            duration: 20,
            uid: user?.uid
          })
        });

        const planData = await planRes.json();
        if (!planRes.ok) throw new Error(planData.error || 'Could not create ad plan');
        const adPlan: ProductionAdPlan = planData.plan;

        const assistantMsg: CreationAIChatMessage = {
          id: `msg_asst_${Date.now()}`,
          role: 'assistant',
          content: `I've prepared a comprehensive **Step-by-Step Production Plan** for **${adPlan.title || 'your commercial'}**.\n\nReview the hook, voiceover, and individual scene directions below before approving generation in the studio:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: 'gemini-3.8-flash',
          adPlan
        };

        setMessages(prev => [...prev, assistantMsg]);
        setIsGeneratingPlan(false);
      } else {
        // Standard conversational interaction
        const historyPayload = messages.map(m => ({
          role: m.role,
          content: m.content
        }));

        const chatRes = await apiFetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            conversationHistory: historyPayload,
            brandProfile,
            modelPreference,
            uid: user?.uid
          })
        });

        const data = await chatRes.json();
        if (!chatRes.ok) throw new Error(data.error || 'Chat failed');

        const assistantMsg: CreationAIChatMessage = {
          id: `msg_asst_${Date.now()}`,
          role: 'assistant',
          content: data.reply || "I've reviewed your request. Let's build the concept.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: data.modelUsed || 'gemini-3.8-flash'
        };

        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorNotice('Network or generation issue. Please try again.');
      setMessages(prev => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: "I ran into a temporary connection issue. You can re-submit your prompt or explore the AI Studio directly.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
      setIsGeneratingPlan(false);
      setAttachedImage(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleApprovePlan = (plan: ProductionAdPlan) => {
    // Navigate directly into Studio to produce
    const firstPrompt = plan.scenes?.[0]?.visualPrompt || plan.coreHook;
    onOpenStudio('campaign', firstPrompt);
  };

  const handleSavePlanToProject = async (plan: ProductionAdPlan) => {
    if (!user) return;
    try {
      const creativeObj: AdCreative = {
        id: `creative_${Date.now()}`,
        userId: user.uid,
        prompt: plan.title,
        copy: plan.coreHook,
        videoScript: plan.videoScript,
        imageUrls: [],
        productionBrief: `Title: ${plan.title}\nStyle: ${plan.visualStyle}\nVoice: ${plan.voicePersona}\nMusic: ${plan.musicStyle}`,
        status: 'approved',
        createdAt: new Date().toISOString()
      };

      if (onConvertToProject) {
        await onConvertToProject(creativeObj);
      } else {
        await dbService.createProject({
          userId: user.uid,
          title: plan.title,
          brandName: brandProfile.name || 'Brand Studio',
          stage: 'ideation',
          budget: 25000,
          creativePrompt: plan.videoScript,
          milestones: [
            { id: `m1_${Date.now()}`, title: 'Creative Hook & Script Finalized', completed: true },
            { id: `m2_${Date.now()}`, title: 'Visual Generation (Studio Pass)', completed: false, dueDate: 'In 1 day' },
            { id: `m3_${Date.now()}`, title: 'Voiceover & Audio Synthesis', completed: false, dueDate: 'In 2 days' },
            { id: `m4_${Date.now()}`, title: 'Final Review & Export', completed: false, dueDate: 'In 3 days' }
          ],
          deliverables: [],
          aiHealthScore: 98,
          aiRiskAnalysis: 'Plan generated via Creation AI. Ready for asset rendering.'
        });
        onOpenProjects();
      }

      setSavedSuccessId(plan.title);
      setTimeout(() => setSavedSuccessId(null), 4000);
    } catch (e) {
      console.warn('Could not save plan as project:', e);
    }
  };

  const handleDelegateToAgent = async (agentId: AIAgentId, contextPrompt: string) => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/creation-ai/delegate-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          prompt: contextPrompt,
          brandProfile,
          uid: user?.uid
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Agent delegation failed');
      if (data.task) {
        setMessages(prev => [
          ...prev,
          {
            id: `msg_asst_${Date.now()}`,
            role: 'assistant',
            content: `**Task Result from ${data.task.agentId}:**\n\n${data.task.output}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            delegatedAgent: agentId,
            delegatedTask: {
              id: data.task.id,
              agentId: data.task.agentId,
              title: data.task.title,
              output: data.task.output
            }
          }
        ]);
      }
    } catch (err) {
      console.error('Agent delegation failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto px-4 py-2">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-6 pr-1 hide-scrollbar">
        {messages.length === 0 ? (
          // Welcome Zero State
          <div className="py-8 md:py-14 text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sleek-violet/10 border border-sleek-violet/20 text-sleek-violet text-xs font-medium mb-6">
              <Sparkles size={13} className="text-sleek-violet animate-pulse" />
              <span>Creation AI V2 · Creative Production Workspace</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-3 text-balance">
              What will we create today?
            </h1>
            <p className="text-white/60 text-sm md:text-base mb-8 max-w-lg mx-auto">
              Your AI creative team, from idea to final production. Generate studio-quality video ads, product visuals, scripts, and full campaigns.
            </p>

            {/* Quick Starter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {STARTER_PROMPTS.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(card.prompt)}
                    className="p-4 rounded-xl bg-sleek-zinc border border-white/5 hover:border-sleek-violet/40 hover:bg-white/[0.03] transition-all text-left group flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div className={`p-2 rounded-lg border ${card.accent}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-white group-hover:text-sleek-violet transition-colors">
                          {card.title}
                        </h2>
                        <p className="text-xs text-white/50 line-clamp-1 mt-0.5">
                          {card.subtitle}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-white/40 flex items-center gap-1 group-hover:text-white/80 transition-colors mt-2">
                      Try prompt <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          // Message Thread
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div 
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-sleek-violet/20 border border-sleek-violet/40 flex items-center justify-center text-sleek-violet shrink-0 mt-1">
                    <Sparkles size={16} />
                  </div>
                )}

                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 ${
                  isUser 
                    ? 'bg-sleek-violet text-white rounded-br-xs' 
                    : 'bg-sleek-zinc border border-white/10 text-white/90 rounded-bl-xs'
                }`}>
                  <div className="flex items-center justify-between gap-4 mb-1 text-[11px] text-white/50">
                    <span className="font-medium text-white/70">
                      {isUser ? (brandProfile.name || 'You') : 'Creation AI'}
                    </span>
                    <span className="tabular-nums">{msg.timestamp}</span>
                  </div>

                  {/* Main Message Body */}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap space-y-2">
                    {msg.content}
                  </div>

                  {/* Structured Ad Plan Card if present */}
                  {msg.adPlan && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-sleek-violet uppercase tracking-wider">
                            3-Second Viral Hook
                          </span>
                          <span className="text-[11px] text-white/50 tabular-nums">
                            {msg.adPlan.durationSeconds}s · {msg.adPlan.aspectRatio}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-white italic">
                          "{msg.adPlan.coreHook}"
                        </p>
                      </div>

                      {/* Scene Breakdown */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                          Scene-by-Scene Direction ({msg.adPlan.scenes?.length || 0} Shots)
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {msg.adPlan.scenes?.map((scene) => (
                            <div 
                              key={scene.sceneNumber} 
                              className="p-3 rounded-lg bg-white/[0.02] border border-white/5 text-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-white/60 font-mono">
                                <span>Scene {scene.sceneNumber}</span>
                                <span>{scene.cameraMovement}</span>
                              </div>
                              <p className="text-white/90 font-medium">{scene.shotDescription}</p>
                              <p className="text-white/50 italic">VO: "{scene.voiceover}"</p>
                              <div className="pt-1 flex items-center justify-between text-[11px] text-white/40">
                                <span>Light: {scene.lighting}</span>
                                <button
                                  onClick={() => onOpenStudio('images', scene.visualPrompt)}
                                  className="text-sleek-violet hover:text-sleek-fuchsia transition-colors flex items-center gap-1 font-sans"
                                >
                                  Generate in Image Studio <ArrowRight size={11} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ad Plan Actions */}
                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleApprovePlan(msg.adPlan!)}
                          className="px-3.5 py-2 rounded-lg bg-sleek-violet hover:bg-sleek-violet/90 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <Play size={13} fill="currentColor" />
                          Launch in AI Studio
                        </button>

                        <button
                          onClick={() => handleSavePlanToProject(msg.adPlan!)}
                          className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                          {savedSuccessId === msg.adPlan.title ? (
                            <>
                              <Check size={13} className="text-emerald-400" />
                              <span className="text-emerald-300">Saved to Projects</span>
                            </>
                          ) : (
                            <>
                              <FolderPlus size={13} />
                              <span>Save to Projects</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDelegateToAgent('nova-director', `Provide cinematic DaVinci lighting diagrams and lens choices for: ${msg.adPlan?.title}`)}
                          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                          <Camera size={13} />
                          Ask Nova (Cinematography)
                        </button>

                        <button
                          onClick={() => handleDelegateToAgent('echo-outreach', `Write high-converting Instagram Reel captions and 15 hashtags for: ${msg.adPlan?.title}`)}
                          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                          <Share2 size={13} />
                          Ask Echo (Captions)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Delegated Task Badge */}
                  {msg.delegatedAgent && (
                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2 text-[11px] text-white/40">
                      <Bot size={12} className="text-sleek-violet" />
                      <span>Task executed via AI Team Hub ({msg.delegatedAgent})</span>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white/80 shrink-0 mt-1 text-xs font-bold uppercase">
                    {(brandProfile.name || 'U').slice(0, 1)}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {(isLoading || isGeneratingPlan) && (
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-lg bg-sleek-violet/20 border border-sleek-violet/40 flex items-center justify-center text-sleek-violet shrink-0">
              <RefreshCw size={15} className="animate-spin" />
            </div>
            <div className="p-3.5 rounded-2xl bg-sleek-zinc border border-white/10 text-xs text-white/70 flex items-center gap-2">
              <span>
                {isGeneratingPlan 
                  ? 'Structuring 3-second hook, shot list & production breakdown...' 
                  : 'Creation AI is reasoning...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Notice */}
      {errorNotice && (
        <div className="mb-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{errorNotice}</span>
          </div>
          <button onClick={() => setErrorNotice(null)} className="text-white/40 hover:text-white">✕</button>
        </div>
      )}

      {/* Attached Media Thumbnail */}
      {attachedImage && (
        <div className="mb-2 relative inline-block">
          <img 
            src={attachedImage} 
            alt="Upload preview" 
            className="w-16 h-16 object-cover rounded-lg border border-sleek-violet"
          />
          <button 
            onClick={() => setAttachedImage(null)}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full text-white text-[10px] flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      )}

      {/* Prompt Composer */}
      <div className="bg-sleek-zinc rounded-2xl border border-white/10 p-3 shadow-xl focus-within:border-sleek-violet/50 transition-colors">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleTextareaInput}
          onKeyDown={handleKeyDown}
          placeholder="Describe your idea, ask for a commercial script, or build a complete campaign..."
          rows={1}
          className="w-full bg-transparent text-white placeholder-white/40 text-sm resize-none focus:outline-hidden min-h-[44px] max-h-[180px] py-1"
        />

        {/* Composer Controls Toolbar */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1 gap-2 flex-wrap">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            {/* Hidden File Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
              title="Attach reference image"
            >
              <Paperclip size={16} />
            </button>

            {/* Format Ratio Selector */}
            <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/5 text-[11px]">
              {(['9:16', '16:9', '1:1'] as const).map(ratio => (
                <button
                  key={ratio}
                  onClick={() => setSelectedRatio(ratio)}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    selectedRatio === ratio 
                      ? 'bg-sleek-violet text-white shadow-xs' 
                      : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>

            {/* Model Selector */}
            <select
              value={modelPreference}
              onChange={(e) => setModelPreference(e.target.value as any)}
              className="bg-black/40 border border-white/5 rounded-lg text-white/70 text-[11px] px-2 py-1 focus:outline-hidden"
            >
              <option value="auto">Auto (Gemini 3.8 Flash)</option>
              <option value="pro">Deep Reasoning (Pro)</option>
            </select>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/30 hidden sm:inline">
              Press Enter to send · Shift+Enter for newline
            </span>

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                inputValue.trim() && !isLoading
                  ? 'bg-sleek-violet text-white hover:bg-sleek-violet/90 shadow-md shadow-sleek-violet/20'
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
              }`}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
