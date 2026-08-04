import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSocketNotifications } from "@/src/contexts/SocketContext";
import { formatCurrency, formatDateLabel, formatTimeLabel } from "@/src/lib/formatters";
import { useGetClientServiceRequestsQuery, useGetConversationsQuery } from "@/src/store/services/apiSlice";

const STATUS_OPTIONS = ["all", "open", "accepted", "cancelled"] as const;

const resolveLinkedOrderParam = (value: unknown, linkedOrderNumber?: string) => {
  if (typeof linkedOrderNumber === "string" && linkedOrderNumber.trim()) {
    return linkedOrderNumber.trim();
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (value && typeof value === "object") {
    const linkedOrder = value as { _id?: string; id?: string };
    if (typeof linkedOrder._id === "string" && linkedOrder._id.trim()) return linkedOrder._id.trim();
    if (typeof linkedOrder.id === "string" && linkedOrder.id.trim()) return linkedOrder.id.trim();
  }

  return "";
};

export default function ClientRequestsPage() {
  const router = useRouter();
  const { socket } = useSocketNotifications();
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const { data, isLoading, isFetching, refetch } = useGetClientServiceRequestsQuery(
    { page: 1, limit: 20, status },
    {
      refetchOnFocus: true,
      refetchOnReconnect: true,
      pollingInterval: 15000,
    }
  );
  const { data: conversationsPayload, refetch: refetchConversations } = useGetConversationsQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: 15000,
  });
  const items = data?.data.items || [];
  const conversations = conversationsPayload?.data || [];

  useFocusEffect(
    useCallback(() => {
      void refetch();
      void refetchConversations();
    }, [refetch, refetchConversations])
  );

  useEffect(() => {
    if (!socket) return;

    const handleRealtimeRefresh = (payload?: { data?: { notificationType?: string } }) => {
      const notificationType = String(payload?.data?.notificationType || "");
      const relevantType =
        notificationType === "service_request_accepted" ||
        notificationType === "custom_category_request_approved" ||
        notificationType === "service_request_cancelled" ||
        notificationType === "service_request_negotiation_started" ||
        notificationType === "custom_order_proposal_created" ||
        notificationType === "custom_order_started" ||
        notificationType === "order_created_from_request" ||
        notificationType === "order_accepted" ||
        notificationType === "order_declined" ||
        notificationType === "order_delivery_submitted";

      if (relevantType || !notificationType) {
        void refetch();
        void refetchConversations();
      }
    };

    socket.on("notification:new", handleRealtimeRefresh);

    return () => {
      socket.off("notification:new", handleRealtimeRefresh);
    };
  }, [refetch, refetchConversations, socket]);

  return (
    <SafeAreaView className="flex-1 bg-[#FAFCFD]" edges={["top"]}>
      <View className="px-6 py-3 flex-row items-center bg-white shadow-sm shadow-black/5 z-10">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-gray-50 rounded-full mr-4">
          <Ionicons name="arrow-back" size={20} color="#1A2C42" />
        </TouchableOpacity>
        <Text className="text-[20px] font-bold text-[#1A2C42]">My Requests</Text>
      </View>
      <View className="px-6 pt-2 pb-1 flex-row items-start">
        {STATUS_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            onPress={() => setStatus(option)}
            className={`px-3 py-1 rounded-[8px] mr-2 ${status === option ? "bg-[#2286BE]" : "bg-white border border-gray-200"}`}
          >
            <Text className={`font-bold text-[11px] leading-[12px] capitalize ${status === option ? "text-white" : "text-[#1A2C42]"}`}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#2286BE" size="large" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-6 pt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={() => {
                void refetch();
                void refetchConversations();
              }}
              tintColor="#2286BE"
              colors={["#2286BE"]}
            />
          }
        >
          {items.length ? (
            items.map((item) => {
              const linkedOrderParam = resolveLinkedOrderParam(item.linkedOrderId, item.linkedOrderNumber);
              const negotiationConversation = conversations.find((conversation) => conversation.serviceRequestId === item.id);

              return (
                <View key={item.id} className="bg-white rounded-[24px] p-5 mb-5 border border-gray-100 shadow-sm shadow-gray-100">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 mr-4">
                      <Text className="text-[12px] font-bold uppercase tracking-widest text-[#A0AEC0]">{item.requestNumber}</Text>
                      <Text className="text-[18px] font-bold text-[#1A2C42] mt-2">{item.categoryName}</Text>
                      {item.requestSource === "custom_category" ? (
                        <Text className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#5B6EFF]">
                          {item.customCategoryApprovalStatus === "approved"
                            ? "Custom category approved"
                            : "Waiting for admin category approval"}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <Text className="text-[14px] text-[#7C8B95] mt-3 leading-[22px]">{item.description}</Text>
                  {item.requestSource === "custom_category" && item.pendingAdminCategoryApproval ? (
                    <View className="mt-4 rounded-[18px] border border-dashed border-[#C7D2FE] bg-[#EEF2FF] px-4 py-3">
                      <Text className="text-[12px] font-semibold leading-[18px] text-[#4338CA]">
                        Your new category request for {item.customCategoryName || item.categoryName} is waiting for admin approval.
                      </Text>
                    </View>
                  ) : null}
                  <View className="flex-row items-center mt-4">
                    <Ionicons name="location-outline" size={16} color="#94A3B8" />
                    <Text className="text-[13px] text-[#7C8B95] ml-2 flex-1">{item.serviceAddress}</Text>
                  </View>
                  <View className="flex-row justify-between mt-4">
                    <Text className="text-[13px] font-bold text-[#2286BE]">{formatCurrency(item.budget)}</Text>
                    <Text className="text-[13px] text-[#7C8B95]">{formatDateLabel(item.preferredDate)} • {formatTimeLabel(item.preferredTime)}</Text>
                  </View>
                  {item.acceptedProvider?.name ? (
                    <Text className="text-[14px] font-bold text-[#1A2C42] mt-4">Accepted By: {item.acceptedProvider.name}</Text>
                  ) : null}
                  {negotiationConversation && !linkedOrderParam ? (
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: "/chat-details",
                          params: {
                            conversationId: negotiationConversation.id,
                            name: negotiationConversation.otherUser.name,
                            avatar: negotiationConversation.otherUser.avatar || "",
                            info: negotiationConversation.orderName || negotiationConversation.categoryName || item.categoryName,
                            blockedBy: negotiationConversation.blockedBy || "",
                            targetUserId: negotiationConversation.otherUser.id,
                          },
                        })
                      }
                      className="mt-3 self-start bg-[#1A2C42] px-4 py-3 rounded-[16px]"
                    >
                      <Text className="text-white font-bold text-[13px]">Open Negotiation</Text>
                    </TouchableOpacity>
                  ) : null}
                  {linkedOrderParam ? (
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: "/booking-details",
                          params: {
                            id: linkedOrderParam,
                            role: "client",
                          },
                        })
                      }
                      className="mt-3 self-start bg-[#2286BE] px-4 py-3 rounded-[16px]"
                    >
                      <Text className="text-white font-bold text-[13px]">Track Order</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })
          ) : (
            <View className="items-center justify-center py-20">
              <Ionicons name="clipboard-outline" size={54} color="#CBD5E1" />
              <Text className="text-[20px] font-bold text-[#1A2C42] mt-4">No requests yet</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
