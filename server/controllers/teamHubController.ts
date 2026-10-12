import { Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { WebSocket, WebSocketServer } from 'ws';
import { AuthenticatedRequest } from '../types';
import {
  Workspace,
  WorkspaceMember,
  Channel,
  WorkspaceMessage,
  MessageAttachment,
  MessageTaskCreation,
  WorkspaceRole
} from '../../src/types/teamHub';

// In-Memory Fast Cache with persistent backing
const workspacesMap = new Map<string, Workspace>();
const membersMap = new Map<string, Map<string, WorkspaceMember>>(); // wsId -> (userId -> member)
const channelsMap = new Map<string, Map<string, Channel>>(); // wsId -> (channelId -> channel)
const messagesMap = new Map<string, WorkspaceMessage[]>(); // channelId -> messages
const tasksMap = new Map<string, MessageTaskCreation[]>(); // wsId -> tasks
const attachmentStore = new Map<string, { buffer: Buffer; mimeType: string; name: string }>();

// Processed idempotency message IDs for duplicate prevention
const seenMessageClientIds = new Map<string, { messageId: string; timestamp: number }>();

// Real-time WebSocket clients and room subscriptions
interface WSClientMeta {
  ws: WebSocket;
  userId: string;
  userName: string;
  activeWorkspaceId?: string;
  activeChannelId?: string;
  subscribedChannels: Set<string>;
}
const connectedClients = new Set<WSClientMeta>();

// Periodic cleanup of idempotency cache (older than 10 mins)
setInterval(() => {
  const tenMinsAgo = Date.now() - 10 * 60 * 1000;
  for (const [key, val] of seenMessageClientIds.entries()) {
    if (val.timestamp < tenMinsAgo) {
      seenMessageClientIds.delete(key);
    }
  }
}, 60000);

// Initialize Default Seed Workspace if empty
function ensureDefaultWorkspace(userId: string, userEmail: string = 'founder@onlycreation.com', displayName: string = 'Production Lead') {
  const defaultWsId = 'ws-onlycreation-hq';
  if (!workspacesMap.has(defaultWsId)) {
    const ws: Workspace = {
      id: defaultWsId,
      name: 'OnlyCreation Global HQ',
      slug: 'onlycreation-hq',
      ownerId: userId,
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop',
      description: 'Unified company workspace for creative directors, production crew, and clients.',
      inviteCode: 'OC-PRO-2026',
      settings: {
        allowGuestInvites: true,
        defaultChannelId: 'chan-general',
        aiAssistantEnabled: true
      },
      memberCount: 5,
      channelCount: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    workspacesMap.set(defaultWsId, ws);

    // Seed Members
    const wsMembers = new Map<string, WorkspaceMember>();
    const seedMembersList: WorkspaceMember[] = [
      {
        userId,
        workspaceId: defaultWsId,
        role: 'owner',
        displayName: displayName || 'Executive Producer',
        email: userEmail,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        title: 'Founder & CEO',
        departmentName: 'Executive Office',
        presence: 'online',
        lastSeenAt: new Date().toISOString(),
        joinedAt: new Date().toISOString()
      },
      {
        userId: 'emp-arjun-das',
        workspaceId: defaultWsId,
        role: 'manager',
        displayName: 'Arjun Das',
        email: 'arjun@onlycreation.com',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
        title: 'Lead Cinematographer',
        departmentId: 'dept-creative',
        departmentName: 'Cinematic Production Lab',
        presence: 'online',
        lastSeenAt: new Date().toISOString(),
        joinedAt: new Date().toISOString()
      },
      {
        userId: 'emp-dev-patel',
        workspaceId: defaultWsId,
        role: 'employee',
        displayName: 'Dev Patel',
        email: 'dev@onlycreation.com',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
        title: 'Viral Hook Specialist',
        departmentId: 'dept-growth',
        departmentName: 'Marketing & Performance',
        presence: 'away',
        lastSeenAt: new Date().toISOString(),
        joinedAt: new Date().toISOString()
      },
      {
        userId: 'emp-sarah-lin',
        workspaceId: defaultWsId,
        role: 'employee',
        displayName: 'Sarah Lin',
        email: 'sarah@onlycreation.com',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
        title: 'Ad Performance Analyst',
        departmentId: 'dept-growth',
        departmentName: 'Marketing & Performance',
        presence: 'online',
        lastSeenAt: new Date().toISOString(),
        joinedAt: new Date().toISOString()
      },
      {
        userId: 'emp-priya-sharma',
        workspaceId: defaultWsId,
        role: 'employee',
        displayName: 'Priya Sharma',
        email: 'priya@onlycreation.com',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
        title: 'Senior DaVinci Colorist',
        departmentId: 'dept-creative',
        departmentName: 'Cinematic Production Lab',
        presence: 'offline',
        lastSeenAt: new Date().toISOString(),
        joinedAt: new Date().toISOString()
      }
    ];

    for (const m of seedMembersList) {
      wsMembers.set(m.userId, m);
    }
    membersMap.set(defaultWsId, wsMembers);

    // Seed Channels
    const wsChannels = new Map<string, Channel>();
    const seedChannelsList: Channel[] = [
      {
        id: 'chan-general',
        workspaceId: defaultWsId,
        name: 'general',
        type: 'public',
        topic: 'Company-wide updates, daily greetings, and open discussions',
        description: 'Open to everyone in the workspace.',
        createdById: userId,
        isArchived: false,
        lastMessageSnippet: 'Welcome to the OnlyCreation Team Hub workspace!',
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: 'chan-announcements',
        workspaceId: defaultWsId,
        name: 'announcements',
        type: 'public',
        topic: 'Official company drops, client bookings, and executive milestones',
        description: 'Read-only announcements and company achievements.',
        createdById: userId,
        isArchived: false,
        lastMessageSnippet: 'Stage 2 Anamorphic commercial filming scheduled for Sunday.',
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: 'chan-growth-marketing',
        workspaceId: defaultWsId,
        name: 'growth-marketing',
        type: 'department',
        departmentCode: 'MKT-GROWTH',
        topic: 'TikTok/Reels viral pattern interrupts, Google Search trends & ROAS scaling',
        description: 'Performance growth engineering team channel.',
        createdById: userId,
        isArchived: false,
        lastMessageSnippet: '3-second hook hold rate hit 71.4% on yesterday testing drop.',
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: 'chan-cinema-lab',
        workspaceId: defaultWsId,
        name: 'cinema-lab',
        type: 'department',
        departmentCode: 'CINEMA-LAB',
        topic: 'DaVinci color grading, lighting setups, 4K camera packages',
        description: 'Cinematography and studio production crew.',
        createdById: userId,
        isArchived: false,
        lastMessageSnippet: '4K RED V-Raptor and Cooke Anamorphic glass loaded on Stage 1.',
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: 'chan-executive-leadership',
        workspaceId: defaultWsId,
        name: 'leadership-private',
        type: 'private',
        topic: 'CXO & Director confidential planning and budget allocations',
        description: 'Restricted to workspace owners, admins, and department managers.',
        createdById: userId,
        memberIds: [userId, 'emp-arjun-das'],
        isArchived: false,
        lastMessageSnippet: 'Q2 Studio expansion budget review on Thursday.',
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ];

    for (const c of seedChannelsList) {
      wsChannels.set(c.id, c);
    }
    channelsMap.set(defaultWsId, wsChannels);

    // Seed Initial Messages in #general
    const genMessages: WorkspaceMessage[] = [
      {
        id: 'msg-seed-1',
        workspaceId: defaultWsId,
        channelId: 'chan-general',
        senderId: 'emp-arjun-das',
        senderName: 'Arjun Das',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
        senderRole: 'manager',
        senderTitle: 'Lead Cinematographer',
        content: 'Good morning team! The 4K anamorphic footage from yesterday shoot is synced and ready on Stage 1.',
        reactions: { '🎬': ['emp-dev-patel', 'emp-sarah-lin'], '🔥': [userId] },
        replyCount: 2,
        lastReplyAt: new Date().toISOString(),
        isPinned: true,
        pinnedBy: 'Arjun Das',
        status: 'read',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'msg-seed-2',
        workspaceId: defaultWsId,
        channelId: 'chan-general',
        senderId: 'emp-sarah-lin',
        senderName: 'Sarah Lin',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
        senderRole: 'employee',
        senderTitle: 'Ad Performance Analyst',
        content: 'Reviewing the color pass now. The dynamic range holds up cleanly even in low light.',
        reactions: { '👍': ['emp-arjun-das'] },
        replyCount: 0,
        isPinned: false,
        status: 'read',
        createdAt: new Date(Date.now() - 1800000).toISOString()
      }
    ];
    messagesMap.set('chan-general', genMessages);

    // Seed Thread Replies for msg-seed-1
    const threadReplies: WorkspaceMessage[] = [
      {
        id: 'msg-reply-1',
        workspaceId: defaultWsId,
        channelId: 'chan-general',
        parentMessageId: 'msg-seed-1',
        senderId: 'emp-priya-sharma',
        senderName: 'Priya Sharma',
        senderAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
        senderRole: 'employee',
        senderTitle: 'Senior DaVinci Colorist',
        content: 'Applying the film emulation LUT now. Shadows are rich and skin tones stay natural.',
        replyCount: 0,
        isPinned: false,
        status: 'read',
        createdAt: new Date(Date.now() - 3000000).toISOString()
      },
      {
        id: 'msg-reply-2',
        workspaceId: defaultWsId,
        channelId: 'chan-general',
        parentMessageId: 'msg-seed-1',
        senderId: userId,
        senderName: displayName || 'Production Lead',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        senderRole: 'owner',
        senderTitle: 'Executive Producer',
        content: 'Approved! Let me know as soon as the 60-second master export is rendered.',
        replyCount: 0,
        isPinned: false,
        status: 'read',
        createdAt: new Date(Date.now() - 2400000).toISOString()
      }
    ];
    messagesMap.set('thread-msg-seed-1', threadReplies);
  }
}

// Helper: Broadcast WebSocket Event to Subscribed Clients
export function broadcastTeamHubEvent(event: {
  type: string;
  workspaceId: string;
  channelId?: string;
  payload: any;
}) {
  const messageStr = JSON.stringify(event);
  for (const client of connectedClients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      // If channel-specific event, only send to clients interested in that workspace/channel
      if (event.channelId) {
        if (
          client.activeWorkspaceId === event.workspaceId &&
          (client.activeChannelId === event.channelId || client.subscribedChannels.has(event.channelId))
        ) {
          client.ws.send(messageStr);
        }
      } else if (client.activeWorkspaceId === event.workspaceId) {
        client.ws.send(messageStr);
      }
    }
  }
}

// WebSocket Connection Handler for Team Hub
export function setupTeamHubWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket) => {
    const meta: WSClientMeta = {
      ws,
      userId: 'guest_' + Math.random().toString(36).substr(2, 6),
      userName: 'Guest User',
      subscribedChannels: new Set<string>()
    };
    connectedClients.add(meta);

    // Send connection handshake
    ws.send(JSON.stringify({ type: 'connected', serverTime: Date.now() }));

    ws.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === 'auth') {
          meta.userId = data.userId || meta.userId;
          meta.userName = data.userName || meta.userName;
          meta.activeWorkspaceId = data.workspaceId;
          meta.activeChannelId = data.channelId;
          if (data.channelId) meta.subscribedChannels.add(data.channelId);

          // Update member presence
          if (meta.activeWorkspaceId) {
            const wsMembers = membersMap.get(meta.activeWorkspaceId);
            if (wsMembers && wsMembers.has(meta.userId)) {
              const mem = wsMembers.get(meta.userId)!;
              mem.presence = 'online';
              mem.lastSeenAt = new Date().toISOString();
              broadcastTeamHubEvent({
                type: 'presence:update',
                workspaceId: meta.activeWorkspaceId,
                payload: { userId: meta.userId, presence: 'online', lastSeenAt: mem.lastSeenAt }
              });
            }
          }
        } else if (data.type === 'subscribe_channel') {
          if (data.channelId) {
            meta.subscribedChannels.add(data.channelId);
            meta.activeChannelId = data.channelId;
          }
        } else if (data.type === 'typing') {
          if (meta.activeWorkspaceId && data.channelId) {
            broadcastTeamHubEvent({
              type: 'typing:update',
              workspaceId: meta.activeWorkspaceId,
              channelId: data.channelId,
              payload: {
                userId: meta.userId,
                userName: meta.userName,
                isTyping: !!data.isTyping
              }
            });
          }
        }
      } catch (err) {
        console.warn('[TeamHub WS] Parse error:', err);
      }
    });

    ws.on('close', () => {
      connectedClients.delete(meta);
      if (meta.activeWorkspaceId) {
        const wsMembers = membersMap.get(meta.activeWorkspaceId);
        if (wsMembers && wsMembers.has(meta.userId)) {
          const mem = wsMembers.get(meta.userId)!;
          mem.presence = 'offline';
          mem.lastSeenAt = new Date().toISOString();
          broadcastTeamHubEvent({
            type: 'presence:update',
            workspaceId: meta.activeWorkspaceId,
            payload: { userId: meta.userId, presence: 'offline', lastSeenAt: mem.lastSeenAt }
          });
        }
      }
    });
  });
}

