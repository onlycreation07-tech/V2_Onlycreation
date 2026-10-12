import React, { useState, useEffect, useCallback } from 'react';
import { 
  Workspace, 
  Channel, 
  WorkspaceMember, 
  WorkspaceMessage, 
  MessageAttachment,
  ChannelType
} from '../../types/teamHub';
import { teamHubChatService } from '../../services/teamHubChatService';
import { useAuth } from '../../context/AuthContext';
import WorkspaceRail from './WorkspaceRail';
import ChannelSidebar from './ChannelSidebar';
import ConversationView from './ConversationView';
import ThreadPanel from './ThreadPanel';
import TaskConvertModal from './TaskConvertModal';
import CreateChannelModal from './CreateChannelModal';
import WorkspaceModal from './WorkspaceModal';
import InviteMemberModal from './InviteMemberModal';
import PreferenceProfileModal from './PreferenceProfileModal';
import AIGranularControlsModal from './AIGranularControlsModal';
import RemindersModal from './RemindersModal';
import DelegationManagementModal from './DelegationManagementModal';
import AttendanceModal from './AttendanceModal';
import WorkProgressModal from './WorkProgressModal';
import { Loader2 } from 'lucide-react';

export default function TeamHubWorkspace() {
  const { user } = useAuth();
  const currentUserId = user?.uid || 'guest-user';
  const currentUserName = user?.displayName || user?.email || 'Production Lead';

  // Workspaces State
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('');
  
  // Channels & Members State
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('');
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  
  // Messages & Threads State
  const [messages, setMessages] = useState<WorkspaceMessage[]>([]);
  const [activeThreadMessage, setActiveThreadMessage] = useState<WorkspaceMessage | null>(null);
  
  // Real-time State
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);

  // Modals State
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [taskConvertMessage, setTaskConvertMessage] = useState<WorkspaceMessage | null>(null);
  const [isPreferenceModalOpen, setIsPreferenceModalOpen] = useState(false);
  const [isAiControlsModalOpen, setIsAiControlsModalOpen] = useState(false);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);
  const [isDelegationModalOpen, setIsDelegationModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isWorkProgressModalOpen, setIsWorkProgressModalOpen] = useState(false);

  // Active Workspace & Channel objects
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || null;
  const activeChannel = channels.find(c => c.id === activeChannelId) || null;
  const currentUserMember = members.find(m => m.userId === currentUserId) || null;

  // 1. Initial Load: Fetch Workspaces
  useEffect(() => {
    let mounted = true;
    setIsLoadingWorkspaces(true);

    teamHubChatService.getWorkspaces()
      .then((data) => {
        if (!mounted) return;
        setWorkspaces(data);
        if (data.length > 0) {
          setActiveWorkspaceId(data[0].id);
        }
        setIsLoadingWorkspaces(false);
      })
      .catch((err) => {
        console.error('Failed to load workspaces:', err);
        if (mounted) setIsLoadingWorkspaces(false);
      });

    return () => {
      mounted = false;
    };
  }, [currentUserId]);

  // 2. Connect WebSocket when user & active workspace are ready
  useEffect(() => {
    if (!activeWorkspaceId) return;
    teamHubChatService.connectWebSocket(currentUserId, currentUserName, activeWorkspaceId, activeChannelId || undefined);
  }, [currentUserId, currentUserName, activeWorkspaceId, activeChannelId]);

  // 3. Load Channels and Members for Active Workspace
  useEffect(() => {
    if (!activeWorkspaceId) return;

    let mounted = true;

    // Load channels
    teamHubChatService.getChannels(activeWorkspaceId)
      .then((chans) => {
        if (!mounted) return;
        setChannels(chans);
        // Default to first channel or general
        if (chans.length > 0) {
          const gen = chans.find(c => c.name === 'general') || chans[0];
          setActiveChannelId(gen.id);
        }
      })
      .catch((err) => console.error('Failed to load channels:', err));

    // Load members
    teamHubChatService.getWorkspaceMembers(activeWorkspaceId)
      .then((mems) => {
        if (!mounted) return;
        setMembers(mems);
      })
      .catch((err) => console.error('Failed to load members:', err));

    return () => {
      mounted = false;
    };
  }, [activeWorkspaceId]);

  // 4. Load Messages for Active Channel
  useEffect(() => {
    if (!activeWorkspaceId || !activeChannelId) return;

    let mounted = true;
    setIsLoadingMessages(true);
    teamHubChatService.subscribeChannel(activeChannelId);

    teamHubChatService.getMessages(activeWorkspaceId, activeChannelId)
      .then((msgs) => {
        if (!mounted) return;
        setMessages(msgs);
        setIsLoadingMessages(false);
      })
      .catch((err) => {
        console.error('Failed to load channel messages:', err);
        if (mounted) setIsLoadingMessages(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeWorkspaceId, activeChannelId]);

  // 5. Real-Time WebSocket Event Listener
  useEffect(() => {
    const unsubscribe = teamHubChatService.subscribe((event) => {
      if (event.type === 'message:new' && event.channelId === activeChannelId) {
        setMessages(prev => {
          // Guard against duplicate messages
          if (prev.some(m => m.id === event.payload.id)) return prev;
          return [...prev, event.payload];
        });
      } else if (event.type === 'message:reaction' && event.channelId === activeChannelId) {
        setMessages(prev => prev.map(m => {
          if (m.id === event.payload.messageId) {
            return { ...m, reactions: event.payload.reactions };
          }
          return m;
        }));
      } else if (event.type === 'message:pin' && event.channelId === activeChannelId) {
        setMessages(prev => prev.map(m => {
          if (m.id === event.payload.messageId) {
            return { ...m, isPinned: event.payload.isPinned, pinnedBy: event.payload.pinnedBy };
          }
          return m;
        }));
      } else if (event.type === 'typing:update' && event.channelId === activeChannelId) {
        const { userName, isTyping, userId } = event.payload;
        if (userId !== currentUserId) {
          setTypingUsers(prev => {
            if (isTyping) {
              return prev.includes(userName) ? prev : [...prev, userName];
            } else {
              return prev.filter(u => u !== userName);
            }
          });
        }
      } else if (event.type === 'presence:update') {
        setMembers(prev => prev.map(m => {
          if (m.userId === event.payload.userId) {
            return { ...m, presence: event.payload.presence, lastSeenAt: event.payload.lastSeenAt };
          }
          return m;
        }));
      }
    });

    return unsubscribe;
  }, [activeChannelId, currentUserId]);

  // 6. Action Handlers
  const handleSendMessage = async (content: string, attachments: MessageAttachment[]) => {
    if (!activeWorkspaceId || !activeChannelId) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: WorkspaceMessage = {
      id: tempId,
      workspaceId: activeWorkspaceId,
      channelId: activeChannelId,
      senderId: currentUserId,
      senderName: currentUserName,
      senderAvatar: currentUserMember?.avatarUrl,
      senderRole: currentUserMember?.role || 'employee',
      senderTitle: currentUserMember?.title,
      content,
      attachments,
      reactions: {},
      replyCount: 0,
      isPinned: false,
      status: 'sent',
      createdAt: new Date().toISOString()
    };

    // Optimistically insert message
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const realMsg = await teamHubChatService.sendMessage(activeWorkspaceId, activeChannelId, {
        content,
        attachments,
        clientTempId: tempId,
        senderName: currentUserName,
        senderRole: currentUserMember?.role || 'employee',
        senderAvatar: currentUserMember?.avatarUrl,
        senderTitle: currentUserMember?.title
      });

      // Replace optimistic message with server authoritative message
      setMessages(prev => prev.map(m => m.id === tempId ? realMsg : m));
    } catch (err) {
      console.error('Failed to dispatch message:', err);
      // Mark optimistic message as failed or leave
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!activeWorkspaceId || !activeChannelId) return;
    try {
      const newReactions = await teamHubChatService.toggleReaction(activeWorkspaceId, activeChannelId, messageId, emoji);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: newReactions } : m));
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  };

  const handleTogglePin = async (messageId: string) => {
    if (!activeWorkspaceId || !activeChannelId) return;
    try {
      const isPinned = await teamHubChatService.togglePin(activeWorkspaceId, activeChannelId, messageId);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isPinned } : m));
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  const handleCreateChannel = async (params: {
    name: string;
    type: ChannelType;
    topic?: string;
    description?: string;
  }) => {
    if (!activeWorkspaceId) return;
    const newChan = await teamHubChatService.createChannel(activeWorkspaceId, params);
    setChannels(prev => [...prev, newChan]);
    setActiveChannelId(newChan.id);
  };

  const handleCreateWorkspace = async (params: { name: string; description?: string }) => {
    const newWs = await teamHubChatService.createWorkspace({
      ...params,
      displayName: currentUserName
    });
    setWorkspaces(prev => [...prev, newWs]);
    setActiveWorkspaceId(newWs.id);
  };

  const handleJoinWorkspace = async (inviteCode: string) => {
    const joinedWs = await teamHubChatService.joinWorkspace(inviteCode, currentUserName);
    setWorkspaces(prev => {
      if (prev.some(w => w.id === joinedWs.id)) return prev;
      return [...prev, joinedWs];
    });
    setActiveWorkspaceId(joinedWs.id);
  };

  const handleToggleChannelAi = async (channelId: string, enabled: boolean) => {
    if (!activeWorkspaceId) return;
    try {
      const res = await teamHubChatService.toggleChannelAi(activeWorkspaceId, channelId, enabled);
      setChannels(prev => prev.map(c => c.id === channelId ? { ...c, isAiEnabled: res } : c));
    } catch (err) {
      console.error('Failed to toggle channel AI:', err);
    }
  };

  if (isLoadingWorkspaces) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#090D16] text-white">
        <Loader2 size={32} className="animate-spin text-sleek-violet" />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex bg-[#090D16] text-white overflow-hidden relative">
      {/* 1. Leftmost Workspace Switcher Rail (64px) */}
      <WorkspaceRail
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={setActiveWorkspaceId}
        onOpenCreateOrJoin={() => setIsWorkspaceModalOpen(true)}
        currentUserMember={currentUserMember}
      />

      {/* 2. Channel & Teammates Navigation Sidebar (256px) */}
      <ChannelSidebar
        workspace={activeWorkspace}
        channels={channels}
        members={members}
        activeChannelId={activeChannelId}
        onSelectChannel={setActiveChannelId}
        onOpenCreateChannel={() => setIsCreateChannelModalOpen(true)}
        onOpenInviteModal={() => setIsInviteModalOpen(true)}
        currentUserId={currentUserId}
      />

      {/* 3. Central Conversation Stream */}
      <ConversationView
        channel={activeChannel}
        messages={messages}
        members={members}
        currentUserId={currentUserId}
        typingUsers={typingUsers}
        isLoading={isLoadingMessages}
        onSendMessage={handleSendMessage}
        onToggleReaction={handleToggleReaction}
        onOpenThread={setActiveThreadMessage}
        onTogglePin={handleTogglePin}
        onConvertTask={setTaskConvertMessage}
        onOpenPreferences={() => setIsPreferenceModalOpen(true)}
        onToggleChannelAi={(enabled) => activeChannelId && handleToggleChannelAi(activeChannelId, enabled)}
        onOpenRemindersModal={() => setIsRemindersModalOpen(true)}
        onOpenAiControlsModal={() => setIsAiControlsModalOpen(true)}
        onOpenAttendance={() => setIsAttendanceModalOpen(true)}
        onOpenWorkProgress={() => setIsWorkProgressModalOpen(true)}
        onOpenDelegations={() => setIsDelegationModalOpen(true)}
      />

      {/* 4. Collapsible Message Thread Panel (360px) */}
      {activeThreadMessage && (
        <ThreadPanel
          workspaceId={activeWorkspaceId}
          channelId={activeChannelId}
          parentMessage={activeThreadMessage}
          currentUserId={currentUserId}
          onClose={() => setActiveThreadMessage(null)}
          onToggleReaction={handleToggleReaction}
          onConvertTask={setTaskConvertMessage}
        />
      )}

      {/* MODALS */}
      <CreateChannelModal
        isOpen={isCreateChannelModalOpen}
        onClose={() => setIsCreateChannelModalOpen(false)}
        onCreateChannel={handleCreateChannel}
      />

      <WorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        onCreateWorkspace={handleCreateWorkspace}
        onJoinWorkspace={handleJoinWorkspace}
      />

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        workspace={activeWorkspace}
      />

      <TaskConvertModal
        isOpen={!!taskConvertMessage}
        onClose={() => setTaskConvertMessage(null)}
        message={taskConvertMessage}
        workspaceId={activeWorkspaceId}
        members={members}
      />

      <PreferenceProfileModal
        isOpen={isPreferenceModalOpen}
        onClose={() => setIsPreferenceModalOpen(false)}
        workspaceId={activeWorkspaceId}
      />

      <AIGranularControlsModal
        isOpen={isAiControlsModalOpen}
        onClose={() => setIsAiControlsModalOpen(false)}
        workspaceId={activeWorkspaceId}
        activeChannel={activeChannel}
        onChannelAiToggled={(chanId, enabled) => handleToggleChannelAi(chanId, enabled)}
      />

      <RemindersModal
        isOpen={isRemindersModalOpen}
        onClose={() => setIsRemindersModalOpen(false)}
        workspaceId={activeWorkspaceId}
        channels={channels}
        members={members}
        activeChannelId={activeChannelId}
        currentUserId={currentUserId}
      />

      <DelegationManagementModal
        isOpen={isDelegationModalOpen}
        onClose={() => setIsDelegationModalOpen(false)}
        workspaceId={activeWorkspaceId}
        currentUserId={currentUserId}
      />

      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        workspaceId={activeWorkspaceId}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />

      <WorkProgressModal
        isOpen={isWorkProgressModalOpen}
        onClose={() => setIsWorkProgressModalOpen(false)}
        workspaceId={activeWorkspaceId}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />
    </div>
  );
}
