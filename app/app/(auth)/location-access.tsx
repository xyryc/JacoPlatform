import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LocationAccessScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleAllowLocation = async () => {
        setLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    "Permission Denied",
                    "We need location access to find service providers near you. Please enable it in your device settings.",
                    [{ text: "OK" }]
                );
                return;
            }

            // Permission granted, optionally get the location
            // const location = await Location.getCurrentPositionAsync({});
            // console.log("Location:", location);

            // Navigate to the main app
            router.push("/(tabs)");
        } catch (error) {
            console.error("Error requesting location:", error);
            Alert.alert("Error", "Something went wrong while requesting location access.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar style="dark" />

            <View className="flex-1 px-8 items-center justify-center">
                {/* Location Icon Circle */}
                <View className="w-[120px] h-[120px] bg-[#2B84B1] rounded-full items-center justify-center mb-12 shadow-lg shadow-[#2B84B1]/40">
                    <Ionicons name="location-outline" size={60} color="white" />
                </View>

                {/* Title */}
                <Text className="text-[28px] font-bold text-[#1A2C42] text-center mb-4">
                    Allow Location Access
                </Text>

                {/* Description */}
                <Text className="text-[16px] text-[#7C8B95] text-center leading-[24px] font-medium px-4 mb-12">
                    To help you find the best service providers near you, please share your location.
                </Text>
            </View>

            {/* Action Button */}
            <View className="px-8 pb-12">
                <TouchableOpacity
                    onPress={handleAllowLocation}
                    disabled={loading}
                    className="w-full h-[64px] bg-[#2B84B1] rounded-[18px] items-center justify-center shadow-lg shadow-[#2B84B1]/40"
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white text-[20px] font-bold">
                            Allow location access
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
