import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Zap, 
  TrendingUp, 
  Film, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Play, 
  RefreshCw, 
  Plus, 
  ChevronRight, 
  MessageSquare,
  Sliders,
  DollarSign,
  Activity,
  Layers,
  FileText,
  AlertTriangle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AIAgentId, 
  BrandProfile, 
  DepartmentTeam, 
  Employee, 
  ExecutiveApprovalRequest, 
  DepartmentTaskItem, 
  ManagerActivityLog, 
  ExecutiveBriefing,
  ApprovalStatus
} from '../../types';
import { agentService, AI_AGENTS_LIST } from '../../services/agentService';
import { useAuth } from '../../context/AuthContext';
import { backgroundTaskService } from '../../services/backgroundTaskService';
import { teamHubService } from '../../services/teamHubService';

// Subcomponents
import ApprovalsQueue from './ApprovalsQueue';
import DepartmentTeamsRoster from './DepartmentTeamsRoster';
import DepartmentTaskBoard from './DepartmentTaskBoard';
import ExecutiveBriefingView from './ExecutiveBriefingView';
import IsolatedAgentChat from './IsolatedAgentChat';
import GoalCoordinatorView from './GoalCoordinatorView';

interface AITeamHubProps {
  brandProfile: BrandProfile;
  initialAgentId?: AIAgentId;
  initialSubTab?: 'coordinator' | 'board' | 'teams' | 'approvals' | 'briefing' | 'direct';
  onNavigateToStudio?: (tab?: string, prompt?: string) => void;
  onNavigateToChat?: (prompt?: string) => void;
}