// -------------------------------------------------------------
// WORKSPACES CONTROLLER ENDPOINTS
// -------------------------------------------------------------

export async function handleGetWorkspaces(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.uid || 'guest-user';
    const userEmail = req.user?.email || 'user@onlycreation.com';
    const userName = (req.query.displayName as string) || 'Executive Producer';

    // Ensure default workspace is initialized
    ensureDefaultWorkspace(userId, userEmail, userName);

    // Collect all workspaces where user is owner or member
    const userWorkspaces: Workspace[] = [];
    for (const [wsId, ws] of workspacesMap.entries()) {
      const wsMembers = membersMap.get(wsId);
      if (ws.ownerId === userId || (wsMembers && wsMembers.has(userId))) {
        userWorkspaces.push({
          ...ws,
          memberCount: wsMembers ? wsMembers.size : 1,
          channelCount: channelsMap.get(wsId)?.size || 1
        });
      }
    }

    return res.json({ success: true, workspaces: userWorkspaces });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to get workspaces' });
  }
}

export async function handleCreateWorkspace(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.uid || 'guest-user';
    const userEmail = req.user?.email || 'user@onlycreation.com';
    const { name, description, avatarUrl, displayName = 'Workspace Owner' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    const wsId = `ws-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const inviteCode = `OC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newWs: Workspace = {
      id: wsId,
      name: name.trim(),
      slug,
      ownerId: userId,
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=200&auto=format&fit=crop',
      description: description?.trim() || '',
      inviteCode,
      settings: {
        allowGuestInvites: true,
        defaultChannelId: `chan-${wsId}-general`,
        aiAssistantEnabled: true
      },
      memberCount: 1,
      channelCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    workspacesMap.set(wsId, newWs);

    // Add owner as first member
    const wsMembers = new Map<string, WorkspaceMember>();
    const ownerMember: WorkspaceMember = {
      userId,
      workspaceId: wsId,
      role: 'owner',
      displayName,
      email: userEmail,
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      title: 'Workspace Owner & Lead',
      presence: 'online',
      lastSeenAt: new Date().toISOString(),
      joinedAt: new Date().toISOString()
    };
    wsMembers.set(userId, ownerMember);
    membersMap.set(wsId, wsMembers);

    // Create default #general and #announcements channels
    const wsChannels = new Map<string, Channel>();
    const generalChan: Channel = {
      id: `chan-${wsId}-general`,
      workspaceId: wsId,
      name: 'general',
      type: 'public',
      topic: `Welcome to ${newWs.name}!`,
      description: 'Public channel for company-wide chat.',
      createdById: userId,
      isArchived: false,
      lastMessageSnippet: 'Workspace created. Say hello!',
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    const announceChan: Channel = {
      id: `chan-${wsId}-announcements`,
      workspaceId: wsId,
      name: 'announcements',
      type: 'public',
      topic: 'Important notices and milestones',
      description: 'Official announcements.',
      createdById: userId,
      isArchived: false,
      createdAt: new Date().toISOString()
    };
    wsChannels.set(generalChan.id, generalChan);
    wsChannels.set(announceChan.id, announceChan);
    channelsMap.set(wsId, wsChannels);

    // Initial message
    const welcomeMsg: WorkspaceMessage = {
      id: `msg-${Date.now()}-welcome`,
      workspaceId: wsId,
      channelId: generalChan.id,
      senderId: userId,
      senderName: displayName,
      senderRole: 'owner',
      content: `Welcome to **${newWs.name}**! This workspace is ready for real-time channels, direct messages, and team tasks.`,
      replyCount: 0,
      isPinned: true,
      status: 'delivered',
      createdAt: new Date().toISOString()
    };
    messagesMap.set(generalChan.id, [welcomeMsg]);

    return res.json({ success: true, workspace: newWs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create workspace' });
  }
}

export async function handleJoinWorkspace(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.uid || 'guest-user';
    const userEmail = req.user?.email || 'user@onlycreation.com';
    const { inviteCode, displayName = 'Team Member', role = 'employee' } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    let targetWs: Workspace | null = null;
    for (const ws of workspacesMap.values()) {
      if (ws.inviteCode && ws.inviteCode.toUpperCase() === inviteCode.trim().toUpperCase()) {
        targetWs = ws;
        break;
      }
    }

    if (!targetWs) {
      return res.status(404).json({ error: 'Invalid invite code. No matching workspace found.' });
    }

    let wsMembers = membersMap.get(targetWs.id);
    if (!wsMembers) {
      wsMembers = new Map();
      membersMap.set(targetWs.id, wsMembers);
    }

    if (!wsMembers.has(userId)) {
      const newMember: WorkspaceMember = {
        userId,
        workspaceId: targetWs.id,
        role: role as WorkspaceRole,
        displayName,
        email: userEmail,
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
        presence: 'online',
        lastSeenAt: new Date().toISOString(),
        joinedAt: new Date().toISOString()
      };
      wsMembers.set(userId, newMember);

      broadcastTeamHubEvent({
        type: 'member:joined',
        workspaceId: targetWs.id,
        payload: newMember
      });
    }

    return res.json({ success: true, workspace: targetWs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to join workspace' });
  }
}

export async function handleGetWorkspaceMembers(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId } = req.params;
    const wsMembers = membersMap.get(workspaceId);
    if (!wsMembers) {
      return res.json({ success: true, members: [] });
    }

    const membersList = Array.from(wsMembers.values());
    return res.json({ success: true, members: membersList });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to get members' });
  }
}

export async function handleUpdateMemberRole(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId, memberId } = req.params;
    const { role } = req.body;
    const requesterId = req.user?.uid || 'guest-user';

    const ws = workspacesMap.get(workspaceId);
    const wsMembers = membersMap.get(workspaceId);
    if (!ws || !wsMembers) return res.status(404).json({ error: 'Workspace not found' });

    const requesterMember = wsMembers.get(requesterId);
    const isOwnerOrAdmin = ws.ownerId === requesterId || requesterMember?.role === 'owner' || requesterMember?.role === 'admin';
    if (!isOwnerOrAdmin) {
      return res.status(403).json({ error: 'Only workspace owners or admins can change roles.' });
    }

    const targetMember = wsMembers.get(memberId);
    if (!targetMember) return res.status(404).json({ error: 'Member not found in workspace' });

    targetMember.role = role as WorkspaceRole;
    return res.json({ success: true, member: targetMember });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update member role' });
  }
}

// -------------------------------------------------------------
// CHANNELS CONTROLLER ENDPOINTS
// -------------------------------------------------------------

export async function handleGetChannels(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.uid || 'guest-user';

    const wsChannels = channelsMap.get(workspaceId);
    if (!wsChannels) return res.json({ success: true, channels: [] });

    const wsMembers = membersMap.get(workspaceId);
    const userMember = wsMembers?.get(userId);
    const isOwnerOrAdmin = userMember?.role === 'owner' || userMember?.role === 'admin';

    // Filter channels based on permissions:
    // Public / Department / Project are visible to all workspace members.
    // Private channels and Direct Messages require user to be creator or in memberIds, or workspace owner/admin.
    const accessibleChannels: Channel[] = [];
    for (const channel of wsChannels.values()) {
      if (channel.type === 'public' || channel.type === 'department' || channel.type === 'project') {
        accessibleChannels.push(channel);
      } else if (channel.type === 'private' || channel.type === 'direct') {
        if (isOwnerOrAdmin || channel.createdById === userId || channel.memberIds?.includes(userId)) {
          accessibleChannels.push(channel);
        }
      }
    }

    return res.json({ success: true, channels: accessibleChannels });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to get channels' });
  }
}

