import { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  ChevronRight, 
  FileText, 
  Video, 
  Camera, 
  Download, 
  Copy, 
  Zap, 
  Sliders, 
  FolderPlus,
  Check,
  Image as ImageIcon,
  Film,
  Music,
  Mic,
  MessageSquare,
  Radio,
  Layers,
  Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService } from '../../services/geminiService';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { AdCreative, BrandProfile } from '../../types';

import ImageStudio from './ImageStudio';
import VeoVideoStudio from './VeoVideoStudio';
import MusicStudio from './MusicStudio';
import AudioTranscriber from './AudioTranscriber';
import DirectorChat from './DirectorChat';
import LiveVoiceRoom from './LiveVoiceRoom';
import AIProductionBriefEngine from './AIProductionBriefEngine';

interface CreateScreenProps {
  onGenerated: (creative: AdCreative) => void;
  onProduce: (creative: AdCreative) => void;
  onConvertToProject?: (creative: AdCreative) => void;
  onLaunchDispatch?: () => void;
  brandProfile: BrandProfile;
  initialTab?: StudioTab;
}

type StudioTab = 'campaign' | 'brief_engine' | 'images' | 'veo_video' | 'music' | 'transcribe' | 'director_chat' | 'live_voice';

const INSPIRATION_TAGS = [
  'Bangalore Tech Noir',
  'Quiet Luxury Fragrance',
  'Indiranagar Coffee Culture',
  'Streetwear Drop 2026',
  'Retro 90s VHS Camcorder',
  'Neon Rooftop Cypher'
];

const STYLES = [
  { id: 'cinematic', label: 'Cinematic 35mm', desc: 'Arri Alexa film tones & deep shadows' },
  { id: 'vhs_retro', label: 'Retro 90s VHS', desc: 'Grain, timestamp & scanline nostalgia' },
  { id: 'cyberpunk', label: 'Cyberpunk Neon', desc: 'High-contrast cyan & magenta rim light' },
  { id: 'vogue', label: 'Vogue Minimalist', desc: 'Clean editorial high-fashion typography' },
  { id: 'streetwear', label: 'Streetwear Pop', desc: 'Bold saturated Gen-Z vibrant aesthetic' },
];

const RATIOS: Array<{ id: '1:1' | '9:16' | '16:9'; label: string }> = [
  { id: '9:16', label: '9:16 Reels' },
  { id: '1:1', label: '1:1 Square' },
  { id: '16:9', label: '16:9 Cinema' },
];

