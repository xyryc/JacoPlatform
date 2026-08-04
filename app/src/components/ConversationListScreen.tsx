import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useSocketNotifications } from "@/src/contexts/SocketContext";
import { formatDateLabel } from "@/src/lib/formatters";
import { useDeleteConversationsMutation, useGetConversationsQuery } from "@/src/store/services/apiSlice";

const getQueryErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== "object") return fallback;

  const value = error as {
    status?: number | string;
    data?: { message?: string };
    error?: string;
  };

  if (typeof value.data?.message === "string" && value.data.message.trim()) {
    return value.data.message;
  }

  if (typeof value.error === "string" && value.error.trim()) {
    return value.error;
  }

  if (value.status === 401) return "Your session expired. Please log in again.";

  return fallback;
};

export function ConversationListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    conversationId?: string;
    name?: string;
    avatar?: string;
    info?: string;
    blockedBy?: string;
    targetUserId?: string;
    targetUserRole?: string;
  }>();
  const { socket } = useSocketNotifications();
  const insets = useSafeAreaInsets();
  const tabBarHeight = Platform.OS === "ios" ? 65 + insets.bottom : 75 + (insets.bottom > 0 ? insets.bottom : 0);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedConversationIds, setSelectedConversationIds] = useState<string[]>([]);
  const { data, isLoading, isFetching, error, refetch } = useGetConversationsQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: 15000,
  });
  const [deleteConversations, { isLoading: deletingConversations }] = useDeleteConversationsMutation();

  const readParam = (value?: string | string[]) => {
    if (Array.isArray(value)) return value[0] || "";
    return value || "";
  };

  useEffect(() => {
    const conversationId = readParam(params.conversationId);
    if (!conversationId) return;

    router.replace({
      pathname: "/chat-details",
      params: {
        conversationId,
        name: readParam(params.name),
        avatar: readParam(params.avatar),
        info: readParam(params.info),
        blockedBy: readParam(params.blockedBy),
        targetUserId: readParam(params.targetUserId),
        targetUserRole: readParam(params.targetUserRole),
      },
    });
  }, [
    params.avatar,
    params.blockedBy,
    params.conversationId,
    params.info,
    params.name,
    params.targetUserId,
    params.targetUserRole,
    router,
  ]);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  useFocusEffect(
    useCallback(() => {
      if (!socket) return;

      const handleConversationRefresh = () => {
        void refetch();
      };

      socket.on("chat:created", handleConversationRefresh);
      socket.on("chat:message:new", handleConversationRefresh);
      socket.on("chat:conversation:updated", handleConversationRefresh);
      socket.on("chat:conversation:deleted", handleConversationRefresh);
      socket.on("notification:new", handleConversationRefresh);

      return () => {
        socket.off("chat:created", handleConversationRefresh);
        socket.off("chat:message:new", handleConversationRefresh);
        socket.off("chat:conversation:updated", handleConversationRefresh);
        socket.off("chat:conversation:deleted", handleConversationRefresh);
        socket.off("notification:new", handleConversationRefresh);
      };
    }, [refetch, socket])
  );

  const filtered = useMemo(() => {
    const conversations = data?.data || [];
    let items = conversations;
    if (activeTab === "Unread") {
      items = items.filter((item) => Boolean(item.lastMessage));
    }

    const query = search.trim().toLowerCase();
    if (!query) return items;

    const normalizeValue = (value: unknown) => String(value || "").toLowerCase();

    return items.filter((item) => {
      const haystacks = [
        normalizeValue(item.otherUser?.name),
        normalizeValue(item.otherUser?.email),
        normalizeValue(item.orderName),
        normalizeValue(item.orderNumber),
        normalizeValue(item.categoryName),
        normalizeValue(item.packageTitle),
        normalizeValue(item.lastMessage),
      ];
      return haystacks.some((value) => value.includes(query));
    });
  }, [activeTab, data?.data, search]);
  const errorMessage = getQueryErrorMessage(error, "We could not load your conversations.");
  const selectedCount = selectedConversationIds.length;

  const toggleSelectedConversation = (conversationId: string) => {
    setSelectedConversationIds((current) =>
      current.includes(conversationId)
        ? current.filter((id) => id !== conversationId)
        : [...current, conversationId]
    );
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedConversationIds([]);
  };

  const handleDeleteSelected = () => {
    if (!selectionMode) {
      setSelectionMode(true);
      return;
    }

    if (!selectedCount) {
      Alert.alert("No chats selected", "Select one or more conversations to delete.");
      return;
    }

    Alert.alert(
      "Delete selected chats?",
      `This will remove ${selectedCount} conversation${selectedCount === 1 ? "" : "s"} from your inbox.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteConversations(selectedConversationIds).unwrap();
              exitSelectionMode();
              void refetch();
            } catch {
              Alert.alert("Delete failed", "Could not delete the selected conversations right now.");
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <SafeAreaView
        edges={["top"]}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.03,
          shadowRadius: 10,
          elevation: 3,
          zIndex: 20,
        }}
        className="bg-white rounded-b-[40px] px-6 pb-6"
      >
        <View
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.05,
            shadowRadius: 20,
            elevation: 5,
          }}
          className="flex-row items-center bg-white rounded-[20px] px-4 h-[64px] border border-gray-50"
        >
          <TextInput
            placeholder="Search conversations"
            placeholderTextColor="#7C8B95"
            value={search}
            onChangeText={setSearch}
            className="flex-1 text-[15px] font-medium text-[#1A2C42]"
          />
          <TouchableOpacity className="bg-[#2286BE] w-10 h-10 rounded-xl items-center justify-center">
            <Ionicons name="search" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View className="px-6 mb-8 flex-row items-center mt-2">
        <View className="w-1.5 h-6 bg-[#2286BE] rounded-full mr-3" />
        <Text className="text-[24px] font-bold text-[#1A2C42] flex-1">
          {selectionMode ? `${selectedCount} selected` : "Chat"}
        </Text>
        {selectionMode ? (
          <TouchableOpacity onPress={exitSelectionMode} className="px-4 py-2 rounded-full bg-[#F8FAFC] mr-2">
            <Text className="font-bold text-[#7C8B95]">Cancel</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          onPress={handleDeleteSelected}
          disabled={deletingConversations}
          className={`w-11 h-11 rounded-full items-center justify-center ${selectionMode ? "bg-[#EF4444]" : "bg-[#F8FAFC]"}`}
        >
          {deletingConversations ? (
            <ActivityIndicator size="small" color={selectionMode ? "white" : "#EF4444"} />
          ) : (
            <Ionicons name="trash-outline" size={20} color={selectionMode ? "white" : "#EF4444"} />
          )}
        </TouchableOpacity>
      </View>

      <View className="px-6 mb-6">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {["All", "Unread"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`px-7 py-3 rounded-[20px] mr-3 ${activeTab === tab ? "bg-[#2286BE]" : "bg-transparent"}`}
            >
              <Text className={`text-[15px] font-bold ${activeTab === tab ? "text-white" : "text-[#2286BE]"}`}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2286BE" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8 py-16">
          <Text className="text-[18px] font-bold text-[#1A2C42] mb-2">Could not load conversations</Text>
          <Text className="text-center text-[#7C8B95] mb-6">{errorMessage}</Text>
          <TouchableOpacity onPress={() => void refetch()} className="bg-[#2286BE] px-6 py-3 rounded-[16px]">
            <Text className="text-white font-bold">{isFetching ? "Refreshing..." : "Try Again"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={() => {
                void refetch();
              }}
              tintColor="#2286BE"
              colors={["#2286BE"]}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                if (selectionMode) {
                  toggleSelectedConversation(item.id);
                  return;
                }
                router.push({
                  pathname: "/chat-details",
                  params: {
                    conversationId: item.id,
                    name: item.otherUser.name,
                    avatar: item.otherUser.avatar || "",
                    info: item.orderName || item.categoryName || "",
                    blockedBy: item.blockedBy || "",
                    targetUserId: item.otherUser.id,
                    targetUserRole: item.otherUser.role || "",
                  },
                });
              }}
              onLongPress={() => {
                setSelectionMode(true);
                toggleSelectedConversation(item.id);
              }}
              className="flex-row items-center px-6 py-4"
            >
              {selectionMode ? (
                <View
                  className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
                    selectedConversationIds.includes(item.id) ? "bg-[#2286BE] border-[#2286BE]" : "border-[#CBD5E1]"
                  }`}
                >
                  {selectedConversationIds.includes(item.id) ? <Ionicons name="checkmark" size={15} color="white" /> : null}
                </View>
              ) : null}
              <View className="relative">
                {item.otherUser.avatar ? (
                  <Image source={{ uri: item.otherUser.avatar }} className="w-[60px] h-[60px] rounded-full border-2 border-[#EAF3FA]" />
                ) : (
                  <View className="w-[60px] h-[60px] rounded-full border-2 border-[#EAF3FA] bg-[#EAF3FA] items-center justify-center">
                    <Ionicons name="person-outline" size={26} color="#2286BE" />
                  </View>
                )}
              </View>

              <View className="flex-1 ml-4 justify-center">
                <View className="flex-row justify-between items-center mb-1">
                  <View className="flex-1 mr-2">
                    <Text className="text-[17px] font-bold text-[#2286BE]" numberOfLines={1}>{item.otherUser.name}</Text>
                  </View>
                  <Text className="text-[13px] text-[#7C8B95] font-medium">{formatDateLabel(item.lastMessageAt)}</Text>
                </View>

                <View className="flex-row justify-between items-center">
                  <Text className="text-[15px] text-[#7C8B95] font-medium flex-1 mr-2" numberOfLines={1}>
                    {item.lastMessage || item.orderName || "Open conversation"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View className="h-[1px] bg-[#F2F2F2] mx-6" />}
          ListEmptyComponent={
            <View className="items-center justify-center px-8 py-16">
              <Text className="text-[18px] font-bold text-[#1A2C42] mb-2">No conversations yet</Text>
              <Text className="text-center text-[#7C8B95]">Place or receive an order to start chatting.</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </KeyboardAvoidingView>
  );
}
