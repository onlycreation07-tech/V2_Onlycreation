import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Plus, 
  Loader2, 
  History, 
  UserCheck, 
  Compass,
  ArrowRight
} from 'lucide-react';
import { AttendanceRecord, LeaveRequest } from '../../types/teamHub';
import { teamHubChatService } from '../../services/teamHubChatService';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  currentUserId: string;
  currentUserName: string;
}

export default function AttendanceModal({
  isOpen,
  onClose,
  workspaceId,
  currentUserId,
  currentUserName
}: AttendanceModalProps) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'clock' | 'history' | 'leaves'>('clock');
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Clock In/Out state
  const [selectedLocation, setSelectedLocation] = useState<'studio_stage_1' | 'stage_2_lab' | 'remote' | 'on_location'>('studio_stage_1');
  const [notes, setNotes] = useState('');

  // Correction request state
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState<AttendanceRecord | null>(null);
  const [requestedCheckIn, setRequestedCheckIn] = useState('');
  const [requestedCheckOut, setRequestedCheckOut] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');

  // Leave request form
  const [leaveType, setLeaveType] = useState<LeaveRequest['type']>('paid_time_off');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const loadData = () => {
    setLoading(true);
    Promise.all([
      teamHubChatService.getAttendanceHistory(workspaceId),
      teamHubChatService.getLeaveRequests(workspaceId)
    ]).then(([rec, lvs]) => {
      setHistory(rec);
      setLeaves(lvs);
      setLoading(false);
    }).catch((err) => {
      console.error('Failed to load attendance data:', err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const todayRecord = history.find(h => h.userId === currentUserId && h.date === today);
  const isCheckedIn = todayRecord?.status === 'checked_in';

  const handleCheckIn = async () => {
    try {
      setActionInProgress(true);
      setToastMessage(null);
      await teamHubChatService.checkInAttendance(workspaceId, selectedLocation, notes.trim());
      setNotes('');
      loadData();
      setToastMessage({ text: 'Checked in successfully!', type: 'success' });
    } catch (err: any) {
      setToastMessage({ text: err.message || 'Check-in failed', type: 'error' });
    } finally {
      setActionInProgress(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionInProgress(true);
      setToastMessage(null);
      await teamHubChatService.checkOutAttendance(workspaceId);
      loadData();
      setToastMessage({ text: 'Checked out successfully!', type: 'success' });
    } catch (err: any) {
      setToastMessage({ text: err.message || 'Check-out failed', type: 'error' });
    } finally {
      setActionInProgress(false);
    }
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForCorrection || !correctionReason.trim()) return;

    try {
      setActionInProgress(true);
      setToastMessage(null);
      await teamHubChatService.requestAttendanceCorrection(workspaceId, selectedRecordForCorrection.id, {
        requestedCheckIn: requestedCheckIn || undefined,
        requestedCheckOut: requestedCheckOut || undefined,
        reason: correctionReason.trim()
      });
      setSelectedRecordForCorrection(null);
      setCorrectionReason('');
      setRequestedCheckIn('');
      setRequestedCheckOut('');
      loadData();
      setToastMessage({ text: 'Correction request submitted to manager review queue.', type: 'success' });
    } catch (err: any) {
      setToastMessage({ text: err.message || 'Failed to submit correction', type: 'error' });
    } finally {
      setActionInProgress(false);
    }
  };

  const handleReviewCorrection = async (recordId: string, decision: 'approved' | 'rejected') => {
    try {
      setActionInProgress(true);
      setToastMessage(null);
      await teamHubChatService.reviewAttendanceCorrection(workspaceId, recordId, decision);
      loadData();
      setToastMessage({ text: `Correction request ${decision}.`, type: 'success' });
    } catch (err: any) {
      setToastMessage({ text: err.message || 'Failed to review correction', type: 'error' });
    } finally {
      setActionInProgress(false);
    }
  };

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !leaveReason.trim()) return;

    try {
      setActionInProgress(true);
      setToastMessage(null);
      await teamHubChatService.createLeaveRequest(workspaceId, {
        type: leaveType,
        startDate,
        endDate,
        reason: leaveReason.trim()
      });
      setStartDate('');
      setEndDate('');
      setLeaveReason('');
      loadData();
      setToastMessage({ text: 'Leave request submitted successfully.', type: 'success' });
    } catch (err: any) {
      setToastMessage({ text: err.message || 'Failed to submit leave', type: 'error' });
    } finally {
      setActionInProgress(false);
    }
  };

  const handleReviewLeave = async (leaveId: string, decision: 'approved' | 'rejected') => {
    try {
      setActionInProgress(true);
      setToastMessage(null);
      await teamHubChatService.reviewLeaveRequest(workspaceId, leaveId, decision);
      loadData();
      setToastMessage({ text: `Leave request ${decision}.`, type: 'success' });
    } catch (err: any) {
      setToastMessage({ text: err.message || 'Failed to review leave', type: 'error' });
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0B0F19] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <Clock size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Crew Attendance & Shift Schedule</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-mono border border-emerald-500/20">
                  Explicit Time Clock
                </span>
              </h2>
              <p className="text-xs text-white/50">
                Audited check-in/out, shift records, corrections, and leave requests
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

        {/* Tab Navigation */}
        <div className="px-5 border-b border-white/10 flex items-center gap-2 bg-black/20 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('clock')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'clock'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Clock-In & Status
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Shift History & Corrections ({history.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leaves')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'leaves'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Leave Requests ({leaves.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {toastMessage && (
            <div className={`p-3 rounded-xl border text-xs flex items-center justify-between animate-fade-in ${
              toastMessage.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}>
              <div className="flex items-center gap-2">
                {toastMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{toastMessage.text}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setToastMessage(null)}
                className="text-white/40 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-16 flex justify-center text-white/40 text-xs">
              <Loader2 size={24} className="animate-spin text-emerald-500" />
            </div>
          ) : (
            <>
              {/* TAB 1: CLOCK IN / OUT */}
              {activeTab === 'clock' && (
                <div className="space-y-4">
                  {/* Status Clarification Strip */}
                  <div className="p-3 bg-white/[0.02] border border-white/10 rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                      <span className="text-[10px] text-white/40 uppercase block">Network</span>
                      <span className="text-emerald-400 font-semibold flex items-center justify-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                      <span className="text-[10px] text-white/40 uppercase block">Attendance</span>
                      <span className={`font-semibold flex items-center justify-center gap-1 mt-0.5 ${isCheckedIn ? 'text-emerald-400' : 'text-white/50'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isCheckedIn ? 'bg-emerald-400' : 'bg-white/30'}`} />
                        {isCheckedIn ? 'Checked In' : 'Checked Out'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                      <span className="text-[10px] text-white/40 uppercase block">Availability</span>
                      <span className="text-cyan-400 font-semibold flex items-center justify-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> On Shift
                      </span>
                    </div>
                  </div>

                  {/* Clock Action Card */}
                  <div className="p-5 bg-black/40 border border-white/10 rounded-2xl text-center space-y-4">
                    <div className="space-y-1">
                      <span className="text-2xl font-bold font-mono text-white">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <p className="text-xs text-white/50">
                        Today: {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>

                    {!isCheckedIn ? (
                      <div className="space-y-3 max-w-md mx-auto text-left">
                        <div>
                          <label className="block text-[11px] text-white/70 font-semibold mb-1">
                            Current Studio Location *
                          </label>
                          <select
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value as any)}
                            className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                          >
                            <option value="studio_stage_1">Stage 1 Main Studio (Lighting & Rigging)</option>
                            <option value="stage_2_lab">Stage 2 Virtual Production & LED Volume</option>
                            <option value="remote">Remote / Off-Set Post Production</option>
                            <option value="on_location">On-Location Commercial Shoot</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] text-white/70 font-semibold mb-1">
                            Shift Notes (Optional)
                          </label>
                          <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Ingesting RED anamorphic rushes..."
                            className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleCheckIn}
                          disabled={actionInProgress}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 mt-2"
                        >
                          {actionInProgress ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={18} />}
                          <span>Clock In for Shift</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 max-w-md mx-auto">
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                          ✓ Clocked in since <strong>{new Date(todayRecord?.checkInTime || '').toLocaleTimeString()}</strong> at <em>{todayRecord?.location?.replace('_', ' ')}</em>
                        </div>

                        <button
                          type="button"
                          onClick={handleCheckOut}
                          disabled={actionInProgress}
                          className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          {actionInProgress ? <Loader2 size={16} className="animate-spin" /> : <Clock size={18} />}
                          <span>Clock Out for Day</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: SHIFT HISTORY & CORRECTIONS */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Recent Attendance Logs</span>
                    <span className="text-white/40 text-[11px]">Explicit clock records</span>
                  </div>

                  <div className="space-y-2">
                    {history.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-3.5 bg-white/[0.02] border border-white/10 rounded-xl text-xs space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{rec.userName}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 font-mono">
                              {rec.date}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider self-start sm:self-auto ${
                              rec.status === 'checked_in'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-white/10 text-white/60'
                            }`}
                          >
                            {rec.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-white/60 font-mono">
                          <div>
                            <span className="text-white/30 block text-[10px]">In:</span>
                            <span>{new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div>
                            <span className="text-white/30 block text-[10px]">Out:</span>
                            <span>{rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                          </div>
                          <div>
                            <span className="text-white/30 block text-[10px]">Total Hours:</span>
                            <span>{rec.totalWorkingMinutes ? `${(rec.totalWorkingMinutes / 60).toFixed(1)} hrs` : 'In progress'}</span>
                          </div>
                          <div>
                            <span className="text-white/30 block text-[10px]">Location:</span>
                            <span className="truncate">{rec.location}</span>
                          </div>
                        </div>

                        {/* Correction Request Status or Button */}
                        {rec.correctionRequest ? (
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-200 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">Correction Request ({rec.correctionRequest.status})</span>
                              {rec.correctionRequest.status === 'pending' && (
                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleReviewCorrection(rec.id, 'rejected')}
                                    className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded text-[10px]"
                                  >
                                    Reject
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReviewCorrection(rec.id, 'approved')}
                                    className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px]"
                                  >
                                    Approve
                                  </button>
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] text-white/70">Reason: {rec.correctionRequest.reason}</p>
                          </div>
                        ) : (
                          rec.userId === currentUserId && (
                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => setSelectedRecordForCorrection(rec)}
                                className="text-[11px] text-sleek-violet hover:underline font-medium"
                              >
                                Request Time Correction
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Correction Request Modal Form */}
                  {selectedRecordForCorrection && (
                    <form onSubmit={handleSubmitCorrection} className="p-4 bg-black/60 border border-white/10 rounded-xl space-y-3 text-xs mt-3">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="font-bold text-white">
                          Request Correction for {selectedRecordForCorrection.date}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedRecordForCorrection(null)}
                          className="text-white/40 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-white/70 mb-1">Corrected Check In</label>
                          <input
                            type="time"
                            value={requestedCheckIn}
                            onChange={(e) => setRequestedCheckIn(e.target.value)}
                            className="w-full bg-[#0F172A] border border-white/10 rounded-lg p-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-white/70 mb-1">Corrected Check Out</label>
                          <input
                            type="time"
                            value={requestedCheckOut}
                            onChange={(e) => setRequestedCheckOut(e.target.value)}
                            className="w-full bg-[#0F172A] border border-white/10 rounded-lg p-2 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-white/70 mb-1">Reason for Correction *</label>
                        <input
                          type="text"
                          value={correctionReason}
                          onChange={(e) => setCorrectionReason(e.target.value)}
                          placeholder="e.g. Forgot to clock out due to overtime shoot on Stage 1 wrap"
                          required
                          className="w-full bg-[#0F172A] border border-white/10 rounded-lg p-2 text-xs text-white"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRecordForCorrection(null)}
                          className="px-3 py-1 bg-white/5 text-white/60 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3.5 py-1 bg-emerald-600 text-white font-semibold rounded-lg"
                        >
                          Submit to Manager
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 3: LEAVE REQUESTS */}
              {activeTab === 'leaves' && (
                <div className="space-y-4">
                  {/* Leave Request Form */}
                  <form onSubmit={handleCreateLeave} className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-3 text-xs">
                    <h4 className="font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-emerald-400">
                      <Plus size={13} /> Submit Leave Request
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-white/70 mb-1">Leave Type *</label>
                        <select
                          value={leaveType}
                          onChange={(e) => setLeaveType(e.target.value as any)}
                          className="w-full bg-[#0F172A] border border-white/10 rounded-xl p-2 text-xs text-white"
                        >
                          <option value="paid_time_off">Paid Time Off (PTO)</option>
                          <option value="sick_leave">Sick Leave</option>
                          <option value="production_wrap_comp">Production Wrap Comp Day</option>
                          <option value="unpaid">Unpaid Leave</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-white/70 mb-1">Start Date *</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          required
                          className="w-full bg-[#0F172A] border border-white/10 rounded-xl p-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-white/70 mb-1">End Date *</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          required
                          className="w-full bg-[#0F172A] border border-white/10 rounded-xl p-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-white/70 mb-1">Reason / Handover Note *</label>
                      <input
                        type="text"
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        placeholder="e.g. Wrap compensatory leave after weekend 4K commercial shoot"
                        required
                        className="w-full bg-[#0F172A] border border-white/10 rounded-xl p-2 text-xs text-white"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={actionInProgress}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs"
                      >
                        Submit Request
                      </button>
                    </div>
                  </form>

                  {/* Leave Requests List */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-white block">Submitted Leave Requests</span>
                    {leaves.map((l) => (
                      <div
                        key={l.id}
                        className="p-3 bg-white/[0.02] border border-white/10 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{l.userName}</span>
                            <span className="text-[10px] text-white/50 font-mono">
                              {l.startDate} → {l.endDate}
                            </span>
                            <span
                              className={`px-2 py-0.2 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                l.status === 'approved'
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : l.status === 'rejected'
                                  ? 'bg-rose-500/15 text-rose-400'
                                  : 'bg-amber-500/15 text-amber-400'
                              }`}
                            >
                              {l.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/70">{l.reason}</p>
                        </div>

                        {l.status === 'pending' && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleReviewLeave(l.id, 'rejected')}
                              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg text-xs"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReviewLeave(l.id, 'approved')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs"
                            >
                              Approve
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
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
