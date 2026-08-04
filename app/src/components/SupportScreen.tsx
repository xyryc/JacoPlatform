import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KeyboardAwareScrollView as ScrollView } from "@/src/components/KeyboardAwareScrollView";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  useCreateSupportMessageMutation,
  useGetFaqsQuery,
} from "@/src/store/services/apiSlice";

type Props = {
  title: string;
  heroTitle: string;
  heroBody: string;
  heroIcon?: keyof typeof Ionicons.glyphMap;
};

export function SupportScreen({
  title,
  heroTitle,
  heroBody,
  heroIcon = "help-buoy",
}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading } = useGetFaqsQuery();
  const [createSupportMessage, { isLoading: submitting }] = useCreateSupportMessageMutation();
  const faqs = data?.data || [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
    email: user?.email || "",
    subject: "",
    message: "",
  });

  useEffect(() => {
    setForm((current) => ({
      ...current,
      fullName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
      email: user?.email || "",
    }));
  }, [user?.email, user?.firstName, user?.lastName]);

  const contactCards = useMemo(
    () => [
      {
        icon: "chatbubbles",
        title: "Live Chat Support",
        desc: "Start a conversation from any order chat or ongoing booking.",
        color: "#2B84B1",
      },
      {
        icon: "mail",
        title: "Submit a Ticket",
        desc: "Send a detailed support request to the admin team.",
        color: "#55A06F",
      },
      {
        icon: "call",
        title: "Priority Follow-up",
        desc: "Leave enough detail and the team can reach back quickly if needed.",
        color: "#F59E0B",
      },
    ],
    []
  );

  const submitSupport = async () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      Alert.alert("Missing information", "Please complete all support fields.");
      return;
    }
    try {
      await createSupportMessage({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      }).unwrap();
      setForm((current) => ({ ...current, subject: "", message: "" }));
      Alert.alert("Sent", "Your message has been sent successfully.");
    } catch (error) {
      Alert.alert("Send failed", error instanceof Error ? error.message : "Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFCFD]" edges={["top"]}>
      <View className="px-6 py-4 flex-row items-center bg-white shadow-sm shadow-black/5 z-10 w-full mb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center mr-4"
        >
          <Ionicons name="arrow-back" size={20} color="#1A2C42" />
        </TouchableOpacity>
        <Text className="text-[20px] font-bold text-[#1A2C42]">{title}</Text>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="bg-[#2B84B1] rounded-[24px] p-6 mb-8 shadow-lg shadow-[#2B84B1]/30">
          <Ionicons name={heroIcon} size={48} color="white" />
          <Text className="text-white text-[24px] font-bold mt-4 mb-2">{heroTitle}</Text>
          <Text className="text-white/80 text-[14px] leading-[22px]">{heroBody}</Text>
        </View>

        <Text className="text-[16px] font-bold text-[#1A2C42] mb-4">Contact Methods</Text>
        {contactCards.map((item) => (
          <View
            key={item.title}
            className="flex-row items-center p-5 bg-white rounded-[20px] border border-gray-100 shadow-sm shadow-gray-100 mb-4"
          >
            <View
              className="w-12 h-12 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: `${item.color}15` }}
            >
              <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={24} color={item.color} />
            </View>
            <View className="flex-1">
              <Text className="text-[16px] font-bold text-[#1A2C42] mb-1">{item.title}</Text>
              <Text className="text-[13px] text-[#7C8B95]">{item.desc}</Text>
            </View>
          </View>
        ))}

        <Text className="text-[16px] font-bold text-[#1A2C42] mt-4 mb-4">Send us a message</Text>
        <View className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm shadow-gray-100 mb-8">
          {[
            ["fullName", "Full name"],
            ["email", "Email address"],
            ["subject", "Subject"],
          ].map(([field, placeholder]) => (
            <View key={field} className="mb-4">
              <TextInput
                value={form[field as keyof typeof form]}
                onChangeText={(text) => setForm((current) => ({ ...current, [field]: text }))}
                placeholder={placeholder}
                autoCapitalize="none"
                className="bg-[#F8FAFC] rounded-[18px] px-4 py-4 text-[15px] text-[#1A2C42]"
              />
            </View>
          ))}
          <TextInput
            value={form.message}
            onChangeText={(text) => setForm((current) => ({ ...current, message: text }))}
            placeholder="Tell us what happened and how we can help."
            multiline
            textAlignVertical="top"
            className="bg-[#F8FAFC] rounded-[18px] px-4 py-4 text-[15px] text-[#1A2C42] min-h-[140px]"
          />
          <TouchableOpacity
            onPress={() => void submitSupport()}
            disabled={submitting}
            className="bg-[#2B84B1] mt-5 py-4 rounded-[18px] items-center"
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-[16px]">Submit Ticket</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text className="text-[16px] font-bold text-[#1A2C42] mt-4 mb-4">FAQs</Text>
        {isLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator color="#2B84B1" />
          </View>
        ) : (
          faqs.map((faq) => {
            const expanded = expandedId === faq.id;
            return (
              <TouchableOpacity
                key={faq.id}
                onPress={() => setExpandedId(expanded ? null : faq.id)}
                className="bg-white rounded-[20px] p-5 mb-3 border border-gray-100 shadow-sm shadow-gray-100"
              >
                <View className="flex-row justify-between items-center">
                  <Text className="text-[15px] font-bold text-[#1A2C42] flex-1 pr-4">{faq.question}</Text>
                  <Ionicons
                    name={expanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#A0AEC0"
                  />
                </View>
                {expanded ? (
                  <Text className="mt-3 text-[14px] leading-[22px] text-[#7C8B95]">{faq.answer}</Text>
                ) : null}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
