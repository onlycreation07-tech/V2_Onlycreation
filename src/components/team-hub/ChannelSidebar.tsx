import React, { useState } from 'react';
import { 
  Hash, 
  Lock, 
  Briefcase, 
  Film, 
  FolderGit2, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Search, 
  UserPlus, 
  Circle,
  Copy,
  Check,
  Sparkles
} from 'lucide-react';
import { Workspace, Channel, WorkspaceMember } from '../../types/teamHub';

interface ChannelSidebarProps {
  workspace: Workspace | null;
  channels: Channel[];
  members: WorkspaceMember[];
  activeChannelId: string;
  onSelectChannel: (channelId: string) => void;
  onOpenCreateChannel: () => void;
  onOpenInviteModal: () => void;
  currentUserId: string;
}

export default function ChannelSidebar({
  workspace,
  channels,
  members,
  activeChannelId,
  onSelectChannel,
  onOpenCreateChannel,
  onOpenInviteModal,
  currentUserId
}: ChannelSidebarProps) {
  const [searchFilter, setSearchFilter] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    channels: false,
    departments: false,
    private: false,
    direct: false
  });
  const [copiedInvite, setCopiedInvite] = useState(false);

  const toggleSection = (key: string) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyInvite = () => {
    if (workspace?.inviteCode) {
      navigator.clipboard.writeText(workspace.inviteCode);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    }
  };

  // Filter channels based on search
  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.topic?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const publicChannels = filteredChannels.filter(c => c.type === 'public');
  const departmentChannels = filteredChannels.filter(c => c.type === 'department');
  const privateChannels = filteredChannels.filter(c => c.type === 'private');

  // Filter members for direct messages (exclude current user)
  const otherMembers = members.filter(m => m.userId !== currentUserId && 
    (m.displayName.toLowerCase().includes(searchFilter.toLowerCase()) || 
     m.role.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <nav aria-label="Channels and Direct Messages" className="w-64 bg-[#0F172A] border-r border-white/10 flex flex-col h-full select-none shrink-0">
      {/* Workspace Header */}
      <div className="h-14 border-b border-white/10 px-4 flex items-center justify-between">
        <div className="flex flex-col min-w-0">
          <h2 className="font-bold text-sm text-white truncate flex items-center gap-1.5">
            {workspace?.name || 'Workspace'}
          </h2>
          <span className="text-[11px] text-white/50 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {members.length} members · {channels.length} channels
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopyInvite}
          aria-label="Copy workspace invite code"
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors"
          title={`Invite code: ${workspace?.inviteCode || 'N/A'}`}
        >
          {copiedInvite ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>

      {/* Quick Search */}
      <div className="p-3">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-2.5 text-white/40 pointer-events-none" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search channels or team..."
            className="w-full bg-black/30 border border-white/10 focus:border-sleek-violet/60 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 text-xs font-medium">
        {/* 1. Public Channels */}
        <div>
          <div className="flex items-center justify-between px-2 py-1 text-white/50 hover:text-white/80 transition-colors">
            <button
              type="button"
              onClick={() => toggleSection('channels')}
              aria-expanded={!collapsedSections.channels}
              className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider"
            >
              {collapsedSections.channels ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              <span>Channels</span>
            </button>
            <button
              type="button"
              onClick={onOpenCreateChannel}
              className="p-0.5 hover:text-sleek-violet transition-colors"
              title="Create channel"
              aria-label="Create channel"
            >
              <Plus size={14} />
            </button>
          </div>

          {!collapsedSections.channels && (
            <div className="mt-1 space-y-0.5">
              {publicChannels.map((channel) => {
                const isActive = channel.id === activeChannelId;
                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => onSelectChannel(channel.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-sleek-violet text-white font-semibold shadow-sm'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Hash size={14} className={isActive ? 'text-white' : 'text-white/40'} />
                      <span className="truncate">{channel.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Department Channels */}
        {departmentChannels.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-2 py-1 text-white/50 hover:text-white/80 transition-colors">
              <button
                type="button"
                onClick={() => toggleSection('departments')}
                aria-expanded={!collapsedSections.departments}
                className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider"
              >
                {collapsedSections.departments ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                <span>Departments</span>
              </button>
            </div>

            {!collapsedSections.departments && (
              <div className="mt-1 space-y-0.5">
                {departmentChannels.map((channel) => {
                  const isActive = channel.id === activeChannelId;
                  return (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => onSelectChannel(channel.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-sleek-violet text-white font-semibold shadow-sm'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Briefcase size={14} className={isActive ? 'text-white' : 'text-purple-400'} />
                        <span className="truncate">{channel.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. Private Channels */}
        {privateChannels.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-2 py-1 text-white/50 hover:text-white/80 transition-colors">
              <button
                type="button"
                onClick={() => toggleSection('private')}
                aria-expanded={!collapsedSections.private}
                className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider"
              >
                {collapsedSections.private ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                <span>Private Groups</span>
              </button>
            </div>

            {!collapsedSections.private && (
              <div className="mt-1 space-y-0.5">
                {privateChannels.map((channel) => {
                  const isActive = channel.id === activeChannelId;
                  return (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => onSelectChannel(channel.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-sleek-violet text-white font-semibold shadow-sm'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Lock size={13} className={isActive ? 'text-white' : 'text-amber-400'} />
                        <span className="truncate">{channel.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. Direct Messages */}
        <div>
          <div className="flex items-center justify-between px-2 py-1 text-white/50 hover:text-white/80 transition-colors">
            <button
              type="button"
              onClick={() => toggleSection('direct')}
              aria-expanded={!collapsedSections.direct}
              className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider"
            >
              {collapsedSections.direct ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              <span>Direct Messages</span>
            </button>
            <button
              type="button"
              onClick={onOpenInviteModal}
              className="p-0.5 hover:text-sleek-violet transition-colors"
              title="Invite teammate"
              aria-label="Invite teammate"
            >
              <UserPlus size={14} />
            </button>
          </div>

          {!collapsedSections.direct && (
            <div className="mt-1 space-y-0.5">
              {otherMembers.map((member) => {
                const isOnline = member.presence === 'online';
                return (
                  <button
                    key={member.userId}
                    type="button"
                    onClick={() => {
                      // Switch or create DM channel
                      const existingDm = channels.find(c => 
                        c.type === 'direct' && c.memberIds?.includes(member.userId)
                      );
                      if (existingDm) {
                        onSelectChannel(existingDm.id);
                      }
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-white/70 hover:bg-white/5 hover:text-white transition-colors group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="relative">
                        <div className="w-5 h-5 rounded-full bg-white/10 overflow-hidden">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.displayName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] font-bold">
                              {member.displayName.slice(0, 1)}
                            </div>
                          )}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0F172A] ${
                            isOnline ? 'bg-emerald-500' : 'bg-white/30'
                          }`}
                        />
                      </div>
                      <div className="truncate">
                        <span className="truncate block leading-tight">{member.displayName}</span>
                        {member.title && (
                          <span className="text-[10px] text-white/40 block leading-tight truncate">
                            {member.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Invite Teammates Action Footer */}
      <div className="p-3 border-t border-white/10">
        <button
          type="button"
          onClick={onOpenInviteModal}
          className="w-full py-2 px-3 bg-white/5 hover:bg-sleek-violet/20 border border-white/10 hover:border-sleek-violet/40 rounded-xl text-white/90 hover:text-white flex items-center justify-center gap-2 text-xs font-semibold transition-all active:scale-[0.98]"
        >
          <UserPlus size={14} className="text-sleek-violet" />
          <span>Invite to Workspace</span>
        </button>
      </div>
    </nav>
  );
}
