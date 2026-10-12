# Team Hub: Unified Company Communication Workspace

A company communication workspace combining Slack channels and threads, WhatsApp-grade direct messaging, and Microsoft Teams organizational structure, with strict multi-tenant role-based permissions and optional AI coordination.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed based on your requirements and will govern implementation:

- **Navigation Integration**: A dedicated "Company Chat" tab is added to primary navigation (`team-hub`), keeping the existing Autonomous AI Team Hub (`agents`), Creation AI Director Chat (`chat`), and AI Studio Suite (`studio`) completely preserved and operational.
- **Real-Time Transport**: Hybrid WebSocket on Express backed by Firestore persistence. Sub-second messaging, typing indicators, and delivery status run through the Express WebSocket server, with automatic persistence to Firestore for durable message history, pagination, and multi-device catch-up.
- **Tenancy & Membership**: Multi-workspace switcher with role-based access control (`owner`, `admin`, `manager`, `employee`, `guest`). Users only access workspaces and channels where they hold active membership, enforced both on the server and in Firestore security rules.
- **Phase 1 Immediate Delivery Focus**: Core workspace infrastructure, role memberships, public and private channels, direct and group messaging, threaded replies, mentions, emoji reactions, file/media attachments, unread counters, message search, pinned messages, and message-to-task conversion.

---

## 1. Overview & Core Concept

Team Hub solves fragmented team operations by bringing company messaging, project discussions, and operational coordination into a unified, high-performance workspace:
- **Slack-Grade Organization**: Workspace switcher, public channels (`#general`, `#announcements`), private channels (`🔒-executive-sync`), department channels (`#growth-marketing`, `#cinema-lab`), and project channels (`#spring-commercial-drop`), with threaded discussions.
- **WhatsApp-Grade Fluidity**: Fast 1-on-1 direct messages, group chats, typing indicators, instant delivery status (`sent`, `delivered`, `read`), voice/media sharing, and keyboard shortcuts (`Enter` to send, `Shift+Enter` for multiline).
- **Microsoft Teams-Grade Enterprise Clarity**: Organization hierarchy, member roles with fine-grained permissions, user presence (`online`, `away`, `in_meeting`, `checked_in`), and integrated action items / task assignment directly from messages.
- **Zero-Disruption Architecture**: Seamlessly coexists with existing Creation AI tools, leaving Director Chat and AI Studio creative workflows intact.

---

## 2. User Experience & Visual Design

Following the **Universal Frontend Design Constitution** and **SaaS Dashboard Guidelines**:
- **Palette**: Deep slate foundation (`#090D16`, `#0F172A`) with high-contrast text (`#F8FAFC`, `#94A3B8`), subtle 1px dividers (`border-white/10`), and crisp brand accents (`#7C3AED` Sleek Violet, `#10B981` Emerald for online presence, `#F59E0B` Amber for priorities).
- **Zero-Pill Discipline**: Metadata (timestamps, message status, participant counts) rendered as unboxed inline text with typographic separators (`·`), avoiding generic AI pill clusters.
- **Tabular Figures**: Message counters, unread badges, and timestamps strictly utilize tabular figures (`font-mono` / `tabular-nums`) to prevent layout shifting.
- **Three-Column Adaptive Layout**:
  - **Left Rail (64px)**: Workspace selector with org icons, active workspace indicator, new workspace button, and global presence status.
  - **Channel & DM Sidebar (240px–280px)**: Collapsible sections for Channels (public/private/departments/projects), Direct Messages, Unread indicator badges, and Search / Filter input.
  - **Central Conversation Canvas**: Header with channel metadata, pinned items, search, and member list; virtualized/paginated message stream; message composer with rich formatting, attachments, mentions, and emoji picker.
  - **Collapsible Right Rail (320px–360px)**: Thread detail panel (when inspecting a message thread), channel members roster, pinned messages list, or channel files browser.
  - **Mobile Responsive Drawer**: Compact bottom navigation drawer and full-screen view transitions with touch-friendly targets ($\ge 44\text{px}$) and smooth back navigation.

