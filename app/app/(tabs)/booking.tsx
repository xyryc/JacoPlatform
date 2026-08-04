import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import { formatCurrency, formatDateLabel, formatStatusLabel, formatTimeLabel } from "@/src/lib/formatters";
import {
  useGetClientOrdersQuery,
  useGetClientServiceRequestsQuery,
} from "@/src/store/services/apiSlice";
import type { OrderSummary, ServiceRequestSummary } from "@/src/types/api";

const orderTabs = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending" },
  { id: "in-progress", label: "In Progress" },
  { id: "payment-pending", label: "Payment Pending" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "requested", label: "Requested Orders" },
];

const statusParamMap: Record<string, string> = {
  all: "all",
  active: "active",
  pending: "pending",
  "in-progress": "accepted",
  "payment-pending": "payment_pending",
  completed: "completed",
  cancelled: "cancelled",
  requested: "all",
};

const normalizeOrderStatus = (status: string) => {
  if (status === "accepted") return "In Progress";
  if (status === "accepting_delivery") return "Payment Pending";
  if (status === "completed") return "Completed";
  if (status === "declined") return "Cancelled";
  return formatStatusLabel(status);
};

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

const getQueryErrorMessage = (error: unknown, fallback: string) => {
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

  if (value.status === 401) return "Your session expired. Please log in again.";
  if (value.status === 403) return "This account cannot view client orders right now.";

  return fallback;
};

