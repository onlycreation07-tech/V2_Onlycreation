import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  resetPassword,
  verifyEmail,
  removeAuthUser
} from '../lib/firebase';
import { dbService } from '../services/dbService';
import { UserProfile, Organization, OrganizationRole } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  organization: Organization | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isPartner: boolean;
  partnerRole: string | null;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string, role?: string, isPartner?: boolean) => Promise<void>;
  resetUserPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  loginWithGoogleUser: () => Promise<void>;
  logoutUser: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  organization: null,
  loading: true,
  isAdmin: false,
  isSuperAdmin: false,
  isPartner: false,
  partnerRole: null,
  loginWithEmail: async () => {},
  signUpWithEmail: async () => {},
  resetUserPassword: async () => {},
  sendVerificationEmail: async () => {},
  loginWithGoogleUser: async () => {},
  logoutUser: async () => {},
  deleteAccount: async () => {},
  updateUserProfile: async () => {},
  switchOrganization: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isPartner, setIsPartner] = useState(false);
  const [partnerRole, setPartnerRole] = useState<string | null>(null);

  // Authoritatively sync user profile & organization from Firestore
  const syncUserSession = async (fbUser: User, overrideData?: Partial<UserProfile>) => {
    try {
      // Authoritative Admin Verification: check admins collection document
      try {
        const adminDoc = await getDoc(doc(db, 'admins', fbUser.uid));
        const adminExists = adminDoc.exists();
        setIsAdmin(adminExists);
        setIsSuperAdmin(adminExists && adminDoc.data()?.role === 'superadmin');
      } catch (err) {
        console.warn("Authoritative admin check error:", err);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }

      // Sync Firestore User Profile (users/{uid})
      const profile = await dbService.syncUserProfile(fbUser.uid, {
        email: fbUser.email || overrideData?.email || null,
        displayName: fbUser.displayName || overrideData?.displayName || 'Creator Lead',
        photoURL: fbUser.photoURL || overrideData?.photoURL || null,
        phone: fbUser.phoneNumber || overrideData?.phone || null,
        isPartner: overrideData?.isPartner ?? false,
        partnerRole: overrideData?.partnerRole,
        role: overrideData?.role || (overrideData?.isPartner ? 'CREATOR' : 'CLIENT'),
        ...overrideData
      });

      setUserProfile(profile);
      setIsPartner(!!profile.isPartner);
      setPartnerRole(profile.partnerRole || null);

      // Load user's organization
      const org = await dbService.ensureUserOrganization(profile);
      setOrganization(org);
    } catch (e) {
      console.warn("Failed syncing authoritative user profile:", e);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        await syncUserSession(fbUser);
      } else {
        setUser(null);
        setUserProfile(null);
        setOrganization(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsPartner(false);
        setPartnerRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const cred = await signInWithEmail(email, pass);
      if (cred.user) {
        setUser(cred.user);
        await syncUserSession(cred.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmailUser = async (
    email: string, 
    pass: string, 
    displayName: string, 
    role = 'CLIENT', 
    partner = false
  ) => {
    setLoading(true);
    try {
      const cred = await signUpWithEmail(email, pass);
      if (cred.user) {
        setUser(cred.user);
        await syncUserSession(cred.user, {
          displayName,
          email,
          role: role as OrganizationRole,
          isPartner: partner,
          partnerRole: partner ? role.toLowerCase() : undefined
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetUserPassword = async (email: string) => {
    await resetPassword(email);
  };

  const sendVerificationEmail = async () => {
    if (auth.currentUser) {
      await verifyEmail(auth.currentUser);
    }
  };

  const loginWithGoogleUser = async () => {
    setLoading(true);
    try {
      const cred = await signInWithGoogle();
      if (cred.user) {
        setUser(cred.user);
        await syncUserSession(cred.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setOrganization(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setIsPartner(false);
      setPartnerRole(null);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const uid = auth.currentUser.uid;
      await removeAuthUser(auth.currentUser);
      await dbService.deleteAccount(uid);
      setUser(null);
      setUserProfile(null);
      setOrganization(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setIsPartner(false);
      setPartnerRole(null);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    await dbService.updateUserProfile(user.uid, updates);
    setUserProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  const switchOrganization = async (orgId: string) => {
    const org = await dbService.getOrganization(orgId);
    if (org) {
      setOrganization(org);
      if (user) {
        await dbService.updateUserProfile(user.uid, { defaultOrganizationId: orgId });
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile,
      organization,
      loading, 
      isAdmin, 
      isSuperAdmin, 
      isPartner,
      partnerRole, 
      loginWithEmail,
      signUpWithEmail: signUpWithEmailUser,
      resetUserPassword,
      sendVerificationEmail,
      loginWithGoogleUser,
      logoutUser,
      deleteAccount,
      updateUserProfile,
      switchOrganization
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
