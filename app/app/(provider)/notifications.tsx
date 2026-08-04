import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsPage() {
    const router = useRouter();

    const NotificationRow = ({ icon, color, title, desc, time, isNew = false }: any) => (
        <TouchableOpacity className={`flex-row items-start p-4 border-b border-gray-50 ${isNew ? 'bg-[#F2F8FB]' : 'bg-white'}`}>
            <View className={`w-12 h-12 rounded-full items-center justify-center mr-4`} style={{ backgroundColor: `${color}15` }}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View className="flex-1 pt-1">
                <View className="flex-row justify-between mb-1">
                    <Text className={`text-[15px] font-bold ${isNew ? 'text-[#1A2C42]' : 'text-[#4A5568]'}`}>{title}</Text>
                    {isNew && <View className="w-2 h-2 rounded-full bg-[#FF4757] mt-1.5" />}
                </View>
                <Text className={`text-[14px] leading-[20px] mb-2 ${isNew ? 'text-[#4A5568] font-medium' : 'text-[#7C8B95]'}`}>
                    {desc}
                </Text>
                <Text className="text-[12px] font-bold text-[#A0AEC0]">{time}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="px-6 py-4 flex-row justify-between items-center bg-white shadow-sm shadow-black/5 z-10 w-full mb-1">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center mr-4">
                        <Ionicons name="arrow-back" size={20} color="#1A2C42" />
                    </TouchableOpacity>
                    <Text className="text-[20px] font-bold text-[#1A2C42]">Notifications</Text>
                </View>
                <TouchableOpacity>
                    <Text className="text-[#2B84B1] font-bold text-[14px]">Mark all read</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <NotificationRow
                    icon="cart"
                    color="#55A06F"
                    title="New Order Received!"
                    desc="Alice Smith just placed an order for 'Custom React Native App UI Design'."
                    time="10 minutes ago"
                    isNew={true}
                />

                <NotificationRow
                    icon="wallet"
                    color="#2B84B1"
                    title="Earnings Cleared"
                    desc="Good news! $450 from Order #ORD-80123 is now available for withdrawal."
                    time="2 hours ago"
                    isNew={true}
                />

                <NotificationRow
                    icon="star"
                    color="#FF9500"
                    title="5-Star Review Left"
                    desc="TechCorp Inc. left a 5-star review on your recent delivery."
                    time="Yesterday"
                />

                <NotificationRow
                    icon="chatbubble-ellipses"
                    color="#8B5CF6"
                    title="Unread Message"
                    desc="Mike Johnson sent you a new message regarding their pending order requirements."
                    time="2 days ago"
                />

                <NotificationRow
                    icon="alert-circle"
                    color="#FACC15"
                    title="Deadline Approaching"
                    desc="Order #ORD-90215 is due in 24 hours. Don't forget to deliver your work on time!"
                    time="3 days ago"
                />
            </ScrollView>
        </SafeAreaView>
    );
}
