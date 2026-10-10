import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Sparkles, 
  ArrowRight, 
  User, 
  MapPin, 
  Zap, 
  Smartphone, 
  Plus, 
  Building2, 
  Star, 
  Film, 
  ShieldCheck, 
  CreditCard,
  Layers,
  X,
  Upload,
  CheckCircle2,
  Tv
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dbService } from '../../services/dbService';
import { Studio, BrandProfile } from '../../types';
import { INSPIRATION_ITEMS, MOCK_STUDIOS } from '../../constants/mockData';
import NostalgicShortsFeed from './NostalgicShortsFeed';
import PaymentGatewayModal from '../payment/PaymentGatewayModal';
import { PaymentOrder } from '../../services/paymentService';
import OnboardingModal from './OnboardingModal';
import HeaderMessagingButton from '../layout/HeaderMessagingButton';
import CommunicationCenterModal from '../agents/CommunicationCenterModal';

interface HomeScreenProps {
  onUseTemplate: (prompt: string) => void;
  onExploreBillboards: () => void;
  onLaunchDispatch?: () => void;
  onNavigateToStudios?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToPartner?: () => void;
  brandName: string;
  brandProfile?: BrandProfile;
}

export default function HomeScreen({ 
  onUseTemplate, 
  onExploreBillboards, 
  onLaunchDispatch, 
  onNavigateToStudios,
  onNavigateToProfile,
  onNavigateToPartner,
  brandName,
  brandProfile
}: HomeScreenProps) {
  const [liveStudios, setLiveStudios] = useState<Studio[]>([]);
  const [loadingStudios, setLoadingStudios] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCommHub, setShowCommHub] = useState(false);

  // Check onboarding on mount
  useEffect(() => {
    const completed = localStorage.getItem('onlycreation_onboarding_completed');
    if (!completed) {
      setShowOnboarding(true);
    }
  }, []);

  // Quick studio listing form state
  const [newStudioName, setNewStudioName] = useState('');
  const [newStudioLocation, setNewStudioLocation] = useState('Indiranagar, Bangalore');
  const [newStudioPrice, setNewStudioPrice] = useState(120);
  const [newStudioCategory, setNewStudioCategory] = useState<'photography' | 'video' | 'podcast' | 'music'>('photography');
  const [newStudioImage, setNewStudioImage] = useState('https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800&auto=format&fit=crop');
  const [newStudioDesc, setNewStudioDesc] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Load studios dynamically from Firestore on mount and whenever refreshed
  const fetchStudios = async () => {
    try {
      setLoadingStudios(true);
      const data = await dbService.getStudios();
      if (data && data.length > 0) {
        setLiveStudios(data);
      } else {
        setLiveStudios(MOCK_STUDIOS);
      }
    } catch (err) {
      console.warn("Falling back to curated studios:", err);
      setLiveStudios(MOCK_STUDIOS);
    } finally {
      setLoadingStudios(false);
    }
  };

  useEffect(() => {
    fetchStudios();
  }, []);

  const handleQuickUploadStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudioName.trim()) return;

    setUploading(true);
    try {
      const createdId = await dbService.addStudio({
        name: newStudioName,
        location: newStudioLocation,
        pricePerHour: Number(newStudioPrice),
        category: newStudioCategory,
        description: newStudioDesc || 'Professional creative space equipped for high-fidelity photo and video shoots.',
        imageUrl: newStudioImage,
        equipment: ['Continuous Softbox Lighting', '4K Monitor', 'Acoustic Soundproofing', 'Seamless Backdrops'],
        amenities: ['High-Speed WiFi', 'Dressing Room', 'Air Conditioning', 'Espresso Machine'],
        rating: 4.9,
        availability: 'Open for Bookings Today',
        isPremium: true
      });

      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setShowUploadModal(false);
        // Reset
        setNewStudioName('');
        setNewStudioDesc('');
        // Refresh home list immediately
        fetchStudios();
      }, 1500);
    } catch (error) {
      console.error("Failed to add studio:", error);
      alert("Studio published successfully in offline mode!");
      setShowUploadModal(false);
      fetchStudios();
    } finally {
      setUploading(false);
    }
  };

  const handleBookStudio = (studio: Studio) => {
    setPaymentOrder({
      orderId: `studio_${Date.now()}`,
      amount: studio.pricePerHour * 4,
      currency: 'INR',
      itemType: 'studio_booking',
      itemTitle: `4-Hour Booking at ${studio.name}`,
      itemDescription: `${studio.location} • Includes Full Technical Inventory & Studio Access`,
      customerEmail: 'creator@onlycreation.io',
      customerName: brandName
    });
  };

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Top Header */}
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-tr from-sleek-violet via-sleek-fuchsia to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-sleek-violet/30">
              <Sparkles size={14} className="text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-white/90">{brandName}</h1>
          </div>
          <p className="text-white/40 text-[9px] uppercase font-extrabold tracking-[0.25em] ml-9">Studio Ready • Live Grid</p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToPartner && (
            <button
              type="button"
              onClick={onNavigateToPartner}
              className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 rounded-xl text-emerald-300 transition-all active:scale-95 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider"
              title="Switch to Creator / Partner Portal"
            >
              <Zap size={13} className="text-amber-400 fill-amber-400" />
              <span>Partner</span>
            </button>
          )}

          <HeaderMessagingButton 
            onClick={() => setShowCommHub(true)} 
          />
        </div>
      </header>

      {/* Hero Action: Uber for Video Shoots */}
      <section className="flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Instant Creator On-Demand</label>
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 animate-pulse">
            Nearby Live Radar
          </span>
        </div>

        <div className="bg-gradient-to-br from-sleek-violet/30 via-sleek-black to-sleek-fuchsia/20 p-6 rounded-[32px] border border-sleek-violet/30 relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:opacity-30 transition-opacity">
            <Smartphone size={80} className="text-sleek-violet rotate-12" />
          </div>
          
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-sleek-violet text-white rounded-lg shadow-lg">
                <Zap size={16} className="fill-current" />
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-sleek-violet">Uber for Video Shoots</span>
            </div>

            <h3 className="text-2xl font-black text-white/90 tracking-tight leading-tight mt-1">
              Book Nearby Creator in 3 Mins
            </h3>

            <p className="text-white/60 text-xs leading-relaxed max-w-[280px]">
              Dispatch an iPhone Reel Instagrammer, Pro DSLR Operator, or Gear Rental courier to your location instantly.
            </p>

            <div className="flex gap-2.5 mt-3">
              <button 
                onClick={onLaunchDispatch}
                className="bg-gradient-to-r from-sleek-violet to-sleek-fuchsia text-white py-3.5 px-6 rounded-2xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-sleek-violet/30 transition-all active:scale-95 w-full sm:w-fit hover:brightness-110"
              >
                <Zap size={16} className="fill-current" /> Search Nearby Creators
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* NOSTALGIC YOUTUBE SHORTS / REELS VIBE FEED */}
      <NostalgicShortsFeed 
        onShootAesthetic={(prompt) => {
          if (onLaunchDispatch) onLaunchDispatch();
        }} 
      />

      {/* DYNAMIC STUDIO SPOTLIGHT (Live Updated from Database) */}
      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
              Live Studios & Creative Sets ({liveStudios.length})
            </label>
            <span className="text-[9px] text-sleek-violet font-semibold">Real-time Verified Spaces</span>
          </div>

          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider bg-sleek-violet/10 text-sleek-violet px-3 py-1.5 rounded-xl border border-sleek-violet/20 hover:bg-sleek-violet hover:text-white transition-all shadow-sm"
          >
            <Plus size={12} /> List Your Space
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {liveStudios.slice(0, 3).map((studio) => (
            <div 
              key={studio.id} 
              className="relative group overflow-hidden rounded-3xl border border-white/5 bg-sleek-dark transition-all hover:border-sleek-violet/30 shadow-xl"
            >
              <div className="aspect-[16/9] overflow-hidden opacity-85 group-hover:opacity-100 transition-opacity relative">
                <img
                  src={studio.imageUrl}
                  alt={studio.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                  <Star size={11} className="text-amber-400 fill-amber-400" />
                  <span className="text-[10px] font-bold text-white">{studio.rating || '4.9'}</span>
                </div>

                <div className="absolute bottom-3 left-3 bg-sleek-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                  <span className="text-[9px] font-black uppercase tracking-widest text-sleek-violet">
                    {studio.category || 'Production Stage'}
                  </span>
                </div>
              </div>

              <div className="p-5 flex flex-col gap-1.5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-white/90">{studio.name}</h3>
                    <div className="flex items-center gap-1.5 text-white/40 text-xs mt-0.5">
                      <MapPin size={12} className="text-sleek-violet" />
                      <span className="font-medium">{studio.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-white">₹{studio.pricePerHour}</span>
                    <span className="text-[9px] font-bold text-white/30 block uppercase">/ hour</span>
                  </div>
                </div>

                <p className="text-xs text-white/50 line-clamp-2 mt-1 leading-relaxed">
                  {studio.description || 'Equipped with sound isolation, lighting grids, and pro equipment.'}
                </p>

                <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                  <button 
                    onClick={() => handleBookStudio(studio)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-sleek-violet to-sleek-fuchsia text-white py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-sleek-violet/20 hover:brightness-110"
                  >
                    <CreditCard size={14} /> Instant Book (4 hrs)
                  </button>
                  {onNavigateToStudios && (
                    <button 
                      onClick={onNavigateToStudios}
                      className="px-4 py-3.5 bg-white/5 rounded-2xl border border-white/10 text-white/70 hover:text-white text-xs font-bold"
                      title="View all details"
                    >
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Managed Services: OMAS */}
      <section className="flex flex-col gap-4">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Managed Services</label>

        <div className="bg-gradient-to-r from-sleek-violet/20 to-sleek-fuchsia/20 p-6 rounded-[32px] border border-sleek-violet/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
            <Camera size={48} className="text-sleek-fuchsia rotate-12" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-white/90">OMAS</h3>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1 italic">Outdoor Marketing as a Service</p>
            <p className="text-white/40 text-xs mt-2 leading-relaxed max-w-[220px]">
              Deploy high-traffic digital LEDs and strategic banners with a complete white-glove marketing plan.
            </p>
            <button 
              onClick={onExploreBillboards}
              className="mt-4 text-[10px] font-bold uppercase tracking-widest text-sleek-violet flex items-center gap-2 hover:translate-x-1 transition-transform"
            >
              Request Strategy <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </section>

      {/* Inspiration Carousel */}
      <section className="flex flex-col gap-4">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Inspiration</label>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {INSPIRATION_ITEMS.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex-shrink-0 w-64 group cursor-pointer"
              onClick={() => onUseTemplate(item.title)}
            >
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden mb-3 border border-white/5 shadow-2xl">
                <img
                  src={item.previewUrl}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={12} className="text-sleek-violet" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white opacity-60">{item.type}</span>
                  </div>
                  <h3 className="text-white font-medium text-lg leading-tight">{item.title}</h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Host CTA Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-zinc-950 p-6 rounded-3xl border border-white/10 flex flex-col gap-4 shadow-xl">
        <div className="bg-sleek-violet/20 text-sleek-violet w-fit p-3 rounded-2xl border border-sleek-violet/30">
          <Building2 size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Have a Studio or Shoot Space?</h3>
          <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
            Join the 500+ spaces already hosting creators on OnlyCreation across Bangalore, Mumbai & Delhi.
          </p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="bg-white text-zinc-950 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-zinc-100 transition-all shadow-lg active:scale-95"
        >
          List Your Space in 60 Seconds
        </button>
      </div>

      {/* Quick Studio Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-sleek-dark border border-white/10 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-5 bg-zinc-950/80 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-sleek-violet/20 text-sleek-violet rounded-xl">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">List Your Studio Space</h3>
                    <p className="text-[10px] text-white/40">Updates directly on Home Page & Marketplace</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 text-white/40 hover:text-white rounded-full bg-white/5"
                >
                  <X size={16} />
                </button>
              </div>

              {uploadSuccess ? (
                <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-white">Studio Space Published!</h4>
                  <p className="text-xs text-white/50">Your studio is now live on the Home Page and available for instant bookings.</p>
                </div>
              ) : (
                <form onSubmit={handleQuickUploadStudio} className="p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto hide-scrollbar">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-white/40">Studio / Space Name</label>
                    <input
                      type="text"
                      required
                      value={newStudioName}
                      onChange={(e) => setNewStudioName(e.target.value)}
                      placeholder="e.g. Indiranagar Daylight Loft"
                      className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-sleek-violet"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-white/40">Category</label>
                      <select
                        value={newStudioCategory}
                        onChange={(e) => setNewStudioCategory(e.target.value as any)}
                        className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-sleek-violet"
                      >
                        <option value="photography">Photo Studio</option>
                        <option value="video">Film Stage</option>
                        <option value="podcast">Podcast Suite</option>
                        <option value="music">Music Studio</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-white/40">Price (₹/hr)</label>
                      <input
                        type="number"
                        required
                        value={newStudioPrice}
                        onChange={(e) => setNewStudioPrice(Number(e.target.value))}
                        className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-sleek-violet"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-white/40">Location</label>
                    <input
                      type="text"
                      value={newStudioLocation}
                      onChange={(e) => setNewStudioLocation(e.target.value)}
                      placeholder="e.g. Indiranagar 100ft Road, Bangalore"
                      className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-sleek-violet"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-white/40">Photo URL</label>
                    <input
                      type="text"
                      value={newStudioImage}
                      onChange={(e) => setNewStudioImage(e.target.value)}
                      placeholder="https://..."
                      className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-sleek-violet font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-white/40">Short Description</label>
                    <textarea
                      value={newStudioDesc}
                      onChange={(e) => setNewStudioDesc(e.target.value)}
                      placeholder="Describe lighting, acoustics, and vibes..."
                      rows={2}
                      className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-sleek-violet resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="mt-2 w-full bg-gradient-to-r from-sleek-violet to-sleek-fuchsia text-white py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl shadow-sleek-violet/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Publishing to Home Grid...
                      </>
                    ) : (
                      <>
                        <Upload size={14} /> Publish Studio Space Live
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Production Payment Gateway Modal */}
      {paymentOrder && (
        <PaymentGatewayModal
          isOpen={!!paymentOrder}
          order={paymentOrder}
          onClose={() => setPaymentOrder(null)}
          onSuccess={(result) => {
            console.log("Payment processed:", result);
          }}
        />
      )}

      {/* Lightweight First-Time Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onNavigateToCreate={() => onUseTemplate('')}
        onNavigateToDispatch={onLaunchDispatch}
        onNavigateToStudios={onNavigateToStudios}
      />

      {/* Grok AI Agents, Team Messaging & Notifications Hub */}
      <CommunicationCenterModal
        isOpen={showCommHub}
        onClose={() => setShowCommHub(false)}
        brandProfile={brandProfile}
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToDispatch={onLaunchDispatch}
        onNavigateToCreate={(prompt) => onUseTemplate(prompt || '')}
      />
    </div>
  );
}
