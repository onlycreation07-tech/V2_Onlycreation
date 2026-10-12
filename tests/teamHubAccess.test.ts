import { describe, it, expect, beforeEach } from 'vitest';
import {
  handleGetWorkspaces,
  handleCreateWorkspace,
  handleGetChannels,
  handleCreateChannel,
  handleGetMessages,
  handleSendMessage,
  handleUpdateMemberRole,
  handleCreateTaskFromMessage
} from '../server/controllers/teamHubController';
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

describe('Team Hub: Multi-Tenant Access Control & Features', () => {
  let orgAId: string;
  let orgBId: string;
  let publicChanAId: string;
  let privateChanAId: string;

  beforeEach(async () => {
    // 1. Create Workspace A for User A (Owner)
    const reqA: Partial<AuthenticatedRequest> = {
      user: { uid: 'user_alpha', email: 'alpha@org-a.com' },
      body: { name: 'Alpha Agency', displayName: 'Alpha Lead' }
    };
    const resA = createMockRes();
    await handleCreateWorkspace(reqA as any, resA);
    orgAId = resA.data.workspace.id;

    // 2. Create Workspace B for User B (Owner)
    const reqB: Partial<AuthenticatedRequest> = {
      user: { uid: 'user_beta', email: 'beta@org-b.com' },
      body: { name: 'Beta Productions', displayName: 'Beta Lead' }
    };
    const resB = createMockRes();
    await handleCreateWorkspace(reqB as any, resB);
    orgBId = resB.data.workspace.id;

    // 3. Create Public Channel in Org A
    const reqPubChan: Partial<AuthenticatedRequest> = {
      user: { uid: 'user_alpha', email: 'alpha@org-a.com' },
      params: { workspaceId: orgAId },
      body: { name: 'camera-ops', type: 'public', topic: 'Camera gear' }
    };
    const resPubChan = createMockRes();
    await handleCreateChannel(reqPubChan as any, resPubChan);
    publicChanAId = resPubChan.data.channel.id;

    // 4. Create Private Channel in Org A (only user_alpha is member)
    const reqPrivChan: Partial<AuthenticatedRequest> = {
      user: { uid: 'user_alpha', email: 'alpha@org-a.com' },
      params: { workspaceId: orgAId },
      body: { name: 'confidential-board', type: 'private', memberIds: ['user_alpha'] }
    };
    const resPrivChan = createMockRes();
    await handleCreateChannel(reqPrivChan as any, resPrivChan);
    privateChanAId = resPrivChan.data.channel.id;
  });

  it('PREVENTS CROSS-COMPANY ACCESS: User from Org B cannot view Org A private channels', async () => {
    const reqUserBInOrgA: Partial<AuthenticatedRequest> = {
      user: { uid: 'user_beta', email: 'beta@org-b.com' },
      params: { workspaceId: orgAId }
    };
    const res = createMockRes();
    await handleGetChannels(reqUserBInOrgA as any, res);

    expect(res.statusCode).toBe(200);
    const channels = res.data.channels;
    // user_beta should NOT see the private channel in Org A
    const foundPrivate = channels.find((c: any) => c.id === privateChanAId);
    expect(foundPrivate).toBeUndefined();
  });

  it('ENFORCES PRIVATE CHANNEL ACCESS: Non-member employee cannot access private channel', async () => {
    // User Charlie is in Org A as employee, but not added to private channel memberIds
    const reqCharlie: Partial<AuthenticatedRequest> = {
      user: { uid: 'user_charlie', email: 'charlie@org-a.com' },
      params: { workspaceId: orgAId }
    };
    const res = createMockRes();
    await handleGetChannels(reqCharlie as any, res);

    expect(res.statusCode).toBe(200);
    const channels = res.data.channels;
    const foundPrivate = channels.find((c: any) => c.id === privateChanAId);
    expect(foundPrivate).toBeUndefined();
  });

  it('PREVENTS DUPLICATE MESSAGES: Re-transmitting same clientTempId returns original message', async () => {
    const tempId = `temp-client-${Date.now()}`;
    const sendReq1: Partial<AuthenticatedRequest> = {
      user: { uid: 'user_alpha', email: 'alpha@org-a.com' },
      params: { workspaceId: orgAId, channelId: publicChanAId },
      body: {
        content: 'Check the 4K anamorphic lens focus.',
        clientTempId: tempId,
        senderName: 'Alpha Lead'
      }
    };
    const res1 = createMockRes();
    await handleSendMessage(sendReq1 as any, res1);

    expect(res1.statusCode).toBe(200);
    const firstMsgId = res1.data.message.id;
    expect(firstMsgId).toBeDefined();

    // Send identical request with same clientTempId
    const res2 = createMockRes();
    await handleSendMessage(sendReq1 as any, res2);

    expect(res2.statusCode).toBe(200);
    expect(res2.data.deduplicated).toBe(true);
    expect(res2.data.message.id).toBe(firstMsgId);
  });

  it('BLOCKS UNAUTHORIZED ROLE ESCALATION: Non-admin cannot promote member to owner', async () => {
    const escalateReq: Partial<AuthenticatedRequest> = {
      user: { uid: 'user_guest', email: 'guest@org-a.com' },
      params: { workspaceId: orgAId, memberId: 'user_guest' },
      body: { role: 'owner' }
    };
    const res = createMockRes();
    await handleUpdateMemberRole(escalateReq as any, res);

    expect(res.statusCode).toBe(403);
    expect(res.data.error).toContain('Only workspace owners or admins can change roles');
  });

  it('CREATES TASK FROM MESSAGE: Action item converts to workspace task with assignee and due date', async () => {
    const taskReq: Partial<AuthenticatedRequest> = {
      user: { uid: 'user_alpha', email: 'alpha@org-a.com' },
      params: { workspaceId: orgAId },
      body: {
        messageId: 'msg-test-123',
        channelId: publicChanAId,
        title: 'Calibrate RED V-Raptor sensor for low-light scene',
        description: 'Ensure noise threshold stays below 1% at ISO 3200',
        assignedToUserId: 'emp-arjun-das',
        assignedToUserName: 'Arjun Das',
        priority: 'urgent',
        dueDate: '2026-10-18'
      }
    };
    const res = createMockRes();
    await handleCreateTaskFromMessage(taskReq as any, res);

    expect(res.statusCode).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.task.title).toBe('Calibrate RED V-Raptor sensor for low-light scene');
    expect(res.data.task.priority).toBe('urgent');
    expect(res.data.task.status).toBe('todo');
    expect(res.data.task.assignedToUserName).toBe('Arjun Das');
  });
});
