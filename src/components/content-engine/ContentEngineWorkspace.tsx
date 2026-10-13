import React, { useState, useRef, useEffect } from 'react';
import { 
  Home,
  Search,
  SlidersHorizontal,
  Plus,
  HelpCircle,
  Settings,
  MoreVertical,
  LayoutGrid,
  User,
  Clapperboard,
  Sparkles,
  Trash2,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  Edit3,
  X,
  Play, 
  Pause, 
  Scissors, 
  Download, 
  Upload, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Layers, 
  FileText, 
  Video, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  RotateCcw, 
  ChevronRight, 
  FolderPlus,
  Eye,
  Sliders,
  Type,
  ArrowRight,
  Film,
  Paperclip,
  Check,
  Folder,
  BookOpen,
  Scroll,
  Info
} from 'lucide-react';
import { 
  BrandProfile, 
  VideoClipSegment, 
  VideoAuditReport,
  AdCreative
} from '../../types';

interface ContentEngineWorkspaceProps {
  brandProfile: BrandProfile;
  initialMode?: 'generate' | 'edit' | 'clipping' | 'analysis';
  onClose?: () => void;
  onConvertToProject?: (creative: AdCreative) => void;
}

interface MediaAsset {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio';
  url: string;
  duration?: number;
  aspectRatio: '16:9' | '9:16' | '1:1';
  createdAt: string;
  fileSize?: string;
}

interface StoryboardScene {
  id: string;
  sceneNumber: number;
  timeRange: string;
  shotType: string;
  cameraMovement: string;
  visualPrompt: string;
  voiceoverOrAudio: string;
  status: 'draft' | 'ready' | 'rendering' | 'completed';
}

interface FlowCharacter {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  consistencyPrompt: string;
}