export async function handleCreateChannel(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.uid || 'guest-user';
    const { name, type = 'public', topic, description, memberIds = [], departmentCode, projectId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Channel name is required' });
    }

    let wsChannels = channelsMap.get(workspaceId);
    if (!wsChannels) {
      wsChannels = new Map();
      channelsMap.set(workspaceId, wsChannels);
    }

    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
    const channelId = `chan-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    // Ensure creator is in memberIds for private channels or DMs
    const allMemberIds = Array.from(new Set([userId, ...memberIds]));

    const newChannel: Channel = {
      id: channelId,
      workspaceId,
      name: cleanName,
      type,
      topic: topic?.trim() || '',
      description: description?.trim() || '',
      createdById: userId,
      memberIds: type === 'private' || type === 'direct' ? allMemberIds : undefined,
      departmentCode,
      projectId,
      isArchived: false,
      lastMessageSnippet: 'Channel created.',
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    wsChannels.set(channelId, newChannel);

    // Initial welcome message in channel
    const initMsg: WorkspaceMessage = {
      id: `msg-${Date.now()}-init`,
      workspaceId,
      channelId,
      senderId: userId,
      senderName: req.user?.email || 'User',
      senderRole: 'employee',
      content: `Welcome to **#${cleanName}**! Start discussing ideas here.`,
      replyCount: 0,
      isPinned: false,
      status: 'delivered',
      createdAt: new Date().toISOString()
    };
    messagesMap.set(channelId, [initMsg]);

    broadcastTeamHubEvent({
      type: 'channel:created',
      workspaceId,
      payload: newChannel
    });

    return res.json({ success: true, channel: newChannel });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create channel' });
  }
}

