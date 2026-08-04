import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KeyboardAwareScrollView as ScrollView } from "@/src/components/KeyboardAwareScrollView";
import { useAuth } from "@/src/contexts/AuthContext";
import { useChangePasswordMutation } from "@/src/store/services/apiSlice";

export default function SecurityPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [changePassword] = useChangePasswordMutation();
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validatePasswordForm = () => {
    if (!passwordData.currentPassword.trim()) {
      Alert.alert("Validation Error", "Current password is required.");
      return false;
    }
    if (passwordData.newPassword.length < 8) {
      Alert.alert("Validation Error", "New password must be at least 8 characters long.");
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert("Validation Error", "New passwords do not match.");
      return false;
    }
    return true;
  };

  const handleUpdatePassword = async () => {
    if (!validatePasswordForm()) return;

    setLoading(true);
    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      }).unwrap();
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      Alert.alert("Success", "Your password has been updated successfully.");
    } catch (error) {
      Alert.alert("Update failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const PasswordInput = ({
    label,
    placeholder,
    field,
  }: {
    label: string;
    placeholder: string;
    field: keyof typeof passwordData;
  }) => (
    <View className="mb-5">
      <Text className="text-[14px] font-bold text-[#7C8B95] mb-2 ml-1">{label}</Text>
      <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm shadow-gray-100">
        <Ionicons name="lock-closed-outline" size={20} color="#A0AEC0" />
        <TextInput
          className="flex-1 ml-3 text-[16px] font-semibold text-[#1A2C42]"
          placeholder={placeholder}
          placeholderTextColor="#A0AEC0"
          value={passwordData[field]}
          onChangeText={(text) => setPasswordData((prev) => ({ ...prev, [field]: text }))}
          secureTextEntry={!showPasswords[field]}
        />
        <TouchableOpacity onPress={() => togglePasswordVisibility(field)}>
          <Ionicons name={showPasswords[field] ? "eye-outline" : "eye-off-outline"} size={20} color="#A0AEC0" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#FAFCFD]" edges={["top"]}>
      <View className="flex-1">
        <View className="px-6 py-4 flex-row items-center bg-white shadow-sm shadow-black/5 z-10">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-gray-50 rounded-full mr-4">
            <Ionicons name="arrow-back" size={20} color="#1A2C42" />
          </TouchableOpacity>
          <Text className="text-[20px] font-bold text-[#1A2C42]">Security</Text>
        </View>

        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
          <Text className="text-[14px] font-bold tracking-widest text-[#A0AEC0] uppercase mb-4 ml-1">Change Password</Text>
          <PasswordInput label="Current Password" placeholder="Enter current password" field="currentPassword" />
          <PasswordInput label="New Password" placeholder="Enter new password" field="newPassword" />
          <PasswordInput label="Confirm New Password" placeholder="Confirm new password" field="confirmPassword" />

          <TouchableOpacity onPress={handleSignOut} className="mt-8 mb-4 border border-[#FF4757] rounded-[20px] py-4 items-center">
            <Text className="text-[#FF4757] font-bold text-[16px]">Sign out</Text>
          </TouchableOpacity>
        </ScrollView>

        <View className="absolute bottom-0 w-full bg-white px-6 pt-4 pb-10 border-t border-gray-100 z-20">
          <TouchableOpacity onPress={handleUpdatePassword} disabled={loading} className="bg-[#2B84B1] w-full py-5 rounded-[18px] items-center shadow-lg shadow-[#2B84B1]/30">
            {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-[17px]">Update Password</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
