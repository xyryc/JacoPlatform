import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/src/contexts/AuthContext";
import { useDeleteAccountMutation } from "@/src/store/services/apiSlice";

export function DeleteAccountButton() {
  const router = useRouter();
  const { logout } = useAuth();
  const [visible, setVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteAccount, { isLoading }] = useDeleteAccountMutation();

  const close = () => {
    if (isLoading) return;
    setVisible(false);
    setErrorMessage("");
  };

  const handleDelete = async () => {
    setErrorMessage("");
    try {
      await deleteAccount().unwrap();
      setVisible(false);
      await logout();
      router.replace("/(auth)");
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      setErrorMessage(message || "Could not delete your account right now.");
    }
  };

  return (
    <>
      <TouchableOpacity
        className="flex-row items-center bg-white py-4"
        activeOpacity={0.7}
        onPress={() => setVisible(true)}
      >
        <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-red-50">
          <Ionicons name="trash-outline" size={22} color="#FF4757" />
        </View>
        <View className="flex-1">
          <Text className="text-[16px] font-semibold text-[#FF4757]">Delete Account</Text>
          <Text className="mt-0.5 text-[12px] font-medium text-[#A0AEC0]">Permanent and irreversible</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#FCA5A5" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={close}
      >
        <Pressable className="flex-1 items-center justify-center bg-black/50 px-6" onPress={close}>
          <Pressable
            className="w-full max-w-[420px] rounded-[28px] bg-white p-6"
            onPress={(event) => event.stopPropagation()}
          >
            <View className="mb-5 h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <Ionicons name="warning-outline" size={30} color="#EF4444" />
            </View>
            <Text className="text-[24px] font-bold text-[#1A2C42]">Delete your account?</Text>
            <Text className="mt-3 text-[14px] font-medium leading-6 text-[#64748B]">
              Your profile, sign-in access, services, and preferences will be removed permanently. Completed transaction records may be retained for operational and legal purposes.
            </Text>

            {errorMessage ? (
              <View className="mt-4 rounded-xl bg-red-50 px-4 py-3">
                <Text className="text-[13px] font-semibold leading-5 text-red-600">{errorMessage}</Text>
              </View>
            ) : null}

            <View className="mt-6 flex-row" style={{ gap: 12 }}>
              <TouchableOpacity
                disabled={isLoading}
                onPress={close}
                className="h-14 flex-1 items-center justify-center rounded-2xl border border-gray-200 bg-white"
              >
                <Text className="text-[15px] font-bold text-[#475569]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={isLoading}
                onPress={() => void handleDelete()}
                className="h-14 flex-1 flex-row items-center justify-center rounded-2xl bg-red-500"
                style={{ backgroundColor: "#EF4444" }}
              >
                {isLoading ? <ActivityIndicator color="#FFFFFF" /> : null}
                <Text
                  className={`text-[15px] font-bold ${isLoading ? "ml-2" : ""}`}
                  style={{ color: "#FFFFFF" }}
                >
                  {isLoading ? "Deleting..." : "Delete"}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
