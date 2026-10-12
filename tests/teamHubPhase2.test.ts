import { describe, it, expect, beforeEach } from 'vitest';
import {
  handleCreateWorkspace,
  handleCreateChannel,
  handleSendMessage,
  getChannelMessages,
  getChannelById,
  getWorkspaceById,
  getWorkspaceChannels
} from '../server/controllers/teamHubController';
import {
  handleGetAiControls,
  handleUpdateAiControls,
  handleSummarizeChannel,
  handleGenerateDigest,
  handleDraftReply,
  handleToggleChannelAi,
  handleClarifyChannel,
  handleGetReminders,
  handleCreateReminder,
  handleTriggerReminder,
  handleCancelReminder,
  handleGetPreferenceProfile,
  handleUpdatePreferenceProfile,
  handleOptInHistoryLearning,
  handleDeletePreferenceProfile
} from '../server/controllers/teamHubAiController';
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

describe('Team Hub Phase 2: AI Governance, Reminders & Preference Profiles', () => {
  let wsId: string;
  let generalChanId: string;
  let confidentialChanId: string;

  beforeEach(async () => {
    // Setup a clean workspace
    const wsReq: Partial<AuthenticatedRequest> = {
      user: { uid: 'founder_ceo', email: 'founder@onlycreation.com' },
      body: { name: 'OnlyCreation Studios', displayName: 'CEO' }
    };
    const wsRes = createMockRes();
    await handleCreateWorkspace(wsReq as any, wsRes);
    wsId = wsRes.data.workspace.id;

    // Create public channel
    const chanReq: Partial<AuthenticatedRequest> = {
      user: { uid: 'founder_ceo', email: 'founder@onlycreation.com' },
      params: { workspaceId: wsId },
      body: { name: 'stage-operations', type: 'public', topic: 'Stage 1 & 2 shoot status' }
    };
    const chanRes = createMockRes();
    await handleCreateChannel(chanReq as any, chanRes);
    generalChanId = chanRes.data.channel.id;

    // Post sample messages into the channel
    const msgReq1: Partial<AuthenticatedRequest> = {
      user: { uid: 'emp_arjun', email: 'arjun@onlycreation.com' },
      params: { workspaceId: wsId, channelId: generalChanId },
      body: {
        content: 'Camera crew wrapped Stage 1 scene. Need lead editor to ingest anamorphic footage.',
        senderName: 'Arjun Das',
        senderRole: 'manager'
      }
    };
    await handleSendMessage(msgReq1 as any, createMockRes());

    const msgReq2: Partial<AuthenticatedRequest> = {
      user: { uid: 'founder_ceo', email: 'founder@onlycreation.com' },
      params: { workspaceId: wsId, channelId: generalChanId },
      body: {
        content: 'Approved. Deliver 4K color export by tomorrow 5 PM.',
        senderName: 'CEO',
        senderRole: 'owner'
      }
    };
    await handleSendMessage(msgReq2 as any, createMockRes());

    // Create private confidential channel
    const privChanReq: Partial<AuthenticatedRequest> = {
      user: { uid: 'founder_ceo', email: 'founder@onlycreation.com' },
      params: { workspaceId: wsId },
      body: { name: 'board-finance', type: 'private', memberIds: ['founder_ceo'] }
    };
    const privChanRes = createMockRes();
    await handleCreateChannel(privChanReq as any, privChanRes);
    confidentialChanId = privChanRes.data.channel.id;
  });

  // 1. AI-OFF BEHAVIOR TESTS
  it('AI-OFF BEHAVIOR: Rejects channel summarization with 403 when workspace AI is disabled', async () => {
    // Disable workspace AI
    const updateReq: Partial<AuthenticatedRequest> = {
      user: { uid: 'founder_ceo', email: 'founder@onlycreation.com' },
      params: { workspaceId: wsId },
      body: { workspaceAiEnabled: false }
    };
    const updateRes = createMockRes();
    await handleUpdateAiControls(updateReq as any, updateRes, getWorkspaceById);
    expect(updateRes.data.controls.workspaceAiEnabled).toBe(false);

    // Attempt to summarize channel
    const sumReq: Partial<AuthenticatedRequest> = {
      user: { uid: 'founder_ceo', email: 'founder@onlycreation.com' },
      params: { workspaceId: wsId, channelId: generalChanId }
    };
    const sumRes = createMockRes();
    await handleSummarizeChannel(sumReq as any, sumRes, getChannelMessages, getChannelById, getWorkspaceById);

    expect(sumRes.statusCode).toBe(403);
    expect(sumRes.data.code).toBe('WORKSPACE_AI_OFF');
    expect(sumRes.data.error).toBe('AI_DISABLED');
  });

  it('AI-OFF BEHAVIOR: Rejects summarization when channel AI is specifically toggled OFF', async () => {
    // Ensure workspace AI is ON
    await handleUpdateAiControls({
      user: { uid: 'founder_ceo', email: 'founder@onlycreation.com' },
      params: { workspaceId: wsId },
      body: { workspaceAiEnabled: true }
    } as any, createMockRes(), getWorkspaceById);

    // Toggle channel AI OFF
    const toggleReq: Partial<AuthenticatedRequest> = {
      user: { uid: 'founder_ceo', email: 'founder@onlycreation.com' },
      params: { workspaceId: wsId, channelId: generalChanId },
      body: { enabled: false }
    };
    const toggleRes = createMockRes();
    await handleToggleChannelAi(toggleReq as any, toggleRes, getChannelById);
    expect(toggleRes.data.isAiEnabled).toBe(false);

    // Attempt to summarize
    const sumReq: Partial<AuthenticatedRequest> = {
      user: { uid: 'founder_ceo', email: 'founder@onlycreation.com' },
      params: { workspaceId: wsId, channelId: generalChanId }
    };
    const sumRes = createMockRes();
    await handleSummarizeChannel(sumReq as any, sumRes, getChannelMessages, getChannelById, getWorkspaceById);

    expect(sumRes.statusCode).toBe(403);
    expect(sumRes.data.code).toBe('CHANNEL_AI_OFF');
  });

  it('GRANULAR CONTROLS: Blocks personal assistant draft when personalAssistantEnabled is false', async () => {
    // Disable personal assistant toggle
    await handleUpdateAiControls({
      user: { uid: 'founder_ceo', email: 'founder@onlycreation.com' },
      params: { workspaceId: wsId },
      body: { workspaceAiEnabled: true, personalAssistantEnabled: false }
    } as any, createMockRes(), getWorkspaceById);

    const draftReq: Partial<AuthenticatedRequest> = {
      user: { uid: 'founder_ceo', email: 'founder@onlycreation.com' },
      params: { workspaceId: wsId, channelId: generalChanId },
      body: { actionType: 'reply' }
    };
    const draftRes = createMockRes();
    await handleDraftReply(draftReq as any, draftRes, getChannelMessages);

    expect(draftRes.statusCode).toBe(403);
    expect(draftRes.data.code).toBe('PERSONAL_ASSISTANT_OFF');
  });

  // 2. DUPLICATE REMINDER PREVENTION TESTS
  it('DUPLICATE REMINDER PREVENTION: Creating reminder with same idempotencyKey returns existing reminder', async () => {
    const idempotencyKey = `rem-idempotency-key-${Date.now()}`;
    const createReq: Partial<AuthenticatedRequest> = {
      user: { uid: 'founder_ceo', email: 'founder@onlycreation.com' },
      params: { workspaceId: wsId },
      body: {
        channelId: generalChanId,
        title: 'Lock sound stage 2 at 18:00',
        notes: 'Inform audio engineer',
        dueAt: new Date(Date.now() + 3600000).toISOString(),
        idempotencyKey
      }
    };

    // First creation
    const res1 = createMockRes();
    await handleCreateReminder(createReq as any, res1);
    expect(res1.statusCode).toBe(200);
    expect(res1.data.deduplicated).toBe(false);
    const reminderId = res1.data.reminder.id;
    expect(reminderId).toBeDefined();

    // Second creation with exact same idempotencyKey
    const res2 = createMockRes();
    await handleCreateReminder(createReq as any, res2);
    expect(res2.statusCode).toBe(200);
    expect(res2.data.deduplicated).toBe(true);
    expect(res2.data.reminder.id).toBe(reminderId);

    // Verify reminder list has only 1 entry for this key
    const listRes = createMockRes();
    await handleGetReminders({ params: { workspaceId: wsId } } as any, listRes);
    const matches = listRes.data.reminders.filter((r: any) => r.idempotencyKey === idempotencyKey);
    expect(matches.length).toBe(1);
  });

  it('DUPLICATE REMINDER PREVENTION: Triggering a reminder twice suppresses duplicate delivery', async () => {
    const idempotencyKey = `rem-trigger-key-${Date.now()}`;
    const createReq: Partial<AuthenticatedRequest> = {
      user: { uid: 'founder_ceo', email: 'founder@onlycreation.com' },
      params: { workspaceId: wsId },
      body: {
        channelId: generalChanId,
        title: 'Finalize RED V-Raptor camera firmware check',
        dueAt: new Date().toISOString(),
        idempotencyKey
      }
    };
    const createRes = createMockRes();
    await handleCreateReminder(createReq as any, createRes);
    const remId = createRes.data.reminder.id;

    // Trigger reminder first time
    const trigRes1 = createMockRes();
    await handleTriggerReminder({
      user: { uid: 'founder_ceo', email: 'founder@onlycreation.com' },
      params: { workspaceId: wsId, reminderId: remId }
    } as any, trigRes1);

    expect(trigRes1.statusCode).toBe(200);
    expect(trigRes1.data.reminder.status).toBe('sent');
    expect(trigRes1.data.alreadyDispatched).toBeUndefined();

    // Trigger reminder second time
    const trigRes2 = createMockRes();
    await handleTriggerReminder({
      user: { uid: 'founder_ceo', email: 'founder@onlycreation.com' },
      params: { workspaceId: wsId, reminderId: remId }
    } as any, trigRes2);

    expect(trigRes2.statusCode).toBe(200);
    expect(trigRes2.data.alreadyDispatched).toBe(true);
  });

  // 3. PREFERENCE PROFILE MULTI-TENANT ISOLATION
  it('PREFERENCE PROFILES: Profiles are isolated by user and workspace with explicit opt-in flag', async () => {
    const userA = 'user_alpha_director';
    const userB = 'user_beta_director';

    // 1. Get default profile for user A
    const reqA = { user: { uid: userA }, params: { workspaceId: wsId } };
    const resA = createMockRes();
    await handleGetPreferenceProfile(reqA as any, resA);
    expect(resA.data.profile.optedInForHistoryLearning).toBe(false);

    // 2. Update user A's writing tone
    const updateReqA = {
      user: { uid: userA },
      params: { workspaceId: wsId },
      body: { writingTone: 'Decisive, cinematic, fast-paced' }
    };
    const updateResA = createMockRes();
    await handleUpdatePreferenceProfile(updateReqA as any, updateResA);
    expect(updateResA.data.profile.writingTone).toBe('Decisive, cinematic, fast-paced');

    // 3. Get profile for user B - must NOT have user A's custom tone
    const reqB = { user: { uid: userB }, params: { workspaceId: wsId } };
    const resB = createMockRes();
    await handleGetPreferenceProfile(reqB as any, resB);
    expect(resB.data.profile.writingTone).not.toBe('Decisive, cinematic, fast-paced');
    expect(resB.data.profile.writingTone).toBe('Direct, confident, metric-driven, and creative');

    // 4. Opt-in for history learning requires explicit consent
    const optInReq = { user: { uid: userA }, params: { workspaceId: wsId }, body: { optedIn: true } };
    const optInRes = createMockRes();
    await handleOptInHistoryLearning(optInReq as any, optInRes);
    expect(optInRes.data.optedIn).toBe(true);

    // 5. Delete profile resets cleanly
    const deleteReq = { user: { uid: userA }, params: { workspaceId: wsId } };
    const deleteRes = createMockRes();
    await handleDeletePreferenceProfile(deleteReq as any, deleteRes);
    expect(deleteRes.data.success).toBe(true);
  });
});
