import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Plus, 
  Play, 
  Bot, 
  User, 
  AlertCircle, 
  Sparkles, 
  ChevronRight, 
  Activity,
  ArrowRight,
  Filter,
  Check,
  Send,
  Zap
} from 'lucide-react';
import { DepartmentTaskItem, ManagerActivityLog, DepartmentTeam, Employee, AIAgentId } from '../../types';
import { AI_AGENTS_LIST } from '../../services/agentService';

interface DepartmentTaskBoardProps {
  tasks: DepartmentTaskItem[];
  activityLogs: ManagerActivityLog[];
  departments: DepartmentTeam[];
  employees: Employee[];
  onUpdateTaskStage: (taskId: string, stage: DepartmentTaskItem['stage']) => void;
  onAddTask: (task: Omit<DepartmentTaskItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onRunManagerialSync: () => void;
  isSyncing?: boolean;
}

const STAGES: Array<{ key: DepartmentTaskItem['stage']; label: string; countColor: string }> = [
  { key: 'backlog', label: 'AI Directives & Backlog', countColor: 'text-slate-400 bg-slate-500/10' },
  { key: 'in_progress', label: 'In Production (Human)', countColor: 'text-amber-400 bg-amber-500/10' },
  { key: 'under_ai_review', label: 'Under AI Review', countColor: 'text-purple-400 bg-purple-500/10' },
  { key: 'ready_for_approval', label: 'CEO Approval Needed', countColor: 'text-red-400 bg-red-500/10' },
  { key: 'done', label: 'Completed & Deployed', countColor: 'text-emerald-400 bg-emerald-500/10' }
];

export default function DepartmentTaskBoard({
  tasks,
  activityLogs,
  departments,
  employees,
  onUpdateTaskStage,
  onAddTask,
  onRunManagerialSync,
  isSyncing = false
}: DepartmentTaskBoardProps) {
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  // New Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDeptId, setNewTaskDeptId] = useState(departments[0]?.id || 'dept-growth');
  const [newTaskEmployeeId, setNewTaskEmployeeId] = useState(employees[0]?.id || '');
  const [newTaskPriority, setNewTaskPriority] = useState<DepartmentTaskItem['priority']>('normal');
  const [newTaskDueDate, setNewTaskDueDate] = useState('Tomorrow, 5:00 PM');
  const [newTaskGuidance, setNewTaskGuidance] = useState('');

  const filteredTasks = tasks.filter(t => {
    if (selectedDeptFilter !== 'ALL' && t.departmentId !== selectedDeptFilter) return false;
    return true;
  });

  const deptEmployeesForSelectedDept = employees.filter(e => e.departmentId === newTaskDeptId);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskEmployeeId) return;

    const assignedEmp = employees.find(e => e.id === newTaskEmployeeId);
    const targetDept = departments.find(d => d.id === newTaskDeptId);
    const assignedAgent = AI_AGENTS_LIST.find(a => a.id === targetDept?.aiManagerId) || AI_AGENTS_LIST[0];