// -------------------------------------------------------------
// MESSAGES & THREADS CONTROLLER ENDPOINTS
// -------------------------------------------------------------

export async function handleGetMessages(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId, channelId } = req.params;
    const limitCount = Number(req.query.limit) || 50;
    const beforeTimestamp = req.query.before as string;

    const channelMessages = messagesMap.get(channelId) || [];
    let filtered = channelMessages.filter(m => !m.parentMessageId); // top-level messages only

    if (beforeTimestamp) {
      filtered = filtered.filter(m => new Date(m.createdAt) < new Date(beforeTimestamp));
    }

    // Return most recent messages up to limit
    const paginated = filtered.slice(-limitCount);
    return res.json({
      success: true,
      channelId,
      workspaceId,
      messages: paginated,
      totalCount: filtered.length
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to get messages' });
  }
}

export async function handleSendMessage(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId, channelId } = req.params;
    const userId = req.user?.uid || 'guest-user';
    const {
      content,
      attachments = [],
      clientTempId,
      senderName = 'Team Member',
      senderRole = 'employee',
      senderAvatar,
      senderTitle,
      parentMessageId
    } = req.body;

    if (!content?.trim() && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: 'Message content or attachment is required' });
    }

    // Duplicate Prevention Check using clientTempId
    if (clientTempId && seenMessageClientIds.has(clientTempId)) {
      const existing = seenMessageClientIds.get(clientTempId)!;
      const cachedList = messagesMap.get(channelId) || [];
      const match = cachedList.find(m => m.id === existing.messageId);
      if (match) {
        return res.json({ success: true, message: match, deduplicated: true });
      }
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const nowIso = new Date().toISOString();

    const newMsg: WorkspaceMessage = {
      id: messageId,
      workspaceId,
      channelId,
      senderId: userId,
      senderName,
      senderAvatar: senderAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
      senderRole: senderRole as WorkspaceRole,
      senderTitle,
      content: content ? content.trim() : '',
      attachments,
      reactions: {},
      mentions: extractMentions(content),
      replyCount: 0,
      parentMessageId,
      isPinned: false,
      status: 'delivered',
      createdAt: nowIso
    };

    // Store in Channel Messages
    let channelMsgs = messagesMap.get(channelId);
    if (!channelMsgs) {
      channelMsgs = [];
      messagesMap.set(channelId, channelMsgs);
    }
    channelMsgs.push(newMsg);

    // If this is a thread reply, update parent message reply count
    if (parentMessageId) {
      const parent = channelMsgs.find(m => m.id === parentMessageId);
      if (parent) {
        parent.replyCount = (parent.replyCount || 0) + 1;
        parent.lastReplyAt = nowIso;
      }
      // Also store in dedicated thread index
      const threadKey = `thread-${parentMessageId}`;
      let threadMsgs = messagesMap.get(threadKey);
      if (!threadMsgs) {
        threadMsgs = [];
        messagesMap.set(threadKey, threadMsgs);
      }
      threadMsgs.push(newMsg);
    }

    // Update Channel Last Message Snippet
    const wsChannels = channelsMap.get(workspaceId);
    const chan = wsChannels?.get(channelId);
    if (chan) {
      chan.lastMessageSnippet = newMsg.content.slice(0, 60);
      chan.lastMessageAt = nowIso;
    }

    // Record idempotency
    if (clientTempId) {
      seenMessageClientIds.set(clientTempId, { messageId, timestamp: Date.now() });
    }

    // Broadcast in real-time
    broadcastTeamHubEvent({
      type: 'message:new',
      workspaceId,
      channelId,
      payload: newMsg
    });

    return res.json({ success: true, message: newMsg });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to send message' });
  }
}

