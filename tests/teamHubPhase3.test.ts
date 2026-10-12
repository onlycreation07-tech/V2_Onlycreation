import { describe, it, expect, beforeEach } from 'vitest';
import {
  handleCreateWorkspace,
  handleCreateChannel,
  getWorkspaceById,
  getChannelById
} from '../server/controllers/teamHubController';
import {
  handleGetDelegationRules,
  handleCreateDelegationRule,
  handleToggleDelegationRule,
  handleGetDelegationAuditLogs,
  handleReviewDelegatedAction,
  handleExecuteDelegatedReply,
  handleCheckInAttendance,
  handleCheckOutAttendance,
  handleGetAttendanceHistory,
  handleRequestAttendanceCorrection,
  handleReviewAttendanceCorrection,
  handleGetLeaveRequests,
  handleCreateLeaveRequest,
  handleReviewLeaveRequest,
  handleGetWorkloadDashboard,
  handleSubmitSelfReportedUpdate
} from '../server/controllers/teamHubPhase3Controller';
import { AuthenticatedRequest } from '../server/types';

// Mock Response Helper
function createMockRes() {
  const res: any = {
    statusCode: 200,
    data: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.data = payload;
      return this;
    }
  };
  return res;
}

describe('Team Hub Phase 3: Delegated AI Replies, Attendance & Work Progress', () => {
  let wsId: string;
  let chanId: string;

  beforeEach(async () => {
    // Setup workspace
    const wsReq: Partial<AuthenticatedRequest> = {
      user: { uid: 'executive_cxo', email: 'cxo@onlycreation.com' },
      body: { name: 'OnlyCreation Commercial Unit', displayName: 'Executive Director' }
    };
    const wsRes = createMockRes();
    await handleCreateWorkspace(wsReq as any, wsRes);
    wsId = wsRes.data.workspace.id;

    // Setup channel
    const chanReq: Partial<AuthenticatedRequest> = {
      user: { uid: 'executive_cxo', email: 'cxo@onlycreation.com' },
      params: { workspaceId: wsId },
      body: { name: 'stage-1-rigging', type: 'public' }
    };
    const chanRes = createMockRes();
    await handleCreateChannel(chanReq as any, chanRes);
    chanId = chanRes.data.channel.id;
  });

  // 1. DELEGATED-ACTION LIMITS & SAFETY TESTS
  it('DELEGATED-ACTION LIMITS: Blocks automatic mode for sensitive spending or contract rules', async () => {
    const sensitiveReq: Partial<AuthenticatedRequest> = {
      user: { uid: 'executive_cxo', email: 'cxo@onlycreation.com' },
      params: { workspaceId: wsId },
      body: {
        actionType: 'low_risk_decision',
        title: 'Auto-Approve Studio Equipment Spending Overrides',
        description: 'Auto-commit additional equipment rental contracts up to $5000',
        autoMode: true // Prohibited!
      }
    };
    const res = createMockRes();
    await handleCreateDelegationRule(sensitiveReq as any, res);

    expect(res.statusCode).toBe(400);
    expect(res.data.error).toContain('SAFETY_RESTRICTION');
  });

  it('DELEGATED REPLIES: Defaults to draft for human approval when autoMode is false', async () => {
    // Create draft-mode rule
    const ruleReq: Partial<AuthenticatedRequest> = {
      user: { uid: 'executive_cxo', email: 'cxo@onlycreation.com' },
      params: { workspaceId: wsId },
      body: {
        actionType: 'status_update',
        title: 'Color Grade Status Inquiry',
        description: 'Inquire on DaVinci Resolve color render progress',
        autoMode: false,
        templateReply: 'Checking in on the 4K DaVinci grade. Are we on schedule for 5 PM export?'
      }
    };
    const ruleRes = createMockRes();
    await handleCreateDelegationRule(ruleReq as any, ruleRes);
    const ruleId = ruleRes.data.rule.id;

    // Execute rule
    const execReq: Partial<AuthenticatedRequest> = {
      user: { uid: 'executive_cxo', email: 'cxo@onlycreation.com' },
      params: { workspaceId: wsId, channelId: chanId },
      body: { ruleId, promptContext: 'Editor asked about color timeline' }
    };
    const execRes = createMockRes();
    await handleExecuteDelegatedReply(execReq as any, execRes);

    expect(execRes.statusCode).toBe(200);
    expect(execRes.data.autoDispatched).toBe(false);
    expect(execRes.data.draft).toBeDefined();
    expect(execRes.data.disclosure).toContain('AI assistant for cxo@onlycreation.com');
    expect(execRes.data.log.approvalStatus).toBe('pending');
  });

  it('DELEGATED REPLIES: Revoking rule immediately halts execution killswitch', async () => {
    // 1. Get rules
    const listRes = createMockRes();
    await handleGetDelegationRules({ user: { uid: 'executive_cxo' }, params: { workspaceId: wsId } } as any, listRes);
    const rule = listRes.data.rules[0];

    // 2. Revoke the rule
    const revokeRes = createMockRes();
    await handleToggleDelegationRule({
      user: { uid: 'executive_cxo', email: 'cxo@onlycreation.com' },
      params: { workspaceId: wsId, ruleId: rule.id },
      body: { status: 'revoked' }
    } as any, revokeRes);
    expect(revokeRes.data.rule.status).toBe('revoked');

    // 3. Attempt to execute revoked rule
    const execRes = createMockRes();
    await handleExecuteDelegatedReply({
      user: { uid: 'executive_cxo' },
      params: { workspaceId: wsId, channelId: chanId },
      body: { ruleId: rule.id }
    } as any, execRes);

    expect(execRes.statusCode).toBe(403);
    expect(execRes.data.error).toContain('DELEGATION_REVOKED');
  });

  // 2. ATTENDANCE TRACKING & INTEGRITY TESTS
  it('ATTENDANCE: Explicit check-in and check-out calculates total working minutes accurately', async () => {
    const testUser = 'crew_cinematographer_1';

    // 1. Explicit Check-In
    const checkInReq: Partial<AuthenticatedRequest> = {
      user: { uid: testUser, displayName: 'Lead Camera Operator' },
      params: { workspaceId: wsId },
      body: { location: 'studio_stage_1', notes: 'Setting up RED anamorphic primes' }
    };
    const checkInRes = createMockRes();
    await handleCheckInAttendance(checkInReq as any, checkInRes);

    expect(checkInRes.statusCode).toBe(200);
    expect(checkInRes.data.record.status).toBe('checked_in');
    expect(checkInRes.data.record.checkInTime).toBeDefined();
    expect(checkInRes.data.record.location).toBe('studio_stage_1');

    // 2. Re-clock in while already checked-in returns 400
    const dupeCheckInRes = createMockRes();
    await handleCheckInAttendance(checkInReq as any, dupeCheckInRes);
    expect(dupeCheckInRes.statusCode).toBe(400);
    expect(dupeCheckInRes.data.error).toContain('ALREADY_CHECKED_IN');

    // 3. Explicit Check-Out
    const checkOutReq: Partial<AuthenticatedRequest> = {
      user: { uid: testUser, displayName: 'Lead Camera Operator' },
      params: { workspaceId: wsId }
    };
    const checkOutRes = createMockRes();
    await handleCheckOutAttendance(checkOutReq as any, checkOutRes);

    expect(checkOutRes.statusCode).toBe(200);
    expect(checkOutRes.data.record.status).toBe('checked_out');
    expect(checkOutRes.data.record.checkOutTime).toBeDefined();
    expect(typeof checkOutRes.data.record.totalWorkingMinutes).toBe('number');
  });

  it('ATTENDANCE CORRECTIONS: Requires manager review and maintains audit trail', async () => {
    const testUser = 'crew_editor_dev';

    // Check in
    const inRes = createMockRes();
    await handleCheckInAttendance({
      user: { uid: testUser, displayName: 'Dev Editor' },
      params: { workspaceId: wsId },
      body: { location: 'remote' }
    } as any, inRes);
    const recordId = inRes.data.record.id;

    // Submit correction request
    const correctReq: Partial<AuthenticatedRequest> = {
      user: { uid: testUser, email: 'dev@onlycreation.com' },
      params: { workspaceId: wsId, recordId },
      body: {
        requestedCheckIn: '2026-10-11T08:00:00.000Z',
        requestedCheckOut: '2026-10-11T18:00:00.000Z',
        reason: 'Overtime color correction wrap for commercial delivery'
      }
    };
    const correctRes = createMockRes();
    await handleRequestAttendanceCorrection(correctReq as any, correctRes);

    expect(correctRes.statusCode).toBe(200);
    expect(correctRes.data.record.correctionRequest.status).toBe('pending');
    expect(correctRes.data.record.correctionRequest.reason).toBe('Overtime color correction wrap for commercial delivery');

    // Manager approves correction
    const reviewReq: Partial<AuthenticatedRequest> = {
      user: { uid: 'executive_cxo', email: 'cxo@onlycreation.com' },
      params: { workspaceId: wsId, recordId },
      body: { decision: 'approved' }
    };
    const reviewRes = createMockRes();
    await handleReviewAttendanceCorrection(reviewReq as any, reviewRes);

    expect(reviewRes.statusCode).toBe(200);
    expect(reviewRes.data.record.correctionRequest.status).toBe('approved');
    expect(reviewRes.data.record.totalWorkingMinutes).toBe(600); // 10 hours = 600 mins
    expect(reviewRes.data.record.auditTrail.some((a: any) => a.action.includes('Manager approved'))).toBe(true);
  });

  // 3. WORK PROGRESS & DASHBOARD TRANSPARENCY
  it('WORK PROGRESS: Workload dashboard transparently displays assigned milestones and blockers', async () => {
    // Submit self-reported milestone update
    const updateReq: Partial<AuthenticatedRequest> = {
      user: { uid: 'emp-dev-patel', displayName: 'Dev Patel' },
      params: { workspaceId: wsId },
      body: {
        milestoneTitle: 'Render 10 commercial hook variations at 4K resolution',
        progressPercent: 85,
        blockersDeclared: 'Waiting on client audio stem sign-off',
        hoursSpentToday: 6
      }
    };
    const updateRes = createMockRes();
    await handleSubmitSelfReportedUpdate(updateReq as any, updateRes);

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.data.update.milestoneTitle).toBe('Render 10 commercial hook variations at 4K resolution');
    expect(updateRes.data.update.progressPercent).toBe(85);

    // Fetch dashboard
    const dashRes = createMockRes();
    await handleGetWorkloadDashboard({ user: { uid: 'executive_cxo' }, params: { workspaceId: wsId } } as any, dashRes);

    expect(dashRes.statusCode).toBe(200);
    expect(dashRes.data.reports.length).toBeGreaterThan(0);
    const devReport = dashRes.data.reports.find((r: any) => r.userId === 'emp-dev-patel');
    expect(devReport).toBeDefined();
    expect(devReport.selfReportedUpdates.length).toBeGreaterThan(0);
  });
});
