import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { ContentPage } from "@/src/data/contentPages";

type Props = {
  page: ContentPage;
};

export function StaticContentScreen({ page }: Props) {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#FAFCFD]" edges={["top"]}>
      <View className="px-6 py-4 flex-row items-center bg-white shadow-sm shadow-black/5 z-10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center bg-gray-50 rounded-full mr-4"
        >
          <Ionicons name="arrow-back" size={20} color="#1A2C42" />
        </TouchableOpacity>
        <Text className="text-[20px] font-bold text-[#1A2C42] flex-1">{page.title}</Text>
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}
      >
        <View className="bg-[#1A2C42] rounded-[28px] p-6 mb-8">
          <Text className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9CCAE2]">
            {page.eyebrow}
          </Text>
          <Text className="text-white text-[28px] font-black leading-[34px] mt-3">
            {page.title}
          </Text>
          <Text className="text-white/75 text-[15px] mt-3 leading-[24px]">
            {page.subtitle}
          </Text>
        </View>

        {page.stats?.length ? (
          <View className="flex-row flex-wrap justify-between mb-8">
            {page.stats.map((item) => (
              <View
                key={item.label}
                className="w-[31%] bg-white rounded-[22px] p-4 border border-gray-100 shadow-sm shadow-black/5"
              >
                <Text className="text-[20px] font-black text-[#1A2C42]">{item.value}</Text>
                <Text className="text-[11px] font-bold uppercase tracking-widest text-[#7C8B95] mt-1">
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View className="space-y-4">
          {page.sections.map((section) => (
            <View
              key={section.title}
              className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm shadow-black/5 mb-4"
            >
              <Text className="text-[18px] font-bold text-[#1A2C42] mb-3">{section.title}</Text>
              <Text className="text-[14px] leading-[23px] text-[#5F7182]">
                {section.body}
              </Text>
            </View>
          ))}
        </View>

        {page.ctaTitle ? (
          <View className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm shadow-black/5 mt-4">
            <Text className="text-[20px] font-black text-[#1A2C42]">{page.ctaTitle}</Text>
            {page.ctaBody ? (
              <Text className="text-[14px] leading-[22px] text-[#7C8B95] mt-2">
                {page.ctaBody}
              </Text>
            ) : null}
            {page.ctaLabel && page.ctaRoute ? (
              <TouchableOpacity
                onPress={() => router.push(page.ctaRoute as never)}
                className="mt-5 bg-[#2B84B1] px-5 py-4 rounded-[18px] self-start"
              >
                <Text className="text-white font-bold text-[15px]">{page.ctaLabel}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
