import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Layers, 
  ShieldAlert, 
  Plus, 
  Loader2, 
  FileText,
  Play,
  RotateCcw,
  Check
} from 'lucide-react';
import { BrandProfile, Employee } from '../../types';

interface PlannedTask {
  id: string;
  title: string;
  description: string;
  assignedType: 'agent' | 'employee';
  assignedTo: string;
  assignedName: string;
  assignedRole?: string;
  deadline: string;
  dependencies?: string[];
  requiresApproval: boolean;
  status: 'assigned' | 'in_progress' | 'ready_for_review' | 'completed';
  deliverablePreview?: string;
}

interface GoalCoordinatorViewProps {
  brandProfile: BrandProfile;
  workspaceEmployees: Employee[];
  onNavigateToStudio?: (tab?: string, prompt?: string) => void;
  onCommitTasksToBoard?: (tasks: PlannedTask[]) => void;
}

export default function GoalCoordinatorView({
  brandProfile,
  workspaceEmployees,
  onNavigateToStudio,
  onCommitTasksToBoard
}: GoalCoordinatorViewProps) {
  const [goalInput, setGoalInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result state
  const [campaignTitle, setCampaignTitle] = useState<string | null>(null);
  const [managerBriefing, setManagerBriefing] = useState<string | null>(null);
  const [missingQuestions, setMissingQuestions] = useState<string[]>([]);
  const [taskPlan, setTaskPlan] = useState<PlannedTask[]>([]);
  const [isCommitted, setIsCommitted] = useState(false);

  const QUICK_GOALS = [
    'Create a campaign for this product and have my editor prepare three reels.',
    'Launch a 7-day TikTok & Reel growth blitz with Google Search grounding and 5 viral hooks.',
    'Produce a cinematic luxury commercial with script, storyboard, and DaVinci color grading pass.'
  ];

  const handleCoordinate = async (goalText?: string) => {
    const text = goalText || goalInput;
    if (!text.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setIsCommitted(false);

    try {
      const res = await fetch('/api/team-hub/coordinate-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: text,
          brandProfile,
          workspaceMembers: workspaceEmployees.map(e => ({
            displayName: e.name,
            role: e.role,
            userId: e.id
          }))
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Coordination failed');

      setCampaignTitle(data.campaignTitle);
      setManagerBriefing(data.managerBriefing);
      setMissingQuestions(data.missingClarifications || []);
      setTaskPlan(data.taskPlan || []);
      if (!goalText) setGoalInput('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to coordinate goal with manager.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommitPlan = () => {
    if (onCommitTasksToBoard && taskPlan.length > 0) {
      onCommitTasksToBoard(taskPlan);
      setIsCommitted(true);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Description Box */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles size={16} className="text-sleek-violet" />
            <span>Coordinating Project Manager (Nova & Multi-Agent Dispatcher)</span>
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Describe high-level goals naturally. Nova analyzes context, asks essential questions, delegates to specialists & real crew members, and tracks dependencies.
          </p>
        </div>

        {/* Quick Example Presets */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-white/40 font-mono">Quick:</span>
          {QUICK_GOALS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setGoalInput(q);
                handleCoordinate(q);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/70 hover:text-white transition-colors text-left truncate max-w-[220px]"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Goal Input Bar */}
      <div className="p-3 bg-black/40 border border-white/10 rounded-2xl shadow-xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sleek-violet/15 text-sleek-violet">
            <Bot size={18} />
          </div>
          <input
            type="text"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) handleCoordinate();
            }}
            placeholder='e.g. "Create a campaign for this product and have my editor prepare three reels."'
            className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none placeholder:text-white/30"
          />
          <button
            disabled={!goalInput.trim() || isLoading}
            onClick={() => handleCoordinate()}
            className="px-4 py-2 rounded-xl bg-sleek-violet hover:bg-sleek-violet/90 disabled:opacity-40 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 shadow-md"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            <span>Coordinate Goal</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-white/40 hover:text-white">×</button>
        </div>
      )}

      {/* PLAN OUTPUT DISPLAY */}
      {managerBriefing && (
        <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 animate-fade-in">
          {/* Header & Strategic Briefing */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-sleek-violet font-semibold font-mono">
                Campaign Plan · {taskPlan.length} Tasks Scheduled
              </span>
              <h3 className="text-xl font-bold text-white mt-0.5">
                {campaignTitle}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={isCommitted}
                onClick={handleCommitPlan}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md ${
                  isCommitted 
                    ? 'bg-emerald-600 text-white cursor-default' 
                    : 'bg-sleek-violet hover:bg-sleek-violet/90 text-white'
                }`}
              >
                {isCommitted ? <Check size={14} /> : <Layers size={14} />}
                <span>{isCommitted ? 'Committed to Operations Board' : 'Assign All to Operations Board'}</span>
              </button>
            </div>
          </div>

          {/* Manager Strategy Rationale */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-white/80 leading-relaxed">
            <strong className="text-white block font-semibold mb-1 flex items-center gap-1.5">
              <Bot size={13} className="text-sleek-violet" />
              Lead Project Manager Directive:
            </strong>
            <p>{managerBriefing}</p>
          </div>

          {/* Missing Questions from Client if Any */}
          {missingQuestions.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
              <strong className="text-amber-300 font-semibold flex items-center gap-1.5">
                <AlertCircle size={14} />
                Clarifying Questions for Executive Confirmation:
              </strong>
              <ul className="list-disc list-inside space-y-1 text-white/80">
                {missingQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Breakdown Task Plan */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Multidisciplinary Delegated Task Plan
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {taskPlan.map((task) => (
                <div 
                  key={task.id}
                  className="p-4 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold flex items-center gap-1 ${
                        task.assignedType === 'agent' 
                          ? 'bg-sleek-violet/20 text-sleek-violet border border-sleek-violet/30' 
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {task.assignedType === 'agent' ? <Bot size={11} /> : <User size={11} />}
                        <span>{task.assignedName}</span>
                      </span>

                      <span className="text-[10px] text-white/40 flex items-center gap-1 font-mono">
                        <Clock size={10} /> {task.deadline}
                      </span>
                    </div>

                    <h5 className="font-bold text-sm text-white">{task.title}</h5>
                    <p className="text-white/60 leading-relaxed text-[11px]">{task.description}</p>

                    {task.dependencies && task.dependencies.length > 0 && (
                      <div className="text-[10px] text-white/40">
                        Prerequisites: {task.dependencies.join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                      task.requiresApproval 
                        ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20' 
                        : 'bg-white/5 text-white/40'
                    }`}>
                      {task.requiresApproval ? 'Requires CEO Sign-off' : 'Autonomous Delivery'}
                    </span>

                    {onNavigateToStudio && (
                      <button
                        onClick={() => onNavigateToStudio('campaign', task.title)}
                        className="text-[11px] text-sleek-violet hover:text-sleek-fuchsia transition-colors flex items-center gap-1"
                      >
                        Execute in Studio <ArrowRight size={10} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
