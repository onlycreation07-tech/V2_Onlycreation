import { auth } from '../lib/firebase';
const storageKey = (key: string) => `${key}:${auth.currentUser?.uid || 'signed_out'}`;
import { 
  DepartmentTeam, 
  Employee, 
  ExecutiveApprovalRequest, 
  DepartmentTaskItem, 
  ManagerActivityLog, 
  ExecutiveBriefing,
  AIAgentId,
  ApprovalStatus,
  RiskLevel,
  DecisionCategory
} from '../types';
import { AI_AGENTS_LIST } from './agentService';

const STORAGE_KEYS = {
  TEAMS: 'creation_ai_department_teams',
  EMPLOYEES: 'creation_ai_employees',
  APPROVALS: 'creation_ai_executive_approvals',
  TASKS: 'creation_ai_department_tasks',
  ACTIVITY: 'creation_ai_manager_activity_logs',
  BRIEFINGS: 'creation_ai_executive_briefings',
  AGENT_CHATS: 'creation_ai_isolated_agent_chats'
};

export const INITIAL_DEPARTMENTS: DepartmentTeam[] = [
  {
    id: 'dept-growth',
    name: 'Marketing & Performance Growth',
    code: 'MKT-GROWTH',
    icon: 'TrendingUp',
    description: 'Autonomous viral hooks, Google search trend grounding, and Meta/TikTok ad distribution on autopilot.',
    aiManagerId: 'ketan-growth',
    aiManagerRole: 'Principal Growth & Google Intelligence Strategist',
    isAiManagerEnabled: true,
    assignedBotId: 'ketan-growth',
    members: ['emp-dev-patel', 'emp-sarah-lin'],
    autonomousGoal: 'Achieve 4.0x+ ROAS across paid channels with daily viral hook testing.',
    budgetMonthly: 15000,
    budgetSpent: 8450,
    kpis: [
      { label: '3-Sec Hook Hold', target: '65%', current: '71.4%', trend: 'up' },
      { label: 'Blended ROAS', target: '3.5x', current: '4.2x', trend: 'up' },
      { label: 'Weekly Hook Output', target: '25 hooks', current: '32 hooks', trend: 'up' }
    ]
  },
  {
    id: 'dept-creative',
    name: 'Cinematic Production & Studio Lab',
    code: 'CINEMA-LAB',
    icon: 'Film',
    description: 'Hollywood-grade 4K shot planning, 3-point lighting diagrams, and DaVinci color grade execution.',
    aiManagerId: 'nova-director',
    aiManagerRole: 'Visual Storyboarder & Production Auteur',
    isAiManagerEnabled: true,
    assignedBotId: 'nova-director',
    members: ['emp-arjun-das', 'emp-priya-sharma'],
    autonomousGoal: 'Zero pre-production delays: instant executable shot-lists and gear manifests for every brief.',
    budgetMonthly: 25000,
    budgetSpent: 14200,
    kpis: [
      { label: 'Shoot Turnaround', target: '48h', current: '36h', trend: 'up' },
      { label: 'Studio Utilization', target: '80%', current: '88%', trend: 'up' },
      { label: 'Client Asset Approval', target: '90%', current: '94%', trend: 'up' }
    ]
  },
  {
    id: 'dept-partnerships',
    name: 'Creator Relations & Social PR',
    code: 'CREATOR-PR',
    icon: 'Users',
    description: 'Ultra-targeted influencer recruitment DMs, VIP sponsor contracts, and brand deal negotiations.',
    aiManagerId: 'echo-outreach',
    aiManagerRole: 'Creator & Sponsor Outreach Partner',
    isAiManagerEnabled: true,
    assignedBotId: 'echo-outreach',
    members: ['emp-maya-sen', 'emp-rohan-kapoor'],
    autonomousGoal: 'Secure high-impact creator collaborations with >80% response rate and minimal owner involvement.',
    budgetMonthly: 10000,
    budgetSpent: 4800,
    kpis: [
      { label: 'DM Response Rate', target: '75%', current: '84.2%', trend: 'up' },
      { label: 'Active Ambassadors', target: '12', current: '15', trend: 'up' },
      { label: 'Avg Contract Cycle', target: '4 days', current: '2.1 days', trend: 'up' }
    ]
  },
  {
    id: 'dept-ops',
    name: 'Financial Governance & Margin Audit',
    code: 'FIN-OPS',
    icon: 'DollarSign',
    description: 'Unit economics protection, gear rental audit, margin enforcement, and escrow milestones.',
    aiManagerId: 'vault-ops',
    aiManagerRole: 'Financial Operator & Margin Optimizer',
    isAiManagerEnabled: true,
    assignedBotId: 'vault-ops',
    members: ['emp-kabir-mehta'],
    autonomousGoal: 'Eliminate agency waste and safeguard 35%+ operating gross margins across all productions.',
    budgetMonthly: 35000,
    budgetSpent: 19500,
    kpis: [
      { label: 'Operating Margin', target: '35%', current: '41.8%', trend: 'up' },
      { label: 'Overspend Blocked', target: '$5,000/mo', current: '$12,400', trend: 'up' },
      { label: 'Invoice Audit Speed', target: '24h', current: '1.2h', trend: 'up' }
    ]
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-dev-patel',
    name: 'Dev Patel',
    role: 'Senior Performance Media Buyer',
    email: 'dev.patel@creationai.studio',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop',
    departmentId: 'dept-growth',
    status: 'active',
    skills: ['Meta Ads Manager', 'TikTok Spark Ads', 'Lookalike Scaling', 'A/B Testing'],
    workloadScore: 72,
    currentTask: 'Scaling Reel hook variant C on Meta Ads Manager',
    completedTasksCount: 47,
    phone: '+91 98201 44829',
    joinedDate: 'Jan 2025'
  },
  {
    id: 'emp-sarah-lin',
    name: 'Sarah Lin',
    role: 'Viral Hook Copywriter',
    email: 'sarah.lin@creationai.studio',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    departmentId: 'dept-growth',
    status: 'in_production',
    skills: ['Short-Form Scriptwriting', 'Direct-Response Copy', 'Hook Psychology', 'Subtitles'],
    workloadScore: 60,
    currentTask: 'Drafting 5 pattern-interrupt scripts for Q4 launch',
    completedTasksCount: 68,
    phone: '+91 98402 11983',
    joinedDate: 'Feb 2025'
  },
  {
    id: 'emp-arjun-das',
    name: 'Arjun Das',
    role: 'Lead Cinematographer & DP',
    email: 'arjun.das@creationai.studio',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
    departmentId: 'dept-creative',
    status: 'in_production',
    skills: ['Sony FX3 & FX6', 'Arri LogC3', 'Gimbal & Motion Sliders', 'Lighting Design'],
    workloadScore: 85,
    currentTask: 'Calibrating 3-point lighting setup for dark studio macro shoot',
    completedTasksCount: 52,
    phone: '+91 98110 33812',
    joinedDate: 'Nov 2024'
  },
  {
    id: 'emp-priya-sharma',
    name: 'Priya Sharma',
    role: 'Studio Production Coordinator',
    email: 'priya.sharma@creationai.studio',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop',
    departmentId: 'dept-creative',
    status: 'active',
    skills: ['Studio Call Sheets', 'Equipment Dispatch', 'Talent Logistics', 'Set Safety'],
    workloadScore: 50,
    currentTask: 'Booking CineSpace Stage 2 for Saturday 2:00 PM shoot',
    completedTasksCount: 79,
    phone: '+91 98711 90214',
    joinedDate: 'Dec 2024'
  },
  {
    id: 'emp-maya-sen',
    name: 'Maya Sen',
    role: 'Creator Partnerships Manager',
    email: 'maya.sen@creationai.studio',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop',
    departmentId: 'dept-partnerships',
    status: 'on_review',
    skills: ['Creator Negotiation', 'Rate Card Auditing', 'Affiliate Programs', 'Instagram Outreach'],
    workloadScore: 65,
    currentTask: 'Executing personalized DMs to top 10 tech creators',
    completedTasksCount: 41,
    phone: '+91 99302 44719',
    joinedDate: 'Mar 2025'
  },
  {
    id: 'emp-rohan-kapoor',
    name: 'Rohan Kapoor',
    role: 'Talent Intake Associate',
    email: 'rohan.kapoor@creationai.studio',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=200&auto=format&fit=crop',
    departmentId: 'dept-partnerships',
    status: 'active',
    skills: ['Deliverable Review', 'Usage Rights Tracking', 'Creator Onboarding'],
    workloadScore: 40,
    currentTask: 'Verifying deliverables submitted by 4 contracted creators',
    completedTasksCount: 33,
    phone: '+91 98210 66321',
    joinedDate: 'Apr 2025'
  },
  {
    id: 'emp-kabir-mehta',
    name: 'Kabir Mehta',
    role: 'Senior Financial & Margin Analyst',
    email: 'kabir.mehta@creationai.studio',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=200&auto=format&fit=crop',
    departmentId: 'dept-ops',
    status: 'active',
    skills: ['Margin Control', 'Cashflow Forecasting', 'Escrow Release Audit', 'Vendor Negotiations'],
    workloadScore: 55,
    currentTask: 'Auditing gear rental line-item markup vs owned asset ROI',
    completedTasksCount: 59,
    phone: '+91 98330 88291',
    joinedDate: 'Jan 2025'
  }
];

