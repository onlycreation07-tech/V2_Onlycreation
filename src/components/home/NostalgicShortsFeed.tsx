import React, { useState, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Heart, 
  MessageCircle, 
  Share2, 
  Sparkles, 
  Radio, 
  Tv, 
  Sliders, 
  Zap,
  X,
  Send,
  Eye,
  Film,
  Disc3,
  Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface NostalgicShort {
  id: string;
  title: string;
  creatorName: string;
  creatorHandle: string;
  creatorAvatar: string;
  videoUrl: string;
  thumbnailUrl: string;
  eraTag: '90s VHS' | 'Y2K Cyber' | 'Super 8mm' | 'Dreamy Indie';
  vibeMusic: string;
  likes: number;
  commentsCount: number;
  location: string;
  dispatchPrompt: string;
  yearStamp: string;
}

export const NOSTALGIC_SHORTS: NostalgicShort[] = [
  {
    id: 'short-1',
    title: 'Late Night Diner Coffee Shoot on 35mm Tape',
    creatorName: 'Aarav Mehta',
    creatorHandle: '@aarav.visuals',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-vintage-retro-car-driving-through-the-city-at-night-42867-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop',
    eraTag: '90s VHS',
    vibeMusic: 'Analog Lo-Fi • Tape Echo 1997',
    likes: 18420,
    commentsCount: 342,
    location: 'Indiranagar 100ft Road',
    dispatchPrompt: 'Vintage 90s warm neon diner shoot with Sony Handycam aesthetic',
    yearStamp: 'AUG 1998'
  },
  {
    id: 'short-2',
    title: 'Cyberpunk Rain Streets & Neon Bokeh Reel',
    creatorName: 'Rhea Sen',
    creatorHandle: '@rhea_shoots',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-futuristic-city-street-with-neon-lights-42903-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
    eraTag: 'Y2K Cyber',
    vibeMusic: 'Synthwave Nightride • Tokyo Drift 2002',
    likes: 24910,
    commentsCount: 512,
    location: 'MG Road Metro Station',
    dispatchPrompt: 'Cyberpunk neon rain aesthetic with anamorphic flares',
    yearStamp: 'OCT 2001'
  },
  {
    id: 'short-3',
    title: 'Golden Hour Indie Film Studio Session',
    creatorName: 'Dev Sharma',
    creatorHandle: '@dev.cinematics',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-with-vintage-sunglasses-under-sunlight-41804-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=800&auto=format&fit=crop',
    eraTag: 'Super 8mm',
    vibeMusic: 'Sunburst Acoustic • 8mm Nostalgia',
    likes: 15300,
    commentsCount: 280,
    location: 'Koramangala 4th Block',
    dispatchPrompt: 'Indie Kodachrome warm golden-hour reel with gentle film grain',
    yearStamp: 'MAY 1994'
  },
  {
    id: 'short-4',
    title: 'Underground Vinyl Record Store Fashion BTS',
    creatorName: 'Maya Kapoor',
    creatorHandle: '@maya.polaroid',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-retro-dj-playing-vinyl-records-in-a-club-42795-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=800&auto=format&fit=crop',
    eraTag: 'Dreamy Indie',
    vibeMusic: 'Vinyl Crackle & Deep House Nostalgia',
    likes: 31800,
    commentsCount: 640,
    location: 'Church Street Underground',
    dispatchPrompt: 'Vinyl store retro fashion reel with zoom cuts and cassette fuzz',
    yearStamp: 'NOV 1999'
  }
];

interface NostalgicShortsFeedProps {
  onShootAesthetic: (prompt: string) => void;
}

export default function NostalgicShortsFeed({ onShootAesthetic }: NostalgicShortsFeedProps) {
  const [activeShort, setActiveShort] = useState<NostalgicShort | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [likedShorts, setLikedShorts] = useState<Record<string, boolean>>({});
  const [showComments, setShowComments] = useState(false);
  const [filterMode, setFilterMode] = useState<'vhs' | 'film' | 'cyber' | 'clean'>('vhs');
  const [vhsGlitch, setVhsGlitch] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [commentsList, setCommentsList] = useState<string[]>([
    'That 90s cassette fuzz tone hits right in the childhood 📼✨',
    'The color grading on this 35mm lens is pure nostalgia!',
    'Need to book this exact shoot vibe for my next EP launch track.',
    'Retro Bangalore streets at midnight hit different ❤️'
  ]);

  const toggleLike = (id: string) => {
    setLikedShorts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setCommentsList([newComment, ...commentsList]);
    setNewComment('');
  };

  return (
    <section className="flex flex-col gap-4">
      {/* Header bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30 animate-pulse">
            <Radio size={14} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
              Nostalgic Reels & Shorts
              <span className="text-[9px] font-black uppercase text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                VHS VCR
              </span>
            </h3>
            <p className="text-[10px] text-white/40 font-mono">90s / Y2K Aesthetic Feeds from Local Creators</p>
          </div>
        </div>

        <button 
          onClick={() => setVhsGlitch(!vhsGlitch)}
          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border flex items-center gap-1 transition-all ${
            vhsGlitch 
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
              : 'bg-white/5 text-white/40 border-white/10'
          }`}
        >
          <Tv size={10} /> VHS FX {vhsGlitch ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Horizontal Shorts Reel Strip */}
      <div className="flex gap-3.5 overflow-x-auto hide-scrollbar pb-2">
        {NOSTALGIC_SHORTS.map((short, idx) => {
          const isLiked = !!likedShorts[short.id];
          return (
            <motion.div
              key={short.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.08 }}
              onClick={() => setActiveShort(short)}
              className="flex-shrink-0 w-44 aspect-[9/16] rounded-3xl relative overflow-hidden group cursor-pointer border border-white/10 shadow-2xl bg-zinc-900"
            >
              {/* Thumbnail / Video */}
              <img
                src={short.thumbnailUrl}
                alt={short.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />

              {/* Vintage Grain / VHS Overlay Scanlines */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 pointer-events-none" />
              
              {vhsGlitch && (
                <div 
                  className="absolute inset-0 opacity-25 pointer-events-none mix-blend-overlay"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 2px, transparent 4px)'
                  }}
                />
              )}

              {/* Top Retro Timecode */}
              <div className="absolute top-3 inset-x-3 flex justify-between items-center text-[8px] font-mono text-white/80">
                <span className="bg-red-600/80 px-1.5 py-0.5 rounded text-white font-black flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> REC
                </span>
                <span className="text-white/60 tracking-widest">{short.yearStamp}</span>
              </div>

              {/* Center Play Icon on Hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-sleek-violet/80 backdrop-blur-md flex items-center justify-center text-white shadow-xl">
                  <Play size={20} className="fill-current ml-1" />
                </div>
              </div>

              {/* Bottom Metadata */}
              <div className="absolute bottom-3 inset-x-3 flex flex-col gap-1 z-10">
                <span className="text-[8px] font-extrabold uppercase tracking-widest text-sleek-violet bg-sleek-violet/20 px-2 py-0.5 rounded-full w-fit border border-sleek-violet/30">
                  {short.eraTag}
                </span>
                
                <h4 className="text-white font-bold text-xs line-clamp-2 leading-snug drop-shadow-md">
                  {short.title}
                </h4>

                <div className="flex items-center justify-between text-white/70 text-[9px] mt-0.5 pt-1 border-t border-white/10">
                  <span className="truncate max-w-[90px]">{short.creatorHandle}</span>
                  <span className="flex items-center gap-1">
                    <Heart size={10} className={isLiked ? 'text-red-500 fill-red-500' : ''} />
                    {((short.likes + (isLiked ? 1 : 0)) / 1000).toFixed(1)}k
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Full-Screen Immersive YouTube Shorts / Reels Player Modal */}
      <AnimatePresence>
        {activeShort && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm h-full max-h-[92vh] rounded-[36px] overflow-hidden border border-white/15 shadow-2xl bg-zinc-950 flex flex-col justify-between"
            >
              {/* Background Video Simulator */}
              <div className="absolute inset-0 z-0">
                <img
                  src={activeShort.thumbnailUrl}
                  alt={activeShort.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Nostalgic Overlay Filters */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/60" />

                {filterMode === 'vhs' && (
                  <div 
                    className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 2px, transparent 3px)'
                    }}
                  />
                )}
                {filterMode === 'film' && (
                  <div className="absolute inset-0 bg-amber-500/10 mix-blend-color pointer-events-none" />
                )}
                {filterMode === 'cyber' && (
                  <div className="absolute inset-0 bg-cyan-500/10 mix-blend-color-dodge pointer-events-none" />
                )}
              </div>

              {/* Top Controls Bar */}
              <div className="relative z-20 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-mono text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>PLAY ▶ SP 1998</span>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2.5 rounded-full bg-black/50 text-white/80 hover:text-white border border-white/10"
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <button 
                    onClick={() => setActiveShort(null)}
                    className="p-2.5 rounded-full bg-black/50 text-white/80 hover:text-white border border-white/10"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Filter Switcher Pill */}
              <div className="relative z-20 px-4 flex gap-1.5 overflow-x-auto hide-scrollbar">
                {(['vhs', 'film', 'cyber', 'clean'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider transition-all border ${
                      filterMode === mode 
                        ? 'bg-sleek-violet text-white border-sleek-violet shadow-lg' 
                        : 'bg-black/40 text-white/50 border-white/10'
                    }`}
                  >
                    {mode === 'vhs' ? '📼 90s VHS' : mode === 'film' ? '🎞️ Super 8mm' : mode === 'cyber' ? '⚡ Cyber 2000' : '✨ Clean Cut'}
                  </button>
                ))}
              </div>

              {/* Right Side Shorts Interaction Icons (YouTube Shorts style) */}
              <div className="absolute right-4 bottom-24 z-30 flex flex-col items-center gap-5 text-white">
                {/* Like button */}
                <button 
                  onClick={() => toggleLike(activeShort.id)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className={`p-3 rounded-full backdrop-blur-xl border transition-all ${
                    likedShorts[activeShort.id] 
                      ? 'bg-rose-500 border-rose-400 text-white shadow-xl shadow-rose-500/30 scale-110' 
                      : 'bg-black/40 border-white/15 text-white/80 group-hover:scale-105'
                  }`}>
                    <Heart size={22} className={likedShorts[activeShort.id] ? 'fill-current' : ''} />
                  </div>
                  <span className="text-[10px] font-bold font-mono">
                    {((activeShort.likes + (likedShorts[activeShort.id] ? 1 : 0)) / 1000).toFixed(1)}k
                  </span>
                </button>

                {/* Comments button */}
                <button 
                  onClick={() => setShowComments(!showComments)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="p-3 rounded-full bg-black/40 backdrop-blur-xl border border-white/15 text-white/80 group-hover:scale-105">
                    <MessageCircle size={22} />
                  </div>
                  <span className="text-[10px] font-bold font-mono">{commentsList.length}</span>
                </button>

                {/* Share button */}
                <button 
                  onClick={() => alert(`Reel link copied: ${activeShort.title}`)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="p-3 rounded-full bg-black/40 backdrop-blur-xl border border-white/15 text-white/80 group-hover:scale-105">
                    <Share2 size={22} />
                  </div>
                  <span className="text-[10px] font-bold">Share</span>
                </button>

                {/* Spinning Retro Vinyl Vinyl Reel */}
                <div className="p-2.5 rounded-full bg-black/60 border border-sleek-violet/40 text-sleek-violet animate-spin">
                  <Disc3 size={20} />
                </div>
              </div>

              {/* Bottom Creator & Shoot Action Bar */}
              <div className="relative z-20 p-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={activeShort.creatorAvatar}
                    alt={activeShort.creatorName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-sleek-violet shadow-lg"
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-extrabold text-sm">{activeShort.creatorName}</span>
                      <span className="text-[8px] font-bold bg-sleek-violet/30 text-sleek-violet px-1.5 py-0.2 rounded">PRO</span>
                    </div>
                    <span className="text-white/50 text-[10px] font-mono">{activeShort.creatorHandle} • {activeShort.location}</span>
                  </div>
                </div>

                <p className="text-xs text-white/90 font-medium line-clamp-2 leading-relaxed">
                  {activeShort.title}
                </p>

                {/* Vibe soundtrack ticker */}
                <div className="flex items-center gap-2 text-[10px] text-sleek-fuchsia font-mono bg-sleek-fuchsia/10 px-3 py-1.5 rounded-xl border border-sleek-fuchsia/20 w-fit">
                  <Disc3 size={12} className="animate-spin" />
                  <span>{activeShort.vibeMusic}</span>
                </div>

                {/* Action: Book Nearby Creator with this Aesthetic */}
                <button
                  onClick={() => {
                    const prompt = activeShort.dispatchPrompt;
                    setActiveShort(null);
                    onShootAesthetic(prompt);
                  }}
                  className="w-full bg-gradient-to-r from-rose-500 via-sleek-violet to-sleek-fuchsia text-white py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-sleek-violet/30 hover:brightness-110 active:scale-95 transition-all"
                >
                  <Zap size={14} className="fill-current text-yellow-300" />
                  Shoot This Aesthetic Now (On-Demand Dispatch)
                </button>
              </div>

              {/* Comments Sliding Drawer */}
              <AnimatePresence>
                {showComments && (
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    className="absolute inset-x-0 bottom-0 top-1/3 bg-zinc-950/95 backdrop-blur-2xl rounded-t-[32px] border-t border-white/15 p-5 z-40 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <span className="text-xs font-black uppercase tracking-widest text-white/80">
                        Nostalgic Comments ({commentsList.length})
                      </span>
                      <button 
                        onClick={() => setShowComments(false)}
                        className="text-white/40 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto hide-scrollbar py-3 flex flex-col gap-3">
                      {commentsList.map((comm, i) => (
                        <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/5 text-xs text-white/80 leading-relaxed">
                          {comm}
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-white/10">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Drop a vintage vibe thought..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-sleek-violet"
                      />
                      <button 
                        type="submit"
                        className="p-2.5 bg-sleek-violet text-white rounded-xl hover:bg-sleek-violet/80"
                      >
                        <Send size={14} />
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
