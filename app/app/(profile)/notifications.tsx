import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// TypeScript interfaces
interface NotificationSettings {
    messagesPush: boolean;
    messagesEmail: boolean;
    messagesSms: boolean;
    messagesInApp: boolean;
    ordersPush: boolean;
    ordersEmail: boolean;
    ordersSms: boolean;
    ordersInApp: boolean;
    promotionsPush: boolean;
    promotionsEmail: boolean;
    promotionsSms: boolean;
    promotionsInApp: boolean;
    systemPush: boolean;
    systemEmail: boolean;
    systemSms: boolean;
    systemInApp: boolean;
    accountPush: boolean;
    accountEmail: boolean;
    accountSms: boolean;
    accountInApp: boolean;
}

type NotificationKey = keyof NotificationSettings;
type NotificationType = 'push' | 'email' | 'sms' | 'inApp';

interface NotificationSection {
    title: string;
    icon: string;
    description: string;
    category: string;
}

interface NotificationRowProps {
    icon: string;
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
}

// Initial settings
const initialSettings: NotificationSettings = {
    messagesPush: true, messagesEmail: true, messagesSms: false, messagesInApp: true,
    ordersPush: true, ordersEmail: true, ordersSms: true, ordersInApp: true,
    promotionsPush: false, promotionsEmail: true, promotionsSms: false, promotionsInApp: false,
    systemPush: true, systemEmail: false, systemSms: false, systemInApp: true,
    accountPush: true, accountEmail: true, accountSms: true, accountInApp: true,
};

// Notification sections data
const notificationSections: NotificationSection[] = [
    { title: "Messages", icon: "chatbubbles-outline", description: "Get notified about new messages from clients and providers", category: "messages" },
    { title: "Orders & Bookings", icon: "receipt-outline", description: "Receive updates about your orders, bookings, and service requests", category: "orders" },
    { title: "Promotions & Offers", icon: "pricetag-outline", description: "Stay updated with special offers, discounts, and promotional content", category: "promotions" },
    { title: "System Notifications", icon: "settings-outline", description: "Important system updates, maintenance, and platform announcements", category: "system" },
    { title: "Account Activity", icon: "shield-checkmark-outline", description: "Security alerts, login notifications, and account-related updates", category: "account" },
];

// Notification types configuration
const notificationTypes: { key: NotificationType; icon: string; label: string }[] = [
    { key: 'push', icon: 'phone-portrait-outline', label: 'Push Notifications' },
    { key: 'email', icon: 'mail-outline', label: 'Email' },
    { key: 'sms', icon: 'chatbubble-outline', label: 'SMS' },
    { key: 'inApp', icon: 'apps-outline', label: 'In-App' },
];

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<NotificationSettings>(initialSettings);

    // Helper to generate notification key
    const getNotificationKey = (category: string, type: NotificationType): NotificationKey => {
        return `${category}${type.charAt(0).toUpperCase() + type.slice(1)}` as NotificationKey;
    };

    // Update notification setting
    const updateNotification = (category: string, type: NotificationType, value: boolean) => {
        const key = getNotificationKey(category, type);
        setNotifications(prev => ({ ...prev, [key]: value }));
    };

    // Notification Row Component
    const NotificationRow: React.FC<NotificationRowProps> = ({ icon, label, value, onValueChange }) => (
        <View className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center">
                <Ionicons name={icon as any} size={18} color="#A0AEC0" />
                <Text className="text-[15px] font-medium text-[#1A2C42] ml-3">{label}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#E2E8F0', true: '#2B84B1' }}
                thumbColor="#FFFFFF"
            />
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#FAFCFD]" edges={['top']}>
            {/* Header */}
            <View className="px-6 py-4 flex-row items-center bg-white shadow-sm shadow-black/5 z-10">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-gray-50 rounded-full mr-4">
                    <Ionicons name="arrow-back" size={20} color="#1A2C42" />
                </TouchableOpacity>
                <Text className="text-[20px] font-bold text-[#1A2C42]">Notification Preferences</Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {notificationSections.map((section, sectionIndex) => (
                    <View key={section.category} className="mb-6">
                        {/* Section Header */}
                        <View className="flex-row items-center mb-3">
                            <Ionicons name={section.icon as any} size={20} color="#2B84B1" />
                            <Text className="text-[16px] font-semibold text-[#1A2C42] ml-2">{section.title}</Text>
                        </View>
                        {section.description && (
                            <Text className="text-[14px] text-[#7C8B95] mb-4 ml-7">{section.description}</Text>
                        )}

                        {/* Notification Settings */}
                        <View className="bg-white rounded-[20px] px-4 py-3 border border-gray-100 shadow-sm shadow-gray-100 ml-7">
                            {notificationTypes.map((type, typeIndex) => {
                                const key = getNotificationKey(section.category, type.key);
                                return (
                                    <React.Fragment key={type.key}>
                                        <NotificationRow
                                            icon={type.icon}
                                            label={type.label}
                                            value={notifications[key]}
                                            onValueChange={(value) => updateNotification(section.category, type.key, value)}
                                        />
                                        {typeIndex < notificationTypes.length - 1 && <View className="h-[1px] bg-gray-100" />}
                                    </React.Fragment>
                                );
                            })}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}
