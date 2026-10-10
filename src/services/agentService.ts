import { apiFetch } from './apiClient';
import { AIAgentId, AIAgentInfo, AgentChatMessage, TeamMessageRecord, AppNotification, BrandProfile } from '../types';

export const AI_AGENTS_LIST: AIAgentInfo[] = [
  {
    id: 'ketan-growth',
    name: 'Ketan',
    codename: 'Growth & Google Intelligence Strategist',
    role: 'Principal Growth & Viral Ad Strategist',
    tagline: 'Live Google Search grounding, viral hooks, Meta ad variations, and algorithm strategy on autopilot.',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop',
    badge: 'GOOGLE AI POWERED',
    color: '#8B5CF6',
    isGooglePowered: true,
    suggestedPrompts: [
      'Search live market trends & generate 5 viral TikTok/Reel hooks',
      'Create 3 high-converting Meta ad variations with CTR hooks',
      'Analyze trending competitor ad strategies using Google Search',
      'Give me a 7-day Instagram Reels content schedule for Q4'
    ]
  },
  {
    id: 'nova-director',
    name: 'Nova',
    codename: 'Creative Director',
    role: 'Visual Storyboarder & Production Auteur',
    tagline: 'Translates brand prompts into cinematic shot-lists, lighting diagrams, and DaVinci color palettes.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    badge: 'CINEMA LAB',
    color: '#EC4899',
    suggestedPrompts: [
      'Create shot-list for a 30s luxury commercial',
      'Suggest lighting setup & color grade for a dark studio shoot',
      'Convert product features into an emotional storytelling storyboard',
      'Recommend camera movement & lens package for fashion promo'
    ]
  },
  {
    id: 'echo-outreach',
    name: 'Echo',
    codename: 'PR & Outreach Bot',
    role: 'Creator & Sponsor Outreach Partner',
    tagline: 'Crafts high-response influencer DMs, brand sponsorship decks, and VIP client follow-ups.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    badge: 'PR AGENT',
    color: '#10B981',
    suggestedPrompts: [
      'Draft a high-converting Instagram DM to recruit top creators',
      'Write a sponsor pitch for our upcoming video production series',
      'Follow-up message for a client who went cold on a ₹50,000 quote',
      'VIP onboarding message for our newly assigned Lead Cinematographer'
    ]
  },
  {
    id: 'vault-ops',
    name: 'Vault',
    codename: 'Budget & Studio Guard',
    role: 'Financial Operator & Margin Optimizer',
    tagline: 'Audits production quotes, protects studio margins, and calculates projected ROAS.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
    badge: 'ROI GUARD',
    color: '#F59E0B',
    suggestedPrompts: [
      'Audit our shoot budget under ₹30,000 for maximum production value',
      'Calculate estimated ROI and break-even for our next ad campaign',
      'Compare equipment rental vs hiring an all-inclusive creator dispatch',
      'Optimize studio booking hours vs crew shoot efficiency'
    ]
  }
];

export const agentService = {
  getAgents(): AIAgentInfo[] {
    return AI_AGENTS_LIST;
  },

  getAgent(id: AIAgentId | string): AIAgentInfo {
    if (id === 'grok-marketing' || id === 'ketan-growth') {
      return AI_AGENTS_LIST[0];
    }
    return AI_AGENTS_LIST.find(a => a.id === id) || AI_AGENTS_LIST[0];
  },

  async callKetanWithSearchGrounding(
    prompt: string,
    brandProfile?: BrandProfile
  ): Promise<{
    reply: string;
    sources: Array<{ title: string; uri: string }>;
    metrics?: { viralityScore?: number; estimatedReach?: string };
    timestamp: string;
  }> {
    try {
      const res = await apiFetch('/api/agents/ketan/search-grounded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, brandProfile })
      });
      if (!res.ok) throw new Error('Search grounding request failed');
      const data = await res.json();
      return {
        reply: data.reply,
        sources: data.sources || [],
        metrics: data.metrics,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } catch (error) {
      throw error;
    }
  },

  async sendMessage(
    agentId: AIAgentId, 
    message: string, 
    conversationHistory: Array<{ role: 'user' | 'agent'; text: string }> = [],
    brandProfile?: BrandProfile
  ): Promise<{
    reply: string;
    metrics?: { viralityScore?: number; estimatedReach?: string; timeSaved?: string };
    timestamp: string;
  }> {
    try {
      const res = await apiFetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          message,
          conversationHistory,
          brandProfile
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to send message: ${res.statusText}`);
      }

      const data = await res.json();
      return {
        reply: data.reply,
        metrics: data.metrics,
        timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } catch (error) {
      throw error;
    }
  },

  async generateAutonomousCampaign(
    campaignGoal: string,
    brandProfile?: BrandProfile,
    targetPlatform = 'tiktok_reels'
  ) {
    try {
      const res = await apiFetch('/api/agents/generate-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignGoal, brandProfile, targetPlatform })
      });
      if (!res.ok) throw new Error('Campaign generation failed');
      return await res.json();
    } catch (error) {
      throw error;
    }
  },

  async getNotifications(): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
    try {
      const res = await apiFetch('/api/agents/notifications');
      if (!res.ok) throw new Error('Failed to load notifications');
      const data = await res.json();
      return {
        notifications: data.notifications || [],
        unreadCount: data.unreadCount || 0
      };
    } catch (error) {
      throw error;
    }
  },

  async markNotificationRead(id?: string, all = false): Promise<number> {
    try {
      const res = await apiFetch('/api/agents/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, all })
      });
      if (!res.ok) throw new Error('Could not update notification');
      const data = await res.json();
      return data.unreadCount ?? 0;
    } catch (error) {
      throw error;
    }
  },

  async getTeamMessages(channelId = 'general-ops'): Promise<TeamMessageRecord[]> {
    try {
      const res = await apiFetch(`/api/team/messages?channelId=${encodeURIComponent(channelId)}`);
      if (!res.ok) throw new Error('Failed to load team messages');
      const data = await res.json();
      return data.messages || [];
    } catch (error) {
      throw error;
    }
  },

  async sendTeamMessage(
    channelId: string, 
    content: string, 
    senderName = 'Brand Owner', 
    senderRole = 'Executive Producer'
  ): Promise<TeamMessageRecord> {
    const res = await apiFetch('/api/team/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId, content, senderName, senderRole })
    });
    if (!res.ok) throw new Error('Failed to send team message');
    const data = await res.json();
    return data.message;
  }
};
