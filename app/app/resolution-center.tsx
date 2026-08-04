import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KeyboardAwareScrollView as ScrollView } from "@/src/components/KeyboardAwareScrollView";

const CASES = [
  {
    id: "REQ-901",
    title: "Deep Home Cleaning",
    orderId: "ORD-12345",
    status: "In Review",
    date: "Oct 24, 2024",
    reason: "Provider did not show up on time.",
    otherParty: "Rahim Uddin",
    role: "Provider",
  },
  {
    id: "REQ-902",
    title: "AC Maintenance",
    orderId: "ORD-67890",
    status: "Resolved",
    date: "Oct 15, 2024",
    reason: "Client requested out-of-scope tasks.",
    otherParty: "Sarah Khan",
    role: "Client",
  },
];

export default function ResolutionCenterPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(CASES[0].id);
  const [message, setMessage] = useState("");
  const activeCase = CASES.find((item) => item.id === selectedId) || CASES[0];

  return (
    <SafeAreaView className="flex-1 bg-[#FAFCFD]" edges={["top"]}>
      <View className="px-6 py-4 flex-row items-center bg-white shadow-sm shadow-black/5 z-10">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-gray-50 rounded-full mr-4">
          <Ionicons name="arrow-back" size={20} color="#1A2C42" />
        </TouchableOpacity>
        <Text className="text-[20px] font-bold text-[#1A2C42] flex-1">Resolution Center</Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}>
        <View className="bg-[#1A2C42] rounded-[28px] p-6 mb-8">
          <Text className="text-white text-[28px] font-black">Manage disputes fairly</Text>
          <Text className="text-white/75 text-[15px] mt-3 leading-[24px]">
            Review cancellation, revision, and service disputes with a clear timeline and discussion space.
          </Text>
        </View>

        <Text className="text-[14px] font-bold tracking-widest text-[#A0AEC0] uppercase mb-4 ml-2">Cases</Text>
        {CASES.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => setSelectedId(item.id)}
            className={`rounded-[24px] p-5 border mb-4 ${selectedId === item.id ? "bg-white border-[#2B84B1]" : "bg-white border-gray-100"}`}
          >
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-[16px] font-bold text-[#1A2C42]">{item.title}</Text>
              <View className={`px-3 py-1 rounded-full ${item.status === "Resolved" ? "bg-[#EAF6ED]" : "bg-[#FFF6E5]"}`}>
                <Text className={`text-[11px] font-bold ${item.status === "Resolved" ? "text-[#55A06F]" : "text-[#D69E2E]"}`}>
                  {item.status}
                </Text>
              </View>
            </View>
            <Text className="text-[12px] font-bold text-[#7C8B95]">{item.orderId} • {item.date}</Text>
          </TouchableOpacity>
        ))}

        <View className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm shadow-black/5 mb-6">
          <Text className="text-[20px] font-bold text-[#1A2C42]">{activeCase.title}</Text>
          <Text className="text-[13px] font-bold text-[#2B84B1] mt-2">{activeCase.id} • {activeCase.orderId}</Text>
          <Text className="text-[14px] text-[#7C8B95] mt-4 leading-[23px]">{activeCase.reason}</Text>

          <View className="mt-6 bg-[#F8FAFC] rounded-[20px] p-4">
            <Text className="text-[12px] font-bold tracking-widest uppercase text-[#A0AEC0]">Counterparty</Text>
            <Text className="text-[16px] font-bold text-[#1A2C42] mt-2">{activeCase.otherParty}</Text>
            <Text className="text-[13px] text-[#7C8B95] mt-1">{activeCase.role}</Text>
          </View>
        </View>

        <View className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm shadow-black/5">
          <Text className="text-[18px] font-bold text-[#1A2C42] mb-4">Discussion</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
            placeholder="Offer a resolution or add a comment..."
            className="bg-[#F8FAFC] rounded-[18px] px-4 py-4 text-[15px] text-[#1A2C42] min-h-[130px]"
          />
          <View className="flex-row mt-4">
            <TouchableOpacity className="bg-[#2B84B1] px-5 py-4 rounded-[18px] mr-3">
              <Text className="text-white font-bold">Send</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-[#F3F7FA] px-5 py-4 rounded-[18px]">
              <Text className="text-[#1A2C42] font-bold">Propose Solution</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
