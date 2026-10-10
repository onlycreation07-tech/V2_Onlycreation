import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Film, 
  Camera, 
  Lightbulb, 
  Users, 
  Wand2, 
  Play, 
  Pause, 
  CheckCircle2, 
  ArrowRight, 
  Sliders, 
  Layers, 
  ExternalLink, 
  Building2, 
  Zap, 
  Copy, 
  Check, 
  RefreshCw, 
  Eye, 
  Info,
  Clock,
  IndianRupee
} from 'lucide-react';
import { BrandProfile, AdCreative } from '../../types';

interface AIProductionBriefEngineProps {
  brandProfile: BrandProfile;
  onBookStudio?: (category: string) => void;
  onDispatchCrew?: (tier: string) => void;
  onConvertToProject?: (creative: AdCreative) => void;
}

const CURATED_REFERENCES = [
  {
    id: 'ref-cyberpunk-kinetic',
    title: 'Cyberpunk Neon Kinetic',
    category: 'Commercial / Fashion',
    aspect: '9:16 Vertical',
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
    lighting: 'High-contrast cyan & magenta neon rim lighting',
    framing: 'Dutch angles, tracking whip-pans',
    palette: ['#00F0FF', '#FF0055', '#120024', '#FFE600'],
    pacing: '128 BPM fast montage cuts',
    setMatch: 'Cyberpunk Neon Studio',
    crewTier: 'videographer'
  },
  {
    id: 'ref-warm-organic-loft',
    title: 'Warm Organic Daylight',
    category: 'Skincare & Lifestyle',
    aspect: '16:9 Cinema',
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800&auto=format&fit=crop',
    lighting: 'Diffused North Daylight through sheer linen',
    framing: 'Macro 85mm shallow f/1.4 portraiture',
    palette: ['#F5EBE0', '#D5BDAF', '#E3D5CA', '#B7B7A4'],
    pacing: 'Languid, calming rhythm',
    setMatch: 'Daylight Loft',
    crewTier: 'reel_creator'
  },
  {
    id: 'ref-film-noir-luxury',
    title: 'Moody Low-Key Film Noir',
    category: 'Luxury Goods & Perfume',
    aspect: '2.39:1 Anamorphic',
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=800&auto=format&fit=crop',
    lighting: 'Single specular hard key, chiaroscuro haze',
    framing: 'Anamorphic oval bokeh, silhouette profiles',
    palette: ['#0A0A0B', '#1E1B18', '#C5A059', '#3D3833'],
    pacing: 'Deliberate, dramatic tension builds',
    setMatch: 'Acoustic Soundstage',
    crewTier: 'agency_crew'
  },
  {
    id: 'ref-tech-macro-minimal',
    title: 'Precision Macro Reveal',
    category: 'Hardware & Wearables',
    aspect: '16:9 4K',
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop',
    lighting: 'Linear continuous strip banks, titanium rim',
    framing: '100mm 2:1 extreme macro turntable orbit',
    palette: ['#111116', '#2A2A38', '#6366F1', '#E2E8F0'],
    pacing: 'Crisp sound-design driven micro-beats',
    setMatch: 'Infinity Cyclorama',
    crewTier: 'videographer'
  }
];

