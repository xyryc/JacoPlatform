import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAwareScrollView as ScrollView } from "@/src/components/KeyboardAwareScrollView";
import { useSocketNotifications } from "@/src/contexts/SocketContext";
import {
  formatCurrency,
  formatDateLabel,
  formatStatusLabel,
  formatTimeLabel,
  sortOrdersByScheduledAppointment,
} from "@/src/lib/formatters";
import {
  useAcceptProviderOrderMutation,
  useDeclineProviderOrderMutation,
  useGetProviderOrdersQuery,
  useGetProviderServiceRequestsQuery,
  useRespondToAdminServiceRequestInvitationMutation,
  useRespondProviderRevisionMutation,
} from "@/src/store/services/apiSlice";
import type { OrderSummary, ServiceRequestSummary } from "@/src/types/api";

const filters = [
  { id: "all", label: "All" },
  { id: "pending", label: "New" },
  { id: "active", label: "Active" },
  { id: "accepting_delivery", label: "Delivered" },
  { id: "completed", label: "Completed" },
  { id: "declined", label: "Cancelled" },
];

const ADMIN_INVITATION_ALREADY_HANDLED_MESSAGE = "This admin invitation is already handled.";

const getApiErrorMessage = (error: unknown) => {
  const message = (error as { data?: { message?: unknown } })?.data?.message;
  return typeof message === "string" ? message : error instanceof Error ? error.message : "Please try again.";
};

