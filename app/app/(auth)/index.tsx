import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/contexts/AuthContext";
import { onboardingStorage } from "@/src/lib/storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthIndex() {
    const router = useRouter();
    const { isAuthenticated, loading, role, user } = useAuth();
    const [step, setStep] = useState(1);
    const [isAccepted, setIsAccepted] = useState(false);
    const [checkingIntro, setCheckingIntro] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const routeFromSavedState = async () => {
            if (loading) return;

            if (isAuthenticated && user) {
                router.replace(role === "provider" ? "/(provider-tabs)" : "/(tabs)");
                return;
            }

            const [termsAccepted, onboardingCompleted] = await Promise.all([
                onboardingStorage.hasAcceptedTerms(),
                onboardingStorage.hasCompletedOnboarding(),
            ]);

            if (!isMounted) return;

            if (onboardingCompleted) {
                router.replace("/(auth)/login");
                return;
            }

            if (termsAccepted) {
                router.replace("/(auth)/onboarding");
                return;
            }

            setCheckingIntro(false);
        };

        void routeFromSavedState();

        return () => {
            isMounted = false;
        };
    }, [isAuthenticated, loading, role, router, user]);

    const handleNext = async () => {
        if (!isAccepted) return;

        if (step === 1) {
            setStep(2);
            setIsAccepted(false);
        } else {
            await onboardingStorage.setTermsAccepted();
            router.replace("/(auth)/onboarding");
        }
    };

    const PrivacyView = () => (
        <>
            <StatusBar style="dark" />
            <Text className="text-[28px] font-bold text-[#1A2C42] mb-6">Privacy & Policy</Text>
            <Text className="text-[18px] font-bold text-[#4A5568] mb-8">
                Last updated on <Text className="text-[#1A2C42]">23 August 2025</Text>
            </Text>

            <Text className="text-[15px] leading-[24px] text-[#7C8B95] font-medium mb-6">
                We collect personal information that you voluntarily provide to us when you register on the [app/service], express an interest in obtaining information about us or our products and services,
            </Text>

            <Text className="text-[15px] leading-[24px] text-[#7C8B95] font-medium mb-8">
                The personal information that we collect depends on the context of your interactions with us and the [app/service], the choices you make, and the products and features you use.
            </Text>

            <Text className="text-[18px] font-bold text-[#1A2C42] mb-4">1.Information we collect</Text>
            <Text className="text-[15px] leading-[24px] text-[#7C8B95] font-medium mb-8">
                The personal information that we collect depends on the context of your interactions with us and the [app/service], the choices you make, and the products and features you use.
            </Text>

            <Text className="text-[18px] font-bold text-[#1A2C42] mb-4">2.Information use collect</Text>
            <Text className="text-[15px] leading-[24px] text-[#7C8B95] font-medium mb-8">
                We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you,
            </Text>
        </>
    );

    const TermsView = () => (
        <>
            <Text className="text-[28px] font-bold text-[#1A2C42] mb-6">Terms & Condition</Text>
            <Text className="text-[18px] font-bold text-[#1A2C42] mb-4">Welcome to Services App !</Text>

            <Text className="text-[15px] leading-[22px] text-[#7C8B95] font-medium mb-8">
                Accessing or using our services, you agree to be bound by these Terms of Service. If you do not agree with any part of the terms, you must not use our services.
            </Text>

            <Text className="text-[18px] font-bold text-[#1A2C42] mb-4">2. User Responsibilities As a user, you agree to:</Text>

            <View className="mb-8">
                <View className="flex-row items-start mb-2">
                    <Text className="text-[#1A2C42] text-[18px] mr-2">•</Text>
                    <Text className="text-[15px] leading-[22px] text-[#7C8B95] font-medium flex-1">Use the service only for lawful purposes.</Text>
                </View>
                <View className="flex-row items-start mb-2">
                    <Text className="text-[#1A2C42] text-[18px] mr-2">•</Text>
                    <Text className="text-[15px] leading-[22px] text-[#7C8B95] font-medium flex-1">Provide accurate and complete information when required.</Text>
                </View>
                <View className="flex-row items-start mb-2">
                    <Text className="text-[#1A2C42] text-[18px] mr-2">•</Text>
                    <Text className="text-[15px] leading-[22px] text-[#7C8B95] font-medium flex-1">Maintain the confidentiality of your account password.</Text>
                </View>
            </View>

            <Text className="text-[18px] font-bold text-[#1A2C42] mb-4">3. Intellectual Property</Text>
            <Text className="text-[15px] leading-[22px] text-[#7C8B95] font-medium mb-8">
                All content, trademarks, and data on this service, including but not limited to text, graphics, logos, and images, are the property of [Your Company Name]
            </Text>

            <Text className="text-[18px] font-bold text-[#1A2C42] mb-4">4. Disclaimers</Text>
            <Text className="text-[15px] leading-[22px] text-[#7C8B95] font-medium mb-12">
                The service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. [Your Company Name] makes no warranties, expressed or implied, regarding the operation.
            </Text>
        </>
    );

    return (
        <SafeAreaView className="flex-1 bg-white">
            {loading || checkingIntro ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#2286BE" />
                </View>
            ) : (
            <ScrollView className="flex-1 px-8 pt-10" showsVerticalScrollIndicator={false}>
                {step === 1 ? <PrivacyView /> : <TermsView />}

                {/* Accept Row */}
                <View className="flex-row items-center mb-10">
                    <TouchableOpacity
                        onPress={() => setIsAccepted(!isAccepted)}
                        className={`w-6 h-6 rounded-md border-2 items-center justify-center mr-3 ${isAccepted ? 'bg-[#2B84B1] border-[#2B84B1]' : 'border-[#2B84B1]'}`}
                    >
                        {isAccepted && <Ionicons name="checkmark" size={16} color="white" />}
                    </TouchableOpacity>
                    <Text className="text-[16px] font-medium text-[#4A5568] ml-3">
                        Accept <Text className="text-[#2B84B1] underline">terms & conditions</Text>
                    </Text>
                </View>

                {/* Next Button */}
                <TouchableOpacity
                    onPress={handleNext}
                    style={{ opacity: isAccepted ? 1 : 0.6 }}
                    className="w-full h-[70px] rounded-[18px] border-2 border-[#2B84B1] items-center justify-center mb-12"
                >
                    <Text className="text-[#2B84B1] text-[24px] font-bold">Next</Text>
                </TouchableOpacity>
                <View className="h-4" />
            </ScrollView>
            )}
        </SafeAreaView>
    );
}
