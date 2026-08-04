import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { formatDateLabel } from "@/src/lib/formatters";
import { useGetProviderRatingsQuery } from "@/src/store/services/apiSlice";

type ProviderRatingItem = {
  id?: string;
  clientRating?: number;
  clientReview?: string;
  completedAt?: string | null;
  createdAt?: string | null;
  packageTitle?: string;
  orderName?: string;
  categoryName?: string;
  client?: {
    name?: string;
  };
};

export default function ReviewsPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomSpacing =
    Platform.OS === "ios" ? 30 + insets.bottom : 30 + (insets.bottom > 0 ? insets.bottom : 0);
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, refetch } = useGetProviderRatingsQuery(
    { page, limit: 8 },
    {
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const items = useMemo(
    () => ((data?.data?.items || []) as ProviderRatingItem[]).filter((item) => Number(item?.clientRating || 0) > 0),
    [data?.data?.items]
  );
  const summary = data?.data?.summary;
  const pagination = data?.data?.pagination;

  const ratingBreakdown = useMemo(() => {
    const counts = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: items.filter((item) => Math.round(Number(item.clientRating || 0)) === star).length,
    }));
    const total = counts.reduce((sum, item) => sum + item.count, 0);
    return counts.map((item) => ({
      ...item,
      pct: total > 0 ? Math.round((item.count / total) * 100) : 0,
    }));
  }, [items]);

  return (
    <SafeAreaView className="flex-1 bg-[#FAFCFD]" edges={["top"]}>
      <View className="px-6 py-4 flex-row items-center bg-white shadow-sm shadow-black/5 z-10 w-full mb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center mr-4"
        >
          <Ionicons name="arrow-back" size={20} color="#1A2C42" />
        </TouchableOpacity>
        <Text className="text-[20px] font-bold text-[#1A2C42]">Buyer Reviews</Text>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomSpacing }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => void refetch()}
            tintColor="#2286BE"
            colors={["#2286BE"]}
          />
        }
      >
        <View className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm shadow-gray-100 mb-6 flex-row items-center">
          <View className="items-center mr-6 pr-6 border-r border-gray-100">
            <Text className="text-[42px] font-black text-[#1A2C42]">
              {Number(summary?.averageRating || 0).toFixed(1)}
            </Text>
            <View className="flex-row mb-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons key={s} name="star" size={16} color="#FF9500" />
              ))}
            </View>
            <Text className="text-[12px] text-[#7C8B95] font-medium">
              {Number(summary?.reviewCount || 0)} Reviews
            </Text>
          </View>

          <View className="flex-1">
            {ratingBreakdown.map((bars) => (
              <View key={bars.star} className="flex-row items-center mb-1">
                <Text className="text-[12px] text-[#7C8B95] font-bold w-3">{bars.star}</Text>
                <Ionicons name="star" size={10} color="#CBD5E1" style={{ marginHorizontal: 4 }} />
                <View className="flex-1 h-1.5 bg-gray-100 rounded-full mx-2 overflow-hidden">
                  <View className="h-full bg-[#FF9500] rounded-full" style={{ width: `${bars.pct}%` }} />
                </View>
                <Text className="text-[10px] text-[#A0AEC0] w-8">{bars.pct}%</Text>
              </View>
            ))}
          </View>
        </View>

        <Text className="text-[16px] font-bold text-[#1A2C42] mb-4">Recent Feedback</Text>

        {isLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#2286BE" />
          </View>
        ) : items.length ? (
          <>
            {items.map((review) => (
              <View
                key={review.id || `${review.completedAt}-${review.client?.name}`}
                className="bg-white rounded-[24px] p-5 mb-4 border border-gray-100 shadow-sm shadow-gray-100"
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-row items-center flex-1 pr-3">
                    <View className="w-10 h-10 bg-gray-100 rounded-full mr-3 items-center justify-center">
                      <Ionicons name="person" size={20} color="#CBD5E1" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] font-bold text-[#1A2C42]">
                        {review.client?.name || "Client"}
                      </Text>
                      <Text className="text-[12px] text-[#7C8B95]">
                        {formatDateLabel(review.completedAt || review.createdAt || "")}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center bg-[#FFF9E6] px-2 py-1 rounded-lg">
                    <Ionicons name="star" size={14} color="#FF9500" />
                    <Text className="text-[13px] font-bold text-[#FF9500] ml-1">
                      {Number(review.clientRating || 0).toFixed(1)}
                    </Text>
                  </View>
                </View>

                <Text className="text-[14px] text-[#4A5568] leading-[22px] mb-4">
                  {review.clientReview?.trim() || "No written feedback left for this order."}
                </Text>

                <View className="flex-row items-center bg-gray-50 p-3 rounded-[12px]">
                  <Ionicons name="briefcase-outline" size={16} color="#7C8B95" />
                  <Text className="text-[12px] text-[#7C8B95] font-medium ml-2 flex-1" numberOfLines={1}>
                    {review.packageTitle || review.orderName || review.categoryName || "Service order"}
                  </Text>
                </View>
              </View>
            ))}

            {pagination && pagination.totalPages > 1 ? (
              <View className="bg-white border border-[#E2E8F0] rounded-[20px] px-4 py-4 flex-row items-center justify-between mt-2">
                <TouchableOpacity
                  disabled={!pagination.hasPrevPage || isFetching}
                  onPress={() => setPage((prev) => Math.max(1, prev - 1))}
                  className={`px-4 py-3 rounded-[16px] ${pagination.hasPrevPage ? "bg-[#F8FAFC]" : "bg-[#E2E8F0]"}`}
                >
                  <Text className={`font-bold ${pagination.hasPrevPage ? "text-[#1A2C42]" : "text-[#94A3B8]"}`}>
                    Prev
                  </Text>
                </TouchableOpacity>
                <Text className="text-[13px] font-bold tracking-[0.18em] uppercase text-[#64748B]">
                  {page} / {pagination.totalPages}
                </Text>
                <TouchableOpacity
                  disabled={!pagination.hasNextPage || isFetching}
                  onPress={() => setPage((prev) => prev + 1)}
                  className={`px-4 py-3 rounded-[16px] ${pagination.hasNextPage ? "bg-[#F8FAFC]" : "bg-[#E2E8F0]"}`}
                >
                  <Text className={`font-bold ${pagination.hasNextPage ? "text-[#1A2C42]" : "text-[#94A3B8]"}`}>
                    Next
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        ) : (
          <View className="items-center justify-center py-24">
            <View className="w-24 h-24 rounded-full bg-[#EAF3FA] items-center justify-center mb-5">
              <Ionicons name="star-outline" size={42} color="#2286BE" />
            </View>
            <Text className="text-[24px] font-black text-[#1A2C42]">No reviews yet</Text>
            <Text className="text-[15px] leading-[24px] text-[#7C8B95] text-center mt-3 max-w-[280px]">
              Completed orders with buyer ratings will show up here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
