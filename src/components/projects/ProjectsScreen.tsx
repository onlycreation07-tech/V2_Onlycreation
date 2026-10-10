import { useState, useEffect } from 'react';
import { 
  Project, 
  ProjectStage, 
  ProjectMessage, 
  AdCreative, 
  ProjectMilestone,
  ProjectDeliverable 
} from '../../types';
import { dbService } from '../../services/dbService';
import { geminiService } from '../../services/geminiService';
import { useAuth } from '../../context/AuthContext';
import { 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  MessageSquare, 
  CheckSquare, 
  Download, 
  Plus, 
  Layers, 
  ExternalLink, 
  X, 
  Film, 
  Activity, 
  Lock,
  ArrowRight,
  ShieldCheck,
  Video,
  Zap,
  FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectsScreenProps {
  creatives: AdCreative[];
  onOpenCreate?: () => void;
  onDispatchCreator?: () => void;
  initialProjectId?: string | null;
}

const STAGES: Array<{ id: ProjectStage; label: string; color: string }> = [
  { id: 'ideation', label: 'Ideation', color: 'bg-zinc-500' },
  { id: 'pre_production', label: 'Pre-Prod', color: 'bg-amber-500' },
  { id: 'production', label: 'Production', color: 'bg-blue-500' },
  { id: 'review', label: 'Review', color: 'bg-purple-500' },
  { id: 'delivered', label: 'Delivered', color: 'bg-emerald-500' },
];

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'demo-proj-1',
    userId: 'demo-user',
    title: 'Indiranagar Neon Streetwear Reel',
    brandName: 'Veloce Tokyo',
    stage: 'production',
    budget: 35000,
    creativePrompt: 'Cinematic 90s camcorder aesthetic featuring oversized hoodies in urban Bangalore rooftop cypher.',
    assignedCreator: {
      name: 'Vikram S.',
      role: 'Lead Cinematographer & Editor',
      handle: '@vikramshoots',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
    },
    milestones: [
      { id: 'm1', title: 'Creative brief & shotlist approval', completed: true },
      { id: 'm2', title: 'Studio / Location lock at Koramangala', completed: true },
      { id: 'm3', title: 'A-Roll shoot on Sony FX3 & vintage glass', completed: true },
      { id: 'm4', title: 'Rough cut review & sound design', completed: false, dueDate: 'Tomorrow' },
      { id: 'm5', title: 'Color grade & 4K delivery export', completed: false, dueDate: 'In 3 days' },
    ],
    deliverables: [
      { 
        id: 'd1', 
        name: 'Technical_Production_Brief_v2.pdf', 
        url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=800&auto=format&fit=crop', 
        type: 'brief', 
        uploadedAt: '2 days ago', 
        size: '1.4 MB' 
      },
      { 
        id: 'd2', 
        name: 'B-Roll_Rooftop_Raw_Preview.mp4', 
        url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop', 
        type: 'video', 
        uploadedAt: 'Yesterday', 
        size: '184 MB' 
      }
    ],
    aiHealthScore: 92,
    aiRiskAnalysis: 'On schedule. Production completed on time with high client engagement.',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'demo-proj-2',
    userId: 'demo-user',
    title: 'Quiet Luxury Botanical Serum Campaign',
    brandName: 'Aura Naturals',
    stage: 'review',
    budget: 52000,
    creativePrompt: 'High-fashion editorial macro shots of glass dropper bottles with natural morning sun and prism refractions.',
    assignedCreator: {
      name: 'Priya M.',
      role: 'Commercial Tabletop Director',
      handle: '@priya.visuals',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop'
    },
    milestones: [
      { id: 'm21', title: 'Moodboard & lighting blueprint', completed: true },
      { id: 'm22', title: 'Macro tabletop studio booking', completed: true },
      { id: 'm23', title: 'High-speed 120fps fluid capture', completed: true },
      { id: 'm24', title: 'Color pass with Kodak film curve', completed: true },
      { id: 'm25', title: 'Final client delivery sign-off', completed: false, dueDate: 'Today' },
    ],
    deliverables: [
      { 
        id: 'd21', 
        name: 'Final_Cut_Aura_Serum_9x16_Master.mp4', 
        url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop', 
        type: 'video', 
        uploadedAt: 'Today', 
        size: '220 MB' 
      }
    ],
    aiHealthScore: 97,
    aiRiskAnalysis: 'Low risk. Ready for final payout & high-res asset distribution.',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export default function ProjectsScreen({ 
  creatives, 
  onOpenCreate,
  onDispatchCreator,
  initialProjectId
}: ProjectsScreenProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pipelines' | 'creatives'>('pipelines');
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [detailTab, setDetailTab] = useState<'milestones' | 'chat' | 'health' | 'deliverables'>('milestones');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // New Project Form State
  const [newTitle, setNewTitle] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newBudget, setNewBudget] = useState(25000);
  const [newPrompt, setNewPrompt] = useState('');

  // Chat State inside Project
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAnalyzingHealth, setIsAnalyzingHealth] = useState(false);

  // Deliverable Review & Revision State
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [targetDeliverable, setTargetDeliverable] = useState<ProjectDeliverable | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [newDeliverableName, setNewDeliverableName] = useState('');
  const [newDeliverableUrl, setNewDeliverableUrl] = useState('');
  const [newDeliverableType, setNewDeliverableType] = useState<'video' | 'image' | 'script' | 'brief'>('video');

  // Auto-open initial project if passed
  useEffect(() => {
    if (initialProjectId && projects.length > 0) {
      const match = projects.find(p => p.id === initialProjectId);
      if (match) {
        setSelectedProject(match);
        setActiveTab('pipelines');
      }
    }
  }, [initialProjectId, projects]);

  // Load Projects from DB or Fallback
  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        setIsLoading(true);
        const fetched = await dbService.getProjects(user.uid);
        if (fetched && fetched.length > 0) {
          setProjects(fetched);
        }
      } catch (err) {
        console.warn("Could not load user projects from Firestore:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [user]);

  // Load Project Messages when selecting a project
  useEffect(() => {
    if (!selectedProject) return;
    async function loadMsgs() {
      try {
        const msgs = await dbService.getProjectMessages(selectedProject.id);
        if (msgs.length > 0) {
          setMessages(msgs);
        } else {
          // Pre-populate realistic anonymous chat messages
          setMessages([
            {
              id: 'msg-1',
              projectId: selectedProject.id,
              senderId: 'creator-rep',
              senderName: selectedProject.assignedCreator?.role || 'Lead Cinematographer',
              senderRole: 'creator',
              content: `Hi! We've prepped the gear and lighting scheme based on your production brief. Shooting begins as scheduled!`,
              timestamp: new Date(Date.now() - 3600000).toISOString()
            },
            {
              id: 'msg-2',
              projectId: selectedProject.id,
              senderId: 'client-rep',
              senderName: 'Client Executive',
              senderRole: 'client',
              content: 'Fantastic! Please emphasize the hero packaging close-ups in the first 3 seconds.',
              timestamp: new Date(Date.now() - 1800000).toISOString()
            }
          ]);
        }
      } catch (e) {
        console.warn("Could not load messages:", e);
      }
    }
    loadMsgs();
  }, [selectedProject]);

  // Handle Stage Advancement
  const handleStageChange = async (newStage: ProjectStage) => {
    if (!selectedProject) return;
    const updated = { ...selectedProject, stage: newStage, updatedAt: new Date().toISOString() };
    setSelectedProject(updated);
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    try {
      await dbService.updateProject(updated.id, { stage: newStage });
    } catch (e) {
      console.warn("Could not persist stage update:", e);
    }
  };

  // Toggle Milestone Completion
  const handleToggleMilestone = async (milestoneId: string) => {
    if (!selectedProject) return;
    const updatedMilestones = selectedProject.milestones.map(m => 
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    const updated = { ...selectedProject, milestones: updatedMilestones };
    setSelectedProject(updated);
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    try {
      await dbService.updateProject(updated.id, { milestones: updatedMilestones });
    } catch (e) {
      console.warn("Milestone update failed:", e);
    }
  };

  // Deliverable Review & Approval Handlers
  const handleApproveDeliverable = async (deliverableId: string) => {
    if (!selectedProject) return;
    const updatedDeliverables = selectedProject.deliverables.map(d => 
      d.id === deliverableId ? { ...d, status: 'approved' as const } : d
    );
    const updated = { ...selectedProject, deliverables: updatedDeliverables };
    setSelectedProject(updated);
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    try {
      await dbService.updateDeliverableStatus(selectedProject.id, deliverableId, 'approved');
    } catch (e) {
      console.warn("Could not approve deliverable:", e);
    }
  };

  const handleOpenRevisionModal = (deliverable: ProjectDeliverable) => {
    setTargetDeliverable(deliverable);
    setRevisionNotes(deliverable.feedback || '');
    setRevisionModalOpen(true);
  };

  const handleSubmitRevision = async () => {
    if (!selectedProject || !targetDeliverable || !revisionNotes.trim()) return;
    const updatedDeliverables = selectedProject.deliverables.map(d => 
      d.id === targetDeliverable.id ? { ...d, status: 'revision_requested' as const, feedback: revisionNotes.trim() } : d
    );
    const updated = { ...selectedProject, deliverables: updatedDeliverables };
    setSelectedProject(updated);
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    try {
      await dbService.updateDeliverableStatus(selectedProject.id, targetDeliverable.id, 'revision_requested', revisionNotes.trim());
    } catch (e) {
      console.warn("Could not request revision:", e);
    }
    setRevisionModalOpen(false);
    setTargetDeliverable(null);
    setRevisionNotes('');
  };

  const handleAddNewDeliverable = async () => {
    if (!selectedProject || !newDeliverableName.trim() || !newDeliverableUrl.trim()) return;
    const newAsset: ProjectDeliverable = {
      id: `del_${Date.now()}`,
      name: newDeliverableName.trim(),
      url: newDeliverableUrl.trim(),
      type: newDeliverableType,
      uploadedAt: 'Today',
      size: 'Cloud Link',
      status: 'pending'
    };
    const updatedDeliverables = [newAsset, ...selectedProject.deliverables];
    const updated = { ...selectedProject, deliverables: updatedDeliverables };
    setSelectedProject(updated);
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    try {
      await dbService.updateProject(selectedProject.id, { deliverables: updatedDeliverables });
    } catch (e) {
      console.warn("Could not add deliverable:", e);
    }
    setUploadModalOpen(false);
    setNewDeliverableName('');
    setNewDeliverableUrl('');
  };

  // Send Internal Anonymous Chat Message
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedProject) return;
    const newMsg: ProjectMessage = {
      id: 'msg-' + Date.now(),
      projectId: selectedProject.id,
      senderId: user?.uid || 'client-rep',
      senderName: user ? 'Client (Verified)' : 'Client Executive',
      senderRole: 'client',
      content: chatInput.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMsg]);
    setChatInput('');

    try {
      await dbService.sendProjectMessage({
        projectId: newMsg.projectId,
        senderId: newMsg.senderId,
        senderName: newMsg.senderName,
        senderRole: newMsg.senderRole,
        content: newMsg.content
      });
    } catch (e) {
      console.warn("Could not persist message:", e);
    }

    // Auto simulated creator response
    setTimeout(() => {
      const replyMsg: ProjectMessage = {
        id: 'msg-reply-' + Date.now(),
        projectId: selectedProject.id,
        senderId: 'creator-team',
        senderName: selectedProject.assignedCreator?.role || 'Production Supervisor',
        senderRole: 'creator',
        content: 'Acknowledged! We have logged this directly into today\'s call sheet.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, replyMsg]);
    }, 1200);
  };

  // Run AI Health & Risk Analysis
  const handleRunAiAnalysis = async () => {
    if (!selectedProject) return;
    setIsAnalyzingHealth(true);
    try {
      const completedCount = selectedProject.milestones.filter(m => m.completed).length;
      const res = await geminiService.analyzeProjectHealth({
        title: selectedProject.title,
        stage: selectedProject.stage,
        milestonesTotal: selectedProject.milestones.length,
        milestonesCompleted: completedCount,
        deliverablesTotal: selectedProject.deliverables.length
      });

      const updated = {
        ...selectedProject,
        aiHealthScore: res.healthScore,
        aiRiskAnalysis: `${res.riskLevel.toUpperCase()} RISK: ${res.insights.join(' ')} Recommendations: ${res.recommendations.join(' ')}`
      };
      setSelectedProject(updated);
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
      await dbService.updateProject(updated.id, {
        aiHealthScore: res.healthScore,
        aiRiskAnalysis: updated.aiRiskAnalysis
      });
    } catch (err) {
      console.warn("AI Health Analysis Error:", err);
    } finally {
      setIsAnalyzingHealth(false);
    }
  };

  // Create Project
  const handleCreateProject = async () => {
    if (!newTitle.trim()) return;
    const newProj: Project = {
      id: 'proj-' + Date.now(),
      userId: user?.uid || 'guest-user',
      title: newTitle.trim(),
      brandName: newBrand.trim() || 'My Brand',
      stage: 'ideation',
      budget: Number(newBudget) || 25000,
      creativePrompt: newPrompt.trim() || 'Commercial visual production',
      assignedCreator: {
        name: 'Arjun Verma',
        role: 'Commercial Cinematographer',
        handle: '@arjunshoots',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'
      },
      milestones: [
        { id: 'm-init-1', title: 'Creative treatment & moodboard sign-off', completed: false },
        { id: 'm-init-2', title: 'Studio space & lighting lock', completed: false },
        { id: 'm-init-3', title: 'Principal photography / shoot day', completed: false },
        { id: 'm-init-4', title: 'Rough edit review & revision', completed: false },
        { id: 'm-init-5', title: 'Final color master delivery', completed: false }
      ],
      deliverables: [],
      aiHealthScore: 95,
      aiRiskAnalysis: 'Project initialized. Ready for creative treatment submission.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setProjects(prev => [newProj, ...prev]);
    setIsCreatingNew(false);
    setSelectedProject(newProj);

    try {
      await dbService.createProject({
        userId: newProj.userId,
        title: newProj.title,
        brandName: newProj.brandName,
        stage: newProj.stage,
        budget: newProj.budget,
        creativePrompt: newProj.creativePrompt,
        assignedCreator: newProj.assignedCreator,
        milestones: newProj.milestones,
        deliverables: newProj.deliverables,
        aiHealthScore: newProj.aiHealthScore,
        aiRiskAnalysis: newProj.aiRiskAnalysis
      });
    } catch (e) {
      console.warn("Could not save new project to Firestore:", e);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tighter text-white/90">Projects</h1>
          <button
            onClick={() => setIsCreatingNew(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-sleek-violet to-sleek-fuchsia text-white rounded-full font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-sleek-violet/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={14} /> New Project
          </button>
        </div>
        <p className="text-white/40 text-sm font-medium">
          Multi-stage production management, milestone tracking & escrow communication.
        </p>
      </header>

      {/* Primary Tab Switcher */}
      <div className="flex gap-4 border-b border-white/5 pb-2">
        <button
          onClick={() => setActiveTab('pipelines')}
          className={`text-xs font-black uppercase tracking-widest pb-2 px-2 transition-all flex items-center gap-2 ${
            activeTab === 'pipelines'
              ? 'text-white border-b-2 border-sleek-violet'
              : 'text-white/40 hover:text-white'
          }`}
        >
          <Layers size={14} />
          Active Pipelines ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab('creatives')}
          className={`text-xs font-black uppercase tracking-widest pb-2 px-2 transition-all flex items-center gap-2 ${
            activeTab === 'creatives'
              ? 'text-white border-b-2 border-sleek-violet'
              : 'text-white/40 hover:text-white'
          }`}
        >
          <Film size={14} />
          AI Concepts ({creatives.length})
        </button>
      </div>

      {/* Active Pipelines View */}
      {activeTab === 'pipelines' && (
        projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 px-4 text-center bg-sleek-dark/30 rounded-3xl border border-white/5">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-sleek-violet shadow-xl">
              <FolderOpen size={32} />
            </div>
            <div className="max-w-[280px]">
              <h3 className="text-lg font-black text-white mb-1">Your production pipeline is empty</h3>
              <p className="text-white/50 text-xs leading-relaxed">
                Generate an AI ad concept with viral hooks, or dispatch a verified creator crew on demand.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 mt-2 w-full max-w-xs">
              {onOpenCreate && (
                <button
                  type="button"
                  onClick={onOpenCreate}
                  className="flex-1 bg-sleek-violet hover:bg-purple-600 text-white py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-sleek-violet/25"
                >
                  <Sparkles size={14} /> Generate first concept
                </button>
              )}
              {onDispatchCreator && (
                <button
                  type="button"
                  onClick={onDispatchCreator}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Zap size={14} className="text-emerald-400" /> Dispatch a creator
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {projects.map((project, idx) => {
              const completedCount = project.milestones.filter(m => m.completed).length;
              const progressPct = project.milestones.length > 0 
                ? Math.round((completedCount / project.milestones.length) * 100) 
                : 0;
              const currentStageObj = STAGES.find(s => s.id === project.stage) || STAGES[0];

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  onClick={() => setSelectedProject(project)}
                  className="bg-sleek-dark border border-white/10 hover:border-sleek-violet/50 rounded-3xl p-5 cursor-pointer transition-all shadow-xl group hover:scale-[1.01]"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
                          {project.brandName}
                        </span>
                        <span className="text-white/20 text-xs">•</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-sleek-violet">
                          ₹{project.budget.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white group-hover:text-sleek-violet transition-colors">
                        {project.title}
                      </h3>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white ${currentStageObj.color}`}>
                      {currentStageObj.label}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 my-3">
                    <div className="flex justify-between text-[10px] font-bold text-white/50">
                      <span>Milestones Completed</span>
                      <span>{completedCount} / {project.milestones.length} ({progressPct}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-sleek-violet to-sleek-fuchsia rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer Metadata */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-3 text-xs text-white/60">
                    <div className="flex items-center gap-2">
                      {project.assignedCreator?.avatar ? (
                        <img 
                          src={project.assignedCreator.avatar} 
                          alt={project.assignedCreator.name} 
                          className="w-5 h-5 rounded-full object-cover border border-white/10" 
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                          🎬
                        </div>
                      )}
                      <span className="text-[11px] font-medium text-white/80">
                        {project.assignedCreator?.name || 'Assigning Crew...'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-sleek-violet font-bold text-xs">
                      Manage Project <ChevronRight size={14} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      )}

      {/* Creatives Tab View */}
      {activeTab === 'creatives' && (
        <div>
          {creatives.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 px-4 text-center bg-sleek-dark/30 rounded-3xl border border-white/5">
              <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center border border-white/5 shadow-xl">
                <Sparkles className="text-sleek-violet" size={28} />
              </div>
              <div className="max-w-[260px]">
                <h3 className="text-base font-bold text-white mb-1">Your production pipeline is empty</h3>
                <p className="text-zinc-500 text-xs">Generate ad concepts with scripts in Create, or dispatch an on-demand creator crew.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5 mt-2 w-full max-w-xs">
                {onOpenCreate && (
                  <button
                    type="button"
                    onClick={onOpenCreate}
                    className="flex-1 px-4 py-3 bg-sleek-violet text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-sleek-violet/25"
                  >
                    <Sparkles size={14} /> Generate first concept
                  </button>
                )}
                {onDispatchCreator && (
                  <button
                    type="button"
                    onClick={onDispatchCreator}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <Zap size={14} className="text-emerald-400" /> Dispatch a creator
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {creatives.map((creative, idx) => (
                <motion.div
                  key={creative.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative flex flex-col gap-2 cursor-pointer bg-sleek-dark p-2.5 rounded-2xl border border-white/5 hover:border-sleek-violet/50 transition-all"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-black">
                    <img
                      src={creative.imageUrls[0]}
                      alt={creative.prompt}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 opacity-90"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="px-1 py-1">
                    <h4 className="font-bold text-xs truncate leading-tight text-white/90">{creative.prompt}</h4>
                    <p className="text-[9px] text-white/40 font-mono mt-0.5">
                      {new Date(creative.createdAt).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => {
                        setNewTitle(creative.prompt.slice(0, 40));
                        setNewPrompt(creative.prompt);
                        setIsCreatingNew(true);
                      }}
                      className="w-full mt-2 py-1.5 bg-white/5 hover:bg-sleek-violet hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider text-white/70 transition-colors"
                    >
                      Convert to Project
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Project Detail Modal / Workspace */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col p-4 overflow-y-auto"
          >
            <div className="bg-sleek-dark border border-white/10 rounded-[32px] max-w-lg w-full mx-auto my-auto overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
              {/* Modal Top Bar */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-950/70">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <div>
                    <h2 className="text-sm font-bold text-white leading-tight truncate max-w-[240px]">
                      {selectedProject.title}
                    </h2>
                    <span className="text-[10px] text-white/40 font-mono uppercase">
                      {selectedProject.brandName} • ₹{selectedProject.budget.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Stage Progress Pills */}
              <div className="p-4 bg-zinc-900/40 border-b border-white/5 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Production Lifecycle Stage</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-sleek-violet">
                    Click stage to advance
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {STAGES.map((st, i) => {
                    const isCurrent = selectedProject.stage === st.id;
                    return (
                      <button
                        key={st.id}
                        onClick={() => handleStageChange(st.id)}
                        className={`py-1.5 px-1 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all text-center ${
                          isCurrent
                            ? 'bg-sleek-violet text-white shadow-lg shadow-sleek-violet/30 ring-1 ring-white/20 scale-105'
                            : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Workspace Navigation Tabs */}
              <div className="flex border-b border-white/5 bg-zinc-950/40 px-4">
                {[
                  { id: 'milestones', label: 'Milestones', icon: CheckSquare },
                  { id: 'chat', label: 'Escrow Chat', icon: MessageSquare },
                  { id: 'health', label: 'AI Health', icon: Activity },
                  { id: 'deliverables', label: 'Vault', icon: Video },
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = detailTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setDetailTab(tab.id as any)}
                      className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                        isActive
                          ? 'text-sleek-violet border-b-2 border-sleek-violet bg-white/5'
                          : 'text-white/40 hover:text-white'
                      }`}
                    >
                      <Icon size={12} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Workspace Body */}
              <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
                {/* 1. Milestones View */}
                {detailTab === 'milestones' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">Project Deliverable Gates</span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        {selectedProject.milestones.filter(m => m.completed).length} of {selectedProject.milestones.length} Cleared
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {selectedProject.milestones.map(milestone => (
                        <div
                          key={milestone.id}
                          onClick={() => handleToggleMilestone(milestone.id)}
                          className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                            milestone.completed
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                              : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                            milestone.completed ? 'bg-emerald-500 text-black' : 'border border-white/20'
                          }`}>
                            {milestone.completed && <CheckCircle2 size={14} className="text-black stroke-[3]" />}
                          </div>
                          <div className="flex-1">
                            <p className={`text-xs font-bold leading-tight ${milestone.completed ? 'line-through text-white/50' : 'text-white'}`}>
                              {milestone.title}
                            </p>
                            {milestone.dueDate && (
                              <span className="text-[9px] text-amber-400 font-mono">Due: {milestone.dueDate}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Creative Treatment Callout */}
                    {selectedProject.creativePrompt && (
                      <div className="mt-2 p-3.5 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-sleek-violet">Creative Treatment</span>
                        <p className="text-xs text-white/80 mt-1 leading-relaxed italic">
                          "{selectedProject.creativePrompt}"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Encrypted Anonymous Chat View */}
                {detailTab === 'chat' && (
                  <div className="flex flex-col h-[360px]">
                    {/* Privacy Banner */}
                    <div className="p-2.5 bg-sleek-violet/10 border border-sleek-violet/20 rounded-xl flex items-center gap-2 mb-3">
                      <Lock size={14} className="text-sleek-violet shrink-0" />
                      <p className="text-[10px] text-zinc-300 leading-tight">
                        Internal escrow communication. Phone numbers & external links are masked to protect intellectual property and release escrow funds.
                      </p>
                    </div>

                    {/* Message Stream */}
                    <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1">
                      {messages.map(msg => {
                        const isMe = msg.senderRole === 'client';
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                          >
                            <span className="text-[9px] font-bold text-white/40 mb-0.5 px-1">
                              {msg.senderName} ({msg.senderRole})
                            </span>
                            <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                              isMe 
                                ? 'bg-gradient-to-r from-sleek-violet to-purple-600 text-white rounded-br-none shadow-md' 
                                : 'bg-white/10 text-white rounded-bl-none border border-white/5'
                            }`}>
                              {msg.content}
                            </div>
                            <span className="text-[8px] text-white/30 px-1 mt-0.5 font-mono">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chat Input */}
                    <div className="pt-3 border-t border-white/5 flex gap-2 mt-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type message to production crew..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sleek-violet"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim()}
                        className="p-2.5 bg-sleek-violet text-white rounded-xl hover:scale-105 active:scale-95 disabled:opacity-40 transition-all"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. AI Project Health & Risk Monitor */}
                {detailTab === 'health' && (
                  <div className="flex flex-col gap-4">
                    <div className="bg-gradient-to-br from-zinc-900 to-black p-5 rounded-3xl border border-white/10 flex items-center justify-between shadow-xl">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">AI Health Index</span>
                        <div className="text-3xl font-black text-white mt-0.5 flex items-baseline gap-1">
                          {selectedProject.aiHealthScore ?? 90}
                          <span className="text-sm font-bold text-emerald-400">/ 100</span>
                        </div>
                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                          <ShieldCheck size={12} /> Low Delivery Risk
                        </p>
                      </div>

                      <button
                        onClick={handleRunAiAnalysis}
                        disabled={isAnalyzingHealth}
                        className="px-3.5 py-2 rounded-xl bg-sleek-violet text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-sleek-violet/20 hover:scale-105 active:scale-95 disabled:opacity-50"
                      >
                        <Sparkles size={12} className={isAnalyzingHealth ? 'animate-spin' : ''} />
                        {isAnalyzingHealth ? 'Analyzing...' : 'Run Gemini Audit'}
                      </button>
                    </div>

                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-sleek-violet">Gemini Production Insights</span>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {selectedProject.aiRiskAnalysis || 'Timeline adherence is steady. Studio and lighting crews are primed for scheduled milestone deadlines.'}
                      </p>
                    </div>

                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                      <CheckCircle2 className="text-emerald-400 shrink-0" size={18} />
                      <p className="text-[11px] text-emerald-300 leading-tight font-medium">
                        All escrow payments remain secured until final color master delivery is accepted.
                      </p>
                    </div>
                  </div>
                )}

                {/* 4. Deliverables Vault */}
                {detailTab === 'deliverables' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">Delivered Media & Master Assets</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setUploadModalOpen(true)}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                        >
                          <Plus size={11} /> Upload Asset
                        </button>
                        <span className="text-[10px] font-mono text-white/40">{selectedProject.deliverables.length} Assets</span>
                      </div>
                    </div>

                    {selectedProject.deliverables.length === 0 ? (
                      <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
                        <Video size={32} className="text-zinc-600" />
                        <p className="text-xs text-zinc-400">No deliverables uploaded yet for this stage.</p>
                        <p className="text-[10px] text-zinc-600">Raw cuts and final masters will appear here automatically.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {selectedProject.deliverables.map(asset => (
                          <div
                            key={asset.id}
                            className="p-3 bg-white/5 rounded-2xl border border-white/10 flex flex-col gap-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-sleek-violet">
                                  <Film size={18} />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-white leading-tight truncate max-w-[170px]">
                                    {asset.name}
                                  </p>
                                  <span className="text-[9px] text-white/40 font-mono">
                                    {asset.size || '4K UHD'} • {asset.uploadedAt}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <a
                                  href={asset.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-xl bg-white/10 hover:bg-sleek-violet text-white transition-colors"
                                  title="Download Asset"
                                >
                                  <Download size={14} />
                                </a>
                              </div>
                            </div>

                            {/* Status Badge & Client Action Buttons */}
                            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                              {asset.status === 'approved' ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                  <CheckCircle2 size={12} /> Approved by Client
                                </span>
                              ) : asset.status === 'revision_requested' ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="inline-flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md">
                                    Revision Requested
                                  </span>
                                  {asset.feedback && (
                                    <span className="text-[9px] text-amber-200/80 italic max-w-[200px] truncate">
                                      "{asset.feedback}"
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-white/40 font-medium">Pending Client Sign-Off</span>
                              )}

                              {/* Review Actions */}
                              {asset.status !== 'approved' && (
                                <div className="flex items-center gap-1.5 ml-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRevisionModal(asset)}
                                    className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all"
                                  >
                                    Request Revision
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveDeliverable(asset.id)}
                                    className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                                  >
                                    <CheckCircle2 size={11} /> Approve
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Project Modal */}
      <AnimatePresence>
        {isCreatingNew && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-sleek-dark border border-white/10 rounded-[32px] max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-base font-bold text-white">Initialize Production Project</h3>
                <button 
                  onClick={() => setIsCreatingNew(false)}
                  className="p-1 rounded-full text-white/40 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">
                    Project Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Monsoon Bangalore Streetwear Reel"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-sleek-violet"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">
                    Brand / Client Name
                  </label>
                  <input
                    type="text"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    placeholder="e.g. Veloce Streetwear"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-sleek-violet"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">
                    Target Budget (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={newBudget}
                    onChange={(e) => setNewBudget(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-sleek-violet"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">
                    Creative Vision / Prompt
                  </label>
                  <textarea
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    placeholder="Describe tone, gear, lenses, lighting preferences..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-sleek-violet h-20 resize-none"
                  />
                </div>
              </div>

              <button
                onClick={handleCreateProject}
                disabled={!newTitle.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-sleek-violet to-sleek-fuchsia text-white rounded-2xl font-bold text-xs uppercase tracking-wider mt-2 disabled:opacity-40 hover:brightness-110 active:scale-[0.98] transition-all"
              >
                Create Managed Pipeline
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Revision Request Modal */}
      <AnimatePresence>
        {revisionModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-sleek-dark border border-white/10 rounded-[32px] max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-base font-bold text-white">Request Asset Revision</h3>
                <button 
                  onClick={() => setRevisionModalOpen(false)}
                  className="p-1 rounded-full text-white/40 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="text-xs space-y-2">
                <p className="text-white/60">
                  Provide specific notes for the creative editor & colorist regarding changes needed in <span className="text-white font-bold">{targetDeliverable?.name}</span>.
                </p>
                <textarea
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="e.g. Please trim intro by 1.5s, brighten skin tones in second scene, and increase bass punch on final drop."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400 h-28 resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRevisionModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitRevision}
                  disabled={!revisionNotes.trim()}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-black text-xs uppercase tracking-wider disabled:opacity-40"
                >
                  Send Revision Request
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Deliverable Modal */}
      <AnimatePresence>
        {uploadModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-sleek-dark border border-white/10 rounded-[32px] max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-base font-bold text-white">Upload New Asset / Cut</h3>
                <button 
                  onClick={() => setUploadModalOpen(false)}
                  className="p-1 rounded-full text-white/40 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="text-xs space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">
                    Asset Title / Version
                  </label>
                  <input
                    type="text"
                    value={newDeliverableName}
                    onChange={(e) => setNewDeliverableName(e.target.value)}
                    placeholder="e.g. Master_4K_Reel_v2_ColorGraded.mp4"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-sleek-violet"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">
                    Asset / Cloud Storage URL
                  </label>
                  <input
                    type="url"
                    value={newDeliverableUrl}
                    onChange={(e) => setNewDeliverableUrl(e.target.value)}
                    placeholder="https://drive.google.com/... or media url"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-sleek-violet"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">
                    Asset Type
                  </label>
                  <select
                    value={newDeliverableType}
                    onChange={(e: any) => setNewDeliverableType(e.target.value)}
                    className="w-full bg-sleek-dark border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-sleek-violet"
                  >
                    <option value="video">Video Master / Draft</option>
                    <option value="image">Still / Storyframe / Thumbnail</option>
                    <option value="script">Script / Shotlist</option>
                    <option value="brief">Technical Production Brief</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddNewDeliverable}
                  disabled={!newDeliverableName.trim() || !newDeliverableUrl.trim()}
                  className="flex-1 py-3 bg-sleek-violet hover:bg-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-40"
                >
                  Upload & Notify Client
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
