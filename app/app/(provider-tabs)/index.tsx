import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Platform, RefreshControl, ScrollView, Share, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/contexts/AuthContext";
import { useSocketNotifications } from "@/src/contexts/SocketContext";
import { UserAvatar } from "@/src/components/UserAvatar";
import { formatCurrency } from "@/src/lib/formatters";
import {
  useAcceptProviderOrderMutation,
  useCreateProviderAvailabilityBlockMutation,
  useDeleteProviderAvailabilityBlockMutation,
  useGetProviderAvailabilityBlocksQuery,
  useDeclineProviderOrderMutation,
  useGetProviderDashboardQuery,
  useGetProviderOrdersQuery,
} from "@/src/store/services/apiSlice";

const quickActions = [
  { label: "Create Gig", icon: "add", color: "#2B84B1", route: "/(provider)/create-service" },
  { label: "Orders", icon: "bar-chart", color: "#8B5CF6", route: "/(provider-tabs)/orders" },
  { label: "Messages", icon: "chatbubble", color: "#55A06F", route: "/(provider-tabs)/messages" },
  { label: "Requests", icon: "document-text", color: "#F59E0B", route: "/(provider)/requests" },
];

const formatRelativeTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDaysKey = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateKey(date);
};

const formatAvailabilityLabel = (block: any) => {
  const repeat = block.recurrence === "weekly" ? " weekly" : "";
  if (block.scope === "full_day") return `Full day off${repeat}`;
  return `${block.startTime || "Start"} - ${block.endTime || "End"}${repeat}`;
};

const ACTIVE_BOOKING_STATUSES = new Set([
  "accepted",
  "accepting_delivery",
  "revision_requested",
  "under_revision",
  "after_sell_revision_requested",
  "under_after_sell_revision",
  "done_after_sell_revision",
]);

const parseDateKey = (dateKey: string) => {
  const [year, month, day] = String(dateKey || "").split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const getOrderDateKey = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return toDateKey(date);
};

const blockAppliesToDate = (block: any, dateKey: string) => {
  if (block.dateKey === dateKey) return true;
  if (block.recurrence !== "weekly") return false;
  const startDate = parseDateKey(block.dateKey);
  const targetDate = parseDateKey(dateKey);
  return Boolean(startDate && targetDate && targetDate >= startDate && targetDate.getDay() === startDate.getDay());
};

const monthTitle = (date: Date) =>
  date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

const buildCalendarDays = (monthDate: Date) => {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      date,
      key: toDateKey(date),
      isCurrentMonth: date.getMonth() === monthDate.getMonth(),
      isToday: toDateKey(date) === toDateKey(new Date()),
    };
  });
};

