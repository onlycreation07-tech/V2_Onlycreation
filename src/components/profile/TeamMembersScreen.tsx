import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  Mail, 
  CheckCircle2, 
  MoreVertical,
  Crown,
  Edit3,
  Eye,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TeamMembersScreenProps {
  onBack: () => void;
  brandName: string;
}

export type TeamRole = 'Owner' | 'Editor' | 'Viewer';

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  avatar: string;
  joinedAt: string;
  status: 'active' | 'invited';
}

const INITIAL_COLLABORATORS: Collaborator[] = [
  {
    id: 'mem_1',
    name: 'Rohit Verma',
    email: 'onlycreation07@gmail.com',
    role: 'Owner',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    joinedAt: 'May 2026',
    status: 'active'
  },
  {
    id: 'mem_2',
    name: 'Ananya Sharma',
    email: 'ananya.producer@creativestudio.in',
    role: 'Editor',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
    joinedAt: 'Jul 2026',
    status: 'active'
  },
  {
    id: 'mem_3',
    name: 'Karan Mehra',
    email: 'karan.ops@brands.co',
    role: 'Viewer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    joinedAt: 'Aug 2026',
    status: 'active'
  }
];

export default function TeamMembersScreen({ onBack, brandName }: TeamMembersScreenProps) {
  const [members, setMembers] = useState<Collaborator[]>(INITIAL_COLLABORATORS);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('Editor');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Collaborator | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const newMember: Collaborator = {
      id: `mem_${Date.now()}`,
      name: inviteName.trim() || inviteEmail.split('@')[0],
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${inviteEmail}`,
      joinedAt: 'Just now',
      status: 'invited'
    };

    setMembers([...members, newMember]);
    setInviteEmail('');
    setInviteName('');
    setShowInviteModal(false);
    showToast(`Invitation sent to ${newMember.email}`);
  };

  const handleRemoveMember = () => {
    if (!memberToRemove) return;
    if (memberToRemove.role === 'Owner') {
      alert('The workspace owner cannot be removed.');
      setMemberToRemove(null);
      return;
    }
    setMembers(members.filter(m => m.id !== memberToRemove.id));
    showToast(`${memberToRemove.name} was removed from the team`);
    setMemberToRemove(null);
  };

  const getRoleIcon = (role: TeamRole) => {
    switch (role) {
      case 'Owner':
        return <Crown size={12} className="text-amber-400" />;
      case 'Editor':
        return <Edit3 size={12} className="text-sleek-violet" />;
      case 'Viewer':
        return <Eye size={12} className="text-emerald-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left pb-16">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 inset-x-4 max-w-sm mx-auto z-50 bg-emerald-500 text-black px-4 py-2.5 rounded-2xl shadow-2xl font-black text-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-white/80 hover:text-white transition-all active:scale-95"
            aria-label="Back to Profile"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">Team Members</h1>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{members.length} Collaborators • {brandName}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowInviteModal(true)}
          className="px-3 py-2 bg-sleek-violet hover:bg-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-sleek-violet/25 active:scale-95 transition-all"
        >
          <UserPlus size={14} />
          <span>Invite</span>
        </button>
      </header>

      {/* Collaborators List */}
      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Active Roster</label>

        <div className="flex flex-col gap-2.5">
          {members.map((member) => (
            <div
              key={member.id}
              className="bg-sleek-dark p-4 rounded-3xl border border-white/10 flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-3">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-10 h-10 rounded-full object-cover border border-white/10 bg-black/40"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-white">{member.name}</h4>
                    {member.status === 'invited' && (
                      <span className="text-[8px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        Invited
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-white/50 block font-mono">{member.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-xl border border-white/5">
                  {getRoleIcon(member.role)}
                  <span className="text-[10px] font-bold text-white/80">{member.role}</span>
                </div>

                {member.role !== 'Owner' && (
                  <button
                    type="button"
                    onClick={() => setMemberToRemove(member)}
                    className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                    title="Remove Member"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Permission Legend */}
      <div className="bg-white/[0.02] p-4 rounded-3xl border border-white/5 flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5 text-white/70">
          <Info size={14} className="text-sleek-violet" />
          <span className="text-[10px] font-black uppercase tracking-wider">Role Permissions</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[10px]">
          <div className="bg-white/5 p-2 rounded-xl border border-white/5">
            <span className="text-amber-400 font-bold block">Owner</span>
            <span className="text-white/50 text-[9px]">Full access, billing, and team control</span>
          </div>
          <div className="bg-white/5 p-2 rounded-xl border border-white/5">
            <span className="text-sleek-violet font-bold block">Editor</span>
            <span className="text-white/50 text-[9px]">Generate ads, order shoots & book studios</span>
          </div>
          <div className="bg-white/5 p-2 rounded-xl border border-white/5">
            <span className="text-emerald-400 font-bold block">Viewer</span>
            <span className="text-white/50 text-[9px]">Review script drafts and download masters</span>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-sleek-dark border border-white/20 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-sleek-violet/20 text-sleek-violet rounded-xl">
                    <UserPlus size={18} />
                  </div>
                  <h3 className="text-sm font-black text-white">Invite Collaborator</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="text-white/40 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSendInvite} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Colleague Name</label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Maya Iyer"
                    className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-sleek-violet"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@yourbrand.com"
                    className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-sleek-violet"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Editor', 'Viewer'] as TeamRole[]).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setInviteRole(role)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                          inviteRole === role
                            ? 'bg-sleek-violet border-sleek-violet text-white shadow-md'
                            : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-sleek-violet hover:bg-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-sleek-violet/25"
                  >
                    Send Invite
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Remove Confirmation Modal */}
      <AnimatePresence>
        {memberToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-sleek-dark border border-red-500/30 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 text-left"
            >
              <h3 className="text-sm font-black text-white">Remove Team Member?</h3>
              <p className="text-xs text-white/70">
                Are you sure you want to remove <strong className="text-white">{memberToRemove.name}</strong> ({memberToRemove.email}) from {brandName}? They will immediately lose access to creative scripts, project drafts, and studio booking records.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMemberToRemove(null)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRemoveMember}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  Remove Member
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
