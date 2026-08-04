import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { UserAvatar } from "@/src/components/UserAvatar";
import { useAuth } from "@/src/contexts/AuthContext";
import { formatCurrency } from "@/src/lib/formatters";
import {
  useGetPublicProviderProfileQuery,
  useStartProviderConversationMutation,
} from "@/src/store/services/apiSlice";

export default function ProviderProfilePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id = "" } = useLocalSearchParams<{ id?: string }>();
  const { isAuthenticated, role } = useAuth();
  const [reviewFilter, setReviewFilter] = useState(0);
  const { data, isLoading } = useGetPublicProviderProfileQuery(id, { skip: !id });
  const [startProviderConversation, { isLoading: isContactingProvider }] = useStartProviderConversationMutation();

  const provider = data?.data.provider;
  const gigs = data?.data.gigs || [];
  const performance = data?.data.performance;
  const reviews = useMemo(() => data?.data.reviews || [], [data?.data.reviews]);
  const filteredReviews = useMemo(
    () => (reviewFilter === 0 ? reviews : reviews.filter((item) => Number(item.rating || 0) === reviewFilter)),
    [reviewFilter, reviews]
  );

  if (isLoading) {
    return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator size="large" color="#2B84B1" /></View>;
  }

  if (!provider) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-8" edges={["top"]}>
        <Text className="text-[22px] font-bold text-[#1A2C42] mb-3">Provider not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-[#2B84B1] px-5 py-3 rounded-[18px]">
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const providerName = provider.name || `${provider.firstName || ""} ${provider.lastName || ""}`.trim() || "Provider";
  const primaryGigId = String(gigs[0]?.id || "");

  const handleContactProvider = async () => {
    if (!isAuthenticated) {
      Alert.alert("Sign in required", "Please sign in before contacting this professional.");
      router.push("/(auth)/login");
      return;
    }
    if (role !== "client") {
      Alert.alert("Switch to buyer mode", "Contacting professionals is available only in buyer mode.");
      return;
    }
    if (!id || !primaryGigId) {
      Alert.alert("Contact unavailable", "This provider does not have an active service to contact about yet.");
      return;
    }

    try {
      const payload = await startProviderConversation({
        providerId: id,
        gigId: primaryGigId,
      }).unwrap();
      const conversation = payload.data?.conversation;
      const conversationId = String(conversation?.id || "");
      if (!conversationId) throw new Error("Conversation could not be opened.");
      router.push({
        pathname: "/chat-details",
        params: {
          conversationId,
          name: conversation?.otherUser?.name || providerName,
          avatar: conversation?.otherUser?.avatar || provider.avatar || "",
          info: gigs[0]?.title || "Provider chat",
          targetUserId: conversation?.otherUser?.id || id,
        },
      });
    } catch (error) {
      Alert.alert("Could not contact professional", error instanceof Error ? error.message : "Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFCFD]" edges={["top"]}>
      <View className="px-6 py-4 flex-row items-center bg-white shadow-sm shadow-black/5 z-10">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-gray-50 rounded-full mr-4">
          <Ionicons name="arrow-back" size={20} color="#1A2C42" />
        </TouchableOpacity>
        <Text className="text-[20px] font-bold text-[#1A2C42] flex-1">Provider Profile</Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 20, paddingBottom: 150 }}>
        <View className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm shadow-black/5 mb-8">
          <View className="items-center">
            <UserAvatar uri={provider.avatar} size={110} className="mb-4" />
            <Text className="text-[26px] font-black text-[#1A2C42] text-center">{providerName}</Text>
            <Text className="text-[14px] font-bold text-[#2B84B1] mt-2">
              {provider.sellerLevel || provider.level || "New"} Provider
            </Text>
            <Text className="text-[14px] text-[#7C8B95] mt-3 text-center">
              {provider.location || provider.address || "Location unavailable"}
            </Text>
          </View>

          <View className="flex-row flex-wrap justify-between mt-8">
            <StatCard label="Rating" value={`${Number(provider.rating || 0).toFixed(1)}`} />
            <StatCard label="Reviews" value={`${provider.reviewCount || 0}`} />
            <StatCard label="Completed" value={`${provider.completedOrders || 0}`} />
            <StatCard label="Recommend" value={`${Math.round(Number(provider.recommendRate || provider.completionRate || 0))}%`} />
          </View>
          <TouchableOpacity
            onPress={() => void handleContactProvider()}
            disabled={isContactingProvider}
            className="mt-5 flex-row items-center justify-center rounded-[20px] bg-[#1A2C42] py-5"
          >
            {isContactingProvider ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="white" />
                <Text className="ml-2 text-white font-black text-[15px]">Contact Professional</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Section title="About">
          <Text className="text-[14px] leading-[23px] text-[#5F7182]">
            {provider.bio || "This provider has not added a public bio yet."}
          </Text>
        </Section>

        <Section title="Performance">
          <PerformanceRow label="Response Rate" value={`${Number(performance?.responseRate || 0)}%`} />
          <PerformanceRow label="Delivered On Time" value={`${Number(performance?.deliveredOnTime || 0)}%`} />
          <PerformanceRow label="Order Completion" value={`${Number(performance?.orderCompletion || 0)}%`} />
        </Section>

        <Section title={`Active Services (${gigs.length})`}>
          {gigs.length ? (
            gigs.map((gig) => (
              <TouchableOpacity
                key={gig.id || gig.title}
                onPress={() => router.push({ pathname: "/service-details", params: { id: gig.id || "" } })}
                className="flex-row items-center py-3 border-b border-gray-100"
              >
                <View className="w-[64px] h-[64px] rounded-[16px] overflow-hidden bg-gray-100 mr-4">
                  {gig.images?.[0] ? (
                    <Image source={{ uri: gig.images[0] }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <Ionicons name="image-outline" size={18} color="#94A3B8" />
                    </View>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-bold text-[#1A2C42]" numberOfLines={2}>{gig.title || "Service"}</Text>
                  <Text className="text-[12px] font-medium text-[#7C8B95] mt-1">{gig.categoryName || "Category"}</Text>
                </View>
                <Text className="text-[14px] font-black text-[#2B84B1]">
                  {formatCurrency(Number(gig.startingPrice || gig.avgPackagePrice || 0))}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text className="text-[14px] text-[#7C8B95]">No public gigs available yet.</Text>
          )}
        </Section>

        <Section title="Reviews">
          <View className="flex-row flex-wrap mb-4">
            {[0, 5, 4, 3, 2, 1].map((value) => (
              <TouchableOpacity
                key={value}
                onPress={() => setReviewFilter(value)}
                className={`px-4 py-2 rounded-full mr-2 mb-2 ${reviewFilter === value ? "bg-[#2B84B1]" : "bg-[#F3F7FA]"}`}
              >
                <Text className={`font-bold text-[12px] ${reviewFilter === value ? "text-white" : "text-[#4A5568]"}`}>
                  {value === 0 ? "All" : `${value} Star`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {filteredReviews.length ? (
            filteredReviews.map((review) => (
              <View key={review.id || review.orderId || review.gigId} className="py-4 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[15px] font-bold text-[#1A2C42]">{review.client?.name || "Client"}</Text>
                  <Text className="text-[12px] font-bold text-[#2B84B1]">{Number(review.rating || 0).toFixed(1)}</Text>
                </View>
                <Text className="text-[12px] text-[#7C8B95] mt-1">
                  {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "Recent"}
                </Text>
                <Text className="text-[14px] leading-[22px] text-[#5F7182] mt-3">
                  {review.review || "No written review."}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-[14px] text-[#7C8B95]">No reviews available for this filter.</Text>
          )}
        </Section>
      </ScrollView>
      <View
        className="absolute bottom-0 w-full bg-white px-6 pt-4 border-t border-gray-100"
        style={{ paddingBottom: Math.max(insets.bottom + 18, 28) }}
      >
        <TouchableOpacity
          onPress={() => void handleContactProvider()}
          disabled={isContactingProvider}
          className="flex-row items-center justify-center rounded-[20px] bg-[#1A2C42] py-5 shadow-sm shadow-black/10"
        >
          {isContactingProvider ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="white" />
              <Text className="ml-2 text-white font-black text-[15px]">Contact Professional</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm shadow-black/5 mb-6">
      <Text className="text-[20px] font-bold text-[#1A2C42] mb-4">{title}</Text>
      {children}
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-[48%] bg-[#F8FAFC] rounded-[18px] px-4 py-4 mb-3">
      <Text className="text-[20px] font-black text-[#1A2C42]">{value}</Text>
      <Text className="text-[11px] font-bold uppercase tracking-widest text-[#7C8B95] mt-1">{label}</Text>
    </View>
  );
}

function PerformanceRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
      <Text className="text-[14px] font-medium text-[#5F7182]">{label}</Text>
      <Text className="text-[14px] font-bold text-[#1A2C42]">{value}</Text>
    </View>
  );
}
