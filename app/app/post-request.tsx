import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KeyboardAwareScrollView as ScrollView } from "@/src/components/KeyboardAwareScrollView";
import { MapboxLocationPicker } from "@/src/components/MapboxLocationPicker";
import { useAuth } from "@/src/contexts/AuthContext";
import { geocodeAddress, resolveAddressFromCoordinates } from "@/src/lib/geocode";
import { extractZipCode } from "@/src/lib/zip";
import {
  useCreateServiceRequestMutation,
  useGetCategoriesQuery,
} from "@/src/store/services/apiSlice";

type PickerAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

type PickerMode = "date" | "time" | null;

const slugifySearchTerm = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateInputValue = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const buildDateTime = (dateValue: string, timeValue: string) => {
  const date = parseDateInputValue(dateValue);
  const [hour, minute] = timeValue.split(":").map(Number);
  if (!date || !Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  date.setHours(hour, minute, 0, 0);
  return date;
};

const monthTitle = (date: Date) =>
  date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

const formatTimeLabel = (totalMinutes: number) => {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
};

const toTimeLabel = (timeValue: string) => {
  const [hour, minute] = timeValue.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return timeValue;
  return formatTimeLabel(hour * 60 + minute);
};

const toTimeInputValue = (hour: number, minute: number, period: "AM" | "PM") => {
  const normalizedHour = period === "PM" ? (hour % 12) + 12 : hour % 12;
  return `${String(normalizedHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const toTimeParts = (timeValue: string) => {
  const [rawHour, rawMinute] = timeValue.split(":").map(Number);
  if (!Number.isFinite(rawHour) || !Number.isFinite(rawMinute)) {
    return { hour: 10, minute: 0, period: "AM" as const };
  }

  return {
    hour: rawHour % 12 || 12,
    minute: rawMinute,
    period: rawHour >= 12 ? ("PM" as const) : ("AM" as const),
  };
};

const buildCalendarDays = (monthDate: Date) => {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
};

export default function PostRequestPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    categoryName?: string;
    categorySlug?: string;
    zipCode?: string;
  }>();
  const { isAuthenticated, user } = useAuth();
  const { data: categoriesPayload, isLoading: loadingCategories } = useGetCategoriesQuery();
  const [createServiceRequest, { isLoading: submitting }] = useCreateServiceRequestMutation();
  const queryCategoryName = String(params.categoryName || "").trim();
  const queryCategorySlug = String(params.categorySlug || "").trim() || slugifySearchTerm(queryCategoryName);
  const queryZipCode = extractZipCode(String(params.zipCode || ""));
  const [selectedCategory, setSelectedCategory] = useState(queryCategorySlug || "");
  const [categoryMode, setCategoryMode] = useState<"existing" | "custom">("existing");
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customCategoryDescription, setCustomCategoryDescription] = useState("");
  const [serviceAddress, setServiceAddress] = useState(user?.address || (queryZipCode ? `ZIP ${queryZipCode}` : ""));
  const [description, setDescription] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [activePicker, setActivePicker] = useState<PickerMode>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfDay(new Date()));
  const [tempHour, setTempHour] = useState(10);
  const [tempMinute, setTempMinute] = useState(0);
  const [tempPeriod, setTempPeriod] = useState<"AM" | "PM">("AM");
  const [budget, setBudget] = useState("");
  const [assets, setAssets] = useState<PickerAsset[]>([]);
  const [selectedMapCoords, setSelectedMapCoords] = useState({
    lat: typeof user?.locationLat === "number" ? user.locationLat : 40.7128,
    lng: typeof user?.locationLng === "number" ? user.locationLng : -74.006,
  });
  const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
  const today = startOfDay(new Date());
  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
  const preferredTimeLabel = preferredTime ? toTimeLabel(preferredTime) : "";
  const tempTimeValue = toTimeInputValue(tempHour, tempMinute, tempPeriod);
  const tempDateTime = buildDateTime(preferredDate || toDateInputValue(new Date()), tempTimeValue);
  const canConfirmTime = Boolean(tempDateTime && tempDateTime.getTime() > Date.now());
  const canGoToPreviousMonth =
    calendarMonth.getFullYear() > today.getFullYear() ||
    (calendarMonth.getFullYear() === today.getFullYear() && calendarMonth.getMonth() > today.getMonth());

  const categories = useMemo(() => {
    const baseCategories = categoriesPayload?.data || [];
    const hasQueryCategory =
      queryCategorySlug &&
      !baseCategories.some((item) => item.slug === queryCategorySlug);

    if (!hasQueryCategory) return baseCategories;

    return [
      {
        id: queryCategorySlug,
        name: queryCategoryName || queryCategorySlug,
        slug: queryCategorySlug,
      },
      ...baseCategories,
    ];
  }, [categoriesPayload?.data, queryCategoryName, queryCategorySlug]);

  const activeCategory = useMemo(() => {
    if (!categories.length) return null;
    return categories.find((item) => item.slug === selectedCategory) || categories[0];
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (!selectedCategory && queryCategorySlug) {
      setSelectedCategory(queryCategorySlug);
    }
  }, [queryCategorySlug, selectedCategory]);

  useEffect(() => {
    const approvedCategoryItems = categoriesPayload?.data || [];
    const hasApprovedQueryCategory = approvedCategoryItems.some((item) => item.slug === queryCategorySlug);
    if (queryCategorySlug && !hasApprovedQueryCategory) {
      setCategoryMode("custom");
      setCustomCategoryName((current) => current || queryCategoryName || queryCategorySlug);
      return;
    }

    if (queryCategorySlug && hasApprovedQueryCategory) {
      setCategoryMode("existing");
    }
  }, [categoriesPayload?.data, queryCategoryName, queryCategorySlug]);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "We need photo access so you can add reference images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 4,
    });

    if (result.canceled) return;
    setAssets(
      result.assets.slice(0, 4).map((asset) => ({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      }))
    );
  };

  const handleUseCurrentLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Enable location permission to use your current location.");
      return;
    }

    const current = await Location.getCurrentPositionAsync({});
    const lat = current.coords.latitude;
    const lng = current.coords.longitude;
    setSelectedMapCoords({ lat, lng });
    setServiceAddress(await resolveAddressFromCoordinates(lat, lng));
  };

  const handleSetCenterAsLocation = async () => {
    setServiceAddress(await resolveAddressFromCoordinates(selectedMapCoords.lat, selectedMapCoords.lng));
  };

  const openTimePicker = () => {
    const parts = toTimeParts(preferredTime);
    setTempHour(parts.hour);
    setTempMinute(parts.minute);
    setTempPeriod(parts.period);
    setActivePicker("time");
  };

  const selectPreferredDate = (date: Date) => {
    const value = toDateInputValue(date);
    setPreferredDate(value);

    const selectedDateTime = preferredTime ? buildDateTime(value, preferredTime) : null;
    if (selectedDateTime && selectedDateTime.getTime() <= Date.now()) {
      setPreferredTime("");
    }

    setActivePicker(null);
  };

  const shiftCalendarMonth = (direction: -1 | 1) => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  };

  const confirmPreferredTime = () => {
    if (!canConfirmTime) {
      Alert.alert("Select a future time", "Please choose a time later than now.");
      return;
    }

    setPreferredTime(tempTimeValue);
    setActivePicker(null);
  };

  const submitRequest = async () => {
    if (!isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }

    if (!serviceAddress.trim() || !description.trim() || !preferredDate || !preferredTime || !budget.trim()) {
      Alert.alert("Missing fields", "Please complete all required fields.");
      return;
    }

    const preferredDateTime = buildDateTime(preferredDate, preferredTime);
    if (!preferredDateTime || preferredDateTime.getTime() <= Date.now()) {
      Alert.alert("Invalid schedule", "Please select a future preferred date and time.");
      return;
    }

    if (categoryMode === "existing" && !activeCategory) {
      Alert.alert("Missing category", "Please select an existing category.");
      return;
    }

    if (categoryMode === "custom" && !customCategoryName.trim()) {
      Alert.alert("Missing category", "Please enter the custom category you want admin to add.");
      return;
    }

    const numericBudget = Number(budget);
    if (!Number.isFinite(numericBudget) || numericBudget <= 0) {
      Alert.alert("Invalid budget", "Please enter a valid budget.");
      return;
    }

    let finalCoords = selectedMapCoords;
    const geocoded = await geocodeAddress(serviceAddress.trim());
    if (geocoded) {
      finalCoords = geocoded;
    }

    const formData = new FormData();
    formData.append("requestCustomCategory", String(categoryMode === "custom"));
    if (categoryMode === "custom") {
      formData.append("customCategoryName", customCategoryName.trim());
      if (customCategoryDescription.trim()) {
        formData.append("customCategoryDescription", customCategoryDescription.trim());
      }
      formData.append("categorySlug", slugifySearchTerm(customCategoryName));
      formData.append("categoryName", customCategoryName.trim());
    } else if (activeCategory) {
      formData.append("categorySlug", activeCategory.slug);
      formData.append("categoryName", activeCategory.name);
    }
    formData.append("serviceAddress", serviceAddress.trim());
    formData.append("serviceLocationLat", String(finalCoords.lat));
    formData.append("serviceLocationLng", String(finalCoords.lng));
    formData.append("description", description.trim());
    if (preferredDate.trim()) formData.append("preferredDate", preferredDate.trim());
    formData.append("preferredTime", preferredTime.trim());
    formData.append("budget", String(numericBudget));
    assets.forEach((asset, index) => {
      formData.append("images", {
        uri: asset.uri,
        name: asset.fileName || `request-${index + 1}.jpg`,
        type: asset.mimeType || "image/jpeg",
      } as any);
    });

    try {
      await createServiceRequest(formData).unwrap();
      Alert.alert(
        categoryMode === "custom" ? "Sent for review" : "Posted",
        categoryMode === "custom"
          ? "Your custom category request is waiting for admin approval. Once approved, the request will go live."
          : "Your request has been posted and nearby providers were notified.",
        [
        { text: "OK", onPress: () => router.back() },
        ]
      );
    } catch (error) {
      Alert.alert("Could not submit request", error instanceof Error ? error.message : "Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFCFD]" edges={["top"]}>
      <View className="px-6 py-4 flex-row items-center bg-white shadow-sm shadow-black/5 z-10">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-gray-50 rounded-full mr-4">
          <Ionicons name="arrow-back" size={20} color="#1A2C42" />
        </TouchableOpacity>
        <Text className="text-[20px] font-bold text-[#1A2C42]">Post Request</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text className="text-[14px] font-bold uppercase tracking-[0.14em] text-[#1A2C42] mb-3 ml-1">Service Category</Text>
        <View className="mb-4 flex-row gap-3">
          <TouchableOpacity
            onPress={() => setCategoryMode("existing")}
            className={`flex-1 rounded-[18px] border px-4 py-4 items-center justify-center ${categoryMode === "existing" ? "border-[#2286BE] bg-[#2286BE]/10" : "border-gray-200 bg-white"}`}
          >
            <Text className={`text-[12px] text-center font-bold ${categoryMode === "existing" ? "text-[#2286BE]" : "text-[#6B7280]"}`}>
              Select existing category
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setCategoryMode("custom");
              setCustomCategoryName((current) => current || queryCategoryName || activeCategory?.name || "");
            }}
            className={`flex-1 rounded-[18px] border px-4 py-4 items-center justify-center ${categoryMode === "custom" ? "border-[#2286BE] bg-[#2286BE]/10" : "border-gray-200 bg-white"}`}
          >
            <Text className={`text-[12px] text-center font-bold ${categoryMode === "custom" ? "text-[#2286BE]" : "text-[#6B7280]"}`}>
              Request new category
            </Text>
          </TouchableOpacity>
        </View>
        {categoryMode === "existing" ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
            {loadingCategories ? (
              <ActivityIndicator color="#2286BE" />
            ) : (
              categories.map((category) => (
                <TouchableOpacity
                  key={category.id || category.slug}
                  onPress={() => setSelectedCategory(category.slug)}
                  className={`px-4 py-3 rounded-[18px] mr-3 ${(selectedCategory || activeCategory?.slug) === category.slug ? "bg-[#2286BE]" : "bg-white border border-gray-200"}`}
                >
                  <Text className={`font-bold ${(selectedCategory || activeCategory?.slug) === category.slug ? "text-white" : "text-[#1A2C42]"}`}>{category.name}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        ) : (
          <View className="mb-6 rounded-[24px] border border-dashed border-[#2286BE]/30 bg-[#2286BE]/5 p-4">
            <TextInput
              value={customCategoryName}
              onChangeText={setCustomCategoryName}
              placeholder="Enter the category you want admin to add"
              placeholderTextColor="#94A3B8"
              className="bg-white rounded-[18px] border border-gray-200 px-4 py-4 text-[15px] mb-3 text-[#1A2C42]"
            />
            <TextInput
              multiline
              textAlignVertical="top"
              value={customCategoryDescription}
              onChangeText={setCustomCategoryDescription}
              placeholder="Optional: explain this new category for admin"
              placeholderTextColor="#94A3B8"
              className="bg-white rounded-[18px] border border-gray-200 px-4 py-4 text-[15px] min-h-[96px] text-[#1A2C42]"
            />
            <Text className="mt-3 text-[12px] font-semibold leading-[18px] text-[#51606C]">
              Admin will review this category first. Once approved, your request will go live to nearby providers.
            </Text>
          </View>
        )}

        <Text className="text-[14px] font-bold text-[#1A2C42] mb-2 ml-1">Service Location</Text>
        <TextInput value={serviceAddress} onChangeText={setServiceAddress} placeholder="Enter exact location" className="bg-white rounded-[18px] px-4 py-4 text-[15px] mb-4" />
        {queryZipCode ? (
          <View className="mb-4 self-start rounded-full bg-[#EAF3FA] px-4 py-2">
            <Text className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2286BE]">
              Search ZIP {queryZipCode}
            </Text>
          </View>
        ) : null}
        <MapboxLocationPicker
          token={mapboxToken}
          initialCenter={selectedMapCoords}
          onCenterChange={setSelectedMapCoords}
          badgeText="Move map and set center as service location"
          loadingText="Loading interactive map..."
          fallbackHintText="Using fallback map tiles. Add EXPO_PUBLIC_MAPBOX_TOKEN for the same Mapbox styling as web."
        />
        <View className="flex-row justify-between mt-3 mb-6">
          <TouchableOpacity onPress={() => void handleUseCurrentLocation()} className="bg-white border border-gray-200 rounded-[16px] px-4 py-3">
            <Text className="font-bold text-[#2286BE]">Use Current Location</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => void handleSetCenterAsLocation()} className="bg-white border border-gray-200 rounded-[16px] px-4 py-3">
            <Text className="font-bold text-[#2286BE]">Set Center</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-[14px] font-bold text-[#1A2C42] mb-2 ml-1">Description</Text>
        <TextInput multiline textAlignVertical="top" value={description} onChangeText={setDescription} placeholder="Describe your requirements..." className="bg-white rounded-[18px] px-4 py-4 text-[15px] min-h-[120px] mb-6" />

        <View className="flex-row mb-6">
          <View className="flex-1 mr-3">
            <Text className="text-[14px] font-bold text-[#1A2C42] mb-2 ml-1">Preferred Date</Text>
            <TouchableOpacity
              onPress={() => {
                const selectedDate = parseDateInputValue(preferredDate);
                setCalendarMonth(selectedDate || startOfDay(new Date()));
                setActivePicker("date");
              }}
              className="bg-white rounded-[18px] px-4 py-4 min-h-[54px] flex-row items-center justify-between"
            >
              <Text className={`text-[15px] font-semibold ${preferredDate ? "text-[#1A2C42]" : "text-[#94A3B8]"}`}>
                {preferredDate || "Select date"}
              </Text>
              <Ionicons name="calendar-outline" size={18} color="#2286BE" />
            </TouchableOpacity>
          </View>
          <View className="flex-1">
            <Text className="text-[14px] font-bold text-[#1A2C42] mb-2 ml-1">Preferred Time</Text>
            <TouchableOpacity
              onPress={openTimePicker}
              className="bg-white rounded-[18px] px-4 py-4 min-h-[54px] flex-row items-center justify-between"
            >
              <Text className={`text-[15px] font-semibold ${preferredTime ? "text-[#1A2C42]" : "text-[#94A3B8]"}`}>
                {preferredTimeLabel || "Select time"}
              </Text>
              <Ionicons name="time-outline" size={18} color="#2286BE" />
            </TouchableOpacity>
          </View>
        </View>

        <Text className="text-[14px] font-bold text-[#1A2C42] mb-2 ml-1">Budget</Text>
        <TextInput keyboardType="decimal-pad" value={budget} onChangeText={setBudget} placeholder="100" className="bg-white rounded-[18px] px-4 py-4 text-[15px] mb-6" />

        <TouchableOpacity onPress={pickImages} className="w-full h-[140px] border-2 border-dashed border-[#CBD5E1] rounded-[24px] bg-[#FAFCFD] items-center justify-center mb-4">
          <Ionicons name="cloud-upload" size={36} color="#2286BE" />
          <Text className="font-bold text-[#1A2C42] mt-2">Upload Reference Images</Text>
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
          {assets.map((asset) => (
            <Image key={asset.uri} source={{ uri: asset.uri }} className="w-28 h-24 rounded-[18px] mr-3 bg-slate-100" />
          ))}
        </ScrollView>
      </ScrollView>

      <Modal visible={Boolean(activePicker)} animationType="slide" transparent onRequestClose={() => setActivePicker(null)}>
        <View className="flex-1 justify-end bg-black/40">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setActivePicker(null)} />
          <View className="max-h-[70%] rounded-t-[28px] bg-white px-6 pb-8 pt-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[20px] font-black text-[#1A2C42]">
                {activePicker === "date" ? "Select Preferred Date" : "Select Preferred Time"}
              </Text>
              <TouchableOpacity onPress={() => setActivePicker(null)} className="h-10 w-10 items-center justify-center rounded-full bg-[#F8FAFC]">
                <Ionicons name="close" size={20} color="#1A2C42" />
              </TouchableOpacity>
            </View>

            {activePicker === "date" ? (
              <View>
                <View className="mb-4 flex-row items-center justify-between">
                  <TouchableOpacity
                    disabled={!canGoToPreviousMonth}
                    onPress={() => shiftCalendarMonth(-1)}
                    className={`h-10 w-10 items-center justify-center rounded-full ${
                      canGoToPreviousMonth ? "bg-[#EAF3FA]" : "bg-gray-100"
                    }`}
                  >
                    <Ionicons name="chevron-back" size={20} color={canGoToPreviousMonth ? "#2286BE" : "#CBD5E1"} />
                  </TouchableOpacity>
                  <Text className="text-[17px] font-black text-[#1A2C42]">{monthTitle(calendarMonth)}</Text>
                  <TouchableOpacity onPress={() => shiftCalendarMonth(1)} className="h-10 w-10 items-center justify-center rounded-full bg-[#EAF3FA]">
                    <Ionicons name="chevron-forward" size={20} color="#2286BE" />
                  </TouchableOpacity>
                </View>

                <View className="mb-2 flex-row">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <Text key={day} className="flex-1 text-center text-[11px] font-black uppercase text-[#94A3B8]">
                      {day}
                    </Text>
                  ))}
                </View>

                <View className="flex-row flex-wrap">
                  {calendarDays.map((date) => {
                    const value = toDateInputValue(date);
                    const isOutsideMonth = date.getMonth() !== calendarMonth.getMonth();
                    const isPast = startOfDay(date).getTime() < today.getTime();
                    const isSelected = preferredDate === value;
                    const isToday = isSameDay(date, new Date());

                    return (
                      <TouchableOpacity
                        key={value}
                        disabled={isPast}
                        onPress={() => selectPreferredDate(date)}
                        className="w-[14.285%] p-1"
                      >
                        <View
                          className={`h-10 items-center justify-center rounded-[14px] ${
                            isSelected
                              ? "bg-[#2286BE]"
                              : isPast
                                ? "bg-transparent"
                                : isToday
                                  ? "bg-[#EAF3FA]"
                                  : "bg-[#F8FAFC]"
                          }`}
                        >
                          <Text
                            className={`text-[13px] font-bold ${
                              isSelected
                                ? "text-white"
                                : isPast
                                  ? "text-[#CBD5E1]"
                                  : isOutsideMonth
                                    ? "text-[#94A3B8]"
                                    : "text-[#1A2C42]"
                            }`}
                          >
                            {date.getDate()}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View>
                <Text className="mb-3 text-[12px] font-bold uppercase tracking-[0.14em] text-[#7C8B95]">Hour</Text>
                <View className="mb-5 flex-row flex-wrap">
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((hour) => (
                    <TouchableOpacity key={hour} onPress={() => setTempHour(hour)} className="w-1/4 p-1">
                      <View className={`rounded-[16px] py-3 items-center ${tempHour === hour ? "bg-[#2286BE]" : "bg-[#F8FAFC]"}`}>
                        <Text className={`font-black ${tempHour === hour ? "text-white" : "text-[#1A2C42]"}`}>{hour}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text className="mb-3 text-[12px] font-bold uppercase tracking-[0.14em] text-[#7C8B95]">Minute</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
                  {Array.from({ length: 60 }, (_, minute) => (
                    <TouchableOpacity key={minute} onPress={() => setTempMinute(minute)} className="mr-2">
                      <View className={`min-w-[52px] rounded-[16px] px-4 py-3 items-center ${tempMinute === minute ? "bg-[#2286BE]" : "bg-[#F8FAFC]"}`}>
                        <Text className={`font-black ${tempMinute === minute ? "text-white" : "text-[#1A2C42]"}`}>
                          {String(minute).padStart(2, "0")}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text className="mb-3 text-[12px] font-bold uppercase tracking-[0.14em] text-[#7C8B95]">AM / PM</Text>
                <View className="mb-5 flex-row rounded-[18px] bg-[#F8FAFC] p-1">
                  {(["AM", "PM"] as const).map((period) => (
                    <TouchableOpacity
                      key={period}
                      onPress={() => setTempPeriod(period)}
                      className={`flex-1 rounded-[15px] py-3 items-center ${tempPeriod === period ? "bg-[#2286BE]" : ""}`}
                    >
                      <Text className={`font-black ${tempPeriod === period ? "text-white" : "text-[#1A2C42]"}`}>{period}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View className="mb-5 rounded-[18px] bg-[#EAF3FA] px-4 py-3">
                  <Text className="text-center text-[13px] font-bold text-[#1A2C42]">
                    Selected: {toTimeLabel(tempTimeValue)}
                  </Text>
                  {!canConfirmTime ? (
                    <Text className="mt-1 text-center text-[12px] font-semibold text-[#DC2626]">
                      Please select a future time.
                    </Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  disabled={!canConfirmTime}
                  onPress={confirmPreferredTime}
                  className={`rounded-[18px] py-4 items-center ${canConfirmTime ? "bg-[#2286BE]" : "bg-gray-200"}`}
                >
                  <Text className={`font-black ${canConfirmTime ? "text-white" : "text-[#94A3B8]"}`}>Confirm Time</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <View className="absolute bottom-0 w-full bg-white px-6 pt-4 pb-10 border-t border-gray-100">
        <TouchableOpacity onPress={() => void submitRequest()} disabled={submitting} className="bg-[#2B84B1] w-full py-5 rounded-[18px] items-center">
          {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-[17px]">Submit Request</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
