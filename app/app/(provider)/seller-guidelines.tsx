import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function GuidelineSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-8">
      <View className="flex-row items-center mb-4">
        <Ionicons name={icon as any} size={24} color="#2B84B1" />
        <Text className="text-[18px] font-bold text-[#1A2C42] ml-3">{title}</Text>
      </View>
      <View className="bg-white rounded-[20px] px-5 py-4 border border-gray-100 shadow-sm shadow-gray-100">
        {children}
      </View>
    </View>
  );
}

function GuidelineItem({ title, description }: { title: string; description: string }) {
  return (
    <View className="mb-4">
      <Text className="text-[16px] font-semibold text-[#1A2C42] mb-2">{title}</Text>
      <Text className="text-[14px] text-[#7C8B95] leading-6">{description}</Text>
    </View>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <View className="flex-row items-start mb-3">
      <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginRight: 12, marginTop: 2 }} />
      <Text className="text-[14px] text-[#1A2C42] flex-1 leading-5">{text}</Text>
    </View>
  );
}

export default function SellerGuidelinesPage() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#FAFCFD]" edges={["top"]}>
      <View className="px-6 py-4 flex-row items-center bg-white shadow-sm shadow-black/5 z-10">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-gray-50 rounded-full mr-4">
          <Ionicons name="arrow-back" size={20} color="#1A2C42" />
        </TouchableOpacity>
        <Text className="text-[20px] font-bold text-[#1A2C42]">Seller Guidelines</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="bg-[#2B84B1] rounded-[24px] px-6 py-6 mb-8">
          <Text className="text-[20px] font-bold text-white mb-2">Welcome to Our Platform</Text>
          <Text className="text-[14px] leading-6 text-white/90">
            These guidelines help you deliver excellent service and maintain a successful seller profile. Following these best practices creates a better experience for buyers and providers alike.
          </Text>
        </View>

        <GuidelineSection title="Getting Started" icon="rocket-outline">
          <GuidelineItem title="Account Setup" description="Complete your profile with accurate information, a professional photo, and a clear summary of your skills and experience." />
          <GuidelineItem title="Verification" description="Verify your account with valid identification and current contact information to build trust with buyers." />
          <GuidelineItem title="Profile Optimization" description="Use relevant keywords in your profile and service descriptions so buyers can find you more easily." />
        </GuidelineSection>

        <GuidelineSection title="Creating Services" icon="create-outline">
          <GuidelineItem title="Clear Service Titles" description="Use descriptive, keyword-friendly titles that clearly explain what you offer." />
          <GuidelineItem title="Detailed Descriptions" description="Explain what is included, how delivery works, and what information you need from the buyer." />
          <GuidelineItem title="Pricing Strategy" description="Set competitive prices that match your experience, complexity, and the value you deliver." />
          <GuidelineItem title="High-Quality Media" description="Use strong examples, screenshots, or portfolio images to show your quality and attract more buyers." />
        </GuidelineSection>

        <GuidelineSection title="Communication" icon="chatbubbles-outline">
          <GuidelineItem title="Response Time" description="Respond to buyers quickly. Faster replies improve trust and help you win more work." />
          <GuidelineItem title="Professional Tone" description="Stay friendly, respectful, and clear in every message." />
          <GuidelineItem title="Clarify Requirements" description="Ask detailed questions before starting so expectations stay aligned from day one." />
          <GuidelineItem title="Regular Updates" description="Keep buyers informed about progress and communicate early if delays appear." />
        </GuidelineSection>

        <GuidelineSection title="Delivery and Quality" icon="checkmark-circle-outline">
          <GuidelineItem title="Meet Deadlines" description="Deliver on time whenever possible. If something changes, communicate it early and clearly." />
          <GuidelineItem title="Maintain Quality" description="Make sure every delivery matches your service promise and professional standards." />
          <GuidelineItem title="Handle Revisions Well" description="Be reasonable with revisions and explain your revision policy in advance." />
          <GuidelineItem title="Organize Deliverables" description="Send files in appropriate formats and include any notes or instructions the buyer needs." />
        </GuidelineSection>

        <GuidelineSection title="Best Practices" icon="star-outline">
          <Text className="text-[16px] font-semibold text-[#1A2C42] mb-4">Do&apos;s and Don&apos;ts</Text>

          <View className="mb-6">
            <Text className="text-[15px] font-medium text-[#1A2C42] mb-3">Do&apos;s</Text>
            <ChecklistItem text="Deliver high-quality work that exceeds expectations." />
            <ChecklistItem text="Communicate clearly and professionally." />
            <ChecklistItem text="Meet agreed deadlines and delivery times." />
            <ChecklistItem text="Provide excellent customer service." />
            <ChecklistItem text="Keep your profile and services updated." />
            <ChecklistItem text="Offer fair pricing for your expertise." />
          </View>

          <View>
            <Text className="text-[15px] font-medium text-[#1A2C42] mb-3">Don&apos;ts</Text>
            <ChecklistItem text="Misrepresent your skills or experience." />
            <ChecklistItem text="Overpromise and underdeliver." />
            <ChecklistItem text="Ignore buyer communications." />
            <ChecklistItem text="Use copyrighted materials without permission." />
            <ChecklistItem text="Engage in unethical business practices." />
            <ChecklistItem text="Spam or harass buyers." />
          </View>
        </GuidelineSection>

        <GuidelineSection title="Dispute Resolution" icon="shield-checkmark-outline">
          <GuidelineItem title="Handle Issues Early" description="Address buyer concerns promptly and professionally. Many disputes can be solved with clear communication." />
          <GuidelineItem title="Escalate When Needed" description="If you cannot resolve an issue directly, contact support so the situation can be reviewed fairly." />
          <GuidelineItem title="Prevent Problems" description="Set expectations clearly and keep communication documented throughout the order." />
        </GuidelineSection>

        <GuidelineSection title="Account Management" icon="settings-outline">
          <GuidelineItem title="Maintain Your Profile" description="Keep your profile accurate and respond thoughtfully to reviews and feedback." />
          <GuidelineItem title="Monitor Performance" description="Track response time, completion rate, and buyer satisfaction to improve consistently." />
          <GuidelineItem title="Protect Your Account" description="Use strong passwords and keep your login information secure." />
        </GuidelineSection>

        <View className="bg-[#F0F8FF] rounded-[20px] px-6 py-6 mb-8 border border-[#2B84B1]/20">
          <View className="flex-row items-center mb-3">
            <Ionicons name="help-circle-outline" size={24} color="#2B84B1" />
            <Text className="text-[18px] font-bold text-[#1A2C42] ml-3">Need Help?</Text>
          </View>
          <Text className="text-[14px] text-[#7C8B95] mb-4 leading-6">
            If you have questions about these guidelines or need help with your seller account, support is available.
          </Text>
          <TouchableOpacity className="bg-[#2B84B1] py-3 px-6 rounded-[12px] items-center shadow-sm shadow-[#2B84B1]/40">
            <Text className="text-white font-semibold">Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
