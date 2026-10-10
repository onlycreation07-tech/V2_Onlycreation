import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MapPin, Target, Sparkles, Layout, Monitor, ChevronLeft, Phone, Zap } from 'lucide-react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';

interface BillboardRequestScreenProps {
  onBack: () => void;
}

export default function BillboardRequestScreen({ onBack }: BillboardRequestScreenProps) {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<'led' | 'banner' | 'scrolling' | 'any'>('any');
  const [budget, setBudget] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Suggestions based on prompt (Simulation for Seed Round demo)
  const [suggestions, setSuggestions] = useState<{ locations: string[], quantity: number } | null>(null);

  const [serviceType, setServiceType] = useState<'oaas' | 'omas'>('oaas');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !prompt || !budget) return;

    setLoading(true);
    try {
      await dbService.submitBillboardEnquiry({
        userId: user.uid,
        userEmail: user.email || '',
        prompt: `[OMAS - ${serviceType === 'oaas' ? 'ASSET' : 'STRATEGY'}] ${prompt}`,
        billboardType: type,
        budget
      });

      // Simple heuristic for demo suggestions
      const q = prompt.toLowerCase().includes('massive') ? 5 : 2;
      const locations = prompt.toLowerCase().includes('mumbai') 
        ? ['Worli Sea Link', 'Marine Drive', 'Andheri Link Rd'] 
        : ['Times Square', 'Sunset Blvd', 'Downtown 5th Ave'];

      setSuggestions({ locations, quantity: q });
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      alert('Error submitting enquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col gap-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex flex-col gap-3 text-center">
          <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
            <Zap size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter">Enquiry Captured</h1>
          <p className="text-white/40 text-sm px-8">Our Outdoor Marketing as a Service (OMAS) team is reviewing your requirement. Expect a call in <span className="text-white font-bold">15 minutes</span>.</p>
        </header>

        {suggestions && (
          <section className="bg-sleek-dark p-6 rounded-[32px] border border-sleek-violet/30 flex flex-col gap-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles size={48} className="text-sleek-violet" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-sleek-violet uppercase tracking-widest leading-none">Smart Suggestion</label>
              <h3 className="text-xl font-bold">Recommended Strategy</h3>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="p-3 bg-sleek-violet/20 rounded-xl">
                  <Target size={20} className="text-sleek-violet" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Est. Reach</p>
                  <p className="font-bold text-lg">{suggestions.quantity} Premium Spots</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">Target Locations</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.locations.map(loc => (
                    <span key={loc} className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-xs font-medium text-white/60 flex items-center gap-2">
                      <MapPin size={10} className="text-sleek-violet" />
                      {loc}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <button 
          onClick={onBack}
          className="w-full bg-sleek-dark border border-white/10 text-white py-5 rounded-[24px] font-bold text-sm uppercase tracking-widest hover:bg-zinc-900 transition-all active:scale-[0.98]"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={onBack} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Layout className="text-sleek-violet" size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest text-sleek-violet">OMAS Portal</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tighter text-white/90">Outdoor Marketing as a Service</h1>
        <p className="text-white/40 text-sm font-medium">Choose your model: Asset Booking or Full Strategy.</p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex gap-4 p-1 bg-white/5 border border-white/5 rounded-2xl">
          <button
            type="button"
            onClick={() => setServiceType('oaas')}
            className={`flex-1 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${serviceType === 'oaas' ? 'bg-sleek-violet text-white shadow-xl' : 'text-white/40'}`}
          >
            Asset Booking
          </button>
          <button
            type="button"
            onClick={() => setServiceType('omas')}
            className={`flex-1 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${serviceType === 'omas' ? 'bg-sleek-fuchsia text-white shadow-xl' : 'text-white/40'}`}
          >
            Full Strategy
          </button>
        </div>

        <div className="bg-sleek-dark p-6 rounded-[32px] border border-white/5 flex flex-col gap-6 shadow-2xl">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">Describe your {serviceType === 'oaas' ? 'asset requirements' : 'marketing goals'}</label>
            <textarea 
              required
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={serviceType === 'oaas' ? "e.g. Need 3 high-traffic LEDs in Mumbai for 2 weeks." : "e.g. I want to build brand awareness for my new skincare line among Gen-Z urban professionals."}
              className="bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sleek-violet h-32 resize-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">Billboard Type</label>
              <div className="relative">
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-xs text-white appearance-none focus:outline-none focus:ring-1 focus:ring-sleek-violet"
                >
                  <option value="any">Any (Recommended)</option>
                  <option value="led">Digital LED</option>
                  <option value="banner">Static Banner</option>
                  <option value="scrolling">Scrolling Display</option>
                </select>
                <Monitor size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">Daily Budget</label>
              <div className="relative">
                <input 
                  required
                  placeholder="e.g. $500"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sleek-violet"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-sleek-violet/10 border border-sleek-violet/20 p-5 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sleek-violet flex items-center justify-center shrink-0">
            <Phone size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white/90">Instant Callback</p>
            <p className="text-[10px] text-white/40 leading-relaxed">Our experts will call you to finalize locations and placement geometry.</p>
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="group relative w-full bg-white text-black py-5 rounded-[24px] font-bold text-sm uppercase tracking-widest shadow-xl shadow-white/5 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? (
            <RefreshCwIcon className="animate-spin" size={18} />
          ) : (
            <>
              Request Strategy
              <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function RefreshCwIcon({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      className={className}
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
