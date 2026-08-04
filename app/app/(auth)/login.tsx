import ImageImport from "@/assets/ImageImport";
import { useAuth } from "@/src/contexts/AuthContext";
import { ApiError } from "@/src/lib/api";
import { API_BASE_URL, GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from "@/src/lib/env";
import { useLoginWithGoogleMutation } from "@/src/store/services/apiSlice";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    NativeModules,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KeyboardAwareScrollView as ScrollView } from "@/src/components/KeyboardAwareScrollView";

type GoogleSigninModule = {
    GoogleSignin: {
        configure: (options: {
            webClientId: string;
            iosClientId?: string;
            offlineAccess?: boolean;
            forceCodeForRefreshToken?: boolean;
        }) => void;
        hasPlayServices: (options?: { showPlayServicesUpdateDialog?: boolean }) => Promise<boolean>;
        signIn: () => Promise<{ data?: { idToken?: string | null } }>;
    };
    isErrorWithCode: (error: unknown) => error is { code?: string };
    statusCodes: {
        SIGN_IN_CANCELLED: string;
    };
};

let cachedGoogleSignin: GoogleSigninModule | null | undefined;

const getGoogleSignin = () => {
    if (cachedGoogleSignin !== undefined) return cachedGoogleSignin;
    if (!NativeModules.RNGoogleSignin) {
        cachedGoogleSignin = null;
        return cachedGoogleSignin;
    }
    try {
        // Google Sign-In is a native module; keep email login usable when this dev build does not include it.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        cachedGoogleSignin = require("@react-native-google-signin/google-signin") as GoogleSigninModule;
    } catch {
        cachedGoogleSignin = null;
    }
    return cachedGoogleSignin;
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof ApiError) return error.message;

    if (error && typeof error === "object") {
        const rtkError = error as {
            data?: { message?: string };
            error?: string;
            status?: number | string;
        };

        if (rtkError.data?.message) return rtkError.data.message;

        if (rtkError.status === "FETCH_ERROR") {
            return `Network request failed. Mobile app tried ${API_BASE_URL || "an empty API URL"}. Make sure the backend is running and your phone can reach this URL.`;
        }

        if (rtkError.error) return rtkError.error;
    }

    return fallback;
};