    onAddTask({
      departmentId: newTaskDeptId,
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || 'Executed according to AI managerial directive.',
      assignedToEmployeeId: newTaskEmployeeId,
      assignedEmployeeName: assignedEmp?.name || 'Assigned Staff',
      assignedByAgentId: assignedAgent.id,
      assignedByAgentName: assignedAgent.name,
      priority: newTaskPriority,
      stage: 'in_progress',
      dueDate: newTaskDueDate,
      aiGuidanceNotes: newTaskGuidance.trim() || `${assignedAgent.name} has pre-configured brand guidelines and success criteria.`
    });

    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskGuidance('');
    setIsNewTaskModalOpen(false);
  };

  const getPriorityBadge = (p: DepartmentTaskItem['priority']) => {
    switch (p) {
      case 'urgent':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'normal':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'low':
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Managerial Sync & Task Creation */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sleek-zinc via-purple-950/20 to-sleek-zinc border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-sleek-violet/20 text-sleek-violet">
              <Activity size={18} />
            </span>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Autonomous Operations Board & Task Pipeline
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                AI SUPERVISED
              </span>
            </h2>
          </div>
          <p className="text-xs text-white/60">
            AI Managers assign tasks, balance human workloads, and QA deliverables. Progress cards across stages or trigger an autonomous sync.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onRunManagerialSync}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="AI Managers evaluate workloads, QA draft deliverables, and update boards"
          >
            <RefreshCw size={13} className={`text-sleek-violet ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'AI Evaluating...' : 'Run Managerial Check-in'}</span>
          </button>

          <button
            onClick={() => setIsNewTaskModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-sleek-violet hover:bg-sleek-violet/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus size={14} />
            <span>Assign New Task</span>
          </button>
        </div>
      </div>

      {/* Filter by Department */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs hide-scrollbar">
        <div className="flex items-center gap-1.5">
          <span className="text-white/40 flex items-center gap-1">
            <Filter size={12} />
            Department:
          </span>
          <button
            onClick={() => setSelectedDeptFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              selectedDeptFilter === 'ALL'
                ? 'bg-sleek-violet text-white'
                : 'text-white/50 hover:text-white bg-black/40'
            }`}
          >
            All Departments ({tasks.length})
          </button>
          {departments.map(dept => (
            <button
              key={dept.id}
              onClick={() => setSelectedDeptFilter(dept.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedDeptFilter === dept.id
                  ? 'bg-sleek-violet text-white'
                  : 'text-white/50 hover:text-white bg-black/40'
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto pb-2">
        {STAGES.map(stage => {
          const stageTasks = filteredTasks.filter(t => t.stage === stage.key);

          return (
            <div 
              key={stage.key}
              className="bg-black/30 border border-white/5 rounded-2xl p-3 flex flex-col min-h-[460px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/5">
                <h3 className="text-xs font-bold text-white tracking-tight">
                  {stage.label}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${stage.countColor}`}>
                  {stageTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="flex-1 space-y-2.5 overflow-y-auto hide-scrollbar">
                {stageTasks.length === 0 ? (
                  <div className="h-28 flex items-center justify-center text-center text-[11px] text-white/30 border border-dashed border-white/5 rounded-xl">
                    No active tasks
                  </div>
                ) : (
                  stageTasks.map(task => {
                    const agent = AI_AGENTS_LIST.find(a => a.id === task.assignedByAgentId) || AI_AGENTS_LIST[0];

                    return (
                      <div
                        key={task.id}
                        className="p-3 rounded-xl bg-sleek-zinc border border-white/5 hover:border-white/20 transition-all space-y-2 shadow-xs group"
                      >
                        {/* Task Priority & Submitter */}
                        <div className="flex items-center justify-between text-[10px]">
                          <span className={`px-1.5 py-0.2 rounded border font-mono uppercase ${getPriorityBadge(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-white/40">{task.dueDate}</span>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-bold text-white leading-tight">
                          {task.title}
                        </h4>

                        <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>

                        {/* AI Manager Guidance Note */}
                        {task.aiGuidanceNotes && (
                          <div className="p-2 rounded-lg bg-black/40 border border-white/5 text-[10px] text-white/70 space-y-0.5">
                            <span className="text-sleek-violet font-semibold flex items-center gap-1">
                              <Bot size={10} />
                              {task.assignedByAgentName}'s Directive:
                            </span>
                            <p className="font-mono text-white/60 line-clamp-2">
                              {task.aiGuidanceNotes}
                            </p>
                          </div>
                        )}

                        {/* Assigned Employee & Agent */}
                        <div className="flex items-center justify-between pt-1 text-[11px] border-t border-white/5">
                          <div className="flex items-center gap-1 text-white/80">
                            <User size={11} className="text-sleek-violet" />
                            <span className="font-medium text-[10px]">{task.assignedEmployeeName}</span>
                          </div>

                          {/* Quick Stage Progression Controls */}
                          <div className="flex items-center gap-1">
                            {stage.key !== 'done' && (
                              <button
                                onClick={() => {
                                  const nextIdx = STAGES.findIndex(s => s.key === stage.key) + 1;
                                  if (nextIdx < STAGES.length) {
                                    onUpdateTaskStage(task.id, STAGES[nextIdx].key);
                                  }
                                }}
                                className="p-1 rounded bg-white/5 hover:bg-sleek-violet text-white/50 hover:text-white transition-colors"
                                title="Move to next stage"
                              >
                                <ChevronRight size={12} />
                              </button>
                            )}
                            {stage.key !== 'done' && (
                              <button
                                onClick={() => onUpdateTaskStage(task.id, 'done')}
                                className="p-1 rounded bg-white/5 hover:bg-emerald-600 text-white/50 hover:text-white transition-colors"
                                title="Mark as complete"
                              >
                                <Check size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live AI Manager Activity Feed */}
      <div className="p-4 rounded-2xl bg-sleek-zinc border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-2">
            <Zap size={14} className="text-sleek-violet" />
            Live AI Manager Activity & Audit Log
          </h3>
          <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Supervisory Engine Active
          </span>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1 hide-scrollbar">
          {activityLogs.slice(0, 10).map(log => {
            const agent = AI_AGENTS_LIST.find(a => a.id === log.aiManagerId) || AI_AGENTS_LIST[0];

            return (
              <div 
                key={log.id}
                className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <span 
                    className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                    style={{ backgroundColor: `${agent.color}25`, color: agent.color }}
                  >
                    {agent.name.slice(0, 1)}
                  </span>
                  <div>
                    <span className="font-semibold text-white mr-1.5">{log.aiManagerName}:</span>
                    <span className="text-white/80">{log.description}</span>
                    {log.targetEmployeeName && (
                      <span className="text-white/40 block text-[10px] mt-0.5">
                        Target Staff: {log.targetEmployeeName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {log.badge && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-sleek-violet/20 border border-sleek-violet/30 text-sleek-violet font-mono block mb-0.5">
                      {log.badge}
                    </span>
                  )}
                  <span className="text-[10px] text-white/30">{log.timestamp}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Task Assignment Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-sleek-zinc border border-white/15 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus size={16} className="text-sleek-violet" />
                Assign AI Directive to Human Employee
              </h3>
              <button 
                onClick={() => setIsNewTaskModalOpen(false)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="text-white/70 block mb-1">Task Directive Title</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Produce 3 DaVinci LUT test exports"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-hidden focus:border-sleek-violet"
                />
              </div>

              <div>
                <label className="text-white/70 block mb-1">Department</label>
                <select
                  value={newTaskDeptId}
                  onChange={(e) => {
                    setNewTaskDeptId(e.target.value);
                    const matching = employees.filter(emp => emp.departmentId === e.target.value);
                    if (matching.length > 0) setNewTaskEmployeeId(matching[0].id);
                  }}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-sleek-violet"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-white/70 block mb-1">Assign to Employee</label>
                <select
                  value={newTaskEmployeeId}
                  onChange={(e) => setNewTaskEmployeeId(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-sleek-violet"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-white/70 block mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-sleek-violet"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-white/70 block mb-1">Due Date</label>
                  <input
                    type="text"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    placeholder="Today, 6:00 PM"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-hidden focus:border-sleek-violet"
                  />
                </div>
              </div>

              <div>
                <label className="text-white/70 block mb-1">AI Guidance / Quality Directive</label>
                <textarea
                  rows={2}
                  value={newTaskGuidance}
                  onChange={(e) => setNewTaskGuidance(e.target.value)}
                  placeholder="e.g. Ensure 9:16 vertical framing and export ProRes 422 Proxy."
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-white placeholder-white/30 focus:outline-hidden focus:border-sleek-violet font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sleek-violet hover:bg-sleek-violet/90 text-white font-semibold"
                >
                  Deploy Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
