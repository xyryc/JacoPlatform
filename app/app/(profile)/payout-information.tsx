import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React from "react";
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

import { KeyboardAwareScrollView as ScrollView } from "@/src/components/KeyboardAwareScrollView";
import { useAuth } from "@/src/contexts/AuthContext";
import { mobileApi } from "@/src/lib/api";

type AccountType = "checking" | "savings" | "";

export default function PayoutInformationPage() {
  const router = useRouter();
  const { updateProfile, user } = useAuth();
  const [saving, setSaving] = React.useState(false);
  const [uploadingSide, setUploadingSide] = React.useState<"front" | "back" | null>(null);
  const [form, setForm] = React.useState({
    accountHolderName: user?.payoutInfo?.accountHolderName || "",
    bankAccountNumber: user?.payoutInfo?.bankAccountNumber || "",
    routingNumber: user?.payoutInfo?.routingNumber || "",
    bankName: user?.payoutInfo?.bankName || "",
    accountType: (user?.payoutInfo?.accountType || "") as AccountType,
    nidFrontImageUrl: user?.payoutInfo?.nidFrontImageUrl || "",
    nidBackImageUrl: user?.payoutInfo?.nidBackImageUrl || "",
  });
  const [files, setFiles] = React.useState<{ front: any | null; back: any | null }>({
    front: null,
    back: null,
  });

  const payoutStatus = user?.payoutVerificationStatus || "unverified";

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const pickImage = async (side: "front" | "back") => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to upload verification documents.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setUploadingSide(side);
    try {
      setFiles((current) => ({
        ...current,
        [side]: {
          uri: asset.uri,
          name: asset.fileName || `${side}-${Date.now()}.jpg`,
          type: asset.mimeType || "image/jpeg",
        },
      }));
      setForm((current) => ({
        ...current,
        [side === "front" ? "nidFrontImageUrl" : "nidBackImageUrl"]: asset.uri,
      }));
    } finally {
      setUploadingSide(null);
    }
  };

  const handleSubmit = async () => {
    if (
      !form.accountHolderName.trim() ||
      !form.bankAccountNumber.trim() ||
      !form.routingNumber.trim() ||
      !form.bankName.trim() ||
      !form.accountType
    ) {
      Alert.alert("Missing information", "Please complete all payout details before submitting.");
      return;
    }

    const formData = new FormData();
    formData.append("accountHolderName", form.accountHolderName.trim());
    formData.append("bankAccountNumber", form.bankAccountNumber.trim());
    formData.append("routingNumber", form.routingNumber.trim());
    formData.append("bankName", form.bankName.trim());
    formData.append("accountType", form.accountType);

    if (files.front) {
      formData.append("nidFront", files.front);
    }
    if (files.back) {
      formData.append("nidBack", files.back);
    }

    setSaving(true);
    try {
      const payload = await mobileApi.submitProviderPayoutInfo(formData);
      await updateProfile(payload.data.user);
      Alert.alert("Submitted", "Your payout information has been submitted for review.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Submission failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const InfoInput = ({
    label,
    value,
    field,
    keyboardType = "default",
  }: {
    label: string;
    value: string;
    field: keyof typeof form;
    keyboardType?: "default" | "numeric";
  }) => (
    <View className="mb-5">
      <Text className="text-[14px] font-bold text-[#7C8B95] mb-2 ml-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={(text) => updateField(field, text)}
        keyboardType={keyboardType}
        placeholder={label}
        placeholderTextColor="#A0AEC0"
        className="bg-white rounded-[18px] border border-gray-100 px-4 py-4 text-[16px] font-semibold text-[#1A2C42]"
      />
    </View>
  );

  const statusColor =
    payoutStatus === "verified" ? "text-[#55A06F] bg-[#EAF6ED]" : payoutStatus === "rejected" ? "text-[#FF4757] bg-[#FFF1F2]" : "text-[#D97706] bg-[#FFF7ED]";

  return (
    <SafeAreaView className="flex-1 bg-[#FAFCFD]" edges={["top"]}>
      <View className="px-6 py-4 flex-row items-center bg-white shadow-sm shadow-black/5 z-10">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-gray-50 rounded-full mr-4">
          <Ionicons name="arrow-back" size={20} color="#1A2C42" />
        </TouchableOpacity>
        <Text className="text-[20px] font-bold text-[#1A2C42]">Payout Information</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm shadow-gray-100 mb-6">
          <Text className="text-[12px] font-bold tracking-[0.18em] uppercase text-[#94A3B8]">Verification Status</Text>
          <View className={`self-start px-3 py-2 rounded-full mt-3 ${statusColor}`}>
            <Text className="font-bold uppercase text-[12px]">{payoutStatus}</Text>
          </View>
          <Text className="text-[14px] text-[#7C8B95] mt-4 leading-[22px]">
            Keep your bank details and ID verification up to date so withdrawals can be processed without delays.
          </Text>
        </View>

        <InfoInput label="Account Holder Name" value={form.accountHolderName} field="accountHolderName" />
        <InfoInput label="Bank Account Number" value={form.bankAccountNumber} field="bankAccountNumber" keyboardType="numeric" />
        <InfoInput label="Routing Number" value={form.routingNumber} field="routingNumber" keyboardType="numeric" />
        <InfoInput label="Bank Name" value={form.bankName} field="bankName" />

        <View className="mb-6">
          <Text className="text-[14px] font-bold text-[#7C8B95] mb-3 ml-1">Account Type</Text>
          <View className="flex-row">
            {[
              { id: "checking", label: "Checking" },
              { id: "savings", label: "Savings" },
            ].map((option) => {
              const active = form.accountType === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => updateField("accountType", option.id)}
                  className={`mr-3 px-4 py-3 rounded-[16px] border ${active ? "bg-[#2286BE] border-[#2286BE]" : "bg-white border-gray-200"}`}
                >
                  <Text className={`font-bold ${active ? "text-white" : "text-[#1A2C42]"}`}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-[14px] font-bold text-[#7C8B95] mb-3 ml-1">Verification Documents</Text>
          <View className="flex-row">
            {[
              { side: "front" as const, label: "NID Front", uri: form.nidFrontImageUrl },
              { side: "back" as const, label: "NID Back", uri: form.nidBackImageUrl },
            ].map((item) => (
              <TouchableOpacity
                key={item.side}
                onPress={() => void pickImage(item.side)}
                className="flex-1 bg-white rounded-[20px] border border-gray-100 p-4 mr-3 last:mr-0"
              >
                {item.uri ? (
                  <Image source={{ uri: item.uri }} className="w-full h-[120px] rounded-[14px] bg-gray-100 mb-3" />
                ) : (
                  <View className="w-full h-[120px] rounded-[14px] bg-[#F8FAFC] mb-3 items-center justify-center">
                    {uploadingSide === item.side ? <ActivityIndicator color="#2286BE" /> : <Ionicons name="image-outline" size={32} color="#94A3B8" />}
                  </View>
                )}
                <Text className="font-bold text-[#1A2C42]">{item.label}</Text>
                <Text className="text-[12px] text-[#7C8B95] mt-1">Tap to upload or replace</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 w-full bg-white px-6 pt-4 pb-10 border-t border-gray-100">
        <TouchableOpacity
          onPress={() => void handleSubmit()}
          disabled={saving}
          className="bg-[#2B84B1] w-full py-5 rounded-[18px] items-center shadow-lg shadow-[#2B84B1]/30 flex-row justify-center"
        >
          {saving ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-[17px]">Save Payout Information</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
