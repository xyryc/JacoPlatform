import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { KeyboardAwareScrollView as ScrollView } from "@/src/components/KeyboardAwareScrollView";
import { UserAvatar } from "@/src/components/UserAvatar";
import { useAuth } from "@/src/contexts/AuthContext";
import { useSocketNotifications } from "@/src/contexts/SocketContext";
import { API_BASE_URL } from "@/src/lib/env";
import { formatCurrency, formatTimeLabel } from "@/src/lib/formatters";
import { extractZipCode, isValidZipCode } from "@/src/lib/zip";
import {
  useGetClientDashboardQuery,
  useGetCategoriesQuery,
  useGetFaqsQuery,
  useGetPublicServicesQuery,
  useGetPublicWebsiteReviewsQuery,
} from "@/src/store/services/apiSlice";

const normalizeMediaUrl = (url?: string) => {
  const value = String(url || "").trim();
  if (!value || !API_BASE_URL) return value;
  return value.replace(/^http:\/\/(?:localhost|127\.0\.0\.1|10\.0\.2\.2):\d+/i, API_BASE_URL);
};

const howItWorks = [
  {
    icon: "search-outline",
    title: "Discover",
    body: "Browse categories, compare providers, and choose what fits your needs.",
  },
  {
    icon: "calendar-outline",
    title: "Book",
    body: "Pick your package, schedule your service, and confirm the location.",
  },
  {
    icon: "shield-checkmark-outline",
    title: "Complete",
    body: "Track messages, deliveries, and revisions from one place with support when needed.",
  },
];

const formatRecentTime = (scheduledDate?: string, scheduledTime?: string) => {
  if (!scheduledDate && !scheduledTime) return "Schedule pending";
  if (!scheduledDate) return scheduledTime ? formatTimeLabel(scheduledTime) : "Schedule pending";
  const date = new Date(scheduledDate);
  if (Number.isNaN(date.getTime())) return scheduledTime ? formatTimeLabel(scheduledTime) : scheduledDate;
  const formattedDate = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return scheduledTime ? `${formattedDate}, ${formatTimeLabel(scheduledTime)}` : formattedDate;
};

