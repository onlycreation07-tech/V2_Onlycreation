import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bot, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Pause, 
  Play, 
  Trash2, 
  Plus, 
  Clock, 
  History, 
  Send,
  Loader2,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { DelegatedReplyRule, DelegatedActionAuditLog, DelegatedActionType } from '../../types/teamHub';
import { teamHubChatService } from '../../services/teamHubChatService';

interface DelegationManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  currentUserId: string;
}

export default function DelegationManagementModal({
  isOpen,
  onClose,
  workspaceId,
  currentUserId
}: DelegationManagementModalProps) {
  if (!isOpen) return null;

  const [rules, setRules] = useState<DelegatedReplyRule[]>([]);
  const [auditLogs, setAuditLogs] = useState<DelegatedActionAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rules' | 'queue' | 'audit'>('rules');
  const [isCreating, setIsCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [actionType, setActionType] = useState<DelegatedActionType>('ack_receipt');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [templateReply, setTemplateReply] = useState('');
  const [autoMode, setAutoMode] = useState(false);
  const [maxDailyExecutions, setMaxDailyExecutions] = useState(10);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      teamHubChatService.getDelegationRules(workspaceId),
      teamHubChatService.getDelegationAuditLogs(workspaceId)
    ]).then(([r, logs]) => {
      setRules(r);
      setAuditLogs(logs);
      setLoading(false);
    }).catch((err) => {
      console.error('Failed to load delegation data:', err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      setSubmitting(true);
      setToastMessage(null);
      await teamHubChatService.createDelegationRule(workspaceId, {
        actionType,
        title: title.trim(),
        description: description.trim(),
        templateReply: templateReply.trim() || undefined,
        autoMode,
        maxDailyExecutions
      });
      setIsCreating(false);
      setTitle('');
      setDescription('');
      setTemplateReply('');
      setAutoMode(false);
      loadData();
      setToastMessage({ text: 'Delegation rule created successfully.', type: 'success' });
    } catch (err: any) {
      setToastMessage({ text: err.message || 'Failed to create delegation rule', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (ruleId: string, nextStatus: 'active' | 'paused' | 'revoked') => {
    try {
      setToastMessage(null);
      await teamHubChatService.toggleDelegationRule(workspaceId, ruleId, nextStatus);
      loadData();
      setToastMessage({ text: `Rule status updated to ${nextStatus}.`, type: 'success' });
    } catch (err: any) {
      setToastMessage({ text: err.message || 'Failed to update rule', type: 'error' });
    }
  };

  const handleReviewAction = async (logId: string, decision: 'approved' | 'rejected') => {
    try {
      setToastMessage(null);
      await teamHubChatService.reviewDelegatedAction(workspaceId, logId, decision);
      loadData();
      setToastMessage({ text: `Action ${decision} successfully.`, type: 'success' });
    } catch (err: any) {
      setToastMessage({ text: err.message || 'Failed to review action', type: 'error' });
    }
  };

  const pendingApprovals = auditLogs.filter(l => l.approvalStatus === 'pending');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-[#0B0F19] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/20">
              <Bot size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Delegated AI Assistant & Approvals</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 font-mono border border-rose-500/20">
                  Strict Human Authority
                </span>
              </h2>
              <p className="text-xs text-white/50">
                Authorize routine AI replies labeled "AI assistant for [Name]" with immutable audit trails
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

        {/* Tab Navigation */}
        <div className="px-5 border-b border-white/10 flex items-center gap-2 bg-black/20 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'rules'
                ? 'border-rose-500 text-white'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Authorized Rules ({rules.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'queue'
                ? 'border-rose-500 text-white'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <span>Approval Queue</span>
            {pendingApprovals.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {pendingApprovals.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-rose-500 text-white'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <History size={13} />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {toastMessage && (
            <div className={`p-3 rounded-xl border text-xs flex items-center justify-between animate-fade-in ${
              toastMessage.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
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
              <Loader2 size={24} className="animate-spin text-rose-500" />
            </div>
          ) : (
            <>
              {/* TAB 1: RULES */}
              {activeTab === 'rules' && (
                <div className="space-y-4">
                  {/* Safety Boundary Banner */}
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-xs text-rose-200">
                    <ShieldCheck size={16} className="text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-white/80">
                      Every delegated message must visibly disclose <strong>"AI assistant for [Name]"</strong>. Human approval is strictly required for contracts, spending, HR, and sensitive decisions.
                    </p>
                  </div>

                  {/* Create Rule Button / Form */}
                  {!isCreating ? (
                    <button
                      type="button"
                      onClick={() => setIsCreating(true)}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-white font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Plus size={14} className="text-rose-400" />
                      <span>Authorize New Routine Rule</span>
                    </button>
                  ) : (
                    <form onSubmit={handleCreateRule} className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <h4 className="font-bold text-white">Create Narrow Routine Delegation Rule</h4>
                        <button
                          type="button"
                          onClick={() => setIsCreating(false)}
                          className="text-white/40 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-white/70 font-semibold mb-1">
                            Action Category *
                          </label>
                          <select
                            value={actionType}
                            onChange={(e) => setActionType(e.target.value as DelegatedActionType)}
                            className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                          >
                            <option value="ack_receipt">Acknowledge Asset / Media Receipt</option>
                            <option value="status_update">Request Scheduled Status Update</option>
                            <option value="deadline_reminder">Agreed Deadline Reminder</option>
                            <option value="approved_faq">Answer Approved Studio FAQ</option>
                            <option value="scheduling">Coordinate Within Approved Availability</option>
                            <option value="low_risk_decision">Documented Low-Risk Decision</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] text-white/70 font-semibold mb-1">
                            Max Daily Executions *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={maxDailyExecutions}
                            onChange={(e) => setMaxDailyExecutions(Number(e.target.value))}
                            className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-white/70 font-semibold mb-1">
                          Rule Title *
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. Stage 1 Footage Ingest Confirmation"
                          required
                          className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-white/70 font-semibold mb-1">
                          Trigger Condition & Context *
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Narrow scope when this assistant rule applies..."
                          rows={2}
                          required
                          className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-rose-500 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-white/70 font-semibold mb-1">
                          Template / Standard Response Formula
                        </label>
                        <input
                          type="text"
                          value={templateReply}
                          onChange={(e) => setTemplateReply(e.target.value)}
                          placeholder="e.g. Received raw card media. Ingest underway on Stage 1."
                          className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                        <div>
                          <span className="font-semibold text-white block text-[11px]">
                            Optional Automatic Mode
                          </span>
                          <span className="text-[10px] text-white/40">
                            Dispatches without human queue for this routine action only.
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={autoMode}
                          onChange={(e) => setAutoMode(e.target.checked)}
                          className="w-4 h-4 rounded text-rose-500 focus:ring-0 cursor-pointer"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsCreating(false)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-xs font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting || !title.trim()}
                          className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md"
                        >
                          {submitting ? 'Authorizing...' : 'Save Rule'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Rules List */}
                  <div className="space-y-2.5">
                    {rules.map((rule) => {
                      const isRevoked = rule.status === 'revoked';
                      const isPaused = rule.status === 'paused';

                      return (
                        <div
                          key={rule.id}
                          className={`p-3.5 rounded-xl border transition-all text-xs ${
                            isRevoked
                              ? 'bg-white/[0.01] border-white/5 opacity-50'
                              : isPaused
                              ? 'bg-amber-500/5 border-amber-500/20'
                              : 'bg-white/[0.02] border-white/10'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  rule.status === 'active'
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : rule.status === 'paused'
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {rule.status}
                              </span>
                              <h4 className="font-bold text-white text-xs">{rule.title}</h4>
                            </div>

                            {/* Killswitch & Controls */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {rule.status === 'active' && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(rule.id, 'paused')}
                                  className="px-2.5 py-1 bg-white/5 hover:bg-amber-500/20 text-white/70 hover:text-amber-300 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors"
                                  title="Pause rule temporarily"
                                >
                                  <Pause size={11} />
                                  <span>Pause</span>
                                </button>
                              )}
                              {rule.status === 'paused' && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(rule.id, 'active')}
                                  className="px-2.5 py-1 bg-white/5 hover:bg-emerald-500/20 text-white/70 hover:text-emerald-300 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors"
                                >
                                  <Play size={11} />
                                  <span>Resume</span>
                                </button>
                              )}
                              {!isRevoked && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(rule.id, 'revoked')}
                                  className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors"
                                  title="Immediate revoke killswitch"
                                >
                                  <Trash2 size={11} />
                                  <span>Revoke</span>
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-[11px] text-white/70 leading-relaxed">{rule.description}</p>
                          {rule.templateReply && (
                            <p className="text-[11px] text-white/50 italic mt-1 bg-black/30 p-2 rounded-lg font-mono">
                              "{rule.templateReply}"
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-white/40 mt-2 font-mono">
                            <span>Mode: {rule.autoMode ? 'Auto-Dispatch' : 'Draft for Approval'}</span>
                            <span>Executions Today: {rule.todayExecutionCount}/{rule.maxDailyExecutions}</span>
                            <span>Expires: {new Date(rule.expiresAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: APPROVAL QUEUE */}
              {activeTab === 'queue' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Pending Approval Queue ({pendingApprovals.length})</span>
                    <span className="text-[11px] text-white/40">Review drafted messages before dispatch</span>
                  </div>

                  {pendingApprovals.length === 0 ? (
                    <div className="p-8 bg-white/[0.01] border border-white/5 rounded-xl text-center text-white/40 text-xs">
                      No pending drafts awaiting review. All routine delegations settled.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingApprovals.map((log) => (
                        <div key={log.id} className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-rose-300">
                              Rule: {log.ruleTitle}
                            </span>
                            <span className="text-[10px] text-white/40 font-mono">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          <div className="p-3 bg-black/40 rounded-xl border border-white/5 font-mono text-[11px] text-white/90">
                            🤖 AI assistant for {log.authorizingUserName}: {log.content}
                          </div>

                          <p className="text-[10px] text-white/50">
                            Context: {log.supportingContext}
                          </p>

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleReviewAction(log.id, 'rejected')}
                              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg text-xs"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReviewAction(log.id, 'approved')}
                              className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1 shadow-md"
                            >
                              <CheckCircle2 size={13} />
                              <span>Approve & Send</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: AUDIT TRAIL */}
              {activeTab === 'audit' && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-white mb-2">Immutable Delegation Audit Log</div>
                  <div className="space-y-2 max-h-[420px] overflow-y-auto">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 bg-white/[0.015] border border-white/5 rounded-xl text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-white">{log.actionTaken}</span>
                          <span className="text-white/40 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-[11px] text-white/70 line-clamp-1">{log.content}</p>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-white/40 font-mono">
                          <span>Status: {log.approvalStatus}</span>
                          <span>Rule: {log.ruleTitle}</span>
                          <span>Authorizer: {log.authorizingUserName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
