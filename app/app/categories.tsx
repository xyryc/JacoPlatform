import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KeyboardAwareScrollView as ScrollView } from "@/src/components/KeyboardAwareScrollView";
import { useGetCategoriesQuery } from "@/src/store/services/apiSlice";

const ICON_MAP: Record<
  string,
  { library: "ion" | "material"; name: string; bgColor: string; iconColor: string }
> = {
  cleaning: { library: "material", name: "hand-okay", bgColor: "#FFE8B3", iconColor: "#C05621" },
  beauty: { library: "ion", name: "sparkles", bgColor: "#DCCFFD", iconColor: "#553098" },
  plumbing: { library: "material", name: "pipe", bgColor: "#E2F2E4", iconColor: "#38A169" },
  appliance: { library: "material", name: "washing-machine", bgColor: "#B1EBF2", iconColor: "#008EA6" },
  shipping: { library: "material", name: "truck-delivery", bgColor: "#FBB6CE", iconColor: "#B83280" },
};

export default function CategoriesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useGetCategoriesQuery();
  const filtered = useMemo(() => {
    const categories = data?.data || [];
    const query = search.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((item) => item.name.toLowerCase().includes(query));
  }, [data?.data, search]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="px-6 pt-4 pb-6 rounded-b-[30px] bg-white shadow-sm shadow-black/5">
        <View className="flex-row items-center bg-white rounded-[24px] pl-3 pr-2 py-1.5 border border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={26} color="#2B84B1" />
          </TouchableOpacity>
          <TextInput
            placeholder="Search category"
            placeholderTextColor="#A0AEC0"
            value={search}
            onChangeText={setSearch}
            className="flex-1 text-[16px] font-medium text-[#1A2C42] px-2"
          />
          <TouchableOpacity className="bg-[#2B84B1] w-[46px] h-[46px] rounded-[16px] items-center justify-center">
            <Ionicons name="search" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}>
        <View className="px-6 mb-8">
          <View className="flex-row items-center mb-4">
            <View className="w-1.5 h-7 bg-[#2B84B1] rounded-full mr-4" />
            <Text className="text-[28px] font-black text-[#1A2C42]">All Categories</Text>
          </View>
          <Text className="text-[15px] leading-[24px] text-[#7C8B95]">
            Browse every service category and jump into the exact flow you need.
          </Text>
        </View>

        {isLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#2B84B1" />
          </View>
        ) : (
          <View className="px-6 flex-row flex-wrap justify-between">
            {filtered.map((item) => {
              const icon = ICON_MAP[item.slug] || {
                library: "material" as const,
                name: "shape",
                bgColor: "#EAF3FA",
                iconColor: "#2B84B1",
              };
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => router.push({ pathname: "/category-details", params: { name: item.name, slug: item.slug } })}
                  className="w-[48%] bg-white border border-gray-100 rounded-[28px] px-4 py-6 mb-5 items-center shadow-sm shadow-black/5"
                >
                  <View style={{ backgroundColor: icon.bgColor }} className="w-[68px] h-[68px] rounded-full items-center justify-center mb-4">
                    {icon.library === "ion" ? (
                      <Ionicons name={icon.name as any} size={34} color={icon.iconColor} />
                    ) : (
                      <MaterialCommunityIcons name={icon.name as any} size={34} color={icon.iconColor} />
                    )}
                  </View>
                  <Text className="text-[16px] font-bold text-[#1A2C42] text-center">{item.name}</Text>
                  <Text className="text-[12px] font-bold tracking-[0.18em] uppercase text-[#94A3B8] mt-2">
                    Explore
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View className="px-6 mt-4">
          <View className="bg-[#1A2C42] rounded-[30px] p-6">
            <Text className="text-[12px] font-bold tracking-[0.18em] uppercase text-[#9CCAE2]">Need Something Custom?</Text>
            <Text className="text-[26px] font-black text-white leading-[32px] mt-3">Post a request and let nearby providers respond</Text>
            <Text className="text-[14px] leading-[22px] text-white/75 mt-3">
              If you do not see the right category fit, post a custom request with your preferred location and timing.
            </Text>
            <TouchableOpacity onPress={() => router.push("/post-request")} className="bg-white self-start px-6 py-4 rounded-[18px] mt-5">
              <Text className="font-bold text-[#1A2C42]">Post a Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
