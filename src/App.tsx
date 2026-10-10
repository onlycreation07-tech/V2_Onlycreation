/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, lazy } from 'react';
import { View, AdCreative, BrandProfile, AIAgentId } from './types';
import TopNavbar from './components/layout/TopNavbar';
import AppDrawer from './components/layout/AppDrawer';
import BottomNav from './components/layout/BottomNav';

// Creation AI V2 Primary Workspaces
import CreationAIChat from './components/chat/CreationAIChat';
const AIStudioSuite = lazy(() => import('./components/studio/AIStudioSuite'));
const AITeamHub = lazy(() => import('./components/agents/AITeamHub'));
const ContentCalendarScreen = lazy(() => import('./components/calendar/ContentCalendarScreen'));
const AssetLibraryScreen = lazy(() => import('./components/library/AssetLibraryScreen'));
const ProjectsScreen = lazy(() => import('./components/projects/ProjectsScreen'));
const ProfileScreen = lazy(() => import('./components/profile/ProfileScreen'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
import LoginScreen from './components/auth/LoginScreen';

// Legacy Marketplace Views (Preserved & accessible via feature flag)
const HomeScreen = lazy(() => import('./components/home/HomeScreen'));
const CreateScreen = lazy(() => import('./components/create/CreateScreen'));
const StudiosScreen = lazy(() => import('./components/studios/StudiosScreen'));
const BillboardRequestScreen = lazy(() => import('./components/billboards/BillboardRequestScreen'));
const CreatorDispatchScreen = lazy(() => import('./components/dispatch/CreatorDispatchScreen'));
const PartnerPortal = lazy(() => import('./components/partner/PartnerPortal'));

import { AuthProvider, useAuth } from './context/AuthContext';
import { BackgroundTaskProvider } from './context/BackgroundTaskContext';
import { validateConnection } from './lib/firebase';
import { dbService } from './services/dbService';
import { RefreshCw } from 'lucide-react';

function AppContent() {
  const { user, loading, isAdmin } = useAuth();
  
  // Default primary view is Creation AI conversational workspace
  const [currentView, setCurrentView] = useState<View>('chat');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showLegacyMarketplace, setShowLegacyMarketplace] = useState(() => {
    return import.meta.env.DEV && localStorage.getItem('creation_ai_legacy_marketplace') === 'true';
  });

  const [creatives, setCreatives] = useState<AdCreative[]>([]);
  const [activeCreative, setActiveCreative] = useState<AdCreative | null>(null);
  const [studioCategory, setStudioCategory] = useState<'all' | 'photography' | 'video' | 'music' | 'podcast' | 'billboard' | 'liked'>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [studioInitialTab, setStudioInitialTab] = useState<any>('campaign');
  const [studioInitialPrompt, setStudioInitialPrompt] = useState<string>('');
  const [agentsInitialAgentId, setAgentsInitialAgentId] = useState<AIAgentId>('ketan-growth');

  const [brandProfile, setBrandProfile] = useState<BrandProfile>({
    name: 'Your Brand',
    industry: 'Lifestyle',
    targetAudience: 'General',
    tone: 'Professional',
    primaryColor: '#7C3AED',
    fontVibe: 'minimal',
  });

  useEffect(() => {
    validateConnection();
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      setShowLegacyMarketplace(import.meta.env.DEV && localStorage.getItem('creation_ai_legacy_marketplace') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setCreatives([]);
    setActiveCreative(null);
    setBrandProfile({ name: 'Your Brand', industry: 'Lifestyle', targetAudience: 'General', tone: 'Professional', primaryColor: '#7C3AED', fontVibe: 'minimal' });
    if ((user as any)?.isPartner && showLegacyMarketplace) {
      setCurrentView('partner');
    }
    if (user?.uid) {
      dbService.getBrand(user.uid).then(saved => {
        if (saved && !cancelled) {
          setBrandProfile(prev => ({ ...prev, ...saved }));
        }
      }).catch(e => console.warn("Could not load user brand:", e));

      dbService.getUserCreatives(user.uid).then(userCreatives => {
        if (userCreatives && !cancelled) {
          setCreatives(userCreatives);
        }
      }).catch(e => console.warn("Could not load user creatives:", e));
    }
    return () => { cancelled = true; };
  }, [user]);

  const handleCreativeGenerated = (creative: AdCreative) => {
    setCreatives([creative, ...creatives]);
    setActiveCreative(creative);
  };

  const handleProduceAd = (creative: AdCreative) => {
    setActiveCreative(creative);
    setCurrentView('studio');
  };

  const handleConvertToProject = async (creative: AdCreative) => {
    try {
      const title = creative.prompt 
        ? creative.prompt.slice(0, 42).trim() + (creative.prompt.length > 42 ? '...' : '') 
        : 'AI Commercial Concept';

      const newProjectId = await dbService.createProject({
        userId: user?.uid || 'guest_user',
        title,
        brandName: brandProfile.name || 'Brand Studio',
        stage: 'ideation',
        budget: 25000,
        creativePrompt: creative.videoScript 
          ? `${creative.prompt}\n\n[VIRAL SCRIPT]:\n${creative.videoScript}` 
          : creative.prompt,
        assignedCreator: {
          name: 'Creation AI Engine',
          role: 'Lead Cinematographer & Editor',
          handle: '@creation.ai'
        },
        milestones: [
          { id: `m_${Date.now()}_1`, title: 'Concept Hook & Script Breakdown Approved', completed: true },
          { id: `m_${Date.now()}_2`, title: 'Visual Generation (Studio Pass)', completed: false, dueDate: 'In 2 days' },
          { id: `m_${Date.now()}_3`, title: 'Voiceover & Audio Synthesis Pass', completed: false, dueDate: 'In 4 days' },
          { id: `m_${Date.now()}_4`, title: 'Final Review & 4K Export', completed: false, dueDate: 'In 6 days' }
        ],
        deliverables: (creative.imageUrls && creative.imageUrls.length > 0) ? [
          {
            id: `del_${Date.now()}`,
            name: 'Concept_Visual_Storyframe.jpg',
            url: creative.imageUrls[0],
            type: 'image',
            uploadedAt: 'Today',
            size: '3.4 MB'
          }
        ] : [],
        aiHealthScore: 98,
        aiRiskAnalysis: 'Fresh concept generated via Creation AI engine. On track for production.'
      });

      setSelectedProjectId(newProjectId);
      setCurrentView('projects');
    } catch (e) {
      console.warn("Could not save project to Firestore:", e);
      setCurrentView('projects');
    }
  };

  const handleToggleLike = (studioId: string) => {
    const currentLikes = brandProfile.likedStudioIds || [];
    const isLiked = currentLikes.includes(studioId);
    const newLikes = isLiked
      ? currentLikes.filter(id => id !== studioId)
      : [...currentLikes, studioId];
    
    const updatedProfile = { ...brandProfile, likedStudioIds: newLikes };
    setBrandProfile(updatedProfile);
    
    if (user) {
      dbService.saveBrand(user.uid, updatedProfile as any).catch(err => {
        console.error("Failed to persist likes:", err);
      });
    }
  };

  const handleToggleLegacyMarketplace = (enabled: boolean) => {
    setShowLegacyMarketplace(import.meta.env.DEV && enabled);
    localStorage.setItem('creation_ai_legacy_marketplace', String(enabled));
  };

  const handleOpenStudio = (tab = 'campaign', prompt = '') => {
    setStudioInitialTab(tab);
    setStudioInitialPrompt(prompt);
    setCurrentView('studio');
  };

  const handleOpenAgents = (agentId?: AIAgentId) => {
    if (agentId) setAgentsInitialAgentId(agentId);
    setCurrentView('agents');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sleek-black flex items-center justify-center">
        <RefreshCw className="animate-spin text-sleek-violet" size={40} />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  // If partner portal is active in legacy mode, render dedicated full-width interface
  if (currentView === 'partner' && showLegacyMarketplace) {
    return (
      <div className="min-h-screen bg-sleek-black text-white font-sans selection:bg-sleek-violet selection:text-white">
        <PartnerPortal onSwitchToClientMode={() => setCurrentView('chat')} />
      </div>
    );
  }

  const renderSecondaryView = () => {
    switch (currentView) {
      case 'calendar':
        return (
          <ContentCalendarScreen
            brandProfile={brandProfile}
            onCreateContentPrompt={(prompt) => {
              setCurrentView('chat');
            }}
          />
        );

      case 'library':
        return (
          <AssetLibraryScreen
            brandProfile={brandProfile}
            creatives={creatives}
            onOpenStudio={() => setCurrentView('studio')}
          />
        );

      case 'profile':
        return (
          <ProfileScreen 
            brandProfile={brandProfile} 
            onUpdateBrand={setBrandProfile} 
            onNavigateToLiked={() => {
              setStudioCategory('liked');
              setCurrentView('studios');
            }}
            onNavigateToProjects={() => setCurrentView('projects')}
            onNavigateToPartner={() => setCurrentView('partner')}
          />
        );

      case 'admin':
        return isAdmin ? <AdminDashboard /> : null;

      case 'home':
        return (
          <HomeScreen 
            onUseTemplate={(p) => setCurrentView('studio')} 
            onExploreBillboards={() => setCurrentView('billboards')}
            onLaunchDispatch={() => setCurrentView('dispatch')}
            onNavigateToStudios={() => setCurrentView('studios')}
            onNavigateToProfile={() => setCurrentView('profile')}
            onNavigateToPartner={() => setCurrentView('partner')}
            brandName={brandProfile.name}
            brandProfile={brandProfile}
          />
        );

      case 'create':
        return (
          <CreateScreen 
            onGenerated={handleCreativeGenerated} 
            onProduce={handleProduceAd} 
            onLaunchDispatch={() => setCurrentView('dispatch')}
            onConvertToProject={handleConvertToProject}
            brandProfile={brandProfile}
          />
        );

      case 'studios':
        return (
          <StudiosScreen 
            activeCreative={activeCreative} 
            brandProfile={brandProfile} 
            onToggleLike={handleToggleLike}
            initialCategory={studioCategory}
            onExploreCreate={() => setCurrentView('studio')}
            onViewProjects={() => setCurrentView('projects')}
          />
        );

      case 'dispatch':
        return (
          <CreatorDispatchScreen 
            brandProfile={brandProfile} 
            onBackToHome={() => setCurrentView('chat')} 
          />
        );

      case 'billboards':
        return <BillboardRequestScreen onBack={() => setCurrentView('chat')} />;

      default:
        return null;
    }
  };

  const isPrimaryWarmTab = ['chat', 'studio', 'agents', 'projects', 'calendar', 'library'].includes(currentView);

  return (
    <div className="min-h-screen bg-sleek-black text-white font-sans selection:bg-sleek-violet selection:text-white flex flex-col">
      {/* Top Navigation Bar */}
      <TopNavbar
        currentView={currentView}
        onViewChange={setCurrentView}
        onToggleDrawer={() => setIsDrawerOpen(prev => !prev)}
        onNewChat={() => setCurrentView('chat')}
        brandProfile={brandProfile}
      />

      {/* Slide-out Navigation Drawer */}
      <AppDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentView={currentView}
        onViewChange={setCurrentView}
        onNewChat={() => setCurrentView('chat')}
        brandProfile={brandProfile}
        showLegacyMarketplace={showLegacyMarketplace}
        onToggleLegacyMarketplace={handleToggleLegacyMarketplace}
      />

      {/* Main Workspace Frame with Warm-Tab Keep-Alive Architecture */}
      <main className="flex-1 w-full max-w-7xl mx-auto h-[calc(100vh-65px)] overflow-hidden pb-16 sm:pb-0 relative">
        {/* 1. Warm Tab: Creation AI Chat */}
        <div className={`h-full w-full ${currentView === 'chat' ? 'block' : 'hidden'}`}>
          <CreationAIChat
            brandProfile={brandProfile}
            onOpenStudio={handleOpenStudio}
            onOpenAgents={handleOpenAgents}
            onOpenProjects={() => setCurrentView('projects')}
            onConvertToProject={handleConvertToProject}
          />
        </div>

        {/* 2. Warm Tab: AI Studio Creative Suite (Keeps Veo video renders & image generators running) */}
        <div className={`h-full w-full ${currentView === 'studio' ? 'block' : 'hidden'}`}>
          <AIStudioSuite
            brandProfile={brandProfile}
            initialTab={studioInitialTab}
            initialPrompt={studioInitialPrompt}
            onCreativeGenerated={handleCreativeGenerated}
            onProduceCreative={handleProduceAd}
            onConvertToProject={handleConvertToProject}
            onOpenProjects={() => setCurrentView('projects')}
          />
        </div>

        {/* 3. Warm Tab: AI Team Hub (Keeps Ketan Google AI Search tasks running) */}
        <div className={`h-full w-full ${currentView === 'agents' ? 'block' : 'hidden'}`}>
          <AITeamHub
            brandProfile={brandProfile}
            initialAgentId={agentsInitialAgentId}
            onNavigateToStudio={handleOpenStudio}
            onNavigateToChat={() => setCurrentView('chat')}
          />
        </div>

        {/* 4. Warm Tab: My Projects */}
        <div className={`h-full w-full ${currentView === 'projects' ? 'block' : 'hidden'}`}>
          <ProjectsScreen 
            creatives={creatives} 
            onOpenCreate={() => setCurrentView('studio')}
            onDispatchCreator={() => setCurrentView('dispatch')}
            initialProjectId={selectedProjectId}
          />
        </div>

        {/* 5. Warm Tab: Content Calendar */}
        <div className={`h-full w-full ${currentView === 'calendar' ? 'block' : 'hidden'}`}>
          <ContentCalendarScreen
            brandProfile={brandProfile}
            onCreateContentPrompt={() => setCurrentView('chat')}
          />
        </div>

        {/* 6. Warm Tab: Asset Library */}
        <div className={`h-full w-full ${currentView === 'library' ? 'block' : 'hidden'}`}>
          <AssetLibraryScreen
            brandProfile={brandProfile}
            creatives={creatives}
            onOpenStudio={() => setCurrentView('studio')}
          />
        </div>

        {/* Secondary / Modal / Legacy Views */}
        {!isPrimaryWarmTab && (
          <div className="h-full w-full overflow-y-auto">
            {renderSecondaryView()}
          </div>
        )}
      </main>

      {/* Mobile Thumb Navigation */}
      <BottomNav currentView={currentView} onViewChange={setCurrentView} />

      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BackgroundTaskProvider>
        <AppContent />
      </BackgroundTaskProvider>
    </AuthProvider>
  );
}
