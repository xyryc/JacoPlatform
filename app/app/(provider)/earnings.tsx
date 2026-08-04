import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, Alert, RefreshControl, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useMemo, useState } from "react";

import { KeyboardAwareScrollView as ScrollView } from "@/src/components/KeyboardAwareScrollView";
import { useSocketNotifications } from "@/src/contexts/SocketContext";
import { formatCurrency, formatDateLabel, formatStatusLabel } from "@/src/lib/formatters";
import {
  useGetMyWithdrawalsQuery,
  useRequestWithdrawalMutation,
} from "@/src/store/services/apiSlice";

export default function EarningsPage() {
  const router = useRouter();
  const { notifications } = useSocketNotifications();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [page, setPage] = useState(1);
  const limit = 8;
  const { data, isLoading, isFetching, refetch } = useGetMyWithdrawalsQuery({ page, limit, status: "all" });
  const [requestWithdrawal, { isLoading: requesting }] = useRequestWithdrawalMutation();
  const balance = data?.data.balance || null;
  const withdrawals = data?.data.withdrawals || [];
  const pagination = data?.data.pagination || null;
  const availableBalance = Number(balance?.availableBalance || 0);
  const pendingWithdrawalAmount = Number(balance?.pendingWithdrawalAmount || 0);
  const totalWithdrawn = Number(balance?.totalWithdrawn || 0);
  const totalEarnings = Number(balance?.totalEarnings || 0);
  const latestWithdrawalNotification = useMemo(
    () =>
      notifications.find((notification) => {
        const type = String(notification.data?.notificationType || "");
        return (
          type === "withdrawal_request_created" ||
          type === "withdrawal_request_approved" ||
          type === "withdrawal_request_rejected" ||
          type === "withdrawal_paid"
        );
      }),
    [notifications]
  );

  useEffect(() => {
    if (!latestWithdrawalNotification) return;
    void refetch();
  }, [latestWithdrawalNotification, refetch]);

  const submitWithdrawal = async () => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid withdrawal amount.");
      return;
    }
    if (numericAmount > availableBalance) {
      Alert.alert("Insufficient balance", "This withdrawal amount is higher than your available balance.");
      return;
    }
    try {
      await requestWithdrawal({ amount: numericAmount, note: note.trim() }).unwrap();
      setAmount("");
      setNote("");
      setPage(1);
      refetch();
      Alert.alert("Request sent", "Your withdrawal request has been submitted.");
    } catch (error) {
      Alert.alert("Request failed", error instanceof Error ? error.message : "Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFCFD]" edges={["top"]}>
      <View className="px-6 py-4 flex-row items-center bg-white shadow-sm shadow-black/5 z-10 w-full mb-2">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center mr-4"><Ionicons name="arrow-back" size={20} color="#1A2C42" /></TouchableOpacity>
        <Text className="text-[20px] font-bold text-[#1A2C42]">Earnings</Text>
      </View>
      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#2B84B1" size="large" /></View>
      ) : (
        <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}>
          <View className="bg-[#1A2C42] rounded-[24px] p-6 mb-6 shadow-xl shadow-[#1A2C42]/30">
            <Text className="text-white/70 text-[14px] font-medium mb-1">Available for Withdrawal</Text>
            <Text className="text-white text-[36px] font-black">{formatCurrency(availableBalance)}</Text>
            <Text className="text-white/70 text-[13px] mt-2">Ready for payout request</Text>
          </View>
          <View className="flex-row mb-6">
            <View className="flex-1 bg-white rounded-[22px] p-5 border border-gray-100 shadow-sm shadow-gray-100 mr-3">
              <Text className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">Pending</Text>
              <Text className="text-[24px] font-black text-[#1A2C42] mt-3">{formatCurrency(pendingWithdrawalAmount)}</Text>
              <Text className="text-[12px] text-[#7C8B95] mt-1">Awaiting admin review</Text>
            </View>
            <View className="flex-1 bg-white rounded-[22px] p-5 border border-gray-100 shadow-sm shadow-gray-100">
              <Text className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">Withdrawn</Text>
              <Text className="text-[24px] font-black text-[#1A2C42] mt-3">{formatCurrency(totalWithdrawn)}</Text>
              <Text className="text-[12px] text-[#7C8B95] mt-1">From {formatCurrency(totalEarnings)} total earnings</Text>
            </View>
          </View>
          <View className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm shadow-gray-100 mb-8">
            <Text className="text-[18px] font-bold text-[#1A2C42] mb-4">Request Withdrawal</Text>
            <TextInput placeholder="Amount" placeholderTextColor="#A0AEC0" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} className="bg-[#F8FAFC] rounded-[18px] px-4 py-4 text-[15px] text-[#1A2C42] mb-3" />
            <View className="flex-row justify-between items-center mb-3 px-1">
              <Text className="text-[12px] font-medium text-[#7C8B95]">Available: {formatCurrency(availableBalance)}</Text>
              <TouchableOpacity onPress={() => setAmount(String(availableBalance.toFixed(2)))} disabled={availableBalance <= 0}>
                <Text className={`text-[12px] font-bold ${availableBalance > 0 ? "text-[#2B84B1]" : "text-[#A0AEC0]"}`}>Withdraw Max</Text>
              </TouchableOpacity>
            </View>
            <TextInput placeholder="Note (optional)" placeholderTextColor="#A0AEC0" value={note} onChangeText={setNote} className="bg-[#F8FAFC] rounded-[18px] px-4 py-4 text-[15px] text-[#1A2C42] mb-4" />
            <View className="bg-[#F8FAFC] rounded-[18px] px-4 py-4 mb-4">
              <Text className="text-[13px] leading-[21px] text-[#64748B]">
                Withdrawal requests are reviewed by admin. Pending requests reduce your available balance until processed.
              </Text>
            </View>
            <TouchableOpacity onPress={() => void submitWithdrawal()} disabled={requesting} className="w-full bg-[#2B84B1] h-[56px] rounded-[16px] items-center justify-center flex-row">
              {requesting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-[16px]">Withdraw Balance</Text>}
            </TouchableOpacity>
          </View>
          <Text className="text-[18px] font-bold text-[#1A2C42] mb-4">Transaction History</Text>
          <View className="bg-white rounded-[24px] px-5 py-2 border border-gray-100 shadow-sm shadow-gray-100 mb-10">
            {withdrawals.length ? withdrawals.map((item) => (
              <View key={item.id} className="flex-row items-center py-4 border-b border-gray-100">
                <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${item.status === "rejected" ? "bg-[#FFF0F0]" : "bg-[#EAF6ED]"}`}>
                  <Ionicons name={item.status === "paid" ? "arrow-up" : "arrow-down"} size={20} color={item.status === "rejected" ? "#FF4757" : item.status === "paid" ? "#2B84B1" : "#55A06F"} />
                </View>
                <View className="flex-1">
                  <Text className="text-[16px] font-bold text-[#1A2C42] mb-1">{formatStatusLabel(item.status)} withdrawal</Text>
                  <Text className="text-[14px] text-[#7C8B95]">{formatDateLabel(item.requestedAt)}</Text>
                  <Text className="text-[12px] text-[#A0AEC0] mt-1">{item.id}</Text>
                </View>
                <Text className={`text-[16px] font-bold ${item.status === "rejected" ? "text-[#FF4757]" : "text-[#55A06F]"}`}>{formatCurrency(item.amount)}</Text>
              </View>
            )) : <View className="py-10 items-center"><Ionicons name="document-text-outline" size={42} color="#CBD5E1" /><Text className="text-[15px] font-bold text-[#1A2C42] mt-3">No withdrawals yet</Text></View>}
          </View>
          {pagination && pagination.totalPages > 1 ? (
            <View className="mb-10">
              <View className="bg-white border border-[#E2E8F0] rounded-[20px] px-4 py-4 flex-row items-center justify-between">
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
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
