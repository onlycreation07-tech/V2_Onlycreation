import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Sparkles, 
  Plus, 
  Video, 
  Share2, 
  Clock, 
  CheckCircle2, 
  Play, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { ContentCalendarItem, BrandProfile } from '../../types';

interface ContentCalendarScreenProps {
  brandProfile: BrandProfile;
  onCreateContentPrompt?: (prompt: string) => void;
}

export default function ContentCalendarScreen({
  brandProfile,
  onCreateContentPrompt
}: ContentCalendarScreenProps) {
  const [filterPlatform, setFilterPlatform] = useState<'all' | 'instagram' | 'youtube' | 'tiktok'>('all');

  const [calendarItems, setCalendarItems] = useState<ContentCalendarItem[]>([
    {
      id: 'cal_1',
      day: 'Monday',
      date: 'Oct 12',
      title: 'The 3-Second Rule in Commercial Cinematography',
      platform: 'instagram',
      format: 'Reels',
      hook: 'Stop buying cameras until you learn this lighting angle.',
      status: 'scheduled',
      targetAudience: 'Content creators & indie filmmakers'
    },
    {
      id: 'cal_2',
      day: 'Wednesday',
      date: 'Oct 14',
      title: 'Behind the Lens: 35mm Luxury Perfume Shoot',
      platform: 'youtube',
      format: 'Shorts',
      hook: 'How we captured an 8K commercial on a minimal budget.',
      status: 'ready',
      targetAudience: 'Founders & brand marketers'
    },
    {
      id: 'cal_3',
      day: 'Friday',
      date: 'Oct 16',
      title: 'Faceless Tech Minimalism Breakdown',
      platform: 'tiktok',
      format: 'Reels',
      hook: 'Why minimalist aesthetics drive 3.4x higher conversion.',
      status: 'scripted',
      targetAudience: 'Tech & design enthusiasts'
    },
    {
      id: 'cal_4',
      day: 'Sunday',
      date: 'Oct 18',
      title: 'Q4 Product Showcase & Seasonal Promo',
      platform: 'instagram',
      format: 'Commercial',
      hook: 'The standard of luxury has shifted. Here is the new look.',
      status: 'idea',
      targetAudience: 'VIP Clients & Wholesale Buyers'
    }
  ]);

  const filteredItems = filterPlatform === 'all' 
    ? calendarItems 
    : calendarItems.filter(i => i.platform === filterPlatform);

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto px-4 py-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-sleek-violet/20 text-sleek-violet">
              <CalendarIcon size={18} />
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Content Calendar & Automation
            </h1>
          </div>
          <p className="text-xs md:text-sm text-white/50">
            Automated production schedule for faceless YouTube Shorts, Instagram Reels, and viral brand drops.
          </p>
        </div>

        {/* Platform Filter */}
        <div className="flex items-center gap-1 bg-sleek-zinc p-1 rounded-xl border border-white/10 shrink-0">
          {(['all', 'instagram', 'youtube', 'tiktok'] as const).map(p => (
            <button
              key={p}
              onClick={() => setFilterPlatform(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filterPlatform === p 
                  ? 'bg-sleek-violet text-white shadow-xs' 
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Scheduled Content */}
      <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1 hide-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredItems.map(item => {
            const statusColor = {
              idea: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
              scripted: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
              ready: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
              scheduled: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
              published: 'text-white/40 bg-white/5 border-white/10'
            }[item.status];

            return (
              <div 
                key={item.id}
                className="p-4 rounded-xl bg-sleek-zinc border border-white/5 hover:border-white/15 transition-all space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-white/50">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{item.day}</span>
                    <span>·</span>
                    <span className="tabular-nums">{item.date}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border uppercase ${statusColor}`}>
                    {item.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-white/60 italic">"{item.hook}"</p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-white/40 pt-2 border-t border-white/5">
                  <span className="capitalize">{item.platform} · {item.format}</span>
                  {onCreateContentPrompt && (
                    <button
                      onClick={() => onCreateContentPrompt(`Generate full script and video storyboard for: ${item.title}`)}
                      className="text-sleek-violet hover:text-sleek-fuchsia transition-colors font-medium flex items-center gap-1"
                    >
                      Produce in Creation AI <ArrowRight size={11} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
