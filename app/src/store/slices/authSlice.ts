import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { AppUser } from "@/src/types/api";

export type Role = "client" | "provider" | "superAdmin";

type AuthState = {
  user: AppUser | null;
  role: Role;
  isAuthenticated: boolean;
};

const initialState: AuthState = {
  user: null,
  role: "client",
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateAuthState: (state, action: PayloadAction<AppUser | null>) => {
      state.user = action.payload;
      state.role = action.payload?.role || "client";
      state.isAuthenticated = Boolean(action.payload);
    },
    loginSuccess: (state, action: PayloadAction<AppUser>) => {
      state.user = action.payload;
      state.role = action.payload.role;
      state.isAuthenticated = true;
    },
    updateAuthProfile: (state, action: PayloadAction<Partial<AppUser>>) => {
      if (!state.user) return;
      state.user = {
        ...state.user,
        ...action.payload,
        payoutInfo:
          action.payload.payoutInfo === undefined
            ? state.user.payoutInfo
            : { ...(state.user.payoutInfo || {}), ...action.payload.payoutInfo },
      };
      if (action.payload.role) {
        state.role = action.payload.role;
      }
      state.isAuthenticated = true;
    },
    setAuthRole: (state, action: PayloadAction<Role>) => {
      state.role = action.payload;
    },
    logoutSuccess: (state) => {
      state.user = null;
      state.role = "client";
      state.isAuthenticated = false;
    },
  },
});

export const { hydrateAuthState, loginSuccess, updateAuthProfile, setAuthRole, logoutSuccess } =
  authSlice.actions;
export default authSlice.reducer;
