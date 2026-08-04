import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PaymentMethodsPage() {
    const router = useRouter();

    const PaymentCardRow = ({ icon, type, number, isDefault = false }: any) => (
        <View className="bg-white rounded-[24px] p-5 mb-4 border border-gray-100 flex-row items-center shadow-sm shadow-black/5">
            <View className="w-14 h-10 bg-gray-50 rounded-lg items-center justify-center mr-4 border border-gray-200">
                <Ionicons name={icon} size={24} color="#1A2C42" />
            </View>
            <View className="flex-1">
                <Text className="text-[16px] font-bold text-[#1A2C42] mb-1">{type}</Text>
                <Text className="text-[14px] text-[#7C8B95] font-medium tracking-widest">{number}</Text>
            </View>
            {isDefault ? (
                <View className="bg-[#EAF6ED] px-3 py-1 rounded-full">
                    <Text className="text-[#55A06F] text-[12px] font-bold">Default</Text>
                </View>
            ) : (
                <TouchableOpacity>
                    <Ionicons name="trash-outline" size={20} color="#FF4757" />
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#FAFCFD]" edges={['top']}>
            <View className="px-6 py-4 flex-row items-center bg-white shadow-sm shadow-black/5 z-10">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-gray-50 rounded-full mr-4">
                    <Ionicons name="arrow-back" size={20} color="#1A2C42" />
                </TouchableOpacity>
                <Text className="text-[20px] font-bold text-[#1A2C42]">Payment Methods</Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-6 mb-20" showsVerticalScrollIndicator={false}>
                <Text className="text-[14px] font-bold tracking-widest text-[#A0AEC0] uppercase mb-4 ml-1">
                    Saved Cards
                </Text>

                <PaymentCardRow icon="logo-apple" type="Apple Pay" number="joyboy@apple.com" isDefault={true} />
                <PaymentCardRow icon="card" type="Visa" number="**** **** **** 4242" />
                <PaymentCardRow icon="card" type="Mastercard" number="**** **** **** 5555" />

            </ScrollView>

            <View className="absolute bottom-0 w-full bg-white px-6 pt-4 pb-10 border-t border-gray-100">
                <TouchableOpacity className="bg-[#2B84B1] w-full py-5 rounded-[18px] items-center flex-row justify-center shadow-lg shadow-[#2B84B1]/30">
                    <Ionicons name="add" size={24} color="white" />
                    <Text className="text-white font-bold text-[17px] ml-2">Add New Card</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
