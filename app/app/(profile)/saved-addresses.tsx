import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MapboxLocationPicker } from "@/src/components/MapboxLocationPicker";
import { useAuth } from "@/src/contexts/AuthContext";

export default function SavedAddressesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    const AddressCard = ({ icon, type, address, isDefault = false }: any) => (
        <View className="bg-white rounded-[24px] p-5 mb-4 border border-gray-100 flex-row items-start shadow-sm shadow-black/5">
            <View className="w-12 h-12 bg-[#EAF3FA] rounded-full items-center justify-center mr-4">
                <Ionicons name={icon} size={22} color="#2B84B1" />
            </View>
            <View className="flex-1">
                <View className="flex-row items-center mb-1">
                    <Text className="text-[16px] font-bold text-[#1A2C42] mr-2">{type}</Text>
                    {isDefault && (
                        <View className="bg-[#EAF6ED] px-2 py-0.5 rounded-md">
                            <Text className="text-[#55A06F] text-[10px] font-bold uppercase tracking-widest">Default</Text>
                        </View>
                    )}
                </View>
                <Text className="text-[14px] text-[#7C8B95] font-medium leading-[22px] mb-3">{address}</Text>
                <View className="flex-row items-center">
                    <TouchableOpacity className="mr-6">
                        <Text className="text-[#2B84B1] font-bold text-[14px]">Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Text className="text-[#FF4757] font-bold text-[14px]">Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#FAFCFD]" edges={['top']}>
            <View className="px-6 py-4 flex-row items-center bg-white shadow-sm shadow-black/5 z-10">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-gray-50 rounded-full mr-4">
                    <Ionicons name="arrow-back" size={20} color="#1A2C42" />
                </TouchableOpacity>
                <Text className="text-[20px] font-bold text-[#1A2C42]">Saved Addresses</Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
                <AddressCard
                    icon="home-outline"
                    type="Primary Address"
                    address={user?.address || "No saved address yet. Set one from Personal Information."}
                    isDefault={true}
                />
                <View className="bg-white rounded-[24px] p-5 mb-4 border border-gray-100 shadow-sm shadow-black/5">
                    <Text className="text-[16px] font-bold text-[#1A2C42] mb-2">Map Preview</Text>
                    <Text className="text-[13px] text-[#7C8B95] mb-4">Your saved address location from the profile page.</Text>
                    <MapboxLocationPicker
                        token={mapboxToken}
                        initialCenter={{
                            lat: typeof user?.locationLat === "number" ? user.locationLat : 40.7128,
                            lng: typeof user?.locationLng === "number" ? user.locationLng : -74.006,
                        }}
                        interactive={false}
                        height={220}
                        badgeText="Saved address preview"
                        loadingText="Loading address preview..."
                        fallbackHintText="Using fallback map tiles. Add EXPO_PUBLIC_MAPBOX_TOKEN for the same Mapbox styling as web."
                        onCenterChange={() => { }}
                    />
                </View>
            </ScrollView>

            <View className="absolute bottom-0 w-full bg-white px-6 pt-4 pb-10 border-t border-gray-100">
                <TouchableOpacity onPress={() => router.push("/(profile)/personal-info" as any)} className="bg-[#2B84B1] w-full py-5 rounded-[18px] items-center flex-row justify-center shadow-lg shadow-[#2B84B1]/30">
                    <Ionicons name="location-outline" size={22} color="white" />
                    <Text className="text-white font-bold text-[17px] ml-2">Manage Address</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
