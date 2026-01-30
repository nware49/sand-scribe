import React from "react";
import { StyleSheet, View, FlatList, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { GradientBackground } from "@/components/GradientBackground";
import { BeachColors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import type { Message } from "@shared/schema";

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
        <ThemedText style={styles.messageText}>{message.text}</ThemedText>
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

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    refetchInterval: 10000,
  });

  const deliveredCount = messages.filter((m) => m.delivered).length;
  const pendingCount = messages.filter((m) => !m.delivered).length;

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
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
});
