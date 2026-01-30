import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, FlatList, Image, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { GradientBackground } from "@/components/GradientBackground";
import { getMessages, clearMessages, SentMessage } from "@/lib/storage";
import { BeachColors, Spacing, BorderRadius, Shadows } from "@/constants/theme";

function formatTimestamp(timestamp: number): string {
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
  message: SentMessage;
}

function MessageItem({ message }: MessageItemProps) {
  return (
    <View style={styles.messageItem}>
      <View style={styles.messageContent}>
        <ThemedText style={styles.messageText}>{message.text}</ThemedText>
        <ThemedText style={styles.messageTime}>
          {formatTimestamp(message.timestamp)}
        </ThemedText>
      </View>
      <View style={styles.messageSentIcon}>
        <Feather name="check-circle" size={16} color={BeachColors.success} />
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
        Your sent messages will appear here
      </ThemedText>
    </View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMessages();
      setMessages(data);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleClearHistory = useCallback(() => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to delete all sent messages?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await clearMessages();
            setMessages([]);
          },
        },
      ]
    );
  }, []);

  return (
    <GradientBackground>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageItem message={item} />}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        ListEmptyComponent={!isLoading ? <EmptyState /> : null}
        ListHeaderComponent={
          messages.length > 0 ? (
            <View style={styles.headerRow}>
              <ThemedText style={styles.headerTitle}>
                {messages.length} message{messages.length !== 1 ? "s" : ""} sent
              </ThemedText>
              <Pressable onPress={handleClearHistory} style={styles.clearButton}>
                <Feather name="trash-2" size={16} color={BeachColors.error} />
                <ThemedText style={styles.clearText}>Clear</ThemedText>
              </Pressable>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 14,
    color: BeachColors.textSecondary,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  clearText: {
    fontSize: 14,
    color: BeachColors.error,
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
  messageSentIcon: {
    marginLeft: Spacing.md,
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
    width: 200,
    height: 200,
    marginBottom: Spacing.xl,
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
