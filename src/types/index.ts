export type View = 'chat' | 'studio' | 'agents' | 'team-hub' | 'projects' | 'profile' | 'admin' | 'home' | 'create' | 'studios' | 'billboards' | 'dispatch' | 'partner' | 'calendar' | 'library' | 'ad-wizard' | 'content-engine';

export * from './teamHub';

export interface DispatchBooking {
  id?: string;
  userId: string;
  creatorTier: 'instagrammer' | 'dslr_pro' | 'agency_crew' | 'rental_express';
  creatorName?: string;
  creatorPhoto?: string;
  creatorHandle?: string;
  creatorEquipment?: string;
  vehicleInfo?: string;
  pickupLocation?: string;
  shootLocation: string;
  durationHours?: number;
  totalPrice: number;
  status: 'matching' | 'en_route' | 'arrived' | 'shooting' | 'completed';
  deliveredReelUrl?: string;
  rating?: number;
  briefPrompt?: string;
  createdAt?: string;
}


export interface BillboardEnquiry {
  id: string;
  userId: string;
  userEmail: string;
  prompt: string;
  billboardType: 'led' | 'banner' | 'scrolling' | 'any';
  budget: string;
  status: 'pending' | 'reviewed' | 'contacted';
  suggestedLocations?: string[];
  suggestedQuantity?: number;
  createdAt: string;
}

export interface BrandProfile {
  name: string;
  industry: string;
  targetAudience: string;
  tone: string;
  primaryColor: string;
  fontVibe: 'modern' | 'serif' | 'brutalist' | 'minimal';
  likedStudioIds?: string[];
}

export interface AdCreative {
  id: string;
  userId?: string;
  prompt: string;
  copy: string;
  imageUrls: string[];
  videoScript: string;
  productionBrief?: string; // High-end technical brief for studios
  brandId?: string;
  status: 'draft' | 'approved' | 'produced';
  createdAt: string;
}

export interface Studio {
  id: string;
  name: string;
  description: string;
  location: string;
  pricePerHour: number;
  imageUrl: string;
  category: 'photography' | 'video' | 'music' | 'podcast' | 'mixed' | 'billboard';
  equipment: string[];
  rating: number;
  amenities: string[];
  genres?: string[];
  previousWorks?: Array<{
    url: string;
    type: 'image' | 'video';
    title?: string;
  }>;
  availability?: string;
  isPremium?: boolean;
  socialLinks?: {
    instagram?: string;
    website?: string;
  };
}

export interface Booking {
  id: string;
  studioId: string;
  studioName: string;
  date: string;
  hours: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed';
  creativeId?: string; // Reference to the ad that inspired this booking
  userId?: string;
  brandName?: string;
}

export type ProjectStage = 'ideation' | 'pre_production' | 'production' | 'review' | 'delivered';

export interface ProjectMilestone {
  id: string;
  title: string;
  dueDate?: string;
  completed: boolean;
  notes?: string;
}

export interface ProjectDeliverable {
  id: string;
  name: string;
  url: string;
  type: 'video' | 'image' | 'script' | 'brief';
  uploadedAt: string;
  size?: string;
  status?: 'pending' | 'approved' | 'revision_requested';
  feedback?: string;
  version?: number;
}

