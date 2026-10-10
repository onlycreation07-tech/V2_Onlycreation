import React, { useState } from 'react';
import { 
  Zap, 
  MapPin, 
  Clock, 
  DollarSign, 
  Upload, 
  CheckCircle2, 
  Camera, 
  Film, 
  Scissors, 
  Building2, 
  Truck, 
  AlertCircle, 
  ExternalLink, 
  FileText, 
  Play, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Phone, 
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PartnerGig, 
  RentalGearItem, 
  StudioBookingSlot, 
  StakeholderRole 
} from '../../types/stakeholder';
import { 
  INITIAL_PARTNER_GIGS, 
  INITIAL_RENTAL_GEAR, 
  INITIAL_STUDIO_BOOKINGS 
} from '../../constants/stakeholderData';

interface PartnerWorkSectionProps {
  currentRole: StakeholderRole;
  roleTitle: string;
  onCreditWallet: (amount: number, note: string) => void;
}

export default function PartnerWorkSection({ currentRole, roleTitle, onCreditWallet }: PartnerWorkSectionProps) {
  // Gigs State
  const [gigs, setGigs] = useState<PartnerGig[]>(INITIAL_PARTNER_GIGS);
  const [selectedGig, setSelectedGig] = useState<PartnerGig | null>(null);

  // Rental Gear State
  const [rentalGear, setRentalGear] = useState<RentalGearItem[]>(INITIAL_RENTAL_GEAR);
  const [gearFilter, setGearFilter] = useState<'all' | 'on_rent' | 'returned_inspection' | 'overdue' | 'available'>('all');

  // Studio Bookings State
  const [studioSlots, setStudioSlots] = useState<StudioBookingSlot[]>(INITIAL_STUDIO_BOOKINGS);

  // Upload Work Modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadLink, setUploadLink] = useState('https://assets.mixkit.co/videos/preview/mixkit-barista-pouring-coffee-art-in-a-cafe-41558-large.mp4');
  const [uploadNotes, setUploadNotes] = useState('Color graded in DaVinci Resolve. Exported 4K 9:16 Instagram Reel.');
  const [uploadSuccessToast, setUploadSuccessToast] = useState(false);

  // Accept Gig (Radar action)
  const handleAcceptGig = (gigId: string) => {
    setGigs(prev => prev.map(g => {
      if (g.id === gigId) {
        return {
          ...g,
          status: currentRole === 'video_editor' ? 'editing_in_progress' : 'on_the_way',
          acceptedAt: 'Just now'
        };
      }
      return g;
    }));
  };

  // Progress Shoot Status for Reel Creator & Videographer
  const handleUpdateGigStatus = (gigId: string, newStatus: PartnerGig['status']) => {
    setGigs(prev => prev.map(g => {
      if (g.id === gigId) {
        return { ...g, status: newStatus };
      }
      return g;
    }));
  };

  // Submit Completed Upload & Trigger Payment
  const handleSubmitDeliverable = (gig: PartnerGig) => {
    setGigs(prev => prev.map(g => {
      if (g.id === gig.id) {
        return {
          ...g,
          status: 'completed',
          masterVideoUrl: uploadLink,
          clientNotes: uploadNotes
        };
      }
      return g;
    }));

    setUploadModalOpen(false);
    setUploadSuccessToast(true);
    setTimeout(() => setUploadSuccessToast(false), 4000);

    // Credit partner wallet immediately!
    onCreditWallet(gig.payoutAmount, `Shoot Completed: ${gig.title}`);
  };

  // Rental Goods Received Inspection action
  const handleVerifyReturnInspection = (gearId: string) => {
    setRentalGear(prev => prev.map(item => {
      if (item.id === gearId) {
        return {
          ...item,
          status: 'available',
          conditionNotes: 'Inspected & clean. Returned to active shelf.'
        };
      }
      return item;
    }));
    onCreditWallet(400, 'Inspection & Restocking Fee Credited');
  };

  // Rental Send Overdue Reminder
  const handleSendOverdueAlert = (gear: RentalGearItem) => {
    alert(`SMS & Push notification sent to borrower ${gear.borrowerName} (${gear.borrowerPhone}): "Your rental for ${gear.name} is overdue. Please return immediately or daily late fee applies."`);
  };

  // Studio Slot Actions
  const handleConfirmSlot = (slotId: string) => {
    setStudioSlots(prev => prev.map(s => s.id === slotId ? { ...s, status: 'confirmed' } : s));
  };

  return (
    <div className="flex flex-col gap-5 pb-12 text-left">
      {/* Toast Notification on Payout Release */}
      <AnimatePresence>
        {uploadSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 inset-x-4 max-w-sm mx-auto z-50 bg-emerald-500 text-black p-3.5 rounded-2xl shadow-2xl flex items-center justify-between font-black text-xs"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="fill-black text-emerald-500" />
              <span>Work Uploaded & Payment Credited to Wallet!</span>
            </div>
            <span className="bg-black/20 px-2 py-0.5 rounded text-[10px]">Instant UPI</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          ROLE 1: VIDEO REEL CREATOR (Mobile & Gimbal)
          ======================================================== */}
      {currentRole === 'reel_creator' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white">Reel Creator Dispatch Queue</h3>
              <p className="text-[11px] text-white/50">Accept nearby shoots, head to location, and upload final cuts</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Radar On
            </span>
          </div>

          {/* Active Work in Progress */}
          {gigs.filter(g => g.roleRequired === 'reel_creator' && ['shooting', 'on_the_way', 'accepted'].includes(g.status)).map((gig) => (
            <div key={gig.id} className="bg-gradient-to-br from-sleek-dark via-sleek-dark to-purple-950/20 p-4 rounded-3xl border-2 border-sleek-violet/50 shadow-xl flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-sleek-violet text-white text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Zap size={10} className="fill-white" />
                  Active Shoot In Progress
                </span>
                <span className="text-sm font-black text-emerald-400 font-mono">₹{gig.payoutAmount.toLocaleString()}</span>
              </div>

              <div>
                <h4 className="font-black text-sm text-white">{gig.title}</h4>
                <div className="flex items-center gap-2 text-[11px] text-white/60 mt-0.5">
                  <span className="text-sleek-violet font-bold">{gig.clientName}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><MapPin size={11} /> {gig.location}</span>
                </div>
              </div>

              <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-[11px] text-white/70">
                <span className="font-bold text-white block mb-0.5">Client Brief:</span>
                {gig.brief}
              </div>

              {/* Progress Milestones: On the way -> Shooting -> Upload Work */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleUpdateGigStatus(gig.id, 'on_the_way')}
                  className={`py-2 px-2 rounded-xl text-[10px] font-extrabold uppercase transition-all flex items-center justify-center gap-1 ${
                    gig.status === 'on_the_way'
                      ? 'bg-amber-500 text-black shadow-md'
                      : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  <MapPin size={11} /> 1. On The Way
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateGigStatus(gig.id, 'shooting')}
                  className={`py-2 px-2 rounded-xl text-[10px] font-extrabold uppercase transition-all flex items-center justify-center gap-1 ${
                    gig.status === 'shooting'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  <Camera size={11} /> 2. Shooting
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedGig(gig);
                    setUploadModalOpen(true);
                  }}
                  className="py-2 px-2 rounded-xl text-[10px] font-extrabold uppercase bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1"
                >
                  <Upload size={11} /> 3. Upload & Pay
                </button>
              </div>
            </div>
          ))}

          {/* Available Radar Shoots */}
          <div className="flex flex-col gap-2.5 pt-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-white/40">
              Available Shoot Requests Near You
            </span>

            {gigs.filter(g => g.roleRequired === 'reel_creator' && g.status === 'available').map((gig) => (
              <div key={gig.id} className="bg-sleek-dark p-4 rounded-3xl border border-white/10 flex flex-col gap-3 hover:border-sleek-violet/40 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-black text-white">{gig.title}</span>
                  </div>
                  <span className="text-sm font-black text-emerald-400 font-mono">₹{gig.payoutAmount}</span>
                </div>

                <p className="text-[11px] text-white/60 leading-relaxed">{gig.brief}</p>

                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-white/50">
                  <span className="flex items-center gap-1"><MapPin size={11} className="text-sleek-violet" /> {gig.location}</span>
                  <span className="flex items-center gap-1"><Clock size={11} /> {gig.durationHours}h shoot</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleAcceptGig(gig.id)}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-black font-black text-xs py-2.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Zap size={14} className="fill-black" />
                  <span>Accept Shoot (₹{gig.payoutAmount})</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          ROLE 2: CINEMA VIDEOGRAPHER (Sony FX3 / RED)
          ======================================================== */}
      {currentRole === 'videographer' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white">Cinema Footage & Ingest Vault</h3>
              <p className="text-[11px] text-white/50">Manage commercial call sheets and upload raw S-Log3 footage for video editors</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-black uppercase tracking-wider">
              Sony FX3 Pro
            </span>
          </div>

          {/* Footage Uploaded & Waiting for Editor */}
          {gigs.filter(g => g.roleRequired === 'videographer').map((gig) => (
            <div key={gig.id} className="bg-sleek-dark p-4 rounded-3xl border border-white/10 flex flex-col gap-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-extrabold uppercase flex items-center gap-1">
                  <CheckCircle2 size={10} /> 4K S-Log3 Footage Ingested
                </span>
                <span className="text-sm font-black text-emerald-400 font-mono">₹{gig.payoutAmount.toLocaleString()}</span>
              </div>

              <div>
                <h4 className="font-extrabold text-sm text-white">{gig.title}</h4>
                <p className="text-[11px] text-white/60 mt-0.5">{gig.clientName} • {gig.location}</p>
              </div>

              {gig.rawFootageUrl && (
                <div className="bg-white/5 rounded-2xl p-2.5 border border-white/5 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 truncate mr-2">
                    <Film size={14} className="text-sleek-violet shrink-0" />
                    <span className="truncate font-mono text-white/80">{gig.rawFootageUrl}</span>
                  </div>
                  <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-sleek-violet text-white font-extrabold shrink-0">
                    Live In Queue
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-white/50 pt-1">
                <span>Transferred to Video Editor Queue</span>
                <span className="text-emerald-400 font-bold">Escrow Released</span>
              </div>
            </div>
          ))}

          {/* New Call Sheet Shoot Action */}
          <div className="bg-gradient-to-r from-sleek-violet/20 to-purple-900/20 p-4 rounded-3xl border border-sleek-violet/30 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-white font-extrabold text-xs">
              <Sparkles size={14} className="text-sleek-violet" />
              <span>High-Ticket Commercial Call Sheet</span>
            </div>
            <p className="text-[11px] text-white/60">
              Shooting on set today? Upload your camera card proxies or Google Drive link directly here so the assigned colorist starts cutting within minutes.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedGig(gigs[0]);
                setUploadModalOpen(true);
              }}
              className="py-2.5 px-4 bg-sleek-violet hover:bg-sleek-violet/80 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Upload size={14} />
              <span>Upload New Camera Card Raw Vault</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          ROLE 3: VIDEO EDITOR & COLORIST (The Gig Take Marketplace)
          ======================================================== */}
      {currentRole === 'video_editor' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white">Video Editor Gig Radar</h3>
              <p className="text-[11px] text-white/50">Pick up raw footage uploaded by videographers & creators, edit, and get paid</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider">
              DaVinci 19 Online
            </span>
          </div>

          {/* Available Editing Gigs to TAKE (Like Uber Driver Order Screen) */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-white/40">
              Raw Footage Ready For Editing ({gigs.filter(g => g.roleRequired === 'video_editor' && g.status === 'available').length} Gigs)
            </span>

            {gigs.filter(g => g.roleRequired === 'video_editor' && g.status === 'available').map((gig) => (
              <div key={gig.id} className="bg-gradient-to-br from-sleek-dark to-purple-950/20 p-4 rounded-3xl border-2 border-sleek-violet/40 shadow-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-sleek-violet text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Scissors size={10} /> Instant Editing Gig
                  </span>
                  <span className="text-base font-black text-emerald-400 font-mono">₹{gig.payoutAmount.toLocaleString()}</span>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-white">{gig.title}</h4>
                  <p className="text-[11px] text-white/60 mt-0.5">Uploaded by Vikram Malhotra (Sony FX3 S-Log3)</p>
                </div>

                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-[11px] text-white/70">
                  <span className="font-bold text-white block mb-0.5">Style & Color Request:</span>
                  {gig.brief}
                </div>

                {/* Raw Footage Preview Link */}
                {gig.rawFootageUrl && (
                  <div className="flex items-center justify-between text-[11px] text-white/50 bg-black/40 p-2 rounded-xl">
                    <span className="flex items-center gap-1.5 truncate">
                      <Film size={12} className="text-sleek-violet" />
                      <span className="truncate font-mono">4K S-Log3 Proxy Footage Available</span>
                    </span>
                    <a 
                      href={gig.rawFootageUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-sleek-violet hover:underline text-[10px] font-bold shrink-0 flex items-center gap-1"
                    >
                      <span>Preview Clips</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                )}

                {/* TAKE THIS EDITING GIG BUTTON */}
                <button
                  type="button"
                  onClick={() => handleAcceptGig(gig.id)}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-black font-black text-xs py-3 rounded-2xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
                >
                  <Scissors size={15} className="fill-black" />
                  <span>Take This Editing Gig (Earn ₹{gig.payoutAmount})</span>
                </button>
              </div>
            ))}

            {/* Currently Editing in Progress */}
            {gigs.filter(g => g.roleRequired === 'video_editor' && g.status === 'editing_in_progress').map((gig) => (
              <div key={gig.id} className="bg-sleek-dark p-4 rounded-3xl border border-white/10 flex flex-col gap-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-extrabold uppercase flex items-center gap-1">
                    <Clock size={10} /> Editing on Timeline
                  </span>
                  <span className="text-sm font-black text-emerald-400 font-mono">₹{gig.payoutAmount.toLocaleString()}</span>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-white">{gig.title}</h4>
                  <p className="text-[11px] text-white/60 mt-0.5">{gig.clientName} • Deadline: {gig.deadline}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={gig.rawFootageUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-white/10"
                  >
                    <Film size={13} />
                    <span>Download Proxies</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGig(gig);
                      setUploadModalOpen(true);
                    }}
                    className="py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                  >
                    <Upload size={13} />
                    <span>Deliver Master Cut</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          ROLE 4: STUDIO SPACE OWNER
          ======================================================== */}
      {currentRole === 'studio_owner' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white">Studio Bookings & Stages</h3>
              <p className="text-[11px] text-white/50">Monitor booked time slots, stage occupancy, and daily payouts</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider">
              Occupancy: 82%
            </span>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-sleek-dark p-3 rounded-2xl border border-white/5">
              <span className="text-[9px] font-bold text-white/50 uppercase block">Today Booked</span>
              <span className="text-base font-black text-white font-mono">15 Hours</span>
            </div>
            <div className="bg-sleek-dark p-3 rounded-2xl border border-white/5">
              <span className="text-[9px] font-bold text-white/50 uppercase block">Today Payout</span>
              <span className="text-base font-black text-emerald-400 font-mono">₹49,500</span>
            </div>
            <div className="bg-sleek-dark p-3 rounded-2xl border border-white/5">
              <span className="text-[9px] font-bold text-white/50 uppercase block">Cyclorama</span>
              <span className="text-base font-black text-sleek-violet font-mono">Repainted</span>
            </div>
          </div>

          {/* Booking Slots List */}
          <div className="flex flex-col gap-3">
            {studioSlots.map((slot) => (
              <div key={slot.id} className="bg-sleek-dark p-4 rounded-3xl border border-white/10 flex flex-col gap-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white">{slot.stageName}</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">₹{slot.amount.toLocaleString()}</span>
                </div>

                <div className="text-[11px] text-white/70">
                  <p className="font-bold text-white">{slot.clientName}</p>
                  <p className="text-white/50">{slot.timeSlot} • {slot.date}</p>
                </div>

                <div className="flex flex-wrap gap-1 text-[9px]">
                  {slot.gearIncluded.map((g, idx) => (
                    <span key={idx} className="bg-white/5 px-2 py-0.5 rounded text-white/70">
                      {g}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={11} /> Advance Deposit Received
                  </span>
                  <span className="text-white/50 font-mono">{slot.clientPhone}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          ROLE 5: CAMERA & GEAR RENTAL OWNER
          ======================================================== */}
      {currentRole === 'rental_vendor' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white">Camera Gear & Rental Inventory</h3>
              <p className="text-[11px] text-white/50">Track gear on rent, returned items undergoing check, and overdue alerts</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-sleek-violet/20 text-sleek-violet border border-sleek-violet/30 text-[9px] font-black uppercase tracking-wider">
              Total 48 Items
            </span>
          </div>

          {/* Gear Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all', label: 'All Gear' },
              { id: 'on_rent', label: '🔴 On Rent (2)' },
              { id: 'returned_inspection', label: '🟡 Received / Inspection (1)' },
              { id: 'overdue', label: '⚠️ Overdue (1)' },
              { id: 'available', label: '🟢 Available Shelf (2)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setGearFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all border ${
                  gearFilter === tab.id
                    ? 'bg-sleek-violet text-white border-sleek-violet shadow-md'
                    : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Rental Gear List */}
          <div className="flex flex-col gap-3">
            {rentalGear
              .filter(item => gearFilter === 'all' || item.status === gearFilter)
              .map((item) => (
                <div key={item.id} className="bg-sleek-dark p-4 rounded-3xl border border-white/10 flex flex-col gap-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-12 h-12 rounded-2xl object-cover border border-white/10 shrink-0"
                      />
                      <div>
                        <h4 className="font-extrabold text-xs text-white leading-tight">{item.name}</h4>
                        <span className="text-[9px] font-mono text-white/50">{item.serialNumber}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-400 font-mono">₹{item.dailyRate}/day</div>
                      <span className="text-[8px] uppercase tracking-wider text-white/40 font-bold">
                        Dep: ₹{item.depositAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Borrower & Return Status info */}
                  {item.status === 'on_rent' && (
                    <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-2xl flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-bold text-rose-300 block">{item.borrowerName}</span>
                        <span className="text-[10px] text-white/50">Return Expected: {item.expectedReturnDate}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-rose-500 text-white text-[9px] font-extrabold uppercase">
                        On Set
                      </span>
                    </div>
                  )}

                  {item.status === 'returned_inspection' && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-2xl flex flex-col gap-2 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300">Returned by {item.borrowerName}</span>
                        <span className="text-[9px] text-amber-400 font-bold uppercase">Ready for Check</span>
                      </div>
                      <p className="text-[10px] text-white/70">{item.conditionNotes}</p>
                      <button
                        type="button"
                        onClick={() => handleVerifyReturnInspection(item.id)}
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-md"
                      >
                        <CheckCircle2 size={13} />
                        <span>Pass Inspection & Release Caution Deposit</span>
                      </button>
                    </div>
                  )}

                  {item.status === 'overdue' && (
                    <div className="bg-red-500/15 border border-red-500/30 p-2.5 rounded-2xl flex flex-col gap-2 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-red-400 flex items-center gap-1">
                          <AlertCircle size={13} /> Overdue Return Alert
                        </span>
                        <span className="text-[9px] font-mono text-red-300 font-bold">Delayed by 24h</span>
                      </div>
                      <p className="text-[10px] text-white/70">{item.conditionNotes}</p>
                      <button
                        type="button"
                        onClick={() => handleSendOverdueAlert(item)}
                        className="w-full py-2 bg-red-500 hover:bg-red-400 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-md"
                      >
                        <Phone size={13} />
                        <span>Send Urgent SMS & WhatsApp Return Reminder</span>
                      </button>
                    </div>
                  )}

                  {item.status === 'available' && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl flex items-center justify-between text-[11px]">
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 size={12} /> Available in Shelf (Ready for Express Courier)
                      </span>
                      <span className="text-[9px] font-mono text-white/50">Checked</span>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================
          ROLE 6: CREATIVE AGENCY OWNER
          ======================================================== */}
      {currentRole === 'agency_owner' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white">Agency Campaign Operations</h3>
              <p className="text-[11px] text-white/50">Manage multi-creator rosters, brand retainers, and crew deployments</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-sleek-violet/20 text-sleek-violet border border-sleek-violet/30 text-[9px] font-black uppercase tracking-wider">
              5 Active Campaigns
            </span>
          </div>

          <div className="bg-sleek-dark p-4 rounded-3xl border border-white/10 flex flex-col gap-3">
            <h4 className="font-black text-xs uppercase text-white/60">Turnkey Client Contracts</h4>
            <div className="flex flex-col gap-2">
              <div className="bg-white/5 p-3 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-white block">Urban Company • 12 Monthly Reels</span>
                  <span className="text-[10px] text-white/50">3 Creators Assigned • Sony FX3 + Colorist</span>
                </div>
                <span className="text-sm font-black text-emerald-400 font-mono">₹1,80,000</span>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-white block">Kalyan Jewellers • Diwali Festive Ads</span>
                  <span className="text-[10px] text-white/50">Daylight Studio A Booked • RED V-Raptor</span>
                </div>
                <span className="text-sm font-black text-emerald-400 font-mono">₹4,50,000</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          DELIVERABLE / WORK UPLOAD MODAL
          ======================================================== */}
      <AnimatePresence>
        {uploadModalOpen && selectedGig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-sleek-dark rounded-3xl border border-white/20 p-5 flex flex-col gap-4 text-left shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h4 className="font-black text-sm text-white">Upload Completed Deliverable</h4>
                  <p className="text-[10px] text-white/50">{selectedGig.title}</p>
                </div>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  +₹{selectedGig.payoutAmount.toLocaleString()}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                  Video Master URL / Drive Link
                </label>
                <input
                  type="text"
                  value={uploadLink}
                  onChange={(e) => setUploadLink(e.target.value)}
                  placeholder="https://assets.mixkit.co/... or Google Drive URL"
                  className="bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-sleek-violet"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                  Production Notes & Color Profile
                </label>
                <textarea
                  rows={3}
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Details about camera settings, color space, audio mix..."
                  className="bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-sleek-violet resize-none"
                />
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl flex items-center gap-2.5 text-[11px] text-emerald-200">
                <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
                <span>Submitting releases full escrow funds directly into your instant UPI wallet.</span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitDeliverable(selectedGig)}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-black rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
                >
                  Submit & Receive Payout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
