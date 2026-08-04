import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatCurrency } from "@/src/lib/formatters";
import { useGetCategoriesQuery, useGetPublicServicesQuery } from "@/src/store/services/apiSlice";

export default function CategoryDetailsPage() {
  const router = useRouter();
  const { slug = "", name = "" } = useLocalSearchParams<{ slug?: string; name?: string }>();
  const { data: categoriesPayload, isLoading: loadingCategory } = useGetCategoriesQuery();
  const { data: servicesPayload, isLoading: loadingServices } = useGetPublicServicesQuery({
    page: 1,
    limit: 18,
    categorySlug: slug || "all",
  });

  const category = useMemo(() => {
    const list = categoriesPayload?.data || [];
    return list.find((item) => item.slug === slug) || null;
  }, [categoriesPayload?.data, slug]);

  const services = servicesPayload?.data.items || [];
  const title = category?.name || name || "Category";

  return (
    <SafeAreaView className="flex-1 bg-[#FAFCFD]" edges={["top"]}>
      <View className="px-6 py-4 flex-row items-center bg-white z-10 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-gray-50 rounded-full mr-4">
          <Ionicons name="arrow-back" size={20} color="#1A2C42" />
        </TouchableOpacity>
        <Text className="text-[20px] font-bold text-[#1A2C42] flex-1">{title}</Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}>
        <View className="bg-[#1A2C42] rounded-[28px] p-6 mb-8">
          <Text className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9CCAE2]">Category Overview</Text>
          <Text className="text-white text-[30px] font-black mt-3">{title}</Text>
          <Text className="text-white/75 text-[15px] mt-3 leading-[24px]">
            {category?.description || `Explore providers and services available in ${title}.`}
          </Text>
          <View className="mt-5 bg-white/10 rounded-[18px] px-4 py-3 self-start">
            <Text className="text-white font-bold text-[13px]">{services.length} services available</Text>
          </View>
        </View>

        {loadingCategory || loadingServices ? (
          <View className="py-20 items-center">
            <ActivityIndicator color="#2B84B1" size="large" />
          </View>
        ) : services.length ? (
          services.map((service) => (
            <TouchableOpacity
              key={service.id}
              onPress={() => router.push({ pathname: "/service-details", params: { id: service.id } })}
              className="bg-white rounded-[24px] p-4 border border-gray-100 mb-4"
            >
              <View className="flex-row">
                <View className="w-[110px] h-[96px] rounded-[18px] overflow-hidden bg-gray-100 mr-4">
                  {service.image ? (
                    <Image source={{ uri: service.image }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <Ionicons name="image-outline" size={24} color="#94A3B8" />
                    </View>
                  )}
                </View>
                <View className="flex-1 justify-between">
                  <View>
                    <Text className="text-[16px] font-bold text-[#1A2C42]" numberOfLines={2}>
                      {service.title}
                    </Text>
                    <Text className="text-[13px] font-medium text-[#7C8B95] mt-2">
                      {service.provider.name}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between mt-3">
                    <Text className="text-[15px] font-black text-[#2B84B1]">
                      {formatCurrency(service.avgPackagePrice)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push({ pathname: "/provider-profile", params: { id: service.provider.id } })}
                      className="px-3 py-2 rounded-full bg-[#EAF3FA]"
                    >
                      <Text className="text-[12px] font-bold text-[#2B84B1]">View Provider</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View className="bg-white rounded-[24px] p-8 border border-gray-100 items-center">
            <Ionicons name="grid-outline" size={34} color="#94A3B8" />
            <Text className="text-[18px] font-bold text-[#1A2C42] mt-4">No services yet</Text>
            <Text className="text-center text-[14px] text-[#7C8B95] mt-2">
              We could not find any published services in this category right now.
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/post-request",
                  params: {
                    categoryName: title,
                    categorySlug: slug || "",
                  },
                })
              }
              className="mt-5 rounded-[18px] bg-[#2286BE] px-6 py-4"
            >
              <Text className="font-bold text-white">Request This Service</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
