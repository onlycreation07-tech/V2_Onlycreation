import React, { useState } from 'react';
import { 
  Sparkles, 
  Upload, 
  Download, 
  RefreshCw, 
  Sliders, 
  Wand2, 
  Image as ImageIcon, 
  Check, 
  Copy,
  Layers,
  Zap,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService } from '../../services/geminiService';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/dbService';

interface ImageStudioProps {
  onUseAsStoryboard?: (imageUrl: string) => void;
  onAnimateWithVeo?: (imageUrl: string) => void;
}

export default function ImageStudio({ onUseAsStoryboard, onAnimateWithVeo }: ImageStudioProps) {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '9:16' | '16:9' | '4:3' | '3:4'>('1:1');
  const [imageSize, setImageSize] = useState<'1K' | '2K'>('1K');
  const [mode, setMode] = useState<'generate' | 'edit'>('generate');
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<'gemini-nano-banana-2.1' | 'gemini-3.1-flash-lite-image'>('gemini-nano-banana-2.1');
  const [modelUsed, setModelUsed] = useState('gemini-nano-banana-2.1');
  const [copied, setCopied] = useState(false);

  const PRESET_IDEAS = [
    'Arri Alexa 35mm cinematic shot of luxury perfume bottle on wet basalt rock, cyan rim light',
    'High-fashion streetwear model under Tokyo neon billboard rain, kodak portra 400 tones',
    'Bangalore modern minimalist coffee roastery counter, warm sunlight beams, 8k commercial photography',
    'Futuristic carbon fiber wireless headphones floating against matte black pedestal, studio softbox'
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { alert('Choose a PNG, JPEG or WebP image up to 10 MB.'); return; }
      const reader = new FileReader();
      reader.onload = (event) => {
        setSourceImage(event.target?.result as string);
        setMode('edit');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExecute = async () => {
    if (!prompt.trim()) return;
    if (mode === 'edit' && !sourceImage) { alert('Upload an image to edit.'); return; }
    setResultImage(null);
    setCaption('');
    setLoading(true);
    try {
      if (mode === 'edit' && sourceImage) {
        const res = await geminiService.editImage(prompt, sourceImage, 'image/png', aspectRatio, selectedModel, imageSize);
        setResultImage(res.imageUrl);
        setCaption(res.caption || prompt);
        setModelUsed(res.modelUsed || 'gemini-nano-banana-2.1');
      } else {
        const res = await geminiService.generateImage(prompt, aspectRatio, imageSize, selectedModel);
        setResultImage(res.imageUrl);
        setCaption(res.caption || prompt);
        setModelUsed(res.modelUsed || selectedModel);
      }

      // Notify completion; binary assets are stored by the server.
      if (user?.uid) {
        dbService.addNotification({
          userId: user.uid,
          title: 'Image Rendered',
          message: `Created with ${selectedModel}: "${prompt.slice(0, 30)}..."`,
          type: 'deliverable'
        }).catch(() => {});
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Image processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Mode Switcher */}
      <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
        <button
          type="button"
          onClick={() => setMode('generate')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mode === 'generate'
              ? 'bg-gradient-to-r from-sleek-violet to-sleek-fuchsia text-white shadow-lg'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <Wand2 size={14} />
          <span>Text-to-Image</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('edit')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mode === 'edit'
              ? 'bg-gradient-to-r from-sleek-violet to-sleek-fuchsia text-white shadow-lg'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <Layers size={14} />
          <span>Image Editor</span>
        </button>
      </div>

      {/* Nano Banana Model Engine Selector */}
      <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-purple-500/10 rounded-2xl border border-amber-500/20 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🍌</span>
            <div>
              <span className="text-xs font-bold text-white tracking-wide block">Nano Banana Engine</span>
              <span className="text-[10px] text-amber-300/80 font-mono">Google Gemini Image Generation Family</span>
            </div>
          </div>
          <span className="text-[9px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/30 font-bold">
            Nano Banana
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setSelectedModel('gemini-nano-banana-2.1')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedModel === 'gemini-nano-banana-2.1'
                ? 'bg-amber-400/15 border-amber-400 text-white shadow-md shadow-amber-500/10'
                : 'bg-black/30 border-white/5 hover:border-white/20 text-white/60'
            }`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-black text-amber-300">Nano Banana 2.1</span>
              {selectedModel === 'gemini-nano-banana-2.1' && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </div>
            <p className="text-[10px] text-white/50 leading-tight">
              Commercial Master • 1K/2K resolution & high fidelity
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedModel('gemini-3.1-flash-lite-image')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedModel === 'gemini-3.1-flash-lite-image'
                ? 'bg-cyan-400/15 border-cyan-400 text-white shadow-md shadow-cyan-500/10'
                : 'bg-black/30 border-white/5 hover:border-white/20 text-white/60'
            }`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-black text-cyan-300">Nano Banana Lite</span>
              {selectedModel === 'gemini-3.1-flash-lite-image' && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              )}
            </div>
            <p className="text-[10px] text-white/50 leading-tight">
              Rapid Generation • Ultra-fast speed & strict prompt alignment
            </p>
          </button>
        </div>
      </div>

      {/* Source Image Upload Area if Edit Mode */}
      {mode === 'edit' && (
        <div className="p-4 bg-zinc-950/60 rounded-2xl border border-dashed border-white/15 flex flex-col items-center gap-3">
          {sourceImage ? (
            <div className="relative w-full max-h-48 overflow-hidden rounded-xl border border-white/10 group">
              <img src={sourceImage} alt="Source upload" className="w-full h-48 object-cover" />
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold cursor-pointer transition-opacity">
                Change Photo
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          ) : (
            <label className="w-full flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-white/5 rounded-xl transition-colors">
              <Upload size={24} className="text-sleek-violet mb-2" />
              <span className="text-xs font-bold text-white">Upload Base Photo to Edit</span>
              <span className="text-[10px] text-white/40 mt-1">PNG, JPG or WebP (up to 10MB)</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          )}
        </div>
      )}

      {/* Prompt Input Box */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
          {mode === 'edit' ? 'Describe the edits or changes you want' : 'Creative Prompt'}
        </label>
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={mode === 'edit' ? 'e.g. Add cinematic neon rain reflection, change background to cyberpunk Bangalore, add soft rim light' : 'e.g. Cinematic commercial macro shot of luxury fragrance bottle with crystal droplets, 35mm film grain, 8k'}
            rows={3}
            className="w-full bg-zinc-950/70 border border-white/10 rounded-2xl p-3.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-sleek-violet transition-colors resize-none font-sans"
          />
        </div>
      </div>

      {/* Preset Inspiration Chips */}
      {mode === 'generate' && (
        <div className="flex flex-wrap gap-1.5">
          {PRESET_IDEAS.map((idea, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPrompt(idea)}
              className="text-[10px] bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-2.5 py-1 rounded-lg border border-white/5 transition-all text-left truncate max-w-full cursor-pointer"
            >
              💡 {idea}
            </button>
          ))}
        </div>
      )}

      {/* Aspect Ratio & Resolution Controls */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-bold uppercase text-white/40 tracking-wider">Aspect Ratio</span>
          <div className="grid grid-cols-5 gap-1">
            {(['1:1', '9:16', '16:9', '4:3', '3:4'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setAspectRatio(r)}
                className={`py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                  aspectRatio === r
                    ? 'bg-sleek-violet text-white border-sleek-violet shadow-sm'
                    : 'bg-white/5 text-white/50 border-white/5 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-bold uppercase text-white/40 tracking-wider">Image Quality</span>
          <div className="grid grid-cols-2 gap-1.5">
            {(['1K', '2K'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setImageSize(s)}
                className={`py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                  imageSize === s
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                    : 'bg-white/5 text-white/50 border-white/5 hover:text-white'
                }`}
              >
                {s} Master
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Render Action Button */}
      <button
        type="button"
        onClick={handleExecute}
        disabled={loading || !prompt.trim()}
        className="w-full bg-gradient-to-r from-sleek-violet via-purple-600 to-sleek-fuchsia hover:brightness-110 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-40 cursor-pointer"
      >
        {loading ? (
          <>
            <RefreshCw size={14} className="animate-spin" />
            <span>Rendering with {selectedModel === 'gemini-nano-banana-2.1' ? 'Nano Banana 2.1' : 'Nano Banana Lite'}...</span>
          </>
        ) : (
          <>
            <Sparkles size={14} />
            <span>{mode === 'edit' ? 'Apply AI Edits with Nano Banana' : `Generate Image with ${selectedModel === 'gemini-nano-banana-2.1' ? 'Nano Banana 2.1' : 'Nano Banana Lite'}`}</span>
          </>
        )}
      </button>

      {/* Output Render Card */}
      {resultImage && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-950/80 rounded-3xl border border-white/10 p-4 flex flex-col gap-3 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Check size={12} /> Rendered Successfully
            </span>
            <span className="text-[9px] font-mono text-white/40">{modelUsed}</span>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-white/10 group bg-black">
            <img src={resultImage} alt="Generated asset" className="w-full object-contain max-h-96" />
            <div className="absolute top-3 right-3 flex gap-2">
              <a
                href={resultImage}
                download="onlycreation_studio_frame.png"
                className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                title="Download 8K Image"
              >
                <Download size={16} />
              </a>
            </div>
          </div>

          <p className="text-[11px] text-white/70 italic bg-white/5 p-3 rounded-xl border border-white/5">
            "{caption}"
          </p>

          {/* Workflow Action Bridges */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {onAnimateWithVeo && (
              <button
                type="button"
                onClick={() => onAnimateWithVeo(resultImage)}
                className="py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Zap size={12} />
                <span>Animate with Veo 3</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setSourceImage(resultImage);
                setMode('edit');
                setPrompt('');
              }}
              className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer border border-white/10"
            >
              <Layers size={12} />
              <span>Edit this Frame</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
