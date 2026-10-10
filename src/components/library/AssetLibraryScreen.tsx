import { apiFetch } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Video, 
  Music, 
  Download, 
  ExternalLink, 
  Search, 
  Film, 
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import { BrandProfile, AdCreative } from '../../types';

interface AssetLibraryScreenProps {
  brandProfile: BrandProfile;
  creatives: AdCreative[];
  onOpenStudio?: () => void;
}

export default function AssetLibraryScreen({
  brandProfile,
  creatives,
  onOpenStudio
}: AssetLibraryScreenProps) {
  const { user } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [assetError, setAssetError] = useState('');
  useEffect(() => {
    let cancelled = false;
    setAssets([]);
    if (!user) return;
    apiFetch('/api/ai/jobs').then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load generated assets');
      if (!cancelled) { setAssets(data.jobs.filter((job: any) => job.status === 'COMPLETED')); setAssetError(''); }
    }).catch(error => { if (!cancelled) setAssetError(error.message); });
    return () => { cancelled = true; };
  }, [user?.uid]);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'script'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto px-4 py-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-sleek-violet/20 text-sleek-violet">
              <ImageIcon size={18} />
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Creative Asset Library
            </h1>
          </div>
          <p className="text-xs md:text-sm text-white/50">
            Repository of all generated visual storyboards, commercial scripts, audio tracks, and exports.
          </p>
        </div>

        {/* Filter Type */}
        <div className="flex items-center gap-1 bg-sleek-zinc p-1 rounded-xl border border-white/10 shrink-0">
          {(['all', 'image', 'video', 'script'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filterType === t 
                  ? 'bg-sleek-violet text-white shadow-xs' 
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {assetError && <p role="alert" className="text-sm text-rose-300 mt-3">{assetError}</p>}
      {/* Asset Grid */}
      <div className="flex-1 overflow-y-auto mt-4 pr-1 hide-scrollbar">
        {creatives.length === 0 && assets.length === 0 ? (
          <div className="py-16 text-center text-white/40 space-y-3">
            <Sparkles size={32} className="mx-auto text-sleek-violet/40" />
            <p className="text-sm">No creative assets saved yet.</p>
            {onOpenStudio && (
              <button
                onClick={onOpenStudio}
                className="px-4 py-2 rounded-xl bg-sleek-violet hover:bg-sleek-violet/90 text-white text-xs font-medium transition-colors"
              >
                Create your first asset in AI Studio
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {assets.filter(asset => filterType === 'all' || filterType === asset.type).map(asset => (
              <div key={asset.id} className="p-3 rounded-xl bg-sleek-zinc border border-white/10 space-y-2">
                {asset.type === 'image' ? <img src={asset.assetUrl} alt={asset.prompt} className="w-full h-36 object-cover rounded-lg" /> : <video src={asset.assetUrl} controls preload="metadata" className="w-full h-36 rounded-lg" />}
                <p className="text-xs text-white line-clamp-2">{asset.prompt}</p>
                <p className="text-[10px] text-white/50">{asset.model}</p>
                <a href={asset.assetUrl} download className="text-xs text-sleek-violet flex items-center gap-1"><Download size={12} /> Download</a>
              </div>
            ))}
            {(filterType === 'all' || filterType === 'script' ? creatives : []).map((c) => (
              <div 
                key={c.id}
                className="p-3.5 rounded-xl bg-sleek-zinc border border-white/5 hover:border-white/15 transition-all space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  {c.imageUrls && c.imageUrls.length > 0 ? (
                    <img 
                      src={c.imageUrls[0]} 
                      alt={c.prompt} 
                      className="w-full h-36 object-cover rounded-lg mb-2"
                    />
                  ) : (
                    <div className="w-full h-24 bg-black/40 rounded-lg flex items-center justify-center text-white/30 text-xs mb-2">
                      Commercial Script
                    </div>
                  )}

                  <h3 className="text-xs font-semibold text-white line-clamp-1">
                    {c.prompt}
                  </h3>
                  <p className="text-[11px] text-white/50 line-clamp-2 mt-1">
                    {c.copy || c.videoScript}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-white/40 pt-2 border-t border-white/5">
                  <span className="tabular-nums">
                    {new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>

                  <button
                    onClick={() => handleCopy(c.copy || c.videoScript, c.id)}
                    className="hover:text-white transition-colors flex items-center gap-1"
                  >
                    {copiedId === c.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedId === c.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
