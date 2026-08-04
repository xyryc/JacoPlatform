import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { KeyboardAwareScrollView } from "@/src/components/KeyboardAwareScrollView";
import { useAuth } from "@/src/contexts/AuthContext";
import { useSocketNotifications } from "@/src/contexts/SocketContext";
import {
  useLazyGetWebsiteReviewPromptQuery,
  useRemindWebsiteReviewLaterMutation,
  useSubmitWebsiteReviewMutation,
} from "@/src/store/services/apiSlice";

const getTriggerType = (role: "client" | "provider") =>
  role === "provider" ? "order_paid" : "order_payment_completed";

export default function WebsiteReviewPrompt() {
  const { isAuthenticated, role } = useAuth();
  const { notifications } = useSocketNotifications();
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const lastHandledIdRef = useRef<string | null>(null);
  const [loadPrompt] = useLazyGetWebsiteReviewPromptQuery();
  const [submitWebsiteReview] = useSubmitWebsiteReviewMutation();
  const [remindLater] = useRemindWebsiteReviewLaterMutation();

  const promptContext = useMemo(
    () => (role === "provider" ? "provider" : "client"),
    [role]
  );

  const resetForm = () => {
    setRating(0);
    setReviewText("");
  };

  const checkPrompt = async () => {
    if (!isAuthenticated) return;
    try {
      const payload = await loadPrompt(promptContext, true).unwrap();
      if (payload.data?.shouldPrompt) {
        setVisible(true);
      }
    } catch {
      // silent background check
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setVisible(false);
      return;
    }
    void checkPrompt();
  }, [isAuthenticated, promptContext]);

  useEffect(() => {
    if (!notifications.length || !isAuthenticated) return;
    const latest = notifications[0] as {
      id?: string;
      data?: { notificationType?: string };
    };
    if (!latest?.id || latest.id === lastHandledIdRef.current) return;

    if (latest.data?.notificationType === getTriggerType(promptContext)) {
      lastHandledIdRef.current = latest.id;
      void checkPrompt();
    }
  }, [isAuthenticated, notifications, promptContext]);

  const close = () => {
    setVisible(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (rating < 1) return;
    setLoading(true);
    try {
      await submitWebsiteReview({
        context: promptContext,
        rating,
        reviewText,
      }).unwrap();
      close();
    } finally {
      setLoading(false);
    }
  };

  const handleRemindLater = async () => {
    setLoading(true);
    try {
      await remindLater({ context: promptContext }).unwrap();
      close();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
      <View className="flex-1 items-center justify-center bg-black/50 px-5">
        <KeyboardAwareScrollView
          className="w-full max-w-[420px] rounded-[28px] bg-white"
          contentContainerStyle={{ padding: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardGap={24}
        >
          <Text className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#2286BE]">
            Website Review
          </Text>
          <Text className="mt-3 text-[28px] font-black text-[#1A2C42]">
            How is your experience with the website?
          </Text>
          <Text className="mt-3 text-[14px] leading-[22px] text-[#64748B]">
            Rate the platform and leave a short review. Your feedback may appear on the success stories page.
          </Text>

          <View className="mt-6 flex-row">
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity key={value} onPress={() => setRating(value)} className="mr-2">
                <Ionicons
                  name={value <= rating ? "star" : "star-outline"}
                  size={30}
                  color={value <= rating ? "#F59E0B" : "#CBD5E1"}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            value={reviewText}
            onChangeText={setReviewText}
            placeholder="Write a short review about the website..."
            placeholderTextColor="#94A3B8"
            multiline
            textAlignVertical="top"
            className="mt-5 h-[140px] rounded-[22px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-4 text-[14px] text-[#1A2C42]"
          />

          <View className="mt-6">
            <TouchableOpacity
              disabled={loading}
              onPress={handleSubmit}
              className="h-[54px] rounded-[18px] bg-[#2286BE] items-center justify-center"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-[15px] font-bold text-white">Submit Review</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              disabled={loading}
              onPress={handleRemindLater}
              className="mt-3 h-[54px] rounded-[18px] border border-[#E2E8F0] items-center justify-center"
            >
              <Text className="text-[15px] font-bold text-[#1A2C42]">Remind Me Later</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
