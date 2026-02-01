import React, { useState, useRef, useCallback } from "react";
import { StyleSheet, View, TextInput, Alert, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFonts, Pacifico_400Regular } from "@expo-google-fonts/pacifico";
import * as Haptics from "expo-haptics";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { GradientBackground } from "@/components/GradientBackground";
import { MessageInput } from "@/components/MessageInput";
import { SuggestedMessages } from "@/components/SuggestedMessages";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { QueueButton } from "@/components/QueueButton";
import { apiRequest } from "@/lib/query-client";
import { BeachColors, Spacing } from "@/constants/theme";

export default function SendScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const inputRef = useRef<TextInput>(null);
  
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  
  const queryClient = useQueryClient();

  const [fontsLoaded] = useFonts({
    Pacifico_400Regular,
  });

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/messages", { text });
      return response.json();
    },
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMessage("");
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
    onError: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Send Failed",
        "Unable to queue your message. Please check your connection and try again.",
        [{ text: "OK" }]
      );
    },
  });

  const handleSend = useCallback(async () => {
    if (!message.trim() || sendMutation.isPending) return;
    sendMutation.mutate(message.trim());
  }, [message, sendMutation]);

  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setMessage(suggestion);
    inputRef.current?.focus();
  }, []);

  const handleSuccessComplete = useCallback(() => {
    setShowSuccess(false);
  }, []);

  const canSend = message.trim().length > 0 && !sendMutation.isPending;

  return (
    <GradientBackground>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* App Title */}
        <View style={styles.titleContainer}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.titleIcon}
            resizeMode="contain"
          />
          <ThemedText
            style={[
              styles.title,
              fontsLoaded && { fontFamily: "Pacifico_400Regular" },
            ]}
          >
            Sand Scribe
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Send messages to Helen's display
          </ThemedText>
        </View>

        {/* Message Input */}
        <View style={styles.inputSection}>
          <MessageInput
            ref={inputRef}
            value={message}
            onChangeText={setMessage}
          />
        </View>

        {/* Send Button */}
        <QueueButton
          onPress={handleSend}
          disabled={!canSend}
          loading={sendMutation.isPending}
        />

        {/* Suggested Messages */}
        <SuggestedMessages onSelect={handleSuggestionSelect} />
      </KeyboardAwareScrollViewCompat>

      {/* Success Animation */}
      <SuccessAnimation visible={showSuccess} onComplete={handleSuccessComplete} />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  titleContainer: {
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  titleIcon: {
    width: 56,
    height: 56,
  },
  title: {
    fontSize: 28,
    lineHeight: 40,
    color: BeachColors.oceanBlue,
    textAlign: "center",
    paddingHorizontal: Spacing.md,
  },
  subtitle: {
    fontSize: 14,
    color: BeachColors.textSecondary,
    textAlign: "center",
  },
  inputSection: {
    marginTop: Spacing.sm,
  },
});
