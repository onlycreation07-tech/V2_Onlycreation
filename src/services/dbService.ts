import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  setDoc, 
  limit, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Studio, 
  AdCreative, 
  BrandProfile, 
  BillboardEnquiry, 
  Booking, 
  DispatchBooking, 
  Project, 
  ProjectMessage, 
  ActivityLog, 
  AppConfig,
  UserProfile,
  Organization,
  PaymentRecord,
  ReviewRecord,
  DisputeRecord,
  AppNotification,
  Wallet,
  LedgerEntry
} from '../types';
import { PartnerProfile, PartnerPayout } from '../types/stakeholder';

export const dbService = {
  // ================= USERS =================
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docSnap = await getDoc(doc(db, 'users', uid));
      if (docSnap.exists()) {
        return { uid: docSnap.id, ...(docSnap.data() as object) } as UserProfile;
      }
    } catch (e) {
      console.warn("Could not get user profile:", e);
    }
    return null;
  },

  async syncUserProfile(uid: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const now = new Date().toISOString();
    const existing = await this.getUserProfile(uid);
    const profile: UserProfile = {
      uid,
      email: data.email ?? existing?.email ?? null,
      displayName: data.displayName ?? existing?.displayName ?? 'Production Lead',
      photoURL: data.photoURL ?? existing?.photoURL ?? null,
      phone: data.phone ?? existing?.phone ?? null,
      status: 'active',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      lastLoginAt: now,
      defaultOrganizationId: data.defaultOrganizationId ?? existing?.defaultOrganizationId ?? `org_${uid}`,
      role: data.role ?? existing?.role ?? (data.isPartner ? 'CREATOR' : 'CLIENT'),
      isPartner: data.isPartner ?? existing?.isPartner ?? false,
      partnerRole: data.partnerRole ?? existing?.partnerRole ?? (data.isPartner ? 'reel_creator' : undefined)
    };

    await setDoc(doc(db, 'users', uid), profile, { merge: true });

    // Ensure user has default organization created
    await this.ensureUserOrganization(profile);

    return profile;
  },

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  async deleteAccount(uid: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (e) {
      console.warn("Could not delete user document:", e);
    }
  },

  // ================= ORGANIZATIONS =================
  async ensureUserOrganization(userProfile: UserProfile): Promise<Organization> {
    const orgId = userProfile.defaultOrganizationId || `org_${userProfile.uid}`;
    try {
      const existing = await this.getOrganization(orgId);
      if (existing) return existing;

      const now = new Date().toISOString();
      const newOrg: Organization = {
        id: orgId,
        name: userProfile.displayName ? `${userProfile.displayName}'s Studio` : 'Main Production Studio',
        slug: orgId,
        ownerId: userProfile.uid,
        plan: 'starter',
        members: [
          {
            uid: userProfile.uid,
            email: userProfile.email || 'creator@onlycreation.io',
            displayName: userProfile.displayName || 'Owner',
            role: 'OWNER',
            addedAt: now
          }
        ],
        createdAt: now,
        updatedAt: now
      };

      await setDoc(doc(db, 'organizations', orgId), newOrg);
      return newOrg;
    } catch (e) {
      console.warn("Ensure organization failed, returning local default:", e);
      return {
        id: orgId,
        name: 'Default Workspace',
        slug: orgId,
        ownerId: userProfile.uid,
        plan: 'starter',
        members: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  },

  async getOrganization(orgId: string): Promise<Organization | null> {
    try {
      const snap = await getDoc(doc(db, 'organizations', orgId));
      if (snap.exists()) {
        return { id: snap.id, ...(snap.data() as object) } as Organization;
      }
    } catch (e) {
      console.warn("Could not get organization:", e);
    }
    return null;
  },

  async updateOrganization(orgId: string, updates: Partial<Organization>): Promise<void> {
    await updateDoc(doc(db, 'organizations', orgId), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  // ================= BRANDS =================
  async saveBrand(userId: string, brand: Partial<BrandProfile>): Promise<void> {
    const now = new Date().toISOString();
    await setDoc(doc(db, 'brands', userId), { 
      ...brand, 
      userId, 
      updatedAt: now 
    }, { merge: true });
  },

  async getBrand(userId: string): Promise<BrandProfile | null> {
    try {
      const docSnap = await getDoc(doc(db, 'brands', userId));
      return docSnap.exists() ? docSnap.data() as BrandProfile : null;
    } catch (e) {
      console.warn("Could not get brand from DB:", e);
      return null;
    }
  },

  // ================= AI CREATIVES =================
  async saveCreative(creative: Omit<AdCreative, 'id' | 'createdAt'> & { id?: string }): Promise<string> {
    const id = creative.id || `cr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const data: AdCreative = {
      ...creative,
      id,
      createdAt: now
    };
    await setDoc(doc(db, 'creatives', id), data);
    return id;
  },

  async getUserCreatives(userId: string): Promise<AdCreative[]> {
    try {
      const q = query(
        collection(db, 'creatives'), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as object) } as AdCreative));
    } catch (e) {
      console.warn("Could not query user creatives:", e);
      return [];
    }
  },

  // ================= PROJECTS =================
  async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, 'projects'), {
      ...projectData,
      createdAt: now,
      updatedAt: now,
    });

    await this.logActivity({
      action: 'PROJECT_CREATED',
      entityType: 'project',
      entityId: docRef.id,
      performedBy: projectData.userId,
      details: `Project "${projectData.title}" initialized in stage ${projectData.stage}`
    });

    // Send in-app notification
    await this.createNotification({
      userId: projectData.userId,
      title: 'Project Initialized',
      message: `Project "${projectData.title}" was created in ${projectData.stage} stage.`,
      type: 'project',
      link: docRef.id
    });

    return docRef.id;
  },

  async getProjects(userId?: string): Promise<Project[]> {
    try {
      let q;
      if (userId) {
        q = query(collection(db, 'projects'), where('userId', '==', userId));
      } else {
        q = query(collection(db, 'projects'), orderBy('updatedAt', 'desc'));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Project));
    } catch (e) {
      console.warn("Failed to fetch projects from Firestore:", e);
      return [];
    }
  },

  async getProjectById(projectId: string): Promise<Project | null> {
    try {
      const docSnap = await getDoc(doc(db, 'projects', projectId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...(docSnap.data() as object) } as Project;
      }
    } catch (e) {
      console.warn("Could not get project by id:", e);
    }
    return null;
  },

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    await updateDoc(doc(db, 'projects', projectId), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  async deleteProject(projectId: string): Promise<void> {
    await deleteDoc(doc(db, 'projects', projectId));
  },

  async updateDeliverableStatus(
    projectId: string, 
    deliverableId: string, 
    status: 'approved' | 'revision_requested', 
    feedback?: string
  ): Promise<void> {
    const proj = await this.getProjectById(projectId);
    if (!proj) return;

    const updatedDeliverables = proj.deliverables.map(d => {
      if (d.id === deliverableId) {
        return {
          ...d,
          status,
          feedback: feedback || d.feedback
        };
      }
      return d;
    });

    await this.updateProject(projectId, { deliverables: updatedDeliverables });

    await this.logActivity({
      action: status === 'approved' ? 'DELIVERABLE_APPROVED' : 'REVISION_REQUESTED',
      entityType: 'project',
      entityId: projectId,
      performedBy: proj.userId,
      details: `Deliverable ${deliverableId} marked as ${status}. ${feedback ? 'Feedback: ' + feedback : ''}`
    });
  },

  // ================= MESSAGING =================
  async sendProjectMessage(messageData: Omit<ProjectMessage, 'id' | 'timestamp'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'messages'), {
      ...messageData,
      timestamp: new Date().toISOString()
    });
    return docRef.id;
  },

  async getProjectMessages(projectId: string): Promise<ProjectMessage[]> {
    try {
      const q = query(
        collection(db, 'messages'),
        where('projectId', '==', projectId),
        orderBy('timestamp', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as ProjectMessage));
    } catch (e) {
      console.warn("Could not fetch project messages:", e);
      return [];
    }
  },

  // ================= DISPATCHES (UBER FOR SHOOTS) =================
  async createDispatch(dispatchData: Omit<DispatchBooking, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'dispatches'), {
      ...dispatchData,
      createdAt: new Date().toISOString()
    });

    await this.logActivity({
      action: 'DISPATCH_BOOKED',
      entityType: 'dispatch',
      entityId: docRef.id,
      performedBy: dispatchData.userId,
      details: `Creator tier ${dispatchData.creatorTier} dispatched for ₹${dispatchData.totalPrice}`
    });

    return docRef.id;
  },

  async getDispatches(userId?: string): Promise<DispatchBooking[]> {
    try {
      let q;
      if (userId) {
        q = query(collection(db, 'dispatches'), where('userId', '==', userId));
      } else {
        q = query(collection(db, 'dispatches'), orderBy('createdAt', 'desc'));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as DispatchBooking));
    } catch (e) {
      console.warn("Could not get dispatches:", e);
      return [];
    }
  },

  async updateDispatch(id: string, updates: Partial<DispatchBooking>): Promise<void> {
    await updateDoc(doc(db, 'dispatches', id), updates);
  },

  // ================= BOOKINGS (STUDIOS) =================
  async createBooking(bookingData: Omit<Booking, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      createdAt: new Date().toISOString()
    });

    await this.logActivity({
      action: 'STUDIO_BOOKED',
      entityType: 'booking',
      entityId: docRef.id,
      performedBy: bookingData.userId || 'anonymous',
      details: `Booked ${bookingData.studioName} for ${bookingData.hours}h on ${bookingData.date}`
    });

    return docRef.id;
  },

  async getBookings(userId?: string): Promise<Booking[]> {
    try {
      let q;
      if (userId) {
        q = query(collection(db, 'bookings'), where('userId', '==', userId));
      } else {
        q = query(collection(db, 'bookings'), orderBy('date', 'desc'));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Booking));
    } catch (e) {
      console.warn("Could not get bookings:", e);
      return [];
    }
  },

  async updateBooking(id: string, updates: Partial<Booking>): Promise<void> {
    await updateDoc(doc(db, 'bookings', id), updates);
  },

  async deleteBooking(id: string): Promise<void> {
    await deleteDoc(doc(db, 'bookings', id));
  },

  // ================= PAYMENTS LEDGER =================
  async recordPayment(payment: Omit<PaymentRecord, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'payments'), {
      ...payment,
      createdAt: new Date().toISOString()
    });

    await this.logActivity({
      action: 'PAYMENT_RECEIVED',
      entityType: 'payment',
      entityId: docRef.id,
      performedBy: payment.userId,
      details: `Payment of ₹${payment.amount} via ${payment.method} for ${payment.itemType}`
    });

    return docRef.id;
  },

  async getUserPayments(userId: string): Promise<PaymentRecord[]> {
    try {
      const q = query(
        collection(db, 'payments'), 
        where('userId', '==', userId), 
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as object) } as PaymentRecord));
    } catch (e) {
      console.warn("Could not get user payments:", e);
      return [];
    }
  },

  async getAllPayments(): Promise<PaymentRecord[]> {
    try {
      const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'), limit(100));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as object) } as PaymentRecord));
    } catch (e) {
      console.warn("Could not get all payments:", e);
      return [];
    }
  },

  // ================= PARTNER PAYOUTS & WALLET =================
  async requestPayout(payoutData: Omit<PartnerPayout, 'id' | 'requestedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'payouts'), {
      ...payoutData,
      requestedAt: new Date().toISOString()
    });

    await this.logActivity({
      action: 'PAYOUT_REQUESTED',
      entityType: 'system',
      entityId: docRef.id,
      performedBy: payoutData.partnerId,
      details: `Partner ${payoutData.partnerName} requested payout of ₹${payoutData.amount} via UPI ${payoutData.upiId}`
    });

    return docRef.id;
  },

  async getPartnerPayouts(partnerId?: string): Promise<PartnerPayout[]> {
    try {
      let q;
      if (partnerId) {
        q = query(collection(db, 'payouts'), where('partnerId', '==', partnerId));
      } else {
        q = query(collection(db, 'payouts'), orderBy('requestedAt', 'desc'));
      }
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as object) } as PartnerPayout));
    } catch (e) {
      console.warn("Could not get payouts:", e);
      return [];
    }
  },

  async updatePayoutStatus(payoutId: string, status: PartnerPayout['status'], transactionRef?: string): Promise<void> {
    await updateDoc(doc(db, 'payouts', payoutId), {
      status,
      paidAt: status === 'paid' ? new Date().toISOString() : null,
      transactionRef: transactionRef || null
    });
  },

  async getPartnerProfile(partnerId: string): Promise<PartnerProfile | null> {
    try {
      const snap = await getDoc(doc(db, 'partnerProfiles', partnerId));
      if (snap.exists()) {
        return { id: snap.id, ...(snap.data() as object) } as PartnerProfile;
      }
    } catch (e) {
      console.warn("Could not get partner profile:", e);
    }
    return null;
  },

  async savePartnerProfile(partnerId: string, profile: Partial<PartnerProfile>): Promise<void> {
    await setDoc(doc(db, 'partnerProfiles', partnerId), profile, { merge: true });
  },

  // ================= WALLET & IMMUTABLE LEDGER =================
  async getWallet(uid: string): Promise<Wallet | null> {
    try {
      const snap = await getDoc(doc(db, 'wallets', uid));
      if (snap.exists()) {
        return { uid: snap.id, ...(snap.data() as object) } as Wallet;
      }
    } catch (e) {
      console.warn("Could not get wallet:", e);
    }
    return null;
  },

  subscribeWallet(uid: string, callback: (wallet: Wallet | null) => void): () => void {
    const unsub = onSnapshot(doc(db, 'wallets', uid), (snap) => {
      if (snap.exists()) {
        callback({ uid: snap.id, ...(snap.data() as object) } as Wallet);
      } else {
        callback(null);
      }
    }, (err) => {
      console.warn("Wallet subscription error:", err);
    });
    return unsub;
  },

  async getLedgerEntries(uid: string, limitCount = 50): Promise<LedgerEntry[]> {
    try {
      const q = query(
        collection(db, 'ledgerEntries'),
        where('uid', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as object) } as LedgerEntry));
    } catch (e) {
      console.warn("Could not get ledger entries:", e);
      return [];
    }
  },

  subscribeLedgerEntries(uid: string, callback: (entries: LedgerEntry[]) => void, limitCount = 50): () => void {
    const q = query(
      collection(db, 'ledgerEntries'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const unsub = onSnapshot(q, (snap) => {
      const entries = snap.docs.map(d => ({ id: d.id, ...(d.data() as object) } as LedgerEntry));
      callback(entries);
    }, (err) => {
      console.warn("Ledger subscription error:", err);
    });
    return unsub;
  },

  // Authoritative server-side deposit order creation
  async createDepositOrder(params: {
    amount: number;
    currency?: string;
    uid: string;
    customerName?: string;
    customerEmail?: string;
  }) {
    const res = await fetch('/api/wallet/deposit-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to initialize deposit order');
    }
    return await res.json();
  },

  // Authoritative server-side deposit verification & wallet credit
  async verifyDepositOrder(params: {
    orderId: string;
    paymentId: string;
    signatureToken?: string;
    amount: number;
    currency?: string;
    uid: string;
    method?: string;
  }) {
    const res = await fetch('/api/wallet/verify-deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Deposit verification failed');
    }
    return await res.json();
  },

  // Authoritative server-side payment from wallet
  async payFromWallet(params: {
    uid: string;
    amount: number;
    itemType: string;
    itemId?: string;
    itemTitle: string;
  }) {
    const res = await fetch('/api/wallet/pay-from-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Wallet payment failed');
    }
    return await res.json();
  },

  // Authoritative server-side payout
  async requestPayoutServer(params: {
    uid: string;
    amount: number;
    upiId: string;
    partnerRole: string;
    partnerName?: string;
  }) {
    const res = await fetch('/api/wallet/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Payout request failed');
    }
    return await res.json();
  },

  async updatePartnerWallet(partnerId: string, amountChange: number): Promise<void> {
    const current = await this.getPartnerProfile(partnerId);
    const newBal = (current?.walletBalance || 0) + amountChange;
    const newEarnings = amountChange > 0 ? (current?.totalEarnings || 0) + amountChange : (current?.totalEarnings || 0);

    await this.savePartnerProfile(partnerId, {
      walletBalance: Math.max(0, newBal),
      totalEarnings: newEarnings
    });
  },

  // ================= REVIEWS & RATINGS =================
  async submitReview(review: Omit<ReviewRecord, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'reviews'), {
      ...review,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async getReviews(targetId?: string): Promise<ReviewRecord[]> {
    try {
      let q;
      if (targetId) {
        q = query(collection(db, 'reviews'), where('targetId', '==', targetId));
      } else {
        q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(50));
      }
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as object) } as ReviewRecord));
    } catch (e) {
      console.warn("Could not get reviews:", e);
      return [];
    }
  },

  // ================= DISPUTES =================
  async createDispute(dispute: Omit<DisputeRecord, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'disputes'), {
      ...dispute,
      status: 'open',
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async getDisputes(): Promise<DisputeRecord[]> {
    try {
      const q = query(collection(db, 'disputes'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as object) } as DisputeRecord));
    } catch (e) {
      console.warn("Could not get disputes:", e);
      return [];
    }
  },

  async updateDisputeStatus(disputeId: string, status: DisputeRecord['status'], resolution?: string): Promise<void> {
    await updateDoc(doc(db, 'disputes', disputeId), {
      status,
      resolution: resolution || null,
      resolvedAt: status === 'resolved' ? new Date().toISOString() : null
    });
  },

  // ================= NOTIFICATIONS =================
  async createNotification(notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notif,
        read: false,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (e) {
      console.warn("Could not create notification:", e);
      return '';
    }
  },

  async addNotification(notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): Promise<string> {
    return this.createNotification(notif);
  },

  async getUserNotifications(userId: string): Promise<AppNotification[]> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(30)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as object) } as AppNotification));
    } catch (e) {
      console.warn("Could not get notifications:", e);
      return [];
    }
  },

  async markNotificationRead(notifId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true });
    } catch (e) {
      console.warn("Could not mark notification read:", e);
    }
  },

  // ================= STUDIOS =================
  async getStudios(): Promise<Studio[]> {
    try {
      const q = query(collection(db, 'studios'), orderBy('name'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Studio));
    } catch (e) {
      console.warn("Could not get studios:", e);
      return [];
    }
  },

  async addStudio(studio: Omit<Studio, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'studios'), studio);
    return docRef.id;
  },

  async updateStudio(id: string, studio: Partial<Studio>): Promise<void> {
    await updateDoc(doc(db, 'studios', id), studio);
  },

  async deleteStudio(id: string): Promise<void> {
    await deleteDoc(doc(db, 'studios', id));
  },

  // ================= APP CONFIG =================
  async getAppConfig(): Promise<AppConfig> {
    try {
      const docSnap = await getDoc(doc(db, 'config', 'main'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          subscriptionPrice: data.subscriptionPrice ?? 499,
          commissionRate: data.commissionRate ?? 10,
          panIndiaMode: data.panIndiaMode ?? true,
          featureFlags: data.featureFlags ?? {}
        };
      }
    } catch (e) {
      console.warn("Using fallback app config:", e);
    }
    return { subscriptionPrice: 499, commissionRate: 10, panIndiaMode: true, featureFlags: {} };
  },

  async updateAppConfig(config: Partial<AppConfig>): Promise<void> {
    await setDoc(doc(db, 'config', 'main'), config, { merge: true });
  },

  // ================= ACTIVITY LOGS =================
  async logActivity(log: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      await addDoc(collection(db, 'activityLogs'), {
        ...log,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Could not write activity log:", err);
    }
  },

  async getActivityLogs(limitCount = 50): Promise<ActivityLog[]> {
    try {
      const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as ActivityLog));
    } catch (e) {
      console.warn("Failed to fetch activity logs:", e);
      return [];
    }
  },

  // ================= BILLBOARDS =================
  async submitBillboardEnquiry(enquiry: Omit<BillboardEnquiry, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'enquiries'), {
      ...enquiry,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async getBillboardEnquiries(): Promise<BillboardEnquiry[]> {
    try {
      const q = query(collection(db, 'enquiries'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as BillboardEnquiry));
    } catch (e) {
      console.warn("Could not fetch billboard enquiries:", e);
      return [];
    }
  },

  async updateEnquiryStatus(id: string, status: BillboardEnquiry['status']): Promise<void> {
    await updateDoc(doc(db, 'enquiries', id), { status });
  }
};
