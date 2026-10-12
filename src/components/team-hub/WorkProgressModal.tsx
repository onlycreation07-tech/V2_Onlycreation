import React, { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle, 
  Clock, 
  Plus, 
  Loader2, 
  User, 
  Briefcase, 
  FileText, 
  Quote, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { WorkloadReport, SelfReportedUpdate } from '../../types/teamHub';
import { teamHubChatService } from '../../services/teamHubChatService';

interface WorkProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  currentUserId: string;
  currentUserName: string;
}

export default function WorkProgressModal({
  isOpen,
  onClose,
  workspaceId,
  currentUserId,
  currentUserName
}: WorkProgressModalProps) {
  if (!isOpen) return null;

  const [reports, setReports] = useState<WorkloadReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'self_report'>('dashboard');
  const [submitting, setSubmitting] = useState(false);

  // Self-report form
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [progressPercent, setProgressPercent] = useState(50);
  const [blockersDeclared, setBlockersDeclared] = useState('');
  const [hoursSpentToday, setHoursSpentToday] = useState(4);

  const loadDashboard = () => {
    setLoading(true);
    teamHubChatService.getWorkloadDashboard(workspaceId)
      .then((data) => {
        setReports(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load workload dashboard:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDashboard();
  }, [workspaceId]);

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneTitle.trim()) return;

    try {
      setSubmitting(true);
      setToastMessage(null);
      await teamHubChatService.submitSelfReportedUpdate(workspaceId, {
        milestoneTitle: milestoneTitle.trim(),
        progressPercent,
        blockersDeclared: blockersDeclared.trim() || undefined,
        hoursSpentToday
      });
      setMilestoneTitle('');
      setBlockersDeclared('');
      setActiveTab('dashboard');
      loadDashboard();
      setToastMessage({ text: 'Milestone progress and declared blockers updated successfully.', type: 'success' });
    } catch (err: any) {
      setToastMessage({ text: err.message || 'Failed to submit milestone update', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const myReport = reports.find(r => r.userId === currentUserId) || reports[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-[#0B0F19] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Transparent Work Progress & Velocity</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-mono border border-cyan-500/20">
                  Ethical & Reviewable
                </span>
              </h2>
              <p className="text-xs text-white/50">
                Milestones, declared blockers, self-reported updates, and evidence-cited AI summaries
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="px-5 border-b border-white/10 flex items-center gap-2 bg-black/20 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'dashboard'
                ? 'border-cyan-500 text-white'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Team Delivery Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('self_report')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'self_report'
                ? 'border-cyan-500 text-white'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Plus size={13} />
            <span>Submit Milestone / Declare Blocker</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {toastMessage && (
            <div className={`p-3 rounded-xl border text-xs flex items-center justify-between animate-fade-in ${
              toastMessage.type === 'success'
                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}>
              <div className="flex items-center gap-2">
                {toastMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{toastMessage.text}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setToastMessage(null)}
                className="text-white/40 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-16 flex justify-center text-white/40 text-xs">
              <Loader2 size={24} className="animate-spin text-cyan-500" />
            </div>
          ) : (
            <>
              {/* TAB 1: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-4">
                  {/* Privacy / Ethical Transparency Guarantee Banner */}
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-xs text-cyan-200">
                    <p className="text-[11px] text-white/80 leading-relaxed">
                      <strong>Zero Invasive Monitoring Policy:</strong> OnlyCreation never performs keystroke logging, background webcam snapshots, or message-volume vanity scores. All velocity summaries cite real task milestones and remain reviewable and editable by team members.
                    </p>
                  </div>

                  {/* High Level Progress Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-white">
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                      <span className="text-[10px] text-white/40 uppercase block">Active Workstreams</span>
                      <span className="text-xl font-bold font-mono text-cyan-400 mt-0.5 block">
                        {reports.reduce((acc, r) => acc + r.assignedTasksCount, 0)}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                      <span className="text-[10px] text-white/40 uppercase block">Completed Milestones</span>
                      <span className="text-xl font-bold font-mono text-emerald-400 mt-0.5 block">
                        {reports.reduce((acc, r) => acc + r.completedMilestonesCount, 0)}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                      <span className="text-[10px] text-white/40 uppercase block">Overdue Items</span>
                      <span className="text-xl font-bold font-mono text-amber-400 mt-0.5 block">
                        {reports.reduce((acc, r) => acc + r.overdueCount, 0)}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                      <span className="text-[10px] text-white/40 uppercase block">Declared Blockers</span>
                      <span className="text-xl font-bold font-mono text-rose-400 mt-0.5 block">
                        {reports.reduce((acc, r) => acc + r.declaredBlockers.length, 0)}
                      </span>
                    </div>
                  </div>

                  {/* Individual Teammate Workload Cards */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-white block">Teammate Delivery Cards</span>
                    {reports.map((rep) => (
                      <div
                        key={rep.userId}
                        className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl text-xs space-y-3 hover:border-white/20 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={rep.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                              alt={rep.userName}
                              className="w-8 h-8 rounded-full object-cover border border-white/20"
                            />
                            <div>
                              <h4 className="font-bold text-white text-xs">{rep.userName}</h4>
                              <p className="text-[10px] text-white/50">{rep.departmentName} · {rep.role}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] font-mono">
                            <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                              {rep.completedMilestonesCount}/{rep.assignedTasksCount} Done
                            </span>
                            {rep.overdueCount > 0 && (
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                {rep.overdueCount} Overdue
                              </span>
                            )}
                          </div>
                        </div>

                        {/* AI Evidence-Based Velocity Summary */}
                        <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1.5 text-[11px]">
                          <span className="font-semibold text-sleek-violet flex items-center gap-1">
                            <Sparkles size={12} /> Evidence-Cited Delivery Summary
                          </span>
                          <p className="text-white/80 leading-relaxed">{rep.aiDeliverySummary}</p>
                          {rep.evidenceCitations.length > 0 && (
                            <div className="space-y-0.5 pt-1">
                              {rep.evidenceCitations.map((ev, i) => (
                                <p key={i} className="text-[10px] text-white/50 flex items-center gap-1 font-mono">
                                  <Quote size={10} className="text-white/30" />
                                  <span>[{ev.sourceMessageId}]: "{ev.snippet}"</span>
                                </p>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Declared Blockers */}
                        {rep.declaredBlockers.length > 0 && (
                          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-200 text-[11px] space-y-1">
                            <span className="font-bold flex items-center gap-1 text-[10px] text-rose-300 uppercase tracking-wider">
                              <AlertTriangle size={11} /> Declared Operational Blocker
                            </span>
                            {rep.declaredBlockers.map((b, i) => (
                              <p key={i} className="text-white/90">- {b}</p>
                            ))}
                          </div>
                        )}

                        {/* Self-Reported Updates */}
                        {rep.selfReportedUpdates.length > 0 && (
                          <div className="space-y-1 text-[11px]">
                            <span className="text-white/40 text-[10px] uppercase font-bold block">Self-Reported Milestones:</span>
                            {rep.selfReportedUpdates.map((u) => (
                              <div key={u.id} className="flex items-center justify-between gap-2 p-1.5 bg-white/5 rounded-lg">
                                <span className="font-medium text-white truncate">{u.milestoneTitle}</span>
                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="w-16 bg-white/10 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${u.progressPercent}%` }} />
                                  </div>
                                  <span className="text-[10px] font-mono text-cyan-300">{u.progressPercent}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: SELF REPORT MILESTONE */}
              {activeTab === 'self_report' && (
                <form onSubmit={handleSubmitUpdate} className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl space-y-4 text-xs">
                  <div className="space-y-1">
                    <h3 className="font-bold text-white text-sm">Self-Report Delivery Update</h3>
                    <p className="text-white/50 text-xs">
                      Keep managers and directors aligned on your creative progress without hidden tracking.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/70 font-semibold mb-1">
                      Milestone / Task Name *
                    </label>
                    <input
                      type="text"
                      value={milestoneTitle}
                      onChange={(e) => setMilestoneTitle(e.target.value)}
                      placeholder="e.g. Completed initial 60-second color grade pass in DaVinci"
                      required
                      className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-white/70 font-semibold">Progress Percentage</label>
                        <span className="text-xs font-mono text-cyan-400 font-bold">{progressPercent}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={progressPercent}
                        onChange={(e) => setProgressPercent(Number(e.target.value))}
                        className="w-full accent-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-white/70 font-semibold mb-1">
                        Estimated Hours Spent Today
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="16"
                        value={hoursSpentToday}
                        onChange={(e) => setHoursSpentToday(Number(e.target.value))}
                        className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/70 font-semibold mb-1">
                      Declared Blocker (If Any)
                    </label>
                    <textarea
                      value={blockersDeclared}
                      onChange={(e) => setBlockersDeclared(e.target.value)}
                      placeholder="Declare any studio equipment, client feedback, or budget blockers..."
                      rows={2}
                      className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      className="px-3.5 py-2 bg-white/5 text-white/70 rounded-xl text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !milestoneTitle.trim()}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs shadow-md"
                    >
                      {submitting ? 'Submitting...' : 'Save Milestone'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
