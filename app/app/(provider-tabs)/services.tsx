import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ActionSheetIOS,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { formatCurrency } from "@/src/lib/formatters";
import {
  useDeleteGigMutation,
  useDeleteGigRequestMutation,
  useGetMyGigsQuery,
  useLazyGetGigAnalyticsQuery,
} from "@/src/store/services/apiSlice";

const kmToMiles = (km?: number | null) => ((Number(km || 0) * 0.621371) || 0).toFixed(1);
const formatMoney = (value?: number | null) => formatCurrency(Number(value || 0));
const formatCompactMoney = (value?: number | null) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

export default function ProviderServices() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight =
    Platform.OS === "ios" ? 65 + insets.bottom : 75 + (insets.bottom > 0 ? insets.bottom : 0);
  const [activeTab, setActiveTab] = useState<"published" | "pending" | "other">("published");
  const [analyticsGig, setAnalyticsGig] = useState<{ id: string; title: string } | null>(null);
  const [menuGig, setMenuGig] = useState<any | null>(null);
  const { data, isLoading, refetch } = useGetMyGigsQuery();
  const [getGigAnalytics, { data: analyticsData, isFetching: analyticsLoading }] = useLazyGetGigAnalyticsQuery();
  const [deleteGig, { isLoading: deletingGig }] = useDeleteGigMutation();
  const [deleteGigRequest, { isLoading: deletingGigRequest }] = useDeleteGigRequestMutation();

  const published = useMemo(
    () => (Array.isArray(data?.data.publishedGigs) ? data?.data.publishedGigs : []),
    [data?.data.publishedGigs]
  );
  const pending = useMemo(
    () => (Array.isArray(data?.data.pendingRequests) ? data?.data.pendingRequests : []),
    [data?.data.pendingRequests]
  );

  const activeItems = useMemo(() => {
    if (activeTab === "published") return published.filter((gig: any) => gig.status === "published");
    if (activeTab === "pending") return pending.filter((gig: any) => gig.status === "pending_approval");
    return published.filter((gig: any) => gig.status === "rejected" || gig.status === "draft");
  }, [activeTab, pending, published]);

  const tabCounts = {
    published: published.filter((gig: any) => gig.status === "published").length,
    pending: pending.filter((gig: any) => gig.status === "pending_approval").length,
    other: published.filter((gig: any) => gig.status === "rejected" || gig.status === "draft").length,
  };

  const handlePreview = (gig: any) => {
    if (gig.status !== "published") {
      Alert.alert("Preview unavailable", "This gig must be published before it can be previewed publicly.");
      return;
    }
    router.push({ pathname: "/service-details", params: { id: String(gig._id || gig.id) } });
  };

  const handleShareGig = async (gig: any) => {
    try {
      await Share.share({
        message: `${gig.title}\n${formatCurrency(Number(gig.packages?.[0]?.price || 0))}\nShared from Jacob provider app.`,
      });
    } catch {
      // ignore share dismissal
    }
  };

  const handleDeleteGig = async (gig: any) => {
    Alert.alert(
      "Delete this gig?",
      `${gig.title || "This gig"} will be removed permanently.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (gig.status === "pending_approval") {
                await deleteGigRequest(String(gig._id || gig.id)).unwrap();
              } else {
                await deleteGig(String(gig._id || gig.id)).unwrap();
              }
              await refetch();
            } catch (error) {
              Alert.alert("Delete failed", error instanceof Error ? error.message : "Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleOpenAnalytics = async (gig: any) => {
    const gigId = String(gig._id || gig.id || "");
    if (!gigId || gig.status !== "published") {
      Alert.alert("Analytics unavailable", "This gig must be published before analytics can be viewed.");
      return;
    }

    setAnalyticsGig({ id: gigId, title: gig.title || "Gig" });
    void getGigAnalytics(gigId);
  };

  const openGigMenu = (gig: any) => {
    if (Platform.OS === "ios") {
      const options = ["View Analytics", "Cancel"];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 1,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            void handleOpenAnalytics(gig);
          }
        }
      );
      return;
    }

    setMenuGig(gig);
  };

  const activeAnalyticsData =
    analyticsData?.data?.gig?.id && analyticsData.data.gig.id === analyticsGig?.id ? analyticsData.data : null;
  const analyticsSummary = activeAnalyticsData?.summary;
  const analyticsSeries = useMemo(
    () =>
      Array.isArray(activeAnalyticsData?.detailViewSeries)
        ? activeAnalyticsData.detailViewSeries.map((item) => ({
            label: item.label || "",
            earnings: Number(item.earnings || 0),
          }))
        : [],
    [activeAnalyticsData?.detailViewSeries]
  );
  const maxAnalyticsEarnings = Math.max(1, ...analyticsSeries.map((item) => item.earnings));
  const analyticsTrendSummary = useMemo(() => {
    if (!analyticsSeries.length) {
      return {
        averageDailyIncome: 0,
        bestDayIncome: 0,
        bestDayLabel: "",
        activeIncomeDays: 0,
      };
    }

    const totalIncome = analyticsSeries.reduce((sum, item) => sum + Number(item.earnings || 0), 0);
    const bestDay = analyticsSeries.reduce(
      (top, item) => (Number(item.earnings || 0) > Number(top.earnings || 0) ? item : top),
      analyticsSeries[0]
    );

    return {
      averageDailyIncome: totalIncome / analyticsSeries.length,
      bestDayIncome: Number(bestDay?.earnings || 0),
      bestDayLabel: bestDay?.label || "",
      activeIncomeDays: analyticsSeries.filter((item) => Number(item.earnings || 0) > 0).length,
    };
  }, [analyticsSeries]);
  const analyticsLabelStep = analyticsSeries.length > 10 ? Math.ceil(analyticsSeries.length / 6) : 1;

  return (
    <SafeAreaView className="flex-1 bg-[#FAFCFD]" edges={["top"]}>
      <View className="px-6 py-4 flex-row justify-between items-center bg-white shadow-sm shadow-black/5 z-10 w-full mb-2">
        <View>
          <Text className="text-[26px] font-black text-[#1A2C42]">My Gigs</Text>
          <Text className="text-[13px] text-[#7C8B95] mt-1">Manage published gigs and review status.</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(provider)/create-service" as never)}
          className="w-11 h-11 bg-[#2B84B1] rounded-full flex items-center justify-center shadow-sm shadow-[#2B84B1]/40"
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2B84B1" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-6 pt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
        >
          <View className="bg-[#1A2C42] rounded-[30px] p-6 mb-6">
            <Text className="text-white/65 text-[12px] font-bold tracking-[0.18em] uppercase">Gig Overview</Text>
            <Text className="text-white text-[34px] font-black mt-3">{activeItems.length}</Text>
            <Text className="text-white/75 text-[14px] mt-1">Items in the current gig tab.</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
            {[
              { id: "published", label: "Published", count: tabCounts.published },
              { id: "pending", label: "Review", count: tabCounts.pending },
              { id: "other", label: "Other", count: tabCounts.other },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id as "published" | "pending" | "other")}
                  className={`px-5 py-3 rounded-full mr-3 border ${active ? "bg-[#2286BE] border-[#2286BE]" : "bg-white border-gray-200"}`}
                >
                  <Text className={`font-bold text-[13px] ${active ? "text-white" : "text-[#64748B]"}`}>
                    {tab.label} ({tab.count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {activeItems.length ? (
            activeItems.map((gig: any) => {
              const image = gig.images?.[0];
              const price = Number(gig.packages?.[0]?.price || 0);
              const statusLabel =
                gig.status === "published"
                  ? "Live"
                  : gig.status === "pending_approval"
                    ? "Under Review"
                    : gig.status === "rejected"
                      ? "Rejected"
                      : "Draft";
              const deleting = deletingGig || deletingGigRequest;

              return (
                <View key={String(gig._id || gig.id)} className="bg-white rounded-[28px] p-5 mb-5 border border-gray-100 shadow-sm shadow-black/5">
                  <View className="flex-row">
                    <View className="w-24 h-24 rounded-[20px] mr-4 border border-gray-200 overflow-hidden bg-gray-100">
                      {image ? (
                        <Image source={{ uri: image }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <View className="flex-1 items-center justify-center">
                          <Ionicons name="image-outline" size={32} color="#CBD5E1" />
                        </View>
                      )}
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-3">
                          <Text className="text-[18px] font-black text-[#1A2C42]" numberOfLines={2}>
                            {gig.title || "Untitled gig"}
                          </Text>
                          <Text className="text-[13px] text-[#2286BE] font-bold mt-2">{gig.categoryName || "General"}</Text>
                        </View>
                        <View className="items-end">
                          <TouchableOpacity
                            onPress={() => openGigMenu(gig)}
                            className="w-10 h-10 rounded-full bg-[#F8FAFC] border border-gray-200 items-center justify-center mb-2"
                          >
                            <Ionicons name="ellipsis-horizontal" size={18} color="#1A2C42" />
                          </TouchableOpacity>
                          <View className="px-3 py-2 rounded-full bg-[#EAF3FA]">
                            <Text className="text-[11px] font-bold uppercase text-[#2286BE]">{statusLabel}</Text>
                          </View>
                        </View>
                      </View>

                      <Text className="text-[18px] font-black text-[#1A2C42] mt-4">From {formatCurrency(price)}</Text>
                    </View>
                  </View>

                  <View className="flex-row mt-5">
                    <View className="flex-1 mr-3 bg-[#F8FAFC] rounded-[18px] px-4 py-4">
                      <Text className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#94A3B8]">Expert Type</Text>
                      <Text className="text-[15px] font-bold text-[#1A2C42] mt-2">{gig.expertType === "team" ? "Team" : "Solo"}</Text>
                    </View>
                    <View className="flex-1 bg-[#F8FAFC] rounded-[18px] px-4 py-4">
                      <Text className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#94A3B8]">Radius</Text>
                      <Text className="text-[15px] font-bold text-[#1A2C42] mt-2">{kmToMiles(gig.travelRadiusKm)} mi</Text>
                    </View>
                  </View>

                  {gig.description ? (
                    <Text className="text-[14px] leading-[22px] text-[#5F7182] mt-4">{gig.description}</Text>
                  ) : null}

                  <View className="flex-row mt-5">
                    <TouchableOpacity
                      onPress={() =>
                        router.push({ pathname: "/(provider)/create-service", params: { editId: String(gig._id || gig.id) } } as never)
                      }
                      className="flex-1 mr-3 py-4 rounded-[18px] bg-[#F8FAFC] items-center"
                    >
                      <Text className="font-bold text-[#1A2C42]">Edit Gig</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => void handlePreview(gig)} className="flex-1 py-4 rounded-[18px] bg-[#2286BE] items-center">
                      <Text className="font-bold text-white">{statusLabel === "Under Review" ? "Preview Later" : "Preview"}</Text>
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row mt-3">
                    <TouchableOpacity onPress={() => void handleShareGig(gig)} className="flex-1 mr-3 py-3 rounded-[16px] bg-white border border-gray-200 items-center">
                      <Text className="font-bold text-[#1A2C42]">Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => void handleDeleteGig(gig)}
                      disabled={deleting}
                      className="flex-1 py-3 rounded-[16px] bg-red-50 border border-red-100 items-center"
                    >
                      {deleting ? <ActivityIndicator color="#DC2626" /> : <Text className="font-bold text-[#DC2626]">Delete</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
            <View className="items-center justify-center py-24">
              <View className="w-24 h-24 rounded-full bg-[#EAF3FA] items-center justify-center mb-5">
                <Ionicons name="briefcase-outline" size={42} color="#2286BE" />
              </View>
              <Text className="text-[24px] font-black text-[#1A2C42]">No gigs in this tab</Text>
              <Text className="text-[15px] leading-[24px] text-[#7C8B95] text-center mt-3 max-w-[280px]">
                Create a new service to start getting discovered by local clients.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(provider)/create-service" as never)}
                className="bg-[#2286BE] px-8 py-4 rounded-[20px] mt-8"
              >
                <Text className="text-white text-[16px] font-bold">Create New Gig</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={Boolean(analyticsGig)} transparent animationType="fade" onRequestClose={() => setAnalyticsGig(null)}>
        <View className="flex-1 bg-black/45 items-center justify-center px-5">
          <View className="w-full max-w-[440px] rounded-[28px] bg-white overflow-hidden border border-[#E2E8F0]">
            <View className="px-6 py-5 border-b border-gray-100 bg-white">
              <Text className="text-[24px] font-black text-[#1A2C42]">Gig Analytics</Text>
              <Text className="text-[13px] text-[#7C8B95] mt-2 leading-[20px]">
                {analyticsGig?.title || "Selected gig"} income for the last 30 days.
              </Text>
            </View>

            <ScrollView className="max-h-[72vh]" contentContainerStyle={{ padding: 24 }}>
              <View className="flex-row mb-4">
                <View className="flex-1 mr-3 rounded-[22px] bg-[#F8FAFC] px-4 py-5 border border-[#E2E8F0]">
                  <Text className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#94A3B8]">Last 30 Days Income</Text>
                  <Text className="text-[30px] font-black text-[#1A2C42] mt-3">
                    {analyticsLoading ? "..." : formatMoney(analyticsSummary?.totalIncome || 0)}
                  </Text>
                  <Text className="text-[12px] leading-[18px] text-[#7C8B95] mt-2">
                    Provider earnings from this gig over the last 30 days.
                  </Text>
                </View>

                <View className="flex-1 rounded-[22px] bg-[#F8FAFC] px-4 py-5 border border-[#E2E8F0]">
                  <Text className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#94A3B8]">Paid Completed Orders</Text>
                  <Text className="text-[30px] font-black text-[#1A2C42] mt-3">
                    {analyticsLoading ? "..." : Number(analyticsSummary?.completedPaidOrders || 0)}
                  </Text>
                  <Text className="text-[12px] leading-[18px] text-[#7C8B95] mt-2">
                    Orders that contributed income in this 30-day window.
                  </Text>
                </View>
              </View>

              <View className="rounded-[22px] border border-[#E2E8F0] bg-white p-4">
                <View className="mb-4">
                  <Text className="text-[18px] font-black text-[#1A2C42]">Daily Income Trend</Text>
                  <Text className="text-[13px] text-[#7C8B95] mt-1">Earnings from this gig across the last 30 days.</Text>
                </View>

                {analyticsLoading ? (
                  <View className="h-[260px] rounded-[18px] bg-[#F8FAFC] items-center justify-center">
                    <ActivityIndicator color="#2286BE" size="large" />
                  </View>
                ) : analyticsSeries.length ? (
                  <View className="rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <View className="flex-row mb-4">
                      <View className="flex-1 mr-3 rounded-[16px] bg-white px-3 py-3">
                        <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">Avg / Day</Text>
                        <Text className="text-[18px] font-black text-[#1A2C42] mt-2">
                          {formatMoney(analyticsTrendSummary.averageDailyIncome)}
                        </Text>
                      </View>
                      <View className="flex-1 rounded-[16px] bg-white px-3 py-3">
                        <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">Best Day</Text>
                        <Text className="text-[18px] font-black text-[#1A2C42] mt-2">
                          {formatMoney(analyticsTrendSummary.bestDayIncome)}
                        </Text>
                        <Text className="text-[11px] font-semibold text-[#7C8B95] mt-1">
                          {analyticsTrendSummary.bestDayLabel || "No peak day"}
                        </Text>
                      </View>
                    </View>

                    <View className="rounded-[16px] bg-white px-3 py-3 mb-4">
                      <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">Earning Days</Text>
                      <Text className="text-[18px] font-black text-[#1A2C42] mt-2">
                        {analyticsTrendSummary.activeIncomeDays}
                      </Text>
                      <Text className="text-[11px] font-semibold text-[#7C8B95] mt-1">
                        Days with income recorded
                      </Text>
                    </View>

                    <View className="rounded-[16px] bg-white p-3">
                      <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">
                          Trend Chart
                        </Text>
                        <Text className="text-[11px] font-bold text-[#2286BE]">
                          Max {formatCompactMoney(maxAnalyticsEarnings)}
                        </Text>
                      </View>

                      <View className="flex-row items-end h-[190px]">
                        <View className="justify-between h-full mr-3 pb-5">
                          {[maxAnalyticsEarnings, maxAnalyticsEarnings / 2, 0].map((value, index) => (
                            <Text key={`axis-${index}`} className="text-[10px] font-bold text-[#94A3B8]">
                              {formatCompactMoney(value)}
                            </Text>
                          ))}
                        </View>

                        <View className="flex-1">
                          <View className="absolute left-0 right-0 top-0 border-t border-dashed border-[#E2E8F0]" />
                          <View className="absolute left-0 right-0 top-1/2 border-t border-dashed border-[#E2E8F0]" />
                          <View className="absolute left-0 right-0 bottom-5 border-t border-dashed border-[#E2E8F0]" />

                          <View className="flex-row items-end justify-between h-[165px]">
                            {analyticsSeries.map((item, index) => (
                              <View key={`${item.label}-${index}`} className="flex-1 items-center justify-end mx-[1px]">
                                <View
                                  className="w-full rounded-t-[10px] bg-[#2286BE]"
                                  style={{ height: Math.max(10, (item.earnings / maxAnalyticsEarnings) * 135) }}
                                />
                              </View>
                            ))}
                          </View>

                          <View className="flex-row justify-between mt-3">
                            {analyticsSeries.map((item, index) => (
                              <View key={`${item.label}-axis`} className="flex-1 items-center">
                                <Text className="text-[10px] font-bold text-[#94A3B8]">
                                  {index % analyticsLabelStep === 0 || index === analyticsSeries.length - 1 ? item.label : ""}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View className="h-[260px] rounded-[18px] bg-[#F8FAFC] items-center justify-center">
                    <Text className="text-[14px] font-bold text-[#7C8B95]">No income recorded for this gig in the last 30 days.</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View className="px-6 py-4 border-t border-gray-100">
              <TouchableOpacity
                onPress={() => setAnalyticsGig(null)}
                className="h-[52px] rounded-[18px] bg-[#2286BE] items-center justify-center"
              >
                <Text className="text-white text-[15px] font-bold">Close</Text>
                
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(menuGig)} transparent animationType="fade" onRequestClose={() => setMenuGig(null)}>
        <View className="flex-1 bg-black/35 justify-end">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setMenuGig(null)} />
          <View className="bg-white rounded-t-[28px] px-6 pt-5 pb-5">
            <View className="w-12 h-1.5 rounded-full bg-gray-200 self-center mb-5" />
            <Text className="text-[18px] font-black text-[#1A2C42] mb-1">Gig Actions</Text>
            <Text className="text-[13px] text-[#7C8B95] mb-5">{menuGig?.title || "Selected gig"}</Text>

            <TouchableOpacity
              onPress={() => {
                const selectedGig = menuGig;
                setMenuGig(null);
                if (selectedGig) {
                  void handleOpenAnalytics(selectedGig);
                }
              }}
              className="h-[56px] rounded-[18px] bg-[#F8FAFC] border border-gray-200 px-4 flex-row items-center"
            >
              <Ionicons name="analytics-outline" size={20} color="#2286BE" />
              <Text className="ml-3 text-[15px] font-bold text-[#1A2C42]">View Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMenuGig(null)}
              className="h-[56px] rounded-[18px] bg-[#2286BE] mt-2 mb-8 items-center justify-center"
            >
              <Text className="text-white text-[15px] font-bold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
