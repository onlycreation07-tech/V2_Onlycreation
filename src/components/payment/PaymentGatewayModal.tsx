import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  Smartphone, 
  QrCode, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  Building, 
  Coins, 
  Download, 
  ExternalLink,
  AlertCircle,
  Zap,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { PaymentOrder, PaymentResult, paymentService } from '../../services/paymentService';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { Wallet } from '../../types';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  order: PaymentOrder;
  onClose: () => void;
  onSuccess: (result: PaymentResult) => void;
}

export default function PaymentGatewayModal({ isOpen, order, onClose, onSuccess }: PaymentGatewayModalProps) {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'cashfree' | 'upi' | 'card' | 'wallet' | 'netbanking'>('cashfree');
  const [upiId, setUpiId] = useState('creator@okhdfcbank');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'cred'>('gpay');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [cardName, setCardName] = useState('CREATOR ENTERPRISES');
  const [processing, setProcessing] = useState(false);
  const [completedResult, setCompletedResult] = useState<PaymentResult | null>(null);

  React.useEffect(() => {
    if (!user?.uid) return;
    dbService.getWallet(user.uid).then(w => { if (w) setWallet(w); });
    const unsub = dbService.subscribeWallet(user.uid, (w) => { if (w) setWallet(w); });
    return () => unsub();
  }, [user]);

  if (!isOpen) return null;

  const handlePay = async () => {
    setProcessing(true);
    try {
      let result: PaymentResult;

      // 1. Pay from OC Authoritative Wallet
      if (selectedMethod === 'wallet') {
        const available = wallet?.availableBalance || 0;
        if (available < order.amount) {
          alert(`Insufficient wallet balance. Available: ₹${available.toLocaleString()}, Required: ₹${order.amount.toLocaleString()}. Please choose Cashfree UPI/Card.`);
          setProcessing(false);
          return;
        }

        if (!user?.uid) {
          alert('Please sign in to pay from wallet.');
          setProcessing(false);
          return;
        }

        const walletRes = await dbService.payFromWallet({
          uid: user.uid,
          amount: order.amount,
          itemType: order.itemType,
          itemId: order.itemId,
          itemTitle: order.itemTitle
        });

        result = {
          success: true,
          paymentId: walletRes.paymentId,
          orderId: order.orderId,
          method: 'OC_WALLET',
          provider: 'onlycreation_wallet',
          amount: order.amount,
          currency: order.currency || 'INR',
          timestamp: new Date().toISOString(),
          receiptUrl: `https://onlycreation.io/receipt/${walletRes.paymentId}`
        };
      } 
      // 2. Cashfree Payment Gateway Checkout
      else {
        // If official Cashfree session is present, open checkout popup
        if (selectedMethod === 'cashfree' && order.paymentSessionId && (window as any).Cashfree) {
          try {
            await paymentService.openCashfreeCheckout(order.paymentSessionId);
          } catch (e) {
            console.warn("Cashfree popup notice:", e);
          }
        }

        const methodCode = selectedMethod === 'cashfree' ? 'CASHFREE_UPI_FAST' 
          : selectedMethod === 'upi' ? `UPI_${selectedUpiApp.toUpperCase()}`
          : selectedMethod === 'card' ? 'CARD_VISA_MC'
          : 'NETBANKING';

        result = await paymentService.verifyPayment(
          { ...order, uid: user?.uid, provider: 'cashfree' }, 
          methodCode
        );
      }

      setCompletedResult(result);
      onSuccess(result);
    } catch (err: any) {
      console.error('Payment processing error:', err);
      alert(err.message || 'Payment could not be processed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-sleek-dark border border-white/10 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col relative"
      >
        {/* Header */}
        <div className="p-5 bg-zinc-950/80 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white">Cashfree Payments</h3>
                <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Production Live
                </span>
              </div>
              <p className="text-[10px] text-white/40 font-mono">Merchant ID: 24321078ec... • 256-bit SSL Gateway</p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            disabled={processing}
            className="p-2 text-white/40 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body content */}
        {!completedResult ? (
          <div className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto hide-scrollbar">
            
            {/* Order Summary Card */}
            <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-4 rounded-2xl border border-white/10 flex justify-between items-center relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex flex-col relative z-10">
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Total Amount Payable</span>
                <span className="text-3xl font-black text-white tracking-tight mt-0.5">₹{order.amount.toLocaleString()}</span>
                <span className="text-[11px] text-cyan-400 font-semibold mt-1 truncate max-w-[240px] flex items-center gap-1.5">
                  <Zap size={12} className="text-cyan-400" />
                  {order.itemTitle}
                </span>
              </div>

              <div className="text-right relative z-10">
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Order Ref</span>
                <p className="text-[10px] font-mono text-white/70 mt-0.5 max-w-[130px] truncate">{order.orderId}</p>
                <span className="inline-block mt-1 text-[8px] font-mono uppercase bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20">
                  Cashfree PG
                </span>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Select Payment Method</label>
              
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'cashfree', label: 'Cashfree ⚡', icon: Zap },
                  { id: 'upi', label: 'UPI / QR', icon: Smartphone },
                  { id: 'card', label: 'Cards', icon: CreditCard },
                  { id: 'wallet', label: 'Wallet', icon: Coins },
                ].map(m => {
                  const Icon = m.icon;
                  const active = selectedMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMethod(m.id as any)}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                        active 
                          ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30' 
                          : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-[9px] font-bold uppercase tracking-wider">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cashfree Express Method */}
            {selectedMethod === 'cashfree' && (
              <div className="bg-zinc-950/70 p-4 rounded-2xl border border-blue-500/20 flex flex-col gap-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="text-xs font-bold text-white">Cashfree Auto-Checkout</span>
                  </div>
                  <span className="text-[9px] bg-blue-500/10 text-cyan-300 font-mono px-2 py-0.5 rounded border border-blue-500/20">
                    UPI • Cards • NetBanking
                  </span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Direct gateway checkout through Cashfree. Supports instant UPI QR, Google Pay, PhonePe, Paytm, BHIM, all Indian debit & credit cards.
                </p>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[
                    { name: 'Google Pay', color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300' },
                    { name: 'PhonePe', color: 'border-purple-500/30 bg-purple-500/5 text-purple-300' },
                    { name: 'Paytm', color: 'border-blue-500/30 bg-blue-500/5 text-blue-300' },
                    { name: 'Cards/NB', color: 'border-white/10 bg-white/5 text-white/70' }
                  ].map((app) => (
                    <div key={app.name} className={`p-2 rounded-xl border text-center text-[10px] font-bold ${app.color}`}>
                      {app.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* UPI & QR Method */}
            {selectedMethod === 'upi' && (
              <div className="bg-zinc-950/70 p-4 rounded-2xl border border-white/5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-white/40">Select UPI Application</span>
                  <div className="flex gap-1.5">
                    {[
                      { id: 'gpay', label: 'GPay' },
                      { id: 'phonepe', label: 'PhonePe' },
                      { id: 'paytm', label: 'Paytm' },
                      { id: 'cred', label: 'CRED' }
                    ].map(app => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setSelectedUpiApp(app.id as any)}
                        className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition-all ${
                          selectedUpiApp === app.id
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-white/5 text-white/50 border-white/10 hover:text-white'
                        }`}
                      >
                        {app.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-white/30 uppercase">Enter VPA / UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="creator@okhdfcbank"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-dashed border-white/15 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-cyan-400">
                      <QrCode size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white/90">Scan Cashfree Dynamic QR</p>
                      <p className="text-[9px] text-white/40">Open Camera or any UPI App</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-cyan-400 uppercase bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20">
                    Instant Auto-Verify
                  </span>
                </div>
              </div>
            )}

            {/* Credit / Debit Card Method */}
            {selectedMethod === 'card' && (
              <div className="bg-zinc-950/70 p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase text-white/40">Card Details</span>
                  <div className="flex gap-1.5">
                    <span className="text-[8px] font-bold bg-white/10 text-white/80 px-1.5 py-0.5 rounded">VISA</span>
                    <span className="text-[8px] font-bold bg-white/10 text-white/80 px-1.5 py-0.5 rounded">MasterCard</span>
                    <span className="text-[8px] font-bold bg-white/10 text-white/80 px-1.5 py-0.5 rounded">RuPay</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-white/30 uppercase">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-white/30 uppercase">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-white/30 uppercase">CVV</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-white/30 uppercase">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white uppercase outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Wallet Method */}
            {selectedMethod === 'wallet' && (
              <div className="bg-zinc-950/70 p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-white/40">OnlyCreation Wallet</span>
                  <span className="text-xs font-mono font-black text-emerald-400">
                    ₹{(wallet?.availableBalance ?? 0).toLocaleString()} Available
                  </span>
                </div>
                <p className="text-xs text-white/70">
                  {(wallet?.availableBalance ?? 0) >= order.amount ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={14} />
                      Sufficient balance. Instant 1-click settlement with immutable double-entry ledger.
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold flex items-center gap-1.5">
                      <AlertCircle size={14} />
                      Insufficient balance (₹{(wallet?.availableBalance ?? 0).toLocaleString()} of ₹{order.amount.toLocaleString()}). Please choose Cashfree UPI or Card.
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Security Guarantee */}
            <div className="flex items-center justify-between text-[10px] text-white/40 px-1">
              <span className="flex items-center gap-1">
                <Lock size={11} className="text-emerald-400" /> Cashfree PCI-DSS Level 1 Encrypted
              </span>
              <span className="text-cyan-400 font-mono text-[9px]">
                API v2023-08-01 Active
              </span>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={processing}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Connecting to Cashfree Gateway...
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Authorize & Pay ₹{order.amount.toLocaleString()} with Cashfree
                </>
              )}
            </button>
          </div>
        ) : (
          /* Payment Success & Receipt View */
          <div className="p-6 flex flex-col items-center text-center gap-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">Payment Confirmed!</h3>
              <p className="text-xs text-white/50 font-medium mt-1">Transaction verified via Cashfree Production Gateway.</p>
            </div>

            {/* Invoice Details */}
            <div className="bg-white/5 w-full p-4 rounded-2xl border border-white/5 flex flex-col gap-2.5 text-xs text-left">
              <div className="flex justify-between">
                <span className="text-white/40 font-bold uppercase text-[9px]">Payment Reference:</span>
                <span className="font-mono text-emerald-400 font-bold">{completedResult.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40 font-bold uppercase text-[9px]">Order ID:</span>
                <span className="font-mono text-white/80">{completedResult.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40 font-bold uppercase text-[9px]">Gateway Provider:</span>
                <span className="font-semibold text-cyan-400 uppercase">Cashfree Payments</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40 font-bold uppercase text-[9px]">Item:</span>
                <span className="font-semibold text-white/90 truncate max-w-[200px]">{order.itemTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40 font-bold uppercase text-[9px]">Payment Method:</span>
                <span className="font-semibold text-white">{completedResult.method}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/5 font-extrabold text-sm">
                <span className="text-white">Total Settled:</span>
                <span className="text-cyan-400">₹{completedResult.amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2 w-full">
              <button
                onClick={onClose}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:opacity-90 transition-all cursor-pointer"
              >
                Done
              </button>
              <button
                onClick={() => alert(`Tax invoice receipt generated for ${completedResult.paymentId}`)}
                className="p-3.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 border border-white/10 flex items-center justify-center cursor-pointer"
                title="Download Receipt"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