```
┌──────────┬─────────────────────────┬───────────────────────────────────────┬───────────────────────────┐
│ Org Rail │ Channels & DMs Sidebar  │ Central Conversation Canvas           │ Thread & Details Rail     │
├──────────┼─────────────────────────┼───────────────────────────────────────┼───────────────────────────┤
│ [Org A]  │ 🔍 Quick Search         │ # growth-marketing                    │ 🧵 Thread: Spring Drop    │
│ [Org B]* │                         │ 32 members · Dept: Marketing          │ ───────────────────────── │
│          │ ▾ CHANNELS              │                                       │ [Ketan] Let's finalize    │
│ [+] Add  │   # general             │ [Arjun Das] 10:42 AM                  │ the 3-sec hook variant.   │
│          │   # announcements       │ The 4K anamorphic frames are ready    │                           │
│          │   🔒 leadership         │ for review in Stage 2!                │ [Sarah] Variant A tested  │
│          │   # growth-marketing*   │ 📎 raw_cut_01.mp4 (42 MB)             │ best: 71.4% hold rate!    │
│          │                         │ 👍 4  ❤️ 2  ·  3 replies              │                           │
│          │ ▾ DIRECT MESSAGES       │ ───────────────────────────────────── │ ───────────────────────── │
│          │   🟢 Priya Sharma (3)   │ [Sarah Lin] 10:44 AM                  │ 💬 Reply in thread...     │
│          │   ⚪ Rohan Kapoor       │ Verified the color grade. Looks fire! │                           │
│          │                         │                                       │                           │
│          │                         │ ───────────────────────────────────── │                           │
│          │                         │ [Type message...        📎 😃 📌 🚀] │                           │
└──────────┴─────────────────────────┴───────────────────────────────────────┴───────────────────────────┘
```

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Rationale | Alternatives Considered |
| :--- | :--- | :--- | :--- |
| **Real-Time Engine** | Express WebSocket + Firestore sync | Instant sub-50ms message broadcast without client polling costs, with Firestore ensuring durable offline catch-up and queryability. | Firestore `onSnapshot` only (higher latency, quota burn on high-frequency typing) or pure in-memory WS (lost on server restart). |
| **Workspace Tenancy** | Multi-tenant collection `/workspaces/{wsId}` with `/members/{uid}` | Strict isolation; users cannot read or query channels/messages for workspaces they do not belong to. | Flat multi-org tags on single channel collection (higher risk of rule bypass or data leakage). |
| **Permissions Model** | Role hierarchy (`owner` > `admin` > `manager` > `employee` > `guest`) | Matches B2B team structures; guests can only access explicitly shared channels; employees access public and department channels; managers can manage tasks and invites. | Flat permissions (too rigid for external creator agencies and clients). |
| **Message Attachments** | Client upload to server `/api/team-hub/attachments` with MIME validation and secure authorized stream serving | Prevents public asset exposure; attachments respect workspace membership checks. | Raw base64 in Firestore (hits 1MB doc limit) or public third-party bucket (exposes confidential briefs). |
| **Task Extraction Integration** | Native "Create Task" action on any message with 1-click conversion into department task | Bridges communication and accountability directly without switching tools. | Separate detached todo lists. |

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   Browser Client (React)                               │
│  ┌───────────────────────┐  ┌────────────────────────┐  ┌───────────────────────────┐  │
│  │ Workspace & Nav State │  │ Channel & Thread State │  │ Real-time WS & Sync Hook  │  │
│  └──────────┬────────────┘  └───────────┬────────────┘  └─────────────┬─────────────┘  │
└─────────────┼───────────────────────────┼─────────────────────────────┼────────────────┘
              │                           │                             │
              ▼                           ▼                             ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              Express Server (server.ts)                                │
