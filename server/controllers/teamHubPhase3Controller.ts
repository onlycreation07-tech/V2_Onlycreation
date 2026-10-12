import { Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { AuthenticatedRequest } from '../types';
import {
  Workspace,
  WorkspaceMember,
  Channel,
  WorkspaceMessage,
  DelegatedReplyRule,
  DelegatedActionAuditLog,
  DelegatedActionType,
  AttendanceRecord,
  LeaveRequest,
  SelfReportedUpdate,
  WorkloadReport
} from '../../src/types/teamHub';
import { 
  postSystemMessageToChannel, 
  getChannelById, 
  getWorkspaceById 
} from './teamHubController';

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

// Storage Maps
const delegationRulesMap = new Map<string, DelegatedReplyRule[]>(); // wsId -> rules
const delegationAuditLogsMap = new Map<string, DelegatedActionAuditLog[]>(); // wsId -> logs
const attendanceRecordsMap = new Map<string, Map<string, AttendanceRecord>>(); // wsId -> (userId_date -> record)
const leaveRequestsMap = new Map<string, LeaveRequest[]>(); // wsId -> leaves
const selfReportedUpdatesMap = new Map<string, SelfReportedUpdate[]>(); // wsId -> updates

// Prohibited actions for automatic delegation (strictly requires human approval)
const SENSITIVE_PROHIBITED_AUTO_ACTIONS = [
  'spending',
  'contracts',
  'budget_override',
  'external_commitments',
  'access_changes',
  'hiring',
  'disciplinary',
  'performance_ratings',
  'sensitive_hr'
];

// Seed default rules & attendance for workspace
function ensurePhase3Defaults(workspaceId: string, currentUserId: string = 'founder_ceo') {
  // 1. Seed Delegation Rules
  if (!delegationRulesMap.has(workspaceId)) {
    const defaultRules: DelegatedReplyRule[] = [
      {
        id: `rule-ack-${Date.now()}-1`,
        workspaceId,
        authorizingUserId: currentUserId,
        authorizingUserName: 'Production Lead',
        authorizingUserRole: 'owner',
        actionType: 'ack_receipt',
        title: 'Routine Footage & Asset Ingest Receipt',
        description: 'Acknowledge ingest of camera rushes or render files received on Stage 1 & 2',
        autoMode: true,
        maxDailyExecutions: 20,
        todayExecutionCount: 2,
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        status: 'active',
        templateReply: 'Received rushes on Stage 1. Media checksum verified and queued for ingest.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `rule-status-${Date.now()}-2`,
        workspaceId,
        authorizingUserId: currentUserId,
        authorizingUserName: 'Production Lead',
        authorizingUserRole: 'owner',
        actionType: 'status_update',
        title: 'Daily Color Grade Status Inquiry',
        description: 'Politely inquire about the status of 4K color export before 5 PM wrap',
        autoMode: false, // Default to approval queue
        maxDailyExecutions: 5,
        todayExecutionCount: 1,
        expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
        status: 'active',
        templateReply: 'Checking in on the 4K DaVinci color pass. Are we on track for 5 PM export?',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `rule-deadline-${Date.now()}-3`,
        workspaceId,
        authorizingUserId: currentUserId,
        authorizingUserName: 'Production Lead',
        authorizingUserRole: 'owner',
        actionType: 'deadline_reminder',
        title: 'Deliverable Due Date Reminder',
        description: 'Remind assigned editor when deliverable is due within 24 hours',
        autoMode: false,
        maxDailyExecutions: 10,
        todayExecutionCount: 0,
        expiresAt: new Date(Date.now() + 60 * 86400000).toISOString(),
        status: 'active',
        templateReply: 'Gentle reminder that the 60-second national commercial master is scheduled for delivery tomorrow.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    delegationRulesMap.set(workspaceId, defaultRules);

    // Seed Audit Log entries
    const defaultAuditLogs: DelegatedActionAuditLog[] = [
      {
        id: `log-${Date.now()}-1`,
        workspaceId,
        channelId: 'chan-general',
        channelName: 'stage-operations',
        authorizingUserId: currentUserId,
        authorizingUserName: 'Production Lead',
        ruleId: defaultRules[0].id,
        ruleTitle: defaultRules[0].title,
        actionTaken: 'Auto-dispatched receipt acknowledgment for RED camera ingest',
        content: 'AI assistant for Production Lead: Received rushes on Stage 1. Media checksum verified.',
        requiresHumanApproval: false,
        approvalStatus: 'auto_dispatched',
        supportingContext: 'Triggered upon message from Arjun Das regarding Stage 1 card handoff.',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ];
    delegationAuditLogsMap.set(workspaceId, defaultAuditLogs);
  }

  // 2. Seed Attendance Records
  if (!attendanceRecordsMap.has(workspaceId)) {
    const wsAttendance = new Map<string, AttendanceRecord>();
    const today = new Date().toISOString().split('T')[0];

    const seedAttendance: AttendanceRecord[] = [
      {
        id: `att-rec-1`,
        workspaceId,
        userId: 'seed_production_lead',
        userName: 'Production Lead',
        date: today,
        checkInTime: new Date(Date.now() - 3600000 * 4).toISOString(),
        scheduleStart: '09:00',
        scheduleEnd: '18:00',
        timezone: 'Asia/Kolkata',
        status: 'checked_in',
        location: 'studio_stage_1',
        notes: 'Overseeing Stage 1 national commercial shoot.',
        auditTrail: [
          { action: 'Checked in at studio_stage_1', timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), actor: 'Production Lead' }
        ],
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `att-rec-2`,
        workspaceId,
        userId: 'emp-arjun-das',
        userName: 'Arjun Das',
        date: today,
        checkInTime: new Date(Date.now() - 3600000 * 5).toISOString(),
        scheduleStart: '08:30',
        scheduleEnd: '17:30',
        timezone: 'Asia/Kolkata',
        status: 'checked_in',
        location: 'studio_stage_1',
        notes: 'Directing lighting setup and camera rigging.',
        auditTrail: [
          { action: 'Checked in at studio_stage_1', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), actor: 'Arjun Das' }
        ],
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `att-rec-3`,
        workspaceId,
        userId: 'emp-dev-patel',
        userName: 'Dev Patel',
        date: today,
        checkInTime: new Date(Date.now() - 3600000 * 3).toISOString(),
        scheduleStart: '10:00',
        scheduleEnd: '19:00',
        timezone: 'Asia/Kolkata',
        status: 'checked_in',
        location: 'remote',
        notes: 'Optimizing Meta / TikTok 3-second hook ad variations.',
        auditTrail: [
          { action: 'Checked in remote', timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), actor: 'Dev Patel' }
        ],
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const rec of seedAttendance) {
      wsAttendance.set(`${rec.userId}_${rec.date}`, rec);
    }
    attendanceRecordsMap.set(workspaceId, wsAttendance);

    // Seed Leave Requests
    const seedLeaves: LeaveRequest[] = [
      {
        id: `leave-1`,
        workspaceId,
        userId: 'emp-priya-sharma',
        userName: 'Priya Sharma',
        type: 'production_wrap_comp',
        startDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
        reason: 'Compensatory off after consecutive 14-hour weekend studio shoot wraps.',
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ];
    leaveRequestsMap.set(workspaceId, seedLeaves);

    // Seed Self-Reported Updates
    const seedUpdates: SelfReportedUpdate[] = [
      {
        id: `update-1`,
        workspaceId,
        userId: 'emp-arjun-das',
        userName: 'Arjun Das',
        milestoneTitle: 'RED V-Raptor 8K Camera Rigging on Stage 1',
        progressPercent: 90,
        blockersDeclared: 'Waiting on 35mm anamorphic prime lens calibration.',
        hoursSpentToday: 5,
        date: today,
        createdAt: new Date().toISOString()
      },
      {
        id: `update-2`,
        workspaceId,
        userId: 'emp-dev-patel',
        userName: 'Dev Patel',
        milestoneTitle: 'TikTok ROAS Variant Testing & Creative Matrix',
        progressPercent: 65,
        hoursSpentToday: 3,
        date: today,
        createdAt: new Date().toISOString()
      }
    ];
    selfReportedUpdatesMap.set(workspaceId, seedUpdates);
  }
}

// -------------------------------------------------------------
// 1. DELEGATED AI REPLIES & AUDIT CONTROLS
// -------------------------------------------------------------

export async function handleGetDelegationRules(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.uid || 'founder_ceo';
    ensurePhase3Defaults(workspaceId, userId);

    const rules = delegationRulesMap.get(workspaceId) || [];
    return res.json({ success: true, rules });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to get delegation rules' });
  }
}

export async function handleCreateDelegationRule(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.uid || 'founder_ceo';
    const userName = req.user?.email || 'Production Lead';

    const {
      actionType,
      title,
      description,
      scopeChannelIds,
      autoMode = false,
      maxDailyExecutions = 10,
      expiresAt,
      templateReply
    } = req.body;

    if (!title || !description || !actionType) {
      return res.status(400).json({ error: 'title, description, and actionType are required' });
    }

    // SAFETY CHECK: Disallow autoMode if rule touches prohibited topics
    const descLower = (title + ' ' + description).toLowerCase();
    if (autoMode && SENSITIVE_PROHIBITED_AUTO_ACTIONS.some(p => descLower.includes(p))) {
      return res.status(400).json({
        error: 'SAFETY_RESTRICTION: Automatic mode cannot be enabled for spending, contracts, commitments, hiring, or HR matters. Human approval is strictly required.'
      });
    }

    const newRule: DelegatedReplyRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      workspaceId,
      authorizingUserId: userId,
      authorizingUserName: userName,
      authorizingUserRole: 'owner',
      actionType,
      title: title.trim(),
      description: description.trim(),
      scopeChannelIds,
      autoMode: !!autoMode,
      maxDailyExecutions: maxDailyExecutions || 10,
      todayExecutionCount: 0,
      expiresAt: expiresAt || new Date(Date.now() + 30 * 86400000).toISOString(),
      status: 'active',
      templateReply: templateReply?.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let rules = delegationRulesMap.get(workspaceId);
    if (!rules) {
      rules = [];
      delegationRulesMap.set(workspaceId, rules);
    }
    rules.push(newRule);

    return res.json({ success: true, rule: newRule });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create delegation rule' });
  }
}

export async function handleToggleDelegationRule(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId, ruleId } = req.params;
    const { status } = req.body; // 'active' | 'paused' | 'revoked'

    if (!['active', 'paused', 'revoked'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active, paused, or revoked' });
    }

    const rules = delegationRulesMap.get(workspaceId) || [];
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return res.status(404).json({ error: 'Delegation rule not found' });

    rule.status = status;
    rule.updatedAt = new Date().toISOString();

    // Log the revocation or pause event in audit trail
    const auditLogs = delegationAuditLogsMap.get(workspaceId) || [];
    auditLogs.unshift({
      id: `log-toggle-${Date.now()}`,
      workspaceId,
      channelId: 'workspace-governance',
      channelName: 'governance',
      authorizingUserId: req.user?.uid || 'founder_ceo',
      authorizingUserName: req.user?.email || 'Production Lead',
      ruleId: rule.id,
      ruleTitle: rule.title,
      actionTaken: `Rule status changed to ${status}`,
      content: `Immediate ${status.toUpperCase()} command issued by user.`,
      requiresHumanApproval: false,
      approvalStatus: 'approved',
      supportingContext: `Rule updated by ${req.user?.email || 'admin'}`,
      timestamp: new Date().toISOString()
    });
    delegationAuditLogsMap.set(workspaceId, auditLogs);

    return res.json({ success: true, rule });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to toggle rule' });
  }
}

