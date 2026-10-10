import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw, 
  Bot, 
  ExternalLink,
  DollarSign,
  Download,
  Share2
} from 'lucide-react';
import { ExecutiveBriefing } from '../../types';

interface ExecutiveBriefingViewProps {
  briefing: ExecutiveBriefing;
  onRefreshBriefing: () => void;
  onNavigateToApprovals: () => void;
}

export default function ExecutiveBriefingView({
  briefing,
  onRefreshBriefing,
  onNavigateToApprovals
}: ExecutiveBriefingViewProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleRefresh = async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 800));
    onRefreshBriefing();
    setIsGenerating(false);
  };

  return (
    <div className="space-y-4">
      {/* Executive Hero */}
      <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-sleek-zinc via-indigo-950/20 to-purple-950/30 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sleek-violet/20 text-sleek-violet">
              <FileText size={18} />
            </span>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              {briefing.title}
            </h2>
          </div>
          <p className="text-xs text-white/50">
            Generated {briefing.generatedAt} · Prepared autonomously for CEO & CXO Leadership
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isGenerating}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={`text-sleek-violet ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Synthesizing Briefing...' : 'Regenerate Briefing'}</span>
          </button>
        </div>
      </div>

      {/* CEO Impact Metrics 4-Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-sleek-zinc border border-white/10 space-y-1">
          <span className="text-white/50 text-xs flex items-center gap-1.5">
            <Clock size={13} className="text-emerald-400" />
            CEO Time Saved
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white font-mono">{briefing.timeSavedForCeoHours}h</span>
            <span className="text-[11px] text-emerald-400 font-mono">+12h vs last wk</span>
          </div>
          <span className="text-[10px] text-white/40 block">Routine busywork eliminated</span>
        </div>

        <div className="p-4 rounded-xl bg-sleek-zinc border border-white/10 space-y-1">
          <span className="text-white/50 text-xs flex items-center gap-1.5">
            <Bot size={13} className="text-sleek-violet" />
            Autonomous Actions
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white font-mono">{briefing.decisionsResolvedAutonomously}</span>
            <span className="text-[11px] text-white/40 font-mono">decisions</span>
          </div>
          <span className="text-[10px] text-white/40 block">Resolved without executive ping</span>
        </div>

        <div className="p-4 rounded-xl bg-sleek-zinc border border-white/10 space-y-1">
          <span className="text-white/50 text-xs flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-amber-400" />
            Pending Sign-Offs
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-amber-300 font-mono">{briefing.pendingApprovalsCount}</span>
            <span className="text-[11px] text-amber-400 font-mono">high impact</span>
          </div>
          <button
            onClick={onNavigateToApprovals}
            className="text-[10px] text-sleek-violet hover:underline block pt-0.5"
          >
            Review in Queue →
          </button>
        </div>

        <div className="p-4 rounded-xl bg-sleek-zinc border border-white/10 space-y-1">
          <span className="text-white/50 text-xs flex items-center gap-1.5">
            <DollarSign size={13} className="text-cyan-400" />
            Gross Operating Margin
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-cyan-300 font-mono">41.8%</span>
            <span className="text-[11px] text-cyan-400 font-mono">target 35%</span>
          </div>
          <span className="text-[10px] text-white/40 block">Audited by Vault AI</span>
        </div>
      </div>

      {/* Executive Summary Paragraph */}
      <div className="p-4 md:p-5 rounded-2xl bg-sleek-zinc border border-white/10 space-y-2">
        <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-2">
          <Sparkles size={14} className="text-sleek-violet" />
          Executive Operations Summary
        </h3>
        <p className="text-xs md:text-sm text-white/90 leading-relaxed font-sans bg-black/40 p-4 rounded-xl border border-white/5">
          {briefing.executiveSummary}
        </p>
      </div>

      {/* Department Health Snapshots */}
      <div className="p-4 md:p-5 rounded-2xl bg-sleek-zinc border border-white/10 space-y-3">
        <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">
          Department Snapshots & AI Manager Status
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {briefing.departmentSnapshots.map((snap, idx) => {
            const isOptimal = snap.status === 'optimal';

            return (
              <div 
                key={idx}
                className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{snap.departmentName}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                    isOptimal 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                  }`}>
                    {isOptimal ? 'OPTIMAL' : 'ATTENTION'}
                  </span>
                </div>

                <p className="text-xs text-white/70 leading-relaxed">
                  {snap.highlight}
                </p>

                <div className="text-[10px] text-white/40 pt-1 flex items-center justify-between border-t border-white/5">
                  <span>Manager: {snap.managerName}</span>
                  <span className="text-emerald-400 font-mono">100% Pipeline Health</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strategic CEO Recommendations */}
      <div className="p-4 md:p-5 rounded-2xl bg-sleek-zinc border border-white/10 space-y-3">
        <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp size={14} className="text-sleek-violet" />
          Strategic Recommendations for Leadership
        </h3>

        <div className="space-y-2">
          {briefing.strategicRecommendations.map((rec, idx) => (
            <div 
              key={idx}
              className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-start gap-3 text-xs"
            >
              <span className="w-5 h-5 rounded-md bg-sleek-violet/20 text-sleek-violet flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="text-white/80 leading-relaxed flex-1">
                {rec}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
