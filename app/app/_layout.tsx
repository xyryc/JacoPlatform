import { FontAwesome5, Foundation, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthProvider } from '@/src/contexts/AuthContext';
import { SocketProvider } from '@/src/contexts/SocketContext';
import WebsiteReviewPrompt from '@/src/components/feedback/WebsiteReviewPrompt';
import { store } from '@/src/store';
import { useFonts } from 'expo-font';
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import "../global.css";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...Ionicons.font,
    ...MaterialCommunityIcons.font,
    ...FontAwesome5.font,
    ...Foundation.font,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <Provider store={store}>
      <AuthProvider>
        <SocketProvider>
          <WebsiteReviewPrompt />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)/index" />
            <Stack.Screen name="(auth)/onboarding" />
            <Stack.Screen name="(auth)/role-selection" />
            <Stack.Screen name="(auth)/login" />
            <Stack.Screen name="(auth)/location-access" />
            <Stack.Screen name="(auth)/forgot-password" />
            <Stack.Screen name="(auth)/otp-verification" />
            <Stack.Screen name="(auth)/otp-success" />
            <Stack.Screen name="(auth)/reset-password" />
            <Stack.Screen name="(auth)/reset-success" />
            <Stack.Screen name="(auth)/register" />
            <Stack.Screen name="(auth)/provider-register" />
            <Stack.Screen name="(provider-tabs)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
            <Stack.Screen name="index" />
          </Stack>
        </SocketProvider>
      </AuthProvider>
    </Provider>
  );
}