export const INITIAL_APPROVALS: ExecutiveApprovalRequest[] = [
  {
    id: 'appr-meta-burst',
    title: 'Increase Daily Meta Ad Spend to $2,500 on Winning Hook #3',
    category: 'BUDGET_SPEND',
    riskTier: 'HIGH',
    departmentId: 'dept-growth',
    departmentName: 'Marketing & Performance Growth',
    requestedByAgentId: 'ketan-growth',
    requestedByAgentName: 'Ketan (Growth AI Director)',
    assignedEmployeeName: 'Dev Patel',
    summary: 'Ketan identified Hook #3 ("Stop buying luxury for status...") is converting at 4.8x ROAS with a 4.2% CTR over the past 48 hours. Dev Patel prepped the ad sets. Ketan recommends uncapping daily spend from $600 to $2,500 to capture trending algorithm momentum.',
    reasoning: 'Live Google Trends data shows a 140% spike in search intent for boutique craftsmanship. We project sustained 3.8x - 4.5x ROAS over the next 5 days. Scaled spend exceeds automated manager limit ($1,000/day).',
    financialImpact: {
      estimatedCost: 12500,
      projectedReturn: '$48,000 - $55,000 revenue',
      budgetVariance: '+$1,900 / day',
      savingsEstimate: '32% lower CAC vs benchmark'
    },
    recommendedAction: 'Approve 5-day budget burst with automatic circuit breaker if ROAS drops below 2.5x.',
    status: 'PENDING',
    createdAt: '25 mins ago'
  },
  {
    id: 'appr-creator-exclusive',
    title: 'Exclusive 3-Month Creator Ambassador Agreement with @AuraVisuals',
    category: 'VENDOR_CONTRACT',
    riskTier: 'CRITICAL',
    departmentId: 'dept-partnerships',
    departmentName: 'Creator Relations & Social PR',
    requestedByAgentId: 'echo-outreach',
    requestedByAgentName: 'Echo (Creator PR AI)',
    assignedEmployeeName: 'Maya Sen',
    summary: 'Echo and Maya negotiated terms with high-retention creator @AuraVisuals (420K followers). Scope: 6 dedicated 4K Reels, full commercial advertising usage rights for 180 days, and DOOH billboard display rights.',
    reasoning: 'Standard agency rate was $14,000. Echo negotiated down to $6,500 + 4% affiliate commission. Exceeds standard single-talent threshold of $5,000, requiring CEO executive sign-off.',
    financialImpact: {
      estimatedCost: 6500,
      projectedReturn: 'Estimated 220,000 - 450,000 high-intent impressions',
      budgetVariance: '$6,500 committed',
      savingsEstimate: '$7,500 saved off initial quote'
    },
    recommendedAction: 'Approve contract and dispatch escrow milestone payments.',
    status: 'PENDING',
    createdAt: '1 hour ago'
  },
  {
    id: 'appr-phantom-rental',
    title: 'Phantom Flex4K High-Speed Camera Rental for Macro Sequence',
    category: 'BUDGET_SPEND',
    riskTier: 'MEDIUM',
    departmentId: 'dept-creative',
    departmentName: 'Cinematic Production & Studio Lab',
    requestedByAgentId: 'nova-director',
    requestedByAgentName: 'Nova (Creative Director AI)',
    assignedEmployeeName: 'Arjun Das',
    summary: 'Arjun Das requested a 1000fps high-speed camera package for liquid droplet macro commercial sequence. Vault and Nova reviewed alternative options.',
    reasoning: 'Vault recommends renting the Phantom for 1 half-day ($1,400) instead of full-day ($2,800), filming all liquid shots in block 1. Production cushion absorbs this without increasing total project quote.',
    financialImpact: {
      estimatedCost: 1400,
      projectedReturn: 'Hero visual assets for international campaign',
      budgetVariance: '+$1,400 line item',
      savingsEstimate: '$1,400 saved via half-day block'
    },
    recommendedAction: 'Approve half-day rental at negotiated $1,400 rate.',
    status: 'PENDING',
    createdAt: '2 hours ago'
  },
  {
    id: 'appr-agency-cut',
    title: 'Replace External Media Agency with Internal AI Workflow',
    category: 'VENDOR_CONTRACT',
    riskTier: 'LOW',
    departmentId: 'dept-ops',
    departmentName: 'Financial Governance & Margin Audit',
    requestedByAgentId: 'vault-ops',
    requestedByAgentName: 'Vault (Margin Optimizer AI)',
    assignedEmployeeName: 'Kabir Mehta',
    summary: 'Terminated external agency $8,000/mo retainer; routed tasks directly to internal team under Ketan & Nova.',
    reasoning: 'Saved $24,000 across the quarter with zero downtime.',
    financialImpact: {
      estimatedCost: 0,
      projectedReturn: '$24,000 net savings retained in treasury',
      savingsEstimate: '$24,000 quarterly savings'
    },
    recommendedAction: 'Approved and archived.',
    status: 'APPROVED',
    createdAt: 'Yesterday',
    decidedAt: 'Yesterday',
    decidedBy: 'CEO (One-Click Approval)'
  }
];

