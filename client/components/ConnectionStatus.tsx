import React, { useEffect } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { BeachColors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { BLEConnectionState } from "@/lib/ble-service";

interface ConnectionStatusProps {
  state: BLEConnectionState;
  deviceName: string;
  onReconnect?: () => void;
}

export function ConnectionStatus({ state, deviceName, onReconnect }: ConnectionStatusProps) {
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (state === "scanning" || state === "connecting") {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(pulseOpacity);
      pulseOpacity.value = 1;
    }
  }, [state, pulseOpacity]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const getStatusInfo = () => {
    switch (state) {
      case "connected":
        return {
          icon: "bluetooth" as const,
          color: BeachColors.success,
          text: `Connected to ${deviceName}`,
          showReconnect: false,
        };
      case "scanning":
        return {
          icon: "bluetooth" as const,
          color: BeachColors.textSecondary,
          text: "Searching for device...",
          showReconnect: false,
        };
      case "connecting":
        return {
          icon: "bluetooth" as const,
          color: BeachColors.oceanBlue,
          text: "Connecting...",
          showReconnect: false,
        };
      case "error":
        return {
          icon: "bluetooth-off" as const,
          color: BeachColors.error,
          text: "Connection failed",
          showReconnect: true,
        };
      default:
        return {
          icon: "bluetooth-off" as const,
          color: BeachColors.textSecondary,
          text: "Not connected",
          showReconnect: true,
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <Animated.View style={animatedIconStyle}>
          <Feather name={statusInfo.icon} size={20} color={statusInfo.color} />
        </Animated.View>
        <ThemedText
          style={[styles.statusText, { color: statusInfo.color }]}
        >
          {statusInfo.text}
        </ThemedText>
      </View>
      {statusInfo.showReconnect && onReconnect ? (
        <Pressable onPress={onReconnect} style={styles.reconnectButton}>
          <Feather name="refresh-cw" size={16} color={BeachColors.oceanBlue} />
          <ThemedText style={styles.reconnectText}>Retry</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: BeachColors.cardSurface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  reconnectButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  reconnectText: {
    fontSize: 14,
    color: BeachColors.oceanBlue,
    fontWeight: "500",
  },
});
