import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/contexts/AuthContext";
import { formatCurrency } from "@/src/lib/formatters";
import {
  useGetSavedServicesQuery,
  useRemoveSavedServiceMutation,
} from "@/src/store/services/apiSlice";

export default function ClientSavedServicesPage() {
  const router = useRouter();
  const { updateProfile, user } = useAuth();
  const { data, isLoading, refetch } = useGetSavedServicesQuery();
  const [removeSavedService, { isLoading: removing }] = useRemoveSavedServiceMutation();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const items = data?.data.items || [];

  const removeItem = async (gigId: string) => {
    try {
      setRemovingId(gigId);
      const payload = await removeSavedService(gigId).unwrap();
      await updateProfile(payload.data.user || { savedServiceIds: (user?.savedServiceIds || []).filter((item) => item !== gigId) });
      refetch();
    } catch (error) {
      Alert.alert("Could not remove service", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFCFD]" edges={["top"]}>
      <View className="px-6 py-4 flex-row items-center bg-white shadow-sm shadow-black/5 z-10">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-gray-50 rounded-full mr-4">
          <Ionicons name="arrow-back" size={20} color="#1A2C42" />
        </TouchableOpacity>
        <View className="flex-1 flex-row items-center justify-between">
          <Text className="text-[20px] font-bold text-[#1A2C42]">Saved Services</Text>
          <View className="bg-[#EAF3FA] px-3 py-2 rounded-full">
            <Text className="text-[#2286BE] text-[11px] font-bold uppercase tracking-[0.14em]">
              {items.length} Saved
            </Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#2286BE" size="large" /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-6">
              <View className="w-24 h-24 rounded-full bg-[#FFF1F2] items-center justify-center">
                <Ionicons name="heart-outline" size={46} color="#E11D48" />
              </View>
              <Text className="text-[24px] font-black text-[#1A2C42] mt-6 text-center">No saved services yet</Text>
              <Text className="text-[14px] text-[#7C8B95] mt-3 text-center leading-[22px]">
                Browse the marketplace and tap the heart icon to keep your favorite services here.
              </Text>
              <TouchableOpacity onPress={() => router.push("/services")} className="mt-8 bg-[#2286BE] px-8 py-4 rounded-[18px]">
                <Text className="text-white font-bold text-[15px]">Explore Services</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-white rounded-[24px] border border-gray-100 overflow-hidden mb-5 shadow-sm shadow-black/5">
              <TouchableOpacity onPress={() => router.push({ pathname: "/service-details", params: { id: item.id } })}>
                <View className="h-[180px] bg-slate-100">
                  {item.image ? <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" /> : null}
                  <View className="absolute top-4 left-4 bg-white/95 px-3 py-2 rounded-full">
                    <Text className="text-[#1A2C42] text-[12px] font-black">{formatCurrency(item.avgPackagePrice)}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => void removeItem(item.id)}
                    disabled={removing && removingId === item.id}
                    className="absolute top-4 right-4 bg-white/95 px-3 py-3 rounded-full items-center justify-center"
                  >
                    {removing && removingId === item.id ? (
                      <ActivityIndicator color="#FF4757" />
                    ) : (
                      <Ionicons name="trash-outline" size={18} color="#FF4757" />
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
              <View className="p-5">
                <TouchableOpacity
                  onPress={() => item.provider?.id ? router.push({ pathname: "/provider-profile", params: { id: item.provider.id } }) : null}
                  disabled={!item.provider?.id}
                  className="flex-row items-center mb-4"
                >
                  {item.provider?.avatar ? (
                    <Image source={{ uri: item.provider.avatar }} className="w-10 h-10 rounded-full mr-3" />
                  ) : (
                    <View className="w-10 h-10 rounded-full mr-3 bg-[#EAF3FA] items-center justify-center">
                      <Ionicons name="person" size={18} color="#2286BE" />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-[14px] font-bold text-[#1A2C42]">{item.provider?.name || "Provider"}</Text>
                    <Text className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#94A3B8]">
                      {item.provider?.sellerLevel || item.provider?.level || "Provider"}
                    </Text>
                  </View>
                  {typeof item.provider?.rating === "number" ? (
                    <View className="flex-row items-center bg-[#FFF7ED] px-3 py-1.5 rounded-full">
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text className="text-[11px] font-bold text-[#1A2C42] ml-1">{item.provider.rating.toFixed(1)}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
                <Text className="text-[18px] font-bold text-[#1A2C42]" numberOfLines={2}>{item.title}</Text>
                <Text className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#94A3B8] mt-3">
                  {item.categoryName || "General"}
                </Text>
                <View className="flex-row items-center mt-3">
                  <Ionicons name="location-outline" size={14} color="#2286BE" />
                  <Text className="text-[13px] text-[#7C8B95] ml-1">{item.baseCity || "Location unavailable"}</Text>
                </View>
                <View className="flex-row mt-5 gap-x-3">
                  <TouchableOpacity onPress={() => router.push({ pathname: "/service-details", params: { id: item.id } })} className="flex-1 bg-[#2286BE] py-4 rounded-[18px] items-center">
                    <Text className="text-white font-bold">View Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => item.provider?.id ? router.push({ pathname: "/provider-profile", params: { id: item.provider.id } }) : null}
                    disabled={!item.provider?.id}
                    className={`px-5 py-4 rounded-[18px] items-center justify-center min-w-[90px] ${
                      item.provider?.id ? "bg-[#F8FAFC]" : "bg-[#E2E8F0]"
                    }`}
                  >
                    <Text className={`font-bold ${item.provider?.id ? "text-[#1A2C42]" : "text-[#94A3B8]"}`}>Provider</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
