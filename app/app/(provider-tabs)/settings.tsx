import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/contexts/AuthContext";
import { useRouter } from "expo-router";
import { Platform, ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { UserAvatar } from "@/src/components/UserAvatar";
import { DeleteAccountButton } from "@/src/components/DeleteAccountButton";

export default function ProviderSettings() {
    const router = useRouter();
    const { setRole, user, logout } = useAuth();
    const insets = useSafeAreaInsets();
    const tabBarHeight = Platform.OS === "ios" ? 65 + insets.bottom : 75 + (insets.bottom > 0 ? insets.bottom : 0);

    const SettingsRow = ({ icon, label, type = 'chevron', color = '#1A2C42', value = null, onChange = null, isDestructive = false, route = null, onPress = null }: any) => (
        <TouchableOpacity
            className="flex-row items-center py-4 bg-white"
            activeOpacity={type === 'switch' ? 1 : 0.7}
            onPress={() => {
                if (type === 'switch' && onChange) {
                    onChange(!value);
                } else if (onPress) {
                    onPress();
                } else if (route) {
                    router.push(route);
                }
            }}
        >
            <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${isDestructive ? 'bg-red-50' : 'bg-[#EAF3FA]'}`}>
                <Ionicons name={icon} size={22} color={isDestructive ? '#FF4757' : color} />
            </View>
            <Text className={`flex-1 text-[16px] font-semibold ${isDestructive ? 'text-[#FF4757]' : 'text-[#1A2C42]'}`}>
                {label}
            </Text>
            {value && <Text className="text-[14px] font-medium text-[#7C8B95] mr-3">{value}</Text>}
            {type === 'chevron' && !isDestructive && (
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            )}
            {type === 'switch' && (
                <Switch
                    value={value as boolean}
                    onValueChange={onChange}
                    trackColor={{ false: '#E2E8F0', true: '#2B84B1' }}
                    thumbColor={'#FFFFFF'}
                />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#FAFCFD]" edges={['top']}>
            <View className="px-6 py-4 bg-white shadow-sm shadow-black/5 z-10 w-full mb-2">
                <Text className="text-[24px] font-bold text-[#1A2C42]">Settings</Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}>
                {/* Profile Widget */}
                <View className="bg-white rounded-[24px] p-5 mb-8 border border-gray-100 shadow-sm shadow-gray-100 flex-row items-center">
                    <UserAvatar uri={user?.avatar} size={64} className="mr-4" />
                    <View className="flex-1">
                        <Text className="text-[18px] font-bold text-[#1A2C42] mb-1">{`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Provider"}</Text>
                        <Text className="text-[14px] text-[#7C8B95] font-medium">{user?.sellerLevel || "Seller"}</Text>
                    </View>
                    <TouchableOpacity className="bg-[#EAF3FA] w-10 h-10 rounded-full items-center justify-center">
                        <Ionicons name="pencil" size={18} color="#2B84B1" />
                    </TouchableOpacity>
                </View>

                {/* Quick Navigation */}
                <View className="mb-8">
                    <Text className="text-[13px] font-bold tracking-widest text-[#A0AEC0] uppercase mb-3 ml-1">
                        Quick Navigation
                    </Text>
                    <View className="bg-white rounded-[24px] px-5 py-2 border border-gray-100 shadow-sm shadow-gray-100">
                        <SettingsRow
                            icon="swap-horizontal-outline"
                            label="Switch to Buying"
                            color="#2B84B1"
                            onPress={async () => {
                                await setRole("client");
                                router.replace("/(tabs)");
                            }}
                        />
                        <View className="h-[1px] bg-gray-100 ml-14" />
                        <SettingsRow icon="grid-outline" label="Dashboard" color="#2B84B1" route="/(provider-tabs)" />
                        <View className="h-[1px] bg-gray-100 ml-14" />
                        <SettingsRow icon="briefcase-outline" label="My Orders" color="#2B84B1" route="/(provider-tabs)/orders" />
                        <View className="h-[1px] bg-gray-100 ml-14" />
                        <SettingsRow icon="layers-outline" label="My Gig" color="#2B84B1" route="/(provider-tabs)/services" />
                    </View>
                </View>

                {/* Seller Controls */}
                <View className="mb-8">
                    <Text className="text-[13px] font-bold tracking-widest text-[#A0AEC0] uppercase mb-3 ml-1">
                        Seller Controls
                    </Text>
                    <View className="bg-white rounded-[24px] px-5 py-2 border border-gray-100 shadow-sm shadow-gray-100">
                        <SettingsRow icon="wallet-outline" label="Earnings & Billing" color="#2B84B1" route="/(provider)/earnings" />
                        <View className="h-[1px] bg-gray-100 ml-14" />
                        <SettingsRow icon="document-text-outline" label="Requested Orders" color="#2B84B1" route="/(provider)/requests" />
                        <View className="h-[1px] bg-gray-100 ml-14" />
                        <SettingsRow icon="analytics-outline" label="Seller Analytics" color="#2B84B1" route="/(provider)/analytics" />
                    </View>
                </View>

                {/* Account Settings */}
                <View className="mb-8">
                    <Text className="text-[13px] font-bold tracking-widest text-[#A0AEC0] uppercase mb-3 ml-1">
                        General Settings
                    </Text>
                    <View className="bg-white rounded-[24px] px-5 py-2 border border-gray-100 shadow-sm shadow-gray-100">
                        <SettingsRow icon="person-outline" label="Business Profile" color="#2B84B1" route="/(profile)/personal-info" />
                        <View className="h-[1px] bg-gray-100 ml-14" />
                        <SettingsRow icon="wallet-outline" label="Payout Information" color="#2B84B1" route="/(profile)/payout-information" />
                        <View className="h-[1px] bg-gray-100 ml-14" />
                        <SettingsRow icon="shield-checkmark-outline" label="Security" color="#2B84B1" route="/(profile)/security" />
                    </View>
                </View>

                {/* Support */}
                <View className="mb-8">
                    <Text className="text-[13px] font-bold tracking-widest text-[#A0AEC0] uppercase mb-3 ml-1">
                        Support
                    </Text>
                    <View className="bg-white rounded-[24px] px-5 py-2 border border-gray-100 shadow-sm shadow-gray-100">
                        <SettingsRow icon="help-buoy-outline" label="Help & Support" color="#2B84B1" route="/(provider)/support" />
                        <View className="h-[1px] bg-gray-100 ml-14" />
                        <SettingsRow icon="document-text-outline" label="Seller Guidelines" color="#2B84B1" route="/(provider)/seller-guidelines" />
                        <View className="h-[1px] bg-gray-100 ml-14" />
                        <SettingsRow icon="log-out-outline" label="Log Out" isDestructive={true} onPress={async () => {
                            await logout();
                            router.replace("/(auth)");
                        }} />
                        <View className="h-[1px] bg-gray-100 ml-14" />
                        <DeleteAccountButton />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
