import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, RolePermissions, CustomRole } from '../types';
import { INITIAL_USERS } from '../lib/seedData';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  users: UserProfile[];
  allUsers: UserProfile[];
  customRoles: CustomRole[];
  loginAs: (userId: string) => Promise<void>;
  loginWithCredentials: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (data: Partial<UserProfile> & { email: string; password?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUserProfile: (targetUserId: string, updates: Partial<UserProfile>) => Promise<boolean>;
  updateRepPayRates: (targetRepId: string, payRates: Record<string, number>) => Promise<boolean>;
  updateRepRole: (targetRepId: string, newRole: UserRole, newTitle: string) => Promise<boolean>;
  // Role Management Functions
  createRole: (role: CustomRole) => void;
  updateRole: (role: CustomRole) => void;
  deleteRole: (roleId: string) => void;
  getRole: (roleId: string) => CustomRole | undefined;
  assignRoleToUser: (userId: string, roleId: string) => void;
  // RBAC Flags & Helpers
  isAdmin: boolean;
  isManager: boolean;
  isRepresentative: boolean;
  canChangeUserRolesAndTitles: boolean;
  canChangePayRates: boolean;
  canUploadCoursework: boolean;
  canManageTeam: boolean;
  canManageAllUsers: boolean;
  canCreateRoles: boolean;
  canEditPermissions: boolean;
  permissions: RolePermissions;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'eclipse_current_user_id';
const LOCAL_STORAGE_USERS_KEY = 'eclipse_users_cache';
const LOCAL_STORAGE_ROLES_KEY = 'eclipse_custom_roles';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const savedId = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (savedId) {
        const found = INITIAL_USERS.find(u => u.id === savedId);
        if (found) return found;
      }
    } catch (e) {
      console.warn('Failed to read saved user', e);
    }
    // Default to Gurpreet (Admin) or Jordan (Representative)
    return INITIAL_USERS[0];
  });

  // Sync users with Firestore
  useEffect(() => {
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
  }, []);

  // Save users cache to local storage for offline resilience
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
      if (currentUser) {
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, currentUser.id);
      }
    } catch (e) {
      console.error(e);
    }
  }, [users, currentUser]);

  const loginAs = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, user.id);
    }
  };

  const loginWithCredentials = async (email: string, _pass: string) => {
    const normalized = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === normalized);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, user.id);
      return { success: true };
    }
    // If not found in seed, create a standard representative profile
    const newId = `user_${Date.now()}`;
    const newUser: UserProfile = {
      id: newId,
      email: normalized,
      firstName: normalized.split('@')[0] || 'Field',
      lastName: 'Agent',
      displayName: normalized.split('@')[0] || 'Field Agent',
      role: 'Representative',
      title: 'Fiber Field Specialist',
      managerId: 'user_mgr_marcus',
      managerName: 'Marcus Vance',
      dateOfBirth: '1999-01-01',
      shirtSize: 'L',
      phone: '(555) 000-1234',
      emergencyContact: {
        name: 'Primary Contact',
        phone: '(555) 000-5678',
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', newId), newUser);
    } catch (e) {
      console.warn('Firestore set user offline fallback', e);
    }

    setUsers(prev => [newUser, ...prev]);
    setCurrentUser(newUser);
    return { success: true };
  };

  const registerUser = async (data: Partial<UserProfile> & { email: string }) => {
    return loginWithCredentials(data.email, 'password123');
  };

  const logout = () => {
    setCurrentUser(INITIAL_USERS[2]); // Default representative Jordan Hayes
  };

  // RBAC Role normalization
  const currentRole = currentUser?.role?.toLowerCase() || 'representative';
  const isAdmin = currentRole === 'admin' || currentRole === 'owner';
  const isManager = currentRole === 'manager';
  const isRepresentative = !isAdmin && !isManager;

  const canChangeUserRolesAndTitles = isAdmin || isManager;
  const canChangePayRates = isAdmin || isManager;
  const canUploadCoursework = isAdmin || isManager;
  const canManageTeam = isAdmin || isManager;
  const canManageAllUsers = isAdmin;
  const canCreateRoles = isAdmin;
  const canEditPermissions = isAdmin;

  const permissions: RolePermissions = {
    canManageAllUsers,
    canManageTeam,
    canChangeUserRolesAndTitles,
    canChangePayRates,
    canUploadCoursework,
    canLaunchStateBlitz: isAdmin || isManager,
    canViewAllSales: isAdmin,
    canViewTeamSales: isAdmin || isManager,
    canSubmitSales: true,
    canAccessTraining: true,
    canAccessProfile: true,
    canCreateRoles,
    canEditPermissions,
  };

  // Update profile attributes with RBAC guards
  const updateUserProfile = async (targetUserId: string, updates: Partial<UserProfile>): Promise<boolean> => {
    try {
      // Role & Title change security guard: only Admin or Manager can modify
      if ((updates.role || updates.title) && !canChangeUserRolesAndTitles) {
        delete updates.role;
        delete updates.title;
        console.warn('RBAC Security: Representative attempted to modify role or title.');
      }

      // Pay rates security guard: only Admin or Manager can modify
      if (updates.payRates && !canChangePayRates) {
        delete updates.payRates;
        console.warn('RBAC Security: Representative attempted to modify pay rates.');
      }

      setUsers(prev => prev.map(u => {
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
      }));

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

  // ONLY users with 'Admin' or 'Manager' roles can change pay rates
  const updateRepPayRates = async (targetRepId: string, payRates: Record<string, number>): Promise<boolean> => {
    if (!canChangePayRates) {
      alert('RBAC Access Denied: Only users with "Admin" or "Manager" roles are authorized to modify pay rates.');
      return false;
    }

    return updateUserProfile(targetRepId, { payRates });
  };

  // ONLY users with 'Admin' or 'Manager' roles can change user titles/roles
  const updateRepRole = async (targetRepId: string, newRole: UserRole, newTitle: string): Promise<boolean> => {
    if (!canChangeUserRolesAndTitles) {
      alert('RBAC Access Denied: Only users with "Admin" or "Manager" roles are authorized to change user titles and roles.');
      return false;
    }

    return updateUserProfile(targetRepId, { role: newRole, title: newTitle });
  };

  // Role Management Functions (Admin Only)
  const createRole = (role: CustomRole) => {
    if (!isAdmin) {
      alert('Only Admins can create roles');
      return;
    }
    setCustomRoles(prev => [...prev, role]);
  };

  const updateRole = (role: CustomRole) => {
    if (!isAdmin) {
      alert('Only Admins can update roles');
      return;
    }
    setCustomRoles(prev => prev.map(r => (r.id === role.id ? role : r)));
  };

  const deleteRole = (roleId: string) => {
    if (!isAdmin) {
      alert('Only Admins can delete roles');
      return;
    }
    setCustomRoles(prev => prev.filter(r => r.id !== roleId));
  };

  const getRole = (roleId: string): CustomRole | undefined => {
    return customRoles.find(r => r.id === roleId);
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
        loginAs,
        loginWithCredentials,
        registerUser,
        logout,
        updateUserProfile,
        updateRepPayRates,
        updateRepRole,
        createRole,
        updateRole,
        deleteRole,
        getRole,
        assignRoleToUser,
        isAdmin,
        isManager,
        isRepresentative,
        canChangeUserRolesAndTitles,
        canChangePayRates,
        canUploadCoursework,
        canManageTeam,
        canManageAllUsers,
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
