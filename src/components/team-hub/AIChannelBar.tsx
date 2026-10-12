import React, { useState } from 'react';
import { 
  Sparkles, 
  Bot, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight, 
  FileText, 
  Plus, 
  X, 
  Loader2, 
  Sliders, 
  Power,
  Bell,
  MessageSquare,
  Send,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  AISummaryResult, 
  AIDigestResult, 
  AISummaryClarifyingQuestion, 
  Channel, 
  WorkspaceMessage 
} from '../../types/teamHub';
import { teamHubChatService } from '../../services/teamHubChatService';

interface AIChannelBarProps {
  workspaceId: string;
  channel: Channel;
  onOpenTaskModalWithItem?: (title: string) => void;
  onToggleAi: (enabled: boolean) => void;
  onOpenRemindersModal?: () => void;
  onOpenAiControlsModal?: () => void;
  onPostClarifyingQuestion?: (question: string) => void;
}

export default function AIChannelBar({
  workspaceId,
  channel,
  onOpenTaskModalWithItem,
  onToggleAi,
  onOpenRemindersModal,
  onOpenAiControlsModal,
  onPostClarifyingQuestion
}: AIChannelBarProps) {
  const isAiActive = channel.isAiEnabled !== false;
  const [summaryData, setSummaryData] = useState<AISummaryResult | null>(null);
  const [digestData, setDigestData] = useState<AIDigestResult | null>(null);
  const [clarifyingQuestions, setClarifyingQuestions] = useState<AISummaryClarifyingQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'digest' | 'clarify' | null>(null);

  const handleRunSummary = async () => {
    if (!isAiActive) return;
    try {
      setIsLoading(true);
      setLoadingMessage('Gemini 3.8 Flash is analyzing conversation milestones and blockers...');
      setActiveTab('summary');
      const res = await teamHubChatService.summarizeChannel(workspaceId, channel.id);
      setSummaryData(res);
      if (res.clarifyingQuestions && res.clarifyingQuestions.length > 0) {
        setClarifyingQuestions(res.clarifyingQuestions);
      }
    } catch (err: any) {
      alert(err.message || 'Summarization failed');
      setActiveTab(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunDigest = async () => {
    if (!isAiActive) return;
    try {
      setIsLoading(true);
      setLoadingMessage('Aggregating active department initiatives into operations digest...');
      setActiveTab('digest');
      const res = await teamHubChatService.generateDigest(workspaceId, 'daily');
      setDigestData(res);
    } catch (err: any) {
      alert(err.message || 'Digest generation failed');
      setActiveTab(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunClarify = async () => {
    if (!isAiActive) return;
    try {
      setIsLoading(true);
      setLoadingMessage('Detecting ambiguous responsibilities, missing owners, and deadlines...');
      setActiveTab('clarify');
      const questions = await teamHubChatService.getClarifyingQuestions(workspaceId, channel.id);
      setClarifyingQuestions(questions);
    } catch (err: any) {
      alert(err.message || 'Clarification check failed');
      setActiveTab(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-b border-white/10 bg-[#0B0F19]">
      {/* Primary Indicator Strip */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {isAiActive ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-semibold">AI Operations Active in #{channel.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-white/40">
              <span className="w-2 h-2 rounded-full bg-white/20" />
              <span className="text-[11px]">AI Assistant Disabled (Human-led mode)</span>
            </div>
          )}

          <span className="text-white/20 hidden sm:inline" aria-hidden="true">·</span>
          <span className="text-[10px] text-white/40 hidden md:inline">
            {isAiActive
              ? 'Authorized to summarize, extract tasks, ask clarifying questions, and detect blockers. Private DMs excluded.'
              : 'Messages in this channel are not processed or analyzed by AI.'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {isAiActive && (
            <>
              {/* Summarize */}
              <button
                type="button"
                onClick={handleRunSummary}
                disabled={isLoading}
                aria-label="Summarize channel conversation"
                className="px-2.5 py-1 bg-white/5 hover:bg-sleek-violet/20 border border-white/10 hover:border-sleek-violet/40 rounded-lg text-white/80 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition-all"
                title="Summarize key decisions, tasks, and blockers"
              >
                <Sparkles size={12} className="text-sleek-violet" />
                <span>Summarize</span>
              </button>

              {/* Clarify Ambiguities */}
              <button
                type="button"
                onClick={handleRunClarify}
                disabled={isLoading}
                aria-label="Ask clarifying questions"
                className="px-2.5 py-1 bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 rounded-lg text-white/80 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition-all"
                title="Detect missing owners, deadlines, or ambiguous decisions"
              >
                <HelpCircle size={12} className="text-amber-400" />
                <span>Clarify</span>
              </button>

              {/* Daily Digest */}
              <button
                type="button"
                onClick={handleRunDigest}
                disabled={isLoading}
                aria-label="Generate daily operations digest"
                className="px-2.5 py-1 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/40 rounded-lg text-white/80 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition-all"
                title="Executive daily operations summary"
              >
                <FileText size={12} className="text-purple-400" />
                <span>Daily Digest</span>
              </button>

              {/* Reminders Modal Trigger */}
              {onOpenRemindersModal && (
                <button
                  type="button"
                  onClick={onOpenRemindersModal}
                  aria-label="Open configured reminders"
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 hover:text-white text-[11px] font-medium flex items-center gap-1 transition-all"
                  title="Schedule and configure team reminders"
                >
                  <Bell size={12} className="text-cyan-400" />
                  <span className="hidden sm:inline">Reminders</span>
                </button>
              )}
            </>
          )}

          {/* Granular AI Controls Trigger */}
          {onOpenAiControlsModal && (
            <button
              type="button"
              onClick={onOpenAiControlsModal}
              aria-label="Configure 5 AI controls"
              className="p-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all"
              title="Granular AI Participation Controls"
            >
              <Sliders size={13} />
            </button>
          )}

          {/* Quick Channel Toggle Button */}
          <button
            type="button"
            onClick={() => onToggleAi(!isAiActive)}
            className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-colors ${
              isAiActive
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
            }`}
            title={isAiActive ? 'Turn AI OFF in this channel' : 'Turn AI ON in this channel'}
          >
            <Power size={11} />
            <span>{isAiActive ? 'Turn Off' : 'Enable'}</span>
          </button>
        </div>
      </div>

      {/* Loading state indicator */}
      {isLoading && (
        <div className="px-4 py-3 bg-sleek-violet/5 border-t border-white/5 flex items-center gap-2 text-xs text-white/70">
          <Loader2 size={14} className="animate-spin text-sleek-violet" />
          <span>{loadingMessage || 'Gemini 3.8 Flash is processing channel discussions...'}</span>
        </div>
      )}

      {/* 1. Expanded AI Insights Panel (Summary) */}
      {activeTab === 'summary' && summaryData && !isLoading && (
        <div className="px-4 py-3 bg-[#0F172A] border-t border-white/10 space-y-3 animate-fade-in text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Sparkles size={14} className="text-sleek-violet" />
              Executive Conversation Summary
            </h4>
            <button
              type="button"
              onClick={() => setActiveTab(null)}
              className="text-white/40 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-white/90 leading-relaxed bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
            {summaryData.summary}
          </p>

          {/* Grid of Decisions & Action Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Approved Decisions */}
            <div className="p-3 bg-black/30 rounded-xl border border-white/5 space-y-1.5">
              <span className="font-semibold text-emerald-400 text-[11px] uppercase tracking-wider block">
                ✓ Confirmed Decisions ({summaryData.decisions.length})
              </span>
              {summaryData.decisions.length === 0 ? (
                <p className="text-white/40 text-[11px]">No binding decisions recorded yet.</p>
              ) : (
                <ul className="space-y-1">
                  {summaryData.decisions.map((d, i) => (
                    <li key={i} className="text-white/80 text-[11px] flex items-start gap-1.5">
                      <span className="text-emerald-400 mt-0.5">·</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Extracted Action Items */}
            <div className="p-3 bg-black/30 rounded-xl border border-white/5 space-y-1.5">
              <span className="font-semibold text-amber-400 text-[11px] uppercase tracking-wider block">
                ⚡ Action Items ({summaryData.actionItems.length})
              </span>
              {summaryData.actionItems.length === 0 ? (
                <p className="text-white/40 text-[11px]">No pending action items detected.</p>
              ) : (
                <ul className="space-y-2">
                  {summaryData.actionItems.map((act) => (
                    <li key={act.id} className="text-white/80 text-[11px] flex items-center justify-between gap-2 p-1.5 bg-white/5 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-white">{act.title}</p>
                        <p className="text-[10px] text-white/50 font-mono">
                          {act.owner ? `Owner: ${act.owner}` : 'Unassigned'} {act.deadline ? `· Due: ${act.deadline}` : ''}
                        </p>
                      </div>
                      {onOpenTaskModalWithItem && (
                        <button
                          type="button"
                          onClick={() => onOpenTaskModalWithItem(act.title)}
                          className="px-2 py-0.5 bg-sleek-violet hover:bg-sleek-violet/80 text-white rounded text-[10px] font-semibold shrink-0"
                        >
                          + Task
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Blockers & Next Steps */}
          {(summaryData.blockers.length > 0 || summaryData.nextSteps.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {summaryData.blockers.length > 0 && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  <span className="text-rose-400 font-bold text-[11px] flex items-center gap-1 mb-1">
                    <AlertTriangle size={12} /> Flagged Blockers ({summaryData.blockers.length})
                  </span>
                  {summaryData.blockers.map((b, i) => (
                    <div key={i} className="text-white/80 text-[11px] flex items-center justify-between gap-2 py-0.5">
                      <span>- {b.description}</span>
                      {b.flaggedMessageId && (
                        <span className="text-[10px] font-mono text-rose-300/80 bg-rose-500/20 px-1.5 py-0.5 rounded">
                          {b.flaggedMessageId}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {summaryData.nextSteps.length > 0 && (
                <div className="p-2.5 bg-sleek-violet/10 border border-sleek-violet/20 rounded-xl">
                  <span className="text-sleek-violet font-bold text-[11px] flex items-center gap-1 mb-1">
                    <ArrowRight size={12} /> Recommended Next Steps
                  </span>
                  {summaryData.nextSteps.map((step, i) => (
                    <p key={i} className="text-white/80 text-[11px]">
                      - {step}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. Expanded Clarifying Questions Panel */}
      {activeTab === 'clarify' && !isLoading && (
        <div className="px-4 py-3 bg-[#0F172A] border-t border-white/10 space-y-3 animate-fade-in text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <HelpCircle size={14} className="text-amber-400" />
              Targeted Clarifying Questions for Ambiguities
            </h4>
            <button
              type="button"
              onClick={() => setActiveTab(null)}
              className="text-white/40 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-[11px] text-white/60">
            The AI detected the following potential ambiguities or missing ownership in recent messages. Post these to the channel to get explicit confirmation.
          </p>

          {clarifyingQuestions.length === 0 ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>No major ambiguities detected in recent channel conversations! Accountability is clear.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {clarifyingQuestions.map((cq) => (
                <div
                  key={cq.id}
                  className="p-3 bg-black/40 border border-white/10 rounded-xl flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] font-mono uppercase">
                        {cq.ambiguityType.replace('_', ' ')}
                      </span>
                      {cq.targetRoleOrMember && (
                        <span className="text-[10px] text-white/50">
                          Target: {cq.targetRoleOrMember}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-white">{cq.question}</p>
                    {cq.context && (
                      <p className="text-[10px] text-white/50">{cq.context}</p>
                    )}
                  </div>

                  {onPostClarifyingQuestion && (
                    <button
                      type="button"
                      onClick={() => onPostClarifyingQuestion(cq.question)}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[11px] font-semibold rounded-lg flex items-center gap-1 shrink-0 transition-colors"
                    >
                      <Send size={11} />
                      <span>Post in Chat</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Expanded AI Insights Panel (Daily Digest) */}
      {activeTab === 'digest' && digestData && !isLoading && (
        <div className="px-4 py-3 bg-[#0F172A] border-t border-white/10 space-y-3 animate-fade-in text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <FileText size={14} className="text-purple-400" />
              {digestData.title}
            </h4>
            <button
              type="button"
              onClick={() => setActiveTab(null)}
              className="text-white/40 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-white/90 leading-relaxed bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
            {digestData.executiveOverview}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-black/30 rounded-xl border border-white/5 space-y-1">
              <span className="font-semibold text-emerald-400 text-[11px] uppercase tracking-wider block">
                Highlights & Completed Deliverables
              </span>
              {digestData.completedHighlights.map((h, i) => (
                <p key={i} className="text-white/80 text-[11px]">- {h}</p>
              ))}
            </div>

            <div className="p-3 bg-black/30 rounded-xl border border-white/5 space-y-1">
              <span className="font-semibold text-amber-400 text-[11px] uppercase tracking-wider block">
                Urgent Decisions Required
              </span>
              {digestData.urgentDecisionsRequired.map((u, i) => (
                <p key={i} className="text-white/80 text-[11px]">- {u}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