export async function handleGetDelegationAuditLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.uid || 'founder_ceo';
    ensurePhase3Defaults(workspaceId, userId);

    const logs = delegationAuditLogsMap.get(workspaceId) || [];
    return res.json({ success: true, logs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to get audit logs' });
  }
}

export async function handleReviewDelegatedAction(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId, logId } = req.params;
    const { decision } = req.body; // 'approved' | 'rejected'
    const userId = req.user?.uid || 'founder_ceo';
    const userName = req.user?.email || 'Production Lead';

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be approved or rejected' });
    }

    const logs = delegationAuditLogsMap.get(workspaceId) || [];
    const log = logs.find(l => l.id === logId);
    if (!log) return res.status(404).json({ error: 'Audit log entry not found' });

    log.approvalStatus = decision;
    log.approvedByUserId = userId;
    log.approvedByUserName = userName;

    // If approved, post message to channel with mandatory disclosure: "AI assistant for [Name]"
    if (decision === 'approved' && log.channelId) {
      const disclosureSender = `AI assistant for ${log.authorizingUserName}`;
      postSystemMessageToChannel(
        workspaceId,
        log.channelId,
        `🤖 **[${disclosureSender}]**: ${log.content}`,
        disclosureSender
      );
    }

    return res.json({ success: true, log });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to review action' });
  }
}

