import React from "react";
import { StyleSheet, View, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { BeachColors, Spacing, BorderRadius } from "@/constants/theme";

const SUGGESTED_MESSAGES = [
  "I love you",
  "Thinking of you",
  "Miss you!",
  "You're amazing",
  "Have a great day!",
  "Sweet dreams",
  "Good morning!",
  "Be safe",
];

interface SuggestedMessagesProps {
  onSelect: (message: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SuggestionChip({ text, onPress }: { text: string; onPress: () => void }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handlePress = async () => {
    await Haptics.selectionAsync();
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.chip, animatedStyle]}
    >
      <Feather name="heart" size={14} color={BeachColors.sunsetCoral} />
      <ThemedText style={styles.chipText}>{text}</ThemedText>
    </AnimatedPressable>
  );
}

export function SuggestedMessages({ onSelect }: SuggestedMessagesProps) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.header}>QUICK MESSAGES</ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {SUGGESTED_MESSAGES.map((message) => (
          <SuggestionChip
            key={message}
            text={message}
            onPress={() => onSelect(message)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  header: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    color: BeachColors.textSecondary,
    paddingHorizontal: Spacing.xs,
  },
  scrollContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: BeachColors.cardSurface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(242, 142, 125, 0.3)",
  },
  chipText: {
    fontSize: 14,
    color: BeachColors.textPrimary,
  },
});
