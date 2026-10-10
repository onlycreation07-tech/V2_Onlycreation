import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  DollarSign, 
  Layout, 
  ShieldCheck, 
  RefreshCw, 
  Database, 
  Phone, 
  MessageSquare, 
  Briefcase, 
  BarChart3, 
  MapPin, 
  Layers, 
  CheckCircle, 
  Clock, 
  Building2, 
  Zap, 
  Activity, 
  FolderCheck, 
  Globe, 
  Sliders 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dbService } from '../../services/dbService';
import { Studio, BillboardEnquiry, Booking, Project, DispatchBooking, ActivityLog, ProjectStage } from '../../types';
import { MOCK_STUDIOS } from '../../constants/mockData';
import AdminStakeholdersOps from './AdminStakeholdersOps';

type AdminTab = 'overview' | 'stakeholders' | 'studios' | 'projects' | 'dispatches' | 'bookings' | 'enquiries' | 'activityLogs';

export default function AdminDashboard() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [enquiries, setEnquiries] = useState<BillboardEnquiry[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dispatches, setDispatches] = useState<DispatchBooking[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [subPrice, setSubPrice] = useState(499);
  const [commissionRate, setCommissionRate] = useState(10);
  const [panIndiaMode, setPanIndiaMode] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStudio, setEditingStudio] = useState<Partial<Studio> | null>(null);
  
  const [newStudio, setNewStudio] = useState<Partial<Studio>>({
    name: '',
    location: '',
    pricePerHour: 100,
    category: 'photography',
    description: '',
    equipment: [],
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800&auto=format&fit=crop'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studiosData, enquiriesData, bookingsData, config, projectsData, dispatchesData, logsData] = await Promise.all([
        dbService.getStudios(),
        dbService.getBillboardEnquiries(),
        dbService.getBookings(),
        dbService.getAppConfig(),
        dbService.getProjects(),
        dbService.getDispatches(),
        dbService.getActivityLogs(40)
      ]);
      setStudios(studiosData);
      setEnquiries(enquiriesData);
      setBookings(bookingsData);
      setProjects(projectsData);
      setDispatches(dispatchesData);
      setActivityLogs(logsData);
      setSubPrice(config.subscriptionPrice);
      setCommissionRate(config.commissionRate ?? 10);
      setPanIndiaMode(config.panIndiaMode ?? true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    if (!confirm('This will import Bangalore mock data into your live database. Continue?')) return;
    setSeeding(true);
    try {
      for (const studio of MOCK_STUDIOS) {
        const { id, ...data } = studio;
        await dbService.addStudio(data);
      }
      alert('Seeding complete!');
      loadData();
    } catch (error) {
      console.error(error);
    } finally {
      setSeeding(false);
    }
  };

  const handleSaveStudio = async () => {
    const studioData = editingId ? editingStudio : newStudio;
    if (!studioData?.name || !studioData?.pricePerHour) return;

    try {
      const processed = {
        ...studioData,
        equipment: typeof studioData.equipment === 'string' ? (studioData.equipment as string).split(',').map(s => s.trim()) : studioData.equipment,
        amenities: typeof studioData.amenities === 'string' ? (studioData.amenities as string).split(',').map(s => s.trim()) : studioData.amenities || [],
        genres: typeof studioData.genres === 'string' ? (studioData.genres as string).split(',').map(s => s.trim()) : studioData.genres || []
      };

      if (editingId) {
        await dbService.updateStudio(editingId, processed as Partial<Studio>);
        setEditingId(null);
        setEditingStudio(null);
      } else {
        await dbService.addStudio(processed as Omit<Studio, 'id'>);
        setNewStudio({
          name: '',
          location: '',
          pricePerHour: 100,
          category: 'photography',
          description: '',
          equipment: [],
          imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800&auto=format&fit=crop'
        });
      }
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteStudio = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await dbService.deleteStudio(id);
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateBookingStatus = async (id: string, status: Booking['status']) => {
    try {
      await dbService.updateBooking(id, { status });
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkContacted = async (id: string) => {
    try {
      await dbService.updateEnquiryStatus(id, 'reviewed');
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateProjectStage = async (id: string, stage: ProjectStage) => {
    try {
      await dbService.updateProject(id, { stage });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdvanceDispatch = async (id: string, nextStatus: DispatchBooking['status']) => {
    try {
      await dbService.updateDispatch(id, { status: nextStatus });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePlatformSettings = async () => {
    try {
      await dbService.updateAppConfig({
        subscriptionPrice: subPrice,
        commissionRate,
        panIndiaMode
      });
      alert('Platform configuration saved!');
    } catch (e) {
      console.error(e);
    }
  };

  const stats = [
    { label: 'Active Projects', value: projects.length, icon: FolderCheck, color: 'text-purple-400' },
    { label: 'Live Dispatches', value: dispatches.filter(d => d.status !== 'completed').length, icon: Zap, color: 'text-emerald-400' },
    { label: 'Studio Partners', value: studios.length, icon: Building2, color: 'text-sleek-violet' },
    { label: 'Confirmed Bookings', value: bookings.filter(b => b.status === 'confirmed').length, icon: CheckCircle, color: 'text-green-400' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="animate-spin text-sleek-violet" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-sleek-violet" size={24} />
            <h1 className="text-3xl font-bold tracking-tighter text-white/90">Master Control</h1>
          </div>
          <div className="px-3 py-1 bg-sleek-violet/10 border border-sleek-violet/20 rounded-full">
            <span className="text-[10px] font-black text-sleek-violet uppercase tracking-widest leading-none">Super Admin</span>
          </div>
        </div>
        <p className="text-white/40 text-sm font-medium italic">Global Platform Orchestration</p>
      </header>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar p-1 bg-white/5 rounded-2xl border border-white/5">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'stakeholders', label: 'Stakeholders & Ops', icon: Briefcase },
          { id: 'projects', label: `Projects (${projects.length})`, icon: FolderCheck },
          { id: 'dispatches', label: `Dispatches (${dispatches.length})`, icon: Zap },
          { id: 'studios', label: `Studios (${studios.length})`, icon: Layers },
          { id: 'bookings', label: `Bookings (${bookings.length})`, icon: Clock },
          { id: 'enquiries', label: `Enquiries (${enquiries.length})`, icon: MessageSquare },
          { id: 'activityLogs', label: `Audit Trail (${activityLogs.length})`, icon: Activity },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 border ${
              activeTab === tab.id 
                ? 'bg-sleek-violet text-white border-sleek-violet shadow-lg shadow-sleek-violet/20' 
                : 'text-white/40 border-transparent hover:text-white hover:bg-white/5 hover:border-white/10'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-8"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-sleek-dark p-6 rounded-[32px] border border-white/5 flex flex-col gap-3 shadow-xl">
                  <div className={`p-3 bg-white/5 w-fit rounded-2xl ${stat.color}`}>
                    <stat.icon size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-2xl font-black text-white">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Revenue Control */}
            <section className="bg-sleek-dark p-8 rounded-[40px] border border-white/5 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
               {seeding && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="animate-spin text-sleek-violet" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Importing Bangalore HQ Data...</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white/90">Revenue Core</h3>
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Platform Monetization Strategy</p>
                </div>
                <button 
                  onClick={handleSeedData}
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                >
                  <Database size={14} />
                  Populate Bangalore Registry
                </button>
              </div>
              
              <div className="flex items-center justify-between bg-white/5 p-6 rounded-3xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-sleek-violet/20 rounded-2xl">
                    <DollarSign className="text-sleek-violet" size={24} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white/90">Studio Partner Subscription</span>
                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em]">Monthly Premium Listing Fee</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white/30 font-bold text-xl">₹</span>
                  <input 
                    type="number" 
                    value={subPrice}
                    onChange={(e) => setSubPrice(Number(e.target.value))}
                    className="bg-transparent w-24 text-right font-black text-3xl text-white outline-none"
                  />
                </div>
              </div>

              {/* Commission Rate Control */}
              <div className="flex items-center justify-between bg-white/5 p-6 rounded-3xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-emerald-500/20 rounded-2xl">
                    <Sliders className="text-emerald-400" size={24} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white/90">Platform Take Rate (Commission)</span>
                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em]">Deducted from creator payouts</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="bg-transparent w-16 text-right font-black text-3xl text-emerald-400 outline-none"
                  />
                  <span className="text-white/40 font-bold text-xl">%</span>
                </div>
              </div>

              {/* Pan-India Discovery Toggle */}
              <div className="flex items-center justify-between bg-white/5 p-6 rounded-3xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-blue-500/20 rounded-2xl">
                    <Globe className="text-blue-400" size={24} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white/90">Pan-India Network Mode</span>
                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em]">
                      {panIndiaMode ? 'Active across Bengaluru, Mumbai, Delhi, Hyderabad' : 'Bangalore Exclusive Only'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPanIndiaMode(!panIndiaMode)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    panIndiaMode ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/10 text-white/40'
                  }`}
                >
                  {panIndiaMode ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <button 
                onClick={handleSavePlatformSettings}
                className="w-full bg-sleek-violet text-white py-5 rounded-[24px] font-bold text-[10px] uppercase tracking-widest hover:bg-sleek-violet/80 transition-all shadow-xl shadow-sleek-violet/20"
              >
                Apply Global Platform & Monetization Strategy
              </button>
            </section>

          </motion.div>
        )}

        {activeTab === 'stakeholders' && (
          <motion.div 
            key="stakeholders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            <AdminStakeholdersOps />
          </motion.div>
        )}

        {activeTab === 'studios' && (
          <motion.div 
            key="studios"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-8"
          >
            {/* Form Section */}
            <div className="bg-sleek-dark p-8 rounded-[40px] border border-white/5 shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-sleek-violet/10 rounded-xl">
                  <Plus className="text-sleek-violet" size={20} />
                </div>
                <h2 className="text-xl font-bold tracking-tight">
                  {editingId ? 'Refine Asset Listing' : 'Introduce New Production Asset'}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Asset / Studio Name" value={editingId ? editingStudio?.name : newStudio.name} onChange={(v) => editingId ? setEditingStudio({...editingStudio, name: v}) : setNewStudio({...newStudio, name: v})} placeholder="e.g. Indiranagar Vox" />
                <Field label="Price Point (Hourly/Daily)" value={editingId ? editingStudio?.pricePerHour : newStudio.pricePerHour} onChange={(v) => editingId ? setEditingStudio({...editingStudio, pricePerHour: Number(v)}) : setNewStudio({...newStudio, pricePerHour: Number(v)})} type="number" />
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Asset Category</label>
                  <div className="relative group">
                    <select 
                      value={editingId ? editingStudio?.category : newStudio.category}
                      onChange={(e) => editingId ? setEditingStudio({...editingStudio, category: e.target.value as any}) : setNewStudio({...newStudio, category: e.target.value as any})}
                      className="w-full bg-sleek-dark border border-white/10 rounded-2xl p-4 text-xs text-white focus:ring-1 focus:ring-sleek-violet outline-none appearance-none cursor-pointer group-hover:border-white/20 transition-all"
                    >
                      <option value="photography" className="bg-sleek-black text-white py-2">Photo Studio</option>
                      <option value="video" className="bg-sleek-black text-white py-2">Film Stage</option>
                      <option value="music" className="bg-sleek-black text-white py-2">Audio Suite</option>
                      <option value="podcast" className="bg-sleek-black text-white py-2">Media Hub</option>
                      <option value="mixed" className="bg-sleek-black text-white py-2">Creative Loft</option>
                      <option value="billboard" className="bg-sleek-black text-white py-2">Digital OMAS Asset</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover:text-sleek-violet transition-colors">
                      <Layers size={14} />
                    </div>
                  </div>
                </div>

                <Field label="Tactical Location" value={editingId ? editingStudio?.location : newStudio.location} onChange={(v) => editingId ? setEditingStudio({...editingStudio, location: v}) : setNewStudio({...newStudio, location: v})} placeholder="e.g. MG Road, Bangalore" />
              </div>

              <div className="mt-6 flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Capability Description</label>
                  <textarea 
                    value={editingId ? editingStudio?.description : newStudio.description}
                    onChange={(e) => editingId ? setEditingStudio({...editingStudio, description: e.target.value}) : setNewStudio({...newStudio, description: e.target.value})}
                    placeholder="Describe technical specs, vibe, and client suitability..."
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white h-24 focus:ring-1 focus:ring-sleek-violet outline-none resize-none"
                  />
                </div>

                <Field 
                  label="Equipment & Hardware (Comma separated)" 
                  value={editingId ? (Array.isArray(editingStudio?.equipment) ? editingStudio?.equipment.join(', ') : editingStudio?.equipment) : (Array.isArray(newStudio.equipment) ? newStudio.equipment.join(', ') : newStudio.equipment)} 
                  onChange={(v) => editingId ? setEditingStudio({...editingStudio, equipment: v as any}) : setNewStudio({...newStudio, equipment: v as any})} 
                />
                
                <Field 
                  label="Amenities (Comma separated)" 
                  value={editingId ? (Array.isArray(editingStudio?.amenities) ? editingStudio?.amenities.join(', ') : editingStudio?.amenities) : (Array.isArray(newStudio.amenities) ? newStudio.amenities.join(', ') : newStudio.amenities)} 
                  onChange={(v) => editingId ? setEditingStudio({...editingStudio, amenities: v as any}) : setNewStudio({...newStudio, amenities: v as any})} 
                />

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Hero Asset (Image/Video)</label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Field label="Hero Asset URL" value={editingId ? editingStudio?.imageUrl : newStudio.imageUrl} onChange={(v) => editingId ? setEditingStudio({...editingStudio, imageUrl: v}) : setNewStudio({...newStudio, imageUrl: v})} placeholder="https://..." />
                    </div>
                    <div className="relative mt-5">
                      <input 
                        type="file" 
                        id="hero-upload" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const val = ev.target?.result as string;
                              if (editingId) setEditingStudio({...editingStudio, imageUrl: val});
                              else setNewStudio({...newStudio, imageUrl: val});
                            };
                            reader.readAsDataURL(file);
                          }
                        }} 
                      />
                      <label 
                        htmlFor="hero-upload"
                        className="flex items-center gap-2 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 cursor-pointer transition-all border-dashed"
                      >
                        <Plus size={14} />
                        Upload
                      </label>
                    </div>
                  </div>
                  {((editingId ? editingStudio?.imageUrl : newStudio.imageUrl)) && (
                    <div className="mt-2 w-24 h-24 rounded-2xl overflow-hidden border border-white/10 relative group bg-white/5">
                      <img 
                        src={editingId ? editingStudio?.imageUrl : newStudio.imageUrl} 
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                      />
                      <button 
                         onClick={() => editingId ? setEditingStudio({...editingStudio, imageUrl: ''}) : setNewStudio({...newStudio, imageUrl: ''})}
                         className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                {editingId && (
                  <button 
                    onClick={() => { setEditingId(null); setEditingStudio(null); }}
                    className="flex-1 bg-white/5 text-white/40 border border-white/5 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-white/10"
                  >
                    Discard Changes
                  </button>
                )}
                <button 
                  onClick={handleSaveStudio}
                  className="flex-[2] bg-white text-black py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:opacity-90 flex items-center justify-center gap-2"
                >
                  <Save size={14} />
                  {editingId ? 'Save Professional Listing' : 'Onboard Production Asset'}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2">Marketplace Registry ({studios.length})</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studios.map(studio => (
                  <div key={studio.id} className="bg-sleek-dark p-6 rounded-[32px] border border-white/5 flex items-center justify-between group hover:border-sleek-violet/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/5">
                        <img src={studio.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <h4 className="font-bold text-white">{studio.name}</h4>
                        <div className="flex items-center gap-2 text-[8px] font-bold text-white/30 uppercase tracking-[0.2em]">
                          <MapPin size={10} /> {studio.location}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => {
                          setEditingId(studio.id);
                          setEditingStudio({...studio});
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-sleek-violet transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteStudio(studio.id)}
                        className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'bookings' && (
          <motion.div 
            key="bookings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
          >
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Production Booking Ledger ({bookings.length})</label>
            {bookings.length === 0 ? (
              <div className="bg-sleek-dark p-12 rounded-[40px] border border-white/5 flex flex-col items-center justify-center text-center gap-4">
                <Clock size={48} className="text-white/5" />
                <div>
                  <p className="text-sm font-bold text-white/60">No Real-time Bookings</p>
                  <p className="text-[9px] text-white/30 uppercase tracking-widest mt-1">Registry is currently clean</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {bookings.map(booking => (
                  <div key={booking.id} className="bg-sleek-dark p-6 rounded-[32px] border border-white/5 flex flex-col gap-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-500/10 rounded-2xl text-green-500">
                          <CheckCircle size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-lg">{booking.studioName}</h4>
                          <div className="flex items-center gap-3 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                            <span>Date: {booking.date}</span>
                            <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                            <span>{booking.hours} Hours</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xl font-black text-white">₹{booking.totalPrice}</span>
                        <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                          booking.status === 'confirmed' ? 'bg-green-500/20 text-green-500' : 
                          booking.status === 'pending' ? 'bg-amber-500/20 text-amber-500' : 'bg-white/10 text-white/30'
                        }`}>
                          {booking.status}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                       <button 
                        onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                        className="flex-1 py-3 bg-green-600/20 text-green-500 border border-green-600/20 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-green-600/30 transition-all"
                      >
                        Confirm Booking
                      </button>
                      <button 
                         onClick={() => handleUpdateBookingStatus(booking.id, 'completed')}
                        className="flex-1 py-3 bg-white/5 text-white/40 border border-white/5 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                      >
                        Mark Completed
                      </button>
                      <button 
                        onClick={() => dbService.deleteBooking(booking.id).then(loadData)}
                        className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'enquiries' && (
          <motion.div 
            key="enquiries"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
          >
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">OMAS High-Touch Enquiries ({enquiries.length})</label>
            <div className="flex flex-col gap-4">
              {enquiries.length === 0 ? (
                <div className="bg-sleek-dark p-12 rounded-[40px] border border-white/5 flex flex-col items-center justify-center text-center gap-4">
                  <MessageSquare size={48} className="text-white/5" />
                  <p className="text-xs text-white/30 font-medium tracking-tight">Zero strategy requests in pipeline.</p>
                </div>
              ) : (
                enquiries.map((enq) => (
                  <div key={enq.id} className="bg-sleek-dark p-8 rounded-[40px] border border-white/5 flex flex-col gap-6 shadow-xl">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 mb-1">
                           {enq.prompt.includes('STRATEGY') ? (
                            <span className="bg-sleek-fuchsia/10 text-sleek-fuchsia text-[8px] font-black px-2 py-0.5 rounded-lg border border-sleek-fuchsia/20 uppercase tracking-widest">OMAS Strategy Lead</span>
                          ) : (
                            <span className="bg-sleek-violet/10 text-sleek-violet text-[8px] font-black px-2 py-0.5 rounded-lg border border-sleek-violet/20 uppercase tracking-widest">OMAS Asset Request</span>
                          )}
                           <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${enq.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'}`}>
                            {enq.status}
                          </span>
                        </div>
                        <h4 className="text-white text-lg font-bold">{enq.userEmail}</h4>
                        <div className="flex items-center gap-3 text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">
                          <Briefcase size={12} /> {enq.billboardType ? enq.billboardType : 'Managed'}
                          <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                          <DollarSign size={12} /> Budget: ₹{enq.budget}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white/5 p-6 rounded-[24px] border border-white/5">
                      <p className="text-xs text-white/60 leading-relaxed font-medium">"{enq.prompt}"</p>
                    </div>

                    <div className="flex gap-2">
                       {enq.status === 'pending' && (
                        <button 
                          onClick={() => handleMarkContacted(enq.id)}
                          className="flex-1 bg-sleek-violet text-white py-4 rounded-2xl font-bold text-[9px] uppercase tracking-widest hover:bg-sleek-violet/80 transition-all shadow-lg active:scale-95"
                        >
                          Initialize Client Onboarding →
                        </button>
                      )}
                      <button 
                        onClick={() => dbService.updateEnquiryStatus(enq.id, 'reviewed').then(loadData)}
                        className="px-6 bg-white/5 text-white/40 border border-white/5 rounded-2xl text-[9px] font-bold uppercase tracking-widest hover:bg-white/10"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <motion.div
            key="projects"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
          >
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                All Platform Pipelines ({projects.length})
              </label>
              <span className="text-[10px] text-sleek-violet font-mono font-bold">
                Escrow Lifecycle Management
              </span>
            </div>

            {projects.length === 0 ? (
              <div className="bg-sleek-dark p-12 rounded-[40px] border border-white/5 flex flex-col items-center justify-center text-center gap-3">
                <FolderCheck size={48} className="text-white/10" />
                <p className="text-xs text-white/40">No projects registered yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {projects.map((proj) => (
                  <div key={proj.id} className="bg-sleek-dark p-6 rounded-[32px] border border-white/5 flex flex-col gap-4 shadow-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
                            {proj.brandName}
                          </span>
                          <span className="text-white/20">•</span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                            ₹{proj.budget?.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white">{proj.title}</h4>
                        <p className="text-xs text-white/60 mt-1">{proj.assignedCreator?.role || 'Creator Assigned'}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {proj.aiHealthScore && (
                          <div className="px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-bold">
                            AI Health {proj.aiHealthScore}%
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stage Controls */}
                    <div className="p-3 bg-white/5 rounded-2xl flex flex-col gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
                        Admin Stage Override:
                      </span>
                      <div className="grid grid-cols-5 gap-1.5">
                        {(['ideation', 'pre_production', 'production', 'review', 'delivered'] as ProjectStage[]).map((st) => (
                          <button
                            key={st}
                            onClick={() => handleUpdateProjectStage(proj.id, st)}
                            className={`py-1.5 px-1 rounded-xl text-[8px] font-black uppercase tracking-tight transition-all text-center ${
                              proj.stage === st
                                ? 'bg-sleek-violet text-white shadow-md'
                                : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {st.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-white/40 pt-2 border-t border-white/5 font-mono">
                      <span>Milestones: {proj.milestones?.filter(m => m.completed).length || 0} / {proj.milestones?.length || 0}</span>
                      <button 
                        onClick={() => dbService.deleteProject(proj.id).then(loadData)}
                        className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 font-sans font-bold"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Dispatches Tab (Uber-style creator booking) */}
        {activeTab === 'dispatches' && (
          <motion.div
            key="dispatches"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
          >
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Uber-Style Live Dispatch Grid ({dispatches.length})
              </label>
              <button 
                onClick={loadData}
                className="text-[10px] text-sleek-violet font-mono font-bold flex items-center gap-1 hover:underline"
              >
                <RefreshCw size={12} /> Live Sync
              </button>
            </div>

            {dispatches.length === 0 ? (
              <div className="bg-sleek-dark p-12 rounded-[40px] border border-white/5 flex flex-col items-center justify-center text-center gap-3">
                <Zap size={48} className="text-white/10" />
                <p className="text-xs text-white/40">No active creator dispatches at this moment.</p>
                <p className="text-[10px] text-white/20">Client requests from the Dispatch screen will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {dispatches.map((disp) => {
                  const nextStatusMap: Record<DispatchBooking['status'], DispatchBooking['status']> = {
                    matching: 'en_route',
                    en_route: 'arrived',
                    arrived: 'shooting',
                    shooting: 'completed',
                    completed: 'completed'
                  };
                  const nextStatus = nextStatusMap[disp.status] || 'completed';

                  return (
                    <div key={disp.id} className="bg-sleek-dark p-6 rounded-[32px] border border-white/5 flex flex-col gap-4 shadow-xl">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-sleek-violet/20 text-sleek-violet">
                              {disp.creatorTier.replace('_', ' ')}
                            </span>
                            <span className="text-white/20">•</span>
                            <span className="text-[9px] font-black text-emerald-400 font-mono">
                              ₹{disp.totalAmount?.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white">📍 {disp.location}</h4>
                          <p className="text-xs text-white/50 mt-1 italic">"{disp.shootBrief}"</p>
                        </div>

                        <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                          disp.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                          disp.status === 'shooting' ? 'bg-rose-500/20 text-rose-400 animate-pulse' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {disp.status.replace('_', ' ')}
                        </span>
                      </div>

                      {disp.assignedCreator && (
                        <div className="p-3 bg-white/5 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img src={disp.assignedCreator.avatar} className="w-7 h-7 rounded-full object-cover" />
                            <div>
                              <p className="text-xs font-bold text-white">{disp.assignedCreator.name}</p>
                              <p className="text-[9px] text-white/40">{disp.assignedCreator.gear}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono text-white/40">⭐ {disp.assignedCreator.rating}</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {disp.status !== 'completed' && (
                          <button
                            onClick={() => handleAdvanceDispatch(disp.id, nextStatus)}
                            className="flex-1 py-2.5 bg-sleek-violet hover:bg-sleek-violet/80 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                          >
                            Advance to {nextStatus.replace('_', ' ')} →
                          </button>
                        )}
                        <button
                          onClick={() => handleAdvanceDispatch(disp.id, 'completed')}
                          className="px-4 py-2.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          Sign-Off Complete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Activity Logs Tab */}
        {activeTab === 'activityLogs' && (
          <motion.div
            key="activityLogs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
          >
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Immutable Platform Activity Audit Log
              </label>
              <span className="text-[10px] text-emerald-400 font-mono">
                Real-Time Auditing
              </span>
            </div>

            <div className="bg-black/80 rounded-[32px] border border-white/10 p-5 font-mono text-xs max-h-[500px] overflow-y-auto flex flex-col gap-3">
              {activityLogs.length === 0 ? (
                <div className="text-center py-8 text-white/30">No activity recorded yet. System listening...</div>
              ) : (
                activityLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-sleek-violet font-bold uppercase">{log.action}</span>
                      <span className="text-white/30">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[11px] text-white/80">{log.details}</p>
                    <span className="text-[9px] text-white/30">User: {log.userId}</span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string, value: any, onChange: (v: string) => void, placeholder?: string, type?: string }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[10px] font-bold text-white/10 uppercase tracking-[0.2em] ml-1">{label}</label>
      <div className="relative group">
        <input 
          type={type}
          placeholder={placeholder} 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-[13px] text-white/90 outline-none focus:ring-1 focus:ring-sleek-violet/50 focus:bg-white/10 placeholder:text-white/10 transition-all"
        />
      </div>
    </div>
  );
}
