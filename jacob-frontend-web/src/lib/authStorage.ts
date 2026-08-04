'use client';

const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const AUTH_USER_KEY = 'auth_user';

type StoredUser = Record<string, unknown>;

const getStorageByKind = (kind: 'local' | 'session') => {
  if (typeof window === 'undefined') return null;
  return kind === 'local' ? window.localStorage : window.sessionStorage;
};

const hasAuthData = (kind: 'local' | 'session') => {
  const storage = getStorageByKind(kind);
  if (!storage) return false;
  return Boolean(
    storage.getItem(AUTH_TOKEN_KEY) ||
      storage.getItem(REFRESH_TOKEN_KEY) ||
      storage.getItem(AUTH_USER_KEY)
  );
};

export const getActiveAuthStorageKind = (): 'local' | 'session' | null => {
  if (hasAuthData('local')) return 'local';
  if (hasAuthData('session')) return 'session';
  return null;
};

const getActiveAuthStorage = () => {
  const kind = getActiveAuthStorageKind();
  return kind ? getStorageByKind(kind) : null;
};

export const isPersistentAuthSession = () => getActiveAuthStorageKind() === 'local';

export const getAccessToken = () => {
  const storage = getActiveAuthStorage();
  return storage?.getItem(AUTH_TOKEN_KEY) ?? null;
};

export const getRefreshToken = () => {
  const storage = getActiveAuthStorage();
  return storage?.getItem(REFRESH_TOKEN_KEY) ?? null;
};

export const getStoredUser = <T = StoredUser>() => {
  const storage = getActiveAuthStorage();
  const raw = storage?.getItem(AUTH_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    storage?.removeItem(AUTH_USER_KEY);
    return null;
  }
};

export const clearAuthSession = () => {
  if (typeof window === 'undefined') return;
  [window.localStorage, window.sessionStorage].forEach((storage) => {
    storage.removeItem(AUTH_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
    storage.removeItem(AUTH_USER_KEY);
  });
};

export const setAuthSession = ({
  accessToken,
  refreshToken,
  user,
  persistent,
}: {
  accessToken: string;
  refreshToken: string;
  user: unknown;
  persistent: boolean;
}) => {
  if (typeof window === 'undefined') return;

  clearAuthSession();
  const storage = persistent ? window.localStorage : window.sessionStorage;
  storage.setItem(AUTH_TOKEN_KEY, accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  storage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const updateStoredUser = (user: unknown) => {
  const storage = getActiveAuthStorage();
  if (!storage) return;
  storage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const updateStoredTokens = ({
  accessToken,
  refreshToken,
}: {
  accessToken: string;
  refreshToken: string;
}) => {
  const storage = getActiveAuthStorage();
  if (!storage) return;
  storage.setItem(AUTH_TOKEN_KEY, accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const refreshAccessToken = async (apiBaseUrl: string) => {
  const currentRefreshToken = getRefreshToken();
  if (!apiBaseUrl || !currentRefreshToken) return null;
  const normalizedApiBaseUrl = apiBaseUrl.trim().replace(/\/$/, '');

  try {
    const response = await fetch(`${normalizedApiBaseUrl}/api/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ refreshToken: currentRefreshToken }),
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          success?: boolean;
          data?: {
            accessToken?: string;
            refreshToken?: string;
          };
        }
      | null;

    if (!response.ok || !payload?.success || !payload.data?.accessToken) {
      clearAuthSession();
      return null;
    }

    updateStoredTokens({
      accessToken: payload.data.accessToken,
      refreshToken: payload.data.refreshToken || currentRefreshToken,
    });

    return payload.data.accessToken;
  } catch {
    clearAuthSession();
    return null;
  }
};

export { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, AUTH_USER_KEY };
