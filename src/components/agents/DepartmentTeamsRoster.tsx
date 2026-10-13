import React, { useState } from 'react';
import { 
  Users, 
  Bot, 
  Plus, 
  DollarSign, 
  TrendingUp, 
  Film, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Activity, 
  ChevronRight, 
  Briefcase, 
  Mail, 
  Phone, 
  Award, 
  Trash2, 
  Edit3, 
  ExternalLink,
  Target,
  BarChart3,
  Layers,
  Sparkles,
  MessageSquare,
  X
} from 'lucide-react';
import { DepartmentTeam, Employee, AIAgentId, BrandProfile } from '../../types';
import { AI_AGENTS_LIST } from '../../services/agentService';
import IsolatedAgentChat from './IsolatedAgentChat';

interface DepartmentTeamsRosterProps {
  departments: DepartmentTeam[];
  employees: Employee[];
  onAddEmployee: (emp: Omit<Employee, 'id' | 'completedTasksCount'>) => void;
  onRemoveEmployee: (id: string) => void;
  onUpdateDepartmentManager: (deptId: string, managerId: AIAgentId) => void;
  onToggleDepartmentBot?: (deptId: string, enabled: boolean) => void;
  onAssignDepartmentBot?: (deptId: string, botId: AIAgentId | null) => void;
  onSelectAgentForChat?: (agentId: AIAgentId) => void;
  // Private CXO Chat props
  agentChatHistories?: Record<string, Array<any>>;
  onSendMessage?: (agentId: AIAgentId, text: string, useGoogleGrounding: boolean) => Promise<void>;
  onClearHistory?: (agentId: AIAgentId) => void;
  isSendingMessage?: boolean;
  brandProfile?: BrandProfile;
}

