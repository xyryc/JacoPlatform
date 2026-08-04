import { useAuth } from "@/src/contexts/AuthContext";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isAuthenticated, loading, role, user } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2286BE" />
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)" />;
  }

  return <Redirect href={role === "provider" ? "/(provider-tabs)" : "/(tabs)"} />;
}
