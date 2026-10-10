import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  MapPin, 
  Smartphone, 
  Camera, 
  Film, 
  Truck, 
  Phone, 
  MessageCircle, 
  Star, 
  ChevronRight, 
  CheckCircle2, 
  Download, 
  Clock, 
  Zap, 
  ArrowLeft, 
  Send, 
  Play, 
  X, 
  ShieldCheck, 
  SlidersHorizontal,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DispatchBooking, BrandProfile } from '../../types';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import PaymentGatewayModal from '../payment/PaymentGatewayModal';
import { PaymentOrder } from '../../services/paymentService';

interface CreatorDispatchScreenProps {
  brandProfile: BrandProfile;
  onBackToHome: () => void;
}

interface CreatorTierOption {
  id: 'instagrammer' | 'dslr_pro' | 'agency_crew' | 'rental_express';
  title: string;
  badge: string;
  subtitle: string;
  equipment: string;
  eta: string;
  price: number;
  icon: any;
  popular?: boolean;
}

const CREATOR_TIERS: CreatorTierOption[] = [
  {
    id: 'instagrammer',
    title: 'Insta Reel Creator',
    badge: 'iPhone 16 Pro',
    subtitle: 'Quick Reel & Story shooting • 24h Reel Delivery',
    equipment: 'iPhone 16 Pro, DJi Osmo Mobile 6, Wireless Mic',
    eta: '3.5 Mins away',
    price: 1499,
    icon: Smartphone,
    popular: true
  },
  {
    id: 'dslr_pro',
    title: 'Pro DSLR Videographer',
    badge: 'Sony 4K FX3',
    subtitle: 'Cinematic Shoot • Raw & Color Graded Clips',
    equipment: 'Sony FX3 / A7S III, 24-70mm f2.8, Wireless Lavalier',
    eta: '6.0 Mins away',
    price: 3999,
    icon: Camera
  },
  {
    id: 'agency_crew',
    title: 'Ad Agency Production Team',
    badge: 'Full Crew + Drone',
    subtitle: 'Director + 2 Cam Ops + Drone + Portable Studio Lights',
    equipment: 'RED Komodo, DJi Mavic 3 Cine, Aputure 300d Lights',
    eta: '12 Mins away',
    price: 9999,
    icon: Film
  },
  {
    id: 'rental_express',
    title: 'Rental Express Courier',
    badge: 'Gear Express',
    subtitle: 'Lenses, Ring Lights & Audio kit delivered to set in 20m',
    equipment: 'Aputure 300d + Softbox + Sennheiser Wireless Kit',
    eta: '15 Mins away',
    price: 2499,
    icon: Truck
  }
];

export interface StakeholderBid {
  id: string;
  name: string;
  category: 'reel_creator' | 'videographer' | 'video_editor' | 'studio' | 'rental';
  categoryLabel: string;
  avatar: string;
  rating: number;
  shootsCompleted: number;
  distance: string;
  etaMinutes: number;
  equipment: string;
  vehicle: string;
  price: number;
  badge: string;
}

const LIVE_STAKEHOLDERS: StakeholderBid[] = [
  {
    id: 'sh_1',
    name: 'Arjun Sharma',
    category: 'reel_creator',
    categoryLabel: 'Instant Reel Creator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    rating: 4.9,
    shootsCompleted: 342,
    distance: '350m away',
    etaMinutes: 3,
    equipment: 'iPhone 16 Pro • DJi Osmo Mobile 6 • Dual Wireless Mics',
    vehicle: 'Ather 450X • KA-03-EV-2024',
    price: 1499,
    badge: '3-Min Dispatch'
  },
  {
    id: 'sh_2',
    name: 'Vikram Malhotra',
    category: 'videographer',
    categoryLabel: 'Pro Cinema Videographer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    rating: 5.0,
    shootsCompleted: 188,
    distance: '1.1km away',
    etaMinutes: 6,
    equipment: 'Sony FX3 Cinema Line • Sony G-Master 24-70 f2.8 • Ronin RS3',
    vehicle: 'Royal Enfield Hunter • KA-01-HE-8819',
    price: 3999,
    badge: '4K Color Graded'
  },
  {
    id: 'sh_3',
    name: 'Priya Rao',
    category: 'reel_creator',
    categoryLabel: 'Viral Food & Fashion Creator',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    rating: 4.9,
    shootsCompleted: 215,
    distance: '650m away',
    etaMinutes: 4,
    equipment: 'iPhone 16 Pro Max • Pocket Tube LED • Wireless Hollyland Mic',
    vehicle: 'Ola S1 Pro • KA-05-AB-1290',
    price: 1699,
    badge: 'High Engagement'
  },
  {
    id: 'sh_4',
    name: 'Rohan Das',
    category: 'video_editor',
    categoryLabel: 'Fast Turnaround Editor & Colorist',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    rating: 4.9,
    shootsCompleted: 410,
    distance: 'Cloud Ingest Standby',
    etaMinutes: 0,
    equipment: 'DaVinci Resolve Studio 19 • Apple M3 Max • 10Gbps Fiber',
    vehicle: 'Remote Cloud Queue',
    price: 1200,
    badge: 'Same-Day Reel Delivery'
  },
  {
    id: 'sh_5',
    name: 'The Daylight Loft',
    category: 'studio',
    categoryLabel: 'Acoustic & Daylight Soundstage',
    avatar: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80',
    rating: 4.8,
    shootsCompleted: 520,
    distance: '800m away (Indiranagar)',
    etaMinutes: 5,
    equipment: 'Cyclorama Wall • Profoto B10X Strobes • Aputure Nova P300c',
    vehicle: 'Stage Slot Reserved',
    price: 2200,
    badge: 'Soundproof Stage'
  },
  {
    id: 'sh_6',
    name: 'GearFleet Courier',
    category: 'rental',
    categoryLabel: 'Express Camera & Lighting Courier',
    avatar: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&auto=format&fit=crop&q=80',
    rating: 4.9,
    shootsCompleted: 890,
    distance: '1.4km away',
    etaMinutes: 12,
    equipment: 'Aputure 300d II • C-Stands • Wireless Lavalier Mics Kit',
    vehicle: 'Express Delivery Van',
    price: 2499,
    badge: 'Gear In-Transit'
  }
];