export default function DepartmentTeamsRoster({
  departments,
  employees,
  onAddEmployee,
  onRemoveEmployee,
  onUpdateDepartmentManager,
  onToggleDepartmentBot,
  onAssignDepartmentBot,
  onSelectAgentForChat,
  agentChatHistories,
  onSendMessage,
  onClearHistory,
  isSendingMessage,
  brandProfile
}: DepartmentTeamsRosterProps) {
  const [selectedDeptId, setSelectedDeptId] = useState<string>('dept-growth');
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [activeCxoBotId, setActiveCxoBotId] = useState<AIAgentId | null>(null);

  // New Employee Form State
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('');
  const [newEmpDeptId, setNewEmpDeptId] = useState(departments[0]?.id || 'dept-growth');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpSkills, setNewEmpSkills] = useState('');
  const [newEmpInitialTask, setNewEmpInitialTask] = useState('');

  // Reassign Manager State
  const [reassignDeptId, setReassignDeptId] = useState('');
  const [newManagerId, setNewManagerId] = useState<AIAgentId | 'none'>('ketan-growth');

  const selectedDept = departments.find(d => d.id === selectedDeptId) || departments[0];
  const deptEmployees = employees.filter(e => e.departmentId === selectedDept?.id);
  const isBotActive = selectedDept ? (selectedDept.isAiManagerEnabled !== false && Boolean(selectedDept.aiManagerId)) : true;
  const currentAiManager = AI_AGENTS_LIST.find(a => a.id === selectedDept?.aiManagerId) || AI_AGENTS_LIST[0];

  const handleToggleCurrentBot = () => {
    if (!selectedDept) return;
    const nextState = !isBotActive;
    if (onToggleDepartmentBot) {
      onToggleDepartmentBot(selectedDept.id, nextState);
    }
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim() || !newEmpRole.trim()) return;

    const skillsArray = newEmpSkills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    onAddEmployee({
      name: newEmpName.trim(),
      role: newEmpRole.trim(),
      email: newEmpEmail.trim() || `${newEmpName.toLowerCase().replace(/\s+/g, '.')}@creationai.studio`,
      phone: newEmpPhone.trim() || '+91 98000 00000',
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 50000)}?q=80&w=200&auto=format&fit=crop`,
      departmentId: newEmpDeptId,
      status: 'active',
      skills: skillsArray.length > 0 ? skillsArray : ['Production', 'Creative Strategy'],
      workloadScore: 45,
      currentTask: newEmpInitialTask.trim() || 'Assigned to team onboarding by AI Manager'
    });

    // Reset Form
    setNewEmpName('');
    setNewEmpRole('');
    setNewEmpEmail('');
    setNewEmpPhone('');
    setNewEmpSkills('');
    setNewEmpInitialTask('');
    setIsAddEmployeeModalOpen(false);
  };

  const handleOpenReassign = (deptId: string, currentId: AIAgentId) => {
    setReassignDeptId(deptId);
    setNewManagerId(currentId);
    setIsReassignModalOpen(true);
  };

  const handleSaveReassign = () => {
    if (!reassignDeptId) return;
    if (newManagerId === 'none') {
      if (onAssignDepartmentBot) {
        onAssignDepartmentBot(reassignDeptId, null);
      } else if (onToggleDepartmentBot) {
        onToggleDepartmentBot(reassignDeptId, false);
      }
    } else {
      if (onAssignDepartmentBot) {
        onAssignDepartmentBot(reassignDeptId, newManagerId);
      } else {
        onUpdateDepartmentManager(reassignDeptId, newManagerId);
      }
    }
    setIsReassignModalOpen(false);
  };

  const getStatusBadge = (status: Employee['status']) => {
    switch (status) {
      case 'active':
        return { label: 'Active', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'in_production':
        return { label: 'In Production', bg: 'bg-purple-500/10 text-purple-300 border-purple-500/20' };
      case 'on_review':
        return { label: 'Under Review', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
      case 'offline':
      default:
        return { label: 'Offline', bg: 'bg-white/5 text-white/40 border-white/10' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-sleek-zinc via-indigo-950/20 to-sleek-zinc border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Users size={18} />
            </span>
            <h2 className="text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Departments & Team Roster
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 border border-white/10 text-white/70">
                {employees.length} Humans · {departments.length} AI Managers
              </span>
            </h2>
          </div>
          <p className="text-xs text-white/60 max-w-2xl">
            Real human employees are organized into departments and supervised by assigned AI Managers. The AI Manager assigns tasks, guides creative deliverables, audits output, and escalates complex decisions to the CEO.
          </p>
        </div>

        {/* Add Employee Action Button */}
        <button
          onClick={() => {
            setNewEmpDeptId(selectedDeptId);
            setIsAddEmployeeModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-sleek-violet hover:bg-sleek-violet/90 text-white text-xs font-semibold flex items-center gap-2 transition-colors shrink-0 shadow-sm"
        >
          <Plus size={14} />
          <span>Add Human Employee</span>
        </button>
      </div>

      {/* Executive CXO Suite: Chat with Bots Individually in Private Office */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Executive CXO Suite · Private 1-on-1 Office
            </h3>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-sleek-violet/20 text-sleek-violet font-mono uppercase">
              CONFIDENTIAL
            </span>
          </div>
          <span className="text-[11px] text-white/50">
            Consult privately with any AI Manager just like talking to a CXO
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {AI_AGENTS_LIST.map((agent) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => {
                setActiveCxoBotId(agent.id);
                if (onSelectAgentForChat) onSelectAgentForChat(agent.id);
              }}
              className="p-3 rounded-xl bg-sleek-zinc border border-white/5 hover:border-sleek-violet/50 hover:bg-white/[0.04] transition-all text-left flex flex-col justify-between group cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
                  style={{ backgroundColor: `${agent.color}25`, color: agent.color }}
                >
                  {agent.name.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white group-hover:text-sleek-violet transition-colors truncate">
                    {agent.name}
                  </p>
                  <p className="text-[10px] text-white/50 truncate">
                    {agent.role}
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-sleek-violet font-semibold flex items-center gap-1 mt-1 group-hover:translate-x-0.5 transition-transform">
                <MessageSquare size={11} /> Private CXO Chat
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Department Selector Pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {departments.map((dept) => {
          const isSelected = dept.id === selectedDeptId;
          const manager = AI_AGENTS_LIST.find(a => a.id === dept.aiManagerId) || AI_AGENTS_LIST[0];
          const memberCount = employees.filter(e => e.departmentId === dept.id).length;
          const isDeptBotOn = dept.isAiManagerEnabled !== false && Boolean(dept.aiManagerId);

          return (
            <button
              key={dept.id}
              onClick={() => setSelectedDeptId(dept.id)}
              className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-white/[0.08] border-sleek-violet shadow-lg shadow-purple-950/40'
                  : 'bg-sleek-zinc border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/40 text-white/60">
                  {dept.code}
                </span>
                <span className="text-[11px] text-white/40 flex items-center gap-1">
                  <Users size={11} />
                  {memberCount} staff
                </span>
              </div>

              <h3 className="text-xs font-bold text-white line-clamp-1 mb-1.5">
                {dept.name}
              </h3>

              <div className="flex items-center justify-between gap-1 text-[11px]">
                {isDeptBotOn ? (
                  <div className="flex items-center gap-1.5 text-white/70">
                    <span 
                      className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold"
                      style={{ backgroundColor: `${manager.color}25`, color: manager.color }}
                    >
                      {manager.name.slice(0, 1)}
                    </span>
                    <span className="text-white/80 font-medium truncate max-w-[70px]">{manager.name}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-mono">
                      AI ON
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-amber-300/80">
                    <span className="w-4 h-4 rounded bg-amber-500/20 text-amber-300 flex items-center justify-center text-[9px] font-bold">
                      H
                    </span>
                    <span className="text-[10px] text-amber-300 font-medium">Human-Led</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Department Command Center */}
      {selectedDept && (
        <div className="p-4 md:p-5 rounded-2xl bg-sleek-zinc border border-white/10 space-y-5">
          {/* Department Header, Bot Toggle & AI Manager Card */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {selectedDept.name}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sleek-violet/20 text-sleek-violet border border-sleek-violet/30">
                  {selectedDept.code}
                </span>

                {/* Status Pill */}
                {isBotActive ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    AI Supervised
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Human-Led Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-white/60 max-w-xl">
                {selectedDept.description}
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-xs text-emerald-400">
                <Target size={13} />
                <span className="font-medium">Mandate:</span>
                <span className="text-white/80">{selectedDept.autonomousGoal}</span>
              </div>
            </div>

            {/* AI Bot Manager Controls & Oversight Card */}
            <div className="flex flex-col gap-2 shrink-0 lg:min-w-[340px]">
              {/* Bot Toggle Switch */}
              <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isBotActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'}`}>
                    <Bot size={14} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      AI Bot Manager
                    </span>
                    <span className="text-[10px] text-white/50 block">
                      {isBotActive ? 'Supervision & auto-actions active' : 'Turned OFF: Human-led workflow'}
                    </span>
                  </div>
                </div>

                {/* Toggle Button */}
                <button
                  type="button"
                  onClick={handleToggleCurrentBot}
                  className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isBotActive ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                  role="switch"
                  aria-checked={isBotActive}
                  title={isBotActive ? 'Click to toggle OFF (Switch to Human-Led)' : 'Click to toggle ON (Activate AI Bot)'}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isBotActive ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Active Manager Card or Inactive Human Banner */}
              {isBotActive ? (
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-inner"
                      style={{ backgroundColor: `${currentAiManager.color}25`, color: currentAiManager.color }}
                    >
                      {currentAiManager.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{currentAiManager.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-sleek-violet/20 text-sleek-violet font-mono uppercase">
                          AI MANAGER
                        </span>
                      </div>
                      <span className="text-[11px] text-white/50 block line-clamp-1">{selectedDept.aiManagerRole}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCxoBotId(currentAiManager.id);
                        if (onSelectAgentForChat) onSelectAgentForChat(currentAiManager.id);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-sleek-violet/20 hover:bg-sleek-violet/30 border border-sleek-violet/40 text-sleek-violet font-semibold text-[11px] transition-all flex items-center gap-1.5"
                      title="Open Private Closed-Door CXO Chat"
                    >
                      <MessageSquare size={12} />
                      <span>Private CXO Chat</span>
                    </button>
                    <button
                      onClick={() => handleOpenReassign(selectedDept.id, selectedDept.aiManagerId)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title="Switch or Assign Different Bot"
                    >
                      <Edit3 size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                      <ShieldCheck size={12} /> Human-Led Mode Active
                    </span>
                    <p className="text-[10px] text-white/60 leading-tight">
                      AI bot actions paused. Team tasks handled manually.
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenReassign(selectedDept.id, selectedDept.aiManagerId)}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-semibold transition-colors shrink-0"
                  >
                    Assign Bot
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Department Budget & KPIs Metric Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Monthly Budget Tracker */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span className="flex items-center gap-1">
                  <DollarSign size={13} className="text-emerald-400" />
                  Monthly Budget
                </span>
                <span className="font-mono text-white/80">
                  ${selectedDept.budgetSpent.toLocaleString()} / ${selectedDept.budgetMonthly.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-sleek-violet h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.round((selectedDept.budgetSpent / selectedDept.budgetMonthly) * 100))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-white/40">
                <span>{Math.round((selectedDept.budgetSpent / selectedDept.budgetMonthly) * 100)}% utilized</span>
                <span>${(selectedDept.budgetMonthly - selectedDept.budgetSpent).toLocaleString()} available</span>
              </div>
            </div>

            {/* Department KPIs */}
            {selectedDept.kpis.map((kpi, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[11px] text-white/50 block line-clamp-1">{kpi.label}</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-bold text-white font-mono">{kpi.current}</span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                    <TrendingUp size={10} />
                    Target: {kpi.target}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Real Human Team Members Roster */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-2">
                <Users size={14} className="text-sleek-violet" />
                Human Employee Roster ({deptEmployees.length} Supervised Members)
              </h4>
              <button
                onClick={() => {
                  setNewEmpDeptId(selectedDept.id);
                  setIsAddEmployeeModalOpen(true);
                }}
                className="text-xs text-sleek-violet hover:text-sleek-fuchsia transition-colors flex items-center gap-1"
              >
                <Plus size={12} />
                <span>Add Member to {selectedDept.name}</span>
              </button>
            </div>

            {deptEmployees.length === 0 ? (
              <div className="p-6 rounded-xl bg-black/40 border border-white/5 text-center text-xs text-white/40 space-y-2">
                <p>No human employees currently assigned to this department.</p>
                <button
                  onClick={() => {
                    setNewEmpDeptId(selectedDept.id);
                    setIsAddEmployeeModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs inline-flex items-center gap-1.5"
                >
                  <Plus size={12} />
                  Assign First Employee
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {deptEmployees.map((emp) => {
                  const status = getStatusBadge(emp.status);
                  return (
                    <div 
                      key={emp.id}
                      className="p-4 rounded-xl bg-black/40 border border-white/5 hover:border-white/15 transition-all space-y-3"
                    >
                      {/* Member Info Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={emp.avatar} 
                            alt={emp.name}
                            className="w-10 h-10 rounded-xl object-cover border border-white/10"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div>
                            <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                              {emp.name}
                              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-medium border ${status.bg}`}>
                                {status.label}
                              </span>
                            </h5>
                            <span className="text-[11px] text-white/50 block">{emp.role}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => onRemoveEmployee(emp.id)}
                          className="text-white/20 hover:text-red-400 p-1 rounded transition-colors"
                          title="Remove from team"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Current Active Task (Assigned by AI Manager) */}
                      <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-[11px] space-y-1">
                        <div className="flex items-center justify-between text-white/40 text-[10px]">
                          <span className="flex items-center gap-1 text-sleek-violet">
                            <Bot size={11} />
                            Task from {currentAiManager.name}:
                          </span>
                          <span>{emp.completedTasksCount} completed</span>
                        </div>
                        <p className="text-white/80 font-mono text-[11px] line-clamp-2">
                          {emp.currentTask || 'Awaiting task assignment from AI manager.'}
                        </p>
                      </div>

                      {/* Workload Meter */}
                      <div className="space-y-1 text-[10px]">
                        <div className="flex justify-between text-white/50">
                          <span>Workload Capacity</span>
                          <span className="font-mono text-white/80">{emp.workloadScore}%</span>
                        </div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              emp.workloadScore > 80 ? 'bg-amber-400' : 'bg-sleek-violet'
                            }`}
                            style={{ width: `${emp.workloadScore}%` }}
                          />
                        </div>
                      </div>

                      {/* Skills Tags */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {emp.skills.map((skill, sIdx) => (
                          <span 
                            key={sIdx}
                            className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/60 border border-white/5"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      {/* Footer Contact */}
                      <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 border-t border-white/5">
                        <span className="flex items-center gap-1">
                          <Mail size={10} />
                          {emp.email}
                        </span>
                        <span>Joined {emp.joinedDate || 'Recently'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Real Human Employee Modal */}
      {isAddEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-sleek-zinc border border-white/15 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users size={16} className="text-sleek-violet" />
                Add Real Human Employee to Team
              </h3>
              <button 
                onClick={() => setIsAddEmployeeModalOpen(false)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3 text-xs">
              <div>
                <label className="text-white/70 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  placeholder="e.g. Vikram Malhotra"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-hidden focus:border-sleek-violet"
                />
              </div>

              <div>
                <label className="text-white/70 block mb-1">Role / Job Title</label>
                <input
                  type="text"
                  required
                  value={newEmpRole}
                  onChange={(e) => setNewEmpRole(e.target.value)}
                  placeholder="e.g. Senior Colorist & DaVinci Specialist"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-hidden focus:border-sleek-violet"
                />
              </div>

              <div>
                <label className="text-white/70 block mb-1">Assigned Department</label>
                <select
                  value={newEmpDeptId}
                  onChange={(e) => setNewEmpDeptId(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-sleek-violet"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-white/70 block mb-1">Work Email</label>
                  <input
                    type="email"
                    value={newEmpEmail}
                    onChange={(e) => setNewEmpEmail(e.target.value)}
                    placeholder="vikram@creationai.studio"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-hidden focus:border-sleek-violet"
                  />
                </div>
                <div>
                  <label className="text-white/70 block mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newEmpPhone}
                    onChange={(e) => setNewEmpPhone(e.target.value)}
                    placeholder="+91 98200 12345"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-hidden focus:border-sleek-violet"
                  />
                </div>
              </div>

              <div>
                <label className="text-white/70 block mb-1">Core Skills (comma separated)</label>
                <input
                  type="text"
                  value={newEmpSkills}
                  onChange={(e) => setNewEmpSkills(e.target.value)}
                  placeholder="e.g. DaVinci Resolve, Kodak 2383, Color Grading, HDR10"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-hidden focus:border-sleek-violet"
                />
              </div>

              <div>
                <label className="text-white/70 block mb-1">Initial Task Directive</label>
                <input
                  type="text"
                  value={newEmpInitialTask}
                  onChange={(e) => setNewEmpInitialTask(e.target.value)}
                  placeholder="e.g. Grade 4K studio commercials to match brand palette"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-hidden focus:border-sleek-violet"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddEmployeeModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sleek-violet hover:bg-sleek-violet/90 text-white font-semibold"
                >
                  Onboard to Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign AI Manager Modal */}
      {isReassignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-sleek-zinc border border-white/15 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bot size={16} className="text-sleek-violet" />
                Assign AI Supervising Manager
              </h3>
              <button 
                onClick={() => setIsReassignModalOpen(false)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-white/60">
              Select which Google AI Manager will supervise task delegation and approvals for this department.
            </p>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 hide-scrollbar">
              {/* Option 1: Human-Led Mode (No Bot) */}
              <label
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  newManagerId === 'none' 
                    ? 'bg-amber-500/10 border-amber-500/50 text-white' 
                    : 'bg-black/40 border-white/5 hover:border-white/15 text-white/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-bold">
                    H
                  </span>
                  <div>
                    <span className="text-xs font-bold block text-amber-300">Human-Led Mode (No AI Bot)</span>
                    <span className="text-[10px] text-white/50 block">Manual employee workflows, no autonomous bot actions</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="ai_manager_choice"
                  value="none"
                  checked={newManagerId === 'none'}
                  onChange={() => setNewManagerId('none')}
                  className="accent-amber-400"
                />
              </label>

              {/* AI Agents */}
              {AI_AGENTS_LIST.map((agent) => (
                <label
                  key={agent.id}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    newManagerId === agent.id 
                      ? 'bg-sleek-violet/10 border-sleek-violet text-white' 
                      : 'bg-black/40 border-white/5 hover:border-white/15 text-white/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: `${agent.color}25`, color: agent.color }}
                    >
                      {agent.name.slice(0, 1)}
                    </span>
                    <div>
                      <span className="text-xs font-bold block">{agent.name}</span>
                      <span className="text-[10px] text-white/40 block">{agent.role}</span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="ai_manager_choice"
                    value={agent.id}
                    checked={newManagerId === agent.id}
                    onChange={() => setNewManagerId(agent.id)}
                    className="accent-sleek-violet"
                  />
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsReassignModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReassign}
                className="px-4 py-2 rounded-xl bg-sleek-violet hover:bg-sleek-violet/90 text-white text-xs font-semibold"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Private CXO Chat Closed-Door Consultation Modal */}
      {activeCxoBotId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="w-full max-w-4xl bg-sleek-zinc border border-white/10 rounded-2xl flex flex-col h-[85vh] shadow-2xl overflow-hidden">
            {/* CXO Room Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/50 shrink-0">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-inner"
                  style={{ 
                    backgroundColor: `${AI_AGENTS_LIST.find(a => a.id === activeCxoBotId)?.color}25`, 
                    color: AI_AGENTS_LIST.find(a => a.id === activeCxoBotId)?.color 
                  }}
                >
                  {AI_AGENTS_LIST.find(a => a.id === activeCxoBotId)?.name.slice(0, 1)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Private CXO Consultation: {AI_AGENTS_LIST.find(a => a.id === activeCxoBotId)?.name}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-sleek-violet/20 text-sleek-violet font-mono uppercase">
                      CLOSED-DOOR
                    </span>
                  </h3>
                  <p className="text-[11px] text-white/50">
                    {AI_AGENTS_LIST.find(a => a.id === activeCxoBotId)?.role}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveCxoBotId(null)}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                title="Close Private Office"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col">
              <IsolatedAgentChat
                selectedAgentId={activeCxoBotId}
                onSelectAgentId={(id) => setActiveCxoBotId(id)}
                chatHistories={agentChatHistories || {}}
                onSendMessage={onSendMessage || (async () => {})}
                onClearHistory={onClearHistory || (() => {})}
                isSending={Boolean(isSendingMessage)}
                brandProfile={brandProfile || { name: 'Brand', industry: 'General', targetAudience: 'Global', tone: 'Professional', primaryColor: '#8B5CF6', fontVibe: 'modern' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