export const INITIAL_TASKS: DepartmentTaskItem[] = [
  {
    id: 'dtask-1',
    departmentId: 'dept-growth',
    title: 'Deploy 3 Meta Ad Variations with Contrast Hook',
    description: 'Hook 1: "Stop buying luxury for status...". Deploy across 18-34 demographic.',
    assignedToEmployeeId: 'emp-dev-patel',
    assignedEmployeeName: 'Dev Patel',
    assignedByAgentId: 'ketan-growth',
    assignedByAgentName: 'Ketan',
    priority: 'high',
    stage: 'in_progress',
    dueDate: 'Today, 5:00 PM',
    aiGuidanceNotes: 'Target CTR threshold is 3.8%. If Cost-per-Click exceeds $0.90 after $100 spend, pause Variant B.',
    createdAt: '2 hours ago',
    updatedAt: '30 mins ago'
  },
  {
    id: 'dtask-2',
    departmentId: 'dept-growth',
    title: 'Draft 5 Google-Grounded Viral TikTok Hooks',
    description: 'Synthesize trending queries around boutique fragrance & craftsmanship.',
    assignedToEmployeeId: 'emp-sarah-lin',
    assignedEmployeeName: 'Sarah Lin',
    assignedByAgentId: 'ketan-growth',
    assignedByAgentName: 'Ketan',
    priority: 'normal',
    stage: 'under_ai_review',
    dueDate: 'Tomorrow, 12:00 PM',
    aiGuidanceNotes: 'Ketan pre-evaluated drafts: Hook #2 scored 94/100 on pattern-interrupt criteria.',
    createdAt: '3 hours ago',
    updatedAt: '15 mins ago'
  },
  {
    id: 'dtask-3',
    departmentId: 'dept-creative',
    title: 'Set Up 3-Point Studio Lighting for Dark Cyc',
    description: '300W Aputure key with parabolic softbox + subtle violet gel rim light.',
    assignedToEmployeeId: 'emp-arjun-das',
    assignedEmployeeName: 'Arjun Das',
    assignedByAgentId: 'nova-director',
    assignedByAgentName: 'Nova',
    priority: 'high',
    stage: 'in_progress',
    dueDate: 'Saturday, 1:00 PM',
    aiGuidanceNotes: 'Ensure 5200K color balance on Nanlite tubes to match DaVinci Kodak 2383 LUT.',
    createdAt: '4 hours ago',
    updatedAt: '1 hour ago'
  },
  {
    id: 'dtask-4',
    departmentId: 'dept-creative',
    title: 'Confirm CineSpace Stage 2 Booking & Call Sheet',
    description: 'Ensure 4-hour slot locked with escrow reservation code.',
    assignedToEmployeeId: 'emp-priya-sharma',
    assignedEmployeeName: 'Priya Sharma',
    assignedByAgentId: 'nova-director',
    assignedByAgentName: 'Nova',
    priority: 'normal',
    stage: 'done',
    dueDate: 'Yesterday',
    aiGuidanceNotes: 'Vault verified ₹8,000 booking fee matches standard discounted tier.',
    createdAt: 'Yesterday',
    updatedAt: 'Yesterday'
  },
  {
    id: 'dtask-5',
    departmentId: 'dept-partnerships',
    title: 'Send Personalized DM Outreach to Top 5 Tech Creators',
    description: 'Pitch exclusive 4K visual campaign using customized Echo messaging template.',
    assignedToEmployeeId: 'emp-maya-sen',
    assignedEmployeeName: 'Maya Sen',
    assignedByAgentId: 'echo-outreach',
    assignedByAgentName: 'Echo',
    priority: 'high',
    stage: 'in_progress',
    dueDate: 'Today, 6:00 PM',
    aiGuidanceNotes: 'Emphasize that all studio and lighting gear is fully covered by our dispatch network.',
    createdAt: '3 hours ago',
    updatedAt: '2 hours ago'
  },
  {
    id: 'dtask-6',
    departmentId: 'dept-ops',
    title: 'Audit Lighting Gear Invoice from CineRental Express',
    description: 'Verify no excess standby day rate was billed for Sunday equipment return.',
    assignedToEmployeeId: 'emp-kabir-mehta',
    assignedEmployeeName: 'Kabir Mehta',
    assignedByAgentId: 'vault-ops',
    assignedByAgentName: 'Vault',
    priority: 'normal',
    stage: 'done',
    dueDate: 'Today, 2:00 PM',
    aiGuidanceNotes: 'Recovered $320 erroneous standby charge.',
    createdAt: '5 hours ago',
    updatedAt: '1 hour ago'
  }
];

