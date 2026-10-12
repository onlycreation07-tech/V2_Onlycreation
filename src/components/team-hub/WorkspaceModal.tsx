import React, { useState } from 'react';
import { X, Building2, Key, Plus, Loader2 } from 'lucide-react';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWorkspace: (params: { name: string; description?: string }) => Promise<void>;
  onJoinWorkspace: (inviteCode: string) => Promise<void>;
}

export default function WorkspaceModal({
  isOpen,
  onClose,
  onCreateWorkspace,
  onJoinWorkspace
}: WorkspaceModalProps) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onCreateWorkspace({ name: name.trim(), description: description.trim() });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to create workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onJoinWorkspace(inviteCode.trim().toUpperCase());
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to join workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Tabs */}
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'create'
                  ? 'bg-sleek-violet text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Plus size={13} /> Create Workspace
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('join')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'join'
                  ? 'bg-sleek-violet text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Key size={13} /> Join by Code
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab 1: Create */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreate} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Workspace / Organization Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Media Corp"
                className="w-full bg-black/40 border border-white/10 focus:border-sleek-violet rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Purpose of this workspace..."
                className="w-full bg-black/40 border border-white/10 focus:border-sleek-violet rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none resize-none"
              />
            </div>

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
                disabled={isSubmitting || !name.trim()}
                className="px-4 py-2 bg-sleek-violet hover:bg-sleek-violet/80 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md disabled:opacity-40"
              >
                {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <span>Create Workspace</span>}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Join */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoin} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Workspace Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="e.g. OC-PRO-2026"
                className="w-full bg-black/40 border border-white/10 focus:border-sleek-violet rounded-xl px-3.5 py-2 text-xs text-white uppercase font-mono tracking-wider focus:outline-none"
                required
              />
              <p className="mt-1.5 text-[11px] text-white/50">
                Ask your workspace admin or manager for the 8-character invite code.
              </p>
            </div>

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
                disabled={isSubmitting || !inviteCode.trim()}
                className="px-4 py-2 bg-sleek-violet hover:bg-sleek-violet/80 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md disabled:opacity-40"
              >
                {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <span>Join Workspace</span>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