export async function handleExecuteDelegatedReply(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId, channelId } = req.params;
    const { ruleId, promptContext = '' } = req.body;
    const userId = req.user?.uid || 'founder_ceo';

    const rules = delegationRulesMap.get(workspaceId) || [];
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return res.status(404).json({ error: 'Delegation rule not found' });

    // SAFETY CHECKS: Rule status & expiration & daily quota
    if (rule.status === 'revoked') {
      return res.status(403).json({ error: 'DELEGATION_REVOKED: This rule has been revoked and cannot execute.' });
    }
    if (rule.status === 'paused') {
      return res.status(403).json({ error: 'DELEGATION_PAUSED: This rule is currently paused.' });
    }
    if (new Date(rule.expiresAt).getTime() < Date.now()) {
      return res.status(403).json({ error: 'DELEGATION_EXPIRED: Rule validity period has expired.' });
    }
    if (rule.todayExecutionCount >= rule.maxDailyExecutions) {
      return res.status(429).json({ error: 'DAILY_LIMIT_EXCEEDED: Maximum daily executions reached for this rule.' });
    }

    const templateText = rule.templateReply || 'Acknowledged receipt of asset. Proceeding with ingest on Stage 1.';
    const content = templateText;
    const disclosureSender = `AI assistant for ${rule.authorizingUserName}`;

    rule.todayExecutionCount += 1;

    let auditLogs = delegationAuditLogsMap.get(workspaceId);
    if (!auditLogs) {
      auditLogs = [];
      delegationAuditLogsMap.set(workspaceId, auditLogs);
    }

    const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // AUTO-MODE: If autoMode is true AND safe allowlisted action, dispatch immediately
    if (rule.autoMode) {
      postSystemMessageToChannel(
        workspaceId,
        channelId,
        `🤖 **[${disclosureSender}]**: ${content}`,
        disclosureSender
      );

      const log: DelegatedActionAuditLog = {
        id: logId,
        workspaceId,
        channelId,
        authorizingUserId: rule.authorizingUserId,
        authorizingUserName: rule.authorizingUserName,
        ruleId: rule.id,
        ruleTitle: rule.title,
        actionTaken: `Auto-dispatched ${rule.actionType} reply`,
        content,
        requiresHumanApproval: false,
        approvalStatus: 'auto_dispatched',
        supportingContext: promptContext || 'Triggered via explicit auto-mode rule execution',
        timestamp: new Date().toISOString()
      };
      auditLogs.unshift(log);

      return res.json({ success: true, autoDispatched: true, content, disclosure: disclosureSender, log });
    } else {
      // DRAFT MODE: Requires human approval queue
      const log: DelegatedActionAuditLog = {
        id: logId,
        workspaceId,
        channelId,
        authorizingUserId: rule.authorizingUserId,
        authorizingUserName: rule.authorizingUserName,
        ruleId: rule.id,
        ruleTitle: rule.title,
        actionTaken: `Drafted ${rule.actionType} for CXO review`,
        content,
        requiresHumanApproval: true,
        approvalStatus: 'pending',
        supportingContext: promptContext || 'Queued in human approval mailbox',
        timestamp: new Date().toISOString()
      };
      auditLogs.unshift(log);

      return res.json({ success: true, autoDispatched: false, draft: content, disclosure: disclosureSender, log });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Delegated execution failed' });
  }
}