export default function CreateScreen({ 
  onGenerated, 
  onProduce, 
  onConvertToProject,
  onLaunchDispatch,
  brandProfile,
  initialTab = 'campaign'
}: CreateScreenProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<StudioTab>(initialTab);
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('cinematic');
  const [selectedRatio, setSelectedRatio] = useState<'1:1' | '9:16' | '16:9'>('9:16');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [creative, setCreative] = useState<AdCreative | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [veoPrefilledImage, setVeoPrefilledImage] = useState<string | null>(null);

  const handleGenerate = async (customPrompt?: string) => {
    const targetPrompt = customPrompt || prompt;
    if (!targetPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const styleObj = STYLES.find(s => s.id === selectedStyle);
      const result = await geminiService.generateAd(targetPrompt, brandProfile, {
        style: styleObj?.label,
        aspectRatio: selectedRatio
      } as any);
      setCreative(result);
      setSelectedImageIndex(0);
      onGenerated(result);

      // Persist creative in Firestore
      if (user?.uid) {
        dbService.saveCreative({
          ...result,
          userId: user.uid,
          brandId: brandProfile?.name || 'brand'
        }).catch(err => console.warn("Failed persisting creative to Firestore:", err));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = (text: string, sectionId: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleExportBrief = () => {
    if (!creative) return;
    const content = `# ONLY CREATION — PRODUCTION BRIEF
Brand: ${brandProfile.name} (${brandProfile.industry})
Date: ${new Date(creative.createdAt).toLocaleString()}
Prompt: ${creative.prompt}

---
## 1. AD COPY
${creative.copy}

---
## 2. SHORT-FORM VIDEO SCRIPT
${creative.videoScript}

---
## 3. TECHNICAL PRODUCTION SPECIFICATIONS
${creative.productionBrief}

Generated with OnlyCreation AI Studio Intelligence.
`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OnlyCreation_Brief_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAnimateWithVeo = (imgUrl: string) => {
    setVeoPrefilledImage(imgUrl);
    setActiveTab('veo_video');
  };

  return (
    <div className="flex flex-col gap-5 pb-24 min-h-full">
      {/* Header */}
      <header className="flex flex-col gap-1.5 shrink-0 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-white/95">Studio Suite</h1>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
              AI Engines
            </span>
          </div>
          <div className="px-3 py-1 bg-gradient-to-r from-purple-500/15 to-pink-500/15 border border-purple-500/30 rounded-full flex items-center gap-1.5 shadow-sm">
            <Sparkles size={12} className="text-purple-400 animate-pulse" />
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-purple-300">Gemini 3 + Veo 3</span>
          </div>
        </div>
        <p className="text-white/50 text-xs">Production-grade AI media, computer vision, video, music & real-time direction.</p>
      </header>

      {/* Studio Suite Category Tabs Navigation - Non-shrinking & Sticky */}
      <div className="sticky top-0 z-30 bg-sleek-black/95 backdrop-blur-md -mx-4 px-4 py-2 border-y border-white/10 shrink-0 shadow-lg shadow-black/40">
        <div className="flex items-center justify-between pb-1.5 px-0.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/50">Studio Categories</span>
          <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
            8 Active Modes
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1">
          {[
            { id: 'campaign', label: 'Ad Campaign', icon: Wand2, tag: 'Director' },
            { id: 'brief_engine', label: 'AI Brief Engine', icon: Film, tag: 'Vision AI' },
            { id: 'images', label: 'Image Studio', icon: ImageIcon, tag: 'Nano Banana' },
            { id: 'veo_video', label: 'Veo 3 Video', icon: Film, tag: 'Veo 3' },
            { id: 'music', label: 'Lyria Music', icon: Music, tag: 'Audio' },
            { id: 'transcribe', label: 'Transcribe', icon: Mic, tag: 'Speech' },
            { id: 'director_chat', label: 'Director Chat', icon: MessageSquare, tag: 'Search' },
            { id: 'live_voice', label: 'Live Voice', icon: Radio, tag: 'Live API' },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`shrink-0 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer select-none active:scale-95 ${
                  active
                    ? 'bg-gradient-to-r from-sleek-violet via-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40 ring-1 ring-purple-400/20'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <Icon size={14} className={active ? 'text-white' : 'text-white/60'} />
                <span>{tab.label}</span>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse ml-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Studio — Keep Warm Architecture: All Sub-Studios Remain Mounted */}
      <div className="flex-1">
        <div className={activeTab === 'brief_engine' ? 'block' : 'hidden'}>
          <AIProductionBriefEngine 
            brandProfile={brandProfile} 
            onConvertToProject={onConvertToProject}
            onDispatchCrew={() => onLaunchDispatch && onLaunchDispatch()}
          />
        </div>

        <div className={activeTab === 'images' ? 'block' : 'hidden'}>
          <ImageStudio onAnimateWithVeo={handleAnimateWithVeo} />
        </div>

        <div className={activeTab === 'veo_video' ? 'block' : 'hidden'}>
          <VeoVideoStudio initialImage={veoPrefilledImage} />
        </div>

        <div className={activeTab === 'music' ? 'block' : 'hidden'}>
          <MusicStudio />
        </div>

        <div className={activeTab === 'transcribe' ? 'block' : 'hidden'}>
          <AudioTranscriber />
        </div>

        <div className={activeTab === 'director_chat' ? 'block' : 'hidden'}>
          <DirectorChat />
        </div>

        <div className={activeTab === 'live_voice' ? 'block' : 'hidden'}>
          <LiveVoiceRoom />
        </div>

        {/* Default / Campaign Scripting Studio */}
        <div className={activeTab === 'campaign' ? 'block' : 'hidden'}>
          <div className="flex flex-col gap-5">
            {/* Quick Inspiration Pills */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Curated Directorial Presets</label>
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {INSPIRATION_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setPrompt(tag);
                      handleGenerate(tag);
                    }}
                    className="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-sleek-violet/50 transition-all active:scale-95 cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Style & Aspect Ratio Controls */}
              <div className="bg-sleek-dark p-4 rounded-3xl border border-white/5 flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold uppercase text-white/40 tracking-wider">Cinematic Style</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {STYLES.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedStyle(s.id)}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          selectedStyle === s.id 
                            ? 'bg-sleek-violet/20 border-sleek-violet text-white' 
                            : 'bg-white/5 border-white/5 text-white/50 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-bold block">{s.label}</span>
                        <span className="text-[9px] text-white/40 block mt-0.5">{s.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold uppercase text-white/40 tracking-wider">Format</span>
                  <div className="grid grid-cols-3 gap-2">
                    {RATIOS.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRatio(r.id)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          selectedRatio === r.id
                            ? 'bg-sleek-violet text-white border-sleek-violet'
                            : 'bg-white/5 text-white/50 border-white/5 hover:text-white'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Prompt Input */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Commercial Brief Prompt</label>
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your commercial vision, product focus, camera movement, or brand storyline..."
                    rows={3}
                    className="w-full bg-sleek-dark border border-white/10 rounded-2xl p-4 text-xs text-white placeholder:text-white/30 outline-none focus:border-sleek-violet transition-colors resize-none font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => handleGenerate()}
                    disabled={isGenerating || !prompt.trim()}
                    className="absolute right-3 bottom-3 p-2 bg-gradient-to-r from-sleek-violet to-sleek-fuchsia text-white rounded-xl shadow-lg disabled:opacity-40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>

              {/* Direct button */}
              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-gradient-to-r from-sleek-violet via-purple-600 to-sleek-fuchsia hover:brightness-110 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-40 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Architecting Campaign & Visuals...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Generate Complete Campaign & Storyboard</span>
                  </>
                )}
              </button>
            </div>

            {/* Generated Campaign Output */}
            {creative && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-sleek-dark rounded-3xl border border-white/10 p-5 flex flex-col gap-5 shadow-2xl"
              >
                {/* Visual Shot Carousel */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Storyboard Shots ({creative.imageUrls.length})</span>
                    <span className="text-[9px] font-mono text-cyan-400">gemini-3.1-flash-image-preview</span>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-[9/16] max-h-96 bg-black">
                    <img
                      src={creative.imageUrls[selectedImageIndex] || creative.imageUrls[0]}
                      alt="Campaign storyboard frame"
                      className="w-full h-full object-cover"
                    />

                    {/* Animate with Veo shortcut */}
                    <button
                      type="button"
                      onClick={() => handleAnimateWithVeo(creative.imageUrls[selectedImageIndex] || creative.imageUrls[0])}
                      className="absolute bottom-3 right-3 bg-blue-600/90 hover:bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-1.5 shadow-lg cursor-pointer transition-all"
                    >
                      <Film size={12} />
                      <span>Animate with Veo 3</span>
                    </button>
                  </div>

                  {creative.imageUrls.length > 1 && (
                    <div className="flex gap-2">
                      {creative.imageUrls.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                            selectedImageIndex === idx ? 'border-sleek-violet scale-105' : 'border-white/10 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Script and Copy Breakdown */}
                <div className="flex flex-col gap-3">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-white/40 tracking-wider">Ad Copy Hook</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(creative.copy, 'copy')}
                        className="text-[10px] text-white/40 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copiedSection === 'copy' ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                        <span>{copiedSection === 'copy' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-white/90 font-medium leading-relaxed">{creative.copy}</p>
                  </div>

                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-white/40 tracking-wider">Short-Form Script</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(creative.videoScript, 'script')}
                        className="text-[10px] text-white/40 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copiedSection === 'script' ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                        <span>{copiedSection === 'script' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-white/90 font-mono whitespace-pre-wrap leading-relaxed">{creative.videoScript}</p>
                  </div>

                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase text-white/40 tracking-wider">Technical Production Brief</span>
                    <p className="text-xs text-white/70 leading-relaxed font-mono">{creative.productionBrief}</p>
                  </div>
                </div>

                {/* Workflow Actions */}
                <div className="flex flex-col gap-2 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onProduce(creative)}
                      className="py-3 bg-gradient-to-r from-sleek-violet to-sleek-fuchsia text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Book Studio Space</span>
                      <ChevronRight size={14} />
                    </button>

                    {onConvertToProject && (
                      <button
                        type="button"
                        onClick={() => onConvertToProject(creative)}
                        className="py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer border border-white/10"
                      >
                        <FolderPlus size={14} />
                        <span>Save to Projects</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleExportBrief}
                    className="py-2.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-white/5 transition-colors cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Export Production Brief (.MD)</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
