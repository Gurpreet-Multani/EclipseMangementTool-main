import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  UserRole,
  RolePermissions,
  CustomRole,
  RoleUiConfig,
  ButtonActionId,
  ButtonVisibilityState,
  AppTabId,
  PanelSectionId,
} from '../types';
import { INITIAL_USERS } from '../lib/seedData';
import { auth, db } from '../lib/firebase';
import { DEFAULT_ROLE_UI_CONFIGS, getDefaultUiConfigForRole } from '../lib/roleUiDefaults';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCredential,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  deleteDoc,
} from 'firebase/firestore';

interface AuthContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  users: UserProfile[];
  allUsers: UserProfile[];
  customRoles: CustomRole[];
  authLoading: boolean;
  loginAs: (userId: string) => Promise<void>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string; code?: string }>;
  loginWithGoogleEmail: (email: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogleUserInfo: (
    userInfo: { email: string; name?: string; picture?: string; sub?: string },
    accessToken?: string
  ) => Promise<boolean>;
  loginWithCredentials: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (data: Partial<UserProfile> & { email: string; password?: string }) => Promise<{ success: boolean; error?: string }>;
  createUserByAdmin: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    title?: string;
    managerId?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUserProfile: (targetUserId: string, updates: Partial<UserProfile>) => Promise<boolean>;
  updateRepPayRates: (targetRepId: string, payRates: Record<string, number>) => Promise<boolean>;
  updateRepRole: (targetRepId: string, newRole: UserRole, newTitle: string) => Promise<boolean>;
  // Account Approval Governance
  approveUser: (targetUserId: string, role?: UserRole, title?: string) => Promise<boolean>;
  rejectUser: (targetUserId: string, reason?: string) => Promise<boolean>;
  deleteUserPermanent: (targetUserId: string) => Promise<boolean>;
  preApproveEmail: (
    email: string,
    role?: UserRole,
    title?: string,
    firstName?: string,
    lastName?: string,
    additionalProfile?: Partial<UserProfile>
  ) => Promise<boolean>;
  refreshCurrentUserProfile: () => Promise<void>;
  pendingApprovalsCount: number;
  // Role Management Functions
  createRole: (role: CustomRole) => void;
  updateRole: (role: CustomRole) => void;
  deleteRole: (roleId: string) => void;
  getRole: (roleId: string) => CustomRole | undefined;
  assignRoleToUser: (userId: string, roleId: string) => void;
  // UI & Visibility Control per Role
  roleUiConfigs: Record<string, RoleUiConfig>;
  updateRoleUiConfig: (roleName: string, updates: Partial<RoleUiConfig>) => void;
  setButtonStateForRole: (roleName: string, buttonId: ButtonActionId, state: ButtonVisibilityState) => void;
  toggleTabForRole: (roleName: string, tabId: AppTabId, visible: boolean) => void;
  togglePanelForRole: (roleName: string, panelId: PanelSectionId, hidden: boolean) => void;
  resetRoleUiConfig: (roleName: string) => void;
  getButtonState: (buttonId: ButtonActionId) => ButtonVisibilityState;
  isButtonVisible: (buttonId: ButtonActionId) => boolean;
  isButtonDisabled: (buttonId: ButtonActionId) => boolean;
  isTabVisible: (tabId: AppTabId) => boolean;
  isPanelVisible: (panelId: PanelSectionId) => boolean;
  // Live Role Preview / Simulation
  simulatedRole: UserRole | null;
  setSimulatedRole: (role: UserRole | null) => void;
  effectiveRole: UserRole;
  isSimulating: boolean;
  actualIsAdmin: boolean;
  // RBAC Flags & Helpers
  isAdmin: boolean;
  isRegionalDirector: boolean;
  isBlitzManager: boolean;
  isTeamLead: boolean;
  isCorporateTrainer: boolean;
  isFieldSalesRep: boolean;
  isManager: boolean;
  isRepresentative: boolean;
  canChangeUserRolesAndTitles: boolean;
  canChangePayRates: boolean;
  canUploadCoursework: boolean;
  canManageTeam: boolean;
  canManageAllUsers: boolean;
  canLaunchStateBlitz: boolean;
  canCutTurf: boolean;
  canManageLogisticsAndBadging: boolean;
  canNegotiateMasterAgreements: boolean;
  canManageAgencyCashFlow: boolean;
  canCreateRoles: boolean;
  canEditPermissions: boolean;
  permissions: RolePermissions;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'eclipse_current_user_id';
const LOCAL_STORAGE_USERS_KEY = 'eclipse_users_cache';
const LOCAL_STORAGE_ROLES_KEY = 'eclipse_custom_roles';
const LOCAL_STORAGE_CREDENTIALS_KEY = 'eclipse_user_credentials';
const LOCAL_STORAGE_UI_CONFIGS_KEY = 'eclipse_role_ui_configs';
const LOCAL_STORAGE_DELETED_KEY = 'eclipse_deleted_user_ids';

function getDeletedUserIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DELETED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markUserIdDeleted(id: string) {
  try {
    const set = getDeletedUserIds();
    set.add(id);
    localStorage.setItem(LOCAL_STORAGE_DELETED_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // Ignore
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const deleted = getDeletedUserIds();
      const cached = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      if (cached) {
        const parsed: UserProfile[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((u) => !deleted.has(u.id) && !deleted.has((u.email || '').toLowerCase()));
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached users', e);
    }
    const deleted = getDeletedUserIds();
    return INITIAL_USERS.filter((u) => !deleted.has(u.id) && !deleted.has((u.email || '').toLowerCase()));
  });

  const [customRoles, setCustomRoles] = useState<CustomRole[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_ROLES_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn('Failed to parse cached roles', e);
    }
    return [];
  });

  const [roleUiConfigs, setRoleUiConfigs] = useState<Record<string, RoleUiConfig>>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_UI_CONFIGS_KEY);
      if (cached) {
        return { ...DEFAULT_ROLE_UI_CONFIGS, ...JSON.parse(cached) };
      }
    } catch (e) {
      console.warn('Failed to parse cached UI configs', e);
    }
    return DEFAULT_ROLE_UI_CONFIGS;
  });

  const [simulatedRole, setSimulatedRole] = useState<UserRole | null>(null);

  const [credentialMap, setCredentialMap] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    INITIAL_USERS.forEach((u) => {
      if (u.email) defaults[u.email.toLowerCase()] = 'eclipse123';
    });
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_CREDENTIALS_KEY);
      if (cached) return { ...defaults, ...JSON.parse(cached) };
    } catch (e) {
      console.warn('Failed to parse cached credentials', e);
    }
    return defaults;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const savedId = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (savedId) {
        const cachedUsersRaw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
        const sourceUsers: UserProfile[] = cachedUsersRaw ? JSON.parse(cachedUsersRaw) : INITIAL_USERS;
        const found = sourceUsers.find((u) => u.id === savedId);
        if (found) {
          const emailLower = (found.email || '').toLowerCase();
          if (emailLower.includes('gurpreet') || emailLower.includes('multani') || emailLower === 'gurpreet@eclipsemarketingagency.org') {
            found.role = 'Admin';
            found.approvalStatus = 'approved';
            found.title = 'Chief Executive & Founder';
          }
          return found;
        }
      }
    } catch (e) {
      console.warn('Failed to read saved user', e);
    }
    return null;
  });

  // Helper to map and sync Firebase User to Eclipse UserProfile in Firestore
  const syncFirebaseUser = async (fbUser: FirebaseUser): Promise<UserProfile> => {
    const uid = fbUser.uid;
    const email = (fbUser.email || '').toLowerCase().trim();
    const displayName = fbUser.displayName || email.split('@')[0] || 'Eclipse Specialist';
    const photoUrl = fbUser.photoURL || undefined;

    const parts = displayName.split(' ');
    const firstName = parts[0] || 'Eclipse';
    const lastName = parts.slice(1).join(' ') || 'Member';

    // 1. Check if document exists in Firestore under this UID
    const userRef = doc(db, 'users', uid);
    let existingProfile: UserProfile | null = null;

    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        existingProfile = snap.data() as UserProfile;
      }
    } catch (err) {
      console.warn('Could not read user doc from Firestore:', err);
    }

    // 2. If not found in Firestore by UID, look for a matching seed/cached user by email
    if (!existingProfile) {
      const matched = users.find(
        (u) =>
          (u.email || '').toLowerCase() === email ||
          (email.includes('gurpreet') && (u.email || '').toLowerCase().includes('gurpreet'))
      ) || INITIAL_USERS.find(
        (u) =>
          (u.email || '').toLowerCase() === email ||
          (email.includes('gurpreet') && (u.email || '').toLowerCase().includes('gurpreet'))
      );

      const isGurpreet =
        email === 'gurpreet@eclipsemarketingagency.org' ||
        email.includes('gurpreetmultani') ||
        email.includes('gurpreet') ||
        email.includes('multani');

      const isApproved = isGurpreet || matched?.approvalStatus === 'approved';
      const initialApprovalStatus: 'approved' | 'pending' = isApproved ? 'approved' : 'pending';

      const defaultRole: UserRole = isGurpreet ? 'Admin' : (matched?.role || 'Representative');
      const defaultTitle = isGurpreet ? 'Chief Executive & Founder' : (matched?.title || (isApproved ? 'Fiber Field Specialist' : 'Pending Authorization'));

      const baseProfile = matched || {
        dateOfBirth: '1998-01-01',
        shirtSize: 'L' as const,
        phone: '(555) 000-0000',
        emergencyContact: {
          name: 'Primary Contact',
          phone: '(555) 000-0000',
          relationship: 'Family',
        },
        directDeposit: {
          bankName: 'Direct Deposit Pending',
          accountNumber: '••••••••0000',
          routingNumber: '000000000',
          accountType: 'checking' as const,
          taxIdType: 'SSN' as const,
          taxIdNumber: 'XXX-XX-0000',
        },
        fiberAgreement: {
          status: 'signed' as const,
          version: 'v2026.2-master',
          signedDate: new Date().toISOString().slice(0, 10),
        },
        travelProfile: {
          homeAirport: 'DFW - Dallas/Fort Worth',
          ableToTravel: true,
          smsTravelUpdatesConsent: true,
        },
        payRates: {
          'AT&T Fiber': 260,
          'Frontier Fiber': 280,
          'Quantum Fiber': 250,
          'Brightspeed': 230,
          'Spectrum Gig': 220,
          'Kinetic Fiber': 240,
        },
        stats: {
          installs: isGurpreet ? 142 : 0,
          cancels: isGurpreet ? 8 : 0,
          scheduled: isGurpreet ? 18 : 0,
          chargebacks: isGurpreet ? 1 : 0,
          totalSales: isGurpreet ? 169 : 0,
          installRate: isGurpreet ? 94.6 : 100,
          cancelRate: isGurpreet ? 4.7 : 0,
          totalCommission: isGurpreet ? 48960 : 0,
        },
      };

      existingProfile = {
        ...baseProfile,
        id: uid,
        email: email || matched?.email || 'user@eclipsemarketingagency.org',
        firstName: matched?.firstName || firstName,
        lastName: matched?.lastName || lastName,
        displayName: matched?.displayName || displayName,
        role: defaultRole,
        title: defaultTitle,
        approvalStatus: initialApprovalStatus,
        approvedBy: isApproved ? (matched?.approvedBy || 'Pre-Approved') : undefined,
        approvedAt: isApproved ? (matched?.approvedAt || new Date().toISOString()) : undefined,
        requestedAt: isApproved ? undefined : new Date().toISOString(),
        idPhotoUrl: photoUrl || matched?.idPhotoUrl,
        badgePhotoUrl: photoUrl || matched?.badgePhotoUrl,
        createdAt: matched?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await setDoc(userRef, existingProfile, { merge: true });
      } catch (err) {
        console.warn('Could not persist new Google user to Firestore:', err);
      }
    } else {
      // If profile already exists, update photo if newly provided
      if (photoUrl && (!existingProfile.idPhotoUrl || !existingProfile.badgePhotoUrl)) {
        existingProfile = {
          ...existingProfile,
          idPhotoUrl: existingProfile.idPhotoUrl || photoUrl,
          badgePhotoUrl: existingProfile.badgePhotoUrl || photoUrl,
        };
      }
    }

    // Always enforce Founder & Admin privileges for Gurpreet Multani
    const finalEmailLower = (existingProfile.email || email).toLowerCase();
    const isFounderGurpreet =
      finalEmailLower.includes('gurpreet') ||
      finalEmailLower.includes('multani') ||
      finalEmailLower === 'gurpreet@eclipsemarketingagency.org';

    if (isFounderGurpreet) {
      existingProfile = {
        ...existingProfile,
        role: 'Admin',
        title: 'Chief Executive & Founder',
        approvalStatus: 'approved',
        approvedBy: 'Self (Founder)',
        approvedAt: existingProfile.approvedAt || new Date().toISOString(),
      };
      try {
        await setDoc(userRef, existingProfile, { merge: true });
      } catch (err) {
        console.warn('Could not persist admin profile to Firestore:', err);
      }
    }

    setCurrentUser(existingProfile);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, existingProfile.id);

    // Update users directory with strict ID deduplication
    setUsers((prev) => {
      const map = new Map<string, UserProfile>();
      prev.forEach((u) => {
        if (u && u.id && u.id !== uid && u.id !== existingProfile!.id && (u.email || '').toLowerCase() !== email) {
          map.set(u.id, u);
        }
      });
      map.set(existingProfile!.id, existingProfile!);
      return Array.from(map.values());
    });

    return existingProfile;
  };

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          await syncFirebaseUser(fbUser);
        } catch (err) {
          console.error('Error handling Firebase Auth state change:', err);
        }
      } else {
        // If not authenticated with Firebase, check if we had a local persona
        const savedId = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
        if (!savedId) {
          setCurrentUser(null);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Cloud Database sync for all users
  useEffect(() => {
    // Sync users from backend persistent store
    fetch('/api/users')
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.users)) {
          const deleted = getDeletedUserIds();
          if (Array.isArray(data.deletedIds)) {
            data.deletedIds.forEach((id: string) => deleted.add(id));
          }
          setUsers((prev) => {
            const map = new Map<string, UserProfile>();
            prev.forEach((u) => {
              if (u && u.id && !deleted.has(u.id) && !deleted.has((u.email || '').toLowerCase())) {
                map.set(u.id, u);
              }
            });
            data.users.forEach((u: UserProfile) => {
              if (u && u.id && !deleted.has(u.id) && !deleted.has((u.email || '').toLowerCase())) {
                map.set(u.id, u);
              }
            });
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});

    // Real-time Firestore listener for all users in cloud database
    const unsub = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const deleted = getDeletedUserIds();
        const remoteUsers: UserProfile[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as UserProfile;
          const uid = data.id || docSnap.id;
          if (!deleted.has(uid) && !deleted.has((data.email || '').toLowerCase())) {
            remoteUsers.push({
              ...data,
              id: uid,
            });
          }
        });

        if (remoteUsers.length > 0) {
          setUsers(remoteUsers);
        }
      },
      (err) => {
        console.warn('Firestore users subscription notice:', err);
      }
    );

    return () => unsub();
  }, []);

  // Real-time sync for current user profile updates
  useEffect(() => {
    if (!currentUser?.id) return;
    const unsub = onSnapshot(
      doc(db, 'users', currentUser.id),
      (docSnap) => {
        if (docSnap.exists()) {
          const freshData = docSnap.data() as UserProfile;
          setCurrentUser(freshData);
        }
      },
      (err) => {
        console.warn('Current user sync notice:', err);
      }
    );

    return () => unsub();
  }, [currentUser?.id]);

  // Save users cache to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
      if (currentUser) {
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, currentUser.id);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      }
    } catch (e) {
      console.error(e);
    }
  }, [users, currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CREDENTIALS_KEY, JSON.stringify(credentialMap));
    } catch (e) {
      console.error(e);
    }
  }, [credentialMap]);

  // Sign in with Google (Popup SSO)
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string; code?: string }> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await syncFirebaseUser(result.user);
        return { success: true };
      }
      return { success: false, error: 'No user profile returned from Google.' };
    } catch (err: any) {
      console.warn('Google Sign-in popup notice:', err?.message || err);
      const code = err?.code || '';
      let message = err?.message || 'Failed to sign in with Google.';
      if (code === 'auth/unauthorized-domain') {
        message = 'auth/unauthorized-domain';
      } else if (code === 'auth/popup-closed-by-user') {
        message = 'Sign-in window was closed before completing. Please try again.';
      } else if (code === 'auth/popup-blocked') {
        message = 'Popup was blocked by your browser. Please allow popups for this site.';
      } else if (code === 'auth/cancelled-popup-request') {
        message = 'Sign-in request was cancelled.';
      }
      return { success: false, error: message, code };
    }
  };

  // Sign in or associate directly with a Google account email
  const loginWithGoogleEmail = async (rawEmail: string, customName?: string): Promise<{ success: boolean; error?: string }> => {
    const email = rawEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid Google account email address.' };
    }

    const isGurpreet =
      email === 'gurpreet@eclipsemarketingagency.org' ||
      email.includes('gurpreetmultani') ||
      email.includes('gurpreet') ||
      email.includes('multani');

    const matched = users.find(
      (u) =>
        (u.email || '').toLowerCase() === email ||
        (isGurpreet && (u.email || '').toLowerCase().includes('gurpreet'))
    ) || INITIAL_USERS.find(
      (u) =>
        (u.email || '').toLowerCase() === email ||
        (isGurpreet && (u.email || '').toLowerCase().includes('gurpreet'))
    );

    const defaultRole: UserRole = isGurpreet ? 'Admin' : 'Representative';
    const defaultTitle = isGurpreet ? 'Chief Executive & Founder' : 'Fiber Field Specialist';

    const parts = (customName || email.split('@')[0]).split(' ');
    const firstName = parts[0] || (isGurpreet ? 'Gurpreet' : 'Specialist');
    const lastName = parts.slice(1).join(' ') || (isGurpreet ? 'Multani' : 'User');
    const displayName = customName || (isGurpreet ? 'Gurpreet Multani' : `${firstName} ${lastName}`);

    const baseProfile = matched || {
      dateOfBirth: '1998-01-01',
      shirtSize: 'L' as const,
      phone: '(555) 000-0000',
      emergencyContact: {
        name: 'Primary Contact',
        phone: '(555) 000-0000',
        relationship: 'Family',
      },
      directDeposit: {
        bankName: 'Direct Deposit Pending',
        accountNumber: '••••••••0000',
        routingNumber: '000000000',
        accountType: 'checking' as const,
        taxIdType: 'SSN' as const,
        taxIdNumber: 'XXX-XX-0000',
      },
      fiberAgreement: {
        status: 'signed' as const,
        version: 'v2026.2-master',
        signedDate: new Date().toISOString().slice(0, 10),
      },
      travelProfile: {
        homeAirport: 'DFW - Dallas/Fort Worth',
        ableToTravel: true,
        smsTravelUpdatesConsent: true,
      },
      payRates: {
        'AT&T Fiber': 260,
        'Frontier Fiber': 280,
        'Quantum Fiber': 250,
        'Brightspeed': 230,
        'Spectrum Gig': 220,
        'Kinetic Fiber': 240,
      },
      stats: {
        installs: isGurpreet ? 142 : 0,
        cancels: isGurpreet ? 8 : 0,
        scheduled: isGurpreet ? 18 : 0,
        chargebacks: isGurpreet ? 1 : 0,
        totalSales: isGurpreet ? 169 : 0,
        installRate: isGurpreet ? 94.6 : 100,
        cancelRate: isGurpreet ? 4.7 : 0,
        totalCommission: isGurpreet ? 48960 : 0,
      },
    };

    const isApproved = isGurpreet || matched?.approvalStatus === 'approved';
    const initialApprovalStatus: 'approved' | 'pending' = isApproved ? 'approved' : 'pending';

    const profile: UserProfile = {
      ...baseProfile,
      id: matched?.id || `user_g_${Date.now()}`,
      email: email,
      firstName: isGurpreet ? 'Gurpreet' : (matched?.firstName || firstName),
      lastName: isGurpreet ? 'Multani' : (matched?.lastName || lastName),
      displayName: isGurpreet ? 'Gurpreet Multani' : (matched?.displayName || displayName),
      role: isGurpreet ? 'Admin' : (matched?.role || defaultRole),
      title: isGurpreet ? 'Chief Executive & Founder' : (matched?.title || (isApproved ? defaultTitle : 'Pending Authorization')),
      approvalStatus: isGurpreet ? 'approved' : initialApprovalStatus,
      approvedBy: isApproved ? (matched?.approvedBy || (isGurpreet ? 'Self (Founder)' : 'Pre-Approved')) : undefined,
      approvedAt: isApproved ? (matched?.approvedAt || new Date().toISOString()) : undefined,
      requestedAt: isApproved ? undefined : new Date().toISOString(),
      createdAt: matched?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentUser(profile);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, profile.id);

    // Ensure Firebase Auth session is active for Firestore security rules
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
      } catch (authErr) {
        console.warn('Firebase anonymous auth fallback notice:', authErr);
      }
    }

    setUsers((prev) => {
      const map = new Map<string, UserProfile>();
      prev.forEach((u) => {
        if (u && u.id && u.id !== profile.id && (u.email || '').toLowerCase() !== email) {
          map.set(u.id, u);
        }
      });
      map.set(profile.id, profile);
      return Array.from(map.values());
    });

    try {
      await setDoc(doc(db, 'users', profile.id), profile, { merge: true });
    } catch (e) {
      console.warn('Firestore offline fallback', e);
    }

    return { success: true };
  };

  const loginWithGoogleUserInfo = async (
    userInfo: { email: string; name?: string; picture?: string; sub?: string },
    accessToken?: string
  ): Promise<boolean> => {
    const rawEmail = userInfo.email.trim().toLowerCase();
    if (!rawEmail) return false;

    if (accessToken) {
      try {
        const credential = GoogleAuthProvider.credential(null, accessToken);
        await signInWithCredential(auth, credential);
      } catch (err) {
        console.warn('Firebase signInWithCredential notice:', err);
      }
    }

    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.warn('Firebase anonymous auth notice:', err);
      }
    }

    const isGurpreet =
      rawEmail.includes('gurpreet') ||
      rawEmail.includes('multani') ||
      rawEmail === 'gurpreet@eclipsemarketingagency.org';

    const uid = auth.currentUser?.uid || (userInfo.sub ? `g_${userInfo.sub}` : `u_${Date.now()}`);
    const userRef = doc(db, 'users', uid);

    let existingProfile: UserProfile | null = null;
    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        existingProfile = snap.data() as UserProfile;
      }
    } catch (e) {
      console.warn('Firestore read notice:', e);
    }

    const matched = users.find((u) => (u.email || '').toLowerCase() === rawEmail || (isGurpreet && (u.email || '').toLowerCase().includes('gurpreet')));

    const displayName = userInfo.name || (isGurpreet ? 'Gurpreet Multani' : rawEmail.split('@')[0]);
    const photoUrl = userInfo.picture;

    const baseProfile: UserProfile = existingProfile || matched || {
      id: uid,
      email: rawEmail,
      firstName: isGurpreet ? 'Gurpreet' : (displayName.split(' ')[0] || 'Eclipse'),
      lastName: isGurpreet ? 'Multani' : (displayName.split(' ').slice(1).join(' ') || 'Specialist'),
      displayName,
      role: isGurpreet ? 'Admin' : 'Representative',
      title: isGurpreet ? 'Chief Executive & Founder' : 'Fiber Field Specialist',
      approvalStatus: isGurpreet ? 'approved' : 'pending',
      approvedBy: isGurpreet ? 'Self (Founder)' : undefined,
      approvedAt: isGurpreet ? new Date().toISOString() : undefined,
      dateOfBirth: '1998-01-01',
      shirtSize: 'L',
      phone: '(555) 000-0000',
      badgePhotoUrl: photoUrl,
      idPhotoUrl: photoUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emergencyContact: {
        name: 'Primary Contact',
        phone: '(555) 000-0000',
        relationship: 'Family',
      },
      directDeposit: {
        bankName: 'Direct Deposit Pending',
        accountNumber: '••••••••0000',
        routingNumber: '000000000',
        accountType: 'checking',
        taxIdType: 'SSN',
        taxIdNumber: 'XXX-XX-0000',
      },
      fiberAgreement: {
        status: 'signed',
        version: 'v2026.2-master',
        signedDate: new Date().toISOString().slice(0, 10),
      },
      travelProfile: {
        homeAirport: 'DFW - Dallas/Fort Worth',
        ableToTravel: true,
        smsTravelUpdatesConsent: true,
      },
      payRates: {
        'AT&T Fiber': 260,
        'Frontier Fiber': 280,
        'Quantum Fiber': 250,
        'Brightspeed': 230,
        'Spectrum Gig': 220,
        'Kinetic Fiber': 240,
      },
      stats: {
        installs: isGurpreet ? 142 : 0,
        cancels: isGurpreet ? 8 : 0,
        scheduled: isGurpreet ? 18 : 0,
        chargebacks: isGurpreet ? 1 : 0,
        totalSales: isGurpreet ? 169 : 0,
        installRate: isGurpreet ? 94.6 : 100,
        cancelRate: isGurpreet ? 4.7 : 0,
        totalCommission: isGurpreet ? 48960 : 0,
      },
    };

    if (isGurpreet) {
      baseProfile.role = 'Admin';
      baseProfile.title = 'Chief Executive & Founder';
      baseProfile.approvalStatus = 'approved';
      baseProfile.displayName = 'Gurpreet Multani';
      baseProfile.firstName = 'Gurpreet';
      baseProfile.lastName = 'Multani';
    }

    if (photoUrl) {
      baseProfile.badgePhotoUrl = photoUrl;
      baseProfile.idPhotoUrl = photoUrl;
    }

    setCurrentUser(baseProfile);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, baseProfile.id);

    setUsers((prev) => {
      const map = new Map<string, UserProfile>();
      prev.forEach((u) => {
        if (u && u.id && u.id !== baseProfile.id && (u.email || '').toLowerCase() !== rawEmail) {
          map.set(u.id, u);
        }
      });
      map.set(baseProfile.id, baseProfile);
      return Array.from(map.values());
    });

    try {
      await setDoc(userRef, baseProfile, { merge: true });
    } catch (e) {
      console.warn('Firestore write notice:', e);
    }

    return true;
  };

  const loginAs = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, user.id);
    }
  };

  const loginWithCredentials = async (email: string, pass: string) => {
    const normalized = email.trim().toLowerCase();
    const user = users.find((u) => (u.email || '').toLowerCase() === normalized);
    if (!user) {
      return { success: false, error: 'No user found with that email. Please sign in with Google or ask an admin.' };
    }

    const savedPassword = credentialMap[normalized] || 'eclipse123';
    if (pass !== savedPassword) {
      return { success: false, error: 'Invalid password.' };
    }

    setCurrentUser(user);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, user.id);
    return { success: true };
  };

  const registerUser = async () => {
    return {
      success: false,
      error: 'Self-registration is disabled. Please use "Sign in with Google" or ask an admin.',
    };
  };

  const createUserByAdmin = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    title?: string;
    managerId?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const isFounderGurpreet =
      (currentUser?.email || '').toLowerCase().includes('gurpreet') ||
      (currentUser?.email || '').toLowerCase().includes('multani') ||
      currentUser?.id === 'user_owner_gurpreet';

    if (!isAdmin && !isFounderGurpreet && !effectiveRoleLower.includes('regional director')) {
      return { success: false, error: 'Only authorized directors and admins can create users.' };
    }

    const normalized = data.email.trim().toLowerCase();
    if (!normalized || !data.password.trim()) {
      return { success: false, error: 'Email and password are required.' };
    }

    const duplicate = users.some((u) => (u.email || '').toLowerCase() === normalized);
    if (duplicate) {
      return { success: false, error: 'A user with that email already exists.' };
    }

    const nowIso = new Date().toISOString();
    const assignedManager = users.find((u) => u.id === data.managerId);

    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      email: normalized,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      displayName: `${data.firstName} ${data.lastName}`.trim(),
      role: data.role,
      title: data.title?.trim() || 'Fiber Field Specialist',
      approvalStatus: 'approved',
      approvedBy: currentUser?.displayName || 'Gurpreet Multani (Founder)',
      approvedAt: nowIso,
      managerId: data.managerId || '',
      managerName: assignedManager?.displayName || 'Direct to Founder',
      dateOfBirth: '1999-01-01',
      shirtSize: 'L',
      phone: '(555) 000-0000',
      emergencyContact: {
        name: 'Primary Contact',
        phone: '(555) 000-0000',
        relationship: 'Family',
      },
      directDeposit: {
        bankName: 'Direct Deposit Pending',
        accountNumber: '••••••••0000',
        routingNumber: '000000000',
        accountType: 'checking',
        taxIdType: 'SSN',
        taxIdNumber: 'XXX-XX-0000',
      },
      fiberAgreement: {
        status: 'coming_soon',
        version: 'v2026.2',
      },
      travelProfile: {
        homeAirport: 'DFW - Dallas/Fort Worth',
        ableToTravel: true,
        smsTravelUpdatesConsent: true,
      },
      payRates: {
        'AT&T Fiber': 250,
        'Frontier Fiber': 270,
        'Quantum Fiber': 240,
        'Brightspeed': 220,
        'Spectrum Gig': 210,
        'Kinetic Fiber': 230,
      },
      stats: {
        installs: 0,
        cancels: 0,
        scheduled: 0,
        chargebacks: 0,
        totalSales: 0,
        installRate: 100,
        cancelRate: 0,
        totalCommission: 0,
      },
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setUsers((prev) => {
      const map = new Map<string, UserProfile>();
      map.set(newUser.id, newUser);
      prev.forEach((u) => {
        if (u && u.id && u.id !== newUser.id && (u.email || '').toLowerCase() !== normalized) {
          map.set(u.id, u);
        }
      });
      return Array.from(map.values());
    });
    setCredentialMap((prev) => ({ ...prev, [normalized]: data.password }));

    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      const existing: UserProfile[] = cached ? JSON.parse(cached) : [];
      const cMap = new Map<string, UserProfile>();
      cMap.set(newUser.id, newUser);
      existing.forEach((u) => {
        if (u && u.id && u.id !== newUser.id && (u.email || '').toLowerCase() !== normalized) {
          cMap.set(u.id, u);
        }
      });
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(Array.from(cMap.values())));
    } catch {
      // Local storage cache notice
    }

    try {
      await setDoc(doc(db, 'users', newUser.id), newUser);
    } catch (e) {
      console.warn('Firestore create user offline fallback', e);
    }

    try {
      await fetch('/api/users/persist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: newUser }),
      });
    } catch (e) {
      console.warn('Persist call notice:', e);
    }

    return { success: true };
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Error signing out of Firebase Auth:', err);
    }
    setCurrentUser(null);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  };

  // Founder Identity
  const isFounderGurpreet =
    (currentUser?.email || '').toLowerCase().includes('gurpreet') ||
    (currentUser?.email || '').toLowerCase().includes('multani') ||
    currentUser?.id === 'user_owner_gurpreet';

  // Actual Admin Identity
  const actualRole = (currentUser?.role || (isFounderGurpreet ? 'Admin' : 'Field Sales Representative')).trim();
  const actualRoleLower = actualRole.toLowerCase();
  const actualIsAdmin =
    actualRoleLower === 'admin' ||
    actualRoleLower === 'owner' ||
    actualRoleLower.includes('founder') ||
    isFounderGurpreet;

  // Effective Role (supports live role preview / simulator by Admin)
  const isSimulating = actualIsAdmin && simulatedRole !== null;
  const effectiveRole = isSimulating ? simulatedRole! : (isFounderGurpreet && actualRoleLower !== 'admin' ? 'Admin' : actualRole);
  const effectiveRoleLower = effectiveRole.toLowerCase();

  // Find if effectiveRole is a custom role
  const matchingCustomRole = customRoles.find((r) => r.name.toLowerCase() === effectiveRoleLower);

  // Primary Hierarchy Levels based on effective role
  const isAdmin = effectiveRoleLower === 'admin' || effectiveRoleLower === 'owner' || isFounderGurpreet;
  const isRegionalDirector = isAdmin || effectiveRoleLower.includes('regional director');
  const isBlitzManager = isRegionalDirector || effectiveRoleLower.includes('blitz manager') || effectiveRoleLower === 'manager';
  const isTeamLead = isBlitzManager || effectiveRoleLower.includes('team lead');
  const isCorporateTrainer = isTeamLead || effectiveRoleLower.includes('corporate trainer') || effectiveRoleLower.includes('junior lead');
  const isFieldSalesRep = !isCorporateTrainer;

  // Legacy mappings for backwards compatibility
  const isManager = isBlitzManager;
  const isRepresentative = isFieldSalesRep || (!isAdmin && !isBlitzManager);

  // Authority & Governance Permissions (supports custom role overrides if present)
  const canManageAllUsers = matchingCustomRole ? matchingCustomRole.permissions.canManageAllUsers : (isAdmin || isRegionalDirector);
  const canManageTeam = matchingCustomRole ? matchingCustomRole.permissions.canManageTeam : isTeamLead;
  const canChangeUserRolesAndTitles = matchingCustomRole ? matchingCustomRole.permissions.canChangeUserRolesAndTitles : (isAdmin || isRegionalDirector || isBlitzManager);
  const canChangePayRates = matchingCustomRole ? matchingCustomRole.permissions.canChangePayRates : (isAdmin || isRegionalDirector);
  const canUploadCoursework = matchingCustomRole ? matchingCustomRole.permissions.canUploadCoursework : (isAdmin || isRegionalDirector || isBlitzManager || isCorporateTrainer);
  const canLaunchStateBlitz = matchingCustomRole ? matchingCustomRole.permissions.canLaunchStateBlitz : (isAdmin || isRegionalDirector || isBlitzManager);
  const canCutTurf = matchingCustomRole ? (matchingCustomRole.permissions.canCutTurf ?? false) : (isAdmin || isRegionalDirector || isBlitzManager);
  const canManageLogisticsAndBadging = matchingCustomRole ? (matchingCustomRole.permissions.canManageLogisticsAndBadging ?? false) : (isAdmin || isRegionalDirector || isBlitzManager);
  const canNegotiateMasterAgreements = matchingCustomRole ? (matchingCustomRole.permissions.canNegotiateMasterAgreements ?? false) : (isAdmin || isRegionalDirector);
  const canManageAgencyCashFlow = matchingCustomRole ? (matchingCustomRole.permissions.canManageAgencyCashFlow ?? false) : (isAdmin || isRegionalDirector);
  const canCreateRoles = matchingCustomRole ? (matchingCustomRole.permissions.canCreateRoles ?? false) : isAdmin;
  const canEditPermissions = matchingCustomRole ? (matchingCustomRole.permissions.canEditPermissions ?? false) : isAdmin;

  const permissions: RolePermissions = {
    canManageAllUsers,
    canManageTeam,
    canChangeUserRolesAndTitles,
    canChangePayRates,
    canUploadCoursework,
    canLaunchStateBlitz,
    canViewAllSales: matchingCustomRole ? matchingCustomRole.permissions.canViewAllSales : isBlitzManager,
    canViewTeamSales: matchingCustomRole ? matchingCustomRole.permissions.canViewTeamSales : isTeamLead,
    canSubmitSales: matchingCustomRole ? matchingCustomRole.permissions.canSubmitSales : true,
    canAccessTraining: matchingCustomRole ? matchingCustomRole.permissions.canAccessTraining : true,
    canAccessProfile: matchingCustomRole ? matchingCustomRole.permissions.canAccessProfile : true,
    canCutTurf,
    canManageLogisticsAndBadging,
    canNegotiateMasterAgreements,
    canManageAgencyCashFlow,
    canCreateRoles,
    canEditPermissions,
  };

  // UI Control & Visibility System Functions
  const getEffectiveUiConfig = (roleName: string): RoleUiConfig => {
    const config = roleUiConfigs[roleName];
    if (config) return config;
    return getDefaultUiConfigForRole(roleName);
  };

  const getButtonState = (buttonId: ButtonActionId): ButtonVisibilityState => {
    const config = getEffectiveUiConfig(effectiveRole);
    return config.buttonStates?.[buttonId] ?? getDefaultUiConfigForRole(effectiveRole).buttonStates?.[buttonId] ?? 'enabled';
  };

  const isButtonVisible = (buttonId: ButtonActionId): boolean => {
    return getButtonState(buttonId) !== 'hidden';
  };

  const isButtonDisabled = (buttonId: ButtonActionId): boolean => {
    return getButtonState(buttonId) === 'disabled';
  };

  const isTabVisible = (tabId: AppTabId): boolean => {
    const config = getEffectiveUiConfig(effectiveRole);
    const visibleTabs = config.visibleTabs || getDefaultUiConfigForRole(effectiveRole).visibleTabs;
    return visibleTabs.includes(tabId);
  };

  const isPanelVisible = (panelId: PanelSectionId): boolean => {
    const config = getEffectiveUiConfig(effectiveRole);
    const hiddenPanels = config.hiddenPanels || getDefaultUiConfigForRole(effectiveRole).hiddenPanels;
    return !hiddenPanels.includes(panelId);
  };

  const updateRoleUiConfig = (roleName: string, updates: Partial<RoleUiConfig>) => {
    if (!actualIsAdmin) {
      alert('Only administrators and owners can modify role UI configurations.');
      return;
    }
    setRoleUiConfigs((prev) => {
      const existing = prev[roleName] || getDefaultUiConfigForRole(roleName);
      const merged: RoleUiConfig = {
        ...existing,
        ...updates,
        buttonStates: {
          ...existing.buttonStates,
          ...(updates.buttonStates || {}),
        },
      };
      const next = { ...prev, [roleName]: merged };
      try {
        localStorage.setItem(LOCAL_STORAGE_UI_CONFIGS_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save UI configs to local storage:', e);
      }
      return next;
    });
  };

  const setButtonStateForRole = (roleName: string, buttonId: ButtonActionId, state: ButtonVisibilityState) => {
    if (!actualIsAdmin) {
      alert('Only administrators and owners can modify button permissions.');
      return;
    }
    setRoleUiConfigs((prev) => {
      const current = prev[roleName] || getDefaultUiConfigForRole(roleName);
      const updated: RoleUiConfig = {
        ...current,
        buttonStates: {
          ...current.buttonStates,
          [buttonId]: state,
        },
      };
      const next = { ...prev, [roleName]: updated };
      try {
        localStorage.setItem(LOCAL_STORAGE_UI_CONFIGS_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save UI configs', e);
      }
      return next;
    });
  };

  const toggleTabForRole = (roleName: string, tabId: AppTabId, visible: boolean) => {
    if (!actualIsAdmin) {
      alert('Only administrators can modify tab visibility.');
      return;
    }
    setRoleUiConfigs((prev) => {
      const current = prev[roleName] || getDefaultUiConfigForRole(roleName);
      const curTabs = current.visibleTabs || ['work', 'blitz', 'training', 'profile'];
      let nextTabs = visible ? [...curTabs, tabId] : curTabs.filter((t) => t !== tabId);
      nextTabs = Array.from(new Set(nextTabs));
      const updated: RoleUiConfig = {
        ...current,
        visibleTabs: nextTabs,
      };
      const next = { ...prev, [roleName]: updated };
      try {
        localStorage.setItem(LOCAL_STORAGE_UI_CONFIGS_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save tab configs', e);
      }
      return next;
    });
  };

  const togglePanelForRole = (roleName: string, panelId: PanelSectionId, hidden: boolean) => {
    if (!actualIsAdmin) {
      alert('Only administrators can modify panel visibility.');
      return;
    }
    setRoleUiConfigs((prev) => {
      const current = prev[roleName] || getDefaultUiConfigForRole(roleName);
      const curHidden = current.hiddenPanels || [];
      let nextHidden = hidden ? [...curHidden, panelId] : curHidden.filter((p) => p !== panelId);
      nextHidden = Array.from(new Set(nextHidden));
      const updated: RoleUiConfig = {
        ...current,
        hiddenPanels: nextHidden,
      };
      const next = { ...prev, [roleName]: updated };
      try {
        localStorage.setItem(LOCAL_STORAGE_UI_CONFIGS_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save panel configs', e);
      }
      return next;
    });
  };

  const resetRoleUiConfig = (roleName: string) => {
    if (!actualIsAdmin) return;
    const def = getDefaultUiConfigForRole(roleName);
    setRoleUiConfigs((prev) => {
      const next = { ...prev, [roleName]: def };
      try {
        localStorage.setItem(LOCAL_STORAGE_UI_CONFIGS_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to reset UI config', e);
      }
      return next;
    });
  };

  // Update profile attributes with RBAC guards
  const updateUserProfile = async (targetUserId: string, updates: Partial<UserProfile>): Promise<boolean> => {
    try {
      if ((updates.role || updates.title) && !canChangeUserRolesAndTitles) {
        delete updates.role;
        delete updates.title;
        console.warn('RBAC Security: Representative attempted to modify role or title.');
      }

      if (updates.payRates && !canChangePayRates) {
        delete updates.payRates;
        console.warn('RBAC Security: Representative attempted to modify pay rates.');
      }

      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === targetUserId) {
            const updated = {
              ...u,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
            if (currentUser && currentUser.id === targetUserId) {
              setCurrentUser(updated);
            }
            return updated;
          }
          return u;
        })
      );

      try {
        const userRef = doc(db, 'users', targetUserId);
        await updateDoc(userRef, {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Firestore updateDoc offline fallback', e);
      }

      try {
        const currentTarget = users.find((u) => u.id === targetUserId);
        if (currentTarget) {
          fetch('/api/users/persist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: { ...currentTarget, ...updates, updatedAt: new Date().toISOString() } }),
          }).catch(() => {});
        }
      } catch (e) {
        // Safe background persist
      }

      return true;
    } catch (err) {
      console.error('Error updating user profile', err);
      return false;
    }
  };

  const updateRepPayRates = async (targetRepId: string, payRates: Record<string, number>): Promise<boolean> => {
    if (!canChangePayRates) {
      alert('RBAC Access Denied: Only users with "Admin" or "Manager" roles are authorized to modify pay rates.');
      return false;
    }
    return updateUserProfile(targetRepId, { payRates });
  };

  const updateRepRole = async (targetRepId: string, newRole: UserRole, newTitle: string): Promise<boolean> => {
    if (!canChangeUserRolesAndTitles) {
      alert('RBAC Access Denied: Only users with "Admin" or "Manager" roles are authorized to change user titles and roles.');
      return false;
    }
    return updateUserProfile(targetRepId, { role: newRole, title: newTitle });
  };

  const createRole = (role: CustomRole) => {
    if (!isAdmin) {
      alert('Only Admins can create roles');
      return;
    }
    setCustomRoles((prev) => [...prev, role]);
  };

  const updateRole = (role: CustomRole) => {
    if (!isAdmin) {
      alert('Only Admins can update roles');
      return;
    }
    setCustomRoles((prev) => prev.map((r) => (r.id === role.id ? role : r)));
  };

  const deleteRole = (roleId: string) => {
    if (!isAdmin) {
      alert('Only Admins can delete roles');
      return;
    }
    setCustomRoles((prev) => prev.filter((r) => r.id !== roleId));
  };

  const getRole = (roleId: string): CustomRole | undefined => {
    return customRoles.find((r) => r.id === roleId);
  };

  const assignRoleToUser = (userId: string, roleId: string) => {
    if (!isAdmin) {
      alert('Only Admins can assign roles');
      return;
    }
    const role = getRole(roleId);
    if (!role) {
      alert('Role not found');
      return;
    }
    updateUserProfile(userId, { role: role.name });
  };

  // Approval Workflow
  const approveUser = async (targetUserId: string, role?: UserRole, title?: string): Promise<boolean> => {
    if (!isAdmin) {
      alert('RBAC Access Denied: Only Admins can approve access requests.');
      return false;
    }

    const updates: Partial<UserProfile> = {
      approvalStatus: 'approved',
      approvedBy: currentUser?.displayName || 'Gurpreet Multani (Admin)',
      approvedAt: new Date().toISOString(),
      ...(role ? { role } : {}),
      ...(title ? { title } : {}),
    };

    return updateUserProfile(targetUserId, updates);
  };

  const rejectUser = async (targetUserId: string, reason?: string): Promise<boolean> => {
    if (!isAdmin) {
      alert('RBAC Access Denied: Only Admins can reject or revoke access requests.');
      return false;
    }

    const updates: Partial<UserProfile> = {
      approvalStatus: 'rejected',
      rejectionReason: reason || 'Access restricted by administrator.',
    };

    return updateUserProfile(targetUserId, updates);
  };

  const deleteUserPermanent = async (targetUserId: string): Promise<boolean> => {
    const isFounder =
      (currentUser?.email || '').toLowerCase().includes('gurpreet') ||
      currentUser?.id === 'user_owner_gurpreet';

    if (!isAdmin && !isFounder && !effectiveRoleLower.includes('regional director')) {
      alert('RBAC Access Denied: Only Admins and Founders can permanently delete users.');
      return false;
    }

    const targetUser = users.find((u) => u.id === targetUserId);
    if (!targetUser) return false;

    if (
      (targetUser.email || '').toLowerCase().includes('gurpreet') ||
      targetUser.id === 'user_owner_gurpreet'
    ) {
      alert('Security Protection: Primary Executive account cannot be deleted.');
      return false;
    }

    // Mark as permanently deleted so it can never be auto-seeded
    markUserIdDeleted(targetUserId);
    if (targetUser.email) {
      markUserIdDeleted(targetUser.email.toLowerCase());
    }

    // 1. Remove from local state
    setUsers((prev) =>
      prev.filter(
        (u) =>
          u.id !== targetUserId &&
          (u.email || '').toLowerCase() !== (targetUser.email || '').toLowerCase()
      )
    );

    // 2. Remove from localStorage
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      if (cached) {
        const parsed: UserProfile[] = JSON.parse(cached);
        const filtered = parsed.filter(
          (u) =>
            u.id !== targetUserId &&
            (u.email || '').toLowerCase() !== (targetUser.email || '').toLowerCase()
        );
        localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(filtered));
      }
    } catch (e) {
      console.warn('Local storage delete cache notice:', e);
    }

    // 3. Remove from Cloud Firestore users and write tombstone
    try {
      await deleteDoc(doc(db, 'users', targetUserId));
      await setDoc(doc(db, 'deleted_users', targetUserId), {
        id: targetUserId,
        email: targetUser.email || '',
        deletedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore deleteDoc fallback notice:', e);
    }

    // 4. Remove from server persistent file store
    try {
      await fetch(`/api/users/${encodeURIComponent(targetUserId)}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Backend user delete API notice:', e);
    }

    return true;
  };

  const preApproveEmail = async (
    rawEmail: string,
    role: UserRole = 'Representative',
    title = 'Fiber Field Specialist',
    firstName = 'Authorized',
    lastName = 'Specialist',
    additionalProfile?: Partial<UserProfile>
  ): Promise<boolean> => {
    if (!isAdmin && !isFounderGurpreet && !effectiveRoleLower.includes('regional director') && !canManageAllUsers) {
      alert('RBAC Access Denied: Only Admins can pre-authorize users.');
      return false;
    }

    const email = rawEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      alert('Please enter a valid Google account email.');
      return false;
    }

    const newId = additionalProfile?.id || `user_pre_${Date.now()}`;
    const preApprovedUser: UserProfile = {
      id: newId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      displayName: additionalProfile?.displayName || `${firstName} ${lastName}`.trim(),
      role,
      title: title.trim(),
      approvedBy: currentUser?.displayName || 'Gurpreet Multani (Admin)',
      approvedAt: new Date().toISOString(),
      createdAt: additionalProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dateOfBirth: additionalProfile?.dateOfBirth || '1998-01-01',
      shirtSize: additionalProfile?.shirtSize || 'L',
      phone: additionalProfile?.phone || '(555) 000-0000',
      badgePhotoUrl: additionalProfile?.badgePhotoUrl,
      idPhotoUrl: additionalProfile?.idPhotoUrl,
      emergencyContact: additionalProfile?.emergencyContact || {
        name: 'Primary Contact',
        phone: '(555) 000-0000',
        relationship: 'Family',
      },
      directDeposit: additionalProfile?.directDeposit || {
        bankName: 'Pending Setup',
        accountNumber: '••••••••0000',
        routingNumber: '000000000',
        accountType: 'checking',
        taxIdType: 'SSN',
        taxIdNumber: 'XXX-XX-0000',
      },
      fiberAgreement: additionalProfile?.fiberAgreement || {
        status: 'signed',
        signedDate: new Date().toISOString().slice(0, 10),
        version: 'v2026.2',
      },
      travelProfile: additionalProfile?.travelProfile || {
        homeAirport: 'DFW - Dallas/Fort Worth',
        ableToTravel: true,
        smsTravelUpdatesConsent: true,
      },
      payRates: additionalProfile?.payRates || {
        'Sparklight Fiber': 320,
        'T-Mobile Fiber': 320,
        'AT&T Fiber': 290,
        'Frontier Fiber': 310,
        'Quantum Fiber': 280,
        'Brightspeed': 260,
        'Spectrum Gig': 250,
        'Kinetic Fiber': 270,
      },
      stats: additionalProfile?.stats || {
        installs: 0,
        cancels: 0,
        scheduled: 0,
        chargebacks: 0,
        totalSales: 0,
        installRate: 100,
        cancelRate: 0,
        totalCommission: 0,
      },
      managerId: additionalProfile?.managerId || 'user_mgr_marcus',
      managerName: additionalProfile?.managerName || 'Marcus Vance',
      ...additionalProfile,
      approvalStatus: 'approved',
      email,
    };

    setUsers((prev) => {
      const map = new Map<string, UserProfile>();
      map.set(preApprovedUser.id, preApprovedUser);
      prev.forEach((u) => {
        if (u && u.id && u.id !== newId && (u.email || '').toLowerCase() !== email) {
          map.set(u.id, u);
        }
      });
      return Array.from(map.values());
    });

    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      const existing: UserProfile[] = cached ? JSON.parse(cached) : [];
      const cMap = new Map<string, UserProfile>();
      cMap.set(preApprovedUser.id, preApprovedUser);
      existing.forEach((u) => {
        if (u && u.id && u.id !== newId && (u.email || '').toLowerCase() !== email) {
          cMap.set(u.id, u);
        }
      });
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(Array.from(cMap.values())));
    } catch {
      // Local storage cache notice
    }

    try {
      await setDoc(doc(db, 'users', newId), preApprovedUser);
    } catch (e) {
      console.warn('Firestore offline fallback', e);
    }

    try {
      await fetch('/api/users/persist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: preApprovedUser }),
      });
    } catch (e) {
      console.warn('Persist call notice:', e);
    }

    return true;
  };

  const refreshCurrentUserProfile = async () => {
    if (!currentUser?.id) return;
    try {
      const snap = await getDoc(doc(db, 'users', currentUser.id));
      if (snap.exists()) {
        const fresh = snap.data() as UserProfile;
        const eLower = (fresh.email || '').toLowerCase();
        if (eLower.includes('gurpreet') || eLower.includes('multani')) {
          fresh.role = 'Admin';
          fresh.approvalStatus = 'approved';
          fresh.title = 'Chief Executive & Founder';
        }
        setCurrentUser(fresh);
        setUsers((prev) => prev.map((u) => (u.id === fresh.id ? fresh : u)));
      }
    } catch (e) {
      console.warn('Could not refresh user profile from Firestore:', e);
    }
  };

  const pendingApprovalsCount = users.filter((u) => u.approvalStatus === 'pending').length;

  // Save custom roles to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ROLES_KEY, JSON.stringify(customRoles));
    } catch (e) {
      console.error('Failed to save roles to localStorage', e);
    }
  }, [customRoles]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        allUsers: users,
        customRoles,
        authLoading,
        loginAs,
        loginWithGoogle,
        loginWithGoogleEmail,
        loginWithGoogleUserInfo,
        loginWithCredentials,
        registerUser,
        createUserByAdmin,
        logout,
        updateUserProfile,
        updateRepPayRates,
        updateRepRole,
        approveUser,
        rejectUser,
        deleteUserPermanent,
        preApproveEmail,
        refreshCurrentUserProfile,
        pendingApprovalsCount,
        createRole,
        updateRole,
        deleteRole,
        getRole,
        assignRoleToUser,
        roleUiConfigs,
        updateRoleUiConfig,
        setButtonStateForRole,
        toggleTabForRole,
        togglePanelForRole,
        resetRoleUiConfig,
        getButtonState,
        isButtonVisible,
        isButtonDisabled,
        isTabVisible,
        isPanelVisible,
        simulatedRole,
        setSimulatedRole,
        effectiveRole,
        isSimulating,
        actualIsAdmin,
        isAdmin,
        isRegionalDirector,
        isBlitzManager,
        isTeamLead,
        isCorporateTrainer,
        isFieldSalesRep,
        isManager,
        isRepresentative,
        canChangeUserRolesAndTitles,
        canChangePayRates,
        canUploadCoursework,
        canManageTeam,
        canManageAllUsers,
        canLaunchStateBlitz,
        canCutTurf,
        canManageLogisticsAndBadging,
        canNegotiateMasterAgreements,
        canManageAgencyCashFlow,
        canCreateRoles,
        canEditPermissions,
        permissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
