import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  CreditCard, 
  Sparkles, 
  CheckCircle2, 
  Download, 
  Receipt, 
  ShieldCheck, 
  Zap, 
  Smartphone, 
  ChevronRight, 
  ExternalLink, 
  Edit2, 
  Lock, 
  Plus,
  Wallet as WalletIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PaymentGatewayModal from '../payment/PaymentGatewayModal';
import { PaymentOrder, PaymentResult } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/dbService';
import { Wallet } from '../../types';

interface BillingScreenProps {
  onBack: () => void;
  brandName: string;
}

interface PaymentRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  item: string;
  amount: number;
  status: 'paid' | 'processing';
  method: string;
}

const INITIAL_PAYMENT_HISTORY: PaymentRecord[] = [
  {
    id: 'pay_101',
    invoiceNumber: 'INV-2026-0891',
    date: 'Sep 18, 2026',
    item: 'OnlyCreation Pro Tier (Monthly)',
    amount: 2999,
    status: 'paid',
    method: 'UPI • creator@okhdfcbank'
  },
  {
    id: 'pay_102',
    invoiceNumber: 'INV-2026-0812',
    date: 'Aug 18, 2026',
    item: 'OnlyCreation Pro Tier (Monthly)',
    amount: 2999,
    status: 'paid',
    method: 'UPI • creator@okhdfcbank'
  },
  {
    id: 'pay_103',
    invoiceNumber: 'INV-2026-0745',
    date: 'Jul 24, 2026',
    item: 'Studio Daylight Loft 4-Hour Pass',
    amount: 4800,
    status: 'paid',
    method: 'Visa ending 4242'
  }
];

