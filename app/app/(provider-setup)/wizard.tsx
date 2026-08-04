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

export default function ProviderSetupWizard() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const totalSteps = 7;

    const nextStep = () => {
        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            // Mock finish -> Go to Dashboard (index screen inside provider-tabs)
            router.push("/(provider-tabs)" as any);
        }
    };

    const prevStep = () => {
        if (step > 1) {
            setStep(step - 1);
        } else {
            router.back();
        }
    };

    // Form States
    const [title, setTitle] = useState("");
    const [bio, setBio] = useState("");

    // Step 1: Photo
    const StepPhoto = () => (
        <View className="flex-1 items-center justify-center py-10">
            <Text className="text-[28px] font-bold text-[#1A2C42] mb-3 text-center">Add a Profile Photo</Text>
            <Text className="text-[15px] text-[#7C8B95] text-center mb-10 px-6">
                Please upload a professional portrait that clearly shows your face.
            </Text>

            <View className="relative mb-12">
                <View className="w-40 h-40 rounded-full border-4 border-dashed border-[#CBD5E1] bg-[#FAFCFD] items-center justify-center overflow-hidden">
                    <Ionicons name="camera" size={48} color="#CBD5E1" />
                </View>
                <TouchableOpacity className="absolute bottom-2 right-2 w-12 h-12 bg-[#2B84B1] rounded-full items-center justify-center border-4 border-white shadow-sm shadow-[#2B84B1]/40">
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );

    // Step 2: Info
    const StepInfo = () => (
        <View className="py-6">
            <Text className="text-[28px] font-bold text-[#1A2C42] mb-3">Professional Info</Text>
            <Text className="text-[15px] text-[#7C8B95] mb-8">
                Tell us about your professional background.
            </Text>

            <View className="mb-6">
                <Text className="text-[14px] font-bold text-[#A0AEC0] mb-2 ml-1">Professional Title</Text>
                <TextInput
                    placeholder="e.g. Senior App Developer"
                    value={title}
                    onChangeText={setTitle}
                    className="w-full h-[60px] border-2 border-[#E2E8F0] rounded-[24px] px-6 text-[16px] text-[#2D3748] font-medium bg-white"
                />
            </View>

            <View className="mb-6">
                <Text className="text-[14px] font-bold text-[#A0AEC0] mb-2 ml-1">Short Bio</Text>
                <TextInput
                    placeholder="Tell buyers about your expertise..."
                    multiline
                    numberOfLines={4}
                    value={bio}
                    onChangeText={setBio}
                    textAlignVertical="top"
                    className="w-full h-[120px] border-2 border-[#E2E8F0] rounded-[24px] px-6 py-5 text-[16px] text-[#2D3748] font-medium bg-white"
                />
            </View>

            <View className="mb-6">
                <Text className="text-[14px] font-bold text-[#A0AEC0] mb-2 ml-1">Years of Experience</Text>
                <View className="flex-row">
                    {['0-2 yrs', '3-5 yrs', '5+ yrs'].map((exp) => (
                        <TouchableOpacity key={exp} className="flex-1 py-4 border-2 border-[#E2E8F0] rounded-[16px] mr-2 items-center bg-white">
                            <Text className="font-bold text-[#7C8B95]">{exp}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );

    // Step 3: Skills
    const StepSkills = () => (
        <View className="py-6">
            <Text className="text-[28px] font-bold text-[#1A2C42] mb-3">Your Skills</Text>
            <Text className="text-[15px] text-[#7C8B95] mb-8">
                Add relevant skills to help buyers find you.
            </Text>

            <View className="flex-row flex-wrap gap-y-3 gap-x-2 mb-8">
                {['AI Automation', 'AI Agents', 'Machine Learning', 'Web Development', 'React Native', 'Data Analysis'].map((skill, index) => (
                    <TouchableOpacity key={skill} className={`px-4 py-2.5 rounded-full border-2 ${index < 3 ? 'bg-[#EAF3FA] border-[#2B84B1]' : 'border-[#E2E8F0] bg-white'}`}>
                        <Text className={`font-bold ${index < 3 ? 'text-[#2B84B1]' : 'text-[#7C8B95]'}`}>{skill}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View className="flex-row h-[60px]">
                <TextInput
                    placeholder="Add a new skill..."
                    className="flex-1 border-2 border-[#E2E8F0] rounded-l-[24px] rounded-r-none px-6 text-[16px] bg-white"
                />
                <TouchableOpacity className="w-[80px] bg-[#2B84B1] rounded-r-[24px] items-center justify-center">
                    <Text className="font-bold text-white">Add</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // Step 4: Languages
    const StepLanguages = () => (
        <View className="py-6">
            <Text className="text-[28px] font-bold text-[#1A2C42] mb-3">Languages</Text>
            <Text className="text-[15px] text-[#7C8B95] mb-8">
                What languages do you communicate in?
            </Text>

            <View className="mb-6">
                <View className="flex-row items-center justify-between p-5 border-2 border-[#E2E8F0] bg-white rounded-[24px] mb-3">
                    <View>
                        <Text className="text-[16px] font-bold text-[#1A2C42] mb-1">English</Text>
                        <Text className="text-[14px] text-[#7C8B95]">Fluent</Text>
                    </View>
                    <Ionicons name="create-outline" size={24} color="#2B84B1" />
                </View>

                <View className="flex-row items-center justify-between p-5 border-2 border-[#E2E8F0] bg-white rounded-[24px] mb-3">
                    <View>
                        <Text className="text-[16px] font-bold text-[#1A2C42] mb-1">Bangla</Text>
                        <Text className="text-[14px] text-[#7C8B95]">Native/Bilingual</Text>
                    </View>
                    <Ionicons name="create-outline" size={24} color="#2B84B1" />
                </View>
            </View>

            <TouchableOpacity className="flex-row items-center justify-center p-5 border-2 border-dashed border-[#2B84B1] rounded-[24px] bg-[#EAF3FA]">
                <Ionicons name="add-circle" size={24} color="#2B84B1" />
                <Text className="font-bold text-[#2B84B1] ml-2 text-[16px]">Add Language</Text>
            </TouchableOpacity>
        </View>
    );

    // Step 5: Portfolio
    const StepPortfolio = () => (
        <View className="py-6">
            <Text className="text-[28px] font-bold text-[#1A2C42] mb-3">Portfolio</Text>
            <Text className="text-[15px] text-[#7C8B95] mb-8">
                Showcase your past work to build trust.
            </Text>

            <TouchableOpacity className="w-full h-[200px] border-2 border-dashed border-[#E2E8F0] rounded-[24px] bg-white items-center justify-center mb-6">
                <View className="w-16 h-16 rounded-full bg-[#EAF3FA] items-center justify-center mb-3">
                    <Ionicons name="cloud-upload" size={32} color="#2B84B1" />
                </View>
                <Text className="font-bold text-[#1A2C42] text-[16px]">Upload Project Image</Text>
                <Text className="text-[#7C8B95] mt-1">JPEG, PNG up to 10MB</Text>
            </TouchableOpacity>

            <View className="mb-5">
                <Text className="text-[14px] font-bold text-[#A0AEC0] mb-2 ml-1">Project Title</Text>
                <TextInput placeholder="e.g. E-Commerce App UI" className="w-full h-[60px] border-2 border-[#E2E8F0] rounded-[24px] px-6 text-[16px] bg-white" />
            </View>

            <View className="mb-5">
                <Text className="text-[14px] font-bold text-[#A0AEC0] mb-2 ml-1">Demo/GitHub Link (Optional)</Text>
                <TextInput placeholder="https://" className="w-full h-[60px] border-2 border-[#E2E8F0] rounded-[24px] px-6 text-[16px] bg-white" />
            </View>
        </View>
    );

    // Step 6: Identity Verification
    const StepIdentity = () => (
        <View className="py-6">
            <Text className="text-[28px] font-bold text-[#1A2C42] mb-3">Verify Identity</Text>
            <Text className="text-[15px] text-[#7C8B95] mb-8">
                We need to verify your identity to ensure a safe platform.
            </Text>

            <TouchableOpacity className="flex-row items-center p-5 border-2 border-[#E2E8F0] bg-white rounded-[24px] mb-4">
                <View className="w-12 h-12 rounded-full bg-[#EAF3FA] items-center justify-center mr-4">
                    <Ionicons name="card" size={24} color="#2B84B1" />
                </View>
                <View className="flex-1">
                    <Text className="text-[16px] font-bold text-[#1A2C42] mb-1">National ID / Passport</Text>
                    <Text className="text-[13px] text-[#7C8B95]">Upload a clear photo of your ID</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center p-5 border-2 border-[#E2E8F0] bg-white rounded-[24px] mb-4">
                <View className="w-12 h-12 rounded-full bg-[#FFF0F0] items-center justify-center mr-4">
                    <Ionicons name="scan-circle" size={28} color="#FF4757" />
                </View>
                <View className="flex-1">
                    <Text className="text-[16px] font-bold text-[#1A2C42] mb-1">Selfie Verification</Text>
                    <Text className="text-[13px] text-[#FF4757] font-medium">Pending</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>
        </View>
    );

    // Step 7: Payment Setup
    const StepPayment = () => (
        <View className="py-6">
            <Text className="text-[28px] font-bold text-[#1A2C42] mb-3">Withdrawal Setup</Text>
            <Text className="text-[15px] text-[#7C8B95] mb-8">
                How would you like to get paid?
            </Text>

            <TouchableOpacity className="flex-row items-center p-5 border-2 border-[#2B84B1] bg-[#EAF3FA] rounded-[24px] mb-4 shadow-sm shadow-[#2B84B1] z-10">
                <View className="w-14 h-10 bg-white rounded border border-[#E2E8F0] items-center justify-center mr-4">
                    <Text className="font-black text-[#1A2C42] italic">Payoneer</Text>
                </View>
                <View className="flex-1">
                    <Text className="text-[16px] font-bold text-[#1A2C42] mb-1">Payoneer</Text>
                    <Text className="text-[13px] text-[#7C8B95]">Recommended for fast global transfers</Text>
                </View>
                <Ionicons name="checkmark-circle" size={28} color="#2B84B1" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center p-5 border-2 border-[#E2E8F0] bg-white rounded-[24px] mb-4">
                <View className="w-14 h-10 bg-white rounded border border-[#E2E8F0] items-center justify-center mr-4">
                    <Ionicons name="logo-paypal" size={24} color="#00457C" />
                </View>
                <View className="flex-1">
                    <Text className="text-[16px] font-bold text-[#1A2C42] mb-1">PayPal</Text>
                    <Text className="text-[13px] text-[#7C8B95]">Minimum withdrawal $20</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center p-5 border-2 border-[#E2E8F0] bg-white rounded-[24px] mb-4">
                <View className="w-14 h-10 bg-white rounded border border-[#E2E8F0] items-center justify-center mr-4">
                    <Ionicons name="home" size={20} color="#1A2C42" />
                </View>
                <View className="flex-1">
                    <Text className="text-[16px] font-bold text-[#1A2C42] mb-1">Bank Transfer</Text>
                    <Text className="text-[13px] text-[#7C8B95]">3-5 business days</Text>
                </View>
            </TouchableOpacity>
        </View>
    );

    const renderStep = () => {
        switch (step) {
            case 1: return <StepPhoto />;
            case 2: return <StepInfo />;
            case 3: return <StepSkills />;
            case 4: return <StepLanguages />;
            case 5: return <StepPortfolio />;
            case 6: return <StepIdentity />;
            case 7: return <StepPayment />;
            default: return null;
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#FAFCFD]">
            <StatusBar style="dark" />

            {/* Header / Progress */}
            <View className="px-6 py-4 bg-white shadow-sm shadow-black/5 z-10 flex-row items-center border-b border-gray-100">
                <TouchableOpacity onPress={prevStep} className="w-10 h-10 items-center justify-center bg-gray-50 rounded-full mr-4">
                    <Ionicons name="arrow-back" size={20} color="#1A2C42" />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-[13px] font-bold tracking-widest text-[#7C8B95] uppercase mb-1.5">
                        Step {step} of {totalSteps}
                    </Text>
                    <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <View
                            className="h-full bg-[#2B84B1] rounded-full"
                            style={{ width: `${(step / totalSteps) * 100}%` }}
                        />
                    </View>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
                <ScrollView className="flex-1 px-8" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                    {renderStep()}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Next / Finish Button */}
            <View className="absolute bottom-0 w-full bg-white px-6 pt-4 pb-10 border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                <TouchableOpacity
                    onPress={nextStep}
                    className="w-full h-[64px] bg-[#2B84B1] rounded-[32px] items-center justify-center shadow-lg shadow-[#2B84B1]/40"
                >
                    <Text className="text-white text-[18px] font-bold">
                        {step === totalSteps ? 'Complete Profile' : 'Continue'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