const slugifySearchTerm = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, unreadCount } = useSocketNotifications();
  const [searchText, setSearchText] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState("");
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const insets = useSafeAreaInsets();
  const tabBarHeight =
    Platform.OS === "ios" ? 65 + insets.bottom : 75 + (insets.bottom > 0 ? insets.bottom : 0);
  const { data: dashboardPayload, refetch: refetchDashboard } = useGetClientDashboardQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: 15000,
  });
  const { data: categoryPayload } = useGetCategoriesQuery();
  const { data: servicePayload, refetch: refetchServices } = useGetPublicServicesQuery({
    page: 1,
    limit: 6,
    categorySlug: "all",
    lat: typeof user?.locationLat === "number" ? user.locationLat : null,
    lng: typeof user?.locationLng === "number" ? user.locationLng : null,
  });
  const {
    data: searchPayload,
    isFetching: searchingServices,
  } = useGetPublicServicesQuery(
    {
      page: 1,
      limit: 100,
      radiusKm: 100,
      categorySlug: selectedCategorySlug || "all",
      search: searchText.trim(),
      zipCode: extractZipCode(zipCode),
    },
    {
      skip: !searchSubmitted,
    }
  );
  const { data: faqPayload } = useGetFaqsQuery();
  const { data: websiteReviewsPayload, isFetching: loadingWebsiteReviews } =
    useGetPublicWebsiteReviewsQuery();
  const testimonials = useMemo(() => {
    const customerReviews = (websiteReviewsPayload?.data?.clientReviews || []).map((review, index) => ({
      id: review.id || `client-${index}`,
      name: review.reviewer?.name || "Customer",
      role: "Customer" as const,
      city: review.reviewer?.location || "Location not provided",
      avatar: review.reviewer?.avatar || "",
      quote: review.reviewText || "Shared a website review.",
      rating: Number(review.websiteRating || 0),
      metricLabel: "Monthly Spending",
      metricValue: `${formatCurrency(Number(review.reviewer?.monthlySpending || 0))} / month`,
      badge: "",
    }));
    const providerReviews = (websiteReviewsPayload?.data?.providerReviews || []).map((review, index) => ({
      id: review.id || `provider-${index}`,
      name: review.reviewer?.name || "Provider",
      role: "Provider" as const,
      city: review.reviewer?.location || "Location not provided",
      avatar: review.reviewer?.avatar || "",
      quote: review.reviewText || "Shared a website review.",
      rating: Number(review.websiteRating || 0),
      metricLabel: "Monthly Earnings",
      metricValue: `${formatCurrency(Number(review.reviewer?.monthlyIncome || 0))} / month`,
      badge: review.reviewer?.sellerLevel || "New",
    }));
    return [...customerReviews, ...providerReviews];
  }, [websiteReviewsPayload?.data?.clientReviews, websiteReviewsPayload?.data?.providerReviews]);
  const dashboard = dashboardPayload?.data;
  const activeOrders = Number(dashboard?.orders?.activeOrders || 0);
  const pendingOrders = Number(dashboard?.orders?.pendingOrders || 0);
  const inProgressOrders = Number(dashboard?.orders?.inProgressOrders || 0);
  const underReviewOrders = Number(dashboard?.orders?.underReviewOrders || 0);
  const completedOrders = Number(dashboard?.orders?.completedOrders || 0);
  const completionRate = Number(dashboard?.orders?.completionRate || 0);
  const inboxCount = Number(dashboard?.inbox?.unreadMessages || 0);
  const savedServicesCount = Array.isArray(user?.savedServiceIds) ? user.savedServiceIds.length : 0;
  const categories = useMemo(() => categoryPayload?.data || [], [categoryPayload?.data]);
  const featuredCategories = categories.slice(0, 3);
  const categorySuggestions = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((item) => item.name.toLowerCase().includes(query));
  }, [categories, searchText]);
  const services = servicePayload?.data.items || [];
  const searchedServices = searchPayload?.data.items || [];
  const showSearchResults = searchSubmitted;
  const showNoResultsSuggestion = showSearchResults && !searchingServices && searchedServices.length === 0;
  const faqs = (faqPayload?.data || []).slice(0, 3);
  const recentOrders = Array.isArray(dashboard?.recentOrders) ? dashboard.recentOrders.slice(0, 2) : [];
  const activeNote =
    pendingOrders > 0
      ? `${pendingOrders} waiting confirmation`
      : underReviewOrders > 0
        ? `${underReviewOrders} under review`
        : inProgressOrders > 0
          ? `${inProgressOrders} in progress`
          : "No active updates";
  const latestNotification = notifications[0];
  const refetchMarkerRef = useRef("");
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage("");
      toastTimerRef.current = null;
    }, 2600);
  };

  useEffect(() => {
    if (!latestNotification?.id) return;
    if (refetchMarkerRef.current === latestNotification.id) return;
    refetchMarkerRef.current = latestNotification.id;
    void refetchDashboard();
    void refetchServices();
  }, [latestNotification?.id, refetchDashboard, refetchServices]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const openCustomRequestFlow = () => {
    const categoryName = searchText.trim();
    const categorySlug = selectedCategorySlug || slugifySearchTerm(categoryName);

    if (!categoryName || !categorySlug) {
      showToast("Enter a service name before requesting this service.");
      return;
    }

    router.push({
      pathname: "/post-request",
      params: {
        categoryName,
        categorySlug,
        zipCode: extractZipCode(zipCode),
      },
    });
  };

  const handleSearch = () => {
    const normalizedZip = extractZipCode(zipCode);
    if (!isValidZipCode(normalizedZip)) {
      return;
    }
    setShowCategorySuggestions(false);
    setSearchSubmitted(true);
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView
        className="bg-white rounded-b-[30px] px-6 pb-6 pt-4"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
          zIndex: 20,
        }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.push("/categories")}>
            <Ionicons name="menu" size={32} color="#2B84B1" />
          </TouchableOpacity>

          <View className="ml-4 flex-1">
            <Text className="text-[10px] font-bold tracking-widest text-[#7C8B95] uppercase">Current Location</Text>
            <View className="flex-row items-center mt-0.5">
              <Text className="text-[15px] font-bold text-[#2B84B1]" numberOfLines={1}>
                {user?.address || "Location not set"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/notifications")}
            className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center border border-gray-100 ml-4 relative"
          >
            <Ionicons name="notifications-outline" size={22} color="#1A2C42" />
            {unreadCount ? <View className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> : null}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1 bg-[#FAFCFD]"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
        keyboardShouldPersistTaps="handled"
        onTouchStart={() => {
          if (showCategorySuggestions) {
            setShowCategorySuggestions(false);
          }
        }}
      >
        <View style={{ height: 40 }} />
        <View className="px-6 pt-2 pb-6">
          <Text className="text-[12px] font-bold tracking-[0.15em] text-[#7C8B95] uppercase mb-3">
            HELLO {`${user?.firstName || "Client"} ${user?.lastName || ""}`.trim()}
          </Text>
          <Text className="text-[34px] font-black text-[#1A2C42] leading-[42px] tracking-tight">
            Your Home,{"\n"}Our Priority
          </Text>
        </View>

        <View
          className="px-6 mb-8"
          onTouchStart={(event) => {
            event.stopPropagation();
          }}
        >
          <View className="flex-row items-center bg-white rounded-3xl pl-5 pr-2 py-2 border border-gray-100">
            <TextInput
              placeholder="Search category"
              placeholderTextColor="#A0AEC0"
              value={searchText}
              onChangeText={(text) => {
                setSearchText(text);
                setSelectedCategorySlug("");
                setSearchSubmitted(false);
                setShowCategorySuggestions(true);
              }}
              onFocus={() => setShowCategorySuggestions(true)}
              className="flex-1 text-[15px] font-medium text-[#1A2C42] h-12"
              autoCapitalize="none"
            />
            <View className="w-px h-6 bg-gray-200 mx-2" />
            <View className="flex-row items-center px-2">
              <Ionicons name="location-outline" size={18} color="#2286BE" />
              <TextInput
                placeholder="ZIP"
                placeholderTextColor="#A0AEC0"
                value={zipCode}
                onChangeText={(text) => {
                  setZipCode(text.replace(/\D/g, "").slice(0, 5));
                  setSearchSubmitted(false);
                  setShowCategorySuggestions(false);
                }}
                keyboardType="number-pad"
                maxLength={5}
                className="w-16 text-[15px] font-medium text-[#1A2C42] h-12 ml-2"
              />
            </View>
            <TouchableOpacity
              onPress={handleSearch}
              className="bg-[#2B84B1] w-12 h-12 rounded-[18px] items-center justify-center"
            >
              <Ionicons name="search" size={22} color="white" />
            </TouchableOpacity>
          </View>

          {!searchSubmitted && showCategorySuggestions ? (
            <View className="mt-3 rounded-[24px] border border-gray-100 bg-white overflow-hidden">
              {categorySuggestions.length ? (
                <ScrollView nestedScrollEnabled style={{ maxHeight: 224 }} showsVerticalScrollIndicator={true}>
                  {categorySuggestions.map((category, index) => (
                    <TouchableOpacity
                      key={String(category.id || category.slug || category.name || index)}
                      onPress={() => {
                        setSearchText(category.name);
                        setSelectedCategorySlug(category.slug);
                        setSearchSubmitted(false);
                        setShowCategorySuggestions(false);
                      }}
                      className={`flex-row items-center justify-between px-5 py-4 ${
                        index < categorySuggestions.length - 1 ? "border-b border-gray-100" : ""
                      }`}
                    >
                      <Text className="text-[14px] font-bold text-[#1A2C42]">{category.name}</Text>
                      <Text className="text-[10px] font-black uppercase tracking-[0.16em] text-[#94A3B8]">Category</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : searchText.trim() ? (
                <View className="px-5 py-4">
                  <Text className="text-[14px] font-medium text-[#64748B]">No matching category found.</Text>
                  <TouchableOpacity onPress={openCustomRequestFlow} className="mt-3 self-start rounded-[16px] bg-[#2286BE] px-4 py-3">
                    <Text className="text-[12px] font-black uppercase tracking-[0.14em] text-white">Request This Service</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          ) : null}

          {showSearchResults ? (
            <View className="mt-3 rounded-[24px] border border-gray-100 bg-white overflow-hidden">
              <View className="px-5 py-3 border-b border-gray-100">
                <Text className="text-[11px] font-black uppercase tracking-[0.18em] text-[#7C8B95]">
                  Available gigs in ZIP {extractZipCode(zipCode)}
                </Text>
              </View>

              {searchingServices ? (
                <View className="py-8 items-center justify-center">
                  <ActivityIndicator color="#2286BE" />
                </View>
              ) : searchedServices.length ? (
                searchedServices.slice(0, 8).map((gig, index) => (
                  <TouchableOpacity
                    key={String(gig.id || gig.slug || gig.title || index)}
                    onPress={() => router.push({ pathname: "/service-details", params: { id: gig.id } })}
                    className="px-5 py-4 border-b border-gray-100"
                  >
                    <Text className="text-[14px] font-bold text-[#1A2C42]">{gig.title || "Untitled gig"}</Text>
                    <Text className="text-[12px] font-medium text-[#7C8B95] mt-1">
                      {gig.categoryName || "General"} · ZIP {gig.zipCode || extractZipCode(zipCode)}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : null}
            </View>
          ) : null}

          {showNoResultsSuggestion ? (
            <View className="mt-3 rounded-[24px] bg-[#EAF3FA] px-5 py-4">
              <Text className="text-[15px] font-black text-[#1A2C42]">Couldn&apos;t find a matching category or gig?</Text>
              <Text className="text-[13px] leading-[20px] text-[#5F7182] mt-2">
                Submit a custom request and let Jacob notify admins and nearby providers for you.
              </Text>
              <TouchableOpacity onPress={openCustomRequestFlow} className="mt-4 self-start rounded-[16px] bg-[#2286BE] px-4 py-3">
                <Text className="text-[12px] font-black uppercase tracking-[0.14em] text-white">Request This Service</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {zipCode.length > 0 && !isValidZipCode(zipCode) ? (
            <Text className="mt-3 text-[12px] font-semibold text-[#DC2626]">Please enter a valid 5-digit zip code.</Text>
          ) : null}
        </View>

        <View className="px-6 mb-8">
          <View className="bg-[#1A2C42] rounded-[28px] p-5">
            <Text className="text-white text-[22px] font-black leading-[28px]">Need something custom?</Text>
            <Text className="text-white/70 text-[14px] mt-2 leading-[22px]">
              Post a request with the live map so nearby providers can respond to your exact location.
            </Text>
            <View className="flex-row mt-5">
              <TouchableOpacity onPress={() => router.push("/post-request")} className="bg-white rounded-[18px] px-5 py-4 mr-3">
                <Text className="font-bold text-[#1A2C42]">Post Request</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/client-requests" as never)}
                className="bg-white/10 border border-white/15 rounded-[18px] px-5 py-4"
              >
                <Text className="font-bold text-white">Track Requests</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="px-6 mb-10">
          <View className="flex-row flex-wrap justify-between">
            {[
              {
                label: "Active Orders",
                value: activeOrders,
                note: activeNote,
                color: "#F59E0B",
                icon: "time-outline",
              },
              {
                label: "Completed",
                value: completedOrders,
                note: `${completionRate.toFixed(1)}% completion rate`,
                color: "#2286BE",
                icon: "checkmark-circle-outline",
              },
              {
                label: "Saved Services",
                value: savedServicesCount,
                note: "Quick access to favorites",
                color: "#E11D48",
                icon: "heart-outline",
              },
              {
                label: "Inbox",
                value: inboxCount,
                note: "Unread provider messages",
                color: "#10B981",
                icon: "mail-outline",
              },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={() =>
                  item.label === "Saved Services"
                    ? router.push("/client-saved-services")
                    : item.label === "Inbox"
                      ? router.push("/(tabs)/message")
                      : router.push("/(tabs)/booking")
                }
                className="w-[48%] bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm shadow-black/5 mb-4"
              >
                <View className="w-12 h-12 rounded-full items-center justify-center mb-4" style={{ backgroundColor: `${item.color}15` }}>
                  <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={22} color={item.color} />
                </View>
                <Text className="text-[24px] font-black text-[#1A2C42]">{item.value}</Text>
                <Text className="text-[12px] font-bold tracking-[0.16em] uppercase text-[#7C8B95] mt-2">{item.label}</Text>
                <Text className="text-[12px] text-[#64748B] mt-2">{item.note}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="px-6 mb-10">
          <View className="flex-row items-center justify-between mb-5">
            <View className="flex-row items-center">
              <View className="w-1.5 h-7 bg-[#2B84B1] rounded-full mr-3.5" />
              <Text className="text-[22px] font-bold text-[#1A2C42]">Recent Orders</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/booking")} className="bg-[#EAF3FA] px-4 py-2 rounded-full">
              <Text className="text-[11px] font-bold text-[#2286BE] uppercase tracking-[0.14em]">All History</Text>
            </TouchableOpacity>
          </View>
          {recentOrders.length ? (
            recentOrders.map((order: any, index: number) => (
              <TouchableOpacity
                key={String(order.id || order.orderNumber || index)}
                onPress={() =>
                  router.push({
                    pathname: "/booking-details",
                    params: { id: order.orderNumber || order.id || "", role: "client" },
                  })
                }
                className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm shadow-black/5 mb-4"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-4">
                    <Text className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#94A3B8]">
                      #{order.orderNumber || order.id || "Order"}
                    </Text>
                    <Text className="text-[18px] font-bold text-[#1A2C42] mt-2">
                      {order.orderName || "Service order"}
                    </Text>
                    <Text className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#94A3B8] mt-2">
                      Category: {order.categoryName || "General"}
                    </Text>
                  </View>
                  <View className={`px-3 py-2 rounded-full ${index === 0 ? "bg-[#FFF7ED]" : "bg-[#EAF3FA]"}`}>
                    <Text className={`text-[10px] font-bold uppercase ${index === 0 ? "text-[#D97706]" : "text-[#2286BE]"}`}>
                      {order.statusLabel || "Pending"}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center mt-4">
                  {order.provider?.avatar ? (
                    <Image source={{ uri: order.provider.avatar }} className="w-10 h-10 rounded-full mr-3" />
                  ) : (
                    <View className="w-10 h-10 rounded-full mr-3 bg-[#EAF3FA] items-center justify-center">
                      <Ionicons name="person" size={18} color="#2286BE" />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-[14px] font-bold text-[#1A2C42]">{order.provider?.name || "Provider"}</Text>
                    <Text className="text-[13px] text-[#7C8B95] mt-1">
                      {formatRecentTime(order.scheduledLabel, order.scheduledTime)}
                    </Text>
                  </View>
                  <Text className="text-[18px] font-black text-[#1A2C42]">
                    {formatCurrency(Number(order.amount || 0))}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm shadow-black/5">
              <Text className="text-[16px] font-bold text-[#1A2C42]">No recent orders yet</Text>
              <Text className="text-[14px] leading-[22px] text-[#64748B] mt-2">
                Once you book a service, your recent order activity will show up here.
              </Text>
            </View>
          )}
        </View>

        <View className="px-6 mb-12 flex-row justify-between items-center">
          {featuredCategories.map((category, index) => (
            <View key={String(category.id || category.slug || category.name || index)} className="items-center">
              <TouchableOpacity
                onPress={() =>
                  router.push({ pathname: "/category-details", params: { name: category.name, slug: category.slug } })
                }
                className="w-[58px] h-[58px] rounded-full bg-[#EAF3FA] items-center justify-center mb-3"
              >
                <Ionicons name="grid-outline" size={26} color="#2286BE" />
              </TouchableOpacity>
              <Text className="text-[14px] font-semibold text-[#4A5568]">{category.name}</Text>
            </View>
          ))}
          <View className="items-center">
            <TouchableOpacity
              onPress={() => router.push("/categories")}
              className="w-[58px] h-[58px] rounded-full bg-gray-50 border border-gray-100 items-center justify-center mb-3"
            >
              <Ionicons name="arrow-forward" size={26} color="#718096" />
            </TouchableOpacity>
            <Text className="text-[14px] font-semibold text-[#4A5568]">See All</Text>
          </View>
        </View>

        <View className="mb-12">
          <View className="px-6 mb-6 flex-row justify-between items-center">
            <View className="flex-row items-center">
              <View className="w-1.5 h-7 bg-[#2B84B1] rounded-full mr-3.5" />
              <Text className="text-[22px] font-bold text-[#1A2C42]">Near Your Location</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/services")} className="flex-row items-center border border-gray-200 rounded-full px-4 py-2">
              <Text className="text-[13px] font-semibold text-[#4A5568] mr-1.5">Discover More</Text>
              <Ionicons name="chevron-forward" size={12} color="#4A5568" />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-6">
            {services.map((item, index) => {
              const thumbnailImage = normalizeMediaUrl(item.image);
              const thumbnailVideo = !thumbnailImage && Array.isArray((item as any).videos) ? normalizeMediaUrl((item as any).videos[0]) : "";

              return (
              <TouchableOpacity
                key={String(item.id || item.slug || item.title || index)}
                onPress={() => router.push({ pathname: "/service-details", params: { id: item.id } })}
                className="w-[172px] mr-5"
              >
                <View className="w-full h-[220px] rounded-3xl overflow-hidden mb-4 bg-gray-100 relative">
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
                        <View className="h-11 w-11 rounded-full bg-white/90 items-center justify-center">
                          <Ionicons name="play" size={22} color="#2286BE" />
                        </View>
                      </View>
                    </>
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <Ionicons name="image-outline" size={32} color="#94A3B8" />
                    </View>
                  )}
                </View>
                <Text className="text-[16px] font-bold text-[#1A2C42]" numberOfLines={2}>
                  {item.title}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Ionicons name="location-outline" size={12} color="#2286BE" />
                  <Text className="text-[12px] text-[#7C8B95] ml-1">
                    {typeof item.distanceKm === "number" ? `${item.distanceKm.toFixed(1)} km away` : "Distance unavailable"}
                  </Text>
                </View>
                <Text className="text-[13px] text-[#7C8B95] mt-1">{formatCurrency(item.avgPackagePrice)}</Text>
              </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View className="px-6 mb-10">
          <TouchableOpacity
            onPress={() => router.push("/client-saved-services")}
            className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm shadow-gray-100 flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 rounded-full bg-[#FFF4E8] items-center justify-center mr-4">
                <Ionicons name="heart" size={22} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className="text-[17px] font-bold text-[#1A2C42]">Saved Services</Text>
                <Text className="text-[13px] text-[#7C8B95] mt-1">See your bookmarked providers and services</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <View className="px-6 mb-10">
          <View className="flex-row items-center mb-5">
            <View className="w-1.5 h-7 bg-[#2B84B1] rounded-full mr-3.5" />
            <Text className="text-[22px] font-bold text-[#1A2C42]">How It Works</Text>
          </View>
          {howItWorks.map((step, index) => (
            <View
              key={step.title}
              className="bg-white rounded-[24px] border border-gray-100 shadow-sm shadow-black/5 px-5 py-5 mb-4 flex-row"
            >
              <View className="w-12 h-12 rounded-full bg-[#EAF3FA] items-center justify-center mr-4">
                <Ionicons name={step.icon as keyof typeof Ionicons.glyphMap} size={22} color="#2B84B1" />
              </View>
              <View className="flex-1">
                <Text className="text-[12px] font-bold tracking-[0.18em] uppercase text-[#7C8B95]">
                  Step {index + 1}
                </Text>
                <Text className="text-[18px] font-bold text-[#1A2C42] mt-1">{step.title}</Text>
                <Text className="text-[14px] leading-[22px] text-[#5F7182] mt-2">{step.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View className="px-6 mb-10">
          <View className="flex-row items-center mb-5">
            <View className="w-1.5 h-7 bg-[#2B84B1] rounded-full mr-3.5" />
            <Text className="text-[22px] font-bold text-[#1A2C42]">What People Say</Text>
          </View>
          {loadingWebsiteReviews && testimonials.length === 0 ? (
            <View className="h-36 items-center justify-center rounded-[24px] bg-white">
              <ActivityIndicator color="#2B84B1" />
            </View>
          ) : testimonials.length === 0 ? (
            <View className="rounded-[24px] border border-gray-100 bg-white px-5 py-7">
              <Text className="text-center text-[14px] font-medium text-[#7C8B95]">No website reviews yet.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {testimonials.map((item) => (
                <View
                  key={`${item.role}-${item.id}`}
                  className="w-[300px] mr-4 bg-white rounded-[28px] border border-gray-100 shadow-sm shadow-black/5 p-5"
                >
                  <View className="flex-row items-center mb-4">
                    <UserAvatar uri={normalizeMediaUrl(item.avatar)} size={48} className="mr-3" />
                    <View className="flex-1">
                      <Text className="text-[16px] font-bold text-[#1A2C42]" numberOfLines={1}>{item.name}</Text>
                      <Text className="text-[13px] font-semibold text-[#2B84B1]">{item.role}</Text>
                      <Text className="text-[11px] text-[#94A3B8]" numberOfLines={1}>{item.city}</Text>
                    </View>
                    {item.badge ? (
                      <View className="rounded-full bg-[#FFF7E6] px-2.5 py-1">
                        <Text className="text-[10px] font-bold text-[#B7791F]">{item.badge}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View className="mb-3 flex-row">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Ionicons
                        key={value}
                        name={value <= Math.round(item.rating) ? "star" : "star-outline"}
                        size={15}
                        color={value <= Math.round(item.rating) ? "#F59E0B" : "#CBD5E1"}
                      />
                    ))}
                  </View>

                  <Text className="text-[15px] leading-[24px] text-[#5F7182]">“{item.quote}”</Text>

                  <View className="mt-5 border-t border-gray-100 pt-4">
                    <Text className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">
                      {item.metricLabel}
                    </Text>
                    <Text className="mt-1 text-[15px] font-bold text-[#1A2C42]">{item.metricValue}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View className="px-6 mb-10">
          <View className="bg-[#1A2C42] rounded-[28px] p-6">
            <Text className="text-[12px] font-bold tracking-[0.18em] uppercase text-[#9CCAE2]">For Providers</Text>
            <Text className="text-[26px] font-black text-white leading-[32px] mt-3">Grow your service business with Jacob</Text>
            <Text className="text-[14px] leading-[22px] text-white/75 mt-3">
              Join as a provider, publish your services, manage requests, and build trust with verified reviews.
            </Text>
            <View className="flex-row mt-5">
              <TouchableOpacity onPress={() => router.push("/provider-help")} className="bg-white px-5 py-4 rounded-[18px] mr-3">
                <Text className="font-bold text-[#1A2C42]">Provider Info</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/(auth)/provider-register")} className="bg-white/10 border border-white/15 px-5 py-4 rounded-[18px]">
                <Text className="font-bold text-white">Become a Provider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="px-6 mb-10">
          <View className="flex-row items-center justify-between mb-5">
            <View className="flex-row items-center">
              <View className="w-1.5 h-7 bg-[#2B84B1] rounded-full mr-3.5" />
              <Text className="text-[22px] font-bold text-[#1A2C42]">FAQs</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/contact")} className="flex-row items-center">
              <Text className="text-[14px] font-bold text-[#2B84B1] mr-1">Need Help?</Text>
              <Ionicons name="chevron-forward" size={14} color="#2B84B1" />
            </TouchableOpacity>
          </View>
          {faqs.map((faq, index) => (
            <View
              key={String(faq.id || faq.question || index)}
              className="bg-white rounded-[22px] px-5 py-5 border border-gray-100 shadow-sm shadow-black/5 mb-3"
            >
              <Text className="text-[16px] font-bold text-[#1A2C42]">{faq.question}</Text>
              <Text className="text-[14px] leading-[22px] text-[#5F7182] mt-2" numberOfLines={3}>
                {faq.answer}
              </Text>
            </View>
          ))}
        </View>

        <View className="px-6 mb-10">
          <View className="bg-white rounded-[28px] border border-gray-100 shadow-sm shadow-black/5 p-6">
            <Text className="text-[12px] font-bold tracking-[0.18em] uppercase text-[#7C8B95]">App Access</Text>
            <Text className="text-[24px] font-black text-[#1A2C42] mt-3">Manage bookings anywhere</Text>
            <Text className="text-[14px] leading-[22px] text-[#5F7182] mt-3">
              Keep chats, requests, orders, saved services, and support in your pocket wherever you go.
            </Text>
            <View className="flex-row mt-5">
              <TouchableOpacity onPress={() => router.push("/notifications")} className="bg-[#2B84B1] px-5 py-4 rounded-[18px] mr-3">
                <Text className="font-bold text-white">Open Notifications</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/contact")} className="bg-[#F8FAFC] px-5 py-4 rounded-[18px]">
                <Text className="font-bold text-[#1A2C42]">Contact Us</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {toastMessage ? (
        <View
          pointerEvents="none"
          className="absolute left-6 right-6 rounded-[18px] bg-[#1A2C42] px-4 py-3"
          style={{
            top: insets.top + 92,
            zIndex: 50,
            elevation: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 16,
          }}
        >
          <Text className="text-center text-[13px] font-bold text-white">{toastMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}