export interface Project {
  id: string;
  userId: string;
  organizationId?: string;
  brandId?: string;
  title: string;
  brandName: string;
  stage: ProjectStage;
  budget: number;
  creativePrompt?: string;
  assignedCreator?: {
    id?: string;
    name: string;
    role: string;
    avatar?: string;
    handle?: string;
  };
  milestones: ProjectMilestone[];
  deliverables: ProjectDeliverable[];
  aiHealthScore?: number; // 0 - 100
  aiRiskAnalysis?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMessage {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string; // Anonymous handle e.g. "Lead Cinematographer", "Client Rep"
  senderRole: 'client' | 'creator' | 'producer' | 'admin';
  content: string;
  attachmentUrl?: string;
  timestamp: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  entityType: 'project' | 'studio' | 'booking' | 'dispatch' | 'system' | 'payment' | 'organization';
  entityId: string;
  performedBy: string;
  details: string;
  timestamp: string;
}

export interface AppConfig {
  subscriptionPrice: number;
  commissionRate: number; // e.g. 10%
  panIndiaMode: boolean;
  featureFlags?: Record<string, boolean>;
}

export type OrganizationRole = 
  | 'OWNER' 
  | 'ADMIN' 
  | 'PRODUCER' 
  | 'CREATIVE_DIRECTOR' 
  | 'EDITOR' 
  | 'FINANCE' 
  | 'CLIENT' 
  | 'VIEWER' 
  | 'CREATOR' 
  | 'STUDIO_OWNER' 
  | 'AGENCY';

export interface OrganizationMember {
  uid: string;
  email: string;
  displayName: string;
  role: OrganizationRole;
  addedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  logoUrl?: string;
  plan: 'starter' | 'pro' | 'enterprise';
  members: OrganizationMember[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phone?: string | null;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  defaultOrganizationId: string;
  role: OrganizationRole | string;
  isPartner?: boolean;
  partnerRole?: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  orderId: string;
  amount: number;
  currency: string;
  itemType: 'studio_booking' | 'creator_dispatch' | 'omas_campaign' | 'partner_subscription' | 'project_escrow' | 'wallet_deposit';
  itemId?: string;
  method: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  receiptUrl?: string;
  createdAt: string;
}

export interface ReviewRecord {
  id: string;
  authorId: string;
  authorName: string;
  targetId: string;
  targetType: 'creator' | 'studio' | 'project';
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

export interface DisputeRecord {
  id: string;
  projectId?: string;
  bookingId?: string;
  raisedBy: string;
  raisedByName: string;
  raisedAgainst: string;
  reason: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AppNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'project' | 'booking' | 'payment' | 'payout' | 'system' | 'deliverable' | 'ai-marketing' | 'dispatch';
  read: boolean;
  link?: string;
  createdAt?: string;
  time?: string;
  agentId?: string;
  priority?: 'high' | 'medium' | 'low';
}

// ================= GOOGLE AI AGENTS & TEAM OPS =================
export type AIAgentId = 'ketan-growth' | 'grok-marketing' | 'nova-director' | 'echo-outreach' | 'vault-ops';

export interface AIAgentInfo {
  id: AIAgentId;
  name: string;
  codename: string;
  role: string;
  tagline: string;
  avatar: string;
  badge: string;
  color: string;
  suggestedPrompts: string[];
  isGooglePowered?: boolean;
}

export interface AgentChatMessage {
  id: string;
  agentId: AIAgentId;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  metrics?: {
    viralityScore?: number;
    estimatedReach?: string;
    timeSaved?: string;
  };
}

export interface TeamMessageRecord {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  avatar: string;
  content: string;
  timestamp: string;
  isAiAgent?: boolean;
}

// ================= WALLET & IMMUTABLE LEDGER =================
export interface Wallet {
  uid: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarned?: number;
  currency: 'INR' | 'OC_CREDIT';
  updatedAt: string;
  version: number;
}

export type LedgerEntryType = 
  | 'deposit' 
  | 'booking_payment' 
  | 'dispatch_payment' 
  | 'payout' 
  | 'refund' 
  | 'tip' 
  | 'adjustment';

export type LedgerDirection = 'credit' | 'debit';
export type LedgerStatus = 'pending' | 'settled' | 'failed' | 'reversed';

export interface LedgerEntry {
  id: string;
  uid: string;
  type: LedgerEntryType;
  amount: number;
  currency: 'INR' | 'OC_CREDIT' | string;
  direction: LedgerDirection;
  balanceAfter: number;
  relatedOrderId?: string;
  relatedBookingId?: string;
  relatedPayoutId?: string;
  status: LedgerStatus;
  createdAt: string;
  createdBy: 'system' | string;
  metadata?: Record<string, any>;
}

// ================= CREATION AI V2 TYPES =================
export interface ProductionAdScene {
  sceneNumber: number;
  shotDescription: string;
  cameraMovement: string;
  lighting: string;
  voiceover: string;
  visualPrompt: string;
  imageUrl?: string;
  videoUrl?: string;
  status?: 'draft' | 'approved' | 'generated';
}

export interface ProductionAdPlan {
  title: string;
  brandName?: string;
  targetAudience: string;
  durationSeconds: number;
  aspectRatio: '9:16' | '16:9' | '1:1' | string;
  visualStyle: string;
  coreHook: string;
  videoScript: string;
  voicePersona: string;
  musicStyle: string;
  viralityTip?: string;
  scenes: ProductionAdScene[];
  status: 'draft_plan' | 'approved' | 'producing' | 'completed';
}

export interface CreationAIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
  adPlan?: ProductionAdPlan;
  generatedAssets?: Array<{
    type: 'image' | 'video' | 'audio' | 'script';
    url?: string;
    title: string;
    description?: string;
  }>;
  delegatedAgent?: AIAgentId;
  delegatedTask?: {
    id: string;
    agentId: string;
    title: string;
    output: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: CreationAIChatMessage[];
}

export interface AgentTask {
  id: string;
  agentId: AIAgentId;
  agentName: string;
  title: string;
  status: 'QUEUED' | 'RUNNING' | 'WAITING_FOR_APPROVAL' | 'COMPLETED' | 'FAILED';
  inputPrompt: string;
  outputData?: any;
  createdAt: string;
  completedAt?: string;
  tokenCostEstimate?: number;
}

export interface ContentCalendarItem {
  id: string;
  day: string;
  date: string;
  title: string;
  platform: 'instagram' | 'youtube' | 'tiktok';
  format: 'Reels' | 'Shorts' | 'Commercial' | 'Carousel';
  hook: string;
  status: 'idea' | 'scripted' | 'ready' | 'scheduled' | 'published';
  targetAudience?: string;
}

// ================= HYBRID HUMAN-AI TEAMS & CEO APPROVALS =================
export interface Employee {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
  departmentId: string;
  status: 'active' | 'in_production' | 'on_review' | 'offline';
  skills: string[];
  workloadScore: number; // 0-100%
  currentTask?: string;
  completedTasksCount: number;
  phone?: string;
  joinedDate?: string;
}

export interface DepartmentTeam {
  id: string;
  name: string;
  code: string;
  icon: string;
  description: string;
  aiManagerId: AIAgentId;
  aiManagerRole: string;
  isAiManagerEnabled: boolean;
  assignedBotId?: AIAgentId | null;
  members: string[]; // employee ids
  autonomousGoal: string;
  budgetMonthly: number;
  budgetSpent: number;
  kpis: {
    label: string;
    target: string;
    current: string;
    trend: 'up' | 'down' | 'steady';
  }[];
}

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
export type DecisionCategory = 
  | 'BUDGET_SPEND' 
  | 'CAMPAIGN_LAUNCH' 
  | 'HIRING_TALENT' 
  | 'LEGAL_RIGHTS' 
  | 'VENDOR_CONTRACT' 
  | 'CONTENT_RELEASE';

export interface ExecutiveApprovalRequest {
  id: string;
  title: string;
  category: DecisionCategory;
  riskTier: RiskLevel;
  departmentId: string;
  departmentName?: string;
  requestedByAgentId: AIAgentId;
  requestedByAgentName: string;
  assignedEmployeeName?: string;
  summary: string;
  reasoning: string;
  financialImpact?: {
    estimatedCost?: number;
    projectedReturn?: string;
    budgetVariance?: string;
    savingsEstimate?: string;
  };
  recommendedAction: string;
  status: ApprovalStatus;
  createdAt: string;
  decisionNotes?: string;
  decidedAt?: string;
  decidedBy?: string;
  actionPayload?: Record<string, any>;
}

export interface DepartmentTaskItem {
  id: string;
  departmentId: string;
  title: string;
  description: string;
  assignedToEmployeeId: string;
  assignedEmployeeName: string;
  assignedByAgentId: AIAgentId;
  assignedByAgentName: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  stage: 'backlog' | 'in_progress' | 'under_ai_review' | 'ready_for_approval' | 'done';
  dueDate: string;
  aiGuidanceNotes?: string;
  deliverableLink?: string;
  approvalRequestId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManagerActivityLog {
  id: string;
  timestamp: string;
  aiManagerId: AIAgentId;
  aiManagerName: string;
  actionType: 'task_assigned' | 'quality_reviewed' | 'escalated_to_ceo' | 'workload_balanced' | 'approval_executed';
  description: string;
  targetEmployeeName?: string;
  departmentId: string;
  badge?: string;
}

export interface ExecutiveBriefing {
  id: string;
  generatedAt: string;
  title: string;
  executiveSummary: string;
  timeSavedForCeoHours: number;
  decisionsResolvedAutonomously: number;
  pendingApprovalsCount: number;
  departmentSnapshots: {
    departmentName: string;
    managerName: string;
    status: 'optimal' | 'attention_needed' | 'critical';
    highlight: string;
  }[];
  strategicRecommendations: string[];
}

export interface AdBriefQuestionnaire {
  productOrService: string;
  category: string;
  targetCustomer: string;
  customerProblem: string;
  offerAndPrice: string;
  mainBenefit: string;
  placement: 'instagram_story' | 'instagram_feed' | 'facebook_feed' | 'youtube_landscape' | 'billboard_display' | 'tiktok_9_16';
  actionOrCta: 'shop_now' | 'book_call' | 'claim_offer' | 'learn_more' | 'install_app' | 'get_quote';
  language: string;
  visualStyle: 'cinematic_bold' | 'minimalist_clean' | 'warm_lifestyle' | 'vibrant_pop' | 'luxury_editorial';
  uploadedAssets: Array<{
    id: string;
    name: string;
    url: string;
    type: 'logo' | 'product_photo' | 'reference';
  }>;
  preserveProductPhotoUnchanged: boolean;
}

export interface CreativeDirection {
  id: string;
  directionTitle: string;
  hookHeadline: string;
  visualConcept: string;
  supportingCopy: string;
  callToAction: string;
  recommendedColors: string[];
  rationale: string;
}

export interface GeneratedAdResult {
  id: string;
  imageUrl: string;
  creativeDirectionId: string;
  directionTitle: string;
  headline: string;
  supportingCopy: string;
  offerText: string;
  ctaText: string;
  placement: string;
  aspectRatio: '9:16' | '1:1' | '16:9' | '4:5';
  visualStyle: string;
  headlineStyle?: {
    fontFamily: string;
    fontSize: number;
    color: string;
    positionY: number; // percentage
  };
  ctaStyle?: {
    backgroundColor: string;
    textColor: string;
    positionY: number;
  };
  preservedProduct: boolean;
  createdAt: string;
}

export interface VideoClipSegment {
  id: string;
  startTime: number; // seconds
  endTime: number; // seconds
  title: string;
  hookRationale: string;
  suggestedCaption: string;
  category: 'hook' | 'insight' | 'demo' | 'call_to_action';
  aspectRatio: '9:16' | '16:9' | '1:1';
}

export interface VideoAuditReport {
  overallScore: number;
  openingHookAnalysis: {
    durationSeconds: number;
    strength: 'strong' | 'moderate' | 'weak';
    observation: string;
    suggestion: string;
  };
  pacingAndRetention: {
    averageCutSeconds: number;
    observation: string;
    suggestion: string;
  };
  audioAndClarity: {
    clarityRating: string;
    observation: string;
    suggestion: string;
  };
  captionsAndAccessibility: {
    hasLegibleCaptions: boolean;
    observation: string;
    suggestion: string;
  };
  callToActionAudit: {
    timestamp: string;
    observation: string;
    suggestion: string;
  };
  factualObservations: string[];
  actionableSuggestions: string[];
}