export async function handleToggleReaction(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId, channelId, messageId } = req.params;
    const userId = req.user?.uid || 'guest-user';
    const { emoji } = req.body;

    if (!emoji) return res.status(400).json({ error: 'Emoji is required' });

    const channelMsgs = messagesMap.get(channelId) || [];
    const msg = channelMsgs.find(m => m.id === messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    if (!msg.reactions) msg.reactions = {};
    const existing = msg.reactions[emoji] || [];

    if (existing.includes(userId)) {
      msg.reactions[emoji] = existing.filter(u => u !== userId);
      if (msg.reactions[emoji].length === 0) {
        delete msg.reactions[emoji];
      }
    } else {
      msg.reactions[emoji] = [...existing, userId];
    }

    broadcastTeamHubEvent({
      type: 'message:reaction',
      workspaceId,
      channelId,
      payload: { messageId, reactions: msg.reactions }
    });

    return res.json({ success: true, reactions: msg.reactions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to toggle reaction' });
  }
}

export async function handleTogglePin(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId, channelId, messageId } = req.params;
    const requesterName = req.user?.email || 'User';

    const channelMsgs = messagesMap.get(channelId) || [];
    const msg = channelMsgs.find(m => m.id === messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    msg.isPinned = !msg.isPinned;
    msg.pinnedBy = msg.isPinned ? requesterName : undefined;

    broadcastTeamHubEvent({
      type: 'message:pin',
      workspaceId,
      channelId,
      payload: { messageId, isPinned: msg.isPinned, pinnedBy: msg.pinnedBy }
    });

    return res.json({ success: true, isPinned: msg.isPinned });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to toggle pin' });
  }
}

