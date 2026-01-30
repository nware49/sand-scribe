import React, { useCallback } from "react";
import { StyleSheet, View, FlatList, Pressable, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GradientBackground } from "@/components/GradientBackground";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { useBLE } from "@/hooks/useBLE";
import { apiRequest } from "@/lib/query-client";
import { BeachColors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import type { Message } from "@shared/schema";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MessageCardProps {
  message: Message;
  onDeliver: (id: number) => void;
  isDelivering: boolean;
  isConnected: boolean;
}

function MessageCard({ message, onDeliver, isDelivering, isConnected }: MessageCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Animated.View style={[styles.messageCard, animatedStyle]}>
      <View style={styles.messageContent}>
        <ThemedText style={styles.messageText}>{message.text}</ThemedText>
        <ThemedText style={styles.messageTime}>
          Queued at {formatTime(message.createdAt)}
        </ThemedText>
      </View>
      <AnimatedPressable
        onPress={() => onDeliver(message.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!isConnected || isDelivering}
        style={[
          styles.deliverButton,
          (!isConnected || isDelivering) && styles.deliverButtonDisabled,
        ]}
      >
        {isDelivering ? (
          <Feather name="loader" size={18} color={BeachColors.foamWhite} />
        ) : (
          <Feather
            name="upload"
            size={18}
            color={isConnected ? BeachColors.foamWhite : BeachColors.textSecondary}
          />
        )}
      </AnimatedPressable>
    </Animated.View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Feather name="inbox" size={64} color={BeachColors.textSecondary} />
      <ThemedText style={styles.emptyTitle}>No Pending Messages</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Messages queued for the display will appear here
      </ThemedText>
    </View>
  );
}

export default function ReceiveScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const queryClient = useQueryClient();

  const {
    connectionState,
    isConnected,
    deviceName,
    reconnect,
    sendMessage: bleSendMessage,
  } = useBLE();

  const { data: pendingMessages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages/pending"],
    refetchInterval: 5000,
  });

  const [deliveringId, setDeliveringId] = React.useState<number | null>(null);

  const deliverMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const message = pendingMessages.find((m) => m.id === messageId);
      if (!message) throw new Error("Message not found");

      // Send to BLE device
      await bleSendMessage(message.text);

      // Mark as delivered on server
      const response = await apiRequest("PATCH", `/api/messages/${messageId}/deliver`, {});
      return response.json();
    },
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setDeliveringId(null);
    },
    onError: async (error) => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Delivery Failed",
        "Unable to send message to the display. Please check your Bluetooth connection.",
        [{ text: "OK" }]
      );
      setDeliveringId(null);
    },
  });

  const handleDeliver = useCallback(async (id: number) => {
    if (!isConnected) {
      Alert.alert(
        "Not Connected",
        "Please connect to the display device first.",
        [{ text: "OK" }]
      );
      return;
    }

    setDeliveringId(id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    deliverMutation.mutate(id);
  }, [isConnected, deliverMutation]);

  const handleDeliverAll = useCallback(async () => {
    if (!isConnected || pendingMessages.length === 0) return;

    Alert.alert(
      "Deliver All Messages",
      `Send ${pendingMessages.length} message${pendingMessages.length > 1 ? "s" : ""} to the display?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deliver All",
          onPress: async () => {
            for (const message of pendingMessages) {
              setDeliveringId(message.id);
              try {
                await bleSendMessage(message.text);
                await apiRequest("PATCH", `/api/messages/${message.id}/deliver`, {});
              } catch (error) {
                console.error("Failed to deliver message:", error);
              }
            }
            setDeliveringId(null);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
          },
        },
      ]
    );
  }, [isConnected, pendingMessages, bleSendMessage, queryClient]);

  return (
    <GradientBackground>
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + Spacing.xl,
          },
        ]}
      >
        {/* Connection Status */}
        <View style={styles.header}>
          <ConnectionStatus
            state={connectionState}
            deviceName={deviceName}
            onReconnect={reconnect}
          />
        </View>

        {/* Pending Count & Deliver All */}
        {pendingMessages.length > 0 ? (
          <View style={styles.actionBar}>
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>
                {pendingMessages.length} pending
              </ThemedText>
            </View>
            <Pressable
              onPress={handleDeliverAll}
              disabled={!isConnected}
              style={[
                styles.deliverAllButton,
                !isConnected && styles.deliverAllButtonDisabled,
              ]}
            >
              <Feather
                name="upload-cloud"
                size={16}
                color={isConnected ? BeachColors.oceanBlue : BeachColors.textSecondary}
              />
              <ThemedText
                style={[
                  styles.deliverAllText,
                  !isConnected && styles.deliverAllTextDisabled,
                ]}
              >
                Deliver All
              </ThemedText>
            </Pressable>
          </View>
        ) : null}

        {/* Message List */}
        <FlatList
          data={pendingMessages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <MessageCard
              message={item}
              onDeliver={handleDeliver}
              isDelivering={deliveringId === item.id}
              isConnected={isConnected}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarHeight + Spacing.xl },
            pendingMessages.length === 0 && styles.listContentEmpty,
          ]}
          ListEmptyComponent={!isLoading ? <EmptyState /> : null}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />

        {/* BLE Notice */}
        {Platform.OS === "web" ? (
          <View style={[styles.noticeContainer, { bottom: tabBarHeight + Spacing.lg }]}>
            <Feather name="info" size={14} color={BeachColors.textSecondary} />
            <ThemedText style={styles.noticeText}>
              BLE requires Expo Go on a physical device
            </ThemedText>
          </View>
        ) : null}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  badge: {
    backgroundColor: BeachColors.sunsetCoral,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: BeachColors.foamWhite,
  },
  deliverAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: BeachColors.cardSurface,
  },
  deliverAllButtonDisabled: {
    opacity: 0.6,
  },
  deliverAllText: {
    fontSize: 14,
    fontWeight: "500",
    color: BeachColors.oceanBlue,
  },
  deliverAllTextDisabled: {
    color: BeachColors.textSecondary,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  listContentEmpty: {
    justifyContent: "center",
  },
  messageCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BeachColors.cardSurface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  messageContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  messageText: {
    fontSize: 16,
    color: BeachColors.textPrimary,
  },
  messageTime: {
    fontSize: 12,
    color: BeachColors.textSecondary,
  },
  deliverButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BeachColors.oceanBlue,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.md,
  },
  deliverButtonDisabled: {
    backgroundColor: "#B8C5CE",
  },
  separator: {
    height: Spacing.md,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: BeachColors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: 14,
    color: BeachColors.textSecondary,
    textAlign: "center",
  },
  noticeContainer: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  noticeText: {
    fontSize: 12,
    color: BeachColors.textSecondary,
    textAlign: "center",
  },
});