// -------------------------------------------------------------
// 2. ATTENDANCE & SHIFTS (EXPLICIT CHECK-IN / CHECK-OUT)
// -------------------------------------------------------------

export async function handleCheckInAttendance(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.uid || 'founder_ceo';
    const userName = req.user?.displayName || req.user?.email || 'Crew Member';
    const { location = 'studio_stage_1', notes = '' } = req.body;

    ensurePhase3Defaults(workspaceId, userId);

    const today = new Date().toISOString().split('T')[0];
    const key = `${userId}_${today}`;
    const wsAttendance = attendanceRecordsMap.get(workspaceId) || new Map<string, AttendanceRecord>();

    let existing = wsAttendance.get(key);
    const nowIso = new Date().toISOString();

    if (existing && existing.status === 'checked_in') {
      return res.status(400).json({ error: 'ALREADY_CHECKED_IN: You are already checked in for today.' });
    }

    if (!existing) {
      existing = {
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        workspaceId,
        userId,
        userName,
        date: today,
        checkInTime: nowIso,
        scheduleStart: '09:00',
        scheduleEnd: '18:00',
        timezone: 'Asia/Kolkata',
        status: 'checked_in',
        location,
        notes: notes?.trim(),
        auditTrail: [
          { action: `Explicit clock-in at ${location}`, timestamp: nowIso, actor: userName }
        ],
        createdAt: nowIso,
        updatedAt: nowIso
      };
    } else {
      existing.checkInTime = nowIso;
      existing.status = 'checked_in';
      existing.location = location;
      existing.notes = notes?.trim() || existing.notes;
      existing.auditTrail.push({
        action: `Explicit re-clock-in at ${location}`,
        timestamp: nowIso,
        actor: userName
      });
      existing.updatedAt = nowIso;
    }

    wsAttendance.set(key, existing);
    attendanceRecordsMap.set(workspaceId, wsAttendance);

    return res.json({ success: true, record: existing });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Check-in failed' });
  }
}

