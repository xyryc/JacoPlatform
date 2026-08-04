import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { skipToken } from "@reduxjs/toolkit/query";

import { KeyboardAwareScrollView as ScrollView } from "@/src/components/KeyboardAwareScrollView";
import { useAuth } from "@/src/contexts/AuthContext";
import { formatMilesFromKm, milesToKm } from "@/src/lib/distance";
import { API_BASE_URL } from "@/src/lib/env";
import { formatCurrency } from "@/src/lib/formatters";
import { useAppSelector } from "@/src/store/hooks";
import { useGetPublicServicesQuery } from "@/src/store/services/apiSlice";
import type { PublicServiceCard } from "@/src/types/api";

const providerTypeOptions = ["All", "Solo", "Team"];
const ratingOptions = [
  { id: 0, label: "Any" },
  { id: 4, label: "4.0+" },
  { id: 4.5, label: "4.5+" },
];

const slugifySearchTerm = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeMediaUrl = (url?: string) => {
  const value = String(url || "").trim();
  if (!value || !API_BASE_URL) return value;
  return value.replace(/^http:\/\/(?:localhost|127\.0\.0\.1|10\.0\.2\.2):\d+/i, API_BASE_URL);
};

export default function ServicesPage() {
  const router = useRouter();
  const { role, setRole, user } = useAuth();
  const { title, categorySlug } = useLocalSearchParams<{ title?: string; categorySlug?: string }>();
  const location = useAppSelector((state) => state.location);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [providerType, setProviderType] = useState("All");
  const [minRating, setMinRating] = useState(0);

  const queryArgs = {
    page,
    limit: 8,
    radiusKm: milesToKm(location.radius),
    requireCoverage: true,
    categorySlug: categorySlug || "all",
    search,
    lat: typeof user?.locationLat === "number" ? user.locationLat : location.coordinates?.lat ?? null,
    lng: typeof user?.locationLng === "number" ? user.locationLng : location.coordinates?.lng ?? null,
  };

  const isProviderMode = role === "provider";
  const { data, isLoading, isFetching, error } = useGetPublicServicesQuery(isProviderMode ? skipToken : queryArgs);
  const rawServices = useMemo(() => ((data?.data.items || []) as PublicServiceCard[]), [data?.data.items]);
  const services = useMemo(() => {
    return rawServices.filter((item) => {
      const nextProviderType = item.expertType === "team" ? "Team" : "Solo";
      if (providerType !== "All" && providerType !== nextProviderType) return false;
      const rating = Number(item.provider.rating || 0);
      if (minRating > 0 && rating < minRating) return false;
      return true;
    });
  }, [minRating, providerType, rawServices]);
  const screenTitle = useMemo(() => title || "Services", [title]);
  const pagination = data?.data.pagination;

  if (isProviderMode) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-8" edges={["top"]}>
        <View className="w-20 h-20 rounded-full bg-[#EAF3FA] items-center justify-center mb-6">
          <Ionicons name="swap-horizontal-outline" size={34} color="#2B84B1" />
        </View>
        <Text className="text-[24px] font-black text-[#1A2C42] text-center">Switch to buyer mode</Text>
        <Text className="text-[15px] leading-[24px] text-[#7C8B95] text-center mt-3 max-w-[320px]">
          Searching and browsing services are available only while you are using the buyer side.
        </Text>
        <TouchableOpacity
          onPress={async () => {
            await setRole("client");
            router.replace("/(tabs)");
          }}
          className="bg-[#2B84B1] px-6 py-4 rounded-[18px] mt-8"
        >
          <Text className="text-white font-bold">Switch to Buyer Mode</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace("/(provider-tabs)")} className="px-6 py-4 mt-2">
          <Text className="text-[#2B84B1] font-bold">Back to Provider Dashboard</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="px-6 pt-4 pb-6 rounded-b-[30px] bg-white shadow-sm shadow-black/5">
        <View className="flex-row items-center bg-white rounded-[24px] pl-3 pr-2 py-1.5 border border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={26} color="#2B84B1" />
          </TouchableOpacity>
          <TextInput
            placeholder="Search services"
            placeholderTextColor="#A0AEC0"
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setPage(1);
            }}
            className="flex-1 text-[16px] font-medium text-[#1A2C42] px-2"
          />
          <TouchableOpacity className="bg-[#2B84B1] w-[46px] h-[46px] rounded-[16px] items-center justify-center">
            <Ionicons name="search" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View className="mt-5 bg-[#F8FAFC] rounded-[22px] px-4 py-4">
          <Text className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#94A3B8]">Search Radius</Text>
          <Text className="text-[18px] font-black text-[#1A2C42] mt-2">{location.radius} miles around {location.city}</Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 mt-6 mb-4 flex-row justify-between items-center">
          <View className="flex-row items-center">
            <View className="w-1.5 h-6 bg-[#2B84B1] rounded-full mr-3.5" />
            <Text className="text-[22px] font-bold text-[#1A2C42]">{screenTitle}</Text>
          </View>
          <Text className="text-[12px] font-bold tracking-[0.18em] uppercase text-[#7C8B95]">
            {pagination?.totalItems || services.length} results
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ paddingHorizontal: 24 }}>
          {providerTypeOptions.map((item) => {
            const active = providerType === item;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setProviderType(item)}
                className={`px-4 py-3 rounded-full mr-3 border ${active ? "bg-[#2286BE] border-[#2286BE]" : "bg-white border-gray-200"}`}
              >
                <Text className={`font-bold text-[13px] ${active ? "text-white" : "text-[#64748B]"}`}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6" contentContainerStyle={{ paddingHorizontal: 24 }}>
          {ratingOptions.map((item) => {
            const active = minRating === item.id;
            return (
              <TouchableOpacity
                key={String(item.id)}
                onPress={() => setMinRating(item.id)}
                className={`px-4 py-3 rounded-full mr-3 border ${active ? "bg-[#1A2C42] border-[#1A2C42]" : "bg-white border-gray-200"}`}
              >
                <Text className={`font-bold text-[13px] ${active ? "text-white" : "text-[#64748B]"}`}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {services.length ? (
          services.map((item) => {
            const thumbnailImage = normalizeMediaUrl(item.image);
            const thumbnailVideo = !thumbnailImage && Array.isArray(item.videos) ? normalizeMediaUrl(item.videos[0]) : "";

            return (
            <TouchableOpacity
              key={item.id}
              onPress={() => router.push({ pathname: "/service-details", params: { id: item.id } })}
              className="mb-6 mx-6 rounded-[28px] bg-white border border-gray-100 shadow-sm shadow-black/5 overflow-hidden"
            >
              <View className="relative w-full h-[220px] bg-slate-100">
                {thumbnailImage ? (
                  <Image source={{ uri: thumbnailImage }} className="w-full h-full" resizeMode="cover" />
                ) : thumbnailVideo ? (
                  <>
                    <WebView
                      originWhitelist={["*"]}
                      allowsInlineMediaPlayback
                      mixedContentMode="always"
                      mediaPlaybackRequiresUserAction={false}
                      scrollEnabled={false}
                      source={{
                        html: `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body style="margin:0;background:#000;"><video src="${thumbnailVideo}" muted playsinline preload="metadata" style="width:100%;height:100vh;object-fit:cover;background:#000;"></video></body></html>`,
                      }}
                      className="w-full h-full bg-black"
                    />
                    <View className="absolute inset-0 items-center justify-center bg-black/20">
                      <View className="h-12 w-12 rounded-full bg-white/90 items-center justify-center">
                        <Ionicons name="play" size={24} color="#2286BE" />
                      </View>
                    </View>
                  </>
                ) : (
                  <View className="w-full h-full items-center justify-center">
                    <Ionicons name="image-outline" size={42} color="#94A3B8" />
                  </View>
                )}
                <View className="absolute left-4 top-4 bg-white/95 px-3 py-2 rounded-full">
                  <Text className="text-[12px] font-black text-[#1A2C42]">{formatCurrency(item.avgPackagePrice)}</Text>
                </View>
              </View>

              <View className="p-5">
                <View className="flex-row items-center justify-between mb-3">
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: "/provider-profile", params: { id: item.provider.id } })}
                    className="flex-row items-center flex-1 pr-3"
                  >
                    {item.provider.avatar ? (
                      <Image source={{ uri: item.provider.avatar }} className="w-8 h-8 rounded-full mr-3" />
                    ) : (
                      <View className="w-8 h-8 rounded-full mr-3 bg-[#EAF3FA]" />
                    )}
                    <Text className="text-[14px] font-bold text-[#2B84B1]" numberOfLines={1}>{item.provider.name}</Text>
                  </TouchableOpacity>
                  <View className="flex-row items-center">
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text className="text-[13px] font-bold text-[#1A2C42] ml-1">{Number(item.provider.rating || 0).toFixed(1)}</Text>
                  </View>
                </View>

                <Text className="text-[18px] font-black text-[#1A2C42]" numberOfLines={2}>{item.title}</Text>
                <Text className="text-[13px] text-[#7C8B95] mt-2 font-medium">
                  {item.categoryName} • {item.expertType === "team" ? "Team" : "Solo"}
                </Text>

                <View className="flex-row items-center justify-between mt-5">
                  <View className="flex-row items-center bg-[#EAF3FA] px-3 py-2 rounded-full">
                    <Ionicons name="location-outline" size={14} color="#2286BE" />
                    <Text className="text-[12px] font-bold text-[#2286BE] ml-1">
                      {typeof item.distanceKm === "number" ? formatMilesFromKm(item.distanceKm) : "Nearby"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: "/service-details", params: { id: item.id } })}
                    className="px-4 py-3 rounded-[16px] bg-[#1A2C42]"
                  >
                    <Text className="text-white font-bold text-[13px]">View Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
            );
          })
        ) : (
          isLoading || isFetching ? (
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color="#2B84B1" />
            </View>
          ) : error ? (
            <View className="items-center justify-center px-8 py-20">
              <Text className="text-center text-[#7C8B95] font-medium mb-4">Could not load services.</Text>
            </View>
          ) : (
            <View className="items-center px-8 pt-16 pb-20">
              <Text className="text-[18px] font-bold text-[#1A2C42] mb-2">No services found</Text>
              <Text className="text-center text-[#7C8B95]">Try another category, provider type, or search term.</Text>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/post-request",
                    params: {
                      categoryName: search.trim() || title || "Custom Request",
                      categorySlug: String(categorySlug || slugifySearchTerm(search) || "custom-request"),
                    },
                  })
                }
                className="mt-5 rounded-[18px] bg-[#2286BE] px-6 py-4"
              >
                <Text className="font-bold text-white">Request Gig Instead</Text>
              </TouchableOpacity>
            </View>
          )
        )}

        {pagination && pagination.totalPages > 1 ? (
          <View className="mx-6 mt-2 mb-8 bg-white rounded-[20px] border border-gray-100 px-4 py-4 flex-row items-center justify-between">
            <TouchableOpacity
              disabled={!pagination.hasPrevPage}
              onPress={() => setPage((prev) => Math.max(1, prev - 1))}
              className={`px-4 py-3 rounded-[16px] ${pagination.hasPrevPage ? "bg-[#F8FAFC]" : "bg-[#E2E8F0]"}`}
            >
              <Text className={`font-bold ${pagination.hasPrevPage ? "text-[#1A2C42]" : "text-[#94A3B8]"}`}>Prev</Text>
            </TouchableOpacity>
            <Text className="text-[13px] font-bold tracking-[0.18em] uppercase text-[#64748B]">
              {page} / {pagination.totalPages}
            </Text>
            <TouchableOpacity
              disabled={!pagination.hasNextPage}
              onPress={() => setPage((prev) => prev + 1)}
              className={`px-4 py-3 rounded-[16px] ${pagination.hasNextPage ? "bg-[#F8FAFC]" : "bg-[#E2E8F0]"}`}
            >
              <Text className={`font-bold ${pagination.hasNextPage ? "text-[#1A2C42]" : "text-[#94A3B8]"}`}>Next</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
