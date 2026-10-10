export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  itemType: 'studio_booking' | 'creator_dispatch' | 'omas_campaign' | 'partner_subscription' | 'wallet_deposit';
  itemTitle: string;
  itemDescription?: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  itemId?: string;
  uid?: string;
  gatewayOrderId?: string;
  cfOrderId?: string;
  paymentSessionId?: string;
  keyId?: string;
  provider?: 'cashfree' | 'razorpay' | 'sandbox' | 'stripe';
  signatureToken?: string;
  providerStatus?: string;
  providerNotice?: string;
  env?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  orderId: string;
  method: string;
  amount: number;
  currency?: string;
  provider?: string;
  timestamp: string;
  receiptUrl?: string;
  error?: string;
}

export const paymentService = {
  // Authoritative server-side order creation (Cashfree prioritized)
  async createOrder(params: Omit<PaymentOrder, 'orderId'>): Promise<PaymentOrder> {
    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Server failed to generate payment order');
      }
      return await response.json();
    } catch (e: any) {
      console.warn("Payment order creation fallback:", e);
      const generatedId = `cf_ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return {
        orderId: generatedId,
        provider: 'cashfree',
        ...params
      };
    }
  },

  // Authoritative server-side payment verification
  async verifyPayment(order: PaymentOrder, method: string, signature?: string): Promise<PaymentResult> {
    try {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.orderId,
          amount: order.amount,
          currency: order.currency || 'INR',
          method: method.toUpperCase(),
          itemType: order.itemType,
          itemId: order.itemId,
          uid: order.uid,
          provider: order.provider || 'cashfree',
          signature,
          signatureToken: order.signatureToken
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Payment verification failed');
      }

      const data = await response.json();
      return {
        success: true,
        paymentId: data.paymentId,
        orderId: data.orderId,
        method: data.method || method,
        provider: data.provider || order.provider || 'cashfree',
        amount: data.amount || order.amount,
        currency: data.currency || order.currency,
        timestamp: data.timestamp || new Date().toISOString(),
        receiptUrl: data.receiptUrl || `https://onlycreation.io/receipt/${data.paymentId}`
      };
    } catch (err: any) {
      console.error("Payment verification failure:", err);
      throw err;
    }
  },

  // Launch official Cashfree JS checkout if available
  async openCashfreeCheckout(paymentSessionId: string): Promise<boolean> {
    if (typeof window !== 'undefined' && (window as any).Cashfree) {
      try {
        const cashfree = (window as any).Cashfree({ mode: "production" });
        await cashfree.checkout({
          paymentSessionId,
          redirectTarget: "_modal"
        });
        return true;
      } catch (err) {
        console.warn("Cashfree checkout error:", err);
        return false;
      }
    }
    return false;
  },

  // Check live status of Cashfree order
  async checkOrderStatus(orderId: string): Promise<any> {
    try {
      const res = await fetch(`/api/payments/cashfree/status/${encodeURIComponent(orderId)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn("Failed to check status:", err);
    }
    return null;
  }
};