export const INITIAL_ACTIVITY_LOGS: ManagerActivityLog[] = [
  {
    id: 'act-1',
    timestamp: '12 mins ago',
    aiManagerId: 'ketan-growth',
    aiManagerName: 'Ketan',
    actionType: 'quality_reviewed',
    description: 'Reviewed Sarah Lin\'s 5 short-form scripts. Validated Hook #2 against Google Search real-time trends.',
    targetEmployeeName: 'Sarah Lin',
    departmentId: 'dept-growth',
    badge: '94% Viral Score'
  },
  {
    id: 'act-2',
    timestamp: '25 mins ago',
    aiManagerId: 'ketan-growth',
    aiManagerName: 'Ketan',
    actionType: 'escalated_to_ceo',
    description: 'Flagged winning 4.8x ROAS on Hook #3. Escalated budget expansion to CEO Executive Approvals queue.',
    targetEmployeeName: 'Dev Patel',
    departmentId: 'dept-growth',
    badge: 'High Risk / High ROI'
  },
  {
    id: 'act-3',
    timestamp: '45 mins ago',
    aiManagerId: 'nova-director',
    aiManagerName: 'Nova',
    actionType: 'task_assigned',
    description: 'Generated technical lighting schematic and assigned dark cyc setup to Arjun Das.',
    targetEmployeeName: 'Arjun Das',
    departmentId: 'dept-creative',
    badge: 'Auto-Delegated'
  },
  {
    id: 'act-4',
    timestamp: '1 hour ago',
    aiManagerId: 'echo-outreach',
    aiManagerName: 'Echo',
    actionType: 'escalated_to_ceo',
    description: 'Finalized contract terms with @AuraVisuals saving $7,500. Escalated ambassador agreement to CEO.',
    targetEmployeeName: 'Maya Sen',
    departmentId: 'dept-partnerships',
    badge: 'Contract Sign-Off'
  },
  {
    id: 'act-5',
    timestamp: '2 hours ago',
    aiManagerId: 'vault-ops',
    aiManagerName: 'Vault',
    actionType: 'approval_executed',
    description: 'Autonomously audited and approved CineRental equipment invoice ($1,850). Margin target preserved at 41.8%.',
    targetEmployeeName: 'Kabir Mehta',
    departmentId: 'dept-ops',
    badge: 'Margin Preserved'
  }
];