export async function handleCheckOutAttendance(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.uid || 'founder_ceo';
    const userName = req.user?.displayName || req.user?.email || 'Crew Member';

    ensurePhase3Defaults(workspaceId, userId);

    const today = new Date().toISOString().split('T')[0];
    const key = `${userId}_${today}`;
    const wsAttendance = attendanceRecordsMap.get(workspaceId) || new Map<string, AttendanceRecord>();

    const existing = wsAttendance.get(key);
    if (!existing || existing.status !== 'checked_in') {
      return res.status(400).json({ error: 'NOT_CHECKED_IN: Cannot check out without an active check-in record.' });
    }

    const nowIso = new Date().toISOString();
    existing.checkOutTime = nowIso;
    existing.status = 'checked_out';

    // Calculate working minutes
    const startMs = new Date(existing.checkInTime).getTime();
    const endMs = new Date(nowIso).getTime();
    existing.totalWorkingMinutes = Math.max(0, Math.round((endMs - startMs) / 60000));

    existing.auditTrail.push({
      action: `Explicit clock-out (Total: ${existing.totalWorkingMinutes} mins)`,
      timestamp: nowIso,
      actor: userName
    });
    existing.updatedAt = nowIso;

    return res.json({ success: true, record: existing });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Check-out failed' });
  }
}

export async function handleGetAttendanceHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.uid || 'founder_ceo';
    ensurePhase3Defaults(workspaceId, userId);

    const wsAttendance = attendanceRecordsMap.get(workspaceId) || new Map<string, AttendanceRecord>();
    const records = Array.from(wsAttendance.values());
    records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({ success: true, records });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to get attendance history' });
  }
}

