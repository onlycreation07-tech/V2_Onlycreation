export type WorkspaceRole = 'owner' | 'admin' | 'manager' | 'employee' | 'guest';

export type ChannelType = 'public' | 'private' | 'department' | 'project' | 'direct';

export type UserPresenceStatus = 'online' | 'away' | 'busy' | 'offline';

export interface WorkspaceMember {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  displayName: string;
  email: string;
  avatarUrl?: string;
  title?: string;
  departmentId?: string;
  departmentName?: string;
  presence: UserPresenceStatus;
  lastSeenAt: string;
  joinedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  avatarUrl?: string;
  description?: string;
  inviteCode?: string;
  settings: {
    allowGuestInvites: boolean;
    defaultChannelId: string;
    aiAssistantEnabled: boolean;
  };
  memberCount?: number;
  channelCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  type: ChannelType;
  topic?: string;
  description?: string;
  createdById: string;
  memberIds?: string[]; // Mandatory for private channels & DMs
  departmentCode?: string;
  projectId?: string;
  isArchived: boolean;
  isAiEnabled?: boolean;
  lastMessageSnippet?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  createdAt: string;
}

export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

export interface WorkspaceMessage {
  id: string;
  workspaceId: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: WorkspaceRole;
  senderTitle?: string;
  content: string;
  attachments?: MessageAttachment[];
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  mentions?: string[]; // userIds mentioned
  replyCount: number;
  lastReplyAt?: string;
  parentMessageId?: string; // If this is a thread reply
  isPinned: boolean;
  pinnedBy?: string;
  status: 'sent' | 'delivered' | 'read';
  isAiGenerated?: boolean;
  aiPersonaBadge?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MessageTaskCreation {
  id: string;
  workspaceId: string;
  channelId: string;
  messageId: string;
  title: string;
  description: string;
  assignedToUserId: string;
  assignedToUserName: string;
  createdByUserId: string;
  createdByUserName: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  dueDate: string;
  createdAt: string;
}

export interface TeamHubTypingIndicator {
  channelId: string;
  userId: string;
  userName: string;
  timestamp: number;
}

export interface RealtimeTeamHubEvent {
  type: 'message:new' | 'message:reaction' | 'message:pin' | 'typing:update' | 'presence:update' | 'task:created' | 'ai:summary_ready';
  workspaceId: string;
  channelId?: string;
  payload: any;
}

// ================= PHASE 2: AI REASONING & PREFERENCE PROFILES =================

export interface DecisionRule {
  id: string;
  condition: string;
  approvedAction: string;
  maxAmountBudget?: number;
}

export interface UserPreferenceProfile {
  userId: string;
  workspaceId: string;
  writingTone: string; // e.g. "Direct, metric-driven, confident, concise"
  communicationStyle: string; // e.g. "Asynchronous, bullet-pointed, no fluff"
  workingHours: {
    start: string; // e.g. "09:00"
    end: string;   // e.g. "18:00"
    timezone: string; // e.g. "Asia/Kolkata" or "UTC"
  };
  reminderPreferences: {
    frequency: 'immediate' | 'daily_digest' | 'quiet_mode';
    preferredHour: number; // 0-23
  };
  escalationThresholdAmount: number; // e.g. 500
  approvedDecisionRules: DecisionRule[];
  projectPriorities: string[];
  approvedReplyExamples: string[];
  optedInForHistoryLearning: boolean;
  confirmedFields: Record<string, boolean>; // Maps field key -> boolean (distinguishes confirmed from AI guess)
  createdAt: string;
  updatedAt: string;
}

export interface AISummaryActionItem {
  id: string;
  title: string;
  owner?: string;
  deadline?: string;
  sourceMessageId?: string;
}

export interface AISummaryBlocker {
  description: string;
  flaggedMessageId?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AISummaryClarifyingQuestion {
  id: string;
  question: string;
  context: string;
  targetRoleOrMember?: string;
  ambiguityType: 'unclear_owner' | 'missing_deadline' | 'unconfirmed_budget' | 'creative_scope';
}

export interface AISummaryResult {
  summary: string;
  decisions: string[];
  actionItems: AISummaryActionItem[];
  unresolvedQuestions: string[];
  clarifyingQuestions?: AISummaryClarifyingQuestion[];
  blockers: AISummaryBlocker[];
  nextSteps: string[];
  citations: string[]; // Message snippets or IDs
  generatedAt: string;
}

export interface AIDigestResult {
  period: 'daily' | 'weekly';
  title: string;
  executiveOverview: string;
  completedHighlights: string[];
  ongoingInitiatives: string[];
  urgentDecisionsRequired: string[];
  attendanceSnippet?: string;
  generatedAt: string;
}

// 5 Separate AI Participation Controls
export interface WorkspaceAiControls {
  workspaceAiEnabled: boolean;       // 1. Workspace AI enabled/disabled
  channelAiEnabled: boolean;         // 2. Channel AI enabled/disabled
  personalAssistantEnabled: boolean; // 3. Personal assistant enabled/disabled
  proactiveSuggestionsEnabled: boolean; // 4. Proactive suggestions enabled/disabled
  delegatedRepliesEnabled: boolean;  // 5. Delegated replies enabled/disabled
  accessScopeDescription: string;
  updatedAt: string;
}

// Configured Reminders with Idempotency Protection
export interface WorkspaceReminder {
  id: string;
  workspaceId: string;
  channelId: string;
  creatorId: string;
  creatorName: string;
  targetUserId?: string;
  targetUserName?: string;
  title: string;
  notes?: string;
  dueAt: string; // ISO 8601 string
  status: 'pending' | 'sent' | 'cancelled';
  idempotencyKey: string; // Duplicate reminder prevention
  sourceMessageId?: string;
  createdAt: string;
  sentAt?: string;
}

// ================= PHASE 3: DELEGATED REPLIES, ATTENDANCE & PRODUCTIVITY =================

export type DelegatedActionType = 
  | 'ack_receipt' 
  | 'status_update' 
  | 'deadline_reminder' 
  | 'approved_faq' 
  | 'scheduling' 
  | 'low_risk_decision';

export interface DelegatedReplyRule {
  id: string;
  workspaceId: string;
  authorizingUserId: string;
  authorizingUserName: string;
  authorizingUserRole: WorkspaceRole;
  actionType: DelegatedActionType;
  title: string;
  description: string;
  scopeChannelIds?: string[]; // If empty, applies to all authorized public channels
  autoMode: boolean; // default false (requires human approval queue)
  maxDailyExecutions: number;
  todayExecutionCount: number;
  expiresAt: string; // ISO timestamp
  status: 'active' | 'paused' | 'revoked';
  templateReply?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DelegatedActionAuditLog {
  id: string;
  workspaceId: string;
  channelId: string;
  channelName?: string;
  authorizingUserId: string;
  authorizingUserName: string;
  ruleId: string;
  ruleTitle: string;
  actionTaken: string;
  messageId?: string;
  content: string;
  requiresHumanApproval: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'auto_dispatched';
  approvedByUserId?: string;
  approvedByUserName?: string;
  supportingContext: string;
  timestamp: string;
}

export type AttendanceStatus = 'checked_in' | 'checked_out' | 'on_leave';

export interface AttendanceRecord {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // ISO
  checkOutTime?: string; // ISO
  totalWorkingMinutes?: number;
  scheduleStart: string; // e.g. "09:00"
  scheduleEnd: string;   // e.g. "18:00"
  timezone: string;      // e.g. "Asia/Kolkata"
  status: AttendanceStatus;
  location: 'studio_stage_1' | 'stage_2_lab' | 'remote' | 'on_location';
  notes?: string;
  correctionRequest?: {
    requestedCheckIn?: string;
    requestedCheckOut?: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewedBy?: string;
    reviewedAt?: string;
  };
  auditTrail: Array<{ action: string; timestamp: string; actor: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  type: 'paid_time_off' | 'sick_leave' | 'production_wrap_comp' | 'unpaid';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedByName?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface SelfReportedUpdate {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  milestoneTitle: string;
  progressPercent: number; // 0 - 100
  blockersDeclared?: string;
  hoursSpentToday?: number;
  date: string;
  createdAt: string;
}

export interface WorkloadReport {
  userId: string;
  userName: string;
  userAvatar?: string;
  role: WorkspaceRole;
  departmentName: string;
  assignedTasksCount: number;
  completedMilestonesCount: number;
  overdueCount: number;
  declaredBlockers: string[];
  selfReportedUpdates: SelfReportedUpdate[];
  evidenceCitations: Array<{
    sourceMessageId: string;
    snippet: string;
    date: string;
  }>;
  aiDeliverySummary: string;
  lastActiveDate: string;
}
