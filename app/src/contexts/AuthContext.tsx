import { authStorage, onboardingStorage } from "@/src/lib/storage";
import { store } from "@/src/store";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  hydrateAuthState,
  loginSuccess,
  logoutSuccess,
  setAuthRole,
  updateAuthProfile,
} from "@/src/store/slices/authSlice";
import { apiSlice } from "@/src/store/services/apiSlice";
import type { AppUser } from "@/src/types/api";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type AuthContextValue = {
  user: AppUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  role: AppUser["role"] | "client";
  loginWithPassword: (email: string, password: string, rememberMe?: boolean) => Promise<AppUser>;
  bootstrapProfile: () => Promise<void>;
  setSession: (
    next: { accessToken: string; refreshToken: string; user: AppUser },
    options?: { persistent?: boolean }
  ) => Promise<void>;
  setRole: (role: "client" | "provider" | "superAdmin") => Promise<void>;
  updateProfile: (payload: Partial<AppUser>) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const isUnauthorizedError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const status = (error as { status?: unknown }).status;
  return status === 401 || status === "401";
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, role } = useAppSelector((state) => state.auth);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const [storedUser, storedAccess, storedRefresh] = await Promise.all([
          authStorage.getUser(),
          authStorage.getAccessToken(),
          authStorage.getRefreshToken(),
        ]);

        if (storedUser && storedAccess && storedRefresh) {
          await onboardingStorage.setIntroCompleted();
          dispatch(hydrateAuthState(storedUser));
          setAccessToken(storedAccess);
          setRefreshToken(storedRefresh);
          try {
            const profile = await store.dispatch(apiSlice.endpoints.getMyProfile.initiate()).unwrap();
            dispatch(hydrateAuthState(profile.data.user));
            await authStorage.setSession(storedAccess, storedRefresh, profile.data.user);
          } catch (error) {
            if (isUnauthorizedError(error)) {
              dispatch(logoutSuccess());
              setAccessToken(null);
              setRefreshToken(null);
              await authStorage.clearSession();
            }
            // Keep stored session through transient network/server failures.
          }
        }
      } finally {
        setLoading(false);
      }
    };

    void restore();
  }, [dispatch]);

  const setSession = useCallback(async (
    next: { accessToken: string; refreshToken: string; user: AppUser },
    options?: { persistent?: boolean }
  ) => {
    dispatch(loginSuccess(next.user));
    setAccessToken(next.accessToken);
    setRefreshToken(next.refreshToken);
    await onboardingStorage.setIntroCompleted();
    await authStorage.setSession(
      next.accessToken,
      next.refreshToken,
      next.user,
      options?.persistent ?? authStorage.isPersistent()
    );
  }, [dispatch]);

  const bootstrapProfile = useCallback(async () => {
    const [storedAccess, storedRefresh] = await Promise.all([
      authStorage.getAccessToken(),
      authStorage.getRefreshToken(),
    ]);

    if (!storedAccess || !storedRefresh) return;
    const profile = await store.dispatch(apiSlice.endpoints.getMyProfile.initiate()).unwrap();
    await setSession({
      accessToken: storedAccess,
      refreshToken: storedRefresh,
      user: profile.data.user,
    }, { persistent: true });
  }, [setSession]);

  const loginWithPassword = useCallback(async (email: string, password: string, rememberMe = true) => {
    const payload = await store.dispatch(apiSlice.endpoints.login.initiate({ email, password })).unwrap();
    await setSession(payload.data, { persistent: rememberMe });
    return payload.data.user;
  }, [setSession]);

  const setRole = useCallback(async (nextRole: "client" | "provider" | "superAdmin") => {
    dispatch(setAuthRole(nextRole));
  }, [dispatch]);

  const updateProfile = useCallback(async (payload: Partial<AppUser>) => {
    if (!user || !accessToken || !refreshToken) return;

    const nextUser: AppUser = {
      ...user,
      ...payload,
      payoutInfo:
        payload.payoutInfo === undefined
          ? user.payoutInfo
          : { ...(user.payoutInfo || {}), ...payload.payoutInfo },
    };

    dispatch(updateAuthProfile(payload));
    await authStorage.setSession(accessToken, refreshToken, nextUser, authStorage.isPersistent());
  }, [accessToken, dispatch, refreshToken, user]);

  const logout = useCallback(async () => {
    const storedRefresh = refreshToken ?? (await authStorage.getRefreshToken());
    if (storedRefresh) {
      try {
        await store.dispatch(apiSlice.endpoints.logout.initiate({ refreshToken: storedRefresh })).unwrap();
      } catch {
        // Clear local session even if backend token revocation fails.
      }
    }
    dispatch(logoutSuccess());
    dispatch(apiSlice.util.resetApiState());
    setAccessToken(null);
    setRefreshToken(null);
    await authStorage.clearSession();
  }, [dispatch, refreshToken]);

  const value = useMemo(() => ({
    user,
    accessToken,
    refreshToken,
    loading,
    isAuthenticated: Boolean(isAuthenticated && accessToken),
    role,
    loginWithPassword,
    bootstrapProfile,
    setSession,
    setRole,
    updateProfile,
    logout,
  }), [
    accessToken,
    bootstrapProfile,
    isAuthenticated,
    loading,
    loginWithPassword,
    logout,
    refreshToken,
    role,
    setRole,
    setSession,
    updateProfile,
    user,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
};
