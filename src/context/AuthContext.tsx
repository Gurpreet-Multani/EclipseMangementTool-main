import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, RolePermissions, CustomRole } from '../types';
import { INITIAL_USERS } from '../lib/seedData';
import { auth, db } from '../lib/firebase';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
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
  preApproveEmail: (email: string, role?: UserRole, title?: string, firstName?: string, lastName?: string) => Promise<boolean>;
  refreshCurrentUserProfile: () => Promise<void>;
  pendingApprovalsCount: number;
  // Role Management Functions
  createRole: (role: CustomRole) => void;
  updateRole: (role: CustomRole) => void;
  deleteRole: (roleId: string) => void;
  getRole: (roleId: string) => CustomRole | undefined;
  assignRoleToUser: (userId: string, roleId: string) => void;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn('Failed to parse cached users', e);
    }
    return INITIAL_USERS;
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

  const [credentialMap, setCredentialMap] = useState<Record<string, string>>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_CREDENTIALS_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn('Failed to parse cached credentials', e);
    }

    const defaults: Record<string, string> = {};
    INITIAL_USERS.forEach((u) => {
      defaults[u.email.toLowerCase()] = 'eclipse123';
    });
    return defaults;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const savedId = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (savedId) {
        const cachedUsersRaw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
        const sourceUsers: UserProfile[] = cachedUsersRaw ? JSON.parse(cachedUsersRaw) : INITIAL_USERS;
        const found = sourceUsers.find((u) => u.id === savedId);
        if (found) return found;
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
          u.email.toLowerCase() === email ||
          (email.includes('gurpreet') && u.email.toLowerCase().includes('gurpreet'))
      ) || INITIAL_USERS.find(
        (u) =>
          u.email.toLowerCase() === email ||
          (email.includes('gurpreet') && u.email.toLowerCase().includes('gurpreet'))
      );

      const isGurpreet =
        email === 'gurpreet@eclipsemarketingagency.org' ||
        email.includes('gurpreetmultani') ||
        email.includes('gurpreet');

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
        try {
          await updateDoc(userRef, {
            idPhotoUrl: existingProfile.idPhotoUrl,
            badgePhotoUrl: existingProfile.badgePhotoUrl,
          });
        } catch (e) {
          console.warn('Offline fallback for photo update', e);
        }
      }
    }

    setCurrentUser(existingProfile);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, existingProfile.id);

    // Update users directory
    setUsers((prev) => {
      const filtered = prev.filter((u) => u.id !== uid && u.email.toLowerCase() !== email);
      return [existingProfile!, ...filtered];
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

  // Sync users with Firestore (attach only when user is authenticated)
  useEffect(() => {
    if (!currentUser) return;

    const syncUsersFromFirestore = async () => {
      try {
        for (const seedUser of INITIAL_USERS) {
          const userRef = doc(db, 'users', seedUser.id);
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, seedUser);
          }
        }
      } catch (err) {
        console.warn('Firestore initial user seeding notice:', err);
      }
    };

    syncUsersFromFirestore();

    // Real-time Firestore listener for all users
    const unsub = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        if (!snap.empty) {
          const remoteUsers: UserProfile[] = [];
          snap.forEach((docSnap) => {
            remoteUsers.push(docSnap.data() as UserProfile);
          });

          setUsers((prev) => {
            const map = new Map<string, UserProfile>();
            INITIAL_USERS.forEach((u) => map.set(u.id, u));
            prev.forEach((u) => map.set(u.id, u));
            remoteUsers.forEach((u) => map.set(u.id, u));
            return Array.from(map.values());
          });
        }
      },
      (err) => {
        console.warn('Firestore users subscription notice:', err);
      }
    );

    return () => unsub();
  }, [currentUser?.id]);

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
      console.error('Google Sign-in failed:', err);
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
      email.includes('gurpreet');

    const matched = users.find(
      (u) =>
        u.email.toLowerCase() === email ||
        (isGurpreet && u.email.toLowerCase().includes('gurpreet'))
    ) || INITIAL_USERS.find(
      (u) =>
        u.email.toLowerCase() === email ||
        (isGurpreet && u.email.toLowerCase().includes('gurpreet'))
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
      firstName: matched?.firstName || firstName,
      lastName: matched?.lastName || lastName,
      displayName: matched?.displayName || displayName,
      role: matched?.role || defaultRole,
      title: matched?.title || (isApproved ? defaultTitle : 'Pending Authorization'),
      approvalStatus: initialApprovalStatus,
      approvedBy: isApproved ? (matched?.approvedBy || 'Pre-Approved') : undefined,
      approvedAt: isApproved ? (matched?.approvedAt || new Date().toISOString()) : undefined,
      requestedAt: isApproved ? undefined : new Date().toISOString(),
      createdAt: matched?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentUser(profile);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, profile.id);

    setUsers((prev) => {
      const filtered = prev.filter((u) => u.id !== profile.id && u.email.toLowerCase() !== email);
      return [profile, ...filtered];
    });

    try {
      await setDoc(doc(db, 'users', profile.id), profile, { merge: true });
    } catch (e) {
      console.warn('Firestore offline fallback', e);
    }

    return { success: true };
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
    const user = users.find((u) => u.email.toLowerCase() === normalized);
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
    if (!isAdmin) {
      return { success: false, error: 'Only admins can create users.' };
    }

    const normalized = data.email.trim().toLowerCase();
    if (!normalized || !data.password.trim()) {
      return { success: false, error: 'Email and password are required.' };
    }

    const duplicate = users.some((u) => u.email.toLowerCase() === normalized);
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

    setUsers((prev) => [newUser, ...prev]);
    setCredentialMap((prev) => ({ ...prev, [normalized]: data.password }));

    try {
      await setDoc(doc(db, 'users', newUser.id), newUser);
    } catch (e) {
      console.warn('Firestore create user offline fallback', e);
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

  // RBAC Role normalization & 5-Tier Hierarchy
  const currentRole = (currentUser?.role || 'Field Sales Representative').trim();
  const currentRoleLower = currentRole.toLowerCase();

  // Primary Hierarchy Levels
  const isAdmin = currentRoleLower === 'admin' || currentRoleLower === 'owner';
  const isRegionalDirector = isAdmin || currentRoleLower.includes('regional director');
  const isBlitzManager = isRegionalDirector || currentRoleLower.includes('blitz manager') || currentRoleLower === 'manager';
  const isTeamLead = isBlitzManager || currentRoleLower.includes('team lead');
  const isCorporateTrainer = isTeamLead || currentRoleLower.includes('corporate trainer') || currentRoleLower.includes('junior lead');
  const isFieldSalesRep = !isCorporateTrainer;

  // Legacy mappings for backwards compatibility
  const isManager = isBlitzManager;
  const isRepresentative = isFieldSalesRep || (!isAdmin && !isBlitzManager);

  // Authority & Governance Permissions
  const canManageAllUsers = isAdmin || isRegionalDirector;
  const canManageTeam = isTeamLead; // Team leads manage squads of 2-4; Blitz managers manage squads of 4+
  const canChangeUserRolesAndTitles = isAdmin || isRegionalDirector || isBlitzManager;
  const canChangePayRates = isAdmin || isRegionalDirector;
  const canUploadCoursework = isAdmin || isRegionalDirector || isBlitzManager || isCorporateTrainer;
  const canLaunchStateBlitz = isAdmin || isRegionalDirector || isBlitzManager;
  const canCutTurf = isAdmin || isRegionalDirector || isBlitzManager;
  const canManageLogisticsAndBadging = isAdmin || isRegionalDirector || isBlitzManager;
  const canNegotiateMasterAgreements = isAdmin || isRegionalDirector;
  const canManageAgencyCashFlow = isAdmin || isRegionalDirector;
  const canCreateRoles = isAdmin;
  const canEditPermissions = isAdmin;

  const permissions: RolePermissions = {
    canManageAllUsers,
    canManageTeam,
    canChangeUserRolesAndTitles,
    canChangePayRates,
    canUploadCoursework,
    canLaunchStateBlitz,
    canViewAllSales: isBlitzManager,
    canViewTeamSales: isTeamLead,
    canSubmitSales: true,
    canAccessTraining: true,
    canAccessProfile: true,
    canCutTurf,
    canManageLogisticsAndBadging,
    canNegotiateMasterAgreements,
    canManageAgencyCashFlow,
    canCreateRoles,
    canEditPermissions,
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

  const preApproveEmail = async (
    rawEmail: string,
    role: UserRole = 'Representative',
    title = 'Fiber Field Specialist',
    firstName = 'Authorized',
    lastName = 'Specialist'
  ): Promise<boolean> => {
    if (!isAdmin) {
      alert('RBAC Access Denied: Only Admins can pre-authorize users.');
      return false;
    }

    const email = rawEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      alert('Please enter a valid Google account email.');
      return false;
    }

    const newId = `user_pre_${Date.now()}`;
    const preApprovedUser: UserProfile = {
      id: newId,
      email,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`.trim(),
      role,
      title,
      approvalStatus: 'approved',
      approvedBy: currentUser?.displayName || 'Gurpreet Multani (Admin)',
      approvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dateOfBirth: '1998-01-01',
      shirtSize: 'L',
      phone: '(555) 000-0000',
      emergencyContact: {
        name: 'Primary Contact',
        phone: '(555) 000-0000',
        relationship: 'Family',
      },
      directDeposit: {
        bankName: 'Pending Setup',
        accountNumber: '••••••••0000',
        routingNumber: '000000000',
        accountType: 'checking',
        taxIdType: 'SSN',
        taxIdNumber: 'XXX-XX-0000',
      },
      fiberAgreement: {
        status: 'pending',
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
    };

    setUsers((prev) => [preApprovedUser, ...prev.filter((u) => u.email.toLowerCase() !== email)]);

    try {
      await setDoc(doc(db, 'users', newId), preApprovedUser);
    } catch (e) {
      console.warn('Firestore offline fallback', e);
    }

    return true;
  };

  const refreshCurrentUserProfile = async () => {
    if (!currentUser?.id) return;
    try {
      const snap = await getDoc(doc(db, 'users', currentUser.id));
      if (snap.exists()) {
        const fresh = snap.data() as UserProfile;
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
        loginWithCredentials,
        registerUser,
        createUserByAdmin,
        logout,
        updateUserProfile,
        updateRepPayRates,
        updateRepRole,
        approveUser,
        rejectUser,
        preApproveEmail,
        refreshCurrentUserProfile,
        pendingApprovalsCount,
        createRole,
        updateRole,
        deleteRole,
        getRole,
        assignRoleToUser,
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