export default function CreatorDispatchScreen({ brandProfile, onBackToHome }: CreatorDispatchScreenProps) {
  const { user } = useAuth();
  
  // Dispatch phase: 'select' -> 'searching' -> 'en_route' -> 'completed'
  const [phase, setPhase] = useState<'select' | 'searching' | 'en_route' | 'completed'>('select');
  
  // Selection States
  const [selectedTier, setSelectedTier] = useState<CreatorTierOption>(CREATOR_TIERS[0]);
  const [startLocation, setStartLocation] = useState('Indiranagar 100ft Road, Bangalore');
  const [shootLocation, setShootLocation] = useState('Third Wave Coffee, Koramangala');
  const [durationHours, setDurationHours] = useState(2);
  const [briefPrompt, setBriefPrompt] = useState('Trendy 15-sec Instagram Reel showcasing new espresso drinks with aesthetic transitions.');
  const [paymentMethod, setPaymentMethod] = useState('UPI / Cards / Instant Wallet');
  const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null);

  // Uber Radar Search States
  const [searchCountdown, setSearchCountdown] = useState(6);
  const [searchStakeholderFilter, setSearchStakeholderFilter] = useState<'all' | 'reel_creator' | 'videographer' | 'video_editor' | 'studio' | 'rental'>('all');
  const [incomingBids, setIncomingBids] = useState<StakeholderBid[]>([]);
  const [searchRadiusKm, setSearchRadiusKm] = useState(3.5);

  // Active Dispatch State
  const [activeDispatch, setActiveDispatch] = useState<DispatchBooking | null>(null);
  const [dispatchStatus, setDispatchStatus] = useState<'matching' | 'en_route' | 'arrived' | 'shooting' | 'completed'>('matching');
  const [etaSeconds, setEtaSeconds] = useState(320); // ~5m 20s
  
  // Chat Overlay State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'creator'; text: string; time: string }>>([
    { sender: 'creator', text: "Hey! I'm Arjun. I have the iPhone 16 Pro & DJi Mic ready. En route to Third Wave Coffee!", time: '12:28 PM' }
  ]);
  const [inputMsg, setInputMsg] = useState('');

  // Rating State
  const [starRating, setStarRating] = useState(5);
  const [selectedChips, setSelectedChips] = useState<string[]>(['Super Punctual', 'Great Reel Transitions']);

  // ETA Countdown Timer Effect
  useEffect(() => {
    let timer: any;
    if (phase === 'en_route' && etaSeconds > 0) {
      timer = setInterval(() => {
        setEtaSeconds(prev => (prev > 1 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase, etaSeconds]);

  // Uber Radar Search Effect: countdown and streaming incoming bids
  useEffect(() => {
    let timer: any;
    let bidInterval: any;

    if (phase === 'searching') {
      // Initialize with closest reel creator
      setIncomingBids([LIVE_STAKEHOLDERS[0]]);
      setSearchCountdown(6);

      // Incrementally receive bids from other stakeholders
      bidInterval = setInterval(() => {
        setIncomingBids(prev => {
          if (prev.length < LIVE_STAKEHOLDERS.length) {
            return [...prev, LIVE_STAKEHOLDERS[prev.length]];
          }
          return prev;
        });
      }, 1200);

      // Countdown to auto-lock best available match
      timer = setInterval(() => {
        setSearchCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            clearInterval(bidInterval);
            // Auto lock best match (default to selected tier or first bid)
            const matchedBid = selectedTier.id === 'dslr_pro' ? LIVE_STAKEHOLDERS[1] : LIVE_STAKEHOLDERS[0];
            handleLockInMatch(matchedBid);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(timer);
      clearInterval(bidInterval);
    };
  }, [phase, selectedTier]);

  // Handle Instant Dispatch Trigger (Launches Uber Radar Search)
  const handleConfirmDispatch = () => {
    setPhase('searching');
  };

  // Lock in match with specific stakeholder
  const handleLockInMatch = async (bid: StakeholderBid) => {
    const calculatedPrice = bid.price * (durationHours > 1 ? 1 + (durationHours - 1) * 0.7 : 1);
    const dispatchPayload: Omit<DispatchBooking, 'id' | 'createdAt'> = {
      userId: user?.uid || 'guest_user',
      creatorTier: (bid.category === 'videographer' ? 'dslr_pro' : 'instagrammer') as any,
      creatorName: bid.name,
      creatorPhoto: bid.avatar,
      creatorHandle: `@${bid.name.toLowerCase().replace(/\s+/g, '_')}_pro`,
      creatorEquipment: bid.equipment,
      vehicleInfo: bid.vehicle,
      pickupLocation: startLocation,
      shootLocation: shootLocation,
      durationHours: durationHours,
      totalPrice: Math.round(calculatedPrice),
      status: 'en_route',
      briefPrompt: briefPrompt,
      deliveredReelUrl: 'https://assets.mixkit.co/videos/preview/mixkit-barista-pouring-coffee-art-in-a-cafe-41558-large.mp4'
    };

    setActiveDispatch(dispatchPayload as DispatchBooking);
    setDispatchStatus('en_route');
    setEtaSeconds(bid.etaMinutes * 60);
    setPhase('en_route');

    // Add first confirmation chat message
    setChatMessages([
      {
        sender: 'creator',
        text: `Namaste! I'm ${bid.name}. Accepted your request for ${shootLocation}. Gear packed, heading over now!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // Save to Firestore asynchronously
    try {
      if (user) {
        const docId = await dbService.createDispatch(dispatchPayload);
        setActiveDispatch({ ...dispatchPayload, id: docId });
      }
    } catch (err) {
      console.error("Firestore dispatch save note:", err);
    }
  };

  const handleCancelSearch = () => {
    setPhase('select');
  };

  const handleSendChatMessage = () => {
    if (!inputMsg.trim()) return;
    const newMsg = { sender: 'user' as const, text: inputMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages(prev => [...prev, newMsg]);
    setInputMsg('');

    // Simulate creator reply
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev, 
        { sender: 'creator', text: 'Got it! I am just 2 minutes away. See you at the entrance.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    }, 1500);
  };

  const formatEtaTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}.${s.toString().padStart(2, '0')} Mins`;
  };

  const toggleChip = (chip: string) => {
    if (selectedChips.includes(chip)) {
      setSelectedChips(selectedChips.filter(c => c !== chip));
    } else {
      setSelectedChips([...selectedChips, chip]);
    }
  };

  return (
    <div className="min-h-screen bg-sleek-black text-white flex flex-col relative pb-20 overflow-x-hidden">
      {/* Top Fixed Header */}
      <div className="sticky top-0 z-40 bg-sleek-zinc/90 backdrop-blur-md border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBackToHome}
            className="p-2.5 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 transition-all active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <h2 className="font-bold text-sm tracking-tight">Uber for Video Shoots</h2>
            </div>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Instant Creator Dispatch</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-sleek-violet/10 border border-sleek-violet/30 px-3 py-1.5 rounded-full">
          <Zap size={14} className="text-sleek-violet fill-sleek-violet" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-sleek-violet">3.5m Avg Pickup</span>
        </div>
      </div>

      {/* Main Interactive Map Stage */}
      <div className="relative w-full h-[320px] bg-zinc-950 overflow-hidden border-b border-white/10 flex items-center justify-center">
        {/* Animated Map Canvas Grid Background */}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {/* Vector Map Roads simulation */}
        <svg className="absolute inset-0 w-full h-full opacity-40 stroke-white/20" strokeWidth="3">
          <path d="M -50 100 Q 100 80, 200 180 T 450 250" fill="none" />
          <path d="M 120 -20 Q 150 150, 280 350" fill="none" />
          <path d="M 0 220 L 400 120" fill="none" strokeWidth="5" className="stroke-sleek-violet/40" />
          
          {/* Active Route Polyline */}
          {phase === 'en_route' && (
            <motion.path 
              d="M 80 80 L 180 160 L 260 210" 
              fill="none" 
              stroke="#8b5cf6" 
              strokeWidth="5" 
              strokeDasharray="6 6"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </svg>

        {/* Nearby Creator Pins on Map */}
        {phase === 'select' && (
          <>
            {/* Creator Pin 1 */}
            <div className="absolute top-[25%] left-[20%] flex flex-col items-center group cursor-pointer animate-bounce">
              <div className="bg-sleek-violet text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/20 shadow-lg flex items-center gap-1">
                <Smartphone size={10} /> Arjun (3m)
              </div>
              <div className="w-3 h-3 bg-sleek-violet rounded-full border-2 border-white shadow-[0_0_12px_rgba(139,92,246,1)]"></div>
            </div>

            {/* Creator Pin 2 */}
            <div className="absolute top-[55%] left-[65%] flex flex-col items-center">
              <div className="bg-zinc-800 text-white/80 text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/10 shadow-lg flex items-center gap-1">
                <Camera size={10} /> Vikram (6m)
              </div>
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white"></div>
            </div>

            {/* Creator Pin 3 */}
            <div className="absolute top-[40%] left-[80%] flex flex-col items-center">
              <div className="bg-zinc-800 text-white/80 text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/10 shadow-lg flex items-center gap-1">
                <Truck size={10} /> Rental Courier (15m)
              </div>
              <div className="w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white"></div>
            </div>
          </>
        )}

        {/* Target Shoot Location Marker */}
        <div className="absolute top-[65%] left-[60%] flex flex-col items-center z-10">
          <div className="bg-sleek-black/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-xl border border-white/20 shadow-xl flex items-center gap-1.5">
            <MapPin size={12} className="text-red-500 fill-red-500" />
            <span>Shoot Set: Third Wave Coffee</span>
          </div>
          <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-ping"></div>
        </div>

        {/* Uber Live Sonar Radar when searching */}
        {phase === 'searching' && (
          <div className="absolute top-[65%] left-[60%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            {/* Concentric sonar rings */}
            {[1, 2, 3].map((ring) => (
              <motion.div
                key={ring}
                className="absolute rounded-full border border-sleek-violet/40 bg-sleek-violet/5"
                initial={{ width: 40, height: 40, opacity: 0.8, x: -20, y: -20 }}
                animate={{ width: 360, height: 360, opacity: 0, x: -180, y: -180 }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: ring * 0.9,
                  ease: 'easeOut',
                }}
              />
            ))}

            {/* Rotating Sonar Radar Beam */}
            <motion.div
              className="absolute w-44 h-44 origin-bottom-right -top-44 -left-44"
              style={{
                background: 'conic-gradient(from 0deg at 100% 100%, rgba(124,58,237,0.35) 0deg, transparent 60deg)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        )}

        {/* Stakeholder Pings Appearing on Map during Search */}
        {phase === 'searching' && (
          <>
            {incomingBids.map((bid, idx) => {
              const positions = [
                { top: '30%', left: '25%' },
                { top: '48%', left: '75%' },
                { top: '22%', left: '60%' },
                { top: '78%', left: '20%' },
                { top: '38%', left: '42%' },
                { top: '72%', left: '80%' },
              ];
              const pos = positions[idx % positions.length];
              return (
                <motion.div
                  key={bid.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="absolute z-20 flex flex-col items-center cursor-pointer"
                  style={pos}
                  onClick={() => handleLockInMatch(bid)}
                >
                  <div className="bg-sleek-dark text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-sleek-violet shadow-lg shadow-sleek-violet/30 flex items-center gap-1 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>{bid.name.split(' ')[0]}</span>
                    <span className="text-sleek-violet font-black">₹{bid.price}</span>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-sleek-violet border-2 border-white shadow-[0_0_10px_rgba(124,58,237,1)]" />
                </motion.div>
              );
            })}
          </>
        )}

        {/* En Route Moving Vehicle / Creator Marker */}
        {phase === 'en_route' && (
          <motion.div 
            className="absolute z-20 flex flex-col items-center"
            initial={{ top: '25%', left: '20%' }}
            animate={{ top: '58%', left: '52%' }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          >
            <div className="bg-gradient-to-r from-sleek-violet to-sleek-fuchsia text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white shadow-xl flex items-center gap-1">
              <Smartphone size={12} /> Arjun En Route
            </div>
            <div className="w-8 h-8 bg-sleek-black rounded-full border-2 border-sleek-violet flex items-center justify-center p-0.5 shadow-2xl">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" className="w-full h-full rounded-full object-cover" />
            </div>
          </motion.div>
        )}

        {/* Map Control Buttons */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-20">
          <button className="p-2 bg-sleek-black/80 backdrop-blur-md rounded-xl border border-white/10 text-white/70 hover:text-white">
            <SlidersHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* PHASE 1: SELECT CREATOR TIER & BOOK (Matching Reference Phone 1) */}
      {phase === 'select' && (
        <div className="flex-1 p-5 max-w-xl mx-auto w-full flex flex-col gap-6 -mt-6 relative z-30">
          
          {/* Location & Brief Card (Find Your Vehicle / Shoot) */}
          <div className="bg-sleek-dark p-5 rounded-[28px] border border-white/10 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Shoot Details</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sleek-violet bg-sleek-violet/10 px-2.5 py-0.5 rounded-md">Live GPS Match</span>
            </div>

            {/* Address Pickup & Shoot Timeline */}
            <div className="flex flex-col gap-3 relative pl-6 border-l-2 border-dashed border-white/10 ml-2">
              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-white border-2 border-black"></div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-white/30 block">Current Location</label>
                <input 
                  type="text" 
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-white/90 outline-none border-b border-white/10 pb-1 focus:border-sleek-violet"
                />
              </div>

              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-sleek-violet border-2 border-white shadow-[0_0_8px_rgba(139,92,246,1)]"></div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-sleek-violet block">Shoot Location / Set</label>
                <input 
                  type="text" 
                  value={shootLocation}
                  onChange={(e) => setShootLocation(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-white outline-none border-b border-white/10 pb-1 focus:border-sleek-violet"
                />
              </div>
            </div>

            {/* Duration Selector */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Shoot Duration:</span>
              <div className="flex gap-1.5">
                {[1, 2, 4, 8].map((hrs) => (
                  <button
                    key={hrs}
                    onClick={() => setDurationHours(hrs)}
                    className={`px-3 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                      durationHours === hrs 
                        ? 'bg-sleek-violet text-white border-sleek-violet' 
                        : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {hrs}h {hrs === 8 ? '(Full Day)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Creative Brief Prompt */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Shoot Brief / Deliverable</label>
                <span className="text-[9px] text-sleek-fuchsia font-semibold flex items-center gap-1">
                  <Sparkles size={10} /> AI Script Linked
                </span>
              </div>
              <input 
                type="text" 
                value={briefPrompt}
                onChange={(e) => setBriefPrompt(e.target.value)}
                placeholder="Describe what video/reel to shoot..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white/90 outline-none focus:border-sleek-violet"
              />
            </div>
          </div>

          {/* Available Creator Tier Options (Matches GoCab Small / GoCab Medium in user image) */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Available Options</label>
              <span className="text-[10px] text-white/30 font-medium">4 Creator Tiers Nearby</span>
            </div>

            <div className="flex flex-col gap-3">
              {CREATOR_TIERS.map((tier) => {
                const Icon = tier.icon;
                const isSelected = selectedTier.id === tier.id;
                const calculatedPrice = tier.price * (durationHours > 1 ? 1 + (durationHours - 1) * 0.7 : 1);

                return (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier)}
                    className={`relative text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                      isSelected 
                        ? 'bg-sleek-dark border-sleek-violet shadow-xl shadow-sleek-violet/10 ring-1 ring-sleek-violet' 
                        : 'bg-sleek-dark/60 border-white/5 hover:border-white/15 hover:bg-sleek-dark'
                    }`}
                  >
                    {tier.popular && (
                      <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-sleek-violet to-sleek-fuchsia text-white text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full shadow-md">
                        Most Popular
                      </span>
                    )}

                    <div className="flex items-start gap-3.5">
                      <div className={`p-3 rounded-2xl border transition-colors ${
                        isSelected ? 'bg-sleek-violet/20 border-sleek-violet text-sleek-violet' : 'bg-white/5 border-white/5 text-white/40'
                      }`}>
                        <Icon size={22} />
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white/90">{tier.title}</h4>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-white/60 border border-white/10">
                            {tier.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/50 leading-tight">{tier.subtitle}</p>
                        <p className="text-[10px] text-sleek-violet font-semibold mt-1 flex items-center gap-1">
                          <Clock size={10} /> {tier.eta} • {tier.equipment}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1 pl-2">
                      <span className="text-base font-extrabold text-sleek-violet tracking-tight">
                        ₹{Math.round(calculatedPrice).toLocaleString()}
                      </span>
                      <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest">
                        {durationHours}hr Shoot
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Selector (Matches GoCab Coin in user image) */}
          <div className="bg-sleek-dark p-4 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <DollarSign size={18} />
              </div>
              <div>
                <h5 className="font-bold text-xs text-white/90">{paymentMethod}</h5>
                <p className="text-[10px] text-white/40">OnlyCreation Instant Pay & UPI</p>
              </div>
            </div>
            <button 
              onClick={() => {
                const calculatedPrice = selectedTier.price * (durationHours > 1 ? 1 + (durationHours - 1) * 0.7 : 1);
                setPaymentOrder({
                  orderId: `disp_${Date.now()}`,
                  amount: Math.round(calculatedPrice),
                  currency: 'INR',
                  itemType: 'creator_dispatch',
                  itemTitle: `On-Demand Shoot: ${selectedTier.title}`,
                  itemDescription: `${durationHours}hr Shoot at ${shootLocation}`,
                  customerEmail: 'creator@onlycreation.io',
                  customerName: brandProfile.name
                });
              }}
              className="text-[10px] font-bold text-sleek-violet uppercase tracking-wider hover:underline"
            >
              Configure Gateway / Pay
            </button>
          </div>

          {/* Primary Action Dispatch Button (Matches Find Driver button in user image) */}
          <button
            onClick={handleConfirmDispatch}
            className="w-full bg-gradient-to-r from-sleek-violet to-sleek-fuchsia text-white py-4 shadow-xl shadow-sleek-violet/25 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:brightness-110"
          >
            <Zap size={20} className="fill-current" />
            Dispatch {selectedTier.title}
          </button>
        </div>
      )}

      {/* PHASE: UBER-STYLE MULTI-STAKEHOLDER RADAR SEARCH */}
      {phase === 'searching' && (
        <div className="flex-1 p-4 max-w-xl mx-auto w-full flex flex-col gap-4 -mt-6 relative z-30">
          
          {/* Top Live Search Radar Card */}
          <div className="bg-gradient-to-r from-sleek-violet/25 via-sleek-fuchsia/20 to-purple-900/25 border border-sleek-violet/40 p-4 rounded-3xl shadow-2xl flex flex-col gap-3 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 animate-ping"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute"></div>
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                    Broadcasting Live Shoot Request
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sleek-violet text-white font-extrabold uppercase tracking-wider">
                      Uber Video Grid
                    </span>
                  </h3>
                  <p className="text-[11px] text-white/60">
                    Pinging 18 verified creators & partners within {searchRadiusKm} km • {startLocation}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-black text-white font-mono">
                  00:0{searchCountdown}s
                </div>
                <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-extrabold">
                  Auto Matching
                </span>
              </div>
            </div>

            {/* Radar scan progress line */}
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-emerald-400 via-sleek-violet to-sleek-fuchsia"
                initial={{ width: '10%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 6, ease: 'linear' }}
              />
            </div>

            {/* Live Stakeholder Status Ticker */}
            <div className="flex items-center justify-between text-[10px] text-white/50 pt-1 border-t border-white/5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sleek-violet animate-pulse" />
                <span>Broadcasting to Reel Creators, Videographers, Editors & Studios</span>
              </span>
              <span className="font-bold text-white/80">{incomingBids.length} of 6 Stakeholders Responded</span>
            </div>
          </div>

          {/* Stakeholder Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all', label: `All Stakeholders (${incomingBids.length})` },
              { id: 'reel_creator', label: '📱 Reel Creators' },
              { id: 'videographer', label: '🎥 Pro Cinema' },
              { id: 'video_editor', label: '✂️ Video Editors' },
              { id: 'studio', label: '🏢 Studios' },
              { id: 'rental', label: '📦 Gear Couriers' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSearchStakeholderFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold whitespace-nowrap transition-all border ${
                  searchStakeholderFilter === tab.id
                    ? 'bg-sleek-violet text-white border-sleek-violet shadow-md'
                    : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Incoming Stakeholder Bids List */}
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {incomingBids
                .filter(b => searchStakeholderFilter === 'all' || b.category === searchStakeholderFilter)
                .map((bid, index) => (
                  <motion.div
                    key={bid.id}
                    initial={{ opacity: 0, y: 15, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-sleek-dark p-4 rounded-3xl border border-white/10 shadow-xl flex flex-col gap-3 hover:border-sleek-violet/40 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img 
                            src={bid.avatar} 
                            alt={bid.name} 
                            className="w-12 h-12 rounded-2xl object-cover border border-white/10"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-sleek-dark rounded-full" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-white">{bid.name}</h4>
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-sleek-violet/20 text-sleek-violet border border-sleek-violet/30">
                              {bid.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/60 font-medium">{bid.categoryLabel}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                              <Star size={10} className="fill-amber-400 text-amber-400" />
                              {bid.rating}
                            </span>
                            <span className="text-[10px] text-white/40">• {bid.shootsCompleted} Shoots</span>
                            <span className="text-[10px] text-emerald-400 font-semibold">• {bid.distance}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black text-white tracking-tight">
                          ₹{bid.price.toLocaleString()}
                        </div>
                        <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider">
                          Instant Rate
                        </span>
                      </div>
                    </div>

                    {/* Gear / Vehicle Specs */}
                    <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-center justify-between text-[11px] text-white/70">
                      <div className="flex items-center gap-1.5 truncate mr-2">
                        <Camera size={13} className="text-sleek-violet shrink-0" />
                        <span className="truncate font-medium">{bid.equipment}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-white/50 shrink-0 bg-white/5 px-2 py-0.5 rounded">
                        {bid.vehicle}
                      </span>
                    </div>

                    {/* Accept Bid Button */}
                    <button
                      onClick={() => handleLockInMatch(bid)}
                      className="w-full bg-gradient-to-r from-sleek-violet to-sleek-fuchsia hover:brightness-110 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-lg shadow-sleek-violet/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                      <Zap size={14} className="fill-current" />
                      <span>Lock In Match & Dispatch ({bid.name.split(' ')[0]})</span>
                    </button>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>

          {/* Cancel Broadcast / Search Button */}
          <div className="pt-2 flex justify-center">
            <button
              onClick={handleCancelSearch}
              className="text-xs font-bold text-white/40 hover:text-red-400 transition-colors py-2 px-4 rounded-xl border border-white/5 hover:border-red-500/20"
            >
              Cancel Search & Modify Parameters
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2: CREATOR EN ROUTE & TRACKING (Matching Reference Phone 2) */}
      {phase === 'en_route' && activeDispatch && (
        <div className="flex-1 p-5 max-w-xl mx-auto w-full flex flex-col gap-5 -mt-6 relative z-30">
          
          {/* Top Floating Banner Notification (Matches Get ready driver will come soon) */}
          <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
              <div>
                <p className="text-xs font-extrabold text-emerald-300">⚡ Creator Dispatched & En Route!</p>
                <p className="text-[10px] text-white/60">Get ready, your videographer is heading to set</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-white">{formatEtaTime(etaSeconds)}</p>
              <p className="text-[9px] uppercase font-bold text-white/40">ETA Pickup</p>
            </div>
          </div>

          {/* Active Creator Card Details (Matches Middle Phone Card) */}
          <div className="bg-sleek-dark p-6 rounded-[32px] border border-white/10 shadow-2xl flex flex-col gap-6">
            
            {/* License/Equipment Header Pill */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-sleek-violet px-2.5 py-1 rounded-md bg-sleek-violet/10 border border-sleek-violet/20">
                  {activeDispatch.vehicleInfo}
                </span>
                <p className="text-[11px] text-white/50 font-medium mt-1">Vehicle & Transport Info</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 p-1 border border-white/10 flex items-center justify-center">
                <Smartphone size={24} className="text-sleek-fuchsia" />
              </div>
            </div>

            {/* Creator Profile Detail */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <img 
                    src={activeDispatch.creatorPhoto} 
                    alt={activeDispatch.creatorName}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-sleek-violet shadow-lg" 
                  />
                  <div className="absolute -bottom-1 -right-1 bg-amber-400 text-black font-extrabold text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow">
                    <Star size={9} className="fill-black" /> 4.9
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-white/90">{activeDispatch.creatorName}</h3>
                  <p className="text-xs text-sleek-violet font-bold">{activeDispatch.creatorHandle}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{activeDispatch.creatorEquipment}</p>
                </div>
              </div>

              {/* Action Buttons: Call & Chat */}
              <div className="flex items-center gap-2">
                <a 
                  href="tel:+919876543210" 
                  className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all"
                  title="Call Creator"
                >
                  <Phone size={18} />
                </a>

                <button 
                  onClick={() => setIsChatOpen(true)}
                  className="w-11 h-11 rounded-2xl bg-sleek-violet text-white flex items-center justify-center shadow-lg shadow-sleek-violet/30 active:scale-95 transition-all relative"
                  title="Live Chat"
                >
                  <MessageCircle size={18} />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black flex items-center justify-center">1</span>
                </button>
              </div>
            </div>

            {/* Location Timeline */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-white/40"></div>
                <span className="text-white/50 text-[10px] font-bold uppercase">Pickup:</span>
                <span className="font-semibold text-white/90 truncate">{activeDispatch.pickupLocation}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-sleek-violet"></div>
                <span className="text-sleek-violet text-[10px] font-bold uppercase">Set:</span>
                <span className="font-semibold text-white truncate">{activeDispatch.shootLocation}</span>
              </div>
            </div>

            {/* Live Progress Pipeline Stepper */}
            <div className="flex items-center justify-between gap-1 pt-2">
              {[
                { label: 'En Route', done: true },
                { label: 'Arrived', done: dispatchStatus !== 'en_route' && dispatchStatus !== 'matching' },
                { label: 'Shooting', done: dispatchStatus === 'shooting' || dispatchStatus === 'completed' },
                { label: 'Reel Ready', done: dispatchStatus === 'completed' }
              ].map((step, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full h-1.5 rounded-full ${step.done ? 'bg-sleek-violet shadow-[0_0_8px_rgba(139,92,246,1)]' : 'bg-white/10'}`}></div>
                  <span className={`text-[8px] font-bold uppercase tracking-wider ${step.done ? 'text-sleek-violet' : 'text-white/30'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Simulation Controls for Testing Lifecycle */}
            <div className="p-3 bg-zinc-900/80 rounded-2xl border border-white/5 flex flex-col gap-2">
              <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest text-center">Interactive Dispatch Simulation</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDispatchStatus('arrived')}
                  className="py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold uppercase"
                >
                  Set: Creator Arrived
                </button>
                <button
                  onClick={() => {
                    setDispatchStatus('completed');
                    setPhase('completed');
                  }}
                  className="py-2 bg-gradient-to-r from-sleek-violet to-sleek-fuchsia text-white rounded-xl text-[10px] font-bold uppercase shadow"
                >
                  Complete & Submit Reel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 3: SHOOT COMPLETED & REEL DELIVERED (Matching Reference Phone 3 - You've Arrived) */}
      {phase === 'completed' && activeDispatch && (
        <div className="flex-1 p-5 max-w-xl mx-auto w-full flex flex-col gap-6 -mt-6 relative z-30">
          
          {/* Top Arrival Banner (Matches You've Arrived in user image) */}
          <div className="bg-sleek-dark border border-white/10 p-6 rounded-[32px] shadow-2xl flex flex-col gap-4 text-center items-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Shoot Completed!</h2>
              <p className="text-xs text-white/50 font-medium mt-1">
                Your reel & raw footage have been filmed and submitted on set.
              </p>
            </div>

            <div className="bg-sleek-violet/10 border border-sleek-violet/20 px-4 py-2 rounded-2xl text-[11px] font-bold text-sleek-violet">
              Make sure raw footage files are verified before leaving set ✨
            </div>
          </div>

          {/* Delivered Reel Video Player Box */}
          <div className="bg-sleek-dark p-5 rounded-[32px] border border-white/10 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Delivered Reel Submission</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md">4K 60fps Ready</span>
            </div>

            <div className="relative aspect-[9/14] rounded-2xl overflow-hidden border border-white/10 bg-black group">
              <video 
                src={activeDispatch.deliveredReelUrl} 
                controls
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1.5 border border-white/20">
                <Sparkles size={12} className="text-sleek-violet" /> Edited Reel
              </div>
            </div>

            <div className="flex gap-2">
              <a 
                href={activeDispatch.deliveredReelUrl} 
                download="Reel_Shoot_Master.mp4"
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3.5 bg-sleek-violet text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-sleek-violet/80 transition-all"
              >
                <Download size={14} /> Download Raw 4K Video
              </a>
            </div>
          </div>

          {/* Star Rating Section (Matches How was your trip? in user image) */}
          <div className="bg-sleek-dark p-6 rounded-[32px] border border-white/10 shadow-2xl flex flex-col gap-4 text-center items-center">
            <div>
              <h4 className="font-extrabold text-base text-white/90">How was your shoot?</h4>
              <p className="text-[11px] text-white/40">Give 1 to 5 stars for {activeDispatch.creatorName}</p>
            </div>

            {/* Interactive Stars */}
            <div className="flex gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setStarRating(star)}
                  className="p-1.5 transition-transform active:scale-125 hover:scale-110"
                >
                  <Star 
                    size={28} 
                    className={star <= starRating ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]' : 'text-white/20'} 
                  />
                </button>
              ))}
            </div>

            {/* Compliment Chips */}
            <div className="flex flex-wrap gap-2 justify-center pt-1">
              {['Super Punctual', 'Great Reel Transitions', 'Pro Lighting', 'Great Direction', 'Top Equipment'].map((chip) => (
                <button
                  key={chip}
                  onClick={() => toggleChip(chip)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                    selectedChips.includes(chip) 
                      ? 'bg-sleek-violet text-white border-sleek-violet' 
                      : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Receipt & Bill Summary (Matches Bottom Trip Details in user image) */}
          <div className="bg-sleek-dark p-5 rounded-[28px] border border-white/5 flex flex-col gap-3">
            <div className="flex justify-between items-center text-xs pb-2 border-b border-white/5">
              <span className="text-white/40 font-bold uppercase text-[10px]">Shoot ID</span>
              <span className="font-mono text-white/80">#SHOOT-{Math.floor(100000 + Math.random() * 900000)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/40 font-bold uppercase text-[10px]">Location</span>
              <span className="font-semibold text-white truncate max-w-[200px]">{activeDispatch.shootLocation}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/40 font-bold uppercase text-[10px]">Payment Method</span>
              <span className="font-semibold text-sleek-violet">GoCab Coins Wallet</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-2 border-t border-white/5 font-extrabold">
              <span className="text-white">Total Amount Paid</span>
              <span className="text-sleek-violet text-lg">₹{Math.round(activeDispatch.totalPrice).toLocaleString()}</span>
            </div>
          </div>

          {/* Action Buttons (Matches Back to Home & Download Bill in user image) */}
          <div className="flex gap-3">
            <button
              onClick={onBackToHome}
              className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              Back to Home
            </button>
            <button
              onClick={() => alert("Downloading Official Tax Invoice & Receipt PDF...")}
              className="flex-1 bg-sleek-violet text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-xl shadow-sleek-violet/25 hover:bg-sleek-violet/80 transition-all"
            >
              Download Bill
            </button>
          </div>
        </div>
      )}

      {/* LIVE CHAT DRAWER OVERLAY */}
      <AnimatePresence>
        {isChatOpen && activeDispatch && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-sleek-dark border-t border-white/10 rounded-t-[32px] p-5 shadow-2xl flex flex-col max-w-xl mx-auto h-[480px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <img src={activeDispatch.creatorPhoto} className="w-10 h-10 rounded-xl object-cover border border-sleek-violet" />
                <div>
                  <h4 className="font-extrabold text-sm">{activeDispatch.creatorName}</h4>
                  <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active on set
                  </p>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-2 text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3">
              {chatMessages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  <div className={`p-3 rounded-2xl text-xs ${
                    msg.sender === 'user' 
                      ? 'bg-sleek-violet text-white rounded-br-none' 
                      : 'bg-white/10 text-white/90 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[8px] text-white/30 font-semibold mt-1 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="pt-3 border-t border-white/10 flex items-center gap-2">
              <input 
                type="text" 
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                placeholder="Message your creator..."
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-sleek-violet"
              />
              <button 
                onClick={handleSendChatMessage}
                className="p-3 bg-sleek-violet text-white rounded-2xl hover:bg-sleek-violet/80 transition-all active:scale-95"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Gateway Modal */}
      {paymentOrder && (
        <PaymentGatewayModal
          isOpen={!!paymentOrder}
          order={paymentOrder}
          onClose={() => setPaymentOrder(null)}
          onSuccess={(result) => {
            setPaymentMethod(`Paid via ${result.method.toUpperCase()} (${result.paymentId?.slice(0, 10)}...)`);
            // Proceed to confirm dispatch automatically
            handleConfirmDispatch();
          }}
        />
      )}
    </div>
  );
}
