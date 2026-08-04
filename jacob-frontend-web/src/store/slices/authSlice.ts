import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Role = 'client' | 'provider';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  phone?: string;
  address?: string;
  preferredLanguage?: string;
  locationLat?: number;
  locationLng?: number;
  businessBio?: string;
  experienceLevel?: string;
  serviceCity?: string;
  serviceLocationLat?: number;
  serviceLocationLng?: number;
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
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  role: 'client',
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrateAuthState: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload;
      state.role = action.payload?.role || 'client';
      state.isAuthenticated = !!action.payload;
    },
    loginSuccess: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.role = action.payload.role;
      state.isAuthenticated = true;
    },
    setAuthRole: (state, action: PayloadAction<Role>) => {
      state.role = action.payload;
    },
    updateAuthProfile: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (!state.user) return;
      const mergedPayoutInfo =
        action.payload.payoutInfo === undefined
          ? state.user.payoutInfo
          : { ...(state.user.payoutInfo || {}), ...action.payload.payoutInfo };
      state.user = { ...state.user, ...action.payload, payoutInfo: mergedPayoutInfo };
      if (action.payload.role) {
        state.role = action.payload.role;
      }
      state.isAuthenticated = true;
    },
    logoutSuccess: (state) => {
      state.user = null;
      state.role = 'client';
      state.isAuthenticated = false;
    },
  },
});

export const { hydrateAuthState, loginSuccess, setAuthRole, updateAuthProfile, logoutSuccess } = authSlice.actions;
export default authSlice.reducer;
