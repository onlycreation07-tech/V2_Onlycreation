import React, { useState } from 'react';
import { X, CheckSquare, Calendar, User, AlertCircle, Loader2 } from 'lucide-react';
import { WorkspaceMessage, WorkspaceMember } from '../../types/teamHub';
import { teamHubChatService } from '../../services/teamHubChatService';

interface TaskConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: WorkspaceMessage | null;
  workspaceId: string;
  members: WorkspaceMember[];
  onTaskCreated?: () => void;
}

export default function TaskConvertModal({
  isOpen,
  onClose,
  message,
  workspaceId,
  members,
  onTaskCreated
}: TaskConvertModalProps) {
  if (!isOpen || !message) return null;

  const [title, setTitle] = useState(() => {
    return message.content.slice(0, 60).replace(/\n/g, ' ') || 'Action item from chat';
  });
  const [description, setDescription] = useState(() => message.content);
  const [assignedToUserId, setAssignedToUserId] = useState(() => members[0]?.userId || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const assignee = members.find(m => m.userId === assignedToUserId);

      await teamHubChatService.createTaskFromMessage(workspaceId, {
        messageId: message.id,
        channelId: message.channelId,
        title: title.trim(),
        description: description.trim(),
        assignedToUserId,
        assignedToUserName: assignee?.displayName || 'Assignee',
        priority,
        dueDate
      });

      if (onTaskCreated) onTaskCreated();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <CheckSquare size={18} className="text-sleek-violet" />
            <h3 className="font-bold text-sm">Convert Message to Task</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black/40 border border-white/10 focus:border-sleek-violet rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Description / Context
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-black/40 border border-white/10 focus:border-sleek-violet rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none resize-none"
            />
          </div>

          {/* Two-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Assignee */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1 flex items-center gap-1.5">
                <User size={13} className="text-white/40" /> Assignee
              </label>
              <select
                value={assignedToUserId}
                onChange={(e) => setAssignedToUserId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-sleek-violet rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                {members.map((m) => (
                  <option key={m.userId} value={m.userId} className="bg-[#0F172A]">
                    {m.displayName} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1 flex items-center gap-1.5">
                <AlertCircle size={13} className="text-white/40" /> Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-black/40 border border-white/10 focus:border-sleek-violet rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="low" className="bg-[#0F172A]">Low</option>
                <option value="medium" className="bg-[#0F172A]">Medium</option>
                <option value="high" className="bg-[#0F172A]">High</option>
                <option value="urgent" className="bg-[#0F172A]">Urgent</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1 flex items-center gap-1.5">
              <Calendar size={13} className="text-white/40" /> Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-black/40 border border-white/10 focus:border-sleek-violet rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-4 py-2 bg-sleek-violet hover:bg-sleek-violet/80 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Create Task</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
