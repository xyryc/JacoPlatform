import { Ionicons } from "@expo/vector-icons";
import { Image, View } from "react-native";

type Props = {
  uri?: string | null;
  size: number;
  iconSize?: number;
  className?: string;
  imageClassName?: string;
  borderColor?: string;
};

export function UserAvatar({
  uri,
  size,
  iconSize = Math.max(18, Math.round(size * 0.42)),
  className = "",
  imageClassName = "",
  borderColor,
}: Props) {
  const baseStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    ...(borderColor ? { borderWidth: 2, borderColor } : null),
  };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        className={imageClassName || className}
        style={baseStyle}
      />
    );
  }

  return (
    <View
      className={`items-center justify-center bg-[#EAF3FA] ${className}`}
      style={baseStyle}
    >
      <Ionicons name="person-outline" size={iconSize} color="#2286BE" />
    </View>
  );
}