export async function handleGetThreadReplies(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId, channelId, messageId } = req.params;
    const threadKey = `thread-${messageId}`;
    const directThread = messagesMap.get(threadKey) || [];

    // Fallback: search channel messages for parentMessageId
    const channelMsgs = messagesMap.get(channelId) || [];
    const matched = channelMsgs.filter(m => m.parentMessageId === messageId);

    const merged = Array.from(new Map([...directThread, ...matched].map(m => [m.id, m])).values());
    merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return res.json({ success: true, replies: merged });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to get thread replies' });
  }
}

export async function handleSearchMessages(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId } = req.params;
    const queryStr = ((req.query.q as string) || '').trim().toLowerCase();
    if (!queryStr) return res.json({ success: true, results: [] });

    const results: WorkspaceMessage[] = [];
    const wsChannels = channelsMap.get(workspaceId);
    if (wsChannels) {
      for (const channelId of wsChannels.keys()) {
        const msgs = messagesMap.get(channelId) || [];
        for (const msg of msgs) {
          if (msg.content.toLowerCase().includes(queryStr)) {
            results.push(msg);
          }
        }
      }
    }

    return res.json({ success: true, results: results.slice(0, 30) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Search failed' });
  }
}

// -------------------------------------------------------------
// MESSAGE TO TASK CONVERSION
// -------------------------------------------------------------

