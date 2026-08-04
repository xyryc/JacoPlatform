import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AnalyticsPage() {
    const router = useRouter();

    const MetricCard = ({ title, value, positive = true, percentage }: any) => (
        <View className="w-[48%] bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm shadow-gray-100 mb-4">
            <Text className="text-[13px] text-[#7C8B95] font-medium mb-3 w-[100px]">{title}</Text>
            <Text className="text-[24px] font-bold text-[#1A2C42] mb-2">{value}</Text>
            <View className="flex-row items-center">
                <Ionicons name={positive ? 'trending-up' : 'trending-down'} size={14} color={positive ? '#55A06F' : '#FF4757'} />
                <Text className={`text-[12px] font-bold ml-1 ${positive ? 'text-[#55A06F]' : 'text-[#FF4757]'}`}>{percentage}</Text>
                <Text className="text-[12px] text-[#A0AEC0] ml-1">vs last mo</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#FAFCFD]" edges={['top']}>
            <View className="px-6 py-4 flex-row items-center bg-white shadow-sm shadow-black/5 z-10 w-full mb-2">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center mr-4">
                    <Ionicons name="arrow-back" size={20} color="#1A2C42" />
                </TouchableOpacity>
                <Text className="text-[20px] font-bold text-[#1A2C42]">Analytics</Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
                <View className="flex-row justify-between mb-2">
                    <MetricCard title="Total Earning" value="$1,250" positive={true} percentage="+12%" />
                    <MetricCard title="Total Orders" value="86" positive={true} percentage="+5%" />
                </View>
                <View className="flex-row justify-between mb-6">
                    <MetricCard title="Conversion Rate" value="4.2%" positive={false} percentage="-1%" />
                    <MetricCard title="Profile Views" value="4,200" positive={true} percentage="+22%" />
                </View>

                {/* Placeholder Chart */}
                <Text className="text-[18px] font-bold text-[#1A2C42] mb-4">Earning Overview</Text>
                <View className="w-full h-[220px] bg-white rounded-[24px] border border-gray-100 shadow-sm shadow-gray-100 items-center justify-center mb-8">
                    <Ionicons name="bar-chart" size={64} color="#EAF3FA" />
                    <Text className="text-[#A0AEC0] font-medium mt-4">Chart visualization will appear here</Text>
                </View>

                <Text className="text-[18px] font-bold text-[#1A2C42] mb-4">Seller Standards</Text>
                <View className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm shadow-gray-100 mb-10">
                    <View className="flex-row justify-between mb-4">
                        <Text className="text-[#7C8B95] font-medium">Response Rate</Text>
                        <Text className="text-[#2B84B1] font-bold">100%</Text>
                    </View>
                    <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
                        <View className="h-full bg-[#2B84B1] rounded-full w-full" />
                    </View>

                    <View className="flex-row justify-between mb-4">
                        <Text className="text-[#7C8B95] font-medium">Order Completion</Text>
                        <Text className="text-[#2B84B1] font-bold">95%</Text>
                    </View>
                    <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
                        <View className="h-full bg-[#2B84B1] rounded-full w-[95%]" />
                    </View>

                    <View className="flex-row justify-between mb-4">
                        <Text className="text-[#7C8B95] font-medium">On-time Delivery</Text>
                        <Text className="text-[#2B84B1] font-bold">98%</Text>
                    </View>
                    <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <View className="h-full bg-[#2B84B1] rounded-full w-[98%]" />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