export default function AITeamHub({
  brandProfile,
  initialAgentId = 'ketan-growth',
  initialSubTab = 'coordinator',
  onNavigateToStudio,
  onNavigateToChat
}: AITeamHubProps) {
  const { user } = useAuth();

  // Active Hub Tab (Defaults to Goal Coordinator & Employee Delegator)
  const [activeTab, setActiveTab] = useState<'coordinator' | 'board' | 'teams' | 'approvals' | 'briefing' | 'direct'>(initialSubTab);
  
  // Selected Bot for 1-on-1 direct channel
  const [selectedAgentId, setSelectedAgentId] = useState<AIAgentId>(initialAgentId);

  // Department & Hybrid Team State
  const [departments, setDepartments] = useState<DepartmentTeam[]>(() => teamHubService.getDepartments());
  const [employees, setEmployees] = useState<Employee[]>(() => teamHubService.getEmployees());

  // CEO Executive Approvals Queue State
  const [approvals, setApprovals] = useState<ExecutiveApprovalRequest[]>(() => teamHubService.getApprovals());

  // Operations Board & Live Activity Logs State
  const [departmentTasks, setDepartmentTasks] = useState<DepartmentTaskItem[]>(() => teamHubService.getDepartmentTasks());
  const [activityLogs, setActivityLogs] = useState<ManagerActivityLog[]>(() => teamHubService.getActivityLogs());

  // Executive Briefing State
  const [briefing, setBriefing] = useState<ExecutiveBriefing>(() => teamHubService.generateExecutiveBriefing());

  // 1-on-1 Isolated Chat Histories State
  const [agentChatHistories, setAgentChatHistories] = useState<Record<string, Array<any>>>(() => 
    teamHubService.getAgentChatHistories()
  );
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isSyncingOps, setIsSyncingOps] = useState(false);

  // Background Tasks running across tabs
  const [bgTasks, setBgTasks] = useState<any[]>(() => backgroundTaskService.getAgentTasks());

  // Count of pending executive approvals
  const pendingApprovalsCount = approvals.filter(a => a.status === 'PENDING').length;

  // Sync background tasks from global service and auto-clean any stale tasks older than 60s
  useEffect(() => {
    // Purge or complete any lingering tasks from previous sessions
    const all = backgroundTaskService.getAllTasks();
    const now = Date.now();
    all.forEach(t => {
      const created = t.createdAt ? new Date(t.createdAt).getTime() : 0;
      if (t.status === 'RUNNING' && (now - created > 60000 || !created)) {
        backgroundTaskService.updateTask(t.id, { 
          status: 'COMPLETED', 
          progress: 100, 
          completedAt: new Date().toISOString() 
        });
      }
    });

    const unsubscribe = backgroundTaskService.subscribe((allTasks) => {
      const agentBg = allTasks.filter(b => b.type === 'agent_delegation' && b.status === 'RUNNING');
      setBgTasks(agentBg);
    });
    return unsubscribe;
  }, []);

  // 1. Handle Isolated Direct Message
  const handleSendIsolatedMessage = async (
    agentId: AIAgentId, 
    text: string, 
    useGoogleGrounding: boolean
  ) => {
    setIsSendingMessage(true);

    const userEntry = {
      role: 'user' as const,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update isolated history for this agent only
    const updatedWithUser = teamHubService.appendAgentMessage(agentId, userEntry);
    setAgentChatHistories(prev => ({
      ...prev,
      [agentId]: updatedWithUser
    }));

    try {
      if ((agentId === 'ketan-growth' || agentId === 'grok-marketing') && useGoogleGrounding) {
        const groundedRes = await agentService.callKetanWithSearchGrounding(text, brandProfile);
        const agentEntry = {
          role: 'agent' as const,
          text: groundedRes.reply,
          sources: groundedRes.sources,
          timestamp: groundedRes.timestamp
        };
        const updatedWithAgent = teamHubService.appendAgentMessage(agentId, agentEntry);
        setAgentChatHistories(prev => ({
          ...prev,
          [agentId]: updatedWithAgent
        }));
      } else {
        const historyPayload = (agentChatHistories[agentId] || []).map(m => ({ role: m.role, text: m.text }));
        const response = await agentService.sendMessage(agentId, text, historyPayload, brandProfile);
        const agentEntry = {
          role: 'agent' as const,
          text: response.reply,
          timestamp: response.timestamp
        };
        const updatedWithAgent = teamHubService.appendAgentMessage(agentId, agentEntry);
        setAgentChatHistories(prev => ({
          ...prev,
          [agentId]: updatedWithAgent
        }));
      }
    } catch (err: any) {
      const agentObj = AI_AGENTS_LIST.find(a => a.id === agentId) || AI_AGENTS_LIST[0];
      const errorEntry = {
        role: 'agent' as const,
        text: `[${agentObj.name}] I have logged your request. Let me re-calculate with updated parameters.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const updatedWithError = teamHubService.appendAgentMessage(agentId, errorEntry);
      setAgentChatHistories(prev => ({
        ...prev,
        [agentId]: updatedWithError
      }));
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleClearHistory = (agentId: AIAgentId) => {
    const cleared = teamHubService.clearAgentHistory(agentId);
    setAgentChatHistories(prev => ({
      ...prev,
      [agentId]: cleared
    }));
  };

  // 2. Handle CEO Approval Decisions
  const handleDecideApproval = (id: string, status: ApprovalStatus, notes?: string) => {
    const updated = teamHubService.decideApproval(id, status, notes, 'CEO');
    setApprovals(updated);
    setActivityLogs(teamHubService.getActivityLogs());
    setBriefing(teamHubService.generateExecutiveBriefing());
  };

  // 3. Simulate High-Stakes AI Escalation to CEO
  const handleSimulateEscalation = () => {
    const scenarios = [
      {
        title: 'Emergency Studio Re-Booking for 4K Anamorphic Reshoot',
        category: 'BUDGET_SPEND' as const,
        riskTier: 'CRITICAL' as const,
        departmentId: 'dept-creative',
        departmentName: 'Cinematic Production & Studio Lab',
        requestedByAgentId: 'nova-director' as AIAgentId,
        requestedByAgentName: 'Nova (Creative Director AI)',
        assignedEmployeeName: 'Arjun Das',
        summary: 'Lighting sync anomaly occurred on scene 4 of the commercial. Nova identified that 3 additional studio hours ($2,200) are needed on Sunday to avoid missing the Tuesday broadcast release date.',
        reasoning: 'Escrow buffer can cover $1,200. Requires $1,000 executive override. Nova recommends re-booking Stage 2 immediately before competitor production holds it.',
        financialImpact: {
          estimatedCost: 2200,
          projectedReturn: 'Guaranteed on-time national delivery',
          budgetVariance: '+$1,000 override',
          savingsEstimate: 'Avoids $15,000 missed-launch penalty'
        },
        recommendedAction: 'Approve $1,000 budget override and lock Sunday 2:00 PM slot.'
      },
      {
        title: 'Influencer Co-Ownership Royalty Clause Sign-Off',
        category: 'LEGAL_RIGHTS' as const,
        riskTier: 'HIGH' as const,
        departmentId: 'dept-partnerships',
        departmentName: 'Creator Relations & Social PR',
        requestedByAgentId: 'echo-outreach' as AIAgentId,
        requestedByAgentName: 'Echo (Creator PR AI)',
        assignedEmployeeName: 'Maya Sen',
        summary: 'Top fitness creator with 850K reach requests a 5% affiliate revenue share in exchange for a 6-month exclusive brand ambassador lock.',
        reasoning: 'Standard flat fee would be $20,000. Echo negotiated zero upfront fee in exchange for the 5% tier. Exceeds standard commission cap (3%), requiring CEO approval.',
        financialImpact: {
          estimatedCost: 0,
          projectedReturn: '$75,000 projected GMV from creator audience',
          savingsEstimate: '$20,000 upfront cash saved'
        },
        recommendedAction: 'Approve 5% tier with a 180-day performance review trigger.'
      }
    ];

    const pick = scenarios[Math.floor(Math.random() * scenarios.length)];
    teamHubService.createApprovalRequest(pick);
    setApprovals(teamHubService.getApprovals());
    setActivityLogs(teamHubService.getActivityLogs());
    setBriefing(teamHubService.generateExecutiveBriefing());
  };

  // 4. Handle Employee Roster CRUD
  const handleAddEmployee = (empData: Omit<Employee, 'id' | 'completedTasksCount'>) => {
    teamHubService.addEmployee(empData);
    setEmployees(teamHubService.getEmployees());
    setDepartments(teamHubService.getDepartments());
    setActivityLogs(teamHubService.getActivityLogs());
  };

  const handleRemoveEmployee = (id: string) => {
    const updated = teamHubService.removeEmployee(id);
    setEmployees(updated);
    setDepartments(teamHubService.getDepartments());
  };

  const handleUpdateDepartmentManager = (deptId: string, managerId: AIAgentId) => {
    const updated = teamHubService.updateDepartment(deptId, { aiManagerId: managerId, assignedBotId: managerId, isAiManagerEnabled: true });
    setDepartments(updated);
    const agent = AI_AGENTS_LIST.find(a => a.id === managerId);
    teamHubService.addActivityLog({
      aiManagerId: managerId,
      aiManagerName: agent?.name || 'AI Manager',
      actionType: 'workload_balanced',
      description: `${agent?.name} assigned as Supervising AI Director for department.`,
      departmentId: deptId,
      badge: 'Manager Reassigned'
    });
    setActivityLogs(teamHubService.getActivityLogs());
  };

  const handleToggleDepartmentBot = (deptId: string, enabled: boolean) => {
    const updated = teamHubService.toggleDepartmentBot(deptId, enabled);
    setDepartments(updated);
    setActivityLogs(teamHubService.getActivityLogs());
  };

  const handleAssignDepartmentBot = (deptId: string, botId: AIAgentId | null) => {
    const updated = teamHubService.assignDepartmentBot(deptId, botId);
    setDepartments(updated);
    setActivityLogs(teamHubService.getActivityLogs());
  };

  // 5. Operations Board CRUD & Sync
  const handleUpdateTaskStage = (taskId: string, stage: DepartmentTaskItem['stage']) => {
    const updated = teamHubService.updateTaskStage(taskId, stage);
    setDepartmentTasks(updated);
    setActivityLogs(teamHubService.getActivityLogs());
  };

  const handleAddTask = (taskData: Omit<DepartmentTaskItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    teamHubService.addDepartmentTask(taskData);
    setDepartmentTasks(teamHubService.getDepartmentTasks());
    setActivityLogs(teamHubService.getActivityLogs());
  };

  const handleRunManagerialSync = async () => {
    setIsSyncingOps(true);
    await new Promise(r => setTimeout(r, 700));
    const result = teamHubService.runManagerialSync();
    setDepartmentTasks(result.updatedTasks);
    setEmployees(result.updatedEmployees);
    setActivityLogs(result.newLogs);
    setBriefing(teamHubService.generateExecutiveBriefing());
    setIsSyncingOps(false);
  };

  const handleCommitTasksToBoard = (newTasks: any[]) => {
    const formattedTasks: DepartmentTaskItem[] = newTasks.map((t, idx) => ({
      id: `task-coord-${Date.now()}-${idx}`,
      departmentId: 'dept-creative',
      title: t.title,
      description: t.description,
      assignedToEmployeeId: t.assignedTo,
      assignedEmployeeName: t.assignedName,
      assignedByAgentId: 'nova-director' as AIAgentId,
      assignedByAgentName: 'Nova (Lead AI Manager)',
      priority: 'high',
      stage: 'in_progress',
      dueDate: t.deadline || 'This week',
      deliverableLink: t.deliverablePreview,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    formattedTasks.forEach(task => teamHubService.addDepartmentTask(task));
    setDepartmentTasks(teamHubService.getDepartmentTasks());
    setActivityLogs(teamHubService.getActivityLogs());
    setActiveTab('board');
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto px-3 sm:px-4 py-3">
      {/* Primary Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/5 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="p-1.5 rounded-lg bg-sleek-violet/20 text-sleek-violet">
              <Bot size={18} />
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Autonomous AI Team Hub
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sleek-violet/20 border border-sleek-violet/30 text-sleek-violet font-mono uppercase">
                Google AI Powered
              </span>
            </h1>
          </div>
          <p className="text-xs text-white/50">
            Real human employees managed autonomously by Google AI agents. Describe any campaign goal, and your AI manager coordinates tasks and monitors completion.
          </p>
        </div>

        {/* Global Hub Navigation Bar */}
        <div className="flex items-center bg-sleek-zinc rounded-xl p-1 border border-white/10 shrink-0 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('coordinator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'coordinator'
                ? 'bg-sleek-violet text-white shadow-xs'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>AI Manager</span>
          </button>

          <button
            onClick={() => setActiveTab('teams')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'teams'
                ? 'bg-sleek-violet text-white shadow-xs'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>Departments & Crew</span>
          </button>

          <button
            onClick={() => setActiveTab('direct')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'direct'
                ? 'bg-sleek-violet text-white shadow-xs'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Bot size={14} className="text-violet-400" />
            <span>Private CXO Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('board')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'board'
                ? 'bg-sleek-violet text-white shadow-xs'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Activity size={14} />
            <span>Operations Board</span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'approvals'
                ? 'bg-sleek-violet text-white shadow-xs'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <ShieldAlert size={14} />
            <span>CEO Approvals</span>
            {pendingApprovalsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-black text-[10px] font-bold flex items-center justify-center">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('briefing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'briefing'
                ? 'bg-sleek-violet text-white shadow-xs'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <FileText size={14} />
            <span>CEO Briefing</span>
          </button>
        </div>
      </div>

      {/* Persistent Background Execution Banner (Only active for current live missions < 60s) */}
      {bgTasks.filter(b => b.status === 'RUNNING' && (Date.now() - (new Date(b.createdAt || 0).getTime() || 0) < 60000)).length > 0 && (
        <div className="my-2.5 p-3 rounded-xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-black/60 border border-purple-500/30 flex items-center justify-between gap-3 animate-fadeIn shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1 rounded-lg bg-purple-500/20 text-purple-300 shrink-0">
              <RefreshCw size={13} className="animate-spin" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">
                  Autonomous Background Missions Active
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono shrink-0">
                  WARM & PERSISTENT
                </span>
              </div>
              <p className="text-[11px] text-white/60 truncate">
                {bgTasks.find(b => b.status === 'RUNNING')?.title || 'Executing marketing task in background...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                backgroundTaskService.clearAllTasks();
                setBgTasks([]);
              }}
              className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-[10px] font-medium transition-colors"
            >
              Stop & Dismiss
            </button>
            <button
              onClick={() => {
                backgroundTaskService.clearAllTasks();
                setBgTasks([]);
              }}
              className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              title="Dismiss & Clear Background Missions"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Main Tab Views Container */}
      <div className="flex-1 overflow-y-auto mt-2 pb-6 pr-0.5 hide-scrollbar">
        {activeTab === 'coordinator' && (
          <GoalCoordinatorView
            brandProfile={brandProfile}
            workspaceEmployees={employees}
            onNavigateToStudio={onNavigateToStudio}
            onCommitTasksToBoard={handleCommitTasksToBoard}
          />
        )}

        {activeTab === 'approvals' && (
          <ApprovalsQueue
            approvals={approvals}
            onDecide={handleDecideApproval}
            onSimulateEscalation={handleSimulateEscalation}
          />
        )}

        {activeTab === 'teams' && (
          <DepartmentTeamsRoster
            departments={departments}
            employees={employees}
            onAddEmployee={handleAddEmployee}
            onRemoveEmployee={handleRemoveEmployee}
            onUpdateDepartmentManager={handleUpdateDepartmentManager}
            onToggleDepartmentBot={handleToggleDepartmentBot}
            onAssignDepartmentBot={handleAssignDepartmentBot}
            agentChatHistories={agentChatHistories}
            onSendMessage={handleSendIsolatedMessage}
            onClearHistory={handleClearHistory}
            isSendingMessage={isSendingMessage}
            brandProfile={brandProfile}
          />
        )}

        {activeTab === 'board' && (
          <DepartmentTaskBoard
            tasks={departmentTasks}
            activityLogs={activityLogs}
            departments={departments}
            employees={employees}
            onUpdateTaskStage={handleUpdateTaskStage}
            onAddTask={handleAddTask}
            onRunManagerialSync={handleRunManagerialSync}
            isSyncing={isSyncingOps}
          />
        )}

        {activeTab === 'briefing' && (
          <ExecutiveBriefingView
            briefing={briefing}
            onRefreshBriefing={() => setBriefing(teamHubService.generateExecutiveBriefing())}
            onNavigateToApprovals={() => setActiveTab('approvals')}
          />
        )}

        {activeTab === 'direct' && (
          <IsolatedAgentChat
            selectedAgentId={selectedAgentId}
            onSelectAgentId={setSelectedAgentId}
            chatHistories={agentChatHistories}
            onSendMessage={handleSendIsolatedMessage}
            onClearHistory={handleClearHistory}
            isSending={isSendingMessage}
            brandProfile={brandProfile}
          />
        )}
      </div>
    </div>
  );
}
