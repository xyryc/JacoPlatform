import Foundation from "@expo/vector-icons/Foundation";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, 0);
  const height =
    Platform.OS === "ios"
      ? 55 + paddingBottom
      : 65 + (insets.bottom > 0 ? insets.bottom : 0);

  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: "white",
            borderTopWidth: 0,
            borderBottomWidth: 1,
            borderTopEndRadius: 32,
            borderTopStartRadius: 32,
            height: height,
            paddingBottom: paddingBottom,
            paddingTop: 12,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: -20,
            },
            shadowOpacity: 0.08,
            shadowRadius: 30,
            elevation: 24,
          },
          tabBarItemStyle: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            height: 50,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "",
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name="home-outline"
                size={24}
                color={focused ? "#2286BE" : "#999"}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="booking"
          options={{
            title: "",
            tabBarIcon: ({ focused }) => (
              <Foundation
                name="page-copy"
                size={24}
                color={focused ? "#2286BE" : "#999"}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="message"
          options={{
            title: "",
            tabBarIcon: ({ focused }) => (
              <MaterialCommunityIcons
                name="message-text-outline"
                size={24}
                color={focused ? "#2286BE" : "#999"}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "",
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name="settings-outline"
                size={24}
                color={focused ? "#2286BE" : "#999"}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
