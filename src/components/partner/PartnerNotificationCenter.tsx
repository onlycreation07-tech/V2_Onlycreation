import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  DollarSign, 
  Smartphone, 
  Camera, 
  Scissors, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Sparkles, 
  Trash2, 
  Volume2, 
  VolumeX, 
  ArrowUpRight,
  AlertCircle,
  Zap,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PartnerNotification, NotificationType } from '../../types/notifications';
import { soundService } from '../../services/soundService';

interface PartnerNotificationCenterProps {
  notifications: PartnerNotification[];
  onNotificationsChange: (notifications: PartnerNotification[]) => void;
  onAcceptOrder?: (notification: PartnerNotification) => void;
  onNavigateTab?: (tab: 'work' | 'earnings' | 'reels' | 'profile') => void;
  currentRoleTitle?: string;
}

export default function PartnerNotificationCenter({
  notifications,
  onNotificationsChange,
  onAcceptOrder,
  onNavigateTab,
  currentRoleTitle = 'Partner'
}: PartnerNotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'orders' | 'payouts' | 'status'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeToast, setActiveToast] = useState<PartnerNotification | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Trigger floating toast when a new high-priority notification arrives
  const triggerNotification = (notif: PartnerNotification) => {
    onNotificationsChange([notif, ...notifications]);
    setActiveToast(notif);

    if (soundEnabled) {
      if (notif.type === 'new_order') soundService.playOrderChime();
      else if (notif.type === 'payout_processed') soundService.playPayoutChime();
      else soundService.playStatusChime();
    }

    // Auto dismiss toast after 6 seconds
    setTimeout(() => {
      setActiveToast((current) => (current?.id === notif.id ? null : current));
    }, 6000);
  };

  const markAsRead = (id: string) => {
    onNotificationsChange(
      notifications.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    onNotificationsChange(notifications.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    onNotificationsChange([]);
  };

  const handleAction = (notif: PartnerNotification) => {
    markAsRead(notif.id);
    if (notif.type === 'new_order' && onAcceptOrder) {
      onAcceptOrder(notif);
      setActiveToast(null);
      setIsOpen(false);
    } else if (notif.type === 'payout_processed') {
      if (onNavigateTab) onNavigateTab('earnings');
      setActiveToast(null);
      setIsOpen(false);
    } else {
      if (onNavigateTab) onNavigateTab('work');
      setActiveToast(null);
      setIsOpen(false);
    }
  };

  // Simulation Generators
  const simulateNewOrder = () => {
    const locations = ['Indiranagar 100ft Rd', 'Koramangala 4th Block', 'HSR Layout Sector 2', 'MG Road Hub'];
    const brands = ['Zara Summer Reel', 'Blue Tokai Cafe Launch', 'Cult Fit Promo Shoot', 'D2C Skincare Commercial'];
    const amounts = [3500, 5200, 6800, 8500];
    const randomIndex = Math.floor(Math.random() * brands.length);

    const newNotif: PartnerNotification = {
      id: `notif_${Date.now()}`,
      type: 'new_order',
      title: '🚨 New Shoot Request Nearby',
      message: `${brands[randomIndex]} is looking for a creator right now at ${locations[randomIndex]}.`,
      amount: amounts[randomIndex],
      timestamp: 'Just now',
      read: false,
      priority: 'high',
      location: locations[randomIndex],
      clientName: brands[randomIndex],
      actionPayload: {
        orderId: `ord_${Date.now()}`,
        gigTitle: brands[randomIndex],
        amount: amounts[randomIndex]
      }
    };
    triggerNotification(newNotif);
  };

  const simulatePayout = () => {
    const amounts = [3500, 4800, 6200, 12000];
    const amount = amounts[Math.floor(Math.random() * amounts.length)];
    const newNotif: PartnerNotification = {
      id: `notif_${Date.now()}`,
      type: 'payout_processed',
      title: '💰 UPI Payout Credited',
      message: `₹${amount.toLocaleString()} has been transferred to your registered UPI ID via instant IMPS gateway.`,
      amount,
      timestamp: 'Just now',
      read: false,
      priority: 'high'
    };
    triggerNotification(newNotif);
  };

  const simulateStatusChange = () => {
    const statuses = [
      {
        title: '🎬 S-Log3 4K Footage Ingested',
        msg: 'Videographer uploaded raw camera cards for "Cafe Espresso 4K Cut". Ready for DaVinci Resolve editing.'
      },
      {
        title: '✅ Client Approved Master Cut',
        msg: 'The brand signed off on the final 9:16 vertical export. Escrow release unlocked.'
      },
      {
        title: '🚚 Camera Gear Dispatched',
        msg: 'Sony FX3 + 24-70mm GM II lens has been picked up by partner courier.'
      }
    ];
    const item = statuses[Math.floor(Math.random() * statuses.length)];
    const newNotif: PartnerNotification = {
      id: `notif_${Date.now()}`,
      type: 'status_changed',
      title: item.title,
      message: item.msg,
      timestamp: 'Just now',
      read: false,
      priority: 'normal'
    };
    triggerNotification(newNotif);
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'orders') return n.type === 'new_order';
    if (activeFilter === 'payouts') return n.type === 'payout_processed';
    if (activeFilter === 'status') return n.type === 'status_changed' || n.type === 'raw_footage_ready' || n.type === 'rental_due';
    return true;
  });

  return (
    <>
      {/* Header Notification Bell Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/80 hover:text-white transition-all active:scale-95"
          title="Notification Center"
          aria-label="Open Notifications"
        >
          <Bell size={16} className={unreadCount > 0 ? 'text-amber-400' : 'text-white/70'} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-[9px] font-black text-white shadow-md animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Floating Real-Time Incoming Toast Alert */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-3 inset-x-3 max-w-sm mx-auto z-50 bg-gradient-to-r from-zinc-950 via-sleek-dark to-zinc-900 border border-emerald-500/50 rounded-2xl p-3.5 shadow-2xl shadow-emerald-500/20 backdrop-blur-xl flex flex-col gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-black tracking-tight text-white">{activeToast.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveToast(null)}
                className="text-white/40 hover:text-white p-1"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-[11px] text-white/80 leading-snug">{activeToast.message}</p>

            {activeToast.amount && (
              <div className="flex items-center justify-between bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono">Value</span>
                <span className="text-xs font-black text-emerald-400 font-mono">₹{activeToast.amount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleAction(activeToast)}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-black font-black text-[11px] uppercase tracking-wider py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
              >
                {activeToast.type === 'new_order' ? (
                  <>
                    <Zap size={13} className="fill-current" />
                    <span>Accept Gig Now</span>
                  </>
                ) : activeToast.type === 'payout_processed' ? (
                  <>
                    <DollarSign size={13} />
                    <span>View Wallet</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight size={13} />
                    <span>Open Update</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  markAsRead(activeToast.id);
                  setActiveToast(null);
                }}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl text-[10px] font-bold uppercase"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-over Notification Drawer / Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-3 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-sleek-dark border border-white/15 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-left"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-sleek-violet/20 text-sleek-violet rounded-xl">
                    <Bell size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      Live Notification Grid
                      {unreadCount > 0 && (
                        <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.2 rounded-full font-mono">
                          {unreadCount} unread
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-white/50">{currentRoleTitle} Dispatch Radar</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5"
                    title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
                  >
                    {soundEnabled ? <Volume2 size={16} className="text-emerald-400" /> : <VolumeX size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Simulation Hub for Instant Live Testing */}
              <div className="bg-gradient-to-r from-sleek-violet/20 via-purple-950/30 to-black p-3 border-b border-white/5 flex flex-col gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-sleek-violet flex items-center gap-1">
                  <Sparkles size={11} /> Real-Time Event Simulator
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={simulateNewOrder}
                    className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-xl text-left flex flex-col gap-0.5 active:scale-95 transition-all"
                  >
                    <span className="text-[9px] font-extrabold text-emerald-400 flex items-center gap-1">
                      <Zap size={10} /> + New Order
                    </span>
                    <span className="text-[8px] text-white/60">₹5k-8k Gig</span>
                  </button>

                  <button
                    type="button"
                    onClick={simulatePayout}
                    className="p-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-xl text-left flex flex-col gap-0.5 active:scale-95 transition-all"
                  >
                    <span className="text-[9px] font-extrabold text-amber-400 flex items-center gap-1">
                      <DollarSign size={10} /> + Payout
                    </span>
                    <span className="text-[8px] text-white/60">UPI IMPS</span>
                  </button>

                  <button
                    type="button"
                    onClick={simulateStatusChange}
                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded-xl text-left flex flex-col gap-0.5 active:scale-95 transition-all"
                  >
                    <span className="text-[9px] font-extrabold text-blue-400 flex items-center gap-1">
                      <Clock size={10} /> + Status
                    </span>
                    <span className="text-[8px] text-white/60">Footage / Cut</span>
                  </button>
                </div>
              </div>

              {/* Filter Tabs & Bulk Actions */}
              <div className="p-3 border-b border-white/5 flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar">
                <div className="flex items-center gap-1">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'orders', label: 'Orders' },
                    { id: 'payouts', label: 'Payouts' },
                    { id: 'status', label: 'Status' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveFilter(tab.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                        activeFilter === tab.id
                          ? 'bg-sleek-violet text-white'
                          : 'text-white/40 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-[9px] font-bold text-white/50 hover:text-white px-2 py-1"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-[9px] font-bold text-red-400/80 hover:text-red-300 p-1"
                      title="Clear notifications"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List Body */}
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 hide-scrollbar">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                    <div className="p-3 rounded-full bg-white/5 text-white/30">
                      <Bell size={24} />
                    </div>
                    <p className="text-xs font-bold text-white/50">No notifications in this filter</p>
                    <p className="text-[10px] text-white/30 max-w-[200px]">
                      New gig requests, UPI payouts, and footage uploads will appear in real time.
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => {
                    const isNewOrder = notif.type === 'new_order';
                    const isPayout = notif.type === 'payout_processed';

                    return (
                      <div
                        key={notif.id}
                        className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col gap-2 ${
                          notif.read
                            ? 'bg-white/[0.02] border-white/5 text-white/60'
                            : 'bg-white/[0.07] border-white/15 text-white shadow-lg'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-xl ${
                              isNewOrder 
                                ? 'bg-emerald-500/20 text-emerald-400' 
                                : isPayout 
                                ? 'bg-amber-500/20 text-amber-400' 
                                : 'bg-sleek-violet/20 text-sleek-violet'
                            }`}>
                              {isNewOrder ? <Zap size={14} /> : isPayout ? <DollarSign size={14} /> : <Clock size={14} />}
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-white">{notif.title}</h4>
                              <span className="text-[9px] text-white/40">{notif.timestamp}</span>
                            </div>
                          </div>

                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-sleek-violet shrink-0" />
                          )}
                        </div>

                        <p className="text-[11px] text-white/70 leading-relaxed">{notif.message}</p>

                        {notif.amount && (
                          <div className="flex items-center justify-between text-[11px] font-mono bg-black/30 px-2.5 py-1.5 rounded-xl border border-white/5">
                            <span className="text-white/50 text-[10px]">Payment Escrow</span>
                            <span className="text-emerald-400 font-black">₹{notif.amount.toLocaleString()}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => handleAction(notif)}
                            className="text-[10px] font-black uppercase tracking-wider text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                          >
                            <span>{isNewOrder ? 'Accept & View Shoot' : isPayout ? 'Open Wallet' : 'View Work'}</span>
                            <ChevronRight size={12} />
                          </button>

                          {!notif.read && (
                            <button
                              type="button"
                              onClick={() => markAsRead(notif.id)}
                              className="text-[9px] text-white/40 hover:text-white"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