export const INITIAL_AGENT_CHAT_HISTORIES: Record<string, Array<{
  role: 'user' | 'agent';
  text: string;
  timestamp?: string;
  sources?: Array<{ title: string; uri: string }>;
}>> = {
  'ketan-growth': [
    {
      role: 'agent',
      text: `⚡ **Ketan online.** Principal Growth & Google Intelligence Strategist.

I manage the **Marketing & Growth Team** (Dev Patel & Sarah Lin) and supervise high-retention ad creative execution.

**My Superpowers:**
- 🔍 **Live Google Search Grounding**: Captures real-time algorithm shifts & competitor campaigns.
- 🎯 **Viral 3-Second Hooks**: Formulates thumb-stop hooks backed by retention metrics.
- 👥 **Team Supervision**: I assign ad sets to Dev and scripts to Sarah, escalating only high-spend budget decisions to you.

What campaign are we optimizing today?`,
      timestamp: 'Just now'
    }
  ],
  'nova-director': [
    {
      role: 'agent',
      text: `🎬 **Nova online.** Creative Director & Cinema Lab Auteur.

I manage the **Cinematic Production & Studio Lab** (Arjun Das & Priya Sharma).

**My Superpowers:**
- 🎥 **Director-Grade Storyboards**: Converts vague brand prompts into shot-by-shot lists.
- 💡 **Technical Schematics**: Specifies 3-point lighting, DaVinci Kodak 2383 LUTs, and camera rigs.
- 📋 **Zero Pre-Production Delays**: I formulate exact call sheets so you don't spend hours on set coordination.

What visual scene or commercial brief should we direct?`,
      timestamp: 'Just now'
    }
  ],
  'echo-outreach': [
    {
      role: 'agent',
      text: `📩 **Echo online.** Creator Relations & Social PR Partner.

I manage the **Creator PR Team** (Maya Sen & Rohan Kapoor).

**My Superpowers:**
- 🤝 **80%+ Reply-Rate DMs**: Ultra-personalized outreach to top creators & sponsors.
- 📜 **Negotiation & Rate Protection**: Cuts agency markups and locks commercial usage rights.
- ⚖️ **Contract Routing**: Prepares talent contracts and routes large agreements to your CEO queue for one-click approval.

Which creators or brand partners are we pitching?`,
      timestamp: 'Just now'
    }
  ],
  'vault-ops': [
    {
      role: 'agent',
      text: `💰 **Vault online.** Financial Governance & Studio Margin Optimizer.

I manage the **Financial Operations Department** (Kabir Mehta).

**My Superpowers:**
- 🛡️ **Margin Guardian**: Enforces a minimum 35% gross operating margin on all productions.
- 🔍 **Gear & Invoice Audit**: Catches hidden vendor rental markups before payment.
- 📊 **Autonomous Escrow Governance**: Approves routine milestone payments and flags deviations to your approval queue.

What production budget or quote would you like me to audit?`,
      timestamp: 'Just now'
    }
  ]
};