│  ┌───────────────────────────────────────┐  ┌───────────────────────────────────────┐  │
│  │ REST API: /api/workspaces/*           │  │ WebSocket Server (wss): /ws/team-hub  │  │
│  │ - Auth Middleware (verifyAuthToken)   │  │ - Connection & Token Handshake        │  │
│  │ - Role & Tenancy Verification         │  │ - Room Subscriptions (ws:channelId)   │  │
│  │ - Attachment Upload & Storage         │  │ - Broadcast (message, typing, status) │  │
│  └──────────────────┬────────────────────┘  └───────────────────┬───────────────────┘  │
└─────────────────────┼───────────────────────────────────────────┼──────────────────────┘
                      │                                           │
                      ▼                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  Persistence Layer                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Cloud Firestore (Enterprise Edition)                                             │  │
│  │ - /workspaces/{wsId}                                                             │  │
│  │ - /workspaces/{wsId}/members/{userId}                                            │  │
│  │ - /workspaces/{wsId}/channels/{channelId}                                        │  │
│  │ - /workspaces/{wsId}/channels/{channelId}/messages/{msgId}                       │  │
│  │ - /workspaces/{wsId}/channels/{channelId}/messages/{msgId}/threads/{replyId}     │  │
│  │ - /workspaces/{wsId}/tasks/{taskId}                                              │  │
│  │ - /workspaces/{wsId}/auditLogs/{logId}                                           │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Schema Definitions

1. **Workspace Entity (`/workspaces/{workspaceId}`)**
   ```typescript
   interface Workspace {
     id: string;
     name: string;
     slug: string;
     ownerId: string;
     avatarUrl?: string;
     description?: string;
     settings: {
       allowGuestInvites: boolean;
       defaultChannelId: string;
       aiAssistantEnabled: boolean; // Prepped for Phase 2
     };
     createdAt: string;
     updatedAt: string;
   }
   ```

2. **Workspace Member (`/workspaces/{workspaceId}/members/{userId}`)**
   ```typescript
   interface WorkspaceMember {
     userId: string;
     workspaceId: string;
     role: 'owner' | 'admin' | 'manager' | 'employee' | 'guest';
     displayName: string;
     email: string;
     avatarUrl?: string;
     departmentId?: string;
     title?: string;
     presence: 'online' | 'away' | 'busy' | 'offline';
     lastSeenAt: string;
     joinedAt: string;
   }
   ```

3. **Channel Entity (`/workspaces/{workspaceId}/channels/{channelId}`)**
   ```typescript
   interface Channel {
     id: string;
     workspaceId: string;
     name: string; // e.g. "growth-marketing"
     type: 'public' | 'private' | 'department' | 'project' | 'direct';
     topic?: string;
     description?: string;
     createdById: string;
     memberIds?: string[]; // For private channels and direct messages
     departmentCode?: string;
     projectId?: string;
     isArchived: boolean;
     lastMessageSnippet?: string;
     lastMessageAt?: string;
     unreadCount?: number;
     createdAt: string;
   }
   ```

4. **Message Entity (`/workspaces/{workspaceId}/channels/{channelId}/messages/{messageId}`)**
   ```typescript
   interface WorkspaceMessage {
     id: string;
     workspaceId: string;
     channelId: string;
     senderId: string;
     senderName: string;
     senderAvatar?: string;
     senderRole: string;
     content: string;
     attachments?: Array<{
       id: string;
       name: string;
       url: string;
       mimeType: string;
       sizeBytes: number;
     }>;
     reactions?: Record<string, string[]>; // emoji -> array of userIds
     mentions?: string[]; // userIds mentioned
     replyCount: number;
     lastReplyAt?: string;
     parentMessageId?: string; // If thread reply
     isPinned: boolean;
     pinnedBy?: string;
     status: 'sent' | 'delivered' | 'read';
     createdAt: string;
     updatedAt?: string;
   }
   ```

---

## 5. Implementation Phases & Step-by-Step Execution

### Phase 1: Core Company Communication Workspace (Immediate Implementation)
1. **Types & Data Models**: Create `src/types/teamHub.ts` with complete types for Workspaces, Members, Channels, Messages, Threads, Reactions, Attachments, and Tasks.
2. **Backend Real-Time & REST Infrastructure**:
   - Create `server/controllers/teamHubController.ts` with authenticated endpoints:
     - Workspace listing, creation, and member invitations.
     - Channel CRUD and membership resolution (public vs private vs DMs).
     - Message pagination, search, pin/unpin, and reactions.
     - Secure attachment uploads with MIME-type allowlists and virus/size guards.
     - Message-to-Task creation.
   - Extend `server.ts` WebSocket server to handle rooms (`workspace:${id}`, `channel:${id}`), typing indicators, presence heartbeat, and instant message distribution.
3. **Firestore Blueprint & Security Rules**:
   - Update `firebase-blueprint.json` with the new schema entities.
   - Update `firestore.rules` with RBAC checks enforcing workspace membership, channel privacy gates, and owner immutability.
4. **Client Services & Hooks**:
   - Create `src/services/teamHubChatService.ts` for hybrid WebSocket + REST + Firestore sync with optimistic dispatch and duplicate detection.
   - Build custom hook `useTeamHubWebSocket` with auto-reconnection and exponential backoff.
5. **UI Components & Workspace View**:
   - Create `src/components/team-hub/TeamHubWorkspace.tsx` as the main hub screen.
   - Implement `WorkspaceRail.tsx` (multi-workspace selector and invite modal).
   - Implement `ChannelSidebar.tsx` (public/private channels, DMs, unread counters, search).
   - Implement `ConversationView.tsx` (real-time message stream, virtualized scroll, date separators, presence indicators).
   - Implement `MessageComposer.tsx` (rich formatting, file attachments, mentions autocompletion, emoji picker, typing emitter).
   - Implement `ThreadPanel.tsx` (in-depth threaded conversation context).
   - Implement `TaskConvertModal.tsx` (1-click conversion of any message into a tracked task with assignee, priority, and due date).
6. **Navigation Wiring**:
   - Update `src/types/index.ts` to add `'team-hub'` to `View`.
   - Update `src/components/layout/BottomNav.tsx` and `TopNavbar.tsx` / `AppDrawer.tsx` to include the dedicated Company Chat tab.
   - Mount `TeamHubWorkspace` in `src/App.tsx` warm-tab structure alongside `chat`, `studio`, and `agents`.

### Phase 2: AI Assistant & Preference Profiles (Completed & Verified)
- [x] **5 Granular AI Toggles**:
  - Workspace AI enabled/disabled (master killswitch).
  - Channel AI enabled/disabled (#channel specific toggle).
  - Personal assistant enabled/disabled (drafting replies & agendas).
  - Proactive suggestions enabled/disabled (daily digests & proactive blockers).
  - Delegated replies enabled/disabled (opt-in routine communications).
  - Verified instant suspension: when AI is toggled OFF, all processing stops and 403 `WORKSPACE_AI_OFF` / `CHANNEL_AI_OFF` is returned.
- [x] **Conversation Summarization & Action Item Extraction**:
  - Gemini 3.8 Flash analysis of untrusted message logs within `<untrusted_team_messages>` security fences.
  - Summaries, confirmed decisions, action items with 1-click conversion to workspace tasks.
  - Blocker detection citing message IDs (`[msg-123]`) and severity ratings.
- [x] **Targeted Clarifying Questions**:
  - Identifies ambiguous responsibilities, missing owners, and deadlines.
  - Formulates structured clarifying questions with 1-click "Post in Chat" action.
- [x] **Contextual AI Reply & Agenda Drafting**:
  - Drafts replies and meeting agendas aligned with the user's preferred writing tone.
  - Mandatory disclosure badge: `AI assistant draft for [Name] (Direct, confident tone)`.
- [x] **Configured Reminders with Duplicate Prevention**:
  - Scheduled reminders with custom dates/times or quick presets (+30m, +2h, Tomorrow).
  - Idempotency key tracking prevents duplicate creation and duplicate delivery.
  - Background daemon checks due reminders every 30s.
- [x] **Manager & CXO Preference Profiles**:
  - Writing tone, communication style, working hours, and timezones.
  - Approved decision rules and escalation thresholds ($ USD).
  - Current strategic priorities and approved reply examples.
  - Strict opt-in for conversation history learning (disabled by default).
  - User inspect, edit, JSON export, and delete capabilities.
  - Multi-tenant isolation by user ID and company workspace.
- [x] **Automated Test Suite**:
  - `tests/teamHubPhase2.test.ts` verifying AI-off behavior, granular controls, duplicate reminder prevention, and profile isolation.

### Phase 3: Delegated Actions, Attendance & Work Progress (Completed & Verified)
- [x] **Delegated AI Assistant & Approvals**:
  - Delegated replies with mandatory disclosure: `AI assistant for [Name]`.
  - Safety restrictions: automatic mode strictly blocked for spending, contracts, commitments, hiring, and sensitive HR topics (requires human approval queue).
  - Draft mode for human CXO approval before dispatch.
  - Real-time killswitch: toggling a rule to `revoked` or `paused` immediately aborts execution.
  - Complete immutable audit trail tracking rule ID, authorizing user, timestamp, approval status, and rationale.
- [x] **Explicit Crew Attendance & Shift Schedule**:
  - Explicit manual clock-in and clock-out tracking (zero passive or invasive spyware).
  - Work duration calculation in minutes with location tags (`studio_stage_1`, `stage_2_lab`, `remote`, `on_location`).
  - Attendance correction workflow with employee justification and manager review audit trails.
  - Production wrap comp-off and paid leave requests with manager approval/rejection.
- [x] **Transparent Work Progress & Velocity Dashboards**:
  - Ethical transparency: zero keystroke logging, webcam captures, or message vanity scores.
  - Track assigned deliverables, completed milestones, declared blockers, and hours spent today.
  - Evidence-backed AI summaries citing specific verified message IDs.
- [x] **Automated Test Suite**:
  - `tests/teamHubPhase3.test.ts` verifying sensitive action safety blocks, approval queues, instant revocation killswitch, explicit attendance calculation, attendance corrections, and transparent workload reports.

---

## 6. Verification & Test Plan

1. **Automated Unit & Integration Tests**:
   - Create `tests/teamHubAccess.test.ts` to verify:
     - Cross-company tenant isolation (User from Org A cannot access Org B channels).
     - Private channel access rejection for unauthorized members.
     - Duplicate message prevention on network retries.
     - Real-time WebSocket delivery and presence tracking.
2. **Security Rules Verification**:
   - Validate Firestore security rules with ESLint rules plugin.
3. **Applet Compilation**:
   - Run `compile_applet` and `lint_applet` to confirm zero TypeScript, build, or syntax errors.
4. **Hostinger VPS Deployment Guide**:
   - Document complete deployment instructions (Node/TSX production configuration, PM2 process management, Nginx reverse proxy with WebSocket upgrade `proxy_set_header Upgrade $http_upgrade`, SSL, and environment variables).
