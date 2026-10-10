import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  Smartphone, 
  Building2, 
  Sparkles, 
  ChevronRight,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PartnerPayout, StakeholderRole } from '../../types/stakeholder';
import { INITIAL_PARTNER_PAYOUTS } from '../../constants/stakeholderData';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';

interface PartnerEarningsSectionProps {
  currentRole: StakeholderRole;
  walletBalance: number;
  totalEarnings: number;
  completedJobs: number;
  onWithdrawFunds: (amount: number, upiId: string) => void;
  onOpenWallet?: () => void;
}

export default function PartnerEarningsSection({
  currentRole,
  walletBalance,
  totalEarnings,
  completedJobs,
  onWithdrawFunds,
  onOpenWallet
}: PartnerEarningsSectionProps) {
  const { user } = useAuth();
  const [liveBalance, setLiveBalance] = useState<number>(walletBalance);
  const [payouts, setPayouts] = useState<PartnerPayout[]>(INITIAL_PARTNER_PAYOUTS);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(walletBalance > 0 ? String(walletBalance) : '5000');
  const [upiId, setUpiId] = useState('creator@okhdfcbank');
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    
    // Subscribe to authoritative wallet balance
    const unsubWallet = dbService.subscribeWallet(user.uid, (w) => {
      if (w) {
        setLiveBalance(w.availableBalance);
      }
    });

    async function loadPayouts() {
      if (!user?.uid) return;
      try {
        const fetched = await dbService.getPartnerPayouts(user.uid);
        if (fetched && fetched.length > 0) {
          setPayouts(fetched);
        }
      } catch (e) {
        console.warn("Could not load payouts from Firestore:", e);
      }
    }
    loadPayouts();

    return () => unsubWallet();
  }, [user]);

  const handleConfirmWithdraw = async () => {
    const num = parseFloat(withdrawAmount);
    const activeBalance = liveBalance || walletBalance;
    if (isNaN(num) || num <= 0 || num > activeBalance) {
      alert(`Please enter a valid withdrawal amount up to your current balance (₹${activeBalance.toLocaleString()}).`);
      return;
    }

    if (!user?.uid) {
      alert('Please sign in to request payout');
      return;
    }

    setIsProcessing(true);
    try {
      // Authoritative server-side payout
      const serverRes = await dbService.requestPayoutServer({
        uid: user.uid,
        amount: num,
        upiId: upiId,
        partnerRole: currentRole,
        partnerName: user.displayName || 'You'
      });

      const newPayout: PartnerPayout = {
        id: serverRes.payoutId || `pay_${Date.now()}`,
        partnerId: user.uid,
        partnerName: user.displayName || 'You',
        partnerRole: currentRole,
        amount: num,
        upiId: upiId,
        status: 'paid',
        requestedAt: 'Just now',
        paidAt: 'Just now',
        transactionRef: serverRes.transactionRef
      };

      setPayouts([newPayout, ...payouts]);
      setLiveBalance(serverRes.newBalance ?? (activeBalance - num));
      onWithdrawFunds(num, upiId);
      setWithdrawModalOpen(false);
      setPayoutSuccessMsg(true);
      setTimeout(() => setPayoutSuccessMsg(false), 4000);
    } catch (err: any) {
      console.error("Payout request failed:", err);
      alert(err.message || 'Withdrawal failed. Please check your balance or UPI ID.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-12 text-left">
      {/* Payout Success Alert */}
      <AnimatePresence>
        {payoutSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-300"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Instant Payout Initiated! Credited to {upiId}</span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-500/20 px-2 py-0.5 rounded text-white">IMPS 24x7</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Wallet Card */}
      <div className="bg-gradient-to-br from-emerald-950/80 via-teal-950/70 to-slate-900 border border-emerald-500/30 p-5 rounded-3xl shadow-2xl flex flex-col gap-4 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
              Live Partner Wallet
            </span>
          </div>
          <span className="text-[10px] font-mono text-white/50 bg-white/5 px-2.5 py-0.5 rounded-full">
            Instant UPI Enabled
          </span>
        </div>

        <div>
          <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider block">
            Withdrawable Balance
          </span>
          <div className="text-3xl font-black text-white font-mono tracking-tight mt-0.5">
            ₹{liveBalance.toLocaleString()}
          </div>
        </div>

        {/* Action Buttons: Instant UPI Withdrawal & Full Wallet */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => {
              setWithdrawAmount(String(liveBalance));
              setWithdrawModalOpen(true);
            }}
            disabled={liveBalance <= 0 || isProcessing}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-black font-black text-xs py-3.5 px-5 rounded-2xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <ArrowUpRight size={16} className="text-black" />
            <span>Withdraw to UPI</span>
          </button>

          {onOpenWallet && (
            <button
              type="button"
              onClick={onOpenWallet}
              className="bg-white/10 hover:bg-white/15 border border-white/10 text-white font-black text-xs py-3.5 px-4 rounded-2xl uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
            >
              <span>Audit Ledger</span>
              <ChevronRight size={14} className="text-emerald-400" />
            </button>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-sleek-dark p-4 rounded-3xl border border-white/5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-white/50 text-[10px] uppercase font-extrabold tracking-wider">
            <TrendingUp size={12} className="text-sleek-violet" />
            <span>Lifetime Earned</span>
          </div>
          <span className="text-lg font-black text-white font-mono">₹{totalEarnings.toLocaleString()}</span>
          <span className="text-[9px] text-emerald-400 font-bold">+18% vs last month</span>
        </div>

        <div className="bg-sleek-dark p-4 rounded-3xl border border-white/5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-white/50 text-[10px] uppercase font-extrabold tracking-wider">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span>Completed Gigs</span>
          </div>
          <span className="text-lg font-black text-white font-mono">{completedJobs} Shoots</span>
          <span className="text-[9px] text-white/40 font-medium">100% 5-Star Rating</span>
        </div>
      </div>

      {/* Payout Ledger / History */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-white/60">
            Recent Settlement History
          </h4>
          <span className="text-[10px] text-white/40 font-bold">{payouts.length} Transactions</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {payouts.map((pay) => (
            <div
              key={pay.id}
              className="bg-sleek-dark p-3.5 rounded-2xl border border-white/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white shrink-0">
                  <CreditCard size={18} className="text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-white">₹{pay.amount.toLocaleString()}</span>
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
                  <span className="text-[10px] text-white/50 font-mono block mt-0.5">{pay.upiId}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-white/40 block">{pay.requestedAt}</span>
                {pay.transactionRef && (
                  <span className="text-[8px] font-mono text-white/30 truncate max-w-[120px] block">
                    {pay.transactionRef}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WITHDRAW TO UPI MODAL */}
      <AnimatePresence>
        {withdrawModalOpen && (
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
                <h4 className="font-black text-sm text-white">Instant UPI Settlement</h4>
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded uppercase">
                  IMPS Real-Time
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                  Withdrawal Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    max={walletBalance}
                    className="w-full bg-black/60 border border-white/10 rounded-xl pl-7 pr-3 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <span className="text-[9px] text-white/40">Available Balance: ₹{walletBalance.toLocaleString()}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                  Your UPI ID (VPA)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. yourname@okhdfcbank"
                  className="bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl flex items-center gap-2 text-[11px] text-emerald-200">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                <span>Zero commission deducted. 100% of your earnings deposited directly to your bank account.</span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmWithdraw}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-black rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20"
                >
                  Confirm Payout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