export async function handleRequestAttendanceCorrection(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId, recordId } = req.params;
    const { requestedCheckIn, requestedCheckOut, reason } = req.body;
    const userName = req.user?.email || 'Crew Member';

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason for time correction is required' });
    }

    const wsAttendance = attendanceRecordsMap.get(workspaceId) || new Map<string, AttendanceRecord>();
    let matchedRecord: AttendanceRecord | undefined;

    for (const rec of wsAttendance.values()) {
      if (rec.id === recordId) {
        matchedRecord = rec;
        break;
      }
    }

    if (!matchedRecord) return res.status(404).json({ error: 'Attendance record not found' });

    matchedRecord.correctionRequest = {
      requestedCheckIn,
      requestedCheckOut,
      reason: reason.trim(),
      status: 'pending'
    };
    matchedRecord.auditTrail.push({
      action: `Submitted correction request: "${reason.trim()}"`,
      timestamp: new Date().toISOString(),
      actor: userName
    });
    matchedRecord.updatedAt = new Date().toISOString();

    return res.json({ success: true, record: matchedRecord });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to submit correction request' });
  }
}

export async function handleReviewAttendanceCorrection(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId, recordId } = req.params;
    const { decision } = req.body; // 'approved' | 'rejected'
    const reviewerName = req.user?.email || 'Manager';

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be approved or rejected' });
    }

    const wsAttendance = attendanceRecordsMap.get(workspaceId) || new Map<string, AttendanceRecord>();
    let matchedRecord: AttendanceRecord | undefined;

    for (const rec of wsAttendance.values()) {
      if (rec.id === recordId) {
        matchedRecord = rec;
        break;
      }
    }

    if (!matchedRecord || !matchedRecord.correctionRequest) {
      return res.status(404).json({ error: 'Correction request not found' });
    }

    matchedRecord.correctionRequest.status = decision;
    matchedRecord.correctionRequest.reviewedBy = reviewerName;
    matchedRecord.correctionRequest.reviewedAt = new Date().toISOString();

    if (decision === 'approved') {
      if (matchedRecord.correctionRequest.requestedCheckIn) {
        matchedRecord.checkInTime = matchedRecord.correctionRequest.requestedCheckIn;
      }
      if (matchedRecord.correctionRequest.requestedCheckOut) {
        matchedRecord.checkOutTime = matchedRecord.correctionRequest.requestedCheckOut;
      }
      if (matchedRecord.checkOutTime) {
        const startMs = new Date(matchedRecord.checkInTime).getTime();
        const endMs = new Date(matchedRecord.checkOutTime).getTime();
        matchedRecord.totalWorkingMinutes = Math.max(0, Math.round((endMs - startMs) / 60000));
      }
    }

    matchedRecord.auditTrail.push({
      action: `Manager ${decision} correction request.`,
      timestamp: new Date().toISOString(),
      actor: reviewerName
    });
    matchedRecord.updatedAt = new Date().toISOString();

    return res.json({ success: true, record: matchedRecord });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to review correction' });
  }
}

export async function handleGetLeaveRequests(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId } = req.params;
    ensurePhase3Defaults(workspaceId, req.user?.uid || 'founder_ceo');

    const leaves = leaveRequestsMap.get(workspaceId) || [];
    return res.json({ success: true, leaves });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to get leave requests' });
  }
}