export default function BookingPage() {
  const router = useRouter();
  const { socket } = useSocketNotifications();
  const insets = useSafeAreaInsets();
  const tabBarHeight =
    Platform.OS === "ios" ? 65 + insets.bottom : 75 + (insets.bottom > 0 ? insets.bottom : 0);

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [requestedPage, setRequestedPage] = useState(1);

  const isRequestedTab = activeTab === "requested";
  const orderStatus = statusParamMap[activeTab] || "all";

  const {
    data: ordersData,
    isLoading: ordersLoading,
    isFetching: ordersFetching,
    error: ordersError,
    refetch: refetchOrders,
  } = useGetClientOrdersQuery(
    {
      page,
      limit: 5,
      status: orderStatus,
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
    isLoading: requestsLoading,
    isFetching: requestsFetching,
    error: requestsError,
    refetch: refetchRequests,
  } =
    useGetClientServiceRequestsQuery(
      {
        page: requestedPage,
        limit: 5,
        status: "all",
        search,
      },
      {
        refetchOnFocus: true,
        refetchOnReconnect: true,
        pollingInterval: 15000,
      }
    );

  useFocusEffect(
    useCallback(() => {
      void refetchOrders();
      void refetchRequests();
    }, [refetchOrders, refetchRequests])
  );

  useEffect(() => {
    if (!socket) return;

    const handleRealtimeRefresh = () => {
      void refetchOrders();
      void refetchRequests();
    };

    socket.on("notification:new", handleRealtimeRefresh);
    socket.on("chat:conversation:updated", handleRealtimeRefresh);

    return () => {
      socket.off("notification:new", handleRealtimeRefresh);
      socket.off("chat:conversation:updated", handleRealtimeRefresh);
    };
  }, [refetchOrders, refetchRequests, socket]);

  const sortLatestFirst = <T extends { createdAt?: string | null; id?: string; orderNumber?: string }>(items: T[]) =>
    [...items].sort((left, right) => {
      const leftTime = new Date(left.createdAt || 0).getTime();
      const rightTime = new Date(right.createdAt || 0).getTime();
      if (rightTime !== leftTime) return rightTime - leftTime;
      return String(right.orderNumber || right.id || "").localeCompare(String(left.orderNumber || left.id || ""));
    });

  const orders = useMemo(
    () => sortLatestFirst((ordersData?.data.items || []) as OrderSummary[]),
    [ordersData?.data.items]
  );
  const requests = useMemo(
    () => sortLatestFirst((requestsData?.data.items || []) as ServiceRequestSummary[]),
    [requestsData?.data.items]
  );
  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders;
    if (activeTab === "active") return orders;
    if (activeTab === "requested") return [];
    if (activeTab === "pending") return orders.filter((item) => item.status === "pending");
    if (activeTab === "in-progress") return orders.filter((item) => item.status === "accepted");
    if (activeTab === "payment-pending") return orders.filter((item) => item.status === "accepting_delivery");
    if (activeTab === "completed") return orders.filter((item) => item.status === "completed");
    if (activeTab === "cancelled") return orders.filter((item) => item.status === "declined");
    return orders;
  }, [activeTab, orders]);

  const orderSummary = useMemo(
    () => ({
      total: ordersData?.data.pagination?.totalItems || 0,
      pending: orders.filter((item) => item.status === "pending").length,
      active: orders.filter((item) =>
        [
          "pending",
          "accepted",
          "accepting_delivery",
          "revision_requested",
          "under_revision",
          "after_sell_revision_requested",
          "under_after_sell_revision",
        ].includes(item.status)
      ).length,
      completed: orders.filter((item) => item.status === "completed").length,
    }),
    [orders, ordersData?.data.pagination?.totalItems]
  );

  const currentLoading = isRequestedTab ? requestsLoading : ordersLoading;
  const currentFetching = isRequestedTab ? requestsFetching : ordersFetching;
  const currentPage = isRequestedTab ? requestedPage : page;
  const currentPagination = isRequestedTab ? requestsData?.data.pagination : ordersData?.data.pagination;
  const currentError = isRequestedTab ? requestsError : ordersError;
  const currentErrorMessage = getQueryErrorMessage(
    currentError,
    isRequestedTab
      ? "We could not load your requested orders."
      : "We could not load your orders."
  );

  return (
    <SafeAreaView className="flex-1 bg-[#FAFCFD]" edges={["top"]}>
      <View className="px-6 pt-4 pb-5 bg-white shadow-sm shadow-black/5">
        <View className="flex-row items-center">
          <View className="w-1.5 h-7 bg-[#2286BE] rounded-full mr-3" />
          <View>
            <Text className="text-[28px] font-black text-[#1A2C42]">My Orders</Text>
            <Text className="text-[14px] text-[#7C8B95] mt-1">
              Track bookings, payment states, and requested work in one place.
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
        refreshControl={
          <RefreshControl
            refreshing={currentFetching && !currentLoading}
            onRefresh={() => {
              if (isRequestedTab) {
                setRequestedPage(1);
                void refetchRequests();
              } else {
                setPage(1);
                void refetchOrders();
              }
            }}
            tintColor="#2286BE"
            colors={["#2286BE"]}
          />
        }
      >
        <View className="px-6 pt-6">
          <View className="bg-[#1A2C42] rounded-[30px] p-6 mb-6">
            <Text className="text-white/65 text-[12px] font-bold tracking-[0.18em] uppercase">Order Snapshot</Text>
            <Text className="text-white text-[34px] font-black mt-3">{orderSummary.total}</Text>
            <Text className="text-white/75 text-[14px] mt-1">Total bookings across all current filters.</Text>
            <View className="flex-row mt-6">
              {[
                { label: "Pending", value: orderSummary.pending },
                { label: "Active", value: orderSummary.active },
                { label: "Done", value: orderSummary.completed },
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
              placeholder="Search by order, service, provider..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={(text) => {
                setSearch(text);
                setPage(1);
                setRequestedPage(1);
              }}
              className="flex-1 ml-3 text-[15px] font-medium text-[#1A2C42]"
            />
          </View>
        </View>

        <View className="mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
            {orderTabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => {
                    setActiveTab(tab.id);
                    setPage(1);
                    setRequestedPage(1);
                  }}
                  className={`px-5 py-3 rounded-full mr-3 border ${active ? "bg-[#2286BE] border-[#2286BE]" : "bg-white border-gray-200"}`}
                >
                  <Text className={`font-bold text-[13px] ${active ? "text-white" : "text-[#64748B]"}`}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {currentLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#2286BE" />
          </View>
        ) : currentError ? (
          <View className="px-6">
            <EmptyState
              icon="alert-circle-outline"
              title="Could not load data"
              body={currentErrorMessage}
              ctaLabel="Try Again"
              onPress={() => {
                void refetchOrders();
                void refetchRequests();
              }}
            />
          </View>
        ) : isRequestedTab ? (
          <View className="px-6">
            {requests.length ? (
              requests.map((item) => (
                <RequestedOrderCard key={item.id} item={item} onOpenPostRequest={() => router.push("/post-request")} onOpenRequestOrOrder={(request) => {
                  const linkedOrderParam = resolveLinkedOrderParam(request.linkedOrderId, request.linkedOrderNumber);
                  if (linkedOrderParam) {
                    router.push({
                      pathname: "/booking-details",
                      params: {
                        id: linkedOrderParam,
                        role: "client",
                      },
                    });
                    return;
                  }

                  router.push("/client-requests");
                }} />
              ))
            ) : (
              <EmptyState
                icon="document-text-outline"
                title="No requested orders yet"
                body="When you post a custom request, it will appear here for tracking."
                ctaLabel="Post a Request"
                onPress={() => router.push("/post-request")}
              />
            )}
          </View>
        ) : (
          <View className="px-6">
            {filteredOrders.length ? (
              filteredOrders.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: "/booking-details", params: { id: item.id, role: "client" } })}
                  className="mb-5 border border-[#E2E8F0] rounded-[26px] overflow-hidden bg-white shadow-sm shadow-black/5"
                >
                  <View className="px-5 py-5 border-b border-[#F1F5F9] flex-row justify-between items-start">
                    <View className="flex-1 pr-3">
                      <Text className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#A0AEC0]">
                        {item.orderNumber}
                      </Text>
                      {item.isRequestedOrder ? (
                        <View className="self-start mt-2 px-3 py-1 rounded-full bg-[#FEF3C7]">
                          <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B45309]">
                            Requested Order
                          </Text>
                        </View>
                      ) : null}
                      <Text className="text-[20px] font-black text-[#1A2C42] mt-2">{item.orderName}</Text>
                      <Text className="text-[13px] font-medium text-[#7C8B95] mt-2">
                        Category: {item.categoryName || "General"}
                      </Text>
                    </View>
                    <View className="px-3 py-2 rounded-full bg-[#EAF3FA]">
                      <Text className="text-[11px] font-bold text-[#2286BE] uppercase">
                        {normalizeOrderStatus(item.status)}
                      </Text>
                    </View>
                  </View>

                  <View className="p-5">
                    <View className="flex-row items-center mb-5">
                      {item.provider.avatar ? (
                        <Image source={{ uri: item.provider.avatar }} className="w-12 h-12 rounded-full mr-4" />
                      ) : (
                        <View className="w-12 h-12 rounded-full mr-4 bg-[#EAF3FA] items-center justify-center">
                          <Ionicons name="person" size={22} color="#2286BE" />
                        </View>
                      )}
                      <View className="flex-1">
                        <Text className="text-[16px] font-bold text-[#1A2C42]">{item.provider.name}</Text>
                        <Text className="text-[13px] text-[#7C8B95] mt-1">{item.serviceAddress || "Location unavailable"}</Text>
                      </View>
                    </View>

                    <View className="flex-row">
                      <View className="flex-1 mr-3 bg-[#F8FAFC] rounded-[18px] px-4 py-4">
                        <Text className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#94A3B8]">Schedule</Text>
                        <Text className="text-[15px] font-bold text-[#1A2C42] mt-2">
                          {formatDateLabel(item.scheduledDate)}, {formatTimeLabel(item.scheduledTime)}
                        </Text>
                      </View>
                      <View className="flex-1 bg-[#F8FAFC] rounded-[18px] px-4 py-4">
                        <Text className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#94A3B8]">Amount</Text>
                        <Text className="text-[19px] font-black text-[#1A2C42] mt-2">
                          {formatCurrency(item.paymentAmount || item.packagePrice)}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row mt-5">
                      <TouchableOpacity
                        onPress={() =>
                            router.push({
                              pathname: "/chat-details",
                              params: {
                                conversationId: item.conversationId || "",
                                orderId: item.id,
                                name: item.provider.name,
                                avatar: item.provider.avatar || "",
                                info: item.orderName,
                                blockedBy: "",
                              targetUserId: item.provider.id,
                            },
                          })
                        }
                        className="flex-1 mr-3 py-4 rounded-[18px] bg-[#F8FAFC] items-center"
                      >
                        <Text className="text-[#1A2C42] font-bold">Message</Text>
                      </TouchableOpacity>
                      <View className="flex-1">
                        <TouchableOpacity
                          onPress={() =>
                            router.push({ pathname: "/booking-details", params: { id: item.id, role: "client" } })
                          }
                          className="py-4 rounded-[18px] bg-[#2286BE] items-center"
                        >
                          <Text className="text-white font-bold">Track Order</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <EmptyState
                icon="clipboard-outline"
                title="No orders found"
                body="Try a different search or browse services to place your next booking."
                ctaLabel="Browse Services"
                onPress={() => router.push("/services")}
              />
            )}
          </View>
        )}

        {currentPagination && currentPagination.totalPages > 1 ? (
          <View className="px-6 mt-3">
            <View className="bg-white border border-[#E2E8F0] rounded-[20px] px-4 py-4 flex-row items-center justify-between">
              <TouchableOpacity
                disabled={!currentPagination.hasPrevPage || currentFetching}
                onPress={() =>
                  isRequestedTab
                    ? setRequestedPage((prev) => Math.max(1, prev - 1))
                    : setPage((prev) => Math.max(1, prev - 1))
                }
                className={`px-4 py-3 rounded-[16px] ${currentPagination.hasPrevPage ? "bg-[#F8FAFC]" : "bg-[#E2E8F0]"}`}
              >
                <Text className={`font-bold ${currentPagination.hasPrevPage ? "text-[#1A2C42]" : "text-[#94A3B8]"}`}>Prev</Text>
              </TouchableOpacity>
              <Text className="text-[13px] font-bold tracking-[0.18em] uppercase text-[#64748B]">
                {currentPage} / {currentPagination.totalPages}
              </Text>
              <TouchableOpacity
                disabled={!currentPagination.hasNextPage || currentFetching}
                onPress={() =>
                  isRequestedTab ? setRequestedPage((prev) => prev + 1) : setPage((prev) => prev + 1)
                }
                className={`px-4 py-3 rounded-[16px] ${currentPagination.hasNextPage ? "bg-[#F8FAFC]" : "bg-[#E2E8F0]"}`}
              >
                <Text className={`font-bold ${currentPagination.hasNextPage ? "text-[#1A2C42]" : "text-[#94A3B8]"}`}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyState({
  icon,
  title,
  body,
  ctaLabel,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  ctaLabel: string;
  onPress: () => void;
}) {
  return (
    <View className="items-center justify-center px-8 py-20">
      <View className="w-24 h-24 rounded-full bg-[#EAF3FA] items-center justify-center mb-6">
        <Ionicons name={icon} size={42} color="#2286BE" />
      </View>
      <Text className="text-[24px] font-black text-[#1A2C42] text-center">{title}</Text>
      <Text className="text-[15px] text-[#7C8B95] text-center leading-[24px] mt-3 mb-8">{body}</Text>
      <TouchableOpacity onPress={onPress} className="bg-[#2286BE] px-8 py-4 rounded-[20px]">
        <Text className="text-white text-[16px] font-bold">{ctaLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

function RequestedOrderCard({
  item,
  onOpenPostRequest,
  onOpenRequestOrOrder,
}: {
  item: ServiceRequestSummary;
  onOpenPostRequest: () => void;
  onOpenRequestOrOrder: (item: ServiceRequestSummary) => void;
}) {
  return (
    <View className="mb-5 border border-[#E2E8F0] rounded-[26px] overflow-hidden bg-white shadow-sm shadow-black/5">
      <View className="px-5 py-5 border-b border-[#F1F5F9] flex-row justify-between items-start">
        <View className="flex-1 pr-3">
          <Text className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#A0AEC0]">
            {item.requestNumber}
          </Text>
          <View className="self-start mt-2 px-3 py-1 rounded-full bg-[#FEF3C7]">
            <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B45309]">
              Requested Order
            </Text>
          </View>
          <Text className="text-[20px] font-black text-[#1A2C42] mt-2">{item.categoryName}</Text>
          <Text className="text-[13px] font-medium text-[#7C8B95] mt-2" numberOfLines={2}>
            {item.serviceAddress}
          </Text>
        </View>
        <View className="px-3 py-2 rounded-full bg-[#EAF3FA]">
          <Text className="text-[11px] font-bold text-[#2286BE] uppercase">
            {item.acceptedAt ? "Accepted" : formatStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View className="p-5">
        <Text className="text-[14px] leading-[22px] text-[#5F7182]">{item.description}</Text>

        {item.requestSource === "custom_category" && item.pendingAdminCategoryApproval ? (
          <View className="mt-4 rounded-[18px] border border-dashed border-[#C7D2FE] bg-[#EEF2FF] px-4 py-3">
            <Text className="text-[12px] font-semibold leading-[18px] text-[#4338CA]">
              Your new category request for {item.customCategoryName || item.categoryName} is waiting for admin approval.
            </Text>
          </View>
        ) : null}

        <View className="flex-row mt-5">
          <View className="flex-1 mr-3 bg-[#F8FAFC] rounded-[18px] px-4 py-4">
            <Text className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#94A3B8]">Budget</Text>
            <Text className="text-[19px] font-black text-[#1A2C42] mt-2">{formatCurrency(item.budget)}</Text>
          </View>
          <View className="flex-1 bg-[#F8FAFC] rounded-[18px] px-4 py-4">
            <Text className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#94A3B8]">Preferred Time</Text>
            <Text className="text-[15px] font-bold text-[#1A2C42] mt-2">
              {formatDateLabel(item.preferredDate)}, {formatTimeLabel(item.preferredTime)}
            </Text>
          </View>
        </View>

        {item.acceptedProvider ? (
          <View className="flex-row items-center mt-5 bg-[#F8FAFC] rounded-[18px] px-4 py-4">
            {item.acceptedProvider.avatar ? (
              <Image source={{ uri: item.acceptedProvider.avatar }} className="w-11 h-11 rounded-full mr-3" />
            ) : (
              <View className="w-11 h-11 rounded-full mr-3 bg-[#EAF3FA] items-center justify-center">
                <Ionicons name="person" size={20} color="#2286BE" />
              </View>
            )}
            <View className="flex-1">
              <Text className="text-[15px] font-bold text-[#1A2C42]">{item.acceptedProvider.name}</Text>
              <Text className="text-[13px] text-[#7C8B95] mt-1">Accepted provider</Text>
            </View>
          </View>
        ) : null}

        <View className="flex-row mt-5">
          <TouchableOpacity
            onPress={onOpenPostRequest}
            className="flex-1 mr-3 py-4 rounded-[18px] bg-[#F8FAFC] items-center"
          >
            <Text className="text-[#1A2C42] font-bold">New Request</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onOpenRequestOrOrder(item)}
            className="flex-1 py-4 rounded-[18px] bg-[#2286BE] items-center"
          >
            <Text className="text-white font-bold">
              {resolveLinkedOrderParam(item.linkedOrderId, item.linkedOrderNumber) ? "Track Order" : "View Request"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
