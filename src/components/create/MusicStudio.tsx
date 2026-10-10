import React, { useState } from 'react';
import { 
  Music, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Play, 
  Pause, 
  Volume2, 
  Check, 
  Radio, 
  SlidersHorizontal,
  Upload
} from 'lucide-react';
import { motion } from 'motion/react';
import { geminiService } from '../../services/geminiService';
import { useAuth } from '../../context/AuthContext';

export default function MusicStudio() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'clip' | 'full'>('clip');
  const [imageContext, setImageContext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const GENRE_PRESETS = [
    '80s Synthwave retro highway cruise with nostalgic chorus synth pads',
    'Deep cinematic orchestral strings building to an epic crescendo, Hans Zimmer vibe',
    'Upbeat modern lo-fi hip hop beat with warm rhodes piano and vinyl crackle',
    'High-tempo punchy electronic ad jingle with crisp clapping percussion'
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageContext(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setAudioUrl(null);
    try {
      const payload: any = {
        prompt,
        mode
      };
      if (imageContext) {
        payload.image = {
          data: imageContext,
          mimeType: 'image/jpeg'
        };
      }

      const res = await geminiService.generateMusic(prompt, mode, payload.image);
      setAudioUrl(res.audioUrl);
      setLyrics(res.lyrics || null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Music generation failed');
    } finally {
      setLoading(false);
    }
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    if (!audioElement) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setAudioElement(audio);
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-zinc-950/80 rounded-2xl border border-pink-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-pink-500/20 text-pink-300 rounded-xl">
            <Music size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-white">Lyria Music Engine</h3>
              <span className="text-[8px] font-mono uppercase bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full font-bold">
                {mode === 'clip' ? 'lyria-3-clip-preview' : 'lyria-3-pro-preview'}
              </span>
            </div>
            <p className="text-[10px] text-white/50 mt-0.5">Commercial soundtracks, score composition & ad jingles</p>
          </div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
        <button
          type="button"
          onClick={() => setMode('clip')}
          className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            mode === 'clip'
              ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
              : 'text-white/50 hover:text-white'
          }`}
        >
          30s Commercial Clip
        </button>
        <button
          type="button"
          onClick={() => setMode('full')}
          className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            mode === 'full'
              ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
              : 'text-white/50 hover:text-white'
          }`}
        >
          Full Soundtrack
        </button>
      </div>

      {/* Prompt input */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
          Music Direction & Genre Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Dreamy 90s shoegaze guitar riff with shimmering reverb, vintage cassette warmth, subtle lo-fi vocal harmonies"
          rows={3}
          className="w-full bg-zinc-950/70 border border-white/10 rounded-2xl p-3.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-pink-500 transition-colors resize-none font-sans"
        />
      </div>

      {/* Preset Genre Chips */}
      <div className="flex flex-wrap gap-1.5">
        {GENRE_PRESETS.map((genre, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setPrompt(genre)}
            className="text-[10px] bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-2.5 py-1 rounded-lg border border-white/5 transition-all text-left truncate max-w-full cursor-pointer"
          >
            🎵 {genre}
          </button>
        ))}
      </div>

      {/* Optional Visual Context */}
      <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2">
          <Upload size={16} className="text-pink-400" />
          <span className="text-xs font-bold text-white">Visual Cue (Optional)</span>
        </div>
        {imageContext ? (
          <button
            type="button"
            onClick={() => setImageContext(null)}
            className="text-[10px] text-rose-400 font-bold hover:underline cursor-pointer"
          >
            Remove Image
          </button>
        ) : (
          <label className="text-[10px] font-bold text-pink-300 bg-pink-500/10 px-3 py-1 rounded-lg border border-pink-500/20 hover:bg-pink-500/20 cursor-pointer transition-colors">
            Upload Image
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        )}
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
        className="w-full bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:brightness-110 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl shadow-pink-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-40 cursor-pointer"
      >
        {loading ? (
          <>
            <RefreshCw size={16} className="animate-spin" />
            <span>Composing Soundtrack with Lyria...</span>
          </>
        ) : (
          <>
            <Music size={16} />
            <span>Generate Soundtrack Track</span>
          </>
        )}
      </button>

      {/* Audio Player Card */}
      {audioUrl && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-950/90 rounded-3xl border border-pink-500/20 p-5 flex flex-col gap-4 shadow-2xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
              <Check size={12} /> Lyria Master Track Ready
            </span>
            <span className="text-[9px] font-mono text-white/40">{mode === 'clip' ? '30s Clip' : 'Full Track'}</span>
          </div>

          {/* Interactive Player Controls */}
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
            <button
              type="button"
              onClick={togglePlayback}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </button>
            <div className="flex-1">
              <p className="text-xs font-bold text-white truncate">{prompt}</p>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-white/50 font-mono">
                <Volume2 size={12} />
                <span>24kHz Stereo Master • High Fidelity</span>
              </div>
            </div>
          </div>

          {lyrics && (
            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 block mb-1">Theme / Lyrics</span>
              <p className="text-[11px] text-white/80 font-mono whitespace-pre-wrap">{lyrics}</p>
            </div>
          )}

          <a
            href={audioUrl}
            download="onlycreation_soundtrack.wav"
            className="w-full bg-white/10 hover:bg-white/15 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer border border-white/10"
          >
            <Download size={14} />
            <span>Download Master WAV</span>
          </a>
        </motion.div>
      )}
    </div>
  );
}