export default function LoginScreen() {
    const router = useRouter();
    const { role: requestedRole } = useLocalSearchParams();
    const { isAuthenticated, loading: authLoading, loginWithPassword, role, setSession, user } = useAuth();
    const [loginWithGoogle] = useLoginWithGoogleMutation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const googleRole = requestedRole === "provider" ? "provider" : "client";

    useEffect(() => {
        if (!GOOGLE_WEB_CLIENT_ID) return;
        const googleSignin = getGoogleSignin();
        googleSignin?.GoogleSignin.configure({
            webClientId: GOOGLE_WEB_CLIENT_ID,
            iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
            offlineAccess: false,
            forceCodeForRefreshToken: false,
        });
    }, []);

    useEffect(() => {
        if (authLoading || !isAuthenticated || !user) return;
        router.replace(role === "provider" ? "/(provider-tabs)" : "/(tabs)");
    }, [authLoading, isAuthenticated, role, router, user]);

    const handleSignIn = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert("Missing information", "Email and password are required.");
            return;
        }

        setLoading(true);
        try {
            const user = await loginWithPassword(email.trim(), password, rememberMe);
            router.replace(user.role === "provider" ? "/(provider-tabs)" : "/(tabs)");
        } catch (error) {
            const message = getApiErrorMessage(error, "Login failed. Please try again.");
            Alert.alert("Sign in failed", message);
        } finally {
            setLoading(false);
        }
    };

    const getGoogleErrorMessage = (error: unknown) => {
        return getApiErrorMessage(error, "Please try again.");
    };

    const handleGoogleSignIn = async () => {
        if (!GOOGLE_WEB_CLIENT_ID) {
            Alert.alert("Google sign in is not configured", "Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to jacob-app/.env first.");
            return;
        }

        const googleSignin = getGoogleSignin();
        if (!googleSignin) {
            Alert.alert(
                "Google sign in unavailable",
                "This app build does not include the Google Sign-In native module. Rebuild the development app to use Google login."
            );
            return;
        }

        setGoogleLoading(true);
        try {
            await googleSignin.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            const googleUser = await googleSignin.GoogleSignin.signIn();
            const idToken = googleUser.data?.idToken;

            if (!idToken) {
                Alert.alert("Google sign in failed", "Google did not return a login token.");
                return;
            }

            const payload = await loginWithGoogle({ idToken, role: googleRole }).unwrap();
            await setSession(payload.data, { persistent: rememberMe });
            router.replace(payload.data.user.role === "provider" ? "/(provider-tabs)" : "/(tabs)");
        } catch (error) {
            if (googleSignin.isErrorWithCode(error) && error.code === googleSignin.statusCodes.SIGN_IN_CANCELLED) {
                return;
            }
            Alert.alert("Google sign in failed", getGoogleErrorMessage(error));
        } finally {
            setGoogleLoading(false);
        }
    };

    if (authLoading || (isAuthenticated && user)) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#2286BE" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar style="dark" />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
                    className="flex-1"
                >
                    <ScrollView
                        className="flex-1 px-8"
                        showsVerticalScrollIndicator={false}
                        keyboardDismissMode="on-drag"
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingBottom: 40 }}
                    >
                    {/* Logo Section */}
                    <View className="items-center mt-12 mb-10">
                        <Image
                            source={ImageImport.icon}
                            className="w-[120px] h-[120px]"
                            resizeMode="contain"
                        />
                        <Text className="text-[36px] font-bold text-[#2B84B1] mt-6">
                            Welcome Back
                        </Text>
                        <Text className="text-[16px] text-[#7C8B95] mt-2">
                            Sign in to access your account
                        </Text>
                    </View>

                    {/* Form Section */}
                    <View className="gap-y-6">
                        {/* Email Input */}
                        <View>
                            <Text className="text-[14px] font-bold text-[#A0AEC0] mb-2 ml-1">
                                Email
                            </Text>
                            <View className="w-full h-[60px] border-2 border-[#A0AEC0] rounded-[24px] px-6 justify-center">
                                <TextInput
                                    placeholder="Enter your email"
                                    placeholderTextColor="#A0AEC0"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    className="text-[16px] text-[#2D3748] font-medium"
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View>
                            <Text className="text-[14px] font-bold text-[#A0AEC0] mb-2 ml-1">
                                Password
                            </Text>
                            <View className="w-full h-[60px] border-2 border-[#A0AEC0] rounded-[24px] px-6 flex-row items-center">
                                <TextInput
                                    placeholder="Enter your password"
                                    placeholderTextColor="#A0AEC0"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                    className="flex-1 text-[16px] text-[#2D3748] font-medium"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                                        size={24}
                                        color="#A0AEC0"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Remember Me & Forgot Password */}
                        <View className="flex-row items-center justify-between px-1">
                            <TouchableOpacity
                                onPress={() => setRememberMe(!rememberMe)}
                                className="flex-row items-center"
                            >
                                <View className={`w-6 h-6 rounded border-2 items-center justify-center ${rememberMe ? 'bg-[#2B84B1] border-[#2B84B1]' : 'border-[#A0AEC0]'}`}>
                                    {rememberMe && <Ionicons name="checkmark" size={16} color="white" />}
                                </View>
                                <Text className="ml-2 text-[14px] font-bold text-[#7C8B95]">
                                    Remember me
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")}>
                                <Text className="text-[14px] font-bold text-[#2B84B1]">
                                    Forget password
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Sign In Button */}
                        <TouchableOpacity
                            disabled={loading}
                            onPress={handleSignIn}
                            className="w-full h-[64px] bg-[#2B84B1] rounded-[32px] items-center justify-center shadow-lg shadow-[#2B84B1]/40 mt-4"
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white text-[18px] font-bold">
                                    SIGN IN
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Social Login Section */}
                        <View className="items-center mt-6">
                            <Text className="text-[#7C8B95] font-bold mb-6">
                                or continue with
                            </Text>
                            <View className="flex-row gap-x-6">
                                <TouchableOpacity
                                    disabled={googleLoading}
                                    onPress={handleGoogleSignIn}
                                    className="w-16 h-16 rounded-full bg-[#E2E8F0] items-center justify-center"
                                >
                                    {googleLoading ? (
                                        <ActivityIndicator color="#2B84B1" />
                                    ) : (
                                        <Ionicons name="logo-google" size={28} color="#2B84B1" />
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity className="w-16 h-16 rounded-full bg-[#E2E8F0] items-center justify-center">
                                    <Ionicons name="logo-apple" size={32} color="#2B84B1" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Footer */}
                        <View className="flex-row justify-center mt-8">
                            <Text className="text-[#7C8B95] font-medium">
                                Don&apos;t have an account?{" "}
                            </Text>
                            <TouchableOpacity onPress={() => router.push(requestedRole === 'provider' ? "/(auth)/register?role=provider" : "/(auth)/register")}>
                                <Text className="text-[#2B84B1] font-bold">Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
}
