import React, { useState, useEffect, useRef } from 'react';
import { 
  Film, 
  Video, 
  Upload, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  Check, 
  Clock, 
  Zap, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService } from '../../services/geminiService';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/dbService';
import { backgroundTaskService } from '../../services/backgroundTaskService';

interface VeoVideoStudioProps {
  initialImage?: string | null;
}

const REASSURING_MESSAGES = [
  'Waiting for Google to finish generating your video...',
  'Generation can take several minutes. You can use other screens while waiting.',
  'Your video will be ready after it is saved securely.'
];

export default function VeoVideoStudio({ initialImage }: VeoVideoStudioProps) {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [startingImage, setStartingImage] = useState<string | null>(initialImage || null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [model, setModel] = useState<'veo-3.1-generate-preview' | 'veo-3.1-fast-generate-preview' | 'veo-3.1-lite-generate-preview'>('veo-3.1-generate-preview');
  const [renderedModel, setRenderedModel] = useState('');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [generating, setGenerating] = useState(false);
  const [progressMsgIndex, setProgressMsgIndex] = useState(0);
  const [operationName, setOperationName] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(console.warn);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (initialImage) {
      setStartingImage(initialImage);
    }
  }, [initialImage]);

  // Cycle reassuring status messages while rendering
  useEffect(() => {
    let interval: any;
    if (generating) {
      interval = setInterval(() => {
        setProgressMsgIndex((prev) => (prev + 1) % REASSURING_MESSAGES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [generating]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { setErrorMessage('Choose a PNG, JPEG or WebP image up to 10 MB.'); return; }
      const reader = new FileReader();
      reader.onload = (event) => {
        setStartingImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check for any ongoing video generation from backgroundTaskService on mount
  useEffect(() => {
    const runningVideoTasks = backgroundTaskService.getAllTasks().filter(t => t.type === 'video_generation');
    if (runningVideoTasks.length > 0) {
      const latest = runningVideoTasks[0];
      if (latest.status === 'RUNNING' && latest.operationName) {
        setOperationName(latest.operationName);
        setGenerating(true);
      } else if (latest.status === 'COMPLETED' && latest.resultUrl) {
        setVideoUrl(latest.resultUrl);
        setGenerating(false);
      }
    }

    const unsubscribe = backgroundTaskService.subscribe((tasks) => {
      const active = tasks.find(t => t.type === 'video_generation' && t.operationName === operationName);
      if (active) {
        if (active.status === 'COMPLETED' && active.resultUrl) {
          setVideoUrl(active.resultUrl);
          setGenerating(false);
        } else if (active.status === 'FAILED') {
          setErrorMessage(active.error || 'Video rendering failed');
          setGenerating(false);
        }
      }
    });

    return unsubscribe;
  }, [operationName]);

  const handleGenerate = async () => {
    if (!prompt.trim() && !startingImage) {
      setErrorMessage('Please enter a motion prompt or upload a starting frame.');
      return;
    }

    setErrorMessage(null);
    setGenerating(true);
    setVideoUrl(null);
    try {
      const payload: any = {
        prompt: prompt || 'Smooth cinematic forward dolly shot, atmospheric lighting, 8k commercial quality',
        aspectRatio,
        resolution,
        model
      };

      if (startingImage) {
        payload.image = {
          data: startingImage,
          mimeType: 'image/png'
        };
      }

      const res = await geminiService.generateVideo(payload);
      setOperationName(res.operationName);
      setRenderedModel(res.model);

      // Register task into global Background Task Manager
      backgroundTaskService.addTask({
        id: `video_${res.operationName}`,
        type: 'video_generation',
        title: prompt.slice(0, 40) || 'Veo Cinematic Generation',
        status: 'RUNNING',
        operationName: res.operationName,
        progress: 10
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Veo video generation failed');
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Spec Header */}
      <div className="p-4 bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-zinc-950/80 rounded-2xl border border-blue-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/20 text-cyan-300 rounded-xl">
            <Video size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-white">Veo 3 Video Generation</h3>
              <span className="text-[8px] font-mono uppercase bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold">
                {renderedModel || model}
              </span>
            </div>
            <p className="text-[10px] text-white/50 mt-0.5">High-definition Text-to-Video & Image-to-Video motion animation</p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-white/40 hover:text-white">✕</button>
        </div>
      )}

      {/* Starting Image Upload (for Animate Images into Video) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
            Starting Image / Storyboard Frame (Optional)
          </label>
          {startingImage && (
            <button
              type="button"
              onClick={() => setStartingImage(null)}
              className="text-[10px] text-rose-400 hover:underline cursor-pointer"
            >
              Clear Image
            </button>
          )}
        </div>

        {startingImage ? (
          <div className="relative rounded-2xl overflow-hidden border border-white/10 group h-44 bg-black">
            <img src={startingImage} alt="Starting frame" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
              <span className="text-[10px] font-bold text-white flex items-center gap-1.5">
                <Check size={12} className="text-emerald-400" />
                Frame loaded for Veo 3 Motion Synthesis
              </span>
            </div>
          </div>
        ) : (
          <label className="border border-dashed border-white/15 hover:border-blue-500/50 bg-white/5 hover:bg-white/[0.08] rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
            <Upload size={20} className="text-blue-400" />
            <span className="text-xs font-bold text-white">Upload Photo to Animate with Veo</span>
            <span className="text-[10px] text-white/40">PNG, JPEG, WebP (up to 10MB)</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        )}
      </div>

      {/* Motion Direction Prompt */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
          Camera Motion & Action Description
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={startingImage ? 'e.g. Slow cinematic push-in dolly shot, smoke drifting softly in background, soft camera breathe' : 'e.g. A neon hologram of a futuristic sports car driving through a misty Bangalore night road at top speed, 35mm film'}
          rows={3}
          className="w-full bg-zinc-950/70 border border-white/10 rounded-2xl p-3.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-blue-500 transition-colors resize-none font-sans"
        />
      </div>

      <label className="text-xs text-white/70">
        Veo model
        <select value={model} disabled={generating} onChange={e => setModel(e.target.value as typeof model)} className="block w-full mt-2 p-3 bg-zinc-950 border border-white/10 rounded-xl text-white">
          <option value="veo-3.1-generate-preview">Veo 3.1 — Quality</option>
          <option value="veo-3.1-fast-generate-preview">Veo 3.1 Fast — Speed</option>
          <option value="veo-3.1-lite-generate-preview">Veo 3.1 Lite — Economy</option>
        </select>
      </label>
      {/* Controls: Aspect Ratio & Resolution */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-bold uppercase text-white/40 tracking-wider">Aspect Ratio (Veo Standard)</span>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: '16:9', label: '16:9 Landscape' },
              { id: '9:16', label: '9:16 Portrait Reels' }
            ].map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setAspectRatio(r.id as any)}
                className={`py-2 rounded-xl text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                  aspectRatio === r.id
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-white/5 text-white/50 border-white/5 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-bold uppercase text-white/40 tracking-wider">Resolution</span>
          <div className="grid grid-cols-2 gap-1.5">
            {['720p', '1080p'].map(res => (
              <button
                key={res}
                type="button"
                onClick={() => setResolution(res as any)}
                className={`py-2 rounded-xl text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                  resolution === res
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-white/5 text-white/50 border-white/5 hover:text-white'
                }`}
              >
                {res} HD
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={generating}
        className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:brightness-110 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-40 cursor-pointer"
      >
        {generating ? (
          <>
            <RefreshCw size={16} className="animate-spin" />
            <span>Rendering Veo 3 Video...</span>
          </>
        ) : (
          <>
            <Film size={16} />
            <span>{startingImage ? 'Animate Image with Veo 3' : 'Generate Video from Prompt'}</span>
          </>
        )}
      </button>

      {/* Loading & Reassuring Messages State */}
      {generating && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-950/80 p-5 rounded-3xl border border-blue-500/20 flex flex-col items-center text-center gap-3"
        >
          <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-cyan-400 animate-spin flex items-center justify-center">
            <Video size={18} className="text-cyan-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Veo 3 Neural Video Engine Active</h4>
            <p className="text-[11px] text-cyan-300 font-mono mt-1 animate-pulse">
              {REASSURING_MESSAGES[progressMsgIndex]}
            </p>
          </div>
          <span className="text-[9px] text-white/40">
            High-definition video rendering takes a brief moment. You can continue using the app.
          </span>
        </motion.div>
      )}

      {/* Video Output Player */}
      {videoUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-950/90 rounded-3xl border border-white/10 p-4 flex flex-col gap-3 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Check size={12} /> Video Ready • Veo 3 Neural Reel
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-white/40">{aspectRatio} • {resolution}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 font-mono">
                Manual Play
              </span>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black aspect-video flex items-center justify-center group">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              playsInline
              muted={isMuted}
              preload="metadata"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              className="w-full h-full object-contain"
            />

            {/* Manual Play Overlay when Paused */}
            {!isPlaying && (
              <div 
                onClick={togglePlay}
                className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex flex-col items-center justify-center gap-3 cursor-pointer transition-opacity"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  className="w-16 h-16 rounded-full bg-gradient-to-tr from-sleek-violet to-sleek-fuchsia text-white flex items-center justify-center shadow-2xl shadow-purple-500/30 hover:scale-110 active:scale-95 transition-all"
                  title="Play Video"
                >
                  <Play size={26} className="fill-current ml-1" />
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-white tracking-wide">
                    Press to Play Reel Preview
                  </span>
                  <span className="text-[10px] text-white/50">
                    Autoplay is disabled per your settings
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center gap-2 transition-colors"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} className="fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="px-3.5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <a
              href={videoUrl}
              download="onlycreation_veo_production.mp4"
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:opacity-95"
            >
              <Download size={14} />
              <span>Download MP4 Reel</span>
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
}
