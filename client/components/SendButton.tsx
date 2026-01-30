import React from "react";
import { StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { BeachColors, Spacing, BorderRadius, Shadows } from "@/constants/theme";

interface SendButtonProps {
  onPress: () => void;
  disabled: boolean;
  loading?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SendButton({ onPress, disabled, loading = false }: SendButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 200 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handlePress = async () => {
    if (!disabled && !loading) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.button,
        disabled && styles.buttonDisabled,
        animatedStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={BeachColors.foamWhite} size="small" />
      ) : (
        <>
          <Feather
            name="send"
            size={20}
            color={disabled ? BeachColors.textSecondary : BeachColors.foamWhite}
          />
          <ThemedText
            style={[styles.buttonText, disabled && styles.buttonTextDisabled]}
          >
            Send Message
          </ThemedText>
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: BeachColors.oceanBlue,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.button,
  },
  buttonDisabled: {
    backgroundColor: "#B8C5CE",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: BeachColors.foamWhite,
  },
  buttonTextDisabled: {
    color: BeachColors.textSecondary,
  },
});
