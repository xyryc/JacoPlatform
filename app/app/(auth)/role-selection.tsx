import ImageImport from "@/assets/ImageImport";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RoleSelection() {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState<string | null>(null);

    const roles = [
        {
            id: 'client',
            title: "Looking for a specialist",
            description: "To place any type of order to search for a performer",
            image: ImageImport.user_1,
        },
        {
            id: 'provider',
            title: "Service Provider",
            description: "Search and execute orders in your field of activity",
            image: ImageImport.user_2,
        }
    ];

    const handleSelect = (id: string) => {
        setSelectedRole(id);
        // Navigate to next screen after selection
        setTimeout(() => {
            router.push({ pathname: '/(auth)/login', params: { role: id } });
        }, 300);
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar style="dark" />

            <ScrollView className="flex-1 px-8 pt-12" showsVerticalScrollIndicator={false}>
                {/* Logo Section */}
                <View className="items-center mb-10">
                    <Image
                        source={ImageImport.icon}
                        className="w-[100px] h-[100px]"
                        resizeMode="contain"
                    />
                    <Text className="text-[28px] font-bold text-[#2B84B1] mt-8">
                        Select a Role
                    </Text>
                </View>

                {/* Roles List */}
                <View className="gap-y-6 pb-20">
                    {roles.map((role) => (
                        <TouchableOpacity
                            key={role.id}
                            onPress={() => handleSelect(role.id)}
                            activeOpacity={0.7}
                            className={`flex-row items-center bg-white rounded-[24px] p-6 border-2 ${selectedRole === role.id ? 'border-[#2B84B1]' : 'border-transparent'}`}
                            style={{
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 10,
                                elevation: 2,
                            }}
                        >
                            <View className="flex-1 pr-4">
                                <Text className="text-[18px] font-bold text-[#2B84B1] mb-2">
                                    {role.title}
                                </Text>
                                <Text className="text-[14px] text-[#7C8B95] leading-[20px] font-medium">
                                    {role.description}
                                </Text>
                            </View>

                            <View className="w-[100px] h-[120px] items-center justify-end">
                                <Image
                                    source={role.image}
                                    className="w-full h-full -mb-7"
                                    resizeMode="contain"
                                />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
