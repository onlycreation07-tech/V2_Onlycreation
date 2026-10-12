import React from 'react';
import { Plus, Users, Shield, Compass, Sparkles } from 'lucide-react';
import { Workspace, WorkspaceMember } from '../../types/teamHub';

interface WorkspaceRailProps {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
  onOpenCreateOrJoin: () => void;
  currentUserMember?: WorkspaceMember | null;
}

export default function WorkspaceRail({
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onOpenCreateOrJoin,
  currentUserMember
}: WorkspaceRailProps) {
  return (
    <aside className="w-16 bg-[#090D16] border-r border-white/10 flex flex-col items-center py-3 select-none shrink-0 z-20">
      {/* Brand Workspace Glyph */}
      <div className="mb-4 relative group">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sleek-violet to-purple-800 flex items-center justify-center text-white shadow-lg shadow-purple-900/30 font-black tracking-wider text-sm transition-transform group-hover:scale-105">
          OC
        </div>
        <span className="absolute left-14 top-2 px-2 py-1 bg-black/90 text-white text-[11px] rounded shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          OnlyCreation Hub
        </span>
      </div>

      <div className="w-8 h-[1px] bg-white/10 mb-3" />

      {/* Workspace List */}
      <div className="flex-1 w-full flex flex-col items-center gap-2.5 overflow-y-auto hide-scrollbar">
        {workspaces.map((ws) => {
          const isActive = ws.id === activeWorkspaceId;
          const initials = ws.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

          return (
            <div key={ws.id} className="relative group w-full flex items-center justify-center">
              {/* Active Bar Indicator */}
              <div
                className={`absolute left-0 w-1 rounded-r-md transition-all duration-200 ${
                  isActive ? 'h-8 bg-sleek-violet' : 'h-0 group-hover:h-3 bg-white/40'
                }`}
              />

              <button
                type="button"
                onClick={() => onSelectWorkspace(ws.id)}
                aria-label={`Switch to workspace ${ws.name}`}
                className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center font-bold text-xs relative overflow-hidden ${
                  isActive
                    ? 'bg-sleek-violet text-white shadow-md shadow-sleek-violet/25 rounded-2xl'
                    : 'bg-white/5 text-white/70 hover:bg-white/15 hover:text-white rounded-xl'
                }`}
              >
                {ws.avatarUrl ? (
                  <img src={ws.avatarUrl} alt={ws.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </button>

              {/* Tooltip */}
              <div className="absolute left-14 px-2.5 py-1 bg-[#1E293B] border border-white/10 text-white text-xs rounded-md shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                <p className="font-semibold">{ws.name}</p>
                <p className="text-[10px] text-white/50">{ws.memberCount || 1} members</p>
              </div>
            </div>
          );
        })}

        {/* Create / Join Workspace Button */}
        <div className="relative group w-full flex items-center justify-center mt-1">
          <button
            type="button"
            onClick={onOpenCreateOrJoin}
            aria-label="Create or Join Workspace"
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-sleek-violet/20 border border-white/10 hover:border-sleek-violet/50 text-white/60 hover:text-sleek-violet transition-all flex items-center justify-center"
            title="Create or Join Workspace"
          >
            <Plus size={18} />
          </button>
          <div className="absolute left-14 px-2 py-1 bg-[#1E293B] border border-white/10 text-white text-xs rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Create or Join Workspace
          </div>
        </div>
      </div>

      {/* User Presence Avatar Footer */}
      <div className="pt-3 border-t border-white/10 w-full flex flex-col items-center">
        <div className="relative group">
          <div className="w-9 h-9 rounded-xl bg-white/10 overflow-hidden border border-white/15">
            {currentUserMember?.avatarUrl ? (
              <img src={currentUserMember.avatarUrl} alt="Me" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white/80">
                {currentUserMember?.displayName?.slice(0, 2).toUpperCase() || 'ME'}
              </div>
            )}
          </div>
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#090D16] bg-emerald-500"
            title="Online"
          />
          <div className="absolute left-14 bottom-1 px-2.5 py-1 bg-[#1E293B] border border-white/10 text-white text-xs rounded-md shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            <p className="font-semibold">{currentUserMember?.displayName || 'User'}</p>
            <p className="text-[10px] text-emerald-400 capitalize">Online · {currentUserMember?.role || 'Member'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
