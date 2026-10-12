import React, { useState } from 'react';
import { X, Copy, Check, UserPlus, Shield, Users } from 'lucide-react';
import { Workspace } from '../../types/teamHub';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace | null;
}

export default function InviteMemberModal({
  isOpen,
  onClose,
  workspace
}: InviteMemberModalProps) {
  if (!isOpen || !workspace) return null;

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const inviteCode = workspace.inviteCode || 'OC-PRO-2026';
  const inviteLink = `${window.location.origin}/?invite=${inviteCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <UserPlus size={18} className="text-sleek-violet" />
            <h3 className="font-bold text-sm">Invite Team to {workspace.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-white/70 leading-relaxed">
            Share this invite code or link with your directors, producers, editors, or clients to give them instant access to this company workspace.
          </p>

          {/* Invite Code Card */}
          <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-2">
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block">
              Workspace Invite Code
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-base font-bold text-white tracking-widest">
                {inviteCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-sleek-violet hover:bg-sleek-violet/80 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              >
                {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          {/* Direct Link */}
          <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-2">
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block">
              Direct Invite URL
            </span>
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white/70 font-mono truncate focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                title="Copy Link"
              >
                {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-start gap-2.5 text-[11px] text-white/50">
            <Shield size={14} className="text-sleek-violet shrink-0 mt-0.5" />
            <span>
              Invited members receive default <strong>Employee</strong> access and can join all public and department channels. Private channels require explicit creator invitations.
            </span>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
