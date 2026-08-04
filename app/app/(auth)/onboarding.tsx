import ImageImport from "@/assets/ImageImport";
import { useAuth } from "@/src/contexts/AuthContext";
import { onboardingStorage } from "@/src/lib/storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        image: ImageImport.frame_1,
        title: "Beauty parlour\nat your home",
        subtitle: "Lorem ipsum is a placeholder text commonly used to demonstrate the visual."
    },
    {
        id: '2',
        image: ImageImport.frame_2,
        title: "Professional\nServices",
        subtitle: "Expert beauticians at your doorstep with just a few clicks on our app."
    },
    {
        id: '3',
        image: ImageImport.frame_3,
        title: "Be Relax &\nEnjoy",
        subtitle: "Sit back and relax while our professionals take care of your beauty needs."
    }
];

export default function OnboardingScreen() {
    const router = useRouter();
    const { isAuthenticated, loading, role, user } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [checkingIntro, setCheckingIntro] = useState(true);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        let isMounted = true;

        const routeFromSavedState = async () => {
            if (loading) return;

            if (isAuthenticated && user) {
                router.replace(role === "provider" ? "/(provider-tabs)" : "/(tabs)");
                return;
            }

            const completed = await onboardingStorage.hasCompletedOnboarding();
            if (!isMounted) return;

            if (completed) {
                router.replace("/(auth)/login");
                return;
            }

            setCheckingIntro(false);
        };

        void routeFromSavedState();

        return () => {
            isMounted = false;
        };
    }, [isAuthenticated, loading, role, router, user]);

    const finishOnboarding = async () => {
        await onboardingStorage.setIntroCompleted();
        router.replace('/(auth)/role-selection');
    };

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true
            });
            setCurrentIndex(currentIndex + 1);
        } else {
            void finishOnboarding();
        }
    };

    const handleScroll = (event: any) => {
        const scrollOffset = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollOffset / width);
        setCurrentIndex(index);
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {loading || checkingIntro ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#2286BE" />
                </View>
            ) : (
            <>
            <StatusBar style="dark" />
            <Image source={ImageImport.top_buble} className="w-[80px] h-[80px] absolute top-0 left-0" />
            {/* Top Bar */}
            <View className="px-6 flex-row justify-end pt-2 z-10">
                <TouchableOpacity
                    onPress={() => void finishOnboarding()}
                    className="bg-[#2B84B1] px-5 py-2.5 rounded-full"
                >
                    <Text className="text-white font-bold text-[15px]">Skip</Text>
                </TouchableOpacity>
            </View>

            {/* Main Content - Scrollable Area */}
            <View className="flex-1">
                <FlatList
                    ref={flatListRef}
                    data={SLIDES}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleScroll}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={{ width }} className="flex-1">
                            {/* Visual Area - Fixed Height but Responsive */}
                            <View className="w-full h-[400px]">
                                <Image
                                    source={item.image}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                            </View>

                            {/* Text Content - Flex to fill remaining space and center title/subtitle */}
                            <View className="flex-1 items-center justify-center px-10">
                                <Text className="text-[30px] font-black text-[#2B84B1] text-center leading-[38px] mb-3">
                                    {item.title}
                                </Text>
                                <Text className="text-[15px] text-[#7C8B95] text-center leading-[22px] font-medium">
                                    {item.subtitle}
                                </Text>
                            </View>
                        </View>
                    )}
                />
            </View>

            {/* Bottom Part - Grouped Pagination & Action */}
            <View className="pb-10 items-center">
                {/* Pagination Dots */}
                <View className="flex-row justify-center mb-6">
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            className={`h-2 rounded-full mx-1 ${currentIndex === index ? 'w-5 bg-[#2B84B1]' : 'w-2 bg-[#D1D5DB]'}`}
                        />
                    ))}
                </View>

                {/* Bottom Action */}
                <TouchableOpacity
                    onPress={handleNext}
                    className="w-[64px] h-[64px] bg-[#2B84B1] rounded-full items-center justify-center shadow-lg shadow-[#2B84B1]/30"
                >
                    <Ionicons
                        name={currentIndex === SLIDES.length - 1 ? "checkmark" : "chevron-forward"}
                        size={28}
                        color="white"
                    />
                </TouchableOpacity>
            </View>
            </>
            )}
        </SafeAreaView>
    );
}
