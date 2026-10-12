import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Sliders, 
  Sparkles, 
  Bot, 
  BellRing, 
  UserCheck, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Info
} from 'lucide-react';
import { WorkspaceAiControls, Channel } from '../../types/teamHub';
import { teamHubChatService } from '../../services/teamHubChatService';

interface AIGranularControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  activeChannel: Channel | null;
  onChannelAiToggled?: (channelId: string, enabled: boolean) => void;
}

export default function AIGranularControlsModal({
  isOpen,
  onClose,
  workspaceId,
  activeChannel,
  onChannelAiToggled
}: AIGranularControlsModalProps) {
  if (!isOpen) return null;

  const [controls, setControls] = useState<WorkspaceAiControls | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [channelAiState, setChannelAiState] = useState<boolean>(activeChannel?.isAiEnabled !== false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    teamHubChatService.getAiControls(workspaceId)
      .then((data) => {
        if (mounted) {
          setControls(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load AI controls:', err);
        if (mounted) setLoading(false);
      });

    if (activeChannel) {
      setChannelAiState(activeChannel.isAiEnabled !== false);
    }

    return () => {
      mounted = false;
    };
  }, [workspaceId, activeChannel]);

  const handleToggle = async (key: keyof WorkspaceAiControls, currentVal: boolean) => {
    if (!controls) return;
    try {
      setSaving(true);
      const updated = await teamHubChatService.updateAiControls(workspaceId, {
        [key]: !currentVal
      });
      setControls(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCurrentChannel = async () => {
    if (!activeChannel) return;
    try {
      setSaving(true);
      const nextState = !channelAiState;
      await teamHubChatService.toggleChannelAi(workspaceId, activeChannel.id, nextState);
      setChannelAiState(nextState);
      if (onChannelAiToggled) {
        onChannelAiToggled(activeChannel.id, nextState);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle channel AI');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-[#0B0F19] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sleek-violet/15 text-sleek-violet border border-sleek-violet/20">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>AI Participation & Privacy Controls</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  ISO-27001 Ready
                </span>
              </h2>
              <p className="text-xs text-white/50">
                Granular multi-tier authorization with instant killswitches
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

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-white/50 text-xs">
              <Loader2 size={24} className="animate-spin text-sleek-violet mb-2" />
              <span>Loading AI governance settings...</span>
            </div>
          ) : controls ? (
            <>
              {/* Access Boundary Notice Banner */}
              <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-2.5 text-xs text-blue-200">
                <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-blue-300">Strict Data Boundary Guarantee</p>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    Chat messages and uploaded files are treated as untrusted input. When AI is disabled, message processing stops instantly and all pending background actions are halted. Direct messages are never silently analyzed.
                  </p>
                </div>
              </div>

              {/* 5 Distinct Controls Grid */}
              <div className="space-y-3 pt-1">
                {/* 1. Workspace AI Global Switch */}
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl flex items-center justify-between gap-4 hover:border-white/20 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-sleek-violet" />
                      <h4 className="font-semibold text-xs text-white">1. Workspace AI Master Switch</h4>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      Globally permits or disables all AI agents, background digests, and task extractors across the organization.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleToggle('workspaceAiEnabled', controls.workspaceAiEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      controls.workspaceAiEnabled ? 'bg-emerald-500' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        controls.workspaceAiEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Channel AI Switch (Current Active Channel) */}
                {activeChannel && (
                  <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl flex items-center justify-between gap-4 hover:border-white/20 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Lock size={16} className="text-amber-400" />
                        <h4 className="font-semibold text-xs text-white">
                          2. Channel AI (# {activeChannel.name})
                        </h4>
                      </div>
                      <p className="text-[11px] text-white/50 leading-relaxed">
                        Authorize AI participation and summarization inside this specific channel.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleToggleCurrentChannel}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        channelAiState ? 'bg-emerald-500' : 'bg-white/20'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          channelAiState ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                )}

                {/* 3. Personal Assistant Switch */}
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl flex items-center justify-between gap-4 hover:border-white/20 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <UserCheck size={16} className="text-cyan-400" />
                      <h4 className="font-semibold text-xs text-white">3. Personal Writing Assistant</h4>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      Empowers AI to draft replies, agendas, and briefings aligned with your writing style profile.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleToggle('personalAssistantEnabled', controls.personalAssistantEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      controls.personalAssistantEnabled ? 'bg-emerald-500' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        controls.personalAssistantEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 4. Proactive Suggestions & Digests */}
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl flex items-center justify-between gap-4 hover:border-white/20 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <BellRing size={16} className="text-purple-400" />
                      <h4 className="font-semibold text-xs text-white">4. Proactive Suggestions & Digests</h4>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      Allows AI to prepare daily team digests and highlight potential operational blockers without being asked.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleToggle('proactiveSuggestionsEnabled', controls.proactiveSuggestionsEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      controls.proactiveSuggestionsEnabled ? 'bg-emerald-500' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        controls.proactiveSuggestionsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 5. Delegated Replies Switch */}
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl flex items-center justify-between gap-4 hover:border-white/20 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Bot size={16} className="text-rose-400" />
                      <h4 className="font-semibold text-xs text-white">5. Delegated AI Replies</h4>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      Allows AI assistant to draft or send authorized replies for routine acknowledgments. Always labeled "AI assistant for [Name]".
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleToggle('delegatedRepliesEnabled', controls.delegatedRepliesEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      controls.delegatedRepliesEnabled ? 'bg-emerald-500' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        controls.delegatedRepliesEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-rose-400">Failed to load controls.</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <span className="text-[11px] text-white/40">
            {saving ? 'Saving changes in real-time...' : 'Settings take effect immediately.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-sleek-violet hover:bg-sleek-violet/80 text-white text-xs font-semibold rounded-xl transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
