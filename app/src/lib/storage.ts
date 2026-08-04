import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "auth_user";
const TERMS_ACCEPTED_KEY = "onboarding_terms_accepted";
const ONBOARDING_COMPLETED_KEY = "onboarding_completed";

let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;
let memoryUser: unknown = null;
let persistentSession = false;

export const authStorage = {
  async getAccessToken() {
    if (memoryAccessToken) return memoryAccessToken;
    const stored = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (stored) persistentSession = true;
    return stored;
  },
  async getRefreshToken() {
    if (memoryRefreshToken) return memoryRefreshToken;
    const stored = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (stored) persistentSession = true;
    return stored;
  },
  async getUser() {
    if (memoryUser) return memoryUser;
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (raw) persistentSession = true;
    return raw ? JSON.parse(raw) : null;
  },
  async setSession(accessToken: string, refreshToken: string, user: unknown, persist = true) {
    memoryAccessToken = accessToken;
    memoryRefreshToken = refreshToken;
    memoryUser = user;
    persistentSession = persist;

    if (persist) {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      return;
    }

    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  },
  isPersistent() {
    return persistentSession;
  },
  async clearSession() {
    memoryAccessToken = null;
    memoryRefreshToken = null;
    memoryUser = null;
    persistentSession = false;
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  },
};

export const onboardingStorage = {
  async hasAcceptedTerms() {
    return (await AsyncStorage.getItem(TERMS_ACCEPTED_KEY)) === "true";
  },
  async setTermsAccepted() {
    await AsyncStorage.setItem(TERMS_ACCEPTED_KEY, "true");
  },
  async hasCompletedOnboarding() {
    return (await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY)) === "true";
  },
  async setOnboardingCompleted() {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
  },
  async setIntroCompleted() {
    await AsyncStorage.multiSet([
      [TERMS_ACCEPTED_KEY, "true"],
      [ONBOARDING_COMPLETED_KEY, "true"],
    ]);
  },
};