export default function BillingScreen({ onBack, brandName }: BillingScreenProps) {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isPro, setIsPro] = useState(true);
  const [history, setHistory] = useState<PaymentRecord[]>(INITIAL_PAYMENT_HISTORY);
  const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<'upi' | 'card'>('upi');
  const [upiId, setUpiId] = useState('creator@okhdfcbank');
  const [cardLast4, setCardLast4] = useState('4242');
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    dbService.getWallet(user.uid).then(w => { if (w) setWallet(w); });
    const unsub = dbService.subscribeWallet(user.uid, (w) => { if (w) setWallet(w); });
    return () => unsub();
  }, [user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenUpgrade = () => {
    setPaymentOrder({
      orderId: `pro_sub_${Date.now()}`,
      amount: 2999,
      currency: 'INR',
      itemType: 'partner_subscription',
      itemTitle: 'OnlyCreation Enterprise Pro Tier',
      itemDescription: 'Unlimited 4K Script AI • 0% Commission on first 10 shoots • Priority Radar Dispatches',
      customerEmail: 'creator@onlycreation.io',
      customerName: brandName
    });
  };

  const handlePaymentSuccess = (result: PaymentResult) => {
    setIsPro(true);
    setPaymentOrder(null);
    const newRecord: PaymentRecord = {
      id: result.paymentId,
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: 'Today',
      item: 'OnlyCreation Enterprise Pro Tier',
      amount: result.amount,
      status: 'paid',
      method: result.method
    };
    setHistory([newRecord, ...history]);
    showToast('Pro Subscription activated successfully!');
  };

  const downloadReceipt = (record: PaymentRecord) => {
    showToast(`Invoice ${record.invoiceNumber} downloaded to device`);
  };

  return (
    <div className="flex flex-col gap-6 text-left pb-16">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 inset-x-4 max-w-sm mx-auto z-50 bg-emerald-500 text-black px-4 py-2.5 rounded-2xl shadow-2xl font-black text-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-white/80 hover:text-white transition-all active:scale-95"
          aria-label="Back to Profile"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-black tracking-tight text-white">Billing & Subscriptions</h1>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Invoices, Plans & Payment Methods</p>
        </div>
      </header>

      {/* Authoritative Wallet Quick Access */}
      <div className="bg-sleek-dark p-4 rounded-3xl border border-white/10 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <WalletIcon size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 block">OnlyCreation Wallet</span>
            <span className="text-lg font-black font-mono text-white">
              ₹{(wallet?.availableBalance ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold">
            Authoritative • Token Ready
          </span>
        </div>
      </div>

      {/* Current Plan Card */}
      <div className="bg-gradient-to-br from-sleek-violet/30 via-sleek-dark to-purple-950/40 p-6 rounded-[32px] border border-sleek-violet/30 relative overflow-hidden shadow-2xl flex flex-col gap-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sleek-violet/20 blur-[50px] rounded-full -mr-10 -mt-10" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sleek-violet/30 rounded-xl text-white">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-sleek-violet">Active Tier</span>
              <h3 className="text-lg font-black text-white">{isPro ? 'Pro Creator Plan' : 'Free Starter'}</h3>
            </div>
          </div>
          <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            {isPro ? '₹2,999 / mo' : 'Free Forever'}
          </span>
        </div>

        <p className="text-xs text-white/70 relative z-10 leading-relaxed">
          {isPro 
            ? 'Unlimited 4K script generations, priority dispatch radar matching, and 0% platform fee on all video shoot orders.' 
            : 'Basic script tools and community studio booking.'}
        </p>

        {/* Pro Benefits Checklist */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 relative z-10 text-[11px]">
          {[
            '0% Take Rate on Shoots',
            'Priority Uber Radar Ping',
            'Unlimited 4K AI Scripts',
            'Instant UPI Payout clearance'
          ].map((benefit, i) => (
            <div key={i} className="flex items-center gap-1.5 text-white/80">
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Upgrade / Renew Action Button */}
        <div className="pt-2 relative z-10">
          <button
            type="button"
            onClick={handleOpenUpgrade}
            className="w-full bg-gradient-to-r from-sleek-violet to-purple-600 hover:from-purple-500 hover:to-sleek-violet text-white py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-sleek-violet/25 active:scale-[0.98] transition-all"
          >
            <Zap size={14} className="fill-current text-amber-300" />
            <span>{isPro ? 'Renew / Extend Pro Plan' : 'Upgrade to Pro (₹2,999/mo)'}</span>
          </button>
        </div>
      </div>

      {/* Payment Methods Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Payment Method</label>
          <button
            type="button"
            onClick={() => setIsEditingPayment(!isEditingPayment)}
            className="text-[10px] font-bold text-sleek-violet hover:text-purple-300 flex items-center gap-1"
          >
            <Edit2 size={11} />
            <span>{isEditingPayment ? 'Cancel' : 'Change'}</span>
          </button>
        </div>

        <div className="bg-sleek-dark p-4 rounded-3xl border border-white/10 flex flex-col gap-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/5 rounded-2xl border border-white/5 text-white/80">
                {defaultPaymentMethod === 'upi' ? <Smartphone size={18} className="text-emerald-400" /> : <CreditCard size={18} className="text-sleek-violet" />}
              </div>
              <div>
                <span className="text-xs font-black text-white block">
                  {defaultPaymentMethod === 'upi' ? 'UPI AutoPay (Direct Bank)' : 'Visa Corporate Card'}
                </span>
                <span className="text-[10px] font-mono text-white/50">
                  {defaultPaymentMethod === 'upi' ? upiId : `•••• •••• •••• ${cardLast4}`}
                </span>
              </div>
            </div>
            <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Default
            </span>
          </div>

          {/* Edit Payment Method Form */}
          {isEditingPayment && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-3 border-t border-white/10 flex flex-col gap-3"
            >
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDefaultPaymentMethod('upi')}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                    defaultPaymentMethod === 'upi'
                      ? 'bg-emerald-500/20 border-emerald-400 text-white'
                      : 'bg-white/5 border-white/5 text-white/50'
                  }`}
                >
                  UPI VPA
                </button>
                <button
                  type="button"
                  onClick={() => setDefaultPaymentMethod('card')}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                    defaultPaymentMethod === 'card'
                      ? 'bg-sleek-violet/20 border-sleek-violet text-white'
                      : 'bg-white/5 border-white/5 text-white/50'
                  }`}
                >
                  Credit Card
                </button>
              </div>

              {defaultPaymentMethod === 'upi' ? (
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. yourname@okhdfcbank"
                  className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-emerald-400 font-mono"
                />
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cardLast4}
                    onChange={(e) => setCardLast4(e.target.value)}
                    maxLength={4}
                    placeholder="Last 4 digits"
                    className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-sleek-violet font-mono w-28"
                  />
                  <span className="text-[10px] text-white/40 self-center">Processed via PCI-DSS 256-bit vault</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsEditingPayment(false);
                  showToast('Payment method updated successfully');
                }}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Save Payment Method
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Payment History & Invoices */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Payment History ({history.length})</label>
          <span className="text-[9px] text-white/40">Official Tax Receipts</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {history.map((record) => (
            <div
              key={record.id}
              className="bg-sleek-dark p-3.5 rounded-2xl border border-white/5 flex items-center justify-between shadow-sm hover:border-white/15 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 text-white/70 rounded-xl">
                  <Receipt size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">{record.item}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-white/40 font-mono">{record.invoiceNumber}</span>
                    <span className="text-[9px] text-white/30">•</span>
                    <span className="text-[10px] text-white/40">{record.date}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="text-right">
                  <span className="text-xs font-mono font-black text-white">₹{record.amount.toLocaleString()}</span>
                  <span className="text-[9px] font-black uppercase text-emerald-400 block">{record.status}</span>
                </div>
                <button
                  type="button"
                  onClick={() => downloadReceipt(record)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all"
                  title="Download Tax Invoice"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Integration */}
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
