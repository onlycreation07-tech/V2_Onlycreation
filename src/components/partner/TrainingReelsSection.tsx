import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Heart, 
  CheckCircle2, 
  Share2, 
  Award, 
  Sparkles, 
  Clock, 
  Eye, 
  BookOpen, 
  ChevronRight, 
  X,
  Zap,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TrainingReel, StakeholderRole } from '../../types/stakeholder';
import { STAKEHOLDER_TRAINING_REELS } from '../../constants/stakeholderData';

interface TrainingReelsSectionProps {
  currentRole: StakeholderRole;
  roleTitle: string;
}

export default function TrainingReelsSection({ currentRole, roleTitle }: TrainingReelsSectionProps) {
  const [reels, setReels] = useState<TrainingReel[]>(() => {
    return STAKEHOLDER_TRAINING_REELS.filter(r => r.roleCategory === currentRole);
  });
  
  // Watch modal state
  const [activeReel, setActiveReel] = useState<TrainingReel | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [likedReels, setLikedReels] = useState<Record<string, boolean>>({});

  // Sync reels if role changes
  React.useEffect(() => {
    const roleReels = STAKEHOLDER_TRAINING_REELS.filter(r => r.roleCategory === currentRole);
    setReels(roleReels.length > 0 ? roleReels : STAKEHOLDER_TRAINING_REELS.slice(0, 2));
  }, [currentRole]);

  const handleToggleLike = (reelId: string) => {
    setLikedReels(prev => {
      const next = !prev[reelId];
      setReels(reelsList => reelsList.map(r => {
        if (r.id === reelId) {
          return { ...r, likes: r.likes + (next ? 1 : -1) };
        }
        return r;
      }));
      return { ...prev, [reelId]: next };
    });
  };

  const handleMarkCompleted = (reelId: string) => {
    setReels(prev => prev.map(r => {
      if (r.id === reelId) {
        return { ...r, completed: true };
      }
      return r;
    }));
    if (activeReel?.id === reelId) {
      setActiveReel(prev => prev ? { ...prev, completed: true } : null);
    }
  };

  const completedCount = reels.filter(r => r.completed).length;
  const progressPct = reels.length > 0 ? Math.round((completedCount / reels.length) * 100) : 100;

  return (
    <div className="flex flex-col gap-5 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sleek-violet/25 via-purple-900/20 to-sleek-fuchsia/20 border border-sleek-violet/40 rounded-3xl p-4 shadow-xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sleek-violet to-sleek-fuchsia flex items-center justify-center shadow-lg shadow-sleek-violet/30">
              <Sparkles size={18} className="text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">Reel Academy & Subject Mastery</h3>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {roleTitle}
                </span>
              </div>
              <p className="text-[11px] text-white/60">
                Short 60-second vertical training reels designed to boost your shoot quality & client ratings.
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <span className="text-base font-black text-emerald-400 font-mono">{progressPct}%</span>
            <span className="block text-[8px] font-bold text-white/40 uppercase tracking-widest">Mastery</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sleek-violet"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-white/50 pt-1 border-t border-white/5">
          <span className="flex items-center gap-1.5 text-white/80 font-medium">
            <Award size={12} className="text-amber-400" />
            <span>{completedCount} of {reels.length} Modules Certified</span>
          </span>
          <span className="text-emerald-400 font-bold">Unlocks +15% Higher Payout Rates</span>
        </div>
      </div>

      {/* Vertical Reels Grid */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-white/80 flex items-center gap-1.5">
            <Flame size={14} className="text-rose-500 fill-rose-500" />
            Essential Subject Reels
          </h4>
          <span className="text-[10px] text-white/40 font-bold">{reels.length} Available</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {reels.map((reel) => {
            const isLiked = !!likedReels[reel.id];
            return (
              <div
                key={reel.id}
                className="bg-sleek-dark rounded-3xl border border-white/10 overflow-hidden shadow-xl hover:border-sleek-violet/40 transition-all flex flex-col group"
              >
                {/* Thumbnail / Video Container */}
                <div 
                  className="relative aspect-[16/10] bg-zinc-950 overflow-hidden cursor-pointer"
                  onClick={() => {
                    setActiveReel(reel);
                    setIsPlaying(true);
                  }}
                >
                  <img 
                    src={reel.thumbnailUrl} 
                    alt={reel.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  {/* Play Overlay Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-sleek-violet/90 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-2xl group-hover:scale-110 group-hover:bg-sleek-violet transition-all">
                      <Play size={20} className="fill-white translate-x-0.5" />
                    </div>
                  </div>

                  {/* Badges on Thumbnail */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase text-amber-300">
                      {reel.difficulty}
                    </span>
                    {reel.completed && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/80 backdrop-blur-md text-[9px] font-black uppercase text-white flex items-center gap-1">
                        <CheckCircle2 size={10} /> Certified
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-white flex items-center gap-1">
                    <Clock size={10} />
                    <span>{reel.duration}</span>
                  </div>

                  {/* Mentor Handle at Bottom Left of Video */}
                  <div className="absolute bottom-2.5 left-3 flex items-center gap-2">
                    <img 
                      src={reel.mentorAvatar} 
                      alt={reel.mentorName} 
                      className="w-6 h-6 rounded-full object-cover border border-white/20"
                    />
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-white leading-tight drop-shadow">{reel.mentorName}</p>
                      <p className="text-[8px] text-white/70 font-mono drop-shadow">{reel.mentorHandle}</p>
                    </div>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-3.5 flex flex-col gap-2.5 flex-1 justify-between">
                  <div className="flex flex-col gap-1 text-left">
                    <h5 className="font-extrabold text-xs text-white group-hover:text-sleek-violet transition-colors line-clamp-1">
                      {reel.title}
                    </h5>
                    <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed">
                      {reel.description}
                    </p>
                  </div>

                  {/* Pro Tip Highlight */}
                  {reel.proTips?.[0] && (
                    <div className="bg-white/5 rounded-xl p-2 border border-white/5 flex items-start gap-1.5 text-left">
                      <Zap size={12} className="text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-white/80 font-medium leading-snug line-clamp-1">
                        <span className="font-bold text-amber-300">Golden Tip: </span>
                        {reel.proTips[0]}
                      </p>
                    </div>
                  )}

                  {/* Footer Row: Metrics & Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-white/40">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye size={11} /> {reel.views.toLocaleString()}
                      </span>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLike(reel.id);
                        }}
                        className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-rose-400 font-bold' : 'hover:text-white'}`}
                      >
                        <Heart size={11} className={isLiked ? 'fill-rose-400 text-rose-400' : ''} />
                        <span>{reel.likes}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveReel(reel);
                        setIsPlaying(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-sleek-violet/20 hover:bg-sleek-violet/40 text-sleek-violet hover:text-white border border-sleek-violet/30 text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1"
                    >
                      <span>Watch & Learn</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FULLSCREEN REEL PLAYER MODAL */}
      <AnimatePresence>
        {activeReel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              className="w-full max-w-sm bg-sleek-dark rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Top Modal Bar */}
              <div className="p-3.5 bg-black/60 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    {roleTitle} Training Reel
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveReel(null)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Video Player Container */}
              <div className="relative aspect-[9/12] bg-black overflow-hidden flex items-center justify-center">
                <video
                  src={activeReel.videoUrl}
                  className="w-full h-full object-cover"
                  controls
                  muted={isMuted}
                  playsInline
                  preload="metadata"
                />

                {/* Overlaid Controls */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10 shadow-lg"
                  >
                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                </div>

                {/* Bottom Overlay with Mentor & Title */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/60 to-transparent p-4 flex flex-col gap-1.5 text-left">
                  <div className="flex items-center gap-2">
                    <img 
                      src={activeReel.mentorAvatar} 
                      alt={activeReel.mentorName} 
                      className="w-7 h-7 rounded-full object-cover border border-white/30"
                    />
                    <div>
                      <p className="text-xs font-extrabold text-white leading-tight">{activeReel.mentorName}</p>
                      <p className="text-[9px] text-white/70 font-mono">{activeReel.mentorHandle}</p>
                    </div>
                  </div>
                  <h4 className="text-sm font-black text-white leading-snug">{activeReel.title}</h4>
                </div>
              </div>

              {/* Pro Takeaways & Action */}
              <div className="p-4 flex flex-col gap-3 bg-sleek-dark overflow-y-auto">
                <div className="flex flex-col gap-1.5 text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sleek-violet flex items-center gap-1">
                    <BookOpen size={12} /> Key Subject Takeaways
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {activeReel.proTips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px] text-white/80 bg-white/5 p-2 rounded-xl border border-white/5">
                        <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certified Completion Button */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleMarkCompleted(activeReel.id)}
                    disabled={activeReel.completed}
                    className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
                      activeReel.completed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-emerald-500/20 active:scale-[0.98]'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    <span>{activeReel.completed ? 'Module Certified & Recorded' : 'Mark as Completed (+10 XP)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleLike(activeReel.id)}
                    className={`p-3 rounded-2xl border transition-all ${
                      likedReels[activeReel.id]
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <Heart size={16} className={likedReels[activeReel.id] ? 'fill-current' : ''} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