export default function AIProductionBriefEngine({
  brandProfile,
  onBookStudio,
  onDispatchCrew,
  onConvertToProject
}: AIProductionBriefEngineProps) {
  const [selectedRef, setSelectedRef] = useState(CURATED_REFERENCES[0]);
  const [customVideoUrl, setCustomVideoUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [briefResult, setBriefResult] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  // Editable fields in generated brief
  const [editableTitle, setEditableTitle] = useState('');
  const [editableLogline, setEditableLogline] = useState('');
  const [editableHours, setEditableHours] = useState(4);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/briefs/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceId: selectedRef.id,
          videoUrl: customVideoUrl.trim() || selectedRef.videoUrl,
          brandName: brandProfile.name || 'Brand Lead',
          industry: brandProfile.industry || 'Lifestyle & D2C',
          productDescription: `${brandProfile.name} signature launch video`,
          targetAudience: brandProfile.targetAudience || 'Modern Creators & Digital Natives'
        })
      });

      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      const b = data.brief;
      setBriefResult(b);
      setEditableTitle(b.title);
      setEditableLogline(b.logline);
      setEditableHours(b.extractedRequirements?.estimatedDurationHours || 4);
      setSelectedEquipment(b.extractedRequirements?.recommendedEquipment || []);
    } catch (err) {
      console.warn("Brief generation fallback:", err);
      // Fallback preview
      const fallback = {
        id: 'brief_local_gen',
        title: `${brandProfile.name} • ${selectedRef.title} Cinematic Brief`,
        logline: `A high-concept visual commercial capturing ${brandProfile.name}'s luxury aesthetic through kinetic lighting and rhythm.`,
        visualStyle: {
          lighting: selectedRef.lighting,
          framing: selectedRef.framing,
          cameraMovement: 'Dynamic motorized slider tracking with parallax',
          colorPalette: selectedRef.palette,
          pacing: selectedRef.pacing,
          mood: 'Energetic, premium, high-octane visual storytelling'
        },
        extractedRequirements: {
          shootSetType: selectedRef.setMatch,
          recommendedEquipment: [
            'Sony FX3 Cinema Line Full-Frame',
            'Sony FE 24-70mm f/2.8 GM II',
            'Aputure 600d Pro High-Output Daylight',
            'DJI RS 3 Pro Gimbal System',
            'DJI Wireless Mic Duo (32-bit float)'
          ],
          crewRoles: [
            { role: 'Cinema Videographer', count: 1, description: '4K log recording, master composition' },
            { role: 'Video Reel Creator', count: 1, description: 'Vertical social cuts and behind-the-scenes' },
            { role: 'Lighting Tech / Gaffer', count: 1, description: 'Manages continuous LED & diffusion' }
          ],
          estimatedDurationHours: 4,
          budgetEstimateInr: 28500
        }
      };
      setBriefResult(fallback);
      setEditableTitle(fallback.title);
      setEditableLogline(fallback.logline);
      setSelectedEquipment(fallback.extractedRequirements.recommendedEquipment);
    } finally {
      setAnalyzing(false);
    }
  };

  const copyHex = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 1800);
  };

  const toggleEquipment = (item: string) => {
    setSelectedEquipment(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-sleek-violet/20 via-purple-950/30 to-black border border-sleek-violet/30 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-sleek-violet flex items-center gap-1.5">
            <Wand2 size={13} /> Multi-Modal Gemini Vision
          </span>
          <span className="text-[9px] font-bold text-white/50 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
            Phase 3 Engine
          </span>
        </div>
        <h2 className="text-xl font-black text-white tracking-tight">
          Reference Video → AI Production Brief
        </h2>
        <p className="text-white/60 text-xs leading-relaxed">
          Select or paste a reference video. Gemini extracts camera framing, lighting mood, color hex codes, and automatically compiles the shoot sets, equipment gear list, and crew roles required.
        </p>
      </div>

      {/* Step 1: Reference Library Selector */}
      <div className="flex flex-col gap-3">
        <label className="text-[11px] font-black uppercase tracking-wider text-white/70 flex items-center justify-between">
          <span>1. Select Cinematic Reference Aesthetic</span>
          <span className="text-sleek-violet text-[10px] font-semibold">{CURATED_REFERENCES.length} Curated Masters</span>
        </label>

        <div className="grid grid-cols-2 gap-2.5">
          {CURATED_REFERENCES.map(ref => {
            const isSelected = selectedRef.id === ref.id;
            return (
              <button
                key={ref.id}
                type="button"
                onClick={() => { setSelectedRef(ref); setBriefResult(null); }}
                className={`flex flex-col text-left p-2.5 rounded-2xl border transition-all relative overflow-hidden group ${
                  isSelected 
                    ? 'bg-sleek-violet/20 border-sleek-violet shadow-lg shadow-sleek-violet/20' 
                    : 'bg-sleek-dark/60 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-2">
                  <img 
                    src={ref.thumbnail} 
                    alt={ref.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-black text-white/90">
                    {ref.aspect}
                  </div>
                </div>

                <h4 className="text-xs font-bold text-white truncate">{ref.title}</h4>
                <p className="text-[10px] text-white/50 truncate mt-0.5">{ref.category}</p>

                {isSelected && (
                  <div className="absolute top-2 right-2 bg-sleek-violet text-white p-1 rounded-full shadow">
                    <Check size={10} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom Video URL Input Option */}
        <div className="flex flex-col gap-1.5 mt-1">
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Or enter custom video URL:</span>
          <div className="flex gap-2">
            <input 
              type="url"
              placeholder="https://example.com/reference-reel.mp4"
              value={customVideoUrl}
              onChange={(e) => setCustomVideoUrl(e.target.value)}
              className="flex-1 bg-sleek-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-sleek-violet"
            />
          </div>
        </div>

        {/* Analyze Action Button */}
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full bg-gradient-to-r from-sleek-violet to-purple-600 hover:from-purple-600 hover:to-indigo-600 text-white py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-sleek-violet/25 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer mt-1"
        >
          {analyzing ? (
            <>
              <RefreshCw size={15} className="animate-spin text-white" />
              <span>Analyzing Lighting, Framing & Gear Requirements...</span>
            </>
          ) : (
            <>
              <Sparkles size={15} />
              <span>Generate AI Production Brief for {brandProfile.name}</span>
            </>
          )}
        </button>
      </div>

      {/* Step 2: Generated Production Brief & Style Breakdown */}
      {briefResult && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-5 pt-2"
        >
          {/* Section Divider */}
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest border-b border-emerald-500/20 pb-2">
            <CheckCircle2 size={16} /> Production Brief Compiled
          </div>

          {/* Interactive Title & Logline */}
          <div className="bg-sleek-dark/80 p-4 rounded-3xl border border-white/10 flex flex-col gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-sleek-violet">
              Commercial Concept & Logline
            </span>

            <input 
              type="text"
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-sleek-violet"
              placeholder="Commercial Title"
            />

            <textarea 
              rows={2}
              value={editableLogline}
              onChange={(e) => setEditableLogline(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white/80 focus:outline-none focus:border-sleek-violet leading-relaxed"
              placeholder="Commercial Logline"
            />
          </div>

          {/* Visual Style Breakdown Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Lighting */}
            <div className="bg-sleek-dark/60 p-3 rounded-2xl border border-white/5 flex flex-col gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Lightbulb size={12} /> Lighting Setup
              </span>
              <p className="text-xs text-white/90 font-medium leading-snug">
                {briefResult.visualStyle?.lighting || selectedRef.lighting}
              </p>
            </div>

            {/* Framing & Camera */}
            <div className="bg-sleek-dark/60 p-3 rounded-2xl border border-white/5 flex flex-col gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                <Camera size={12} /> Framing & Lens
              </span>
              <p className="text-xs text-white/90 font-medium leading-snug">
                {briefResult.visualStyle?.framing || selectedRef.framing}
              </p>
            </div>

            {/* Pacing & Rhythm */}
            <div className="bg-sleek-dark/60 p-3 rounded-2xl border border-white/5 flex flex-col gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-fuchsia-400 flex items-center gap-1">
                <Sliders size={12} /> Pacing & Beats
              </span>
              <p className="text-xs text-white/90 font-medium leading-snug">
                {briefResult.visualStyle?.pacing || selectedRef.pacing}
              </p>
            </div>

            {/* Color Palette */}
            <div className="bg-sleek-dark/60 p-3 rounded-2xl border border-white/5 flex flex-col gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Layers size={12} /> Color Swatches
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                {(briefResult.visualStyle?.colorPalette || selectedRef.palette).map((hex: string) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => copyHex(hex)}
                    title={`Click to copy ${hex}`}
                    style={{ backgroundColor: hex }}
                    className="w-6 h-6 rounded-lg border border-white/20 shadow transition-transform hover:scale-110 active:scale-95 relative flex items-center justify-center cursor-pointer"
                  >
                    {copiedColor === hex && <Check size={10} className="text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Extracted Requirements (Shoot Set, Equipment, Crew) */}
          <div className="bg-sleek-dark/80 p-4 rounded-3xl border border-white/10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-sleek-violet">
                Extracted Production Requirements
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                <IndianRupee size={11} /> Est: ₹{(briefResult.extractedRequirements?.budgetEstimateInr || 28000).toLocaleString()}
              </span>
            </div>

            {/* Matched Shoot Set */}
            <div className="bg-black/30 p-3 rounded-2xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sleek-violet/20 border border-sleek-violet/30 flex items-center justify-center text-sleek-violet">
                  <Building2 size={16} />
                </div>
                <div>
                  <span className="text-[9px] text-white/40 uppercase font-black tracking-wider block">Recommended Shoot Set</span>
                  <p className="text-xs font-bold text-white">
                    {briefResult.extractedRequirements?.shootSetType || selectedRef.setMatch}
                  </p>
                </div>
              </div>

              {onBookStudio && (
                <button
                  type="button"
                  onClick={() => onBookStudio(selectedRef.category)}
                  className="px-3 py-1.5 rounded-xl bg-sleek-violet hover:bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <span>Book Set</span>
                  <ArrowRight size={11} />
                </button>
              )}
            </div>

            {/* Recommended Equipment Checklist */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                Required Camera & Lighting Gear (Tap to toggle)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(briefResult.extractedRequirements?.recommendedEquipment || []).map((gear: string) => {
                  const isChecked = selectedEquipment.includes(gear);
                  return (
                    <button
                      key={gear}
                      type="button"
                      onClick={() => toggleEquipment(gear)}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isChecked 
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                          : 'bg-black/40 border-white/10 text-white/50 line-through'
                      }`}
                    >
                      <Check size={11} className={isChecked ? 'opacity-100' : 'opacity-20'} />
                      <span>{gear}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recommended Crew Roles */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                Recommended On-Set Crew
              </span>
              <div className="flex flex-col gap-1.5">
                {(briefResult.extractedRequirements?.crewRoles || []).map((crew: any, idx: number) => (
                  <div 
                    key={idx}
                    className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-white/80">
                        <Users size={12} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{crew.role} (x{crew.count})</p>
                        <p className="text-[10px] text-white/40">{crew.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-white/10">
              {onDispatchCrew && (
                <button
                  type="button"
                  onClick={() => onDispatchCrew(selectedRef.crewTier)}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  <Zap size={14} className="fill-current text-amber-300" />
                  <span>Dispatch Matched Crew</span>
                </button>
              )}

              {onConvertToProject && (
                <button
                  type="button"
                  onClick={() => onConvertToProject({
                    id: `creative_${Date.now()}`,
                    userId: 'active_client',
                    prompt: editableTitle || 'Commercial Reel',
                    copy: editableLogline,
                    imageUrls: [selectedRef.thumbnail],
                    videoScript: `Production Brief for ${brandProfile.name}: ${editableLogline}`,
                    productionBrief: JSON.stringify(briefResult),
                    status: 'draft',
                    createdAt: new Date().toISOString()
                  })}
                  className="flex-1 bg-white/10 hover:bg-white/20 border border-white/10 text-white py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <Film size={14} />
                  <span>Launch Production Project</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
