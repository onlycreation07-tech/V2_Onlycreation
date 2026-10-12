import React, { useState } from 'react';
import { X, Hash, Lock, Briefcase, FolderGit2, Loader2 } from 'lucide-react';
import { ChannelType } from '../../types/teamHub';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChannel: (params: {
    name: string;
    type: ChannelType;
    topic?: string;
    description?: string;
  }) => Promise<void>;
}

export default function CreateChannelModal({
  isOpen,
  onClose,
  onCreateChannel
}: CreateChannelModalProps) {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [type, setType] = useState<ChannelType>('public');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onCreateChannel({
        name: name.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-'),
        type,
        topic: topic.trim(),
        description: description.trim()
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to create channel');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Hash size={18} className="text-sleek-violet" />
            <h3 className="font-bold text-sm">Create New Channel</h3>
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
          {/* Channel Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-2">
              Channel Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('public')}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  type === 'public'
                    ? 'bg-sleek-violet/20 border-sleek-violet text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Hash size={13} className="text-sleek-violet" /> Public
                </div>
                <span className="text-[10px] text-white/50 leading-tight">
                  Anyone in the workspace can view & join.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setType('private')}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  type === 'private'
                    ? 'bg-amber-500/20 border-amber-500 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Lock size={13} className="text-amber-400" /> Private
                </div>
                <span className="text-[10px] text-white/50 leading-tight">
                  By invitation only. Hidden from outsiders.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setType('department')}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  type === 'department'
                    ? 'bg-purple-500/20 border-purple-500 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Briefcase size={13} className="text-purple-400" /> Department
                </div>
                <span className="text-[10px] text-white/50 leading-tight">
                  Dedicated to a functional division.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setType('project')}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  type === 'project'
                    ? 'bg-blue-500/20 border-blue-500 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <FolderGit2 size={13} className="text-blue-400" /> Project
                </div>
                <span className="text-[10px] text-white/50 leading-tight">
                  Commercial drop or campaign team.
                </span>
              </button>
            </div>
          </div>

          {/* Channel Name */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Channel Name
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-white/40 text-xs font-mono">#</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'))}
                placeholder="e.g. spring-commercial-shoot"
                className="w-full bg-black/40 border border-white/10 focus:border-sleek-violet rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Topic (Optional)
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What is this channel about?"
              className="w-full bg-black/40 border border-white/10 focus:border-sleek-violet rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Provide context for new joiners..."
              className="w-full bg-black/40 border border-white/10 focus:border-sleek-violet rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none resize-none"
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
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-2 bg-sleek-violet hover:bg-sleek-violet/80 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Channel</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