// Minimalist Google Flow Geometric Pixel Flower Icon
const FlowFlowerIcon = () => (
  <svg 
    width="54" 
    height="54" 
    viewBox="0 0 32 32" 
    fill="currentColor" 
    className="text-white/80"
    style={{ shapeRendering: 'crispEdges' }}
  >
    {/* Center 2x2 hollow square */}
    <rect x="14" y="9" width="4" height="4" fill="none" stroke="currentColor" strokeWidth="1.2" />
    {/* Top Petal */}
    <rect x="13" y="2" width="6" height="4" fill="none" stroke="currentColor" strokeWidth="1.2" />
    {/* Bottom Petal */}
    <rect x="13" y="16" width="6" height="4" fill="none" stroke="currentColor" strokeWidth="1.2" />
    {/* Left Petal */}
    <rect x="7" y="8" width="4" height="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
    {/* Right Petal */}
    <rect x="21" y="8" width="4" height="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
    {/* Top-Left Diagonal Petal */}
    <rect x="9" y="4" width="4" height="4" fill="none" stroke="currentColor" strokeWidth="1.2" />
    {/* Top-Right Diagonal Petal */}
    <rect x="19" y="4" width="4" height="4" fill="none" stroke="currentColor" strokeWidth="1.2" />
    {/* Bottom-Left Diagonal Petal */}
    <rect x="9" y="14" width="4" height="4" fill="none" stroke="currentColor" strokeWidth="1.2" />
    {/* Bottom-Right Diagonal Petal */}
    <rect x="19" y="14" width="4" height="4" fill="none" stroke="currentColor" strokeWidth="1.2" />
    {/* Stem */}
    <line x1="16" y1="20" x2="16" y2="30" stroke="currentColor" strokeWidth="1.5" />
    {/* Left leaf */}
    <line x1="16" y1="25" x2="12" y2="23" stroke="currentColor" strokeWidth="1.5" />
    <line x1="12" y1="23" x2="11" y2="25" stroke="currentColor" strokeWidth="1.5" />
    {/* Right leaf */}
    <line x1="16" y1="24" x2="20" y2="22" stroke="currentColor" strokeWidth="1.5" />
    <line x1="20" y1="22" x2="21" y2="24" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export default function ContentEngineWorkspace({
  brandProfile,
  initialMode = 'generate',
  onClose,
  onConvertToProject
}: ContentEngineWorkspaceProps) {
  // Navigation & View States
  const [activeSidebarTab, setActiveSidebarTab] = useState<'media' | 'characters' | 'scenes' | 'tools'>(
    initialMode === 'clipping' || initialMode === 'edit' || initialMode === 'analysis' ? 'tools' : 'media'
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [sessionTitle, setSessionTitle] = useState('Untitled session');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Active Tool Sub-Tab (when activeSidebarTab === 'tools')
  const [activeTool, setActiveTool] = useState<'edit' | 'clipping' | 'analysis'>(
    initialMode === 'clipping' ? 'clipping' : initialMode === 'analysis' ? 'analysis' : 'edit'
  );

  // Media Library State
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([
    {
      id: 'asset-sample-1',
      name: 'Sample Footage (16:9)',
      type: 'video',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      duration: 15,
      aspectRatio: '16:9',
      createdAt: 'Just now',
      fileSize: '4.2 MB'
    }
  ]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Characters State (Google Flow consistent character casting)
  const [characters, setCharacters] = useState<FlowCharacter[]>([
    {
      id: 'char-1',
      name: 'Marcus Vance',
      role: 'Tech Executive / Presenter',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      consistencyPrompt: 'Charismatic 30s executive, navy tailored jacket, confident delivery, warm natural studio light'
    },
    {
      id: 'char-2',
      name: 'Elena Rostova',
      role: 'Creative Director / Designer',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      consistencyPrompt: 'Minimalist designer, architectural aesthetic, dark turtleneck, precise hand gestures'
    }
  ]);

  // Storyboard Scenes State
  const [storyboardScenes, setStoryboardScenes] = useState<StoryboardScene[]>([
    {
      id: 'scene-1',
      sceneNumber: 1,
      timeRange: '00:00 - 00:03',
      shotType: 'Extreme Close Up',
      cameraMovement: 'Macro push-in with light flare',
      visualPrompt: 'Luxury product dial with laser reflection and brushed metal surface',
      voiceoverOrAudio: 'Precision isn’t just engineered. It’s felt.',
      status: 'completed'
    },
    {
      id: 'scene-2',
      sceneNumber: 2,
      timeRange: '00:03 - 00:07',
      shotType: 'Medium Tracking Shot',
      cameraMovement: 'Smooth lateral dolly right',
      visualPrompt: 'Executive in glass studio checking device notification amidst morning skyline',
      voiceoverOrAudio: 'Designed for high performers who demand instantaneous clarity.',
      status: 'ready'
    },
    {
      id: 'scene-3',
      sceneNumber: 3,
      timeRange: '00:07 - 00:10',
      shotType: 'Wide Hero Climax',
      cameraMovement: 'Fast dynamic zoom-out with motion blur',
      visualPrompt: 'Hero packshot with kinetic typography overlay and subtle glow',
      voiceoverOrAudio: 'Experience OnlyCreation Flow today.',
      status: 'draft'
    }
  ]);

  // Active Video Player State
  const activeMedia = mediaAssets.find(m => m.id === selectedAssetId) || (mediaAssets.length > 0 ? mediaAssets[0] : null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(15);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Chat / Assistant Session State
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    sender: 'user' | 'assistant';
    text: string;
    timestamp: string;
    mediaUrl?: string;
    isGenerating?: boolean;
    jobStatus?: string;
  }>>([]);
  const [promptInput, setPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationJobStatus, setGenerationJobStatus] = useState<string | null>(null);

  // Generation Parameters (accessible via sliders button)
  const [genDuration, setGenDuration] = useState<number>(10);
  const [genFormat, setGenFormat] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [genCameraMotion, setGenCameraMotion] = useState('Dynamic Cinematic Push');
  const [showParamMenu, setShowParamMenu] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Editing Tool State
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(15);
  const [editAspectRatio, setEditAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [editCaption, setEditCaption] = useState('OnlyCreation Flow: Next-Gen Video Production');
  const [editVolume, setEditVolume] = useState<number>(100);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [versionHistory, setVersionHistory] = useState<Array<{
    versionName: string;
    duration: number;
    exportedAt: string;
    aspectRatio: string;
  }>>([
    { versionName: 'Original Master Cut', duration: 15, exportedAt: '10:00 AM', aspectRatio: '16:9' }
  ]);

  // Clipping Tool State
  const [isSuggestingClips, setIsSuggestingClips] = useState(false);
  const [suggestedClips, setSuggestedClips] = useState<VideoClipSegment[]>([]);
  const [selectedClip, setSelectedClip] = useState<VideoClipSegment | null>(null);

  // Video Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [auditReport, setAuditReport] = useState<VideoAuditReport | null>(null);

  // Video playback metadata handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = Math.round(videoRef.current.duration) || 15;
      setVideoDuration(dur);
      setTrimEnd(dur);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (activeSidebarTab === 'tools' && activeTool === 'edit' && videoRef.current.currentTime >= trimEnd) {
        videoRef.current.currentTime = trimStart;
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Upload custom file handler
  const processUploadedFile = (file: File) => {
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');

    const url = URL.createObjectURL(file);
    const newAsset: MediaAsset = {
      id: `asset-${Date.now()}`,
      name: file.name,
      type: isVideo ? 'video' : isImage ? 'image' : 'audio',
      url,
      duration: isVideo ? 15 : undefined,
      aspectRatio: '16:9',
      createdAt: 'Just now',
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    };

    setMediaAssets(prev => [newAsset, ...prev]);
    setSelectedAssetId(newAsset.id);
    setIsPlaying(false);
    setToastMessage({ text: `Imported asset: ${file.name}`, type: 'success' });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUploadedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processUploadedFile(file);
  };

  // Quick Action Handlers
  const handleActionStoryboard = async () => {
    const userPrompt = 'Develop a cinematic 3-scene video storyboard for our flagship brand campaign.';
    setChatMessages(prev => [
      ...prev,
      { id: `msg-${Date.now()}`, sender: 'user', text: userPrompt, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setActiveSidebarTab('scenes');
    setToastMessage({ text: 'Storyboard initialized. Reviewing scenes and camera paths.', type: 'success' });
  };

  const handleActionRenameAssets = () => {
    setMediaAssets(prev => prev.map((asset, index) => ({
      ...asset,
      name: `Shot_${String(index + 1).padStart(2, '0')}_Master_${asset.aspectRatio.replace(':', 'x')}`
    })));
    setToastMessage({ text: 'Assets reorganized with production shot naming convention.', type: 'success' });
  };

  const handleActionTeachMe = () => {
    setShowHelpModal(true);
  };

  // Main Prompt Generation Handler
  const handleSendPrompt = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || promptInput).trim();
    if (!promptToSend) return;

    const userMsgId = `msg-${Date.now()}`;
    const assistantMsgId = `msg-${Date.now() + 1}`;

    setChatMessages(prev => [
      ...prev,
      { 
        id: userMsgId, 
        sender: 'user', 
        text: promptToSend, 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      },
      {
        id: assistantMsgId,
        sender: 'assistant',
        text: 'Generating scene storyboard and queuing Veo 3.1 video render...',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isGenerating: true,
        jobStatus: 'Processing prompt & camera motion parameters...'
      }
    ]);
    setPromptInput('');
    setIsGenerating(true);
    setGenerationJobStatus('Formulating scene storyboard and shot directions...');

    try {
      const res = await fetch('/api/content-engine/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: promptToSend,
          targetAudience: brandProfile.targetAudience || 'Modern premium audience',
          duration: genDuration,
          language: 'English',
          format: genFormat,
          references: genCameraMotion
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Video generation failed');

      // Update assistant message with result
      setChatMessages(prev => prev.map(m => m.id === assistantMsgId ? {
        ...m,
        text: `Completed video generation (${genDuration}s, ${genFormat}). Script & storyboard rendered.`,
        isGenerating: false,
        jobStatus: 'Render completed'
      } : m));

      // Add newly generated asset to All media
      const generatedAsset: MediaAsset = {
        id: `gen-${Date.now()}`,
        name: `Veo_${genFormat.replace(':', 'x')}_${promptToSend.slice(0, 20)}...`,
        type: 'video',
        url: data.videoUrl || (activeMedia ? activeMedia.url : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'),
        duration: genDuration,
        aspectRatio: genFormat,
        createdAt: 'Just now',
        fileSize: '6.4 MB'
      };

      setMediaAssets(prev => [generatedAsset, ...prev]);
      setSelectedAssetId(generatedAsset.id);
      setActiveSidebarTab('media');
      setToastMessage({ text: 'Video scene generated and loaded to All Media!', type: 'success' });
    } catch (err: any) {
      setChatMessages(prev => prev.map(m => m.id === assistantMsgId ? {
        ...m,
        text: `Error during generation: ${err.message || 'Server worker error'}`,
        isGenerating: false,
        jobStatus: 'Failed'
      } : m));
      setToastMessage({ text: err.message || 'Generation failed', type: 'error' });
    } finally {
      setIsGenerating(false);
      setGenerationJobStatus(null);
    }
  };

  // Video Edit Export Handler
  const handleExportEdit = async () => {
    if (!activeMedia) return;
    setIsExporting(true);
    setToastMessage(null);

    try {
      const versionName = `Cut v${versionHistory.length + 1} (${trimStart}s-${trimEnd}s)`;
      const res = await fetch('/api/content-engine/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceVideoUrl: activeMedia.url,
          trimStart,
          trimEnd,
          aspectRatio: editAspectRatio,
          captions: [editCaption],
          versionName
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server export worker failed');

      setVersionHistory(prev => [
        {
          versionName,
          duration: trimEnd - trimStart,
          exportedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          aspectRatio: editAspectRatio
        },
        ...prev
      ]);

      setToastMessage({ text: `Exported ${versionName} successfully!`, type: 'success' });
    } catch (err: any) {
      setToastMessage({ text: err.message || 'Export failed', type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  // Clipping Handler
  const handleDetectClips = async () => {
    setIsSuggestingClips(true);
    setToastMessage(null);

    try {
      const res = await fetch('/api/content-engine/transcribe-and-clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle: sessionTitle,
          duration: videoDuration
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Clipping analysis failed');

      setSuggestedClips(data.clips || []);
      if (data.clips && data.clips.length > 0) {
        setSelectedClip(data.clips[0]);
      }
      setToastMessage({ text: `Identified ${data.clips?.length || 0} smart video clips with timestamps`, type: 'success' });
    } catch (err: any) {
      setToastMessage({ text: err.message || 'Clip detection failed', type: 'error' });
    } finally {
      setIsSuggestingClips(false);
    }
  };

  // Video Multimodal Audit Handler
  const handleAnalyzeVideo = async () => {
    setIsAnalyzing(true);
    setToastMessage(null);

    try {
      const res = await fetch('/api/content-engine/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle: sessionTitle,
          targetAudience: brandProfile.targetAudience || 'Modern consumers',
          duration: videoDuration
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');

      setAuditReport(data.report || null);
      setToastMessage({ text: `Video Audit Score: ${data.report?.overallScore || 88}/100`, type: 'success' });
    } catch (err: any) {
      setToastMessage({ text: err.message || 'Video analysis failed', type: 'error' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full w-full bg-[#09090b] text-white flex flex-col font-sans select-none overflow-hidden">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full border text-xs flex items-center gap-2 shadow-2xl backdrop-blur-md transition-all ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-700/60 text-emerald-200' 
            : 'bg-rose-950/90 border-rose-700/60 text-rose-200'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-80">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Hidden File Input for Drag-and-Drop / Browse */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInputChange} 
        accept="video/*,image/*,audio/*" 
        className="hidden" 
      />

      {/* ========================================================================= */}
      {/* 1. TOP HEADER BAR (Exact Google Flow Header)                             */}
      {/* ========================================================================= */}
      <header className="h-14 border-b border-zinc-800/80 px-4 flex items-center justify-between bg-[#09090b] shrink-0">
        {/* Left Section: Home & Project Title */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            title="Return to OnlyCreation Home"
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition-colors"
          >
            <Home size={18} />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-200">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-zinc-800/40"
            >
              <MoreVertical size={14} />
            </button>
          </div>
        </div>

        {/* Center Section: Pill Search Bar with Filters */}
        <div className="flex-1 max-w-md mx-6 hidden sm:flex items-center">
          <div className="w-full bg-[#1c1c1f] border border-zinc-800/80 rounded-full px-3.5 py-1.5 flex items-center gap-2 text-xs focus-within:border-zinc-700 transition-colors">
            <Search size={14} className="text-zinc-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search media, scenes, characters..."
              className="bg-transparent border-none text-zinc-200 placeholder-zinc-500 focus:outline-none flex-1 text-xs"
            />
            <button 
              onClick={() => setShowParamMenu(prev => !prev)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Filter parameters"
            >
              <SlidersHorizontal size={13} />
            </button>
          </div>
        </div>

        {/* Right Section: Add, Help, Settings, PRO, Avatar */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            title="Add Media / Reference"
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition-colors"
          >
            <Plus size={18} />
          </button>
          <button 
            onClick={() => setShowHelpModal(true)}
            title="Help & Guides"
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition-colors"
          >
            <HelpCircle size={18} />
          </button>
          <button 
            onClick={() => setShowSettingsModal(true)}
            title="Generation Settings"
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition-colors"
          >
            <Settings size={18} />
          </button>
          <button 
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition-colors"
          >
            <MoreVertical size={18} />
          </button>

          {/* PRO Badge */}
          <span className="bg-zinc-800/90 border border-zinc-700/60 text-[11px] font-semibold text-zinc-300 px-2.5 py-0.5 rounded tracking-wider">
            PRO
          </span>

          {/* User Monogram Avatar (OC Only Creation with blue halo) */}
          <div className="relative cursor-pointer" title="OnlyCreation Workspace">
            <div className="w-8 h-8 rounded-full bg-black border-2 border-sky-500/90 flex items-center justify-center text-[10px] font-bold text-sky-400 tracking-tighter">
              OC
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. THREE-PANE MAIN WORKSPACE CONTAINER                                   */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ------------------------------------------------------------- */}
        {/* A. LEFT SIDEBAR (All media, Characters, Scenes, Tools, Trash) */}
        {/* ------------------------------------------------------------- */}
        <aside 
          className={`border-r border-zinc-800/80 bg-[#09090b] flex flex-col justify-between p-2 select-none transition-all duration-200 z-10 ${
            isSidebarCollapsed ? 'w-16' : 'w-56'
          }`}
        >
          {/* Top Category List */}
          <div className="space-y-1">
            {/* All Media */}
            <button
              onClick={() => setActiveSidebarTab('media')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                activeSidebarTab === 'media'
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <LayoutGrid size={16} className={activeSidebarTab === 'media' ? 'text-white' : 'text-zinc-400'} />
              {!isSidebarCollapsed && <span>All media</span>}
            </button>

            {/* Characters */}
            <button
              onClick={() => setActiveSidebarTab('characters')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                activeSidebarTab === 'characters'
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <User size={16} className={activeSidebarTab === 'characters' ? 'text-white' : 'text-zinc-400'} />
              {!isSidebarCollapsed && <span>Characters</span>}
            </button>

            {/* Scenes */}
            <button
              onClick={() => setActiveSidebarTab('scenes')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                activeSidebarTab === 'scenes'
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Clapperboard size={16} className={activeSidebarTab === 'scenes' ? 'text-white' : 'text-zinc-400'} />
              {!isSidebarCollapsed && <span>Scenes</span>}
            </button>

            {/* Tools */}
            <button
              onClick={() => setActiveSidebarTab('tools')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                activeSidebarTab === 'tools'
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Sparkles size={16} className={activeSidebarTab === 'tools' ? 'text-white' : 'text-zinc-400'} />
              {!isSidebarCollapsed && <span>Tools</span>}
            </button>
          </div>

          {/* Bottom Controls: Trash & Collapse */}
          <div className="space-y-1 pt-3 border-t border-zinc-900">
            <button
              onClick={() => {
                if (activeMedia) {
                  setMediaAssets(prev => prev.filter(m => m.id !== activeMedia.id));
                  setToastMessage({ text: 'Moved asset to trash', type: 'success' });
                }
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
            >
              <Trash2 size={16} />
              {!isSidebarCollapsed && <span>Trash</span>}
            </button>

            <button
              onClick={() => setIsSidebarCollapsed(prev => !prev)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60 transition-colors"
            >
              {isSidebarCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
              {!isSidebarCollapsed && <span>Collapse</span>}
            </button>
          </div>
        </aside>

        {/* ------------------------------------------------------------- */}
        {/* B. CENTER CANVAS (Minimalist Pixel Flower / Drop Media / Work) */}
        {/* ------------------------------------------------------------- */}
        <main 
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`flex-1 bg-[#09090b] relative flex flex-col overflow-hidden transition-all ${
            isDragOver ? 'bg-zinc-950/80 border-2 border-dashed border-sky-500/60' : ''
          }`}
        >
          {/* Quick Action Ribbon: Generate, Edit, Trending Clips, Analysis */}
          <div className="border-b border-zinc-800/80 px-4 py-2 flex items-center gap-2 bg-[#0d0d0f]/80 backdrop-blur-md overflow-x-auto hide-scrollbar shrink-0">
            <button
              onClick={() => {
                setActiveSidebarTab('media');
                setIsRightPanelOpen(true);
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 font-medium whitespace-nowrap transition-colors"
            >
              <Plus size={13} />
              <span>Generate Video</span>
            </button>

            <button
              onClick={() => {
                setActiveSidebarTab('tools');
                setActiveTool('edit');
              }}
              className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-medium whitespace-nowrap transition-colors ${
                activeSidebarTab === 'tools' && activeTool === 'edit'
                  ? 'bg-zinc-800 text-white border-zinc-700'
                  : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
              }`}
            >
              <Scissors size={13} className="text-pink-400" />
              <span>Edit Video (Trim & 9:16)</span>
            </button>

            <button
              onClick={() => {
                setActiveSidebarTab('tools');
                setActiveTool('clipping');
                handleDetectClips();
              }}
              className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-medium whitespace-nowrap transition-colors ${
                activeSidebarTab === 'tools' && activeTool === 'clipping'
                  ? 'bg-zinc-800 text-white border-zinc-700'
                  : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
              }`}
            >
              <Sparkles size={13} className="text-amber-400" />
              <span>Trending Hook Clips</span>
            </button>

            <button
              onClick={() => {
                setActiveSidebarTab('tools');
                setActiveTool('analysis');
                handleAnalyzeVideo();
              }}
              className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-medium whitespace-nowrap transition-colors ${
                activeSidebarTab === 'tools' && activeTool === 'analysis'
                  ? 'bg-zinc-800 text-white border-zinc-700'
                  : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
              }`}
            >
              <Eye size={13} className="text-emerald-400" />
              <span>Multimodal Video Audit</span>
            </button>
          </div>

          {/* TAB 1: ALL MEDIA GALLERY OR EMPTY STATE */}
          {activeSidebarTab === 'media' && (
            <div className="flex-1 flex flex-col p-6 overflow-y-auto">
              {mediaAssets.length === 0 ? (
                /* Empty Droppable Zone with Google Flow Flower */
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex flex-col items-center justify-center cursor-pointer group"
                >
                  <div className="transition-transform duration-300 group-hover:scale-110 mb-4 opacity-90">
                    <FlowFlowerIcon />
                  </div>
                  <p className="text-zinc-400 text-base font-normal tracking-wide group-hover:text-zinc-200 transition-colors">
                    Start creating or drop media
                  </p>
                  <p className="text-xs text-zinc-600 mt-2">
                    Supports MP4, WebM, PNG, JPG, or WAV reference assets
                  </p>
                </div>
              ) : (
                /* Populated Media Gallery & Active Video Player */
                <div className="space-y-6">
                  {/* Active Selected Video Preview Player */}
                  {activeMedia && (
                    <div className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-4 shadow-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Film size={16} className="text-sky-400" />
                          <h3 className="text-sm font-semibold text-zinc-200">{activeMedia.name}</h3>
                          <span className="text-[11px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                            {activeMedia.aspectRatio}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setActiveSidebarTab('tools');
                              setActiveTool('edit');
                            }}
                            className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 transition-colors"
                          >
                            <Scissors size={12} />
                            <span>Edit in Canvas</span>
                          </button>
                          <a
                            href={activeMedia.url}
                            download={activeMedia.name}
                            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                            title="Download Asset"
                          >
                            <Download size={15} />
                          </a>
                        </div>
                      </div>

                      {/* Video Player Frame */}
                      <div className="relative aspect-video max-h-[440px] bg-black rounded-xl overflow-hidden flex items-center justify-center mx-auto border border-zinc-900">
                        <video
                          ref={videoRef}
                          src={activeMedia.url}
                          onLoadedMetadata={handleLoadedMetadata}
                          onTimeUpdate={handleTimeUpdate}
                          onEnded={() => setIsPlaying(false)}
                          className="w-full h-full object-contain"
                        />

                        {/* Play/Pause Center Overlay */}
                        <button
                          onClick={togglePlay}
                          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group"
                        >
                          <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-transform group-hover:scale-110">
                            {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                          </div>
                        </button>

                        {/* Scrub Bar & Timecodes */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-6 flex flex-col gap-1.5">
                          <input
                            type="range"
                            min="0"
                            max={videoDuration}
                            step="0.1"
                            value={currentTime}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setCurrentTime(val);
                              if (videoRef.current) videoRef.current.currentTime = val;
                            }}
                            className="w-full accent-sky-400 h-1 bg-zinc-700/60 rounded cursor-pointer"
                          />
                          <div className="flex items-center justify-between text-[11px] text-zinc-400">
                            <span>{Math.floor(currentTime)}s / {videoDuration}s</span>
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => {
                                  if (videoRef.current) {
                                    videoRef.current.muted = !isMuted;
                                    setIsMuted(!isMuted);
                                  }
                                }}
                                className="hover:text-white"
                              >
                                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                              </button>
                              <button 
                                onClick={() => videoRef.current?.requestFullscreen()}
                                className="hover:text-white"
                              >
                                <Maximize2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Media Grid Cards */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Project Media Library</h4>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
                      >
                        <Plus size={13} /> Add Media
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {mediaAssets.map((asset) => (
                        <div
                          key={asset.id}
                          onClick={() => setSelectedAssetId(asset.id)}
                          className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                            selectedAssetId === asset.id
                              ? 'bg-zinc-800/90 border-sky-500/70 shadow-lg'
                              : 'bg-[#121214] border-zinc-800/70 hover:border-zinc-700'
                          }`}
                        >
                          <div className="aspect-video bg-black/60 rounded-lg overflow-hidden flex items-center justify-center relative mb-2">
                            {asset.type === 'video' ? (
                              <video src={asset.url} className="w-full h-full object-cover" />
                            ) : (
                              <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                            )}
                            <span className="absolute bottom-1 right-1 text-[9px] bg-black/80 px-1 rounded text-zinc-300">
                              {asset.aspectRatio}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-zinc-200 truncate">{asset.name}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{asset.fileSize || 'Video Asset'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CHARACTERS (Google Flow Talent Consistency) */}
          {activeSidebarTab === 'characters' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">Character Consistency Studio</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Maintain uniform actor likeness and style across multi-scene Veo video generations.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newChar: FlowCharacter = {
                      id: `char-${Date.now()}`,
                      name: 'Brand Spokesperson',
                      role: 'Narrator',
                      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
                      consistencyPrompt: 'Professional talent, warm smile, studio lighting, corporate casual attire'
                    };
                    setCharacters(prev => [...prev, newChar]);
                    setToastMessage({ text: 'Added new character anchor', type: 'success' });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium flex items-center gap-1.5 text-zinc-200"
                >
                  <Plus size={14} /> Add Character
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {characters.map(char => (
                  <div key={char.id} className="p-4 rounded-2xl bg-[#121214] border border-zinc-800/80 flex gap-4">
                    <img 
                      src={char.avatarUrl} 
                      alt={char.name} 
                      className="w-16 h-16 rounded-xl object-cover border border-zinc-700/60 shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-zinc-200">{char.name}</h4>
                      <p className="text-xs text-sky-400 font-medium">{char.role}</p>
                      <p className="text-xs text-zinc-400 mt-2 line-clamp-2 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                        "{char.consistencyPrompt}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SCENES & STORYBOARDS */}
          {activeSidebarTab === 'scenes' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">Scene Sequence & Storyboard</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Plan shot cuts, camera movements, and audio cues before rendering.
                  </p>
                </div>
                <button
                  onClick={() => handleSendPrompt('Regenerate and expand storyboard to 5 cinematic cuts')}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium flex items-center gap-1.5 text-zinc-200"
                >
                  <Sparkles size={14} /> AI Expand Storyboard
                </button>
              </div>

              <div className="space-y-3">
                {storyboardScenes.map(scene => (
                  <div key={scene.id} className="p-4 rounded-2xl bg-[#121214] border border-zinc-800/80 flex flex-col md:flex-row gap-4">
                    <div className="md:w-36 shrink-0 flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider">
                          Scene {scene.sceneNumber}
                        </span>
                        <p className="text-xs text-zinc-400 font-mono mt-0.5">{scene.timeRange}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold self-start mt-2 ${
                        scene.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        scene.status === 'ready' ? 'bg-sky-950 text-sky-400 border border-sky-800' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {scene.status}
                      </span>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                          {scene.shotType}
                        </span>
                        <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                          {scene.cameraMovement}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-200 font-medium">"{scene.visualPrompt}"</p>
                      <p className="text-xs text-zinc-400 italic">Voiceover: {scene.voiceoverOrAudio}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: TOOLS WORKBENCH (Edit, Smart Clipping, Video Audit) */}
          {activeSidebarTab === 'tools' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Sub-Tabs Selector */}
              <div className="border-b border-zinc-800 px-6 py-2.5 flex items-center gap-2 bg-[#0d0d0f]">
                <button
                  onClick={() => setActiveTool('edit')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    activeTool === 'edit' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Trim & Canvas Export
                </button>
                <button
                  onClick={() => setActiveTool('clipping')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    activeTool === 'clipping' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Smart Hook Clipping
                </button>
                <button
                  onClick={() => setActiveTool('analysis')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    activeTool === 'analysis' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Multimodal Video Audit
                </button>
              </div>

              {/* Tool Sub-Views */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {activeTool === 'edit' && (
                  <div className="space-y-4 max-w-3xl">
                    <h3 className="text-sm font-semibold text-zinc-200">Video Canvas Editor & Export Worker</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Trimming Range */}
                      <div className="p-4 rounded-xl bg-[#121214] border border-zinc-800/80 space-y-2">
                        <label className="text-xs text-zinc-400">Trim In Point: {trimStart}s</label>
                        <input 
                          type="range" 
                          min="0" 
                          max={trimEnd - 1} 
                          value={trimStart} 
                          onChange={(e) => setTrimStart(parseInt(e.target.value))}
                          className="w-full accent-sky-400"
                        />
                        <label className="text-xs text-zinc-400">Trim Out Point: {trimEnd}s</label>
                        <input 
                          type="range" 
                          min={trimStart + 1} 
                          max={videoDuration} 
                          value={trimEnd} 
                          onChange={(e) => setTrimEnd(parseInt(e.target.value))}
                          className="w-full accent-sky-400"
                        />
                      </div>

                      {/* Aspect Ratio & Captions */}
                      <div className="p-4 rounded-xl bg-[#121214] border border-zinc-800/80 space-y-3">
                        <div>
                          <label className="text-xs text-zinc-400 block mb-1">Target Aspect Ratio</label>
                          <div className="flex gap-2">
                            {(['9:16', '16:9', '1:1'] as const).map(ratio => (
                              <button
                                key={ratio}
                                onClick={() => setEditAspectRatio(ratio)}
                                className={`text-xs px-2.5 py-1 rounded border ${
                                  editAspectRatio === ratio ? 'border-sky-400 text-white bg-sky-950/40' : 'border-zinc-800 text-zinc-400'
                                }`}
                              >
                                {ratio}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-zinc-400 block mb-1">Overlay Caption</label>
                          <input
                            type="text"
                            value={editCaption}
                            onChange={(e) => setEditCaption(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleExportEdit}
                      disabled={isExporting}
                      className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      Export Rendered Cut ({trimEnd - trimStart}s, {editAspectRatio})
                    </button>
                  </div>
                )}

                {activeTool === 'clipping' && (
                  <div className="space-y-4 max-w-3xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-zinc-200">Timestamped Hook Clipping</h3>
                      <button
                        onClick={handleDetectClips}
                        disabled={isSuggestingClips}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium flex items-center gap-1.5 text-zinc-200 disabled:opacity-50"
                      >
                        {isSuggestingClips ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                        Analyze Hook Segments
                      </button>
                    </div>

                    <div className="space-y-2">
                      {suggestedClips.length === 0 ? (
                        <p className="text-xs text-zinc-500 py-6 text-center bg-[#121214] rounded-xl border border-zinc-800">
                          Click "Analyze Hook Segments" to auto-detect viral hooks with start/end timestamps.
                        </p>
                      ) : (
                        suggestedClips.map((clip) => (
                          <div key={clip.id} className="p-3 rounded-xl bg-[#121214] border border-zinc-800 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-semibold text-zinc-200">{clip.title}</p>
                              <p className="text-[11px] text-sky-400 font-mono">
                                [{clip.startTime}s - {clip.endTime}s] • Duration: {clip.endTime - clip.startTime}s
                              </p>
                              <p className="text-xs text-zinc-400 mt-1">{clip.hookRationale}</p>
                            </div>
                            <button
                              onClick={() => {
                                setTrimStart(clip.startTime);
                                setTrimEnd(clip.endTime);
                                setActiveTool('edit');
                                setToastMessage({ text: `Trim handles synchronized to clip: ${clip.title}`, type: 'success' });
                              }}
                              className="text-xs px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                            >
                              Load Cut
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTool === 'analysis' && (
                  <div className="space-y-4 max-w-3xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-zinc-200">Multimodal Video Audit</h3>
                      <button
                        onClick={handleAnalyzeVideo}
                        disabled={isAnalyzing}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium flex items-center gap-1.5 text-zinc-200 disabled:opacity-50"
                      >
                        {isAnalyzing ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
                        Run Pacing & Hook Audit
                      </button>
                    </div>

                    {auditReport ? (
                      <div className="p-4 rounded-xl bg-[#121214] border border-zinc-800 space-y-3">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                          <span className="text-xs text-zinc-400">Retention & Quality Score</span>
                          <span className="text-lg font-bold text-sky-400">{auditReport.overallScore}/100</span>
                        </div>
                        <div className="text-xs space-y-2">
                          <div>
                            <span className="font-semibold text-zinc-300">0-3s Hook Analysis: </span>
                            <span className="text-zinc-400">{auditReport.openingHookAnalysis.observation}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-300">Pacing Recommendation: </span>
                            <span className="text-zinc-400">{auditReport.pacingAndRetention.suggestion}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 py-6 text-center bg-[#121214] rounded-xl border border-zinc-800">
                        Click "Run Pacing & Hook Audit" to generate timestamped feedback on opening hooks and audio clarity.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Disclaimer (Matching Google Flow Bottom-Left Notice) */}
          <footer className="absolute bottom-2 left-3 select-none pointer-events-none">
            <span className="text-[11px] text-zinc-600 font-normal">
              OnlyCreation Flow can make mistakes, so double check it
            </span>
          </footer>
        </main>

        {/* ------------------------------------------------------------- */}
        {/* C. RIGHT CREATION PANEL ("Untitled session" Assistant Drawer) */}
        {/* ------------------------------------------------------------- */}
        {isRightPanelOpen && (
          <aside className="w-80 md:w-96 border-l border-zinc-800/80 bg-[#121214] flex flex-col justify-between select-none relative z-20">
            {/* Header: Session Menu, Title, Edit Pencil, Close Button */}
            <div className="h-12 border-b border-zinc-800/80 px-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Menu size={16} className="text-zinc-400 shrink-0 cursor-pointer hover:text-zinc-200" />
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    onBlur={() => setIsEditingTitle(false)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingTitle(false); }}
                    autoFocus
                    className="bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded text-xs text-white focus:outline-none w-full"
                  />
                ) : (
                  <span 
                    onClick={() => setIsEditingTitle(true)}
                    className="text-xs font-medium text-zinc-200 truncate cursor-pointer hover:text-white"
                  >
                    {sessionTitle}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button 
                  onClick={() => setIsEditingTitle(prev => !prev)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800/60"
                  title="Rename session"
                >
                  <Edit3 size={14} />
                </button>
                <button 
                  onClick={() => setIsRightPanelOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800/60"
                  title="Close session panel"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Session Body: Greeting, 3 Quick Action Cards, & Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {chatMessages.length === 0 ? (
                /* Empty Session State (Exact Screenshot Greeting & 3 Cards) */
                <div className="flex flex-col items-center justify-center pt-8 pb-4">
                  {/* Greeting */}
                  <h2 className="text-xl font-medium text-zinc-200 tracking-tight text-center">
                    Hi Only
                  </h2>
                  <p className="text-sm text-zinc-400 text-center mb-6 mt-1 font-normal">
                    What would you like to create?
                  </p>

                  {/* 3 Quick Action Cards */}
                  <div className="w-full space-y-3">
                    {/* Card 1: Develop a storyboard */}
                    <button
                      onClick={handleActionStoryboard}
                      className="w-full p-3.5 rounded-2xl bg-[#18181b] hover:bg-[#202025] border border-zinc-800/90 hover:border-zinc-700/80 transition-all flex items-center gap-3.5 group text-left shadow-md"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-950/80 to-amber-900/40 border border-amber-700/50 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                        <Scroll size={18} className="text-amber-300" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                        Develop a storyboard
                      </span>
                    </button>

                    {/* Card 2: Rename my assets */}
                    <button
                      onClick={handleActionRenameAssets}
                      className="w-full p-3.5 rounded-2xl bg-[#18181b] hover:bg-[#202025] border border-zinc-800/90 hover:border-zinc-700/80 transition-all flex items-center gap-3.5 group text-left shadow-md"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-950/80 to-sky-900/40 border border-sky-700/50 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                        <Folder size={18} className="text-sky-300" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                        Rename my assets
                      </span>
                    </button>

                    {/* Card 3: Teach me about what you can do */}
                    <button
                      onClick={handleActionTeachMe}
                      className="w-full p-3.5 rounded-2xl bg-[#18181b] hover:bg-[#202025] border border-zinc-800/90 hover:border-zinc-700/80 transition-all flex items-center gap-3.5 group text-left shadow-md"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-950/80 to-emerald-900/40 border border-teal-700/50 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                        <BookOpen size={18} className="text-teal-300" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                        Teach me about what you can do
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Chat Conversation Stream */
                <div className="space-y-4">
                  {chatMessages.map(msg => (
                    <div 
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-zinc-800 text-zinc-100 rounded-br-sm'
                          : 'bg-[#18181b] border border-zinc-800 text-zinc-300 rounded-bl-sm'
                      }`}>
                        <p>{msg.text}</p>
                        {msg.isGenerating && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-800 text-sky-400 font-mono text-[10px]">
                            <Loader2 size={12} className="animate-spin" />
                            <span>{msg.jobStatus || 'Processing...'}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-600 mt-1 px-1">{msg.timestamp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Settings Parameter Popover */}
            {showParamMenu && (
              <div className="p-3 mx-3 mb-2 bg-[#1a1a1e] border border-zinc-800 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                  <span className="font-semibold text-zinc-300">Veo Generation Settings</span>
                  <button onClick={() => setShowParamMenu(false)} className="text-zinc-500 hover:text-white">
                    <X size={12} />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Duration:</span>
                  <div className="flex gap-1">
                    {[5, 10, 15].map(d => (
                      <button 
                        key={d} 
                        onClick={() => setGenDuration(d)}
                        className={`px-2 py-0.5 rounded text-[11px] ${genDuration === d ? 'bg-sky-500 text-black font-semibold' : 'bg-zinc-800 text-zinc-400'}`}
                      >
                        {d}s
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Format:</span>
                  <div className="flex gap-1">
                    {(['9:16', '16:9', '1:1'] as const).map(f => (
                      <button 
                        key={f} 
                        onClick={() => setGenFormat(f)}
                        className={`px-2 py-0.5 rounded text-[11px] ${genFormat === f ? 'bg-sky-500 text-black font-semibold' : 'bg-zinc-800 text-zinc-400'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Dock Input Bar (Exact Google Flow Floating Dock) */}
            <div className="p-3 border-t border-zinc-800/80 bg-[#121214] shrink-0">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendPrompt(); }}
                className="bg-[#1c1c20] border border-zinc-700/60 rounded-3xl p-1.5 pl-3 flex items-center gap-2 shadow-2xl focus-within:border-zinc-500 transition-colors"
              >
                {/* Left Attachment Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors p-1"
                  title="Upload reference media"
                >
                  <Plus size={16} />
                </button>

                {/* Main Text Input */}
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="What do you want to create?"
                  disabled={isGenerating}
                  className="bg-transparent border-none text-xs text-white placeholder-zinc-500 focus:outline-none flex-1"
                />

                {/* Storyboard Template Button */}
                <button
                  type="button"
                  onClick={handleActionStoryboard}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors p-1 hidden sm:block"
                  title="Develop storyboard template"
                >
                  <FileText size={15} />
                </button>

                {/* Settings Sliders Button */}
                <button
                  type="button"
                  onClick={() => setShowParamMenu(prev => !prev)}
                  className={`transition-colors p-1 ${showParamMenu ? 'text-sky-400' : 'text-zinc-400 hover:text-zinc-200'}`}
                  title="Video generation parameters"
                >
                  <SlidersHorizontal size={15} />
                </button>

                {/* Submit Arrow Button */}
                <button
                  type="submit"
                  disabled={!promptInput.trim() || isGenerating}
                  className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-sky-500 text-zinc-300 hover:text-black flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-zinc-800 disabled:hover:text-zinc-300"
                >
                  {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={14} />}
                </button>
              </form>
            </div>
          </aside>
        )}

        {/* Closed Panel Re-open Pill Button */}
        {!isRightPanelOpen && (
          <button
            onClick={() => setIsRightPanelOpen(true)}
            className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-medium text-zinc-200 flex items-center gap-1.5 shadow-xl transition-all"
          >
            <Sparkles size={13} className="text-sky-400" />
            <span>Open Session</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. SETTINGS & GUIDE MODALS                                                */}
      {/* ========================================================================= */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121214] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-teal-400" />
                <h3 className="text-sm font-semibold text-white">OnlyCreation Flow Guide</h3>
              </div>
              <button onClick={() => setShowHelpModal(false)} className="text-zinc-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="text-xs text-zinc-300 space-y-3 leading-relaxed">
              <p>
                <strong>Google Flow Interface</strong> brings unified multi-scene video generation, consistent character anchors, and client-side canvas trimming into one workspace.
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-zinc-400">
                <li><strong className="text-zinc-200">All media:</strong> Drop images, videos, and reference packshots onto the canvas.</li>
                <li><strong className="text-zinc-200">Characters:</strong> Lock character likeness and style prompts across scenes.</li>
                <li><strong className="text-zinc-200">Scenes:</strong> Plan extreme close-ups, dolly shots, and audio voiceover before rendering.</li>
                <li><strong className="text-zinc-200">Tools:</strong> Export vertical 9:16 reels, trim video frames, and run multimodal audits.</li>
              </ul>
            </div>
            <button 
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
