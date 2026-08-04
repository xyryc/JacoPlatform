import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { skipToken } from "@reduxjs/toolkit/query";

import { KeyboardAwareScrollView as ScrollView } from "@/src/components/KeyboardAwareScrollView";
import { useAuth } from "@/src/contexts/AuthContext";
import { formatDeliveryTime } from "@/src/lib/deliveryTime";
import { formatCurrency } from "@/src/lib/formatters";
import {
  SchedulePickerFields,
  isFutureSchedule,
  toDateInputValue,
} from "@/src/components/SchedulePickerFields";
import {
  useCreateOrderMutation,
  useGetPublicProviderAvailabilityBlocksQuery,
  useGetPublicServiceByIdQuery,
} from "@/src/store/services/apiSlice";

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

const addDaysKey = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
};

const parseDateKey = (dateKey: string) => {
  const [year, month, day] = String(dateKey || "").split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const parseTimeToMinutes = (value = "") => {
  const text = String(value).trim();
  const meridiem = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (meridiem) {
    const rawHour = Number(meridiem[1]);
    const minute = Number(meridiem[2]);
    const hour = meridiem[3].toUpperCase() === "PM" ? (rawHour % 12) + 12 : rawHour % 12;
    return hour * 60 + minute;
  }
  const clock = text.match(/^(\d{1,2}):(\d{2})$/);
  if (!clock) return null;
  return Number(clock[1]) * 60 + Number(clock[2]);
};

const blockAppliesToDate = (block: any, dateKey: string) => {
  if (block.dateKey === dateKey) return true;
  if (block.recurrence !== "weekly") return false;
  const startDate = parseDateKey(block.dateKey);
  const targetDate = parseDateKey(dateKey);
  return Boolean(startDate && targetDate && targetDate >= startDate && targetDate.getDay() === startDate.getDay());
};

const isSlotBlocked = (blocks: any[], dateKey: string, timeValue: string) => {
  const minutes = parseTimeToMinutes(timeValue);
  return blocks.some((block) => {
    if (!blockAppliesToDate(block, dateKey)) return false;
    if (block.scope === "full_day") return true;
    const start = parseTimeToMinutes(block.startTime || "");
    const end = parseTimeToMinutes(block.endTime || "");
    return minutes !== null && start !== null && end !== null && minutes >= start && minutes < end;
  });
};

export default function BookServicePage() {
  const router = useRouter();
  const { user, role, setRole, isAuthenticated } = useAuth();
  const { id = "" } = useLocalSearchParams<{ id?: string }>();
  const isProviderMode = role === "provider";
  const { data, isLoading } = useGetPublicServiceByIdQuery(!id || isProviderMode ? skipToken : id);
  const [createOrder, { isLoading: creatingOrder }] = useCreateOrderMutation();
  const [step, setStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState(0);
  const [scheduledDate, setScheduledDate] = useState(toDateInputValue(tomorrow));
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [serviceAddress, setServiceAddress] = useState(user?.address || "");
  const [specialInstructions, setSpecialInstructions] = useState("");

  const service = data?.data || null;
  const providerId = service?.provider?.id || "";
  const { data: availabilityData } = useGetPublicProviderAvailabilityBlocksQuery(
    providerId ? { providerId, from: addDaysKey(0), to: addDaysKey(90) } : skipToken
  );
  const packageList = useMemo(() => service?.packages || [], [service?.packages]);
  const activePackage = useMemo(() => packageList[selectedPackage] || packageList[0] || null, [packageList, selectedPackage]);
  const availabilityBlocks = availabilityData?.data?.items || [];
  const selectedSlotBlocked = isSlotBlocked(availabilityBlocks, scheduledDate, scheduledTime);

  const continueStep = async () => {
    if (isProviderMode) {
      return;
    }

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!scheduledDate.trim() || !scheduledTime.trim()) return;
      if (!isFutureSchedule(scheduledDate, scheduledTime)) {
        Alert.alert("Invalid schedule", "Please select a future preferred date and time.");
        return;
      }
      if (selectedSlotBlocked) {
        Alert.alert("Provider unavailable", "The provider has blocked this date or time. Please choose another slot.");
        return;
      }
      setStep(3);
      return;
    }

    if (!service || !activePackage || !isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }

    if (!serviceAddress.trim()) return;
    if (selectedSlotBlocked) {
      Alert.alert("Provider unavailable", "The provider has blocked this date or time. Please choose another slot.");
      return;
    }

    await createOrder({
      gigId: service.id,
      packageName: activePackage.name,
      packageTitle: activePackage.title,
      scheduledDate,
      scheduledTime,
      serviceAddress: serviceAddress.trim(),
      specialInstructions: specialInstructions.trim(),
    }).unwrap();

    router.replace("/(tabs)/booking");
  };

  if (isLoading) {
    return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator size="large" color="#2B84B1" /></View>;
  }

  if (!service) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-8" edges={["top"]}>
        <Text className="text-[20px] font-bold text-[#1A2C42] mb-3">Booking not available</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-[#2B84B1] px-5 py-3 rounded-[18px]">
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (isProviderMode) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-8" edges={["top"]}>
        <View className="w-20 h-20 rounded-full bg-[#FEF3C7] items-center justify-center mb-6">
          <Ionicons name="shield-checkmark-outline" size={34} color="#D97706" />
        </View>
        <Text className="text-[24px] font-black text-[#1A2C42] text-center">Switch to buyer mode to order</Text>
        <Text className="text-[15px] leading-[24px] text-[#7C8B95] text-center mt-3 max-w-[300px]">
          Ordering services is available only while you are using the buyer side.
        </Text>
        <TouchableOpacity
          onPress={async () => {
            await setRole("client");
            router.replace({ pathname: "/book-service", params: { id } });
          }}
          className="bg-[#2B84B1] px-6 py-4 rounded-[18px] mt-8"
        >
          <Text className="text-white font-bold">Switch to Buyer Mode</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace("/(provider-tabs)")} className="px-6 py-4 mt-2">
          <Text className="text-[#2B84B1] font-bold">Back to Provider Dashboard</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FAFCFD]" edges={["top"]}>
      <View className="px-6 py-4 flex-row items-center bg-white shadow-sm shadow-black/5 z-10">
        <TouchableOpacity onPress={() => (step > 1 ? setStep((current) => current - 1) : router.back())} className="w-10 h-10 items-center justify-center bg-gray-50 rounded-full mr-4">
          <Ionicons name="arrow-back" size={20} color="#1A2C42" />
        </TouchableOpacity>
        <Text className="text-[20px] font-bold text-[#1A2C42] flex-1">Secure Checkout</Text>
        <Text className="text-[12px] font-bold text-[#7C8B95]">0{step}/03</Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 20, paddingBottom: 130 }}>
        <View className="flex-row mb-8">
          {[1, 2, 3].map((index) => (
            <View key={index} className="flex-1 h-2 rounded-full bg-[#E2E8F0] mr-2 overflow-hidden">
              {step >= index ? <View className="h-full bg-[#2B84B1]" /> : null}
            </View>
          ))}
        </View>

        <View className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-sm shadow-black/5 mb-8">
          <View className="flex-row">
            <View className="w-[90px] h-[90px] rounded-[20px] overflow-hidden bg-gray-100 mr-4">
              {service.images?.[0] ? <Image source={{ uri: service.images[0] }} className="w-full h-full" resizeMode="cover" /> : null}
            </View>
            <View className="flex-1">
              <Text className="text-[18px] font-bold text-[#1A2C42]" numberOfLines={2}>{service.title}</Text>
              <Text className="text-[13px] font-medium text-[#7C8B95] mt-1">{service.provider.name}</Text>
              <Text className="text-[18px] font-black text-[#2B84B1] mt-3">
                {formatCurrency(Number(activePackage?.price || service.avgPackagePrice || 0))}
              </Text>
            </View>
          </View>
        </View>

        {step === 1 ? (
          <View>
            <Text className="text-[26px] font-black text-[#1A2C42] mb-2">Choose your package</Text>
            <Text className="text-[14px] text-[#7C8B95] mb-6">Pick the package that best fits your needs.</Text>
            {packageList.map((pkg, index) => (
              <TouchableOpacity
                key={`${pkg.name}-${index}`}
                onPress={() => setSelectedPackage(index)}
                className={`bg-white rounded-[24px] p-5 border mb-4 ${selectedPackage === index ? "border-[#2B84B1]" : "border-gray-100"}`}
              >
                <View className="flex-row justify-between items-start mb-3">
                  <Text className="text-[18px] font-bold text-[#1A2C42]">{pkg.title}</Text>
                  <Text className="text-[18px] font-black text-[#2B84B1]">{formatCurrency(pkg.price)}</Text>
                </View>
                <Text className="text-[14px] leading-[22px] text-[#7C8B95]">{pkg.description}</Text>
                <View className="mt-4 flex-row items-center">
                  <Ionicons name="time-outline" size={16} color="#2B84B1" />
                  <Text className="ml-2 text-[13px] font-bold text-[#1A2C42]">
                    Estimated delivery: {formatDeliveryTime(pkg.deliveryTime, pkg.deliveryTimeUnit)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {step === 2 ? (
          <View>
            <Text className="text-[26px] font-black text-[#1A2C42] mb-2">Select date and time</Text>
            <Text className="text-[14px] text-[#7C8B95] mb-6">Tell us when you want the professional to arrive.</Text>
            <View className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm shadow-black/5">
              <SchedulePickerFields
                dateValue={scheduledDate}
                timeValue={scheduledTime}
                onDateChange={setScheduledDate}
                onTimeChange={setScheduledTime}
                className="flex-row mb-0"
                inputClassName="bg-[#F8FAFC]"
                labelClassName="text-[14px] font-bold text-[#1A2C42] mb-2"
              />
              {selectedSlotBlocked ? (
                <View className="mt-4 flex-row items-center rounded-[18px] bg-[#FEF2F2] px-4 py-3">
                  <Ionicons name="ban-outline" size={18} color="#DC2626" />
                  <Text className="ml-2 flex-1 text-[13px] font-bold text-[#DC2626]">
                    The provider is unavailable for this date or time.
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View>
            <Text className="text-[26px] font-black text-[#1A2C42] mb-2">Confirm location</Text>
            <Text className="text-[14px] text-[#7C8B95] mb-6">Add your service address and any extra notes.</Text>
            <View className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm shadow-black/5">
              <Text className="text-[14px] font-bold text-[#1A2C42] mb-2">Service Address</Text>
              <TextInput value={serviceAddress} onChangeText={setServiceAddress} placeholder="Enter your exact location" className="bg-[#F8FAFC] rounded-[18px] px-4 py-4 text-[15px] mb-5" />
              <Text className="text-[14px] font-bold text-[#1A2C42] mb-2">Special Instructions</Text>
              <TextInput value={specialInstructions} onChangeText={setSpecialInstructions} placeholder="Anything the provider should know?" multiline textAlignVertical="top" className="bg-[#F8FAFC] rounded-[18px] px-4 py-4 text-[15px] min-h-[120px]" />
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View className="absolute bottom-0 w-full bg-white px-6 pt-4 pb-10 border-t border-gray-100">
        <TouchableOpacity
          onPress={() => void continueStep()}
          disabled={creatingOrder || (step === 2 && selectedSlotBlocked)}
          className={`${creatingOrder || (step === 2 && selectedSlotBlocked) ? "bg-gray-300" : "bg-[#2B84B1]"} w-full py-5 rounded-[18px] items-center`}
        >
          {creatingOrder ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-[17px]">{step < 3 ? "Continue" : "Finalize Order"}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
