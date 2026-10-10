import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Wallet as WalletIcon, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  X, 
  Smartphone, 
  Coins, 
  RefreshCw, 
  Layers, 
  Lock, 
  ChevronRight,
  Receipt,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/dbService';
import { Wallet, LedgerEntry } from '../../types';

interface WalletScreenProps {
  onBack: () => void;
  isPartner?: boolean;
  partnerRole?: string;
}

export default function WalletScreen({ onBack, isPartner = false, partnerRole }: WalletScreenProps) {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');

  // Modals state
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(2500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [depositProcessing, setDepositProcessing] = useState(false);

  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [upiId, setUpiId] = useState('creator@okhdfcbank');
  const [payoutProcessing, setPayoutProcessing] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real-time wallet & ledger subscription
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Initial fetch / create fallback
    dbService.getWallet(user.uid).then(w => {
      if (w) setWallet(w);
      setLoading(false);
    });

    const unsubWallet = dbService.subscribeWallet(user.uid, (w) => {
      if (w) setWallet(w);
      setLoading(false);
    });

    const unsubLedger = dbService.subscribeLedgerEntries(user.uid, (entries) => {
      setLedgerEntries(entries);
    });

    return () => {
      unsubWallet();
      unsubLedger();
    };
  }, [user]);

  // Handle Deposit
  const handleConfirmDeposit = async () => {
    const finalAmount = customAmount ? parseFloat(customAmount) : depositAmount;
    if (isNaN(finalAmount) || finalAmount < 10) {
      alert('Please enter a valid deposit amount of at least ₹10');
      return;
    }

    if (!user?.uid) {
      alert('Please sign in to deposit funds');
      return;
    }

    setDepositProcessing(true);
    try {
      // 1. Create authoritative order on server
      const order = await dbService.createDepositOrder({
        amount: finalAmount,
        currency: 'INR',
        uid: user.uid,
        customerName: user.displayName || 'OnlyCreation Creator',
        customerEmail: user.email || 'creator@onlycreation.io'
      });

      // 2. Complete and verify deposit through server
      const verifyRes = await dbService.verifyDepositOrder({
        orderId: order.orderId,
        paymentId: `pay_dep_${Date.now()}`,
        signatureToken: order.signatureToken,
        amount: finalAmount,
        currency: 'INR',
        uid: user.uid,
        method: 'UPI'
      });

      showToast(`₹${finalAmount.toLocaleString()} added to your wallet!`);
      setDepositModalOpen(false);
      setCustomAmount('');
    } catch (err: any) {
      console.error('Deposit error:', err);
      alert(err.message || 'Deposit could not be processed');
    } finally {
      setDepositProcessing(false);
    }
  };

  // Handle Payout
  const handleConfirmPayout = async () => {
    const num = parseFloat(payoutAmount);
    const available = wallet?.availableBalance || 0;

    if (isNaN(num) || num <= 0) {
      alert('Please enter a valid payout amount');
      return;
    }

    if (num > available) {
      alert(`Withdrawal amount exceeds available balance (₹${available.toLocaleString()})`);
      return;
    }

    if (!upiId || !upiId.includes('@')) {
      alert('Please enter a valid UPI VPA (e.g. name@okhdfcbank)');
      return;
    }

    if (!user?.uid) return;

    setPayoutProcessing(true);
    try {
      const res = await dbService.requestPayoutServer({
        uid: user.uid,
        amount: num,
        upiId,
        partnerRole: partnerRole || 'reel_creator',
        partnerName: user.displayName || 'OnlyCreation Partner'
      });

      showToast(`₹${num.toLocaleString()} disbursed to ${upiId} (${res.transactionRef})`);
      setPayoutModalOpen(false);
      setPayoutAmount('');
    } catch (err: any) {
      console.error('Payout failed:', err);
      alert(err.message || 'Payout request failed');
    } finally {
      setPayoutProcessing(false);
    }
  };

  const filteredEntries = ledgerEntries.filter(entry => {
    if (filterType === 'all') return true;
    return entry.direction === filterType;
  });

  return (
    <div className="flex flex-col gap-6 text-left pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 inset-x-4 max-w-sm mx-auto z-50 bg-emerald-500 text-black px-4 py-3 rounded-2xl shadow-2xl font-black text-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-white/80 hover:text-white transition-all active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Wallet & Ledger</span>
              <span className="text-[9px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                Immutable
              </span>
            </h1>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
              Authoritative Balance & Double-Entry Audit Trail
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-xl border border-white/10">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span className="text-[10px] font-mono text-white/70">256-bit PCI Vault</span>
        </div>
      </header>

      {/* Wallet Balance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Main Available Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-sleek-violet/40 via-sleek-dark to-purple-950/40 p-5 rounded-[32px] border border-sleek-violet/30 relative overflow-hidden shadow-2xl flex flex-col justify-between gap-5">
          <div className="absolute top-0 right-0 w-40 h-40 bg-sleek-violet/20 blur-[60px] rounded-full -mr-10 -mt-10" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-sleek-violet/30 rounded-xl text-white">
                <WalletIcon size={18} />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-sleek-violet">
                  Authoritative Balance
                </span>
                <span className="text-xs font-bold text-white/60 block">Ready for Shoots & Bookings</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE</span>
            </div>
          </div>

          <div className="relative z-10">
            <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
              ₹{(wallet?.availableBalance ?? 0).toLocaleString()}
            </span>
            <span className="text-xs font-mono text-white/40 ml-2 font-bold">
              {wallet?.currency || 'INR'}
            </span>
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-2 gap-2 relative z-10">
            <button
              type="button"
              onClick={() => setDepositModalOpen(true)}
              className="bg-gradient-to-r from-sleek-violet to-purple-600 hover:from-purple-500 hover:to-sleek-violet text-white py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-sleek-violet/25 active:scale-[0.98] transition-all"
            >
              <Plus size={16} />
              <span>Deposit Money</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPayoutAmount(String(wallet?.availableBalance || ''));
                setPayoutModalOpen(true);
              }}
              className="bg-white/10 hover:bg-white/15 border border-white/10 text-white py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <ArrowUpRight size={16} className="text-emerald-400" />
              <span>Request Payout</span>
            </button>
          </div>
        </div>

        {/* Secondary Stats Column */}
        <div className="flex flex-col gap-3">
          {/* Pending Clearance Card */}
          <div className="bg-sleek-dark p-4 rounded-3xl border border-white/10 flex flex-col justify-between gap-1 shadow-lg">
            <div className="flex items-center justify-between text-white/40">
              <span className="text-[10px] font-bold uppercase tracking-widest">Pending Clearance</span>
              <Clock size={14} className="text-amber-400" />
            </div>
            <div className="text-xl font-black text-white font-mono">
              ₹{(wallet?.pendingBalance ?? 0).toLocaleString()}
            </div>
            <p className="text-[10px] text-white/40">Escrow hold on active gigs</p>
          </div>

          {/* Total Lifetime Earned Card */}
          <div className="bg-sleek-dark p-4 rounded-3xl border border-white/10 flex flex-col justify-between gap-1 shadow-lg">
            <div className="flex items-center justify-between text-white/40">
              <span className="text-[10px] font-bold uppercase tracking-widest">Total Platform Earned</span>
              <Sparkles size={14} className="text-sleek-violet" />
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono">
              ₹{(wallet?.totalEarned ?? 0).toLocaleString()}
            </div>
            <p className="text-[10px] text-white/40">Gross shoot dispatches & services</p>
          </div>
        </div>
      </div>

      {/* Blockchain & Token Currency Card */}
      <div className="bg-gradient-to-r from-purple-950/30 via-sleek-dark to-indigo-950/40 border border-purple-500/20 p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg relative overflow-hidden">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 bg-purple-500/20 text-purple-300 rounded-2xl shrink-0 mt-0.5 sm:mt-0">
            <Coins size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-white">OnlyCreation Token & Blockchain Rewards</h3>
              <span className="text-[8px] font-mono uppercase bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                L2 Ready
              </span>
            </div>
            <p className="text-[11px] text-white/60 mt-0.5 leading-relaxed">
              Future blockchain currency & token rewards coming soon — your balance is already prepared.
              1 INR maps 1:1 to OC Token on Base / Polygon L2.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled
          className="shrink-0 bg-white/5 border border-white/10 text-white/40 py-2 px-3.5 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-not-allowed"
        >
          <Lock size={12} />
          <span>Convert to Token (Coming Soon)</span>
        </button>
      </div>

      {/* Ledger History Section */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-sm font-black text-white">Immutable Ledger Audit Trail</h2>
            <p className="text-[10px] text-white/40">Authoritative Double-Entry Financial Records</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5 self-start">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                filterType === 'all' ? 'bg-sleek-violet text-white shadow-sm' : 'text-white/50 hover:text-white'
              }`}
            >
              All ({ledgerEntries.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('credit')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                filterType === 'credit' ? 'bg-emerald-500/20 text-emerald-300 shadow-sm' : 'text-white/50 hover:text-white'
              }`}
            >
              Credits (+)
            </button>
            <button
              type="button"
              onClick={() => setFilterType('debit')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                filterType === 'debit' ? 'bg-rose-500/20 text-rose-300 shadow-sm' : 'text-white/50 hover:text-white'
              }`}
            >
              Debits (-)
            </button>
          </div>
        </div>

        {/* Entries List */}
        {filteredEntries.length === 0 ? (
          <div className="bg-sleek-dark p-8 rounded-3xl border border-white/5 text-center flex flex-col items-center gap-2">
            <div className="p-3 bg-white/5 rounded-2xl text-white/30">
              <Receipt size={24} />
            </div>
            <p className="text-xs text-white/60 font-bold">No ledger transactions recorded yet</p>
            <p className="text-[10px] text-white/40 max-w-xs">
              Every deposit, booking payment, dispatch compensation, and payout will be immutably recorded here.
            </p>
            <button
              type="button"
              onClick={() => setDepositModalOpen(true)}
              className="mt-2 bg-sleek-violet/20 hover:bg-sleek-violet/30 text-purple-200 border border-sleek-violet/40 px-4 py-2 rounded-xl text-xs font-black"
            >
              Make First Deposit
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredEntries.map((entry) => {
              const isCredit = entry.direction === 'credit';
              return (
                <div
                  key={entry.id}
                  className="bg-sleek-dark p-3.5 rounded-2xl border border-white/5 flex items-center justify-between hover:border-white/15 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl shrink-0 ${
                      isCredit ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white capitalize">
                          {entry.type.replace('_', ' ')}
                        </h4>
                        <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                          entry.status === 'settled' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {entry.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/40">
                        <span className="font-mono">{entry.id}</span>
                        <span>•</span>
                        <span>{new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-sm font-mono font-black ${isCredit ? 'text-emerald-400' : 'text-white'}`}>
                      {isCredit ? '+' : '-'}₹{entry.amount.toLocaleString()}
                    </div>
                    <span className="text-[9px] font-mono text-white/40 block">
                      Bal: ₹{entry.balanceAfter.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DEPOSIT MODAL */}
      <AnimatePresence>
        {depositModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-sleek-dark border border-white/10 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-5 bg-zinc-950/80 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <Plus size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Deposit Funds to Wallet</h3>
                    <p className="text-[10px] text-cyan-400 font-medium">Powered by Cashfree Payments Gateway</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDepositModalOpen(false)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-4">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Select Amount (INR)</label>
                
                {/* Preset Chips */}
                <div className="grid grid-cols-4 gap-2">
                  {[500, 1000, 2500, 5000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setDepositAmount(amt);
                        setCustomAmount('');
                      }}
                      className={`py-2 rounded-xl text-xs font-mono font-black border transition-all ${
                        !customAmount && depositAmount === amt
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-white/5 border-white/5 text-white/60 hover:text-white'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                {/* Custom Amount Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Or Custom Amount</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-black text-sm text-white/40">₹</span>
                    <input
                      type="number"
                      placeholder="e.g. 10000"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-8 pr-4 text-sm font-mono font-bold text-white placeholder:text-white/30 outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300 font-bold">
                  <ShieldCheck size={18} className="shrink-0 text-emerald-400" />
                  <span>Double-entry ledger entry generated atomically upon confirmation.</span>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmDeposit}
                  disabled={depositProcessing}
                  className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 text-black font-black text-xs py-3.5 px-4 rounded-2xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {depositProcessing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Verifying with Cashfree...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Deposit ₹{(customAmount ? parseFloat(customAmount) || 0 : depositAmount).toLocaleString()} via Cashfree</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PAYOUT MODAL */}
      <AnimatePresence>
        {payoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-sleek-dark border border-white/10 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-5 bg-zinc-950/80 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-sleek-violet/20 text-purple-300 rounded-xl">
                    <ArrowUpRight size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Disburse Payout to Bank / UPI</h3>
                    <p className="text-[10px] text-white/40">Instant 24x7 IMPS Clearance</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPayoutModalOpen(false)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Available to Withdraw</span>
                  <span className="text-sm font-mono font-black text-emerald-400">
                    ₹{(wallet?.availableBalance ?? 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Withdrawal Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    max={wallet?.availableBalance || 0}
                    className="bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm font-mono font-bold text-white placeholder:text-white/30 outline-none focus:border-sleek-violet"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">UPI ID (VPA)</label>
                  <div className="relative">
                    <Smartphone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      placeholder="e.g. yourname@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-xs font-mono font-bold text-white placeholder:text-white/30 outline-none focus:border-sleek-violet"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmPayout}
                  disabled={payoutProcessing || !wallet?.availableBalance || wallet.availableBalance <= 0}
                  className="w-full bg-gradient-to-r from-sleek-violet to-purple-600 hover:from-purple-500 hover:to-sleek-violet text-white font-black text-xs py-3.5 px-4 rounded-2xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-sleek-violet/25 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {payoutProcessing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Processing IMPS Payout...</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight size={14} />
                      <span>Disburse Payout</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
