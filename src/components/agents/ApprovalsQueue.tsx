import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  ArrowUpRight, 
  Sparkles, 
  FileText, 
  Filter, 
  Check, 
  Plus, 
  MessageSquare, 
  User, 
  Bot, 
  ChevronDown,
  ChevronUp,
  Sliders,
  TrendingUp,
  Info
} from 'lucide-react';
import { ExecutiveApprovalRequest, ApprovalStatus, RiskLevel } from '../../types';
import { AI_AGENTS_LIST } from '../../services/agentService';

interface ApprovalsQueueProps {
  approvals: ExecutiveApprovalRequest[];
  onDecide: (id: string, status: ApprovalStatus, notes?: string) => void;
  onSimulateEscalation: () => void;
}

export default function ApprovalsQueue({
  approvals,
  onDecide,
  onSimulateEscalation
}: ApprovalsQueueProps) {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [filterRisk, setFilterRisk] = useState<'ALL' | RiskLevel>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Revision Modal State
  const [revisionModalId, setRevisionModalId] = useState<string | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');

  const pendingCount = approvals.filter(a => a.status === 'PENDING').length;

  const filteredApprovals = approvals.filter(item => {
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    if (filterRisk !== 'ALL' && item.riskTier !== filterRisk) return false;
    return true;
  });

  const getRiskBadge = (tier: RiskLevel) => {
    switch (tier) {
      case 'CRITICAL':
        return {
          label: 'CRITICAL RISK',
          bg: 'bg-red-500/10 text-red-400 border-red-500/30',
          dot: 'bg-red-500'
        };
      case 'HIGH':
        return {
          label: 'HIGH RISK',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-500'
        };
      case 'MEDIUM':
        return {
          label: 'MEDIUM RISK',
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          dot: 'bg-blue-500'
        };
      case 'LOW':
      default:
        return {
          label: 'LOW RISK',
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-500'
        };
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.replace('_', ' ');
  };

  const handleOpenRevision = (id: string) => {
    setRevisionModalId(id);
    const item = approvals.find(a => a.id === id);
    setRevisionNotes(
      item?.financialImpact?.estimatedCost 
        ? `Approved with budget cap reduced to $${Math.round(item.financialImpact.estimatedCost * 0.7)}. Maintain strict 4.0x ROAS threshold.`
        : 'Approved under condition that deliverables are finalized by Friday 5:00 PM.'
    );
  };

  const handleSubmitRevision = () => {
    if (!revisionModalId) return;
    onDecide(revisionModalId, 'REVISION_REQUESTED', revisionNotes);
    setRevisionModalId(null);
    setRevisionNotes('');
  };

  return (
    <div className="space-y-4">
      {/* Executive Overview Header */}
      <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-sleek-zinc via-purple-950/20 to-sleek-zinc border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-sleek-violet/20 text-sleek-violet">
              <ShieldAlert size={18} />
            </span>
            <h2 className="text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              CEO / CXO Executive Approvals Queue
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                  {pendingCount} ACTION REQUIRED
                </span>
              )}
            </h2>
          </div>
          <p className="text-xs text-white/60 max-w-2xl">
            AI managers (Ketan, Nova, Echo, Vault) handle 95% of routine operations autonomously. High-budget spend, creator exclusive contracts, and strategic risk shifts are paused here for your one-click decision.
          </p>
        </div>

        {/* Action Button: Simulate Complex Escalation */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onSimulateEscalation}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Simulate an AI Manager escalating a high-budget decision to CEO"
          >
            <Sparkles size={13} className="text-sleek-violet" />
            <span>Simulate AI Escalation</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
        {/* Status Segmented Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                filterStatus === st 
                  ? 'bg-sleek-violet text-white shadow-xs' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{st === 'ALL' ? 'All Requests' : st.charAt(0) + st.slice(1).toLowerCase()}</span>
              {st === 'PENDING' && pendingCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-black text-[10px] font-bold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Risk Level Selector */}
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Filter size={13} />
          <span>Risk:</span>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value as any)}
            className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-hidden"
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Requests Feed */}
      <div className="space-y-3">
        {filteredApprovals.length === 0 ? (
          <div className="p-10 rounded-2xl bg-sleek-zinc border border-white/5 text-center space-y-2">
            <CheckCircle2 size={32} className="mx-auto text-emerald-400 opacity-80" />
            <h3 className="text-sm font-semibold text-white">All Clear! No Approvals in this View</h3>
            <p className="text-xs text-white/40 max-w-sm mx-auto">
              Your autonomous AI managers are handling all operational directives. New high-risk requests will appear here immediately.
            </p>
          </div>
        ) : (
          filteredApprovals.map((req) => {
            const risk = getRiskBadge(req.riskTier);
            const agentObj = AI_AGENTS_LIST.find(a => a.id === req.requestedByAgentId) || AI_AGENTS_LIST[0];
            const isExpanded = expandedId === req.id;
            const isPending = req.status === 'PENDING';

            return (
              <div 
                key={req.id}
                className={`p-4 md:p-5 rounded-2xl bg-sleek-zinc border transition-all ${
                  isPending 
                    ? 'border-amber-500/30 bg-gradient-to-b from-white/[0.04] to-sleek-zinc shadow-md' 
                    : req.status === 'APPROVED' 
                    ? 'border-emerald-500/20 opacity-80' 
                    : 'border-white/5 opacity-70'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1.5 ${risk.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
                        {risk.label}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 font-mono uppercase">
                        {getCategoryLabel(req.category)}
                      </span>
                      <span className="text-[11px] text-white/40">
                        {req.departmentName || req.departmentId} · {req.createdAt}
                      </span>
                    </div>

                    <h3 className="text-sm md:text-base font-bold text-white tracking-tight pt-1">
                      {req.title}
                    </h3>
                  </div>

                  {/* Status Indicator */}
                  <div className="shrink-0">
                    {req.status === 'PENDING' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Clock size={12} />
                        Requires CEO Sign-Off
                      </span>
                    ) : req.status === 'APPROVED' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Approved by {req.decidedBy || 'CEO'}
                      </span>
                    ) : req.status === 'REJECTED' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                        <XCircle size={12} />
                        Rejected
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                        <Info size={12} />
                        Revisions Requested
                      </span>
                    )}
                  </div>
                </div>

                {/* Submitter & Employee Card */}
                <div className="flex flex-wrap items-center gap-3 py-2 px-3 rounded-xl bg-black/40 border border-white/5 text-xs text-white/70 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold"
                      style={{ backgroundColor: `${agentObj.color}25`, color: agentObj.color }}
                    >
                      {agentObj.name.slice(0, 1)}
                    </span>
                    <span className="text-white font-medium">{req.requestedByAgentName}</span>
                    <span className="text-white/40">(AI Manager)</span>
                  </div>

                  {req.assignedEmployeeName && (
                    <>
                      <span className="text-white/20">|</span>
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-sleek-violet" />
                        <span>Assigned Lead:</span>
                        <span className="text-white font-medium">{req.assignedEmployeeName}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Summary & Reasoning */}
                <div className="space-y-2 text-xs text-white/80 leading-relaxed mb-3">
                  <p className="font-normal">{req.summary}</p>
                  
                  {isExpanded && (
                    <div className="pt-2 border-t border-white/5 space-y-2 text-white/70 animate-fadeIn">
                      <div>
                        <span className="font-semibold text-white block mb-0.5">AI Strategic Reasoning:</span>
                        <p className="bg-black/30 p-2.5 rounded-lg border border-white/5 font-mono text-[11px] leading-relaxed">
                          {req.reasoning}
                        </p>
                      </div>

                      {req.recommendedAction && (
                        <div className="p-2.5 rounded-lg bg-sleek-violet/10 border border-sleek-violet/20 text-sleek-violet text-[11px]">
                          <strong className="block text-white font-semibold mb-0.5">Recommended Executive Action:</strong>
                          {req.recommendedAction}
                        </div>
                      )}

                      {req.decisionNotes && (
                        <div className="p-2.5 rounded-lg bg-black/50 border border-white/10 text-white/90 text-[11px]">
                          <strong className="block text-white/50 uppercase tracking-wider text-[10px] mb-0.5">CEO Decision Directives:</strong>
                          {req.decisionNotes}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Financial Impact Snapshot Grid */}
                {req.financialImpact && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2.5 px-3 rounded-xl bg-black/50 border border-white/5 text-[11px] mb-3">
                    {req.financialImpact.estimatedCost !== undefined && (
                      <div>
                        <span className="text-white/40 block text-[10px]">Estimated Spend</span>
                        <span className="font-mono font-bold text-white text-xs">
                          ${Number(req.financialImpact.estimatedCost).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {req.financialImpact.projectedReturn && (
                      <div>
                        <span className="text-white/40 block text-[10px]">Projected Return</span>
                        <span className="font-mono font-bold text-emerald-400 text-xs">
                          {req.financialImpact.projectedReturn}
                        </span>
                      </div>
                    )}
                    {req.financialImpact.savingsEstimate && (
                      <div>
                        <span className="text-white/40 block text-[10px]">Value Protected</span>
                        <span className="font-mono font-bold text-cyan-400 text-xs">
                          {req.financialImpact.savingsEstimate}
                        </span>
                      </div>
                    )}
                    {req.financialImpact.budgetVariance && (
                      <div>
                        <span className="text-white/40 block text-[10px]">Budget Variance</span>
                        <span className="font-mono text-white/70 text-xs">
                          {req.financialImpact.budgetVariance}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                    className="text-[11px] text-white/50 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <span>{isExpanded ? 'Hide AI Details' : 'View AI Reasoning & Impact'}</span>
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>

                  {/* One-Click Executive Actions for Pending Decisions */}
                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenRevision(req.id)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        <Sliders size={12} />
                        <span>Adjust Terms</span>
                      </button>

                      <button
                        onClick={() => onDecide(req.id, 'REJECTED', 'Blocked by CEO: Re-evaluate lower-cost alternative.')}
                        className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        <XCircle size={12} />
                        <span>Decline</span>
                      </button>

                      <button
                        onClick={() => onDecide(req.id, 'APPROVED', 'Approved by CEO via One-Click Sign-Off.')}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 hover:scale-[1.02]"
                      >
                        <Check size={14} />
                        <span>Approve Decision</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Adjust Terms / Revision Modal */}
      {revisionModalId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-sleek-zinc border border-white/15 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders size={16} className="text-sleek-violet" />
                Adjust Terms & Give Manager Directives
              </h3>
              <button 
                onClick={() => setRevisionModalId(null)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-white/60">
              Provide conditional approval or adjusted constraints to the supervising AI manager. The AI manager will restructure the task with the assigned human employee.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/70">
                Executive Notes & Modified Directives:
              </label>
              <textarea
                rows={3}
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="e.g. Approved with a strict cap of $2,000. Re-check CTR after 48 hours."
                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-hidden focus:border-sleek-violet font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRevisionModalId(null)}
                className="px-3.5 py-2 rounded-xl text-xs text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRevision}
                disabled={!revisionNotes.trim()}
                className="px-4 py-2 rounded-xl bg-sleek-violet hover:bg-sleek-violet/90 text-white text-xs font-semibold disabled:opacity-40"
              >
                Send Directives to AI Manager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