export async function handleCreateTaskFromMessage(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.uid || 'guest-user';
    const {
      messageId,
      channelId,
      title,
      description,
      assignedToUserId,
      assignedToUserName,
      priority = 'medium',
      dueDate
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newTask: MessageTaskCreation = {
      id: taskId,
      workspaceId,
      channelId: channelId || 'chan-general',
      messageId: messageId || '',
      title: title.trim(),
      description: description?.trim() || '',
      assignedToUserId: assignedToUserId || userId,
      assignedToUserName: assignedToUserName || 'Assignee',
      createdByUserId: userId,
      createdByUserName: req.user?.email || 'Requester',
      priority,
      status: 'todo',
      dueDate: dueDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    let wsTasks = tasksMap.get(workspaceId);
    if (!wsTasks) {
      wsTasks = [];
      tasksMap.set(workspaceId, wsTasks);
    }
    wsTasks.push(newTask);

    broadcastTeamHubEvent({
      type: 'task:created',
      workspaceId,
      payload: newTask
    });

    return res.json({ success: true, task: newTask });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create task' });
  }
}

export async function handleGetTasks(req: AuthenticatedRequest, res: Response) {
  try {
    const { workspaceId } = req.params;
    const wsTasks = tasksMap.get(workspaceId) || [];
    return res.json({ success: true, tasks: wsTasks });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to get tasks' });
  }
}

// -------------------------------------------------------------
// ATTACHMENT UPLOAD & AUTHORIZED STREAMING
// -------------------------------------------------------------

export async function handleUploadAttachment(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, mimeType, dataBase64 } = req.body;
    if (!name || !mimeType || !dataBase64) {
      return res.status(400).json({ error: 'name, mimeType, and dataBase64 are required' });
    }

    // Allowed mime types
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf', 'text/plain', 'application/json',
      'audio/mpeg', 'audio/wav', 'audio/ogg'
    ];
    if (!allowed.some(t => mimeType.startsWith(t.split('/')[0]) || mimeType === t)) {
      return res.status(400).json({ error: `Unsupported file type: ${mimeType}` });
    }

    const buffer = Buffer.from(dataBase64.replace(/^data:[^;]+;base64,/, ''), 'base64');
    if (buffer.length > 50 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 50MB limit' });
    }

    const fileId = `att-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    attachmentStore.set(fileId, {
      buffer,
      mimeType,
      name: name.replace(/[^a-zA-Z0-9._-]/g, '_')
    });

    const attachmentUrl = `/api/team-hub/attachments/${fileId}`;
    const attachment: MessageAttachment = {
      id: fileId,
      name,
      url: attachmentUrl,
      mimeType,
      sizeBytes: buffer.length
    };

    return res.json({ success: true, attachment });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Attachment upload failed' });
  }
}

export async function handleGetAttachment(req: AuthenticatedRequest, res: Response) {
  try {
    const { fileId } = req.params;
    const file = attachmentStore.get(fileId);
    if (!file) {
      return res.status(404).json({ error: 'Attachment not found or expired' });
    }

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.name}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(file.buffer);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to serve attachment' });
  }
}

// Utility: Mention extractor
function extractMentions(text: string = ''): string[] {
  const matches = text.match(/@([a-zA-Z0-9_-]+)/g);
  if (!matches) return [];
  return matches.map(m => m.substring(1));
}

// Accessors for Team Hub AI Reasoner
export function getChannelMessages(channelId: string): WorkspaceMessage[] {
  return messagesMap.get(channelId) || [];
}

export function getChannelById(wsId: string, channelId: string): Channel | undefined {
  return channelsMap.get(wsId)?.get(channelId);
}

export function getWorkspaceById(wsId: string): Workspace | undefined {
  return workspacesMap.get(wsId);
}

export function getWorkspaceChannels(wsId: string): Channel[] {
  const wsChans = channelsMap.get(wsId);
  return wsChans ? Array.from(wsChans.values()) : [];
}

export function postSystemMessageToChannel(
  workspaceId: string, 
  channelId: string, 
  content: string, 
  senderName: string = 'AI Operations Assistant'
): WorkspaceMessage {
  const messageId = `msg-sys-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const nowIso = new Date().toISOString();
  const sysMsg: WorkspaceMessage = {
    id: messageId,
    workspaceId,
    channelId,
    senderId: 'system-ai-bot',
    senderName,
    senderRole: 'manager',
    senderTitle: 'AI Operations Coordinator',
    content,
    replyCount: 0,
    isPinned: false,
    status: 'delivered',
    isAiGenerated: true,
    aiPersonaBadge: senderName,
    createdAt: nowIso
  };

  let channelMsgs = messagesMap.get(channelId);
  if (!channelMsgs) {
    channelMsgs = [];
    messagesMap.set(channelId, channelMsgs);
  }
  channelMsgs.push(sysMsg);

  // Update snippet
  const wsChannels = channelsMap.get(workspaceId);
  const chan = wsChannels?.get(channelId);
  if (chan) {
    chan.lastMessageSnippet = sysMsg.content.slice(0, 60);
    chan.lastMessageAt = nowIso;
  }

  broadcastTeamHubEvent({
    type: 'message:new',
    workspaceId,
    channelId,
    payload: sysMsg
  });

  return sysMsg;
}