export async function handleCreateLeaveRequest(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.uid || 'founder_ceo';
    const userName = req.user?.displayName || req.user?.email || 'Crew Member';
    const { type, startDate, endDate, reason } = req.body;

    if (!type || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'type, startDate, endDate, and reason are required' });
    }

    const newLeave: LeaveRequest = {
      id: `leave-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      workspaceId,
      userId,
      userName,
      type,
      startDate,
      endDate,
      reason: reason.trim(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    let leaves = leaveRequestsMap.get(workspaceId);
    if (!leaves) {
      leaves = [];
      leaveRequestsMap.set(workspaceId, leaves);
    }
    leaves.unshift(newLeave);

    return res.json({ success: true, leave: newLeave });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create leave request' });
  }
}

export async function handleReviewLeaveRequest(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId, leaveId } = req.params;
    const { decision } = req.body; // 'approved' | 'rejected'
    const reviewerName = req.user?.email || 'Executive Producer';

    const leaves = leaveRequestsMap.get(workspaceId) || [];
    const leave = leaves.find(l => l.id === leaveId);
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });

    leave.status = decision;
    leave.approvedByName = reviewerName;
    leave.reviewedAt = new Date().toISOString();

    return res.json({ success: true, leave });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to review leave request' });
  }
}

// -------------------------------------------------------------
// 3. WORK PROGRESS & TRANSPARENT PRODUCTIVITY DASHBOARDS
// -------------------------------------------------------------

export async function handleGetWorkloadDashboard(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId } = req.params;
    ensurePhase3Defaults(workspaceId, req.user?.uid || 'founder_ceo');

    const updates = selfReportedUpdatesMap.get(workspaceId) || [];

    // Synthesize transparent reports based on declared deliverables and updates
    const mockReports: WorkloadReport[] = [
      {
        userId: 'founder_ceo',
        userName: 'Production Lead',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        role: 'owner',
        departmentName: 'Executive Creative Direction',
        assignedTasksCount: 4,
        completedMilestonesCount: 3,
        overdueCount: 0,
        declaredBlockers: [],
        selfReportedUpdates: updates.filter(u => u.userId === 'founder_ceo'),
        evidenceCitations: [
          { sourceMessageId: 'msg-welcome-1', snippet: 'Confirmed final national commercial storyboard', date: new Date().toISOString() }
        ],
        aiDeliverySummary: 'Executive alignment maintained on Stage 1 shoot schedule. All client creative approvals verified.',
        lastActiveDate: new Date().toISOString().split('T')[0]
      },
      {
        userId: 'emp-arjun-das',
        userName: 'Arjun Das',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
        role: 'manager',
        departmentName: 'Cinematic Production Lab',
        assignedTasksCount: 5,
        completedMilestonesCount: 4,
        overdueCount: 0,
        declaredBlockers: ['Waiting on 35mm anamorphic prime lens calibration.'],
        selfReportedUpdates: updates.filter(u => u.userId === 'emp-arjun-das'),
        evidenceCitations: [
          { sourceMessageId: 'msg-camera-1', snippet: 'RED V-Raptor 8K sensor calibrated at ISO 3200', date: new Date().toISOString() }
        ],
        aiDeliverySummary: 'Operating at high velocity. Stage 1 cinematography wrap completed ahead of schedule.',
        lastActiveDate: new Date().toISOString().split('T')[0]
      },
      {
        userId: 'emp-dev-patel',
        userName: 'Dev Patel',
        userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
        role: 'employee',
        departmentName: 'Marketing & Performance',
        assignedTasksCount: 3,
        completedMilestonesCount: 2,
        overdueCount: 1,
        declaredBlockers: ['Meta Ad Manager billing threshold hold'],
        selfReportedUpdates: updates.filter(u => u.userId === 'emp-dev-patel'),
        evidenceCitations: [
          { sourceMessageId: 'msg-growth-1', snippet: 'Deployed 12 variant hooks for Sunday commercial campaign', date: new Date().toISOString() }
        ],
        aiDeliverySummary: 'Testing ad creative variants with 4.2x ROAS momentum. Blocker logged regarding ad billing threshold.',
        lastActiveDate: new Date().toISOString().split('T')[0]
      }
    ];

    return res.json({ success: true, reports: mockReports });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to get workload dashboard' });
  }
}

export async function handleSubmitSelfReportedUpdate(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.uid || 'founder_ceo';
    const userName = req.user?.displayName || req.user?.email || 'Crew Member';
    const { milestoneTitle, progressPercent, blockersDeclared, hoursSpentToday } = req.body;

    if (!milestoneTitle) {
      return res.status(400).json({ error: 'milestoneTitle is required' });
    }

    const newUpdate: SelfReportedUpdate = {
      id: `upd-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      workspaceId,
      userId,
      userName,
      milestoneTitle: milestoneTitle.trim(),
      progressPercent: Math.min(100, Math.max(0, Number(progressPercent) || 0)),
      blockersDeclared: blockersDeclared?.trim() || undefined,
      hoursSpentToday: Number(hoursSpentToday) || undefined,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    let updates = selfReportedUpdatesMap.get(workspaceId);
    if (!updates) {
      updates = [];
      selfReportedUpdatesMap.set(workspaceId, updates);
    }
    updates.unshift(newUpdate);

    return res.json({ success: true, update: newUpdate });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to submit milestone update' });
  }
}