// ================= SERVICE IMPLEMENTATION =================
export const teamHubService = {
  // Departments
  getDepartments(): DepartmentTeam[] {
    try {
      const saved = localStorage.getItem(storageKey(STORAGE_KEYS.TEAMS));
      if (saved) {
        const parsed: DepartmentTeam[] = JSON.parse(saved);
        // Ensure backwards compatibility with newly added fields
        return parsed.map(d => ({
          ...d,
          isAiManagerEnabled: d.isAiManagerEnabled ?? true,
          assignedBotId: d.assignedBotId ?? d.aiManagerId
        }));
      }
    } catch (e) {
      console.warn('Failed to parse saved departments:', e);
    }
    return INITIAL_DEPARTMENTS;
  },

  saveDepartments(departments: DepartmentTeam[]) {
    localStorage.setItem(storageKey(STORAGE_KEYS.TEAMS), JSON.stringify(departments));
  },

  updateDepartment(departmentId: string, updates: Partial<DepartmentTeam>): DepartmentTeam[] {
    const list = this.getDepartments();
    const updated = list.map(d => d.id === departmentId ? { ...d, ...updates } : d);
    this.saveDepartments(updated);
    return updated;
  },

  toggleDepartmentBot(departmentId: string, enabled: boolean): DepartmentTeam[] {
    const list = this.getDepartments();
    const target = list.find(d => d.id === departmentId);
    const updated = list.map(d => {
      if (d.id === departmentId) {
        return {
          ...d,
          isAiManagerEnabled: enabled
        };
      }
      return d;
    });
    this.saveDepartments(updated);

    if (target) {
      const manager = AI_AGENTS_LIST.find(a => a.id === target.aiManagerId) || AI_AGENTS_LIST[0];
      this.addActivityLog({
        aiManagerId: target.aiManagerId,
        aiManagerName: manager.name,
        actionType: enabled ? 'workload_balanced' : 'quality_reviewed',
        description: enabled
          ? `AI Bot Manager (${manager.name}) toggled ON for ${target.name}. Supervised task delegation & autonomous audits resumed.`
          : `AI Bot Manager supervision toggled OFF for ${target.name}. Switched to Human-Led Mode (No autonomous AI actions).`,
        departmentId: target.id,
        badge: enabled ? 'AI Supervised' : 'Human-Led Mode'
      });
    }

    return updated;
  },

  assignDepartmentBot(departmentId: string, botId: AIAgentId | null): DepartmentTeam[] {
    const list = this.getDepartments();
    const target = list.find(d => d.id === departmentId);
    const updated = list.map(d => {
      if (d.id === departmentId) {
        if (!botId) {
          // Unassigned / Human-Led
          return {
            ...d,
            isAiManagerEnabled: false,
            assignedBotId: null
          };
        }
        return {
          ...d,
          aiManagerId: botId,
          assignedBotId: botId,
          isAiManagerEnabled: true
        };
      }
      return d;
    });
    this.saveDepartments(updated);

    if (target) {
      if (botId) {
        const newBot = AI_AGENTS_LIST.find(a => a.id === botId);
        this.addActivityLog({
          aiManagerId: botId,
          aiManagerName: newBot?.name || 'AI Manager',
          actionType: 'workload_balanced',
          description: `${newBot?.name} assigned as Supervising AI Director for ${target.name}. Bot supervision active.`,
          departmentId: target.id,
          badge: 'Bot Assigned'
        });
      } else {
        this.addActivityLog({
          aiManagerId: target.aiManagerId,
          aiManagerName: 'System',
          actionType: 'quality_reviewed',
          description: `AI Bot Manager unassigned from ${target.name}. Department is now operating in pure Human-Led Mode.`,
          departmentId: target.id,
          badge: 'Pure Human-Led'
        });
      }
    }

    return updated;
  },

  // Employees
  getEmployees(): Employee[] {
    try {
      const saved = localStorage.getItem(storageKey(STORAGE_KEYS.EMPLOYEES));
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved employees:', e);
    }
    return INITIAL_EMPLOYEES;
  },

  saveEmployees(employees: Employee[]) {
    localStorage.setItem(storageKey(STORAGE_KEYS.EMPLOYEES), JSON.stringify(employees));
  },

  addEmployee(empData: Omit<Employee, 'id' | 'completedTasksCount'>): Employee {
    const employees = this.getEmployees();
    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}`,
      completedTasksCount: 0,
      joinedDate: 'Just now'
    };
    const updated = [newEmp, ...employees];
    this.saveEmployees(updated);

    // Also link to department
    const depts = this.getDepartments();
    const targetDept = depts.find(d => d.id === newEmp.departmentId);
    if (targetDept && !targetDept.members.includes(newEmp.id)) {
      targetDept.members.push(newEmp.id);
      this.saveDepartments(depts);
    }

    // Log manager onboarding activity
    const aiManager = AI_AGENTS_LIST.find(a => a.id === targetDept?.aiManagerId) || AI_AGENTS_LIST[0];
    this.addActivityLog({
      aiManagerId: aiManager.id,
      aiManagerName: aiManager.name,
      actionType: 'task_assigned',
      description: `${aiManager.name} onboarded ${newEmp.name} (${newEmp.role}) to ${targetDept?.name || 'Department'}. Workload initialized.`,
      targetEmployeeName: newEmp.name,
      departmentId: newEmp.departmentId,
      badge: 'Team Member Added'
    });

    return newEmp;
  },

  updateEmployee(employeeId: string, updates: Partial<Employee>): Employee[] {
    const employees = this.getEmployees();
    const updated = employees.map(e => e.id === employeeId ? { ...e, ...updates } : e);
    this.saveEmployees(updated);
    return updated;
  },

  removeEmployee(employeeId: string): Employee[] {
    const employees = this.getEmployees().filter(e => e.id !== employeeId);
    this.saveEmployees(employees);

    // Remove from department
    const depts = this.getDepartments();
    depts.forEach(d => {
      d.members = d.members.filter(id => id !== employeeId);
    });
    this.saveDepartments(depts);

    return employees;
  },

  // Approvals
  getApprovals(): ExecutiveApprovalRequest[] {
    try {
      const saved = localStorage.getItem(storageKey(STORAGE_KEYS.APPROVALS));
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved approvals:', e);
    }
    return INITIAL_APPROVALS;
  },

  saveApprovals(approvals: ExecutiveApprovalRequest[]) {
    localStorage.setItem(storageKey(STORAGE_KEYS.APPROVALS), JSON.stringify(approvals));
  },

  decideApproval(
    approvalId: string, 
    status: ApprovalStatus, 
    notes?: string, 
    decidedBy = 'CEO'
  ): ExecutiveApprovalRequest[] {
    const list = this.getApprovals();
    const target = list.find(a => a.id === approvalId);
    const updated = list.map(a => {
      if (a.id === approvalId) {
        return {
          ...a,
          status,
          decisionNotes: notes || a.decisionNotes,
          decidedAt: 'Just now',
          decidedBy
        };
      }
      return a;
    });
    this.saveApprovals(updated);

    if (target) {
      // Record activity log
      this.addActivityLog({
        aiManagerId: target.requestedByAgentId,
        aiManagerName: target.requestedByAgentName,
        actionType: 'approval_executed',
        description: `CEO ${status.toLowerCase()} permission for "${target.title}". AI Manager notified to execute next phase.`,
        targetEmployeeName: target.assignedEmployeeName,
        departmentId: target.departmentId,
        badge: status === 'APPROVED' ? 'CEO Approved' : 'Decision Logged'
      });
    }

    return updated;
  },

  createApprovalRequest(data: Omit<ExecutiveApprovalRequest, 'id' | 'createdAt' | 'status'>): ExecutiveApprovalRequest {
    const list = this.getApprovals();
    const newReq: ExecutiveApprovalRequest = {
      ...data,
      id: `appr-${Date.now()}`,
      status: 'PENDING',
      createdAt: 'Just now'
    };
    const updated = [newReq, ...list];
    this.saveApprovals(updated);

    // Activity log
    this.addActivityLog({
      aiManagerId: newReq.requestedByAgentId,
      aiManagerName: newReq.requestedByAgentName,
      actionType: 'escalated_to_ceo',
      description: `${newReq.requestedByAgentName} escalated high-stakes decision: "${newReq.title}" to CEO Approval Queue.`,
      targetEmployeeName: newReq.assignedEmployeeName,
      departmentId: newReq.departmentId,
      badge: `${newReq.riskTier} Risk`
    });

    return newReq;
  },

  // Department Tasks
  getDepartmentTasks(): DepartmentTaskItem[] {
    try {
      const saved = localStorage.getItem(storageKey(STORAGE_KEYS.TASKS));
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse department tasks:', e);
    }
    return INITIAL_TASKS;
  },

  saveDepartmentTasks(tasks: DepartmentTaskItem[]) {
    localStorage.setItem(storageKey(STORAGE_KEYS.TASKS), JSON.stringify(tasks));
  },

  updateTaskStage(taskId: string, stage: DepartmentTaskItem['stage']): DepartmentTaskItem[] {
    const list = this.getDepartmentTasks();
    const target = list.find(t => t.id === taskId);
    const updated = list.map(t => t.id === taskId ? { ...t, stage, updatedAt: 'Just now' } : t);
    this.saveDepartmentTasks(updated);

    if (target) {
      this.addActivityLog({
        aiManagerId: target.assignedByAgentId,
        aiManagerName: target.assignedByAgentName,
        actionType: 'quality_reviewed',
        description: `Task "${target.title}" moved to ${stage.replace('_', ' ').toUpperCase()} under supervisor ${target.assignedByAgentName}.`,
        targetEmployeeName: target.assignedEmployeeName,
        departmentId: target.departmentId,
        badge: stage.toUpperCase()
      });
    }

    return updated;
  },

  addDepartmentTask(task: Omit<DepartmentTaskItem, 'id' | 'createdAt' | 'updatedAt'>): DepartmentTaskItem {
    const list = this.getDepartmentTasks();
    const newTask: DepartmentTaskItem = {
      ...task,
      id: `dtask-${Date.now()}`,
      createdAt: 'Just now',
      updatedAt: 'Just now'
    };
    const updated = [newTask, ...list];
    this.saveDepartmentTasks(updated);

    this.addActivityLog({
      aiManagerId: newTask.assignedByAgentId,
      aiManagerName: newTask.assignedByAgentName,
      actionType: 'task_assigned',
      description: `${newTask.assignedByAgentName} assigned "${newTask.title}" to ${newTask.assignedEmployeeName}.`,
      targetEmployeeName: newTask.assignedEmployeeName,
      departmentId: newTask.departmentId,
      badge: 'New Assignment'
    });

    return newTask;
  },

  // Activity Logs
  getActivityLogs(): ManagerActivityLog[] {
    try {
      const saved = localStorage.getItem(storageKey(STORAGE_KEYS.ACTIVITY));
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse activity logs:', e);
    }
    return INITIAL_ACTIVITY_LOGS;
  },

  saveActivityLogs(logs: ManagerActivityLog[]) {
    localStorage.setItem(storageKey(STORAGE_KEYS.ACTIVITY), JSON.stringify(logs.slice(0, 50)));
  },

  addActivityLog(log: Omit<ManagerActivityLog, 'id' | 'timestamp'>) {
    const logs = this.getActivityLogs();
    const newLog: ManagerActivityLog = {
      ...log,
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: 'Just now'
    };
    const updated = [newLog, ...logs];
    this.saveActivityLogs(updated);
    return updated;
  },

  // Isolated Chat Histories
  getAgentChatHistories(): Record<string, Array<{ role: 'user' | 'agent'; text: string; timestamp?: string; sources?: Array<{ title: string; uri: string }> }>> {
    try {
      const saved = localStorage.getItem(storageKey(STORAGE_KEYS.AGENT_CHATS));
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all default agents exist
        return {
          ...INITIAL_AGENT_CHAT_HISTORIES,
          ...parsed
        };
      }
    } catch (e) {
      console.warn('Failed to parse agent chats:', e);
    }
    return INITIAL_AGENT_CHAT_HISTORIES;
  },

  saveAgentChatHistories(histories: Record<string, Array<any>>) {
    localStorage.setItem(storageKey(STORAGE_KEYS.AGENT_CHATS), JSON.stringify(histories));
  },

  getMessagesForAgent(agentId: string) {
    const histories = this.getAgentChatHistories();
    return histories[agentId] || (INITIAL_AGENT_CHAT_HISTORIES[agentId] || []);
  },

  appendAgentMessage(agentId: string, message: { role: 'user' | 'agent'; text: string; timestamp?: string; sources?: Array<{ title: string; uri: string }> }) {
    const histories = this.getAgentChatHistories();
    const currentList = histories[agentId] || (INITIAL_AGENT_CHAT_HISTORIES[agentId] || []);
    const updatedList = [...currentList, message];
    histories[agentId] = updatedList;
    this.saveAgentChatHistories(histories);
    return updatedList;
  },

  clearAgentHistory(agentId: string) {
    const histories = this.getAgentChatHistories();
    histories[agentId] = INITIAL_AGENT_CHAT_HISTORIES[agentId] || [];
    this.saveAgentChatHistories(histories);
    return histories[agentId];
  },

  // Autonomous Managerial Check-in Routine
  runManagerialSync(): {
    newLogs: ManagerActivityLog[];
    updatedTasks: DepartmentTaskItem[];
    updatedEmployees: Employee[];
    summary: string;
  } {
    const tasks = this.getDepartmentTasks();
    const employees = this.getEmployees();
    
    // Progress one in_progress task to under_ai_review or done
    let modified = false;
    const updatedTasks = tasks.map((t, idx) => {
      if (!modified && t.stage === 'in_progress') {
        modified = true;
        return {
          ...t,
          stage: 'under_ai_review' as const,
          updatedAt: 'Just now',
          aiGuidanceNotes: `${t.assignedByAgentName} ran autonomous QA audit on deliverables: 95% pass rate.`
        };
      }
      return t;
    });

    this.saveDepartmentTasks(updatedTasks);

    // Rebalance workload
    const updatedEmployees = employees.map(emp => {
      const activeCount = updatedTasks.filter(t => t.assignedToEmployeeId === emp.id && t.stage !== 'done').length;
      const calculatedScore = Math.min(95, Math.max(30, activeCount * 25 + Math.floor(Math.random() * 15)));
      return {
        ...emp,
        workloadScore: calculatedScore
      };
    });
    this.saveEmployees(updatedEmployees);

    // Create fresh activity logs from Ketan, Nova, Echo, and Vault
    this.addActivityLog({
      aiManagerId: 'ketan-growth',
      aiManagerName: 'Ketan',
      actionType: 'workload_balanced',
      description: 'Synchronized live Google Trends. Re-balanced ad creative tasks between Dev Patel and Sarah Lin.',
      departmentId: 'dept-growth',
      badge: 'Auto-Sync'
    });

    this.addActivityLog({
      aiManagerId: 'vault-ops',
      aiManagerName: 'Vault',
      actionType: 'quality_reviewed',
      description: 'Audited active shoot invoices and escrow reserves. Gross margins remain healthy at 41.8%.',
      departmentId: 'dept-ops',
      badge: 'Margin Healthy'
    });

    return {
      newLogs: this.getActivityLogs(),
      updatedTasks,
      updatedEmployees,
      summary: 'Autonomous AI sync complete: Task pipeline reviewed, workload balanced, and margins audited.'
    };
  },

  // CEO Executive Briefing Generator
  generateExecutiveBriefing(): ExecutiveBriefing {
    const approvals = this.getApprovals();
    const pendingCount = approvals.filter(a => a.status === 'PENDING').length;
    const depts = this.getDepartments();
    const employees = this.getEmployees();

    const briefing: ExecutiveBriefing = {
      id: `brief-${Date.now()}`,
      generatedAt: new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      title: 'Executive CEO Briefing & Autonomous Operations Report',
      executiveSummary: `Your autonomous AI managers (Ketan, Nova, Echo & Vault) have saved an estimated 38.5 hours of executive time this week. 18 routine tasks and $19,500 in operations were managed autonomously. ${pendingCount} high-impact decisions currently require your executive sign-off.`,
      timeSavedForCeoHours: 38.5,
      decisionsResolvedAutonomously: 24,
      pendingApprovalsCount: pendingCount,
      departmentSnapshots: [
        {
          departmentName: 'Marketing & Performance Growth',
          managerName: 'Ketan',
          status: 'optimal',
          highlight: 'Hook #3 achieved 4.8x ROAS. Dev & Sarah have 7 new ad variations queued for weekend distribution.'
        },
        {
          departmentName: 'Cinematic Production & Studio Lab',
          managerName: 'Nova',
          status: 'optimal',
          highlight: 'CineSpace Stage 2 booked with 4K camera package calibrated. Commercial turnaround pacing 25% faster than benchmark.'
        },
        {
          departmentName: 'Creator Relations & Social PR',
          managerName: 'Echo',
          status: pendingCount > 0 ? 'attention_needed' : 'optimal',
          highlight: 'Exclusive ambassador contract with @AuraVisuals negotiated at $7,500 discount, waiting on CEO one-click approval.'
        },
        {
          departmentName: 'Financial Governance & Margin Audit',
          managerName: 'Vault',
          status: 'optimal',
          highlight: 'Eliminated agency retainer overhead. Maintained studio operating gross margin at 41.8% (target 35%).'
        }
      ],
      strategicRecommendations: [
        'One-click approve the 5-day Meta budget burst to lock in trending Google Search traffic volume.',
        'Review the @AuraVisuals contract before Friday 5:00 PM to secure exclusive commercial rights.',
        'Consider adding a Junior Motion Designer to Creative Lab to reduce Arjun\'s workload from 85% to 60%.'
      ]
    };

    return briefing;
  }
};