export default function SellerDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { notifications, unreadCount } = useSocketNotifications();
  const insets = useSafeAreaInsets();
  const tabBarHeight =
    Platform.OS === "ios" ? 65 + insets.bottom : 75 + (insets.bottom > 0 ? insets.bottom : 0);
  const {
    data,
    error: dashboardError,
    isFetching: dashboardFetching,
    isLoading: dashboardLoading,
    refetch,
  } = useGetProviderDashboardQuery(undefined, {
    skip: authLoading,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
  const calendarRange = useMemo(
    () => ({
      from: calendarDays[0]?.key || addDaysKey(0),
      to: calendarDays[calendarDays.length - 1]?.key || addDaysKey(60),
    }),
    [calendarDays]
  );
  const {
    data: availabilityData,
    isFetching: availabilityFetching,
    refetch: refetchAvailability,
  } = useGetProviderAvailabilityBlocksQuery(
    {
      from: calendarRange.from,
      to: calendarRange.to,
    },
    {
      skip: authLoading,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );
  const {
    data: providerOrdersData,
    isFetching: providerOrdersFetching,
    refetch: refetchProviderOrders,
  } = useGetProviderOrdersQuery(
    {
      page: 1,
      limit: 100,
      search: "",
      status: "all",
    },
    {
      skip: authLoading,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );
  const [acceptOrder, { isLoading: accepting }] = useAcceptProviderOrderMutation();
  const [declineOrder, { isLoading: declining }] = useDeclineProviderOrderMutation();
  const [createAvailabilityBlock, { isLoading: creatingBlock }] = useCreateProviderAvailabilityBlockMutation();
  const [deleteAvailabilityBlock, { isLoading: deletingBlock }] = useDeleteProviderAvailabilityBlockMutation();
  const [blockScope, setBlockScope] = useState<"time_slot" | "full_day">("time_slot");
  const [blockDateKey, setBlockDateKey] = useState(addDaysKey(0));
  const [blockStartTime, setBlockStartTime] = useState("09:00");
  const [blockEndTime, setBlockEndTime] = useState("12:00");
  const [blockNote, setBlockNote] = useState("");
  const [blockRecursWeekly, setBlockRecursWeekly] = useState(false);
  const dashboard = data?.data;
  const refetchMarkerRef = useRef("");
  const latestNotification = notifications[0];
  const availabilityBlocks = useMemo(() => availabilityData?.data?.items || [], [availabilityData?.data?.items]);

  const bookedJobs = useMemo(() => {
    const todayKey = toDateKey(new Date());
    return ((providerOrdersData?.data?.items || []) as any[])
      .filter((order) => {
        const dateKey = getOrderDateKey(order.scheduledDate);
        return Boolean(dateKey && dateKey >= todayKey && ACTIVE_BOOKING_STATUSES.has(String(order.status || "")));
      })
      .sort((a, b) => {
        const dateCompare = getOrderDateKey(a.scheduledDate).localeCompare(getOrderDateKey(b.scheduledDate));
        if (dateCompare !== 0) return dateCompare;
        return String(a.scheduledTime || "").localeCompare(String(b.scheduledTime || ""));
      });
  }, [providerOrdersData?.data?.items]);

  const bookedJobsByDate = useMemo(() => {
    return bookedJobs.reduce<Record<string, any[]>>((acc, job) => {
      const dateKey = getOrderDateKey(job.scheduledDate);
      if (!dateKey) return acc;
      acc[dateKey] = [...(acc[dateKey] || []), job];
      return acc;
    }, {});
  }, [bookedJobs]);

  const availabilityByDate = useMemo(() => {
    return calendarDays.reduce<Record<string, any[]>>((acc, day) => {
      const blocks = availabilityBlocks.filter((block: any) => blockAppliesToDate(block, day.key));
      if (blocks.length) acc[day.key] = blocks;
      return acc;
    }, {});
  }, [availabilityBlocks, calendarDays]);

  const selectedDateBlocks = availabilityByDate[blockDateKey] || [];
  const selectedDateJobs = bookedJobsByDate[blockDateKey] || [];
  const initialLoading = authLoading || (dashboardLoading && !dashboard);
  const refreshing = dashboardFetching || availabilityFetching || providerOrdersFetching;
  const hasDashboardError = Boolean(dashboardError && !dashboard);

  const refetchAll = useCallback(() => {
    if (authLoading) return;
    void refetch();
    void refetchAvailability();
    void refetchProviderOrders();
  }, [authLoading, refetch, refetchAvailability, refetchProviderOrders]);

  const statCards = [
    {
      label: "Active Orders",
      value: String(dashboard?.orders?.activeOrders || 0),
      icon: "briefcase-outline",
      color: "#2B84B1",
      route: { pathname: "/(provider-tabs)/orders", params: { status: "active" } },
    },
    {
      label: "Pending Orders",
      value: String(dashboard?.orders?.pendingOrders || 0),
      icon: "time-outline",
      color: "#F59E0B",
      route: { pathname: "/(provider-tabs)/orders", params: { status: "pending" } },
    },
    {
      label: "Completed",
      value: String(dashboard?.orders?.completedOrders || 0),
      icon: "checkmark-circle-outline",
      color: "#10B981",
      route: { pathname: "/(provider-tabs)/orders", params: { status: "completed" } },
    },
    {
      label: "Rating",
      value: Number(dashboard?.ratings?.averageRating || 0).toFixed(1),
      icon: "star-outline",
      color: "#8B5CF6",
      route: { pathname: "/(provider)/reviews" },
    },
  ];

  const requests = useMemo(
    () =>
      (dashboard?.pendingRequests || []).slice(0, 2).map((request: any) => ({
        id: String(request.id || request.orderId || request.orderNumber || ""),
        title: String(request.title || request.orderName || "Service order"),
        category: String(request.category || request.categoryName || "General"),
        customer: String(request.customer || request.client?.name || "Client"),
        address: String(request.address || request.serviceAddress || request.location || "Location not set"),
        time: String(request.time || request.createdAt || ""),
        avatar: String(request.avatar || request.client?.avatar || ""),
      })),
    [dashboard?.pendingRequests]
  );

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Check out ${user?.firstName || "this provider"} on Jacob.`,
      });
    } catch {
      // ignore share dismissal
    }
  };

  const handleAction = async (id: string, action: "accept" | "decline") => {
    try {
      if (action === "accept") {
        await acceptOrder(id).unwrap();
      } else {
        await declineOrder(id).unwrap();
      }
      await refetch();
    } catch (error) {
      Alert.alert(`${action === "accept" ? "Accept" : "Decline"} failed`, error instanceof Error ? error.message : "Please try again.");
    }
  };

  const handleCreateAvailabilityBlock = async () => {
    try {
      await createAvailabilityBlock({
        dateKey: blockDateKey,
        scope: blockScope,
        startTime: blockScope === "time_slot" ? blockStartTime : "",
        endTime: blockScope === "time_slot" ? blockEndTime : "",
        note: blockNote.trim(),
        recurrence: blockRecursWeekly ? "weekly" : "none",
      }).unwrap();
      setBlockNote("");
      Alert.alert("Availability updated", "Blocked time was added to your provider calendar.");
    } catch (error: any) {
      Alert.alert("Block failed", error?.data?.message || error?.message || "Please check the date and time.");
    }
  };

  const handleDeleteAvailabilityBlock = async (id: string) => {
    try {
      await deleteAvailabilityBlock(id).unwrap();
    } catch (error: any) {
      Alert.alert("Remove failed", error?.data?.message || error?.message || "Please try again.");
    }
  };

  useEffect(() => {
    if (!latestNotification) return;
    const notificationType = String((latestNotification.data || {})?.notificationType || "");
    if (notificationType !== "order_created") return;
    if (refetchMarkerRef.current === latestNotification.id) return;
    refetchMarkerRef.current = latestNotification.id;
    void refetch();
  }, [latestNotification, refetch]);

  useFocusEffect(
    useCallback(() => {
      refetchAll();
    }, [refetchAll])
  );

  return (
    <SafeAreaView className="flex-1 bg-[#FAFCFD]" edges={["top"]}>
      <View className="px-6 py-4 flex-row justify-between items-center bg-white shadow-sm shadow-black/5 z-10 w-full">
        <View className="flex-row items-center">
          <View className="relative mr-3">
            <UserAvatar uri={user?.avatar} size={56} borderColor="#F3F4F6" />
            <View className="absolute bottom-0 right-0 w-4 h-4 bg-[#55A06F] rounded-full border-2 border-white" />
          </View>
          <View>
            <Text className="text-[13px] text-[#7C8B95] font-bold tracking-wide">Good Morning,</Text>
            <Text className="text-[20px] font-black text-[#1A2C42]">{user?.firstName || "Provider"}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push("/notifications")} className="w-12 h-12 bg-gray-50 rounded-full items-center justify-center relative border border-gray-100">
          <Ionicons name="notifications-outline" size={24} color="#1A2C42" />
          {unreadCount ? <View className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> : null}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
        refreshControl={<RefreshControl refreshing={refreshing && !initialLoading} onRefresh={refetchAll} tintColor="#2B84B1" />}
      >
        {initialLoading ? (
          <View className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm shadow-black/5 mb-6 items-center">
            <ActivityIndicator color="#2B84B1" />
            <Text className="text-[14px] font-bold text-[#7C8B95] mt-3">Loading provider dashboard...</Text>
          </View>
        ) : null}

        {hasDashboardError ? (
          <View className="bg-[#FEF2F2] rounded-[28px] p-6 border border-[#FECACA] mb-6">
            <Text className="text-[18px] font-black text-[#991B1B]">Dashboard data did not load</Text>
            <Text className="text-[14px] leading-[22px] text-[#B91C1C] mt-2">
              Check backend connection and pull down to retry.
            </Text>
            <TouchableOpacity onPress={refetchAll} className="mt-4 self-start bg-[#DC2626] rounded-[16px] px-5 py-3">
              <Text className="text-white font-black">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View className="bg-[#1A2C42] rounded-[32px] p-6 mb-8">
          <Text className="text-white/70 text-[14px] font-bold mb-1 tracking-widest uppercase">Net Income</Text>
          <Text className="text-white text-[42px] font-black tracking-tight">{formatCurrency(dashboard?.revenue?.totalEarnings || 0)}</Text>
          <Text className="text-white/70 text-[14px] mt-2">Seller level: {(dashboard?.sellerLevel || user?.sellerLevel || "new").toUpperCase()}</Text>
          <View className="flex-row items-center justify-between bg-white/10 p-4 rounded-[20px] border border-white/10 mt-6">
            <View>
              <Text className="text-white/60 text-[12px] font-bold mb-1 uppercase">Available</Text>
              <Text className="text-white text-[18px] font-bold">{formatCurrency(dashboard?.revenue?.walletBalance || 0)}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(provider)/earnings" as never)} className="ml-auto bg-[#2B84B1] px-5 py-2.5 rounded-full">
              <Text className="text-white font-bold text-[13px]">Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row mb-8">
          <TouchableOpacity onPress={() => void handleShareProfile()} className="flex-1 mr-3 bg-white border border-gray-200 rounded-[18px] py-4 items-center">
            <Text className="font-bold text-[#1A2C42]">Share Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(provider)/create-service" as never)} className="flex-1 bg-[#2286BE] rounded-[18px] py-4 items-center">
            <Text className="font-bold text-white">Create New Gig</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row flex-wrap justify-between mb-8">
          {statCards.map((item) => (
            <TouchableOpacity
              key={item.label}
              activeOpacity={0.9}
              onPress={() => router.push(item.route as never)}
              className="w-[48%] bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm shadow-black/5 mb-4"
            >
              <View className="w-12 h-12 rounded-full items-center justify-center mb-4" style={{ backgroundColor: `${item.color}15` }}>
                <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={22} color={item.color} />
              </View>
              <Text className="text-[24px] font-black text-[#1A2C42]">{item.value}</Text>
              <Text className="text-[12px] font-bold tracking-[0.16em] uppercase text-[#7C8B95] mt-2">{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-[18px] font-black text-[#1A2C42] mb-4 tracking-tight">Quick Actions</Text>
        <View className="mb-8 flex-row flex-wrap">
          {quickActions.map((action) => (
            <TouchableOpacity key={action.label} onPress={() => router.push(action.route as never)} className="items-center mr-6 mb-4">
              <View className="w-16 h-16 rounded-[22px] items-center justify-center mb-2" style={{ backgroundColor: action.color }}>
                <Ionicons name={action.icon as keyof typeof Ionicons.glyphMap} size={28} color="white" />
              </View>
              <Text className="text-[13px] font-bold text-[#1A2C42]">{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm shadow-black/5 mb-8">
          <View className="flex-row items-center justify-between mb-5">
            <View className="flex-1">
              <Text className="text-[12px] font-bold tracking-[0.18em] uppercase text-[#7C8B95]">Calendar Availability</Text>
              <Text className="text-[22px] font-black text-[#1A2C42] mt-2">Calendar View</Text>
            </View>
            <View className="w-12 h-12 rounded-full bg-[#FEE2E2] items-center justify-center">
              <Ionicons name="ban-outline" size={22} color="#DC2626" />
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
              className="h-10 w-10 rounded-full bg-[#EAF3FA] items-center justify-center"
            >
              <Ionicons name="chevron-back" size={20} color="#2286BE" />
            </TouchableOpacity>
            <Text className="text-[17px] font-black text-[#1A2C42]">{monthTitle(calendarMonth)}</Text>
            <TouchableOpacity
              onPress={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
              className="h-10 w-10 rounded-full bg-[#EAF3FA] items-center justify-center"
            >
              <Ionicons name="chevron-forward" size={20} color="#2286BE" />
            </TouchableOpacity>
          </View>

          <View className="flex-row mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <Text key={day} className="flex-1 text-center text-[10px] font-black uppercase text-[#94A3B8]">
                {day}
              </Text>
            ))}
          </View>

          <View className="flex-row flex-wrap mb-5">
            {calendarDays.map((day) => {
              const blocks = availabilityByDate[day.key] || [];
              const jobs = bookedJobsByDate[day.key] || [];
              const isSelected = blockDateKey === day.key;
              const hasFullDayBlock = blocks.some((block: any) => block.scope === "full_day");

              return (
                <TouchableOpacity key={day.key} onPress={() => setBlockDateKey(day.key)} className="w-[14.285%] p-1">
                  <View
                    className={`h-11 items-center justify-center rounded-[14px] border ${
                      isSelected
                        ? "bg-[#2286BE] border-[#2286BE]"
                        : hasFullDayBlock
                          ? "bg-[#FEF2F2] border-[#FECACA]"
                          : blocks.length
                            ? "bg-[#FFF7ED] border-[#FED7AA]"
                            : jobs.length
                              ? "bg-[#EAF3FA] border-[#BFDBFE]"
                              : "bg-[#F8FAFC] border-[#F1F5F9]"
                    } ${day.isCurrentMonth ? "opacity-100" : "opacity-40"}`}
                  >
                    <Text className={`text-[13px] font-black ${isSelected ? "text-white" : day.isToday ? "text-[#2286BE]" : "text-[#1A2C42]"}`}>
                      {day.date.getDate()}
                    </Text>
                    {blocks.length || jobs.length ? (
                      <View className="mt-0.5 flex-row">
                        {blocks.length ? <View className={`h-1.5 w-1.5 rounded-full mr-1 ${hasFullDayBlock ? "bg-[#DC2626]" : "bg-[#F97316]"}`} /> : null}
                        {jobs.length ? <View className="h-1.5 w-1.5 rounded-full bg-[#2286BE]" /> : null}
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="rounded-[20px] bg-[#F8FAFC] px-4 py-4 mb-5">
            <Text className="text-[12px] font-black uppercase tracking-[0.16em] text-[#7C8B95]">Selected Date</Text>
            <Text className="text-[18px] font-black text-[#1A2C42] mt-1">{blockDateKey}</Text>
            <Text className="text-[13px] font-bold text-[#7C8B95] mt-2">
              {selectedDateJobs.length} booked jobs, {selectedDateBlocks.length} blocked slots
            </Text>
            {selectedDateJobs.slice(0, 2).map((job) => (
              <View key={String(job.id || job._id || job.orderNumber)} className="mt-3 rounded-[16px] bg-white px-4 py-3">
                <Text className="text-[14px] font-black text-[#1A2C42]">{job.orderName || job.packageTitle || "Booked job"}</Text>
                <Text className="text-[12px] font-bold text-[#2286BE] mt-1">{job.scheduledTime || "Time not set"}</Text>
              </View>
            ))}
          </View>

          <View className="flex-row bg-[#F8FAFC] rounded-[18px] p-1 mb-4">
            {(["time_slot", "full_day"] as const).map((scope) => (
              <TouchableOpacity
                key={scope}
                onPress={() => setBlockScope(scope)}
                className={`flex-1 py-3 rounded-[15px] items-center ${blockScope === scope ? "bg-[#DC2626]" : ""}`}
              >
                <Text className={`font-black text-[12px] ${blockScope === scope ? "text-white" : "text-[#7C8B95]"}`}>
                  {scope === "time_slot" ? "Time Slot" : "Full Day"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-[13px] font-bold text-[#1A2C42] mb-2">Date</Text>
          <TextInput
            value={blockDateKey}
            onChangeText={setBlockDateKey}
            placeholder="YYYY-MM-DD"
            className="bg-[#F8FAFC] rounded-[18px] px-4 py-4 text-[15px] mb-4"
          />

          {blockScope === "time_slot" ? (
            <View className="flex-row mb-4">
              <View className="flex-1 mr-3">
                <Text className="text-[13px] font-bold text-[#1A2C42] mb-2">Start</Text>
                <TextInput value={blockStartTime} onChangeText={setBlockStartTime} placeholder="09:00" className="bg-[#F8FAFC] rounded-[18px] px-4 py-4 text-[15px]" />
              </View>
              <View className="flex-1">
                <Text className="text-[13px] font-bold text-[#1A2C42] mb-2">End</Text>
                <TextInput value={blockEndTime} onChangeText={setBlockEndTime} placeholder="12:00" className="bg-[#F8FAFC] rounded-[18px] px-4 py-4 text-[15px]" />
              </View>
            </View>
          ) : null}

          <Text className="text-[13px] font-bold text-[#1A2C42] mb-2">Optional note</Text>
          <TextInput
            value={blockNote}
            onChangeText={setBlockNote}
            placeholder="Vacation, appointment, personal time..."
            className="bg-[#F8FAFC] rounded-[18px] px-4 py-4 text-[15px] mb-4"
          />

          <TouchableOpacity onPress={() => setBlockRecursWeekly((value) => !value)} className="flex-row items-center mb-5">
            <View className={`w-6 h-6 rounded-[8px] items-center justify-center mr-3 ${blockRecursWeekly ? "bg-[#DC2626]" : "bg-[#F1F5F9]"}`}>
              {blockRecursWeekly ? <Ionicons name="checkmark" size={16} color="white" /> : null}
            </View>
            <Text className="font-bold text-[#1A2C42]">Repeat weekly</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => void handleCreateAvailabilityBlock()}
            disabled={creatingBlock}
            className={`rounded-[18px] py-4 items-center mb-5 ${creatingBlock ? "bg-gray-300" : "bg-[#DC2626]"}`}
          >
            <Text className="text-white font-black">{creatingBlock ? "Saving..." : "Block Availability"}</Text>
          </TouchableOpacity>

          {selectedDateBlocks.map((block: any) => (
            <View key={block.id} className="flex-row items-center justify-between bg-[#FFF7ED] rounded-[18px] p-4 mb-3">
              <View className="flex-1 mr-3">
                <Text className="text-[15px] font-black text-[#1A2C42]">{block.dateKey}</Text>
                <Text className="text-[13px] font-bold text-[#C2410C] mt-1">{formatAvailabilityLabel(block)}</Text>
                {block.note ? <Text className="text-[12px] text-[#7C8B95] mt-1">{block.note}</Text> : null}
              </View>
              <TouchableOpacity disabled={deletingBlock} onPress={() => void handleDeleteAvailabilityBlock(block.id)} className="w-10 h-10 rounded-full bg-white items-center justify-center">
                <Ionicons name="trash-outline" size={18} color="#DC2626" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm shadow-black/5 mb-8">
          <Text className="text-[12px] font-bold tracking-[0.18em] uppercase text-[#7C8B95]">Business Health</Text>
          <View className="flex-row mt-5">
            <View className="flex-1 mr-3 bg-[#F8FAFC] rounded-[20px] px-4 py-4">
              <Text className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#94A3B8]">Completion Rate</Text>
              <Text className="text-[26px] font-black text-[#1A2C42] mt-2">{Math.round(Number(dashboard?.orders?.completionRate || 0))}%</Text>
            </View>
            <View className="flex-1 bg-[#F8FAFC] rounded-[20px] px-4 py-4">
              <Text className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#94A3B8]">Reviews</Text>
              <Text className="text-[26px] font-black text-[#1A2C42] mt-2">{dashboard?.ratings?.reviewCount || 0}</Text>
            </View>
          </View>
        </View>

        <View className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm shadow-black/5 mb-8">
          <View className="mb-5">
            <View>
              <Text className="text-[12px] font-bold tracking-[0.18em] uppercase text-[#7C8B95]">Earnings Trend</Text>
              <Text className="text-[22px] font-black text-[#1A2C42] mt-2">Recent Performance</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(provider)/earnings" as never)} className="mt-3 self-start">
              <Text className="text-[14px] font-bold text-[#2286BE]">View Earnings</Text>
            </TouchableOpacity>
          </View>
          {(dashboard?.earningsAnalytics || []).length ? (
            (dashboard?.earningsAnalytics || []).slice(-4).map((item) => (
              <View key={item.name} className="flex-row items-center justify-between py-3 border-b border-[#F1F5F9] last:border-b-0">
                <Text className="text-[15px] font-semibold text-[#1A2C42]">{item.name || "Period"}</Text>
                <Text className="text-[16px] font-black text-[#2286BE]">{formatCurrency(item.earnings || 0)}</Text>
              </View>
            ))
          ) : (
            <Text className="text-[14px] leading-[22px] text-[#7C8B95]">Earnings trend data will appear here as your completed orders grow.</Text>
          )}
        </View>

        <View className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm shadow-black/5">
          <View className="mb-5">
            <View>
              <Text className="text-[12px] font-bold tracking-[0.18em] uppercase text-[#7C8B95]">Request Inbox</Text>
              <Text className="text-[22px] font-black text-[#1A2C42] mt-2">Pending Opportunities</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(provider)/requests" as never)} className="mt-3 self-start">
              <Text className="text-[14px] font-bold text-[#2286BE]">Open Requests</Text>
            </TouchableOpacity>
          </View>

          {requests.length ? (
            requests.map((req) => (
              <View key={req.id} className="bg-[#F8FAFC] rounded-[20px] p-4 mb-4 last:mb-0">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-[10px] font-black uppercase tracking-[0.16em] text-[#D97706]">Incoming Order</Text>
                  <Text className="text-[11px] font-bold text-[#94A3B8]">{formatRelativeTime(req.time)}</Text>
                </View>
                <Text className="text-[16px] font-bold text-[#1A2C42]">{req.title}</Text>
                <Text className="text-[12px] font-bold tracking-[0.16em] uppercase text-[#94A3B8] mt-2">{req.category}</Text>
                <View className="flex-row items-center mt-3">
                  {req.avatar ? (
                    <Image source={{ uri: req.avatar }} className="w-9 h-9 rounded-full mr-3" />
                  ) : (
                    <View className="w-9 h-9 rounded-full mr-3 bg-white items-center justify-center">
                      <Ionicons name="person" size={16} color="#2286BE" />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-[14px] font-bold text-[#1A2C42]">{req.customer}</Text>
                    <Text className="text-[13px] text-[#7C8B95] mt-1">{req.address}</Text>
                  </View>
                </View>
                <View className="flex-row mt-4">
                  <TouchableOpacity
                    onPress={() => void handleAction(req.id, "decline")}
                    disabled={declining}
                    className="flex-1 mr-3 bg-white rounded-[16px] py-3 items-center border border-gray-200"
                  >
                    <Text className="font-bold text-[#1A2C42]">{declining ? "Declining..." : "Decline"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => void handleAction(req.id, "accept")}
                    disabled={accepting}
                    className="flex-1 bg-[#2286BE] rounded-[16px] py-3 items-center"
                  >
                    <Text className="font-bold text-white">{accepting ? "Accepting..." : "Accept"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <>
              <Text className="text-[16px] font-bold text-[#1A2C42]">{dashboard?.pendingRequests?.length || 0} nearby requests</Text>
              <Text className="text-[14px] leading-[22px] text-[#7C8B95] mt-3">
                Stay active in the request inbox to respond quickly and turn custom jobs into booked orders.
              </Text>
            </>
          )}
          <TouchableOpacity onPress={() => router.push("/(provider-tabs)/orders" as never)} className="mt-5 self-start">
            <Text className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#2286BE]">All Orders History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
