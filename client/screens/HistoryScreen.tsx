import React, { useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Image,
  Modal,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CommonActions } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { GradientBackground } from "@/components/GradientBackground";
import { BeachColors, Spacing, BorderRadius, Shadows, Typography } from "@/constants/theme";
import { ROLE_STORAGE_KEY } from "@/screens/OnboardingScreen";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { Message } from "@shared/schema";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

function formatTimestamp(timestamp: Date | string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "long" });
  } else {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
}

interface MessageItemProps {
  message: Message;
}

function MessageItem({ message }: MessageItemProps) {
  return (
    <View style={styles.messageItem}>
      <View style={styles.messageContent}>
        {message.delivered ? (
          <ThemedText style={styles.messageText}>{message.text}</ThemedText>
        ) : (
          <View style={styles.hiddenMessageRow}>
            <Feather name="lock" size={14} color={BeachColors.textSecondary} />
            <ThemedText style={styles.hiddenText}>Hidden until delivered</ThemedText>
          </View>
        )}
        <View style={styles.messageFooter}>
          <ThemedText style={styles.messageTime}>
            {formatTimestamp(message.createdAt)}
          </ThemedText>
          <View
            style={[
              styles.statusBadge,
              message.delivered ? styles.statusDelivered : styles.statusPending,
            ]}
          >
            <Feather
              name={message.delivered ? "check-circle" : "clock"}
              size={12}
              color={message.delivered ? BeachColors.success : BeachColors.sunsetCoral}
            />
            <ThemedText
              style={[
                styles.statusText,
                { color: message.delivered ? BeachColors.success : BeachColors.sunsetCoral },
              ]}
            >
              {message.delivered ? "Delivered" : "Pending"}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Image
        source={require("../../assets/images/empty-history.png")}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <ThemedText style={styles.emptyTitle}>No Messages Yet</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Your message history will appear here
      </ThemedText>
    </View>
  );
}

interface ConfirmModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ visible, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Feather name="users" size={28} color={BeachColors.oceanBlue} style={styles.modalIcon} />
          <ThemedText style={styles.modalTitle}>Switch User?</ThemedText>
          <ThemedText style={styles.modalBody}>
            You'll be taken back to the start to choose a different name. Your message history stays intact.
          </ThemedText>
          <View style={styles.modalButtons}>
            <Pressable
              testID="button-cancel-switch"
              style={({ pressed }) => [styles.btnCancel, pressed && styles.btnPressed]}
              onPress={onCancel}
            >
              <ThemedText style={styles.btnCancelText}>Stay</ThemedText>
            </Pressable>
            <Pressable
              testID="button-confirm-switch"
              style={({ pressed }) => [styles.btnConfirm, pressed && styles.btnPressed]}
              onPress={onConfirm}
            >
              <ThemedText style={styles.btnConfirmText}>Switch</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavProp>();
  const [showModal, setShowModal] = useState(false);

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    refetchInterval: 10000,
  });

  const deliveredCount = messages.filter((m) => m.delivered).length;
  const pendingCount = messages.filter((m) => !m.delivered).length;

  const handleSwitchConfirm = async () => {
    setShowModal(false);
    await AsyncStorage.removeItem(ROLE_STORAGE_KEY);
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: "Onboarding" }] })
    );
  };

  const switchUserFooter = (
    <View style={styles.switchContainer}>
      <Pressable
        testID="button-switch-user"
        style={({ pressed }) => [styles.switchButton, pressed && styles.switchButtonPressed]}
        onPress={() => setShowModal(true)}
      >
        <Feather name="users" size={14} color={BeachColors.textSecondary} />
        <ThemedText style={styles.switchText}>Switch User</ThemedText>
      </Pressable>
    </View>
  );

  return (
    <GradientBackground>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <MessageItem message={item} />}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
          messages.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={!isLoading ? <EmptyState /> : null}
        ListHeaderComponent={
          messages.length > 0 ? (
            <View style={styles.headerRow}>
              <ThemedText style={styles.headerTitle}>Message History</ThemedText>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Feather name="check-circle" size={14} color={BeachColors.success} />
                  <ThemedText style={styles.statText}>{deliveredCount} delivered</ThemedText>
                </View>
                <View style={styles.stat}>
                  <Feather name="clock" size={14} color={BeachColors.sunsetCoral} />
                  <ThemedText style={styles.statText}>{pendingCount} pending</ThemedText>
                </View>
              </View>
            </View>
          ) : null
        }
        ListFooterComponent={switchUserFooter}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <ConfirmModal
        visible={showModal}
        onConfirm={handleSwitchConfirm}
        onCancel={() => setShowModal(false)}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  listContentEmpty: {
    justifyContent: "center",
  },
  headerRow: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: BeachColors.textPrimary,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statText: {
    fontSize: 14,
    color: BeachColors.textSecondary,
  },
  messageItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BeachColors.cardSurface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  messageContent: {
    flex: 1,
    gap: Spacing.sm,
  },
  messageText: {
    fontSize: 16,
    color: BeachColors.textPrimary,
  },
  hiddenMessageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  hiddenText: {
    fontSize: 14,
    color: BeachColors.textSecondary,
    fontStyle: "italic",
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  messageTime: {
    fontSize: 12,
    color: BeachColors.textSecondary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusDelivered: {
    backgroundColor: "rgba(110, 207, 160, 0.15)",
  },
  statusPending: {
    backgroundColor: "rgba(242, 142, 125, 0.15)",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  separator: {
    height: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyImage: {
    width: 180,
    height: 180,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: BeachColors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: BeachColors.textSecondary,
    textAlign: "center",
  },
  switchContainer: {
    alignItems: "center",
    paddingTop: Spacing["3xl"],
    paddingBottom: Spacing.lg,
  },
  switchButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(123, 138, 154, 0.3)",
  },
  switchButtonPressed: {
    opacity: 0.6,
  },
  switchText: {
    ...Typography.small,
    color: BeachColors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  modalCard: {
    backgroundColor: BeachColors.foamWhite,
    borderRadius: BorderRadius.lg,
    padding: Spacing["3xl"],
    width: "100%",
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadows.floating,
  },
  modalIcon: {
    marginBottom: Spacing.xs,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: BeachColors.textPrimary,
  },
  modalBody: {
    ...Typography.small,
    color: BeachColors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  btnCancel: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(123,138,154,0.3)",
    alignItems: "center",
  },
  btnCancelText: {
    ...Typography.body,
    fontWeight: "600",
    color: BeachColors.textSecondary,
  },
  btnConfirm: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: BeachColors.oceanBlue,
    alignItems: "center",
  },
  btnConfirmText: {
    ...Typography.body,
    fontWeight: "600",
    color: BeachColors.foamWhite,
  },
  btnPressed: {
    opacity: 0.75,
  },
});
