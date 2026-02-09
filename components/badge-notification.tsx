import { Modal, View, Text, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";

interface BadgeNotificationProps {
  visible: boolean;
  badgeName: string;
  badgeEmoji: string;
  badgeDescription: string;
  onDismiss: () => void;
}

export function BadgeNotification({
  visible,
  badgeName,
  badgeEmoji,
  badgeDescription,
  onDismiss,
}: BadgeNotificationProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (visible) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View className="flex-1 items-center justify-center bg-black/50 p-6">
        {/* Confetti Effect */}
        {showConfetti && (
          <View className="absolute inset-0 items-center justify-center">
            <Text className="text-6xl absolute top-20 left-10 animate-pulse">🎉</Text>
            <Text className="text-6xl absolute top-32 right-12 animate-pulse">✨</Text>
            <Text className="text-6xl absolute bottom-40 left-16 animate-pulse">🎊</Text>
            <Text className="text-6xl absolute bottom-28 right-20 animate-pulse">⭐</Text>
            <Text className="text-6xl absolute top-48 left-1/2 animate-pulse">🏆</Text>
          </View>
        )}

        {/* Badge Card */}
        <View className="bg-background rounded-3xl p-8 w-full max-w-sm items-center shadow-2xl border-2 border-primary">
          <Text className="text-2xl font-bold text-primary mb-2">🎉 Badge Earned! 🎉</Text>
          
          <View className="bg-primary/10 rounded-full p-6 mb-4">
            <Text className="text-7xl">{badgeEmoji}</Text>
          </View>

          <Text className="text-2xl font-bold text-foreground mb-2 text-center">
            {badgeName}
          </Text>

          <Text className="text-base text-muted text-center mb-6">
            {badgeDescription}
          </Text>

          <TouchableOpacity
            className="bg-primary rounded-xl px-8 py-3 active:opacity-80"
            onPress={onDismiss}
          >
            <Text className="text-white font-semibold text-lg">Awesome!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
