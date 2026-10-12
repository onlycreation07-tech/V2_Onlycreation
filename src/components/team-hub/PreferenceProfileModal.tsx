import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sliders, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  Download, 
  Trash2, 
  Plus, 
  Loader2, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { UserPreferenceProfile, DecisionRule } from '../../types/teamHub';
import { teamHubChatService } from '../../services/teamHubChatService';

interface PreferenceProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export default function PreferenceProfileModal({
  isOpen,
  onClose,
  workspaceId
}: PreferenceProfileModalProps) {
  if (!isOpen) return null;

  const [profile, setProfile] = useState<UserPreferenceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'tone' | 'rules' | 'priorities' | 'privacy'>('tone');

  // Load profile
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    teamHubChatService.getPreferenceProfile(workspaceId)
      .then((data) => {
        if (mounted) {
          setProfile(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load profile:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [workspaceId]);

  const handleSave = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      const updated = await teamHubChatService.updatePreferenceProfile(workspaceId, profile);
      setProfile(updated);
      alert('Preference profile successfully saved.');
    } catch (err: any) {
      alert(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleExportJson = () => {
    if (!profile) return;
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preference_profile_${profile.userId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your preference profile? It will reset to defaults.')) return;
    try {
      setSaving(true);
      await teamHubChatService.deletePreferenceProfile(workspaceId);
      const fresh = await teamHubChatService.getPreferenceProfile(workspaceId);
      setProfile(fresh);
      alert('Profile reset to defaults.');
    } catch (err: any) {
      alert(err.message || 'Failed to delete profile');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleOptIn = async (optedIn: boolean) => {
    if (!profile) return;
    try {
      await teamHubChatService.optInHistoryLearning(workspaceId, optedIn);
      setProfile(prev => prev ? { ...prev, optedInForHistoryLearning: optedIn } : null);
    } catch (err: any) {
      alert(err.message || 'Failed to toggle opt-in');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-white">
            <Sliders size={18} className="text-sleek-violet" />
            <div>
              <h3 className="font-bold text-sm">Manager & CXO Preference Profile</h3>
              <p className="text-[11px] text-white/50">
                Control writing tone, decision rules, and assistant boundaries.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="px-5 border-b border-white/10 flex items-center gap-2 shrink-0 bg-black/20 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('tone')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'tone'
                ? 'border-sleek-violet text-white'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Tone & Schedule
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'rules'
                ? 'border-sleek-violet text-white'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Decision Rules & Limits
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('priorities')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'priorities'
                ? 'border-sleek-violet text-white'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Priorities & Examples
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'privacy'
                ? 'border-sleek-violet text-white'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Privacy & Opt-In
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-5 text-xs text-white/80 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-white/40">
              <Loader2 size={24} className="animate-spin text-sleek-violet" />
            </div>
          ) : !profile ? (
            <p className="text-center py-12 text-white/40">Could not load profile.</p>
          ) : (
            <>
              {/* Tab 1: Tone & Schedule */}
              {activeTab === 'tone' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-white">Preferred Writing Tone</label>
                      <span className="text-[10px] text-emerald-400 font-mono">Confirmed by User</span>
                    </div>
                    <input
                      type="text"
                      value={profile.writingTone}
                      onChange={(e) => setProfile({ ...profile, writingTone: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 focus:border-sleek-violet rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-white/40">
                      e.g. "Direct, metric-driven, confident" or "Diplomatic, encouraging"
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-white mb-1">Communication Style</label>
                    <textarea
                      value={profile.communicationStyle}
                      onChange={(e) => setProfile({ ...profile, communicationStyle: e.target.value })}
                      rows={2}
                      className="w-full bg-black/40 border border-white/10 focus:border-sleek-violet rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none resize-none"
                    />
                  </div>

                  {/* Working Hours */}
                  <div className="p-3 bg-black/30 border border-white/5 rounded-xl space-y-3">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Clock size={13} className="text-sleek-violet" /> Working Hours & Reminder Window
                    </span>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-white/50 block mb-1">Start Time</label>
                        <input
                          type="time"
                          value={profile.workingHours.start}
                          onChange={(e) => setProfile({
                            ...profile,
                            workingHours: { ...profile.workingHours, start: e.target.value }
                          })}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-white/50 block mb-1">End Time</label>
                        <input
                          type="time"
                          value={profile.workingHours.end}
                          onChange={(e) => setProfile({
                            ...profile,
                            workingHours: { ...profile.workingHours, end: e.target.value }
                          })}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-white/50 block mb-1">Timezone</label>
                        <input
                          type="text"
                          value={profile.workingHours.timezone}
                          onChange={(e) => setProfile({
                            ...profile,
                            workingHours: { ...profile.workingHours, timezone: e.target.value }
                          })}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Decision Rules & Escalation */}
              {activeTab === 'rules' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-white mb-1">
                      Budget Escalation Threshold ($ USD)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-white/40 font-mono text-xs">$</span>
                      <input
                        type="number"
                        value={profile.escalationThresholdAmount}
                        onChange={(e) => setProfile({ ...profile, escalationThresholdAmount: Number(e.target.value) })}
                        className="w-full bg-black/40 border border-white/10 focus:border-sleek-violet rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-white/40">
                      Any requested expense exceeding this amount requires human CXO approval.
                    </p>
                  </div>

                  {/* Decision Rules List */}
                  <div className="space-y-2">
                    <label className="block font-semibold text-white">Approved Decision Rules</label>
                    {profile.approvedDecisionRules.map((rule, idx) => (
                      <div key={rule.id} className="p-3 bg-black/30 border border-white/5 rounded-xl space-y-1 relative group">
                        <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                          <span>Rule #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = profile.approvedDecisionRules.filter(r => r.id !== rule.id);
                              setProfile({ ...profile, approvedDecisionRules: updated });
                            }}
                            className="text-white/40 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <p className="text-white text-xs font-medium">When: {rule.condition}</p>
                        <p className="text-white/60 text-[11px]">Action: {rule.approvedAction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Priorities & Examples */}
              {activeTab === 'priorities' && (
                <div className="space-y-4">
                  {/* Project Priorities */}
                  <div>
                    <label className="block font-semibold text-white mb-1">Current Strategic Priorities</label>
                    <div className="space-y-1.5">
                      {profile.projectPriorities.map((prio, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-black/30 border border-white/5 rounded-lg text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-sleek-violet" />
                          <span className="flex-1 truncate">{prio}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Approved Reply Examples */}
                  <div>
                    <label className="block font-semibold text-white mb-1">Approved Reply Examples</label>
                    <div className="space-y-2">
                      {profile.approvedReplyExamples.map((ex, idx) => (
                        <div key={idx} className="p-2.5 bg-black/30 border border-white/5 rounded-xl text-xs text-white/80 italic">
                          "{ex}"
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Privacy & Opt-In */}
              {activeTab === 'privacy' && (
                <div className="space-y-4">
                  <div className="p-4 bg-sleek-violet/10 border border-sleek-violet/30 rounded-xl space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-sleek-violet" />
                          Conversation History Learning
                        </h4>
                        <p className="text-[11px] text-white/70 mt-1 leading-relaxed">
                          Require explicit consent before analyzing conversation threads to suggest updates to your tone or decision rules. Preferences are never modified silently.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={profile.optedInForHistoryLearning}
                        onChange={(e) => handleToggleOptIn(e.target.checked)}
                        className="w-4 h-4 rounded text-sleek-violet focus:ring-0 cursor-pointer mt-1"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1 text-[11px] text-white/50">
                    <p>• Profile data is strictly isolated to your user ID and workspace.</p>
                    <p>• Private channels are excluded from automated profile modeling.</p>
                    <p>• You may export or purge this profile at any time.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between shrink-0 bg-black/30">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download size={13} />
              <span>Export JSON</span>
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 size={13} />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !profile}
              className="px-4 py-2 bg-sleek-violet hover:bg-sleek-violet/80 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md disabled:opacity-40"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <span>Save Changes</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
