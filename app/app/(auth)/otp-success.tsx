import ImageImport from "@/assets/ImageImport";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OTPSuccessScreen() {
    const router = useRouter();
    const { role = "client" } = useLocalSearchParams<{ role?: string }>();

    const handleContinue = () => {
        router.replace(role === "provider" ? "/(auth)/login?role=provider" : "/(auth)/login");
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar style="dark" />

            <ScrollView
                className="flex-1 px-8"
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                showsVerticalScrollIndicator={false}
            >
                {/* Success Icon */}
                <View className="mb-10 items-center justify-center">
                    <Image
                        source={ImageImport.tik_mark}
                        className="w-[64px] h-[64px]"
                        resizeMode="contain"
                    />
                </View>

                {/* Text Section */}
                <View className="items-center mb-12">
                    <Text className="text-[32px] font-bold text-[#2B84B1] text-center leading-[42px]">
                        OTP Verification{"\n"}Successful
                    </Text>
                    <Text className="text-[16px] text-[#A0AEC0] text-center mt-6 font-medium">
                        Your account is verified. You can now sign in.
                    </Text>
                </View>

                {/* Action Button */}
                <TouchableOpacity
                    onPress={handleContinue}
                    className="w-full h-[60px] bg-[#2B84B1] rounded-[32px] items-center justify-center shadow-lg shadow-[#2B84B1]/40"
                >
                    <Text className="text-white text-[18px] font-bold">
                        GO TO SIGN IN
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
