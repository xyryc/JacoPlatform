import { Stack } from 'expo-router';

export default function ProviderSetupLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="wizard" />
        </Stack>
    );
}
