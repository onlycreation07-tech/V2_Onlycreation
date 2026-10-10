import React, { useState } from 'react';
import { 
  Briefcase, 
  Smartphone, 
  Camera, 
  Scissors, 
  Building2, 
  Truck, 
  Film, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Play, 
  Award, 
  RefreshCw, 
  Phone, 
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  INITIAL_PARTNER_PROFILES, 
  INITIAL_PARTNER_GIGS, 
  INITIAL_RENTAL_GEAR, 
  INITIAL_STUDIO_BOOKINGS, 
  INITIAL_PARTNER_PAYOUTS,
  STAKEHOLDER_TRAINING_REELS
} from '../../constants/stakeholderData';
import { PartnerGig, RentalGearItem, PartnerPayout } from '../../types/stakeholder';
import { dbService } from '../../services/dbService';

export default function AdminStakeholdersOps() {
  const [gigs, setGigs] = useState<PartnerGig[]>(INITIAL_PARTNER_GIGS);
  const [rentalGear, setRentalGear] = useState<RentalGearItem[]>(INITIAL_RENTAL_GEAR);
  const [payouts, setPayouts] = useState<PartnerPayout[]>(INITIAL_PARTNER_PAYOUTS);
  const [selectedSubTab, setSelectedSubTab] = useState<'pipeline' | 'gear' | 'studios' | 'payouts' | 'training'>('pipeline');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Admin approves a pending payout
  const handleApprovePayout = async (payoutId: string) => {
    const txRef = `ADMIN-UPI-IMPS-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    setPayouts(prev => prev.map(p => {
      if (p.id === payoutId) {
        return {
          ...p,
          status: 'paid',
          paidAt: 'Just now',
          transactionRef: txRef
        };
      }
      return p;
    }));
    try {
      await dbService.updatePayoutStatus(payoutId, 'paid', txRef);
    } catch (e) {
      console.warn("Could not update payout in DB:", e);
    }
    showToast('UPI Payout Approved & Released via IMPS Banking Gateway');
  };

  // Admin forces completion of a gig
  const handleForceCompleteGig = (gigId: string) => {
    setGigs(prev => prev.map(g => {
      if (g.id === gigId) {
        return {
          ...g,
          status: 'completed',
          masterVideoUrl: g.masterVideoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-hands-kneading-bread-dough-41481-large.mp4'
        };
      }
      return g;
    }));
    showToast('Gig marked as completed. Partner escrow released.');
  };

  // Admin approves inspection on rental item
  const handlePassInspection = (gearId: string) => {
    setRentalGear(prev => prev.map(g => {
      if (g.id === gearId) {
        return {
          ...g,
          status: 'available',
          conditionNotes: 'Admin inspection passed. Deposit cleared.'
        };
      }
      return g;
    }));
    showToast('Equipment passed quality check. Caution deposit refunded.');
  };

  const handleSendRentalAlert = (gear: RentalGearItem) => {
    alert(`Admin Notice sent to ${gear.borrowerName} (${gear.borrowerPhone}): "Your rental for ${gear.name} is overdue. Please return immediately to avoid daily penalty."`);
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="fixed top-4 inset-x-4 max-w-md mx-auto z-50 bg-emerald-500 text-black px-4 py-3 rounded-2xl shadow-2xl font-black text-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{toastMessage}</span>
            </div>
            <span className="text-[10px] uppercase font-mono bg-black/20 px-2 py-0.5 rounded">Admin Audit</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Stakeholder Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {[
          { label: 'Reel Creators', count: '142 Active', icon: Smartphone, color: 'text-sleek-violet', sub: 'Indiranagar & Koramangala' },
          { label: 'Cinema Videographers', count: '36 Pros', icon: Camera, color: 'text-purple-400', sub: 'Sony FX3 & RED V-Raptor' },
          { label: 'Video Editors', count: '54 Online', icon: Scissors, color: 'text-emerald-400', sub: 'DaVinci 19 Fast Ingest' },
          { label: 'Studio Stages', count: '12 Spaces', icon: Building2, color: 'text-amber-400', sub: '82% Daily Occupancy' },
          { label: 'Rental Inventory', count: '48 Items', icon: Truck, color: 'text-rose-400', sub: '2 On Rent • 1 Overdue' },
          { label: 'Creative Agencies', count: '8 Partners', icon: Film, color: 'text-cyan-400', sub: 'Turnkey Campaigns' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="bg-sleek-dark p-3 rounded-2xl border border-white/5 flex flex-col gap-1 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">{item.label}</span>
                <Icon size={14} className={item.color} />
              </div>
              <span className="text-sm font-black text-white font-mono">{item.count}</span>
              <span className="text-[8px] text-white/40 truncate">{item.sub}</span>
            </div>
          );
        })}
      </div>

      {/* Sub Navigation Bar for Operations */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar p-1 bg-white/5 rounded-2xl border border-white/5">
        {[
          { id: 'pipeline', label: `Gig Pipeline (${gigs.length})`, icon: Briefcase },
          { id: 'gear', label: `Rental Gear (${rentalGear.length})`, icon: Truck },
          { id: 'studios', label: `Studio Slots (${INITIAL_STUDIO_BOOKINGS.length})`, icon: Building2 },
          { id: 'payouts', label: `UPI Payouts (${payouts.filter(p => p.status === 'pending').length} Pending)`, icon: DollarSign },
          { id: 'training', label: `Reel Training (${STAKEHOLDER_TRAINING_REELS.length})`, icon: Award },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedSubTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border ${
              selectedSubTab === tab.id
                ? 'bg-sleek-violet text-white border-sleek-violet shadow-md'
                : 'text-white/40 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={12} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* SUB-SECTION 1: GIG OPERATIONS PIPELINE */}
      {selectedSubTab === 'pipeline' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase text-white/60">Live Creator-to-Editor Pipeline</span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
              Active Escrow Guard
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {gigs.map((gig) => (
              <div key={gig.id} className="bg-sleek-dark p-4 rounded-3xl border border-white/10 flex flex-col gap-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                      gig.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : gig.status === 'shooting'
                        ? 'bg-rose-500/20 text-rose-300'
                        : gig.status === 'editing_in_progress'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-sleek-violet/20 text-sleek-violet'
                    }`}>
                      {gig.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-bold text-white/50">{gig.roleRequired.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="text-sm font-black text-emerald-400 font-mono">₹{gig.payoutAmount.toLocaleString()}</span>
                </div>

                <div>
                  <h4 className="font-extrabold text-xs text-white">{gig.title}</h4>
                  <p className="text-[11px] text-white/60 mt-0.5">{gig.clientName} • {gig.location}</p>
                </div>

                {gig.rawFootageUrl && (
                  <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex items-center justify-between text-[10px]">
                    <span className="truncate mr-2 font-mono text-white/60">Raw Ingest: {gig.rawFootageUrl}</span>
                    <a href={gig.rawFootageUrl} target="_blank" rel="noreferrer" className="text-sleek-violet font-bold flex items-center gap-1 shrink-0">
                      <span>View Raw</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                )}

                {gig.masterVideoUrl && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl flex items-center justify-between text-[10px]">
                    <span className="text-emerald-300 font-bold">Master Cut Delivered</span>
                    <a href={gig.masterVideoUrl} target="_blank" rel="noreferrer" className="text-emerald-400 font-bold flex items-center gap-1">
                      <span>Preview Master</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                )}

                {/* Admin Actions */}
                {gig.status !== 'completed' && (
                  <div className="pt-2 border-t border-white/5 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleForceCompleteGig(gig.id)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center gap-1"
                    >
                      <CheckCircle2 size={12} />
                      <span>Approve & Release Escrow</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-SECTION 2: RENTAL GEAR TRACKER */}
      {selectedSubTab === 'gear' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase text-white/60">Camera & Lighting Fleet Monitor</span>
            <span className="text-[10px] text-white/40">{rentalGear.length} Items Listed</span>
          </div>

          <div className="flex flex-col gap-3">
            {rentalGear.map((item) => (
              <div key={item.id} className="bg-sleek-dark p-4 rounded-3xl border border-white/10 flex flex-col gap-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black text-white">{item.name}</h4>
                      <span className="text-[9px] font-mono text-white/50">{item.serialNumber}</span>
                    </div>
                  </div>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                    item.status === 'available'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : item.status === 'on_rent'
                      ? 'bg-rose-500/20 text-rose-300'
                      : item.status === 'returned_inspection'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {item.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {item.status === 'returned_inspection' && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-2xl flex items-center justify-between text-xs">
                    <span className="text-[11px] text-white/80">Returned by {item.borrowerName}. Check for sensor scratch.</span>
                    <button
                      type="button"
                      onClick={() => handlePassInspection(item.id)}
                      className="px-2.5 py-1 bg-emerald-500 text-black font-black text-[10px] uppercase rounded-xl"
                    >
                      Pass Check
                    </button>
                  </div>
                )}

                {item.status === 'overdue' && (
                  <div className="bg-red-500/15 border border-red-500/30 p-2.5 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-red-400 block">{item.borrowerName} ({item.borrowerPhone})</span>
                      <span className="text-[10px] text-white/60">Overdue by 24 hours</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSendRentalAlert(item)}
                      className="px-2.5 py-1 bg-red-500 text-white font-black text-[10px] uppercase rounded-xl flex items-center gap-1"
                    >
                      <Phone size={10} /> Alert
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-SECTION 3: STUDIO SLOTS */}
      {selectedSubTab === 'studios' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase text-white/60">Commercial Studio Stage Bookings</span>
            <span className="text-[10px] text-emerald-400 font-bold">100% Verified Stages</span>
          </div>

          <div className="flex flex-col gap-3">
            {INITIAL_STUDIO_BOOKINGS.map((slot) => (
              <div key={slot.id} className="bg-sleek-dark p-4 rounded-3xl border border-white/10 flex flex-col gap-2.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white">{slot.studioName} • {slot.stageName}</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">₹{slot.amount.toLocaleString()}</span>
                </div>
                <div className="text-[11px] text-white/70">
                  <p className="font-bold text-white">{slot.clientName}</p>
                  <p className="text-white/50">{slot.timeSlot} • {slot.date}</p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={11} /> Advance Escrow Secured
                  </span>
                  <span className="font-mono text-white/50">{slot.clientPhone}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-SECTION 4: PARTNER PAYOUT CLEARANCE */}
      {selectedSubTab === 'payouts' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase text-white/60">Partner UPI Payout Queue</span>
            <span className="text-[10px] text-emerald-400 font-bold">Instant IMPS API</span>
          </div>

          <div className="flex flex-col gap-3">
            {payouts.map((pay) => (
              <div key={pay.id} className="bg-sleek-dark p-4 rounded-3xl border border-white/10 flex items-center justify-between shadow-lg">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white font-mono">₹{pay.amount.toLocaleString()}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                      pay.status === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : pay.status === 'approved'
                        ? 'bg-sleek-violet/20 text-sleek-violet'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {pay.status}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-white/80">{pay.partnerName} ({pay.partnerRole.replace(/_/g, ' ')})</span>
                  <span className="text-[10px] font-mono text-white/50">{pay.upiId}</span>
                </div>

                {pay.status === 'pending' ? (
                  <button
                    type="button"
                    onClick={() => handleApprovePayout(pay.id)}
                    className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={13} />
                    <span>Approve Payout</span>
                  </button>
                ) : (
                  <div className="text-right">
                    <span className="text-[9px] text-emerald-400 font-bold block">Transferred</span>
                    <span className="text-[8px] font-mono text-white/30 truncate max-w-[120px] block">{pay.transactionRef}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-SECTION 5: REEL TRAINING METRICS */}
      {selectedSubTab === 'training' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase text-white/60">Reel Academy Subject Modules</span>
            <span className="text-[10px] text-emerald-400 font-bold">100% Certified Creators</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STAKEHOLDER_TRAINING_REELS.map((reel) => (
              <div key={reel.id} className="bg-sleek-dark p-3.5 rounded-2xl border border-white/10 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-sleek-violet/20 text-sleek-violet">
                    {reel.roleCategory.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[9px] font-bold text-amber-300">{reel.difficulty}</span>
                </div>
                <h5 className="font-extrabold text-xs text-white leading-tight">{reel.title}</h5>
                <p className="text-[10px] text-white/50 line-clamp-1">{reel.description}</p>
                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[9px] text-white/40">
                  <span>Mentor: {reel.mentorName}</span>
                  <span>{reel.views.toLocaleString()} views</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
