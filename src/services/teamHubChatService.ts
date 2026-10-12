import {
  Workspace,
  WorkspaceMember,
  Channel,
  WorkspaceMessage,
  MessageAttachment,
  MessageTaskCreation,
  RealtimeTeamHubEvent,
  WorkspaceRole,
  UserPreferenceProfile,
  AISummaryResult,
  AIDigestResult,
  WorkspaceAiControls,
  WorkspaceReminder,
  AISummaryClarifyingQuestion,
  DelegatedReplyRule,
  DelegatedActionAuditLog,
  AttendanceRecord,
  LeaveRequest,
  SelfReportedUpdate,
  WorkloadReport
} from '../types/teamHub';

type EventListener = (event: RealtimeTeamHubEvent) => void;

class TeamHubChatService {
  private ws: WebSocket | null = null;
  private listeners: Set<EventListener> = new Set();
  private reconnectTimeout: any = null;
  private currentWorkspaceId: string | null = null;
  private currentChannelId: string | null = null;
  private currentUserId: string | null = null;
  private currentUserName: string | null = null;
  private isConnecting = false;

  // -----------------------------------------------------------
  // WEBSOCKET REAL-TIME CONNECTION
  // -----------------------------------------------------------

  public connectWebSocket(userId: string, userName: string, workspaceId?: string, channelId?: string) {
    this.currentUserId = userId;
    this.currentUserName = userName;
    if (workspaceId) this.currentWorkspaceId = workspaceId;
    if (channelId) this.currentChannelId = channelId;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      // Re-authenticate / update active room
      this.sendWsPayload({
        type: 'auth',
        userId: this.currentUserId,
        userName: this.currentUserName,
        workspaceId: this.currentWorkspaceId,
        channelId: this.currentChannelId
      });
      return;
    }

    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/team-hub-ws`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.sendWsPayload({
          type: 'auth',
          userId: this.currentUserId,
          userName: this.currentUserName,
          workspaceId: this.currentWorkspaceId,
          channelId: this.currentChannelId
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed: RealtimeTeamHubEvent = JSON.parse(event.data);
          this.notifyListeners(parsed);
        } catch (e) {
          // ignore keepalive or non-json
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
      };
    } catch (err) {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  public subscribeChannel(channelId: string) {
    this.currentChannelId = channelId;
    this.sendWsPayload({
      type: 'subscribe_channel',
      channelId
    });
  }

  public sendTyping(isTyping: boolean) {
    if (this.currentChannelId) {
      this.sendWsPayload({
        type: 'typing',
        channelId: this.currentChannelId,
        isTyping
      });
    }
  }

  public subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(event: RealtimeTeamHubEvent) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[TeamHub WS] Listener callback error:', err);
      }
    }
  }

  private sendWsPayload(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      if (this.currentUserId && this.currentUserName) {
        this.connectWebSocket(
          this.currentUserId,
          this.currentUserName,
          this.currentWorkspaceId || undefined,
          this.currentChannelId || undefined
        );
      }
    }, 3000);
  }

  // -----------------------------------------------------------
  // REST API METHODS
  // -----------------------------------------------------------

  public async getWorkspaces(): Promise<Workspace[]> {
    const res = await fetch('/api/workspaces');
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch workspaces`);
    const data = await res.json();
    return data.workspaces || [];
  }

  public async createWorkspace(params: {
    name: string;
    description?: string;
    avatarUrl?: string;
    displayName?: string;
  }): Promise<Workspace> {
    const res = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create workspace');
    }
    const data = await res.json();
    return data.workspace;
  }

  public async joinWorkspace(inviteCode: string, displayName?: string): Promise<Workspace> {
    const res = await fetch('/api/workspaces/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode, displayName })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to join workspace');
    }
    const data = await res.json();
    return data.workspace;
  }

  public async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/members`);
    if (!res.ok) throw new Error('Failed to get workspace members');
    const data = await res.json();
    return data.members || [];
  }

  public async updateMemberRole(workspaceId: string, memberId: string, role: WorkspaceRole): Promise<WorkspaceMember> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(memberId)}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update member role');
    }
    const data = await res.json();
    return data.member;
  }

  public async getChannels(workspaceId: string): Promise<Channel[]> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/channels`);
    if (!res.ok) throw new Error('Failed to get channels');
    const data = await res.json();
    return data.channels || [];
  }

  public async createChannel(workspaceId: string, channelData: Partial<Channel>): Promise<Channel> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(channelData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create channel');
    }
    const data = await res.json();
    return data.channel;
  }

  public async getMessages(workspaceId: string, channelId: string, limit = 50, before?: string): Promise<WorkspaceMessage[]> {
    const query = new URLSearchParams({ limit: String(limit) });
    if (before) query.set('before', before);

    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/channels/${encodeURIComponent(channelId)}/messages?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to get messages');
    const data = await res.json();
    return data.messages || [];
  }

  public async sendMessage(workspaceId: string, channelId: string, payload: {
    content?: string;
    attachments?: MessageAttachment[];
    clientTempId?: string;
    senderName?: string;
    senderRole?: WorkspaceRole;
    senderAvatar?: string;
    senderTitle?: string;
    parentMessageId?: string;
  }): Promise<WorkspaceMessage> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/channels/${encodeURIComponent(channelId)}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to send message');
    }
    const data = await res.json();
    return data.message;
  }

  public async toggleReaction(workspaceId: string, channelId: string, messageId: string, emoji: string): Promise<Record<string, string[]>> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji })
    });
    if (!res.ok) throw new Error('Failed to toggle reaction');
    const data = await res.json();
    return data.reactions;
  }

  public async togglePin(workspaceId: string, channelId: string, messageId: string): Promise<boolean> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to toggle pin');
    const data = await res.json();
    return data.isPinned;
  }

  public async getThreadReplies(workspaceId: string, channelId: string, messageId: string): Promise<WorkspaceMessage[]> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}/thread`);
    if (!res.ok) throw new Error('Failed to get thread replies');
    const data = await res.json();
    return data.replies || [];
  }

  public async searchMessages(workspaceId: string, query: string): Promise<WorkspaceMessage[]> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to search messages');
    const data = await res.json();
    return data.results || [];
  }

  public async createTaskFromMessage(workspaceId: string, taskData: Partial<MessageTaskCreation>): Promise<MessageTaskCreation> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create task from message');
    }
    const data = await res.json();
    return data.task;
  }

  public async getTasks(workspaceId: string): Promise<MessageTaskCreation[]> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/tasks`);
    if (!res.ok) throw new Error('Failed to get tasks');
    const data = await res.json();
    return data.tasks || [];
  }

  public async uploadAttachment(file: File): Promise<MessageAttachment> {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/team-hub/attachments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        dataBase64: base64
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload attachment');
    }
    const data = await res.json();
    return data.attachment;
  }

  // -----------------------------------------------------------
  // PHASE 2: AI REASONING, SUMMARIES, & PREFERENCE PROFILES
  // -----------------------------------------------------------

  public async summarizeChannel(workspaceId: string, channelId: string): Promise<AISummaryResult> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/channels/${encodeURIComponent(channelId)}/ai/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to summarize channel');
    }
    const data = await res.json();
    return data.summary;
  }

  public async generateDigest(workspaceId: string, period: 'daily' | 'weekly' = 'daily'): Promise<AIDigestResult> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/ai/digest?period=${period}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate digest');
    }
    const data = await res.json();
    return data.digest;
  }

  public async draftReply(workspaceId: string, channelId: string, actionType: 'reply' | 'agenda' = 'reply', promptContext = ''): Promise<{ draft: string; disclosure: string }> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/channels/${encodeURIComponent(channelId)}/ai/draft-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType, promptContext })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to draft reply');
    }
    return await res.json();
  }

  public async toggleChannelAi(workspaceId: string, channelId: string, enabled: boolean): Promise<boolean> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/channels/${encodeURIComponent(channelId)}/ai/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to toggle AI for channel');
    }
    const data = await res.json();
    return data.isAiEnabled;
  }

  public async getPreferenceProfile(workspaceId: string): Promise<UserPreferenceProfile> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/preferences`);
    if (!res.ok) throw new Error('Failed to load preference profile');
    const data = await res.json();
    return data.profile;
  }

  public async updatePreferenceProfile(workspaceId: string, updates: Partial<UserPreferenceProfile>): Promise<UserPreferenceProfile> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update preference profile');
    }
    const data = await res.json();
    return data.profile;
  }

  public async optInHistoryLearning(workspaceId: string, optedIn: boolean): Promise<boolean> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/preferences/opt-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optedIn })
    });
    if (!res.ok) throw new Error('Failed to update opt-in preference');
    const data = await res.json();
    return data.optedIn;
  }

  public async deletePreferenceProfile(workspaceId: string): Promise<void> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/preferences`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete preference profile');
  }

  // -------------------------------------------------------------
  // GRANULAR AI CONTROLS (5 SEPARATE CONTROLS)
  // -------------------------------------------------------------
  public async getAiControls(workspaceId: string): Promise<WorkspaceAiControls> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/ai/controls`);
    if (!res.ok) throw new Error('Failed to load AI controls');
    const data = await res.json();
    return data.controls;
  }

  public async updateAiControls(workspaceId: string, updates: Partial<WorkspaceAiControls>): Promise<WorkspaceAiControls> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/ai/controls`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update AI controls');
    }
    const data = await res.json();
    return data.controls;
  }

  // -------------------------------------------------------------
  // CLARIFYING QUESTIONS FOR AMBIGUITIES
  // -------------------------------------------------------------
  public async getClarifyingQuestions(workspaceId: string, channelId: string): Promise<AISummaryClarifyingQuestion[]> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/channels/${encodeURIComponent(channelId)}/ai/clarify`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to get clarifying questions');
    }
    const data = await res.json();
    return data.clarifyingQuestions || [];
  }

  // -------------------------------------------------------------
  // CONFIGURED REMINDERS (WITH DUPLICATE PREVENTION)
  // -------------------------------------------------------------
  public async getReminders(workspaceId: string): Promise<WorkspaceReminder[]> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/reminders`);
    if (!res.ok) throw new Error('Failed to load reminders');
    const data = await res.json();
    return data.reminders || [];
  }

  public async createReminder(
    workspaceId: string, 
    params: {
      channelId: string;
      title: string;
      notes?: string;
      dueAt: string;
      targetUserId?: string;
      targetUserName?: string;
      idempotencyKey: string;
      sourceMessageId?: string;
    }
  ): Promise<{ reminder: WorkspaceReminder; deduplicated: boolean }> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create reminder');
    }
    return await res.json();
  }

  public async triggerReminder(workspaceId: string, reminderId: string): Promise<{ reminder: WorkspaceReminder; alreadyDispatched?: boolean }> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/reminders/${encodeURIComponent(reminderId)}/trigger`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to trigger reminder');
    }
    return await res.json();
  }

  public async cancelReminder(workspaceId: string, reminderId: string): Promise<WorkspaceReminder> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/reminders/${encodeURIComponent(reminderId)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to cancel reminder');
    const data = await res.json();
    return data.reminder;
  }

  // -------------------------------------------------------------
  // PHASE 3: DELEGATED REPLIES & AUDIT LOGS
  // -------------------------------------------------------------
  public async getDelegationRules(workspaceId: string): Promise<DelegatedReplyRule[]> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/delegations/rules`);
    if (!res.ok) throw new Error('Failed to load delegation rules');
    const data = await res.json();
    return data.rules || [];
  }

  public async createDelegationRule(workspaceId: string, params: Partial<DelegatedReplyRule>): Promise<DelegatedReplyRule> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/delegations/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create delegation rule');
    }
    const data = await res.json();
    return data.rule;
  }

  public async toggleDelegationRule(
    workspaceId: string, 
    ruleId: string, 
    status: 'active' | 'paused' | 'revoked'
  ): Promise<DelegatedReplyRule> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/delegations/rules/${encodeURIComponent(ruleId)}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update rule status');
    const data = await res.json();
    return data.rule;
  }

  public async getDelegationAuditLogs(workspaceId: string): Promise<DelegatedActionAuditLog[]> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/delegations/audit-logs`);
    if (!res.ok) throw new Error('Failed to load audit logs');
    const data = await res.json();
    return data.logs || [];
  }

  public async reviewDelegatedAction(
    workspaceId: string, 
    logId: string, 
    decision: 'approved' | 'rejected'
  ): Promise<DelegatedActionAuditLog> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/delegations/audit-logs/${encodeURIComponent(logId)}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision })
    });
    if (!res.ok) throw new Error('Failed to review delegated action');
    const data = await res.json();
    return data.log;
  }

  public async executeDelegatedReply(
    workspaceId: string, 
    channelId: string, 
    ruleId: string, 
    promptContext?: string
  ): Promise<any> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/channels/${encodeURIComponent(channelId)}/delegations/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ruleId, promptContext })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to execute delegated action');
    }
    return await res.json();
  }

  // -------------------------------------------------------------
  // PHASE 3: ATTENDANCE TRACKING & SHIFTS
  // -------------------------------------------------------------
  public async checkInAttendance(
    workspaceId: string, 
    location: string = 'studio_stage_1', 
    notes?: string
  ): Promise<AttendanceRecord> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/attendance/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location, notes })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Check-in failed');
    }
    const data = await res.json();
    return data.record;
  }

  public async checkOutAttendance(workspaceId: string): Promise<AttendanceRecord> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/attendance/check-out`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Check-out failed');
    }
    const data = await res.json();
    return data.record;
  }

  public async getAttendanceHistory(workspaceId: string): Promise<AttendanceRecord[]> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/attendance/history`);
    if (!res.ok) throw new Error('Failed to load attendance history');
    const data = await res.json();
    return data.records || [];
  }

  public async requestAttendanceCorrection(
    workspaceId: string, 
    recordId: string, 
    params: { requestedCheckIn?: string; requestedCheckOut?: string; reason: string }
  ): Promise<AttendanceRecord> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/attendance/${encodeURIComponent(recordId)}/correction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to request correction');
    }
    const data = await res.json();
    return data.record;
  }

  public async reviewAttendanceCorrection(
    workspaceId: string, 
    recordId: string, 
    decision: 'approved' | 'rejected'
  ): Promise<AttendanceRecord> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/attendance/${encodeURIComponent(recordId)}/review-correction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision })
    });
    if (!res.ok) throw new Error('Failed to review correction');
    const data = await res.json();
    return data.record;
  }

  public async getLeaveRequests(workspaceId: string): Promise<LeaveRequest[]> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/attendance/leaves`);
    if (!res.ok) throw new Error('Failed to load leave requests');
    const data = await res.json();
    return data.leaves || [];
  }

  public async createLeaveRequest(workspaceId: string, params: Partial<LeaveRequest>): Promise<LeaveRequest> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/attendance/leaves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create leave request');
    }
    const data = await res.json();
    return data.leave;
  }

  public async reviewLeaveRequest(workspaceId: string, leaveId: string, decision: 'approved' | 'rejected'): Promise<LeaveRequest> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/attendance/leaves/${encodeURIComponent(leaveId)}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision })
    });
    if (!res.ok) throw new Error('Failed to review leave request');
    const data = await res.json();
    return data.leave;
  }

  // -------------------------------------------------------------
  // PHASE 3: WORK PROGRESS & PRODUCTIVITY
  // -------------------------------------------------------------
  public async getWorkloadDashboard(workspaceId: string): Promise<WorkloadReport[]> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/workload/dashboard`);
    if (!res.ok) throw new Error('Failed to load workload dashboard');
    const data = await res.json();
    return data.reports || [];
  }

  public async submitSelfReportedUpdate(workspaceId: string, params: Partial<SelfReportedUpdate>): Promise<SelfReportedUpdate> {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/workload/self-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit milestone update');
    }
    const data = await res.json();
    return data.update;
  }
}

export const teamHubChatService = new TeamHubChatService();
