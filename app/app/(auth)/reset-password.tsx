import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KeyboardAwareScrollView as ScrollView } from "@/src/components/KeyboardAwareScrollView";

export default function ResetPasswordScreen() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = () => {
        // Handle password reset logic
        console.log("Resetting password...");
        router.push("/(auth)/reset-success");
    };

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
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 40 }}
                >
                    {/* Header Section */}
                    <View className="items-center mb-10">
                        <Text className="text-[36px] font-bold text-[#2B84B1] text-center">
                            Reset Password
                        </Text>
                        <Text className="text-[16px] text-[#7C8B95] text-center mt-4 leading-[24px] px-8 font-medium">
                            Enter new password & confirm the password to set a new password
                        </Text>
                    </View>

                    {/* Form Section */}
                    <View className="gap-y-6 overflow-visible">
                        {/* New Password Input */}
                        <View>
                            <Text className="text-[14px] font-bold text-[#A0AEC0] mb-2 ml-1">
                                New Password
                            </Text>
                            <View className="w-full h-[64px] border-2 border-[#A0AEC0] rounded-[24px] px-6 flex-row items-center">
                                <TextInput
                                    placeholder="Enter new password"
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

                        {/* Confirm Password Input */}
                        <View>
                            <Text className="text-[14px] font-bold text-[#A0AEC0] mb-2 ml-1">
                                Confirm Password
                            </Text>
                            <View className="w-full h-[64px] border-2 border-[#A0AEC0] rounded-[24px] px-6 flex-row items-center">
                                <TextInput
                                    placeholder="Confirm password"
                                    placeholderTextColor="#A0AEC0"
                                    secureTextEntry={!showConfirmPassword}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    className="flex-1 text-[16px] text-[#2D3748] font-medium"
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <Ionicons
                                        name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                                        size={24}
                                        color="#A0AEC0"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={handleSubmit}
                            className="w-full h-[68px] bg-[#2B84B1] rounded-[34px] items-center justify-center shadow-lg shadow-[#2B84B1]/40 mt-6"
                        >
                            <Text className="text-white text-[18px] font-bold">
                                SUBMIT
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
