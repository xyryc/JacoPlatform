'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  AuthUser,
  Role,
  hydrateAuthState,
  loginSuccess,
  logoutSuccess,
  setAuthRole,
  updateAuthProfile,
} from '@/store/slices/authSlice';
import { store } from '@/store';
import { apiSlice } from '@/store/services/apiSlice';
import { clearAuthSession, getAccessToken, getStoredUser, updateStoredUser } from '@/lib/authStorage';

interface LoginPayload {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: Role;
  avatar?: string;
  phone?: string;
  address?: string;
  preferredLanguage?: string;
  locationLat?: number | null;
  locationLng?: number | null;
  businessBio?: string;
  experienceLevel?: string;
  serviceCity?: string;
  serviceLocationLat?: number | null;
  serviceLocationLng?: number | null;
  averageRating?: number;
  reviewCount?: number;
  sellerLevel?: string;
  savedServiceIds?: string[];
  payoutVerificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  walletBalance?: number;
  totalEarnings?: number;
  totalWithdrawn?: number;
  payoutInfo?: {
    accountHolderName?: string;
    bankAccountNumber?: string;
    routingNumber?: string;
    bankName?: string;
    accountType?: 'checking' | 'savings' | '';
    nidFrontImageUrl?: string;
    nidBackImageUrl?: string;
    submittedAt?: string | null;
    reviewedAt?: string | null;
    rejectionReason?: string;
  };
}

interface AuthState {
  user: AuthUser | null;
  role: Role;
  setRole: (role: Role) => Promise<void>;
  isAuthenticated: boolean;
  login: (payload?: LoginPayload) => void;
  updateProfile: (payload: Partial<AuthUser>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const LEGACY_DUMMY_AVATARS = [
  'https://i.pravatar.cc/150?u=default-client',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
];

const normalizeAvatar = (avatar?: string) => {
  if (!avatar) return '';
  if (LEGACY_DUMMY_AVATARS.includes(avatar)) return '';
  return avatar;
};

const readStoredUser = (): AuthUser | null => {
  const token = getAccessToken();
  if (!token) return null;
  const parsed = getStoredUser<AuthUser>();
  if (!parsed?.id || !parsed?.email) return null;
  return { ...parsed, avatar: normalizeAvatar(parsed.avatar) };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { user, role, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const storedUser = readStoredUser();
    dispatch(hydrateAuthState(storedUser));
  }, [dispatch]);

  const setRole = async (nextRole: Role) => {
    dispatch(setAuthRole(nextRole));
  };

  const login = (payload?: LoginPayload) => {
    const resolvedRole = payload?.role || 'client';
    const resolvedFirstName = payload?.firstName?.trim() || 'User';
    const resolvedLastName = payload?.lastName?.trim() || '';
    const resolvedName = `${resolvedFirstName} ${resolvedLastName}`.trim();
    const resolvedEmail = payload?.email?.trim() || 'unknown@example.com';

    const nextUser: AuthUser = {
      id: payload?.id || 'USR-LOCAL',
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      name: resolvedName || 'User',
      email: resolvedEmail,
      avatar: normalizeAvatar(payload?.avatar),
      role: resolvedRole,
      phone: payload?.phone || '',
      address: payload?.address || '',
      preferredLanguage: payload?.preferredLanguage || 'English (US)',
      locationLat: typeof payload?.locationLat === 'number' ? payload.locationLat : undefined,
      locationLng: typeof payload?.locationLng === 'number' ? payload.locationLng : undefined,
      businessBio: payload?.businessBio || '',
      experienceLevel: payload?.experienceLevel || '',
      serviceCity: payload?.serviceCity || '',
      serviceLocationLat:
        typeof payload?.serviceLocationLat === 'number' ? payload.serviceLocationLat : undefined,
      serviceLocationLng:
        typeof payload?.serviceLocationLng === 'number' ? payload.serviceLocationLng : undefined,
      averageRating: typeof payload?.averageRating === 'number' ? payload.averageRating : 0,
      reviewCount: typeof payload?.reviewCount === 'number' ? payload.reviewCount : 0,
      sellerLevel: payload?.sellerLevel || 'New',
      savedServiceIds: Array.isArray(payload?.savedServiceIds) ? payload.savedServiceIds : [],
      payoutVerificationStatus: payload?.payoutVerificationStatus || 'unverified',
      walletBalance: typeof payload?.walletBalance === 'number' ? payload.walletBalance : 0,
      totalEarnings: typeof payload?.totalEarnings === 'number' ? payload.totalEarnings : 0,
      totalWithdrawn: typeof payload?.totalWithdrawn === 'number' ? payload.totalWithdrawn : 0,
      payoutInfo: payload?.payoutInfo || {
        accountHolderName: '',
        bankAccountNumber: '',
        routingNumber: '',
        bankName: '',
        accountType: '',
        nidFrontImageUrl: '',
        nidBackImageUrl: '',
        submittedAt: null,
        reviewedAt: null,
        rejectionReason: '',
      },
    };

    dispatch(loginSuccess(nextUser));
    updateStoredUser(nextUser);
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      clearAuthSession();
      sessionStorage.removeItem('pending_signup_auth');
    }

    dispatch(logoutSuccess());
  };

  const updateProfile = (payload: Partial<AuthUser>) => {
    if (!user) return;
    const nextUser: AuthUser = {
      ...user,
      ...payload,
      payoutInfo:
        payload.payoutInfo === undefined
          ? user.payoutInfo
          : { ...(user.payoutInfo || {}), ...payload.payoutInfo },
    };
    dispatch(updateAuthProfile(payload));
    updateStoredUser(nextUser);
  };

  return <AuthContext.Provider value={{ user, role, setRole, isAuthenticated, login, updateProfile, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
