import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Globe, 
  MapPin, 
  Cpu, 
  User, 
  Bot, 
  ExternalLink, 
  RefreshCw,
  Sliders,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService, GroundingSource } from '../../services/geminiService';
import { useAuth } from '../../context/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  sources?: GroundingSource[];
  places?: GroundingSource[];
  modelUsed?: string;
}

export default function DirectorChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm your OnlyCreation Executive Creative Director & Production Assistant. I can help you draft viral commercial treatments, technical shot lists, color palettes, or research real-time market trends and physical studio soundstages across India. How can I assist your shoot today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelTier, setModelTier] = useState<'complex' | 'general' | 'fast'>('general');
  const [activeGrounding, setActiveGrounding] = useState<'none' | 'search' | 'maps'>('none');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputText;
    setInputText('');
    setLoading(true);

    try {
      // 1. Google Search Grounding Mode
      if (activeGrounding === 'search') {
        const res = await geminiService.searchGrounding(currentInput);
        const botMsg: Message = {
          id: `bot_${Date.now()}`,
          role: 'model',
          text: res.answer,
          sources: res.sources,
          modelUsed: 'gemini-3.5-flash (Google Search Grounded)',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
      } 
      // 2. Google Maps Grounding Mode
      else if (activeGrounding === 'maps') {
        let latLng: any = undefined;
        try {
          if ('geolocation' in navigator) {
            const pos: any = await new Promise((resolve) => {
              navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 3000 });
            });
            if (pos?.coords) {
              latLng = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            }
          }
        } catch (_) {}

        const res = await geminiService.mapsGrounding(currentInput, latLng);
        const botMsg: Message = {
          id: `bot_${Date.now()}`,
          role: 'model',
          text: res.answer,
          places: res.places,
          modelUsed: 'gemini-3.5-flash (Google Maps Grounded)',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
      } 
      // 3. Multi-Turn Conversational Gemini Chatbot
      else {
        const history = [...messages, userMsg].map(m => ({
          role: m.role,
          text: m.text
        }));

        const res = await geminiService.chat(history, undefined, modelTier);
        const botMsg: Message = {
          id: `bot_${Date.now()}`,
          role: 'model',
          text: res.reply,
          modelUsed: res.modelUsed,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch (err: any) {
      console.error(err);
      const errMsg: Message = {
        id: `err_${Date.now()}`,
        role: 'model',
        text: "I encountered a brief hiccup connecting to the studio intelligence pipeline. Let's try that prompt again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[520px] bg-zinc-950/80 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Chat Top Controls & Model Selector */}
      <div className="p-3 bg-zinc-900/90 border-b border-white/5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-sleek-violet to-sleek-fuchsia flex items-center justify-center text-white">
              <Bot size={15} />
            </div>
            <div>
              <h3 className="text-xs font-black text-white">Creative Director AI</h3>
              <p className="text-[9px] text-white/40 font-mono">Multi-turn Studio Assistant</p>
            </div>
          </div>

          {/* Model Selector Tabs */}
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            {[
              { id: 'pro', tier: 'complex', label: 'Pro 3.1', desc: 'gemini-3.1-pro-preview' },
              { id: 'flash', tier: 'general', label: 'Flash 3.5', desc: 'gemini-3.5-flash' },
              { id: 'lite', tier: 'fast', label: 'Lite 3.1', desc: 'gemini-3.1-flash-lite' },
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModelTier(m.tier as any)}
                title={m.desc}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer ${
                  modelTier === m.tier
                    ? 'bg-sleek-violet text-white shadow-sm'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grounding Mode Pills */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
          <span className="text-[9px] uppercase tracking-wider text-white/30 font-bold mr-1">Live Tools:</span>
          <button
            type="button"
            onClick={() => setActiveGrounding(activeGrounding === 'search' ? 'none' : 'search')}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              activeGrounding === 'search'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm'
                : 'bg-white/5 text-white/40 border-white/5 hover:text-white'
            }`}
          >
            <Globe size={11} />
            <span>Google Search</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveGrounding(activeGrounding === 'maps' ? 'none' : 'maps')}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              activeGrounding === 'maps'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-white/5 text-white/40 border-white/5 hover:text-white'
            }`}
          >
            <MapPin size={11} />
            <span>Google Maps</span>
          </button>
        </div>
      </div>

      {/* Scrollable Message Thread */}
      <div className="flex-1 p-4 overflow-y-auto hide-scrollbar flex flex-col gap-3">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[90%] ${isUser ? 'self-end' : 'self-start'}`}
            >
              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  isUser
                    ? 'bg-gradient-to-r from-sleek-violet to-purple-700 text-white rounded-tr-sm'
                    : 'bg-white/[0.08] text-white/90 border border-white/5 rounded-tl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Search Grounding Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-white/10 flex flex-col gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1">
                      <Globe size={10} /> Verified Web Sources
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((s, idx) => (
                        <a
                          key={idx}
                          href={s.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
                        >
                          <span className="truncate max-w-[140px]">{s.title}</span>
                          <ExternalLink size={9} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Maps Grounding Places */}
                {msg.places && msg.places.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-white/10 flex flex-col gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      <MapPin size={10} /> Google Maps Studio Locations
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.places.map((p, idx) => (
                        <a
                          key={idx}
                          href={p.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
                        >
                          <span className="truncate max-w-[140px]">{p.title}</span>
                          <ExternalLink size={9} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1 px-1 text-[9px] font-mono text-white/30">
                <span>{msg.timestamp}</span>
                {msg.modelUsed && <span>• {msg.modelUsed}</span>}
              </div>
            </motion.div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 p-3 bg-white/5 rounded-2xl self-start border border-white/5">
            <RefreshCw size={14} className="animate-spin text-sleek-violet" />
            <span className="text-[11px] text-white/60 font-mono">
              Directing response with {activeGrounding !== 'none' ? `Google ${activeGrounding}` : modelTier}...
            </span>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-zinc-900 border-t border-white/5 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            activeGrounding === 'search'
              ? 'Search live web data, trend benchmarks...'
              : activeGrounding === 'maps'
              ? 'Find film studios, cycloramas, shooting spots...'
              : 'Ask Creative Director for treatments, lenses, lighting...'
          }
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-white/30 outline-none focus:border-sleek-violet transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="w-10 h-10 rounded-2xl bg-gradient-to-r from-sleek-violet to-sleek-fuchsia text-white flex items-center justify-center cursor-pointer shadow-lg disabled:opacity-40 hover:scale-105 active:scale-95 transition-all"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
