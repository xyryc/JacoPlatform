import { ApiError } from "@/src/lib/api";
import {
    useRequestForgotPasswordOtpMutation,
    useResetForgotPasswordMutation,
    useVerifyForgotPasswordOtpMutation,
} from "@/src/store/services/apiSlice";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KeyboardAwareScrollView as ScrollView } from "@/src/components/KeyboardAwareScrollView";

type Step = "email" | "otp" | "password";

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [requestOtp] = useRequestForgotPasswordOtpMutation();
    const [verifyOtp] = useVerifyForgotPasswordOtpMutation();
    const [resetForgotPassword] = useResetForgotPasswordMutation();

    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [otpValues, setOtpValues] = useState(["", "", "", ""]);
    const [resetToken, setResetToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const otpRefs = useRef<(TextInput | null)[]>([]);

    const getErrorMessage = (error: unknown, fallback: string) => {
        if (error instanceof ApiError) return error.message;
        if (error && typeof error === "object" && "data" in error) {
            const payload = (error as { data?: { message?: string } }).data;
            if (payload?.message) return payload.message;
        }
        return fallback;
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return;
        const next = [...otpValues];
        next[index] = value;
        setOtpValues(next);
        if (value && index < otpValues.length - 1) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleSendCode = async () => {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            Alert.alert("Missing email", "Please enter your email address.");
            return;
        }

        setLoading(true);
        try {
            await requestOtp({ email: normalizedEmail }).unwrap();
            setEmail(normalizedEmail);
            setOtpValues(["", "", "", ""]);
            setResetToken("");
            setStep("otp");
            Alert.alert("Code sent", "A 4-digit OTP has been sent to your email.");
        } catch (error) {
            Alert.alert("Could not send code", getErrorMessage(error, "Please try again."));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        const otp = otpValues.join("");
        if (otp.length !== 4) {
            Alert.alert("Incomplete OTP", "Please enter the 4-digit OTP.");
            return;
        }

        setLoading(true);
        try {
            const response = await verifyOtp({ email, otp }).unwrap();
            setResetToken(response.data?.resetToken || "");
            setStep("password");
            Alert.alert("OTP verified", "Set your new password now.");
        } catch (error) {
            Alert.alert("Verification failed", getErrorMessage(error, "Please try again."));
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        const otp = otpValues.join("");

        if (newPassword.length < 8) {
            Alert.alert("Weak password", "New password must be at least 8 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert("Password mismatch", "New password and confirm password must match.");
            return;
        }

        if (!resetToken) {
            Alert.alert("Session expired", "Please verify the OTP again.");
            setStep("otp");
            return;
        }

        setLoading(true);
        try {
            await resetForgotPassword({
                email,
                otp,
                resetToken,
                newPassword,
                confirmPassword,
            }).unwrap();
            router.replace("/(auth)/reset-success");
        } catch (error) {
            Alert.alert("Reset failed", getErrorMessage(error, "Please try again."));
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!email) return;

        setLoading(true);
        try {
            await requestOtp({ email }).unwrap();
            setOtpValues(["", "", "", ""]);
            setResetToken("");
            Alert.alert("Code resent", "A new OTP has been sent to your email.");
        } catch (error) {
            Alert.alert("Could not resend", getErrorMessage(error, "Please try again."));
        } finally {
            setLoading(false);
        }
    };

    const renderEmailStep = () => (
        <>
            <View className="items-center mb-12">
                <Text className="text-[36px] font-bold text-[#2B84B1] text-center">
                    Forgot Password
                </Text>
                <Text className="text-[16px] text-[#7C8B95] text-center mt-4 leading-[24px] px-2 font-medium">
                    Enter your email address and we&apos;ll send you a 4-digit verification code
                </Text>
            </View>

            <View className="mb-10">
                <Text className="text-[15px] font-bold text-[#A0AEC0] mb-3 ml-1">
                    Email
                </Text>
                <View className="w-full h-[64px] border-2 border-[#A0AEC0] rounded-[24px] px-6 justify-center">
                    <TextInput
                        placeholder="Enter your email"
                        placeholderTextColor="#A0AEC0"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        className="text-[16px] text-[#2D3748] font-medium"
                    />
                </View>
            </View>

            <TouchableOpacity
                disabled={loading}
                onPress={handleSendCode}
                className="w-full h-[68px] bg-[#2B84B1] rounded-[34px] items-center justify-center shadow-lg shadow-[#2B84B1]/40 mb-10"
            >
                {loading ? <ActivityIndicator color="white" /> : (
                    <Text className="text-white text-[18px] font-bold">
                        SEND CODE
                    </Text>
                )}
            </TouchableOpacity>
        </>
    );

    const renderOtpStep = () => (
        <>
            <View className="items-center mb-12">
                <Text className="text-[36px] font-bold text-[#2B84B1] text-center">
                    Enter OTP
                </Text>
                <Text className="text-[16px] text-[#7C8B95] text-center mt-4 leading-[24px] px-2 font-medium">
                    We sent a 4-digit code to {email}
                </Text>
            </View>

            <View className="flex-row justify-center mb-10">
                {otpValues.map((digit, index) => (
                    <View key={index} className="mx-2">
                        <TextInput
                            ref={(ref) => {
                                otpRefs.current[index] = ref;
                            }}
                            value={digit}
                            onChangeText={(value) => handleOtpChange(index, value)}
                            onKeyPress={({ nativeEvent }) => {
                                if (nativeEvent.key === "Backspace" && !otpValues[index] && index > 0) {
                                    otpRefs.current[index - 1]?.focus();
                                }
                            }}
                            keyboardType="number-pad"
                            maxLength={1}
                            textAlign="center"
                            className="w-[56px] h-[64px] border-2 border-[#A0AEC0] rounded-[20px] text-[24px] font-bold text-[#2D3748]"
                        />
                    </View>
                ))}
            </View>

            <TouchableOpacity
                disabled={loading}
                onPress={handleVerifyCode}
                className="w-full h-[68px] bg-[#2B84B1] rounded-[34px] items-center justify-center shadow-lg shadow-[#2B84B1]/40 mb-6"
            >
                {loading ? <ActivityIndicator color="white" /> : (
                    <Text className="text-white text-[18px] font-bold">
                        VERIFY CODE
                    </Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleResendCode} className="items-center mb-4">
                <Text className="text-[#2B84B1] text-[16px] font-bold">
                    Resend Code
                </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep("email")} className="items-center">
                <Text className="text-[#7C8B95] text-[15px] font-bold">
                    Back
                </Text>
            </TouchableOpacity>
        </>
    );

    const renderPasswordStep = () => (
        <>
            <View className="items-center mb-12">
                <Text className="text-[34px] font-bold text-[#2B84B1] text-center">
                    Reset Password
                </Text>
                <Text className="text-[16px] text-[#7C8B95] text-center mt-4 leading-[24px] px-2 font-medium">
                    Enter your new password and confirm it to complete the reset
                </Text>
            </View>

            <View className="mb-6">
                <Text className="text-[15px] font-bold text-[#A0AEC0] mb-3 ml-1">
                    New Password
                </Text>
                <View className="w-full h-[64px] border-2 border-[#A0AEC0] rounded-[24px] px-6 flex-row items-center">
                    <TextInput
                        placeholder="Enter new password"
                        placeholderTextColor="#A0AEC0"
                        secureTextEntry={!showNewPassword}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        className="flex-1 text-[16px] text-[#2D3748] font-medium"
                    />
                    <TouchableOpacity onPress={() => setShowNewPassword((prev) => !prev)}>
                        <Ionicons
                            name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                            size={24}
                            color="#A0AEC0"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <View className="mb-10">
                <Text className="text-[15px] font-bold text-[#A0AEC0] mb-3 ml-1">
                    Confirm Password
                </Text>
                <View className="w-full h-[64px] border-2 border-[#A0AEC0] rounded-[24px] px-6 flex-row items-center">
                    <TextInput
                        placeholder="Confirm new password"
                        placeholderTextColor="#A0AEC0"
                        secureTextEntry={!showConfirmPassword}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        className="flex-1 text-[16px] text-[#2D3748] font-medium"
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)}>
                        <Ionicons
                            name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                            size={24}
                            color="#A0AEC0"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity
                disabled={loading}
                onPress={handleResetPassword}
                className="w-full h-[68px] bg-[#2B84B1] rounded-[34px] items-center justify-center shadow-lg shadow-[#2B84B1]/40 mb-6"
            >
                {loading ? <ActivityIndicator color="white" /> : (
                    <Text className="text-white text-[18px] font-bold">
                        RESET PASSWORD
                    </Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep("otp")} className="items-center">
                <Text className="text-[#7C8B95] text-[15px] font-bold">
                    Back
                </Text>
            </TouchableOpacity>
        </>
    );

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1 px-8"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: 40 }}
                >
                    {step === "email" && renderEmailStep()}
                    {step === "otp" && renderOtpStep()}
                    {step === "password" && renderPasswordStep()}

                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="items-center mt-6"
                    >
                        <Text className="text-[#2B84B1] text-[16px] font-bold">
                            Back to Sign In
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
