import React, { useState, useEffect } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  Star, 
  Calendar, 
  ChevronRight, 
  Info, 
  RefreshCw, 
  Instagram, 
  Globe, 
  Layout, 
  ArrowUpRight, 
  CheckCircle2,
  Building2,
  Sparkles,
  Plus,
  X,
  Clock,
  FolderOpen,
  Camera,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { dbService } from '../../services/dbService';
import { AdCreative, Studio, BrandProfile } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import PaymentGatewayModal from '../payment/PaymentGatewayModal';
import { PaymentOrder, PaymentResult } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';

interface StudiosScreenProps {
  activeCreative?: AdCreative | null;
  brandProfile: BrandProfile;
  onToggleLike: (studioId: string) => void;
  initialCategory?: 'all' | 'photography' | 'video' | 'music' | 'podcast' | 'billboard' | 'liked';
  onExploreCreate?: () => void;
  onViewProjects?: () => void;
}

export default function StudiosScreen({ 
  activeCreative, 
  brandProfile, 
  onToggleLike, 
  initialCategory = 'all',
  onExploreCreate,
  onViewProjects
}: StudiosScreenProps) {
  const { user } = useAuth();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'photography' | 'video' | 'music' | 'podcast' | 'billboard' | 'liked'>(initialCategory);
  const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'feed'>('list');
  
  // Mobile Booking Sheet State
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<1 | 2 | 4 | 8>(4);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [bookingNote, setBookingNote] = useState('');
  const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  // Quick studio listing modal
  const [showListingModal, setShowListingModal] = useState(false);
  const [listingName, setListingName] = useState('');
  const [listingLocation, setListingLocation] = useState('Indiranagar, Bangalore');
  const [listingPrice, setListingPrice] = useState(1500);
  const [listingCategory, setListingCategory] = useState<'photography' | 'video' | 'podcast' | 'music'>('video');
  const [listingSaving, setListingSaving] = useState(false);

  // Generate next 14 days
  const next14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateObj: d,
      dateString: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' })
    };
  });

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    const loadStudios = async () => {
      setLoading(true);
      try {
        const data = await dbService.getStudios();
        setStudios(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadStudios();
  }, []);

  const filteredStudios = studios.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                         s.location.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' 
      ? true 
      : selectedCategory === 'liked' 
        ? brandProfile.likedStudioIds?.includes(s.id)
        : s.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleOpenBookingSheet = (studio: Studio) => {
    setSelectedStudio(studio);
    setShowBookingSheet(true);
    setBookingSuccess(false);
  };

  const handleInitiatePayment = () => {
    if (!selectedStudio) return;
    const selectedDate = next14Days[selectedDateIndex];
    const totalPrice = selectedStudio.pricePerHour * selectedDuration;

    setPaymentOrder({
      orderId: `std_${Date.now()}`,
      amount: totalPrice,
      currency: 'INR',
      itemType: 'studio_booking',
      itemTitle: `${selectedDuration}-Hour Pass: ${selectedStudio.name}`,
      itemDescription: `Reserved for ${selectedDate.dayName}, ${selectedDate.dayNumber} ${selectedDate.monthName} • ${selectedStudio.location}`,
      customerEmail: user?.email || 'creator@onlycreation.io',
      customerName: brandProfile.name || 'Creator Brand'
    });
  };

  const handlePaymentSuccess = async (result: PaymentResult) => {
    if (!selectedStudio) return;
    const selectedDate = next14Days[selectedDateIndex];
    const totalPrice = selectedStudio.pricePerHour * selectedDuration;

    try {
      const bId = await dbService.createBooking({
        studioId: selectedStudio.id,
        studioName: selectedStudio.name,
        userId: user?.uid || 'guest_user',
        date: selectedDate.dateString,
        hours: selectedDuration,
        totalPrice: totalPrice,
        status: 'confirmed',
        brandName: brandProfile.name
      });
      setCreatedBookingId(bId);
      setBookingSuccess(true);
    } catch (e) {
      console.warn("Could not record booking in Firestore:", e);
      setBookingSuccess(true);
    }
  };

  const handleCreateStudioListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listingName.trim()) return;

    setListingSaving(true);
    try {
      const newStudio: Omit<Studio, 'id'> = {
        name: listingName.trim(),
        location: listingLocation.trim(),
        pricePerHour: listingPrice,
        rating: 5.0,
        imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800&auto=format&fit=crop',
        category: listingCategory,
        isPremium: true,
        equipment: ['Cinema LED Lighting Kit', 'C-Stands & Booms', 'Backdrops', 'High-Speed Wifi'],
        amenities: ['Lighting Kit', 'High Speed Wifi', 'Green Room', 'Air Conditioned'],
        availability: 'Instant Slots',
        description: 'Creator-first verified space ready for high-production shoots.'
      };
      const newId = await dbService.addStudio(newStudio);
      setStudios(prev => [{ ...newStudio, id: newId }, ...prev]);
      setShowListingModal(false);
      setListingName('');
    } catch (err) {
      console.error(err);
    } finally {
      setListingSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="animate-spin text-sleek-violet" size={32} />
        <span className="text-xs font-mono text-white/50 uppercase tracking-widest">Loading Verified Spaces...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-16 text-left">
      {/* Top Header */}
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tighter text-white">Studios</h1>
            <span className="bg-sleek-violet/20 text-sleek-violet text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full border border-sleek-violet/30">
              Verified Sets
            </span>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-sleek-violet text-white shadow-lg' : 'text-white/40'}`}
              title="List View"
            >
              <SlidersHorizontal size={14} />
            </button>
            <button 
              onClick={() => setViewMode('feed')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'feed' ? 'bg-sleek-violet text-white shadow-lg' : 'text-white/40'}`}
              title="Editorial Feed"
            >
              <Layout size={14} />
            </button>
          </div>
        </div>
        <p className="text-white/40 text-xs font-medium">Daylight lofts, cycloramas & audio booths with verified equipment.</p>
      </header>

      {/* Search and Category Filters */}
      <div 
        className="studio-categories-container sticky top-0 z-40 bg-sleek-black/95 backdrop-blur-md -mx-4 px-4 py-2.5 border-b border-white/10 shrink-0 flex flex-col gap-2.5 shadow-lg shadow-black/40 pointer-events-auto"
        style={{ position: 'sticky', top: 0, zIndex: 40 }}
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
          <input
            type="text"
            placeholder="Search studio by name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-xs font-medium text-white placeholder:text-white/30 outline-none focus:border-sleek-violet transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-0.5">
          {[
            { id: 'all', label: 'All Sets' },
            { id: 'video', label: 'Film & 4K Video' },
            { id: 'photography', label: 'Daylight Lofts' },
            { id: 'podcast', label: 'Podcast & Audio' },
            { id: 'music', label: 'Music Production' },
            { id: 'liked', label: 'Saved Studios' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap border transition-all cursor-pointer select-none active:scale-95 ${
                selectedCategory === cat.id
                  ? 'bg-sleek-violet text-white border-sleek-violet shadow-md shadow-sleek-violet/25'
                  : 'bg-white/5 text-white/50 border-white/5 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Display / Beautiful Empty State */}
      <div className="flex flex-col gap-6">
        {filteredStudios.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 px-4 text-center bg-sleek-dark/30 rounded-3xl border border-white/5">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-sleek-violet shadow-xl">
              <Building2 size={32} />
            </div>
            <div className="max-w-[280px]">
              <h3 className="text-lg font-black text-white mb-1">No studios yet</h3>
              <p className="text-white/50 text-xs leading-relaxed">
                {selectedCategory === 'liked'
                  ? "You haven't bookmarked any studios yet. Tap the star icon on any creative space to save it here."
                  : "We couldn't find production sets matching this category or keyword. Direct an AI concept or list your creative loft."}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 mt-2 w-full max-w-xs">
              {onExploreCreate && (
                <button
                  onClick={onExploreCreate}
                  className="flex-1 bg-sleek-violet hover:bg-purple-600 text-white py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-sleek-violet/25"
                >
                  <Sparkles size={14} /> Explore Create
                </button>
              )}
              <button
                onClick={() => setShowListingModal(true)}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Plus size={14} /> List your studio
              </button>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          filteredStudios.map((studio, idx) => (
            <motion.div
              key={studio.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => setSelectedStudio(studio)}
              className="group flex flex-col gap-3 cursor-pointer bg-sleek-dark/40 p-3 rounded-[32px] border border-white/5 hover:border-sleek-violet/30 transition-all shadow-xl"
            >
              <div className="relative aspect-[16/10] rounded-[24px] overflow-hidden shadow-xl">
                <img
                  src={studio.imageUrl}
                  alt={studio.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLike(studio.id);
                    }}
                    className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
                      brandProfile.likedStudioIds?.includes(studio.id)
                        ? 'bg-red-500 text-white shadow-lg'
                        : 'bg-black/50 text-white/70 hover:text-white'
                    }`}
                  >
                    <Star size={14} className={brandProfile.likedStudioIds?.includes(studio.id) ? 'fill-current' : ''} />
                  </button>
                  <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1 border border-white/10">
                    <Star size={11} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-white">{studio.rating}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-start px-2 py-1">
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-base text-white/95 group-hover:text-sleek-violet transition-colors">{studio.name}</h3>
                  <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                    <MapPin size={10} className="text-sleek-violet" />
                    <span>{studio.location} • {studio.category}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black tracking-tight text-white">₹{studio.pricePerHour}</p>
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest whitespace-nowrap">per hour</p>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col gap-8">
            {filteredStudios.map((studio, idx) => (
              <motion.div
                key={studio.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col gap-4 bg-sleek-dark/30 p-3 rounded-[36px] border border-white/5"
              >
                <div 
                  className="relative aspect-square rounded-[28px] overflow-hidden border border-white/10 cursor-pointer"
                  onClick={() => setSelectedStudio(studio)}
                >
                  <img 
                    src={studio.imageUrl} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike(studio.id);
                      }}
                      className={`p-3 rounded-2xl backdrop-blur-xl border transition-all ${
                        brandProfile.likedStudioIds?.includes(studio.id)
                          ? 'bg-red-500 border-red-400 text-white shadow-xl shadow-red-500/20'
                          : 'bg-black/40 border-white/10 text-white'
                      }`}
                    >
                      <Star size={16} className={brandProfile.likedStudioIds?.includes(studio.id) ? 'fill-current' : ''} />
                    </button>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6">
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-black text-white">{studio.name}</h3>
                          {studio.isPremium && <span className="bg-sleek-violet text-white text-[8px] font-black px-1.5 py-0.5 rounded">PRO</span>}
                        </div>
                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{studio.location} • ₹{studio.pricePerHour}/hr</p>
                      </div>
                      <button 
                        onClick={() => handleOpenBookingSheet(studio)}
                        className="bg-white text-black p-3 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                      >
                        <ArrowUpRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Studio Detail Modal */}
      <AnimatePresence>
        {selectedStudio && !showBookingSheet && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-zinc-950 w-full max-w-md rounded-t-[40px] sm:rounded-[40px] border border-white/10 pb-8 max-h-[90vh] overflow-y-auto hide-scrollbar relative text-left"
            >
              {/* Sticky Top Header */}
              <div className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-white/5">
                <button 
                  onClick={() => setSelectedStudio(null)}
                  className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                >
                  <ChevronRight size={16} className="rotate-180" />
                  <span>Back</span>
                </button>
                <div className="h-1 w-10 bg-white/20 rounded-full" />
                <button 
                  onClick={() => onToggleLike(selectedStudio.id)}
                  className={`p-2 rounded-full border transition-all ${
                    brandProfile.likedStudioIds?.includes(selectedStudio.id)
                      ? 'bg-red-500 border-red-400 text-white'
                      : 'bg-white/5 border-white/10 text-white/40'
                  }`}
                >
                  <Star size={14} className={brandProfile.likedStudioIds?.includes(selectedStudio.id) ? 'fill-current' : ''} />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-6">
                <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                  <img src={selectedStudio.imageUrl} className="w-full h-full object-cover" />
                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-white border border-white/10">
                    ₹{selectedStudio.pricePerHour} / hour
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-black text-white">{selectedStudio.name}</h2>
                  <p className="text-xs text-white/50 font-mono mt-0.5">{selectedStudio.location} • Category: {selectedStudio.category}</p>
                </div>

                <p className="text-xs text-white/70 leading-relaxed font-medium">
                  {selectedStudio.description || 'Modern commercial space designed for high-resolution 4K production, editorial photography, and soundstage recording.'}
                </p>

                {/* Amenities */}
                {selectedStudio.amenities && (
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Included Equipment & Amenities</span>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedStudio.amenities.map(a => (
                        <div key={a} className="flex items-center gap-2 text-white/70 bg-white/5 p-2.5 rounded-xl border border-white/5 text-xs font-medium">
                          <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                          <span>{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Book this Studio CTA button */}
                <button 
                  onClick={() => setShowBookingSheet(true)}
                  className="w-full bg-gradient-to-r from-sleek-violet to-purple-600 hover:from-purple-500 hover:to-sleek-violet text-white py-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-sleek-violet/25 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Calendar size={14} />
                  <span>Book this Studio (Pick Date & Hours)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MOBILE-FRIENDLY BOOKING SHEET (Date Picker next 14 days, Duration Selector, Total Price, Notes, Escrow) */}
      <AnimatePresence>
        {showBookingSheet && selectedStudio && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-sleek-dark w-full max-w-md rounded-t-[36px] sm:rounded-[36px] border border-white/15 p-6 shadow-2xl flex flex-col gap-5 text-left max-h-[92vh] overflow-y-auto hide-scrollbar"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-sleek-violet/20 text-sleek-violet rounded-xl">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Reserve Studio Space</h3>
                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider truncate max-w-[200px]">{selectedStudio.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBookingSheet(false)}
                  className="p-2 text-white/40 hover:text-white rounded-xl hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              {bookingSuccess ? (
                /* Success State with View in Projects */
                <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Booking Authorized & Confirmed!</h3>
                    <p className="text-xs text-white/60 mt-1">
                      {selectedStudio.name} reserved for {next14Days[selectedDateIndex].dayName}, {next14Days[selectedDateIndex].dayNumber} {next14Days[selectedDateIndex].monthName} ({selectedDuration} hrs).
                    </p>
                  </div>

                  <div className="w-full flex flex-col gap-2 pt-4">
                    {onViewProjects && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowBookingSheet(false);
                          setSelectedStudio(null);
                          onViewProjects();
                        }}
                        className="w-full bg-gradient-to-r from-sleek-violet to-purple-600 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-sleek-violet/25"
                      >
                        <FolderOpen size={14} />
                        <span>View in Projects</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setShowBookingSheet(false);
                        setSelectedStudio(null);
                      }}
                      className="w-full bg-white/5 hover:bg-white/10 text-white/70 py-3 rounded-2xl font-bold text-xs uppercase"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* Booking Form */
                <div className="flex flex-col gap-4">
                  {/* 1. Date Picker (Next 14 Days) */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar size={12} className="text-sleek-violet" />
                        <span>Select Date (Next 14 Days)</span>
                      </label>
                      <span className="text-[10px] font-mono text-emerald-400">
                        {next14Days[selectedDateIndex].dayName}, {next14Days[selectedDateIndex].dayNumber} {next14Days[selectedDateIndex].monthName}
                      </span>
                    </div>

                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                      {next14Days.map((d, idx) => {
                        const isSelected = selectedDateIndex === idx;
                        return (
                          <button
                            key={d.dateString}
                            type="button"
                            onClick={() => setSelectedDateIndex(idx)}
                            className={`flex flex-col items-center justify-center min-w-[56px] py-2.5 px-2 rounded-2xl border transition-all shrink-0 ${
                              isSelected
                                ? 'bg-sleek-violet border-sleek-violet text-white shadow-lg shadow-sleek-violet/30'
                                : 'bg-white/5 border-white/5 text-white/60 hover:border-white/20'
                            }`}
                          >
                            <span className="text-[9px] font-bold uppercase">{d.dayName}</span>
                            <span className="text-base font-black leading-tight my-0.5">{d.dayNumber}</span>
                            <span className="text-[8px] opacity-70 uppercase font-mono">{d.monthName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Duration Selector (1h, 2h, 4h, 8h) */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock size={12} className="text-sleek-violet" />
                      <span>Shoot Duration</span>
                    </label>

                    <div className="grid grid-cols-4 gap-2">
                      {([1, 2, 4, 8] as const).map((hrs) => {
                        const isSelected = selectedDuration === hrs;
                        return (
                          <button
                            key={hrs}
                            type="button"
                            onClick={() => setSelectedDuration(hrs)}
                            className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                              isSelected
                                ? 'bg-sleek-violet border-sleek-violet text-white shadow-md'
                                : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'
                            }`}
                          >
                            <span className="text-xs font-black">{hrs} Hour{hrs > 1 ? 's' : ''}</span>
                            <span className="text-[9px] opacity-60 mt-0.5">₹{selectedStudio.pricePerHour * hrs}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Optional Instructions Note */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                      <FileText size={12} className="text-white/40" />
                      <span>Production Requirements (Optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={bookingNote}
                      onChange={(e) => setBookingNote(e.target.value)}
                      placeholder="e.g. Bringing Sony FX3 + Ronin RS3 gimbal, need daylight cyc wall & power drops..."
                      className="bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder:text-white/30 outline-none focus:border-sleek-violet resize-none"
                    />
                  </div>

                  {/* 4. Calculated Total Price & Breakdown */}
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs text-white/70">
                      <span>Rate (₹{selectedStudio.pricePerHour} × {selectedDuration} hrs)</span>
                      <span className="font-mono font-bold text-white">₹{selectedStudio.pricePerHour * selectedDuration}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-white/70">
                      <span>Platform Escrow Protection</span>
                      <span className="text-emerald-400 font-bold text-[10px] uppercase">Free 0%</span>
                    </div>
                    <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-wider text-white">Total Booking Price</span>
                      <span className="text-base font-black font-mono text-emerald-400">
                        ₹{(selectedStudio.pricePerHour * selectedDuration).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* 5. Proceed to Escrow Payment Button */}
                  <button
                    type="button"
                    onClick={handleInitiatePayment}
                    className="w-full bg-gradient-to-r from-sleek-violet via-purple-600 to-sleek-fuchsia text-white py-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-sleek-violet/25 active:scale-[0.98] transition-all hover:brightness-110 cursor-pointer"
                  >
                    <ShieldCheck size={16} />
                    <span>Proceed to Escrow Payment • ₹{(selectedStudio.pricePerHour * selectedDuration).toLocaleString()}</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick List Studio Modal */}
      <AnimatePresence>
        {showListingModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-sleek-dark border border-white/15 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-sleek-violet/20 text-sleek-violet rounded-xl">
                    <Plus size={16} />
                  </div>
                  <h3 className="text-sm font-black text-white">List Production Studio</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowListingModal(false)}
                  className="text-white/40 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateStudioListing} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Studio Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prism Daylight Loft"
                    value={listingName}
                    onChange={(e) => setListingName(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-sleek-violet"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Indiranagar, Bangalore"
                    value={listingLocation}
                    onChange={(e) => setListingLocation(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-sleek-violet"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Price / hr (₹)</label>
                    <input
                      type="number"
                      required
                      value={listingPrice}
                      onChange={(e) => setListingPrice(Number(e.target.value))}
                      className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-sleek-violet font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Category</label>
                    <select
                      value={listingCategory}
                      onChange={(e) => setListingCategory(e.target.value as any)}
                      className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-2.5 text-xs text-white outline-none focus:border-sleek-violet cursor-pointer"
                    >
                      <option value="video" className="bg-sleek-dark">Video & Film</option>
                      <option value="photography" className="bg-sleek-dark">Photography</option>
                      <option value="podcast" className="bg-sleek-dark">Podcast</option>
                      <option value="music" className="bg-sleek-dark">Music</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowListingModal(false)}
                    className="flex-1 py-3 bg-white/5 text-white rounded-xl text-xs font-bold uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={listingSaving}
                    className="flex-1 py-3 bg-sleek-violet text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-sleek-violet/25"
                  >
                    {listingSaving ? 'Publishing...' : 'List Space'}
                  </button>
                </div>
              </form>
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
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
