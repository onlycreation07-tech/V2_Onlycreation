import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  Clock, 
  Calendar, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Loader2, 
  Hash, 
  User, 
  Play
} from 'lucide-react';
import { WorkspaceReminder, Channel, WorkspaceMember } from '../../types/teamHub';
import { teamHubChatService } from '../../services/teamHubChatService';

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  channels: Channel[];
  members: WorkspaceMember[];
  activeChannelId: string;
  currentUserId: string;
}

export default function RemindersModal({
  isOpen,
  onClose,
  workspaceId,
  channels,
  members,
  activeChannelId,
  currentUserId
}: RemindersModalProps) {
  if (!isOpen) return null;

  const [reminders, setReminders] = useState<WorkspaceReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [targetChannelId, setTargetChannelId] = useState(activeChannelId || channels[0]?.id || '');
  const [targetUserId, setTargetUserId] = useState('');
  const [dueDateTime, setDueDateTime] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });

  const loadReminders = () => {
    setLoading(true);
    teamHubChatService.getReminders(workspaceId)
      .then((data) => {
        setReminders(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load reminders:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadReminders();
  }, [workspaceId]);

  const handleApplyPreset = (minutesFromNow: number) => {
    const d = new Date(Date.now() + minutesFromNow * 60 * 1000);
    setDueDateTime(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    try {
      setSubmitting(true);
      const targetUser = members.find(m => m.userId === targetUserId);
      const idempotencyKey = `rem-client-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      const res = await teamHubChatService.createReminder(workspaceId, {
        channelId: targetChannelId,
        title: title.trim(),
        notes: notes.trim(),
        dueAt: new Date(dueDateTime).toISOString(),
        targetUserId: targetUserId || undefined,
        targetUserName: targetUser?.displayName,
        idempotencyKey
      });

      if (res.deduplicated) {
        alert('Identical reminder already registered (duplicate prevented).');
      }

      setTitle('');
      setNotes('');
      loadReminders();
    } catch (err: any) {
      alert(err.message || 'Failed to schedule reminder');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriggerNow = async (reminderId: string) => {
    try {
      setActionInProgressId(reminderId);
      const res = await teamHubChatService.triggerReminder(workspaceId, reminderId);
      if (res.alreadyDispatched) {
        alert('Reminder was already dispatched to the channel (duplicate prevented).');
      } else {
        alert('Reminder dispatched to channel in real-time!');
      }
      loadReminders();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch reminder');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleCancel = async (reminderId: string) => {
    try {
      setActionInProgressId(reminderId);
      await teamHubChatService.cancelReminder(workspaceId, reminderId);
      loadReminders();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel reminder');
    } finally {
      setActionInProgressId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0B0F19] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Configured Team Reminders</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sleek-violet/15 text-sleek-violet font-mono border border-sleek-violet/20">
                  Idempotent & Scheduled
                </span>
              </h2>
              <p className="text-xs text-white/50">
                Automated deadlines, stage wraps, and follow-up notifications with duplicate suppression
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

        {/* Content */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* New Reminder Form */}
          <form onSubmit={handleCreateReminder} className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-sleek-violet">
              <Plus size={14} /> Schedule New Reminder
            </h3>

            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-white/70">
                Reminder Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Verify 4K RAW anamorphic color grade export before 6 PM"
                required
                className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-sleek-violet"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-white/70">
                  Target Channel *
                </label>
                <select
                  value={targetChannelId}
                  onChange={(e) => setTargetChannelId(e.target.value)}
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sleek-violet"
                >
                  {channels.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-white/70">
                  Tag Teammate (Optional)
                </label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sleek-violet"
                >
                  <option value="">Channel-wide (Everyone)</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.displayName} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-white/70">
                Trigger Date & Time *
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="datetime-local"
                  value={dueDateTime}
                  onChange={(e) => setDueDateTime(e.target.value)}
                  required
                  className="bg-[#0F172A] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sleek-violet"
                />
                {/* Presets */}
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(30)}
                    className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg text-[10px] border border-white/5"
                  >
                    +30m
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(120)}
                    className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg text-[10px] border border-white/5"
                  >
                    +2h
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(1440)}
                    className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg text-[10px] border border-white/5"
                  >
                    Tomorrow
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-white/70">
                Additional Notes / Instructions
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Include stage instructions, asset links, or checklist items..."
                rows={2}
                className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-sleek-violet resize-none"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={submitting || !title.trim()}
                className="px-4 py-2 bg-sleek-violet hover:bg-sleek-violet/80 disabled:opacity-40 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
                <span>Schedule Reminder</span>
              </button>
            </div>
          </form>

          {/* List of Reminders */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Active & Recent Reminders ({reminders.length})</span>
              <button
                type="button"
                onClick={loadReminders}
                className="text-[11px] text-white/40 hover:text-white transition-colors"
              >
                Refresh
              </button>
            </h3>

            {loading ? (
              <div className="py-8 flex justify-center text-white/40 text-xs">
                <Loader2 size={20} className="animate-spin text-sleek-violet" />
              </div>
            ) : reminders.length === 0 ? (
              <div className="p-6 bg-white/[0.01] border border-white/5 rounded-xl text-center text-white/40 text-xs">
                No reminders scheduled yet. Add one above to notify the crew.
              </div>
            ) : (
              <div className="space-y-2">
                {reminders.map((r) => {
                  const targetChannel = channels.find(c => c.id === r.channelId);
                  const isSent = r.status === 'sent';
                  const isCancelled = r.status === 'cancelled';

                  return (
                    <div
                      key={r.id}
                      className="p-3 bg-white/[0.02] border border-white/10 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isSent
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : isCancelled
                                ? 'bg-white/10 text-white/40'
                                : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                            }`}
                          >
                            {r.status}
                          </span>
                          <span className="font-semibold text-white truncate">{r.title}</span>
                        </div>

                        {r.notes && (
                          <p className="text-[11px] text-white/60 line-clamp-1">{r.notes}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-white/40 font-mono">
                          <span>Channel: #{targetChannel?.name || r.channelId}</span>
                          <span>Due: {new Date(r.dueAt).toLocaleString()}</span>
                          {r.targetUserName && <span>Target: @{r.targetUserName}</span>}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {r.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleTriggerNow(r.id)}
                              disabled={actionInProgressId === r.id}
                              className="px-2.5 py-1 bg-white/5 hover:bg-sleek-violet/20 border border-white/10 hover:border-sleek-violet/40 rounded-lg text-white text-[11px] font-medium flex items-center gap-1 transition-all"
                              title="Trigger reminder immediately into channel"
                            >
                              <Play size={11} className="text-emerald-400" />
                              <span>Test Send</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancel(r.id)}
                              disabled={actionInProgressId === r.id}
                              className="p-1 hover:text-rose-400 text-white/40 rounded transition-colors"
                              title="Cancel reminder"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