export default function ProviderOrders() {
  const router = useRouter();
  const params = useLocalSearchParams<{ status?: string }>();
  const { socket } = useSocketNotifications();
  const insets = useSafeAreaInsets();
  const tabBarHeight =
    Platform.OS === "ios" ? 65 + insets.bottom : 75 + (insets.bottom > 0 ? insets.bottom : 0);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [requestsPage, setRequestsPage] = useState(1);
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);
  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useGetProviderOrdersQuery(
    {
      page,
      limit: 8,
      status: filter,
      search,
    },
    {
      refetchOnFocus: true,
      refetchOnReconnect: true,
      pollingInterval: 15000,
    }
  );
  const {
    data: requestsData,
    refetch: refetchRequests,
  } = useGetProviderServiceRequestsQuery(
    {
      page: requestsPage,
      limit: 8,
      radiusKm: 30,
      search,
    },
    {
      refetchOnFocus: true,
      refetchOnReconnect: true,
      pollingInterval: 15000,
    }
  );
  const [acceptProviderOrder, { isLoading: accepting }] = useAcceptProviderOrderMutation();
  const [declineProviderOrder, { isLoading: declining }] = useDeclineProviderOrderMutation();
  const [respondProviderRevision, { isLoading: respondingRevision }] = useRespondProviderRevisionMutation();
  const [respondToAdminInvitation, { isLoading: respondingAdminInvitation }] =
    useRespondToAdminServiceRequestInvitationMutation();
  const orders = useMemo(
    () => sortOrdersByScheduledAppointment((data?.data.items || []) as OrderSummary[]),
    [data?.data.items]
  );
  const adminRequestedOrders = useMemo(
    () =>
      (((requestsData?.data.items || []) as ServiceRequestSummary[]).filter(
        (item) =>
          item.adminRequestedForViewer &&
          item.adminInvitationStatus === "pending" &&
          !item.assignedToOtherProvider
      ) || []),
    [requestsData?.data.items]
  );
  const pagination = data?.data.pagination;

  useEffect(() => {
    const requestedStatus = typeof params.status === "string" ? params.status : "all";
    const allowedStatuses = new Set(filters.map((item) => item.id));
    setFilter(allowedStatuses.has(requestedStatus) ? requestedStatus : "all");
    setPage(1);
  }, [params.status]);

  useFocusEffect(
    useCallback(() => {
      void refetch();
      void refetchRequests();
    }, [refetch, refetchRequests])
  );

  useEffect(() => {
    if (!socket) return;

    const handleRealtimeRefresh = (payload?: { data?: { notificationType?: string; orderId?: string } }) => {
      const notificationType = String(payload?.data?.notificationType || "");
      const relevantType =
        notificationType === "order_created" ||
        notificationType === "order_accepted" ||
        notificationType === "order_declined" ||
        notificationType === "order_delivery_submitted" ||
        notificationType === "order_revision_requested" ||
        notificationType === "order_revision_accepted" ||
        notificationType === "order_revision_declined" ||
        notificationType === "order_revision_cancelled" ||
        notificationType === "order_paid";

      const requestRelevantType =
        notificationType === "admin_service_request_invitation" ||
        notificationType === "admin_service_request_unavailable" ||
        notificationType === "service_request_negotiation_started_provider";

      if (relevantType || requestRelevantType || !notificationType) {
        void refetch();
        void refetchRequests();
      }
    };

    socket.on("notification:new", handleRealtimeRefresh);
    socket.on("chat:conversation:updated", handleRealtimeRefresh);

    return () => {
      socket.off("notification:new", handleRealtimeRefresh);
      socket.off("chat:conversation:updated", handleRealtimeRefresh);
    };
  }, [refetch, refetchRequests, socket]);

  const summary = useMemo(
    () => ({
      total: data?.data.pagination?.totalItems || 0,
      pending: orders.filter((order) => order.status === "pending").length,
      active: orders.filter((order) => order.status === "accepted").length,
      completed: orders.filter((order) => order.status === "completed").length,
    }),
    [data?.data.pagination?.totalItems, orders]
  );

  const handleAccept = async (id: string) => {
    await acceptProviderOrder(id).unwrap();
    refetch();
  };

  const handleDecline = async (id: string) => {
    await declineProviderOrder(id).unwrap();
    refetch();
  };

  const handleRevisionResponse = async (id: string, action: "accept" | "decline") => {
    await respondProviderRevision({ id, action }).unwrap();
    refetch();
  };

  const openNegotiationChat = (conversationId: string, request: ServiceRequestSummary) => {
    router.push({
      pathname: "/chat-details",
      params: {
        conversationId,
        serviceRequestId: request.id,
        requestNumber: request.requestNumber || "",
        requestCategoryName: request.categoryName || "",
        serviceAddress: request.serviceAddress || "",
        preferredDate: request.preferredDate || "",
        preferredTime: request.preferredTime || "",
        budget: String(request.budget || ""),
        name: request.client.name || "Client",
        avatar: request.client.avatar || "",
        info: request.requestNumber
          ? `${request.requestNumber} - ${request.categoryName || "Service request"}`
          : request.categoryName || "Service request",
        role: "provider",
        targetUserId: request.client.id || "",
        targetUserRole: "client",
      },
    });
  };

  const handleAdminRequestResponse = async (request: ServiceRequestSummary, action: "accept" | "decline") => {
    try {
      setActingRequestId(request.id);
      const payload = await respondToAdminInvitation({ id: request.id, action }).unwrap();
      await refetchRequests();
      if (action === "accept" && payload.data?.conversationId) {
        openNegotiationChat(payload.data.conversationId, request);
        return;
      }
    } catch (error) {
      const message = getApiErrorMessage(error);
      if (message === ADMIN_INVITATION_ALREADY_HANDLED_MESSAGE) {
        await refetchRequests();
        return;
      }
      Alert.alert("Request update failed", message);
    } finally {
      setActingRequestId(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFCFD]" edges={["top"]}>
      <View className="px-6 py-4 bg-white shadow-sm shadow-black/5 z-10 w-full">
        <Text className="text-[28px] font-black text-[#1A2C42]">Manage Orders</Text>
        <Text className="text-[14px] text-[#7C8B95] mt-1">Track incoming, active, and completed provider work.</Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => {
              setPage(1);
              void refetch();
            }}
            tintColor="#2286BE"
            colors={["#2286BE"]}
          />
        }
      >
        <View className="px-6 pt-6">
          <View className="bg-[#1A2C42] rounded-[30px] p-6 mb-6">
            <Text className="text-white/65 text-[12px] font-bold tracking-[0.18em] uppercase">Order Snapshot</Text>
            <Text className="text-white text-[34px] font-black mt-3">{summary.total}</Text>
            <Text className="text-white/75 text-[14px] mt-1">Current provider orders in your selected filters.</Text>
            <View className="flex-row mt-6">
              {[
                { label: "Pending", value: summary.pending },
                { label: "Active", value: summary.active },
                { label: "Completed", value: summary.completed },
              ].map((item) => (
                <View key={item.label} className="flex-1 bg-white/10 rounded-[18px] px-3 py-4 mr-3 last:mr-0">
                  <Text className="text-white text-[20px] font-black">{item.value}</Text>
                  <Text className="text-white/70 text-[11px] font-bold tracking-[0.12em] uppercase mt-1">
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View className="bg-white rounded-[22px] px-4 py-3 border border-gray-100 flex-row items-center mb-5">
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              value={search}
              onChangeText={(text) => {
                setSearch(text);
                setPage(1);
              }}
              placeholder="Search order, client, service..."
              placeholderTextColor="#94A3B8"
              className="flex-1 ml-3 text-[15px] font-medium text-[#1A2C42]"
            />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 18 }}>
          {filters.map((item) => {
            const active = filter === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  setFilter(item.id);
                  setPage(1);
                }}
                className={`px-5 py-3 rounded-full mr-3 border ${active ? "bg-[#2286BE] border-[#2286BE]" : "bg-white border-gray-200"}`}
              >
                <Text className={`font-bold text-[13px] ${active ? "text-white" : "text-[#64748B]"}`}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#2B84B1" />
          </View>
        ) : (
          <View className="px-6">
            {adminRequestedOrders.length ? (
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-1 pr-3">
                    <Text className="text-[18px] font-black text-[#1A2C42]">Admin Requested Orders</Text>
                    <Text className="text-[13px] text-[#7C8B95] mt-1">
                      Review admin-invited requests here without leaving Manage Orders.
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push("/(provider)/requests")}
                    className="px-4 py-2 rounded-full bg-[#EEF2FF]"
                  >
                    <Text className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#4F46E5]">View All</Text>
                  </TouchableOpacity>
                </View>

                {adminRequestedOrders.map((request) => (
                  <View
                    key={`admin-request-${request.id}`}
                    className="bg-white rounded-[28px] p-5 mb-5 border border-[#E2E8F0] shadow-sm shadow-black/5"
                  >
                    <View className="flex-row justify-between items-start mb-4">
                      <View className="flex-1 pr-3">
                        <Text className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#A0AEC0]">
                          {request.requestNumber}
                        </Text>
                        <View className="self-start mt-2 px-3 py-1 rounded-full bg-[#EEF2FF]">
                          <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#4F46E5]">
                            Admin Request
                          </Text>
                        </View>
                        <Text className="text-[20px] font-black text-[#1A2C42] mt-2">{request.categoryName}</Text>
                        <Text className="text-[13px] text-[#7C8B95] mt-2">{request.serviceAddress}</Text>
                      </View>
                      <View className="px-3 py-2 rounded-full bg-[#EEF2FF]">
                        <Text className="text-[11px] font-bold uppercase text-[#4F46E5]">Pending Review</Text>
                      </View>
                    </View>

                    <View className="bg-[#F8FAFC] rounded-[18px] px-4 py-4 mb-4">
                      <Text className="text-[14px] leading-[22px] text-[#5F7182]">{request.description}</Text>
                    </View>

                    <View className="flex-row">
                      <View className="flex-1 mr-3 bg-[#F8FAFC] rounded-[18px] px-4 py-4">
                        <Text className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#94A3B8]">Client</Text>
                        <Text className="text-[15px] font-bold text-[#1A2C42] mt-2">{request.client.name}</Text>
                      </View>
                      <View className="flex-1 bg-[#F8FAFC] rounded-[18px] px-4 py-4">
                        <Text className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#94A3B8]">Budget</Text>
                        <Text className="text-[18px] font-black text-[#1A2C42] mt-2">{formatCurrency(request.budget)}</Text>
                      </View>
                    </View>

                    <View className="bg-[#F8FAFC] rounded-[18px] px-4 py-4 mt-4">
                      <Text className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#94A3B8]">Preferred Time</Text>
                      <Text className="text-[14px] font-bold text-[#1A2C42] mt-2">
                        {formatDateLabel(request.preferredDate)} • {formatTimeLabel(request.preferredTime)}
                      </Text>
                    </View>

                    <View className="flex-row mt-5">
                      <TouchableOpacity
                        onPress={() => void handleAdminRequestResponse(request, "decline")}
                        disabled={respondingAdminInvitation && actingRequestId === request.id}
                        className="flex-1 mr-3 bg-[#F8FAFC] rounded-[18px] py-4 items-center"
                      >
                        {respondingAdminInvitation && actingRequestId === request.id ? (
                          <ActivityIndicator color="#1A2C42" />
                        ) : (
                          <Text className="font-bold text-[#1A2C42]">Decline</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => void handleAdminRequestResponse(request, "accept")}
                        disabled={respondingAdminInvitation && actingRequestId === request.id}
                        className="flex-1 bg-[#2286BE] rounded-[18px] py-4 items-center"
                      >
                        {respondingAdminInvitation && actingRequestId === request.id ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <Text className="font-bold text-white">Negotiate</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {orders.length ? (
              orders.map((order) => {
                const isRevisionRequested =
                  order.status === "revision_requested" || order.status === "after_sell_revision_requested";

                return (
                <TouchableOpacity
                  key={order.id}
                  activeOpacity={0.92}
                  onPress={() => router.push({ pathname: "/booking-details", params: { id: order.id, role: "provider" } })}
                  className="bg-white rounded-[28px] p-5 mb-5 border border-gray-100 shadow-sm shadow-black/5"
                >
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1 pr-3">
                      <Text className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#A0AEC0]">
                        {order.orderNumber}
                      </Text>
                      {order.isRequestedOrder ? (
                        <View className="self-start mt-2 px-3 py-1 rounded-full bg-[#FEF3C7]">
                          <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B45309]">
                            Requested Order
                          </Text>
                        </View>
                      ) : null}
                      <Text className="text-[20px] font-black text-[#1A2C42] mt-2" numberOfLines={2}>
                        {order.orderName}
                      </Text>
                      <Text className="text-[13px] text-[#7C8B95] mt-2">{order.categoryName}</Text>
                    </View>
                    <View className="px-3 py-2 rounded-full bg-[#EAF3FA]">
                      <Text className="text-[11px] font-bold uppercase text-[#2286BE]">{formatStatusLabel(order.status)}</Text>
                    </View>
                  </View>

                  <View className="flex-row">
                    <View className="flex-1 mr-3 bg-[#F8FAFC] rounded-[18px] px-4 py-4">
                      <Text className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#94A3B8]">Client</Text>
                      <Text className="text-[15px] font-bold text-[#1A2C42] mt-2">{order.client.name}</Text>
                    </View>
                    <View className="flex-1 bg-[#F8FAFC] rounded-[18px] px-4 py-4">
                      <Text className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#94A3B8]">Customer Pays</Text>
                      <Text className="text-[18px] font-black text-[#1A2C42] mt-2">
                        {formatCurrency(order.paymentAmount || order.packagePrice)}
                      </Text>
                    </View>
                  </View>

                  <View className="bg-[#F8FAFC] rounded-[18px] px-4 py-4 mt-4">
                    <Text className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#94A3B8]">Your Net Earning</Text>
                      <Text className="text-[18px] font-black text-[#1A2C42] mt-2">
                        {formatCurrency(order.providerEarningsAmount || order.packagePrice)}
                      </Text>
                  </View>

                  <View className="bg-[#F8FAFC] rounded-[18px] px-4 py-4 mt-4">
                    <Text className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#94A3B8]">Schedule</Text>
                    <Text className="text-[14px] font-bold text-[#1A2C42] mt-2">
                      {formatDateLabel(order.scheduledDate)} • {formatTimeLabel(order.scheduledTime)}
                    </Text>
                    <Text className="text-[13px] text-[#7C8B95] mt-2">{order.serviceAddress || "Location unavailable"}</Text>
                  </View>

                  <View className="flex-row mt-5">
                    {order.status === "pending" ? (
                      <>
                        <TouchableOpacity
                          onPress={() => void handleDecline(order.id)}
                          disabled={declining}
                          className="flex-1 mr-3 bg-[#F8FAFC] rounded-[18px] py-4 items-center"
                        >
                          {declining ? (
                            <ActivityIndicator color="#1A2C42" />
                          ) : (
                            <Text className="font-bold text-[#1A2C42]">Decline</Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => void handleAccept(order.id)}
                          disabled={accepting}
                          className="flex-1 bg-[#2286BE] rounded-[18px] py-4 items-center"
                        >
                          {accepting ? (
                            <ActivityIndicator color="white" />
                          ) : (
                            <Text className="font-bold text-white">Accept Order</Text>
                          )}
                        </TouchableOpacity>
                      </>
                    ) : isRevisionRequested ? (
                      <>
                        <TouchableOpacity
                          onPress={() => void handleRevisionResponse(order.id, "decline")}
                          disabled={respondingRevision}
                          className="flex-1 mr-3 bg-[#FFF5F5] border border-[#FECACA] rounded-[18px] py-4 items-center"
                        >
                          {respondingRevision ? (
                            <ActivityIndicator color="#B91C1C" />
                          ) : (
                            <Text className="font-bold text-[#B91C1C]">Decline Revision</Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => void handleRevisionResponse(order.id, "accept")}
                          disabled={respondingRevision}
                          className="flex-1 bg-[#2286BE] rounded-[18px] py-4 items-center"
                        >
                          {respondingRevision ? (
                            <ActivityIndicator color="white" />
                          ) : (
                            <Text className="font-bold text-white">Accept Revision</Text>
                          )}
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity
                          onPress={() =>
                            router.push({
                              pathname: "/chat-details",
                              params: {
                                conversationId: order.conversationId || "",
                                orderId: order.id,
                                name: order.client.name,
                                avatar: order.client.avatar || "",
                                info: order.orderName,
                                blockedBy: "",
                                targetUserId: order.client.id,
                              },
                            })
                          }
                          className="flex-1 mr-3 bg-[#F8FAFC] rounded-[18px] py-4 items-center"
                        >
                          <Text className="font-bold text-[#1A2C42]">Message</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => router.push({ pathname: "/(provider)/deliver-order", params: { id: order.id } } as never)}
                          className="flex-1 bg-[#2286BE] rounded-[18px] py-4 items-center"
                        >
                          <Text className="font-bold text-white">
                            {order.status === "accepted" ? "Deliver Now" : "Open Order"}
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              )})
            ) : (
              <View className="items-center justify-center py-24">
                <View className="w-24 h-24 rounded-full bg-[#EAF3FA] items-center justify-center mb-5">
                  <Ionicons name="document-text-outline" size={42} color="#2286BE" />
                </View>
                <Text className="text-[24px] font-black text-[#1A2C42]">No orders found</Text>
                <Text className="text-[15px] leading-[24px] text-[#7C8B95] text-center mt-3 max-w-[280px]">
                  New provider orders will show up here as clients book your services.
                </Text>
              </View>
            )}

            {pagination && pagination.totalPages > 1 ? (
              <View className="bg-white border border-[#E2E8F0] rounded-[20px] px-4 py-4 flex-row items-center justify-between mt-2">
                <TouchableOpacity
                  disabled={!pagination.hasPrevPage || isFetching}
                  onPress={() => setPage((prev) => Math.max(1, prev - 1))}
                  className={`px-4 py-3 rounded-[16px] ${pagination.hasPrevPage ? "bg-[#F8FAFC]" : "bg-[#E2E8F0]"}`}
                >
                  <Text className={`font-bold ${pagination.hasPrevPage ? "text-[#1A2C42]" : "text-[#94A3B8]"}`}>Prev</Text>
                </TouchableOpacity>
                <Text className="text-[13px] font-bold tracking-[0.18em] uppercase text-[#64748B]">
                  {page} / {pagination.totalPages}
                </Text>
                <TouchableOpacity
                  disabled={!pagination.hasNextPage || isFetching}
                  onPress={() => setPage((prev) => prev + 1)}
                  className={`px-4 py-3 rounded-[16px] ${pagination.hasNextPage ? "bg-[#F8FAFC]" : "bg-[#E2E8F0]"}`}
                >
                  <Text className={`font-bold ${pagination.hasNextPage ? "text-[#1A2C42]" : "text-[#94A3B8]"}`}>Next</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
