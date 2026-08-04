import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { skipToken } from "@reduxjs/toolkit/query";

import { MapboxLocationPicker } from "@/src/components/MapboxLocationPicker";
import { useAuth } from "@/src/contexts/AuthContext";
import { formatDeliveryTime } from "@/src/lib/deliveryTime";
import { API_BASE_URL } from "@/src/lib/env";
import { formatMilesFromKm } from "@/src/lib/distance";
import { formatCurrency, formatDateLabel } from "@/src/lib/formatters";
import {
  useGetPublicServiceByIdQuery,
  useRemoveSavedServiceMutation,
  useSaveServiceMutation,
  useStartProviderConversationMutation,
  useStartCustomOrderConversationMutation,
} from "@/src/store/services/apiSlice";

export default function ServiceDetailsPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id = "" } = useLocalSearchParams<{ id?: string }>();
  const { isAuthenticated, role, setRole, updateProfile, user } = useAuth();
  const isProviderMode = role === "provider";
  const { data, isLoading } = useGetPublicServiceByIdQuery(!id || isProviderMode ? skipToken : id);
  const [saveService, { isLoading: isSavingService }] = useSaveServiceMutation();
  const [removeSavedService, { isLoading: isRemovingSavedService }] = useRemoveSavedServiceMutation();
  const [startProviderConversation, { isLoading: isContactingProvider }] = useStartProviderConversationMutation();
  const [startCustomOrderConversation, { isLoading: isStartingCustomOrder }] = useStartCustomOrderConversationMutation();
  const service = data?.data || null;
  const [selectedMedia, setSelectedMedia] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState(0);
  const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

  const activePackage = useMemo(() => service?.packages?.[selectedPackage] || null, [selectedPackage, service]);
  const normalizeMediaUrl = (url: string) => {
    const value = String(url || "").trim();
    if (!value) return "";
    if (!API_BASE_URL) return value;
    return value.replace(/^http:\/\/(?:localhost|127\.0\.0\.1|10\.0\.2\.2):\d+/i, API_BASE_URL);
  };
  const images = useMemo(
    () => (Array.isArray(service?.images) && service.images.length ? service.images.map(normalizeMediaUrl).filter(Boolean) : []),
    [service?.images]
  );
  const videos = useMemo(
    () => (Array.isArray((service as any)?.videos) ? (service as any).videos.map(normalizeMediaUrl).filter(Boolean) : []),
    [service]
  );
  const mediaItems = useMemo(
    () => [
      ...images.map((url) => ({ type: "image" as const, url })),
      ...videos.map((url: string) => ({ type: "video" as const, url })),
    ],
    [images, videos]
  );
  const activeMedia = mediaItems[selectedMedia] || null;
  const isSaved = Boolean(user?.savedServiceIds?.includes(service?.id || ""));
  const isSaveActionLoading = isSavingService || isRemovingSavedService;
  const serviceLocation =
    typeof (service as any)?.locationLat === "number" && typeof (service as any)?.locationLng === "number"
      ? { lat: (service as any).locationLat, lng: (service as any).locationLng }
      : null;

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) return error.message;
    if (!error || typeof error !== "object") return fallback;

    const value = error as {
      status?: number | string;
      data?: { message?: string };
      error?: string;
    };

    if (typeof value.data?.message === "string" && value.data.message.trim()) {
      return value.data.message;
    }
    if (typeof value.error === "string" && value.error.trim()) {
      return value.error;
    }
    if (value.status === 404) {
      return `Contact chat API was not found on ${API_BASE_URL}. Please restart or update the backend.`;
    }

    return fallback;
  };

  const handleToggleSave = async () => {
    if (!service) return;
    if (!isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }

    try {
      if (isSaved) {
        const payload = await removeSavedService(service.id).unwrap();
        await updateProfile({
          ...(payload.data.user || {}),
          savedServiceIds: (payload.data.user?.savedServiceIds || user?.savedServiceIds || []).filter((item) => item !== service.id),
        });
      } else {
        const payload = await saveService(service.id).unwrap();
        await updateProfile(payload.data.user || { savedServiceIds: [...(user?.savedServiceIds || []), service.id] });
      }
    } catch (error) {
      Alert.alert("Could not update saved services", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const handleBookNow = async () => {
    if (!service || !activePackage) return;
    if (!isAuthenticated) {
      Alert.alert("Sign in required", "Please sign in before placing an order.");
      router.push("/(auth)/login");
      return;
    }
    if (isProviderMode) {
      Alert.alert("Switch to buyer mode", "Orders are available only in buyer mode.");
      return;
    }
    router.push({ pathname: "/book-service", params: { id: service.id, packageName: activePackage.name } });
  };

  const handleContactProfessional = async () => {
    if (!service) return;
    if (!isAuthenticated) {
      Alert.alert("Sign in required", "Please sign in before contacting this professional.");
      router.push("/(auth)/login");
      return;
    }
    if (role !== "client") {
      Alert.alert("Switch to buyer mode", "Contacting professionals from service details is available only in buyer mode.");
      return;
    }

    try {
      const payload = await startProviderConversation({
        providerId: String(service.provider.id || ""),
        gigId: String(service.id || ""),
      }).unwrap();
      const conversation = payload.data?.conversation;
      const conversationId = String(conversation?.id || "");
      if (!conversationId) {
        throw new Error("Conversation could not be opened.");
      }

      const chatParams = new URLSearchParams({
        conversationId,
        name: conversation?.otherUser?.name || service.provider.name,
        avatar: conversation?.otherUser?.avatar || service.provider.avatar || "",
        info: service.title || service.categoryName || "Provider chat",
        targetUserId: conversation?.otherUser?.id || service.provider.id,
      });
      router.push(`/chat-details?${chatParams.toString()}`);
    } catch (error) {
      Alert.alert("Could not contact professional", getErrorMessage(error, "Please try again."));
    }
  };

  const handleCustomOrder = async () => {
    if (!service) return;
    if (!isAuthenticated) {
      Alert.alert("Sign in required", "Please sign in before requesting a custom order.");
      router.push("/(auth)/login");
      return;
    }
    if (role !== "client") {
      Alert.alert("Switch to buyer mode", "Custom orders are available only in buyer mode.");
      return;
    }

    try {
      const payload = await startCustomOrderConversation({
        providerId: String(service.provider.id || ""),
        gigId: String(service.id || ""),
      }).unwrap();
      const conversationId = String((payload.data as any)?.conversation?.id || "");
      if (!conversationId) {
        throw new Error("Conversation could not be started.");
      }
      router.push({
        pathname: "/chat-details",
        params: {
          conversationId,
          name: service.provider.name,
          avatar: service.provider.avatar || "",
          info: service.categoryName || "Custom order",
          targetUserId: service.provider.id,
        },
      });
    } catch (error) {
      Alert.alert("Could not start custom order", getErrorMessage(error, "Please try again."));
    }
  };

  if (isProviderMode) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <View className="w-20 h-20 rounded-full bg-[#EAF3FA] items-center justify-center mb-6">
          <Ionicons name="swap-horizontal-outline" size={34} color="#2B84B1" />
        </View>
        <Text className="text-[24px] font-black text-[#1A2C42] text-center">Switch to buyer mode</Text>
        <Text className="text-[15px] leading-[24px] text-[#7C8B95] text-center mt-3 max-w-[320px]">
          Service browsing, contact, custom orders, and checkout are available only while you are using the buyer side.
        </Text>
        <TouchableOpacity
          onPress={async () => {
            await setRole("client");
            router.replace({ pathname: "/service-details", params: { id } });
          }}
          className="bg-[#2B84B1] px-6 py-4 rounded-[18px] mt-8"
        >
          <Text className="text-white font-bold">Switch to Buyer Mode</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace("/(provider-tabs)")} className="px-6 py-4 mt-2">
          <Text className="text-[#2B84B1] font-bold">Back to Provider Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2B84B1" />
      </View>
    );
  }

  if (!service) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <Text className="text-[18px] font-bold text-[#1A2C42] mb-2">Service not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 210 }}>
        <View className="relative w-full h-[340px] bg-slate-100">
          {activeMedia?.type === "video" ? (
            <WebView
              originWhitelist={["*"]}
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              mixedContentMode="always"
              mediaPlaybackRequiresUserAction={false}
              source={{
                html: `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body style="margin:0;background:#000;"><video src="${activeMedia.url}" controls playsinline style="width:100%;height:100vh;object-fit:contain;background:#000;"></video></body></html>`,
              }}
              className="w-full h-full bg-black"
            />
          ) : activeMedia?.url ? (
            <Image source={{ uri: activeMedia.url }} className="w-full h-full" resizeMode="cover" />
          ) : null}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-14 left-6 w-11 h-11 bg-white/20 rounded-full items-center justify-center border border-white/30"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => void handleToggleSave()}
            disabled={isSaveActionLoading}
            className="absolute top-14 right-6 w-11 h-11 bg-white/20 rounded-full items-center justify-center border border-white/30"
          >
            {isSaveActionLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Ionicons name={isSaved ? "heart" : "heart-outline"} size={22} color="white" />
            )}
          </TouchableOpacity>
        </View>

        {mediaItems.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 mt-4">
            {mediaItems.map((media, index) => (
              <TouchableOpacity
                key={`${media.url}-${index}`}
                onPress={() => setSelectedMedia(index)}
                className={`mr-3 rounded-[18px] overflow-hidden border-2 ${selectedMedia === index ? "border-[#2B84B1]" : "border-transparent"}`}
              >
                {media.type === "video" ? (
                  <View className="w-[82px] h-[82px] bg-slate-900 items-center justify-center">
                    <Ionicons name="play-circle" size={30} color="white" />
                    <Text className="mt-1 text-[10px] font-bold text-white">Video</Text>
                  </View>
                ) : (
                  <Image source={{ uri: media.url }} className="w-[82px] h-[82px]" resizeMode="cover" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}

        <View className="px-6 -mt-12">
          <View className="bg-white rounded-[24px] p-6 shadow-xl shadow-black/10 border border-gray-50">
            <View className="flex-row items-center mb-3">
              <View className="w-1.5 h-6 bg-[#2B84B1] rounded-full mr-3" />
              <Text className="text-[20px] font-bold text-[#1A2C42] flex-1">{service.title}</Text>
            </View>
            <View className="flex-row items-center mb-4">
              <TouchableOpacity onPress={() => router.push({ pathname: "/provider-profile", params: { id: service.provider.id } })}>
                <Text className="text-[16px] font-bold text-[#2B84B1]">{service.provider.name}</Text>
              </TouchableOpacity>
              <Text className="text-[13px] text-[#7C8B95] ml-2">• {service.categoryName}</Text>
            </View>
            <Text className="text-[34px] font-black text-[#2B84B1] leading-[34px]">{formatCurrency(service.avgPackagePrice)}</Text>
            <Text className="text-[13px] font-bold uppercase tracking-[0.18em] text-[#7C8B95] mt-2">Starting price</Text>

            <View className="flex-row mt-6">
              <View className="flex-1 mr-3 bg-[#F8FAFC] rounded-[18px] px-4 py-4">
                <Text className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">Rating</Text>
                <Text className="text-[22px] font-black text-[#1A2C42] mt-2">
                  {Number(service.provider.rating || 0).toFixed(1)}
                </Text>
              </View>
              <View className="flex-1 mr-3 bg-[#F8FAFC] rounded-[18px] px-4 py-4">
                <Text className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">Reviews</Text>
                <Text className="text-[22px] font-black text-[#1A2C42] mt-2">{service.reviews.length}</Text>
              </View>
              <View className="flex-1 bg-[#F8FAFC] rounded-[18px] px-4 py-4">
                <Text className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">Packages</Text>
                <Text className="text-[22px] font-black text-[#1A2C42] mt-2">{service.packages.length}</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="px-6 mt-10">
          <Text className="text-[22px] font-bold text-[#1A2C42] mb-4">About This Service</Text>
          <Text className="text-[15px] leading-[24px] text-[#7C8B95] font-medium">
            {service.description || service.provider.bio || "No description added yet."}
          </Text>
        </View>

        <View className="px-6 mt-10">
          <Text className="text-[22px] font-bold text-[#1A2C42] mb-4">Requirements</Text>
          <View className="bg-[#F8FAFC] rounded-[24px] p-5">
            <Text className="text-[15px] leading-[24px] text-[#5F7182] font-medium">
              {service.requirements || "The provider will confirm any custom requirements with you after booking."}
            </Text>
          </View>
        </View>

        <View className="px-6 mt-10">
          <Text className="text-[22px] font-bold text-[#1A2C42] mb-4">Packages</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {service.packages.map((pkg, index) => (
              <TouchableOpacity
                key={`${pkg.name}-${index}`}
                onPress={() => setSelectedPackage(index)}
                className={`mr-4 rounded-[24px] p-5 border w-[260px] ${selectedPackage === index ? "bg-[#EAF3FA] border-[#2B84B1]" : "bg-white border-gray-100"}`}
              >
                <Text className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#2B84B1] mb-2">{pkg.name}</Text>
                <Text className="text-[18px] font-bold text-[#1A2C42] mb-2">{pkg.title}</Text>
                <Text className="text-[14px] text-[#7C8B95] mb-4 leading-[22px]" numberOfLines={4}>
                  {pkg.description || "Package details will be shared after booking."}
                </Text>
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#94A3B8]">Delivery</Text>
                    <Text className="text-[14px] font-bold text-[#1A2C42] mt-2">
                      {formatDeliveryTime(pkg.deliveryTime, pkg.deliveryTimeUnit)}
                    </Text>
                  </View>
                  <Text className="text-[18px] font-black text-[#1A2C42]">{formatCurrency(pkg.price)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {serviceLocation ? (
          <View className="px-6 mt-10">
            <Text className="text-[22px] font-bold text-[#1A2C42] mb-2">Service Area</Text>
            <Text className="text-[14px] leading-[22px] text-[#7C8B95] font-medium mb-4">
              {service.baseCity || "Interactive location preview"}
            </Text>
            <MapboxLocationPicker
              token={mapboxToken}
              initialCenter={serviceLocation}
              interactive={false}
              height={240}
              badgeText="Service location preview"
              loadingText="Loading service area map..."
              fallbackHintText="Using fallback map tiles. Add EXPO_PUBLIC_MAPBOX_TOKEN for the same Mapbox styling as web."
              onCenterChange={() => {}}
            />
            <View className="mt-3 flex-row items-center rounded-[18px] bg-[#F8FAFC] px-4 py-3">
              <Ionicons name="location-outline" size={18} color="#2286BE" />
              <Text className="ml-2 flex-1 text-[13px] font-bold text-[#1A2C42]">
                {service.baseCity || "Location available"}
                {(service as any).travelRadiusKm ? ` • Within ${formatMilesFromKm((service as any).travelRadiusKm)}` : ""}
              </Text>
            </View>
          </View>
        ) : null}

        <View className="px-6 mt-12">
          <View className="flex-row items-center justify-between mb-5">
            <View className="flex-row items-center">
              <Ionicons name="star" size={16} color="#2B84B1" />
              <Text className="text-[16px] font-bold text-[#1A2C42] ml-2">
                {Number(service.provider.rating || 0).toFixed(1)}{" "}
                <Text className="text-[#7C8B95] font-normal">({service.reviews.length} reviews)</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push({ pathname: "/provider-profile", params: { id: service.provider.id } })}>
              <Text className="text-[#2B84B1] font-bold">View Provider</Text>
            </TouchableOpacity>
          </View>
          {service.reviews.length ? (
            service.reviews.map((review) => (
              <View key={review.id} className="mb-6 bg-white rounded-[22px] p-5 border border-gray-100 shadow-sm shadow-black/5">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-[16px] font-bold text-[#1A2C42]">{review.client.name}</Text>
                  <Text className="text-[13px] font-medium text-[#7C8B95]">{formatDateLabel(review.createdAt)}</Text>
                </View>
                <Text className="text-[14px] leading-[22px] text-[#7C8B95] font-medium">
                  {review.review || "No written review."}
                </Text>
              </View>
            ))
          ) : (
            <View className="bg-[#F8FAFC] rounded-[22px] p-5">
              <Text className="text-[14px] font-medium text-[#7C8B95]">No reviews yet for this service.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 w-full bg-white px-6 pt-4 border-t border-gray-100"
        style={{ paddingBottom: Math.max(insets.bottom + 18, 28) }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#94A3B8]">Selected Package</Text>
            <Text className="text-[16px] font-bold text-[#1A2C42] mt-1">{activePackage?.title || "Choose a package"}</Text>
          </View>
          <Text className="text-[22px] font-black text-[#2B84B1]">{formatCurrency(activePackage?.price || service.avgPackagePrice)}</Text>
        </View>
        <View className="flex-row">
          <TouchableOpacity
            onPress={() => void handleContactProfessional()}
            disabled={isContactingProvider}
            className="mr-3 flex-1 flex-row items-center justify-center rounded-[18px] bg-[#1A2C42] py-5"
          >
            {isContactingProvider ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="white" />
                <Text className="ml-2 text-white font-black text-[15px]">Contact</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => void handleBookNow()} className="flex-1 bg-[#2B84B1] py-5 rounded-[18px] items-center">
            <Text className="text-white font-black text-[15px]">Book Now</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => void handleCustomOrder()} disabled={isStartingCustomOrder} className="items-center pt-3">
          <Text className="text-[#2B84B1] font-bold text-[14px]">
            {isStartingCustomOrder ? "Starting custom order..." : "You can create your custom order"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
