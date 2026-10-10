import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Camera, 
  Video, 
  Music, 
  FileText, 
  Mic, 
  Layers, 
  Radio, 
  FolderPlus,
  Play,
  ArrowRight,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  X
} from 'lucide-react';
import { AdCreative, BrandProfile } from '../../types';
import ImageStudio from '../create/ImageStudio';
import VeoVideoStudio from '../create/VeoVideoStudio';
import MusicStudio from '../create/MusicStudio';
import AudioTranscriber from '../create/AudioTranscriber';
import AIProductionBriefEngine from '../create/AIProductionBriefEngine';
import LiveVoiceRoom from '../create/LiveVoiceRoom';
import CreateScreen from '../create/CreateScreen';
import { backgroundTaskService, BackgroundTask } from '../../services/backgroundTaskService';

interface AIStudioSuiteProps {
  brandProfile: BrandProfile;
  initialTab?: StudioSectionTab;
  initialPrompt?: string;
  onCreativeGenerated: (creative: AdCreative) => void;
  onProduceCreative: (creative: AdCreative) => void;
  onConvertToProject?: (creative: AdCreative) => void;
  onOpenProjects: () => void;
}

export type StudioSectionTab = 
  | 'campaign' 
  | 'images' 
  | 'veo_video' 
  | 'music' 
  | 'audio_voice' 
  | 'brief_engine';

const STUDIO_TABS: Array<{ id: StudioSectionTab; label: string; icon: any; desc: string }> = [
  { id: 'campaign', label: 'Campaign Engine', icon: Sparkles, desc: 'Full-funnel commercial concepts & scripts' },
  { id: 'images', label: 'Image Studio', icon: Camera, desc: 'Studio photography & commercial visual assets' },
  { id: 'veo_video', label: 'Veo Video Studio', icon: Video, desc: 'Cinematic video generation with Google Veo' },
  { id: 'music', label: 'Music Studio', icon: Music, desc: 'Soundtrack & soundtrack mood generation' },
  { id: 'audio_voice', label: 'Audio & Voice', icon: Mic, desc: 'Speech narration & audio transcription' },
  { id: 'brief_engine', label: 'Brief Engine', icon: FileText, desc: 'Technical studio briefs, lighting & shot lists' },
];

export default function AIStudioSuite({
  brandProfile,
  initialTab = 'campaign',
  initialPrompt = '',
  onCreativeGenerated,
  onProduceCreative,
  onConvertToProject,
  onOpenProjects
}: AIStudioSuiteProps) {
  const [activeTab, setActiveTab] = useState<StudioSectionTab>(initialTab);
  const [studioTasks, setStudioTasks] = useState<BackgroundTask[]>([]);

  useEffect(() => {
    const unsubscribe = backgroundTaskService.subscribe(() => {
      setStudioTasks(backgroundTaskService.getStudioTasks());
    });
    return unsubscribe;
  }, []);

  const runningStudioTasks = studioTasks.filter(t => t.status === 'RUNNING' || t.status === 'PENDING');
  const recentCompletedTasks = studioTasks.filter(t => t.status === 'COMPLETED').slice(0, 2);

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto px-4 py-3">
      {/* Studio Header & Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-sleek-violet/20 text-sleek-violet">
              <Sparkles size={18} />
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              AI Studio
            </h1>
          </div>
          <p className="text-xs md:text-sm text-white/50">
            Unified creative production suite for images, cinematic video reels, music, and agency briefs.
          </p>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 hide-scrollbar bg-sleek-zinc p-1 rounded-xl border border-white/10 shrink-0">
          {STUDIO_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-sleek-violet text-white shadow-xs'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Background Tasks Active Progress Strip (Only rendered inside Studio screen per user requirement) */}
      {runningStudioTasks.length > 0 && (
        <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-blue-950/40 via-purple-950/40 to-black/60 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <RefreshCw size={14} className="animate-spin" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">
                  Active Background Generation ({runningStudioTasks.length})
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                  {runningStudioTasks[0].type.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-white/60 truncate max-w-md">
                {runningStudioTasks[0].title} — {runningStudioTasks[0].progress || 25}% rendered
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Progress Bar */}
            <div className="w-24 bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-400 to-sleek-violet h-full transition-all duration-500 rounded-full"
                style={{ width: `${runningStudioTasks[0].progress || 25}%` }}
              />
            </div>

            {runningStudioTasks[0].type === 'video_generation' && (
              <button
                onClick={() => setActiveTab('veo_video')}
                className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>View Veo Studio</span>
                <ArrowRight size={11} />
              </button>
            )}
            {runningStudioTasks[0].type === 'image_batch' && (
              <button
                onClick={() => setActiveTab('images')}
                className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>View Image Studio</span>
                <ArrowRight size={11} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab Canvas Area — Keep Warm Architecture: All Studio Sub-Tabs Stay Mounted */}
      <div className="flex-1 overflow-y-auto mt-4 hide-scrollbar relative">
        {/* 1. Campaign Engine */}
        <div className={activeTab === 'campaign' ? 'block' : 'hidden'}>
          <CreateScreen
            brandProfile={brandProfile}
            onGenerated={onCreativeGenerated}
            onProduce={onProduceCreative}
            onConvertToProject={onConvertToProject}
            initialTab="campaign"
          />
        </div>

        {/* 2. Image Studio */}
        <div className={activeTab === 'images' ? 'block' : 'hidden'}>
          <ImageStudio 
            onAnimateWithVeo={(img) => {
              setActiveTab('veo_video');
            }} 
          />
        </div>

        {/* 3. Veo Video Studio (Preserved and keeps rendering in background) */}
        <div className={activeTab === 'veo_video' ? 'block' : 'hidden'}>
          <VeoVideoStudio />
        </div>

        {/* 4. Music Studio */}
        <div className={activeTab === 'music' ? 'block' : 'hidden'}>
          <MusicStudio />
        </div>

        {/* 5. Audio & Voice Room */}
        <div className={activeTab === 'audio_voice' ? 'block' : 'hidden'}>
          <div className="space-y-6">
            <AudioTranscriber />
            <LiveVoiceRoom />
          </div>
        </div>

        {/* 6. Technical Brief Engine */}
        <div className={activeTab === 'brief_engine' ? 'block' : 'hidden'}>
          <AIProductionBriefEngine 
            brandProfile={brandProfile}
            onConvertToProject={onConvertToProject}
          />
        </div>
      </div>
    </div>
  );
}
