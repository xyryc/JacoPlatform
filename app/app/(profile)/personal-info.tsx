import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KeyboardAwareScrollView as ScrollView } from "@/src/components/KeyboardAwareScrollView";
import { MapboxLocationPicker } from "@/src/components/MapboxLocationPicker";
import { UserAvatar } from "@/src/components/UserAvatar";
import { useAuth } from "@/src/contexts/AuthContext";
import { resolveAddressFromCoordinates } from "@/src/lib/geocode";
import {
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} from "@/src/store/services/apiSlice";

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 };

export default function PersonalInfoPage() {
  const router = useRouter();
  const { logout, role, updateProfile, user } = useAuth();
  const [saveProfile, { isLoading: saving }] = useUpdateProfileMutation();
  const [uploadAvatarMutation] = useUploadAvatarMutation();
  const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
  const isProvider = role === "provider";
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [resolvingLocation, setResolvingLocation] = React.useState(false);
  const [form, setForm] = React.useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    preferredLanguage: user?.preferredLanguage || "English (US)",
    avatar: user?.avatar || "",
    businessBio: user?.businessBio || "",
    experienceLevel: user?.experienceLevel || "",
    serviceCity: user?.serviceCity || "",
    locationLat:
      typeof user?.locationLat === "number" ? user.locationLat : DEFAULT_CENTER.lat,
    locationLng:
      typeof user?.locationLng === "number" ? user.locationLng : DEFAULT_CENTER.lng,
    serviceLocationLat:
      typeof user?.serviceLocationLat === "number"
        ? user.serviceLocationLat
        : DEFAULT_CENTER.lat,
    serviceLocationLng:
      typeof user?.serviceLocationLng === "number"
        ? user.serviceLocationLng
        : DEFAULT_CENTER.lng,
  });

  React.useEffect(() => {
    setForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      preferredLanguage: user?.preferredLanguage || "English (US)",
      avatar: user?.avatar || "",
      businessBio: user?.businessBio || "",
      experienceLevel: user?.experienceLevel || "",
      serviceCity: user?.serviceCity || "",
      locationLat:
        typeof user?.locationLat === "number" ? user.locationLat : DEFAULT_CENTER.lat,
      locationLng:
        typeof user?.locationLng === "number" ? user.locationLng : DEFAULT_CENTER.lng,
      serviceLocationLat:
        typeof user?.serviceLocationLat === "number"
          ? user.serviceLocationLat
          : DEFAULT_CENTER.lat,
      serviceLocationLng:
        typeof user?.serviceLocationLng === "number"
          ? user.serviceLocationLng
          : DEFAULT_CENTER.lng,
    });
  }, [user]);

  const updateField = (field: keyof typeof form, value: string | number) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "We need photo library access to update your avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append("image", {
        uri: asset.uri,
        name: asset.fileName || `avatar-${Date.now()}.jpg`,
        type: asset.mimeType || "image/jpeg",
      } as any);
      const payload = await uploadAvatarMutation(formData).unwrap();
      const nextAvatar = payload.data.user.avatar || payload.data.avatarUrl || "";
      setForm((current) => ({ ...current, avatar: nextAvatar }));
      await updateProfile({ avatar: nextAvatar });
      Alert.alert("Updated", "Your profile photo has been updated.");
    } catch (error) {
      Alert.alert("Upload failed", error instanceof Error ? error.message : "Could not upload photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow location access to use your current location.");
      return;
    }

    const currentLocation = await Location.getCurrentPositionAsync({});
    const lat = currentLocation.coords.latitude;
    const lng = currentLocation.coords.longitude;

    setResolvingLocation(true);
    try {
      const resolved = await resolveAddressFromCoordinates(lat, lng);
      setForm((current) => ({
        ...current,
        ...(isProvider
          ? {
              serviceCity: resolved,
              serviceLocationLat: lat,
              serviceLocationLng: lng,
            }
          : {
              address: resolved,
              locationLat: lat,
              locationLng: lng,
            }),
      }));
    } finally {
      setResolvingLocation(false);
    }
  };

  const handleSetCenterAsLocation = async () => {
    const lat = isProvider ? form.serviceLocationLat : form.locationLat;
    const lng = isProvider ? form.serviceLocationLng : form.locationLng;
    setResolvingLocation(true);
    try {
      const resolved = await resolveAddressFromCoordinates(lat, lng);
      setForm((current) => ({
        ...current,
        ...(isProvider ? { serviceCity: resolved } : { address: resolved }),
      }));
    } finally {
      setResolvingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      Alert.alert("Validation Error", "First name and last name are required.");
      return;
    }

    try {
      const payload = await saveProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        preferredLanguage: form.preferredLanguage.trim() || "English (US)",
        ...(isProvider
          ? {
              businessBio: form.businessBio.trim(),
              experienceLevel: form.experienceLevel.trim(),
              serviceCity: form.serviceCity.trim(),
              serviceLocationLat: form.serviceLocationLat,
              serviceLocationLng: form.serviceLocationLng,
            }
          : {
              address: form.address.trim(),
              locationLat: form.locationLat,
              locationLng: form.locationLng,
            }),
      }).unwrap();

      await updateProfile(payload.data.user);
      Alert.alert("Success", "Your profile has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Update failed", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const renderInputRow = ({
    label,
    value,
    icon,
    field,
    editable = true,
    keyboardType = "default",
    multiline = false,
  }: {
    label: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
    field: keyof typeof form;
    editable?: boolean;
    keyboardType?: "default" | "email-address" | "phone-pad";
    multiline?: boolean;
  }) => (
    <View className="mb-5">
      <Text className="text-[14px] font-bold text-[#7C8B95] mb-2 ml-1">{label}</Text>
      <View className={`flex-row ${multiline ? "items-start" : "items-center"} bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm shadow-gray-100`}>
        <Ionicons name={icon} size={20} color="#A0AEC0" style={{ marginTop: multiline ? 3 : 0 }} />
        <TextInput
          className={`flex-1 ml-3 text-[16px] font-semibold text-[#1A2C42] ${multiline ? "min-h-[96px] py-0" : "h-8 py-0"}`}
          value={value}
          editable={editable}
          keyboardType={keyboardType}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          onChangeText={(text) => updateField(field, text)}
        />
      </View>
    </View>
  );

  const mapCenter = isProvider
    ? { lat: form.serviceLocationLat, lng: form.serviceLocationLng }
    : { lat: form.locationLat, lng: form.locationLng };
  const payoutStatus = user?.payoutVerificationStatus || "unverified";

  const providerProfileActions = [
    {
      label: "Security",
      description: "Update password and account access settings.",
      icon: "shield-checkmark-outline" as const,
      route: "/(profile)/security",
      color: "#EAF3FA",
      iconColor: "#2286BE",
    },
    {
      label: "Payout Info",
      description: `Verification status: ${payoutStatus}`,
      icon: "wallet-outline" as const,
      route: "/(profile)/payout-information",
      color: payoutStatus === "verified" ? "#EAF6ED" : payoutStatus === "rejected" ? "#FFF1F2" : "#FFF7ED",
      iconColor: payoutStatus === "verified" ? "#55A06F" : payoutStatus === "rejected" ? "#FF4757" : "#D97706",
    },
  ];

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFCFD]" edges={["top"]}>
      <View className="px-6 py-4 flex-row items-center bg-white shadow-sm shadow-black/5 z-10">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-gray-50 rounded-full mr-4">
          <Ionicons name="arrow-back" size={20} color="#1A2C42" />
        </TouchableOpacity>
        <Text className="text-[20px] font-bold text-[#1A2C42]">
          {isProvider ? "Business Profile" : "Personal Information"}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="items-center mb-8">
          <View className="relative">
            <UserAvatar uri={form.avatar} size={96} />
            <TouchableOpacity onPress={pickImage} className="absolute bottom-0 right-0 w-8 h-8 bg-[#2B84B1] rounded-full flex items-center justify-center border-2 border-white">
              {uploadingAvatar ? <ActivityIndicator color="white" size="small" /> : <Ionicons name="camera" size={14} color="white" />}
            </TouchableOpacity>
          </View>
        </View>

        {renderInputRow({ label: "First Name", value: form.firstName, icon: "person-outline", field: "firstName" })}
        {renderInputRow({ label: "Last Name", value: form.lastName, icon: "person-outline", field: "lastName" })}
        {renderInputRow({
          label: "Email Address",
          value: form.email,
          icon: "mail-outline",
          field: "email",
          editable: false,
          keyboardType: "email-address",
        })}
        {renderInputRow({
          label: "Phone Number",
          value: form.phone,
          icon: "call-outline",
          field: "phone",
          keyboardType: "phone-pad",
        })}

        {isProvider ? (
          <>
            {renderInputRow({
              label: "Business Bio",
              value: form.businessBio,
              icon: "briefcase-outline",
              field: "businessBio",
              multiline: true,
            })}
            {renderInputRow({
              label: "Experience Level",
              value: form.experienceLevel,
              icon: "ribbon-outline",
              field: "experienceLevel",
            })}
          </>
        ) : null}

        {isProvider ? (
          <View className="mb-6">
            <Text className="text-[14px] font-bold tracking-widest text-[#A0AEC0] uppercase mb-4 ml-1">Provider Tools</Text>
            {providerProfileActions.map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => router.push(item.route as never)}
                className="bg-white rounded-[22px] px-5 py-5 border border-gray-100 shadow-sm shadow-black/5 mb-4 flex-row items-center"
              >
                <View className="w-12 h-12 rounded-full items-center justify-center mr-4" style={{ backgroundColor: item.color }}>
                  <Ionicons name={item.icon} size={22} color={item.iconColor} />
                </View>
                <View className="flex-1">
                  <Text className="text-[16px] font-bold text-[#1A2C42]">{item.label}</Text>
                  <Text className="text-[13px] text-[#7C8B95] mt-1">{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View className="mb-5">
          <View className="flex-row justify-between items-center mb-2 ml-1">
            <Text className="text-[14px] font-bold text-[#7C8B95]">
              {isProvider ? "Service City" : "Address"}
            </Text>
            <TouchableOpacity onPress={() => void handleUseCurrentLocation()} className="bg-[#EAF3FA] px-3 py-2 rounded-full">
              <Text className="text-[#2286BE] font-bold text-[12px]">{resolvingLocation ? "Locating..." : "Use Current Location"}</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm shadow-gray-100 mb-4">
            <Ionicons name="location-outline" size={20} color="#A0AEC0" />
            <TextInput
              className="flex-1 ml-3 h-8 py-0 text-[16px] font-semibold text-[#1A2C42]"
              value={isProvider ? form.serviceCity : form.address}
              onChangeText={(text) => updateField(isProvider ? "serviceCity" : "address", text)}
            />
          </View>
          <MapboxLocationPicker
            token={mapboxToken}
            initialCenter={mapCenter}
            badgeText={isProvider ? "Move map and set center as service location" : "Move map and set center as your location"}
            loadingText={isProvider ? "Loading service area map..." : "Loading location map..."}
            fallbackHintText="Using fallback map tiles. Add EXPO_PUBLIC_MAPBOX_TOKEN for the same Mapbox styling as web."
            onCenterChange={(coords) =>
              setForm((current) => ({
                ...current,
                ...(isProvider
                  ? { serviceLocationLat: coords.lat, serviceLocationLng: coords.lng }
                  : { locationLat: coords.lat, locationLng: coords.lng }),
              }))
            }
          />
          <TouchableOpacity onPress={() => void handleSetCenterAsLocation()} className="bg-white border border-gray-200 rounded-[16px] px-4 py-3 mt-3 self-start">
            <Text className="font-bold text-[#2286BE]">{resolvingLocation ? "Setting..." : `Set Center As ${isProvider ? "Service City" : "Location"}`}</Text>
          </TouchableOpacity>
        </View>

        {!isProvider ? (
          renderInputRow({
            label: "Preferred Language",
            value: form.preferredLanguage,
            icon: "language-outline",
            field: "preferredLanguage",
          })
        ) : null}

        {isProvider ? (
          <TouchableOpacity onPress={handleSignOut} className="mb-8 border border-[#FF4757] rounded-[20px] py-4 items-center">
            <Text className="text-[#FF4757] font-bold text-[16px]">Sign Out</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <View className="absolute bottom-0 w-full bg-white px-6 pt-4 pb-10 border-t border-gray-100">
        <TouchableOpacity
          onPress={() => void handleSave()}
          disabled={saving}
          className="bg-[#2B84B1] w-full py-5 rounded-[18px] items-center shadow-lg shadow-[#2B84B1]/30 flex-row justify-center"
        >
          {saving ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-[17px]">Save Changes</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
