import Constants from "expo-constants";
import { NativeModules, Platform } from "react-native";

const normalizeBaseUrl = (value?: string) => {
  if (!value) return "";
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

const deriveDevHost = () => {
  const candidates = [
    NativeModules?.SourceCode?.scriptURL,
    Constants.expoConfig?.hostUri,
    Constants.linkingUri,
  ].filter((value): value is string => typeof value === "string" && value.length > 0);

  for (const candidate of candidates) {
    const match = candidate.match(/^(?:exp|exps|http|https):\/\/([^/:]+)/i);
    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
};

const devHost = deriveDevHost();
const androidDefault = "http://10.0.2.2:5001";
const iosDefault = "http://localhost:5001";
const smartDefault =
  devHost && devHost !== "localhost" && devHost !== "127.0.0.1"
    ? `http://${devHost}:5001`
    : Platform.OS === "android"
      ? androidDefault
      : iosDefault;

export const API_BASE_URL =
  normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL) ||
  normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL) ||
  normalizeBaseUrl(smartDefault);

export const SOCKET_URL =
  normalizeBaseUrl(process.env.EXPO_PUBLIC_SOCKET_URL) ||
  normalizeBaseUrl(process.env.NEXT_PUBLIC_SOCKET_URL) ||
  API_BASE_URL;

export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "";
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";

