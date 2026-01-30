import React, { useState, useRef, useCallback } from "react";
import { StyleSheet, View, TextInput, Alert, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useFonts, Pacifico_400Regular } from "@expo-google-fonts/pacifico";
import * as Haptics from "expo-haptics";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { GradientBackground } from "@/components/GradientBackground";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { MessageInput } from "@/components/MessageInput";
import { SendButton } from "@/components/SendButton";
import { SuggestedMessages } from "@/components/SuggestedMessages";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { useBLE } from "@/hooks/useBLE";
import { saveMessage } from "@/lib/storage";
import { BeachColors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MessageScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const inputRef = useRef<TextInput>(null);
  
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const {
    connectionState,
    isConnected,
    deviceName,
    reconnect,
    sendMessage: bleSendMessage,
  } = useBLE();

  const [fontsLoaded] = useFonts({
    Pacifico_400Regular,
  });

  const handleSend = useCallback(async () => {
    if (!message.trim() || !isConnected || isSending) return;

    setIsSending(true);

    try {
      const success = await bleSendMessage(message.trim());
      
      if (success) {
        await saveMessage(message.trim());
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMessage("");
        setShowSuccess(true);
      }
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Send Failed",
        "Unable to send your message. Please check your connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSending(false);
    }
  }, [message, isConnected, isSending, bleSendMessage]);

  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setMessage(suggestion);
    inputRef.current?.focus();
  }, []);

  const handleSuccessComplete = useCallback(() => {
    setShowSuccess(false);
  }, []);

  const openHistory = useCallback(() => {
    navigation.navigate("History");
  }, [navigation]);

  const canSend = isConnected && message.trim().length > 0 && !isSending;

  return (
    <GradientBackground>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Connection Status */}
        <ConnectionStatus
          state={connectionState}
          deviceName={deviceName}
          onReconnect={reconnect}
        />

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
            Beach Messages
          </ThemedText>
        </View>

        {/* Message Input */}
        <View style={styles.inputSection}>
          <MessageInput
            ref={inputRef}
            value={message}
            onChangeText={setMessage}
            editable={isConnected}
          />
        </View>

        {/* Send Button */}
        <SendButton
          onPress={handleSend}
          disabled={!canSend}
          loading={isSending}
        />

        {/* Suggested Messages */}
        <SuggestedMessages onSelect={handleSuggestionSelect} />

        {/* BLE Notice */}
        <View style={styles.noticeContainer}>
          <Feather name="info" size={14} color={BeachColors.textSecondary} />
          <ThemedText style={styles.noticeText}>
            Demo mode: BLE requires a development build for real device connection
          </ThemedText>
        </View>
      </KeyboardAwareScrollViewCompat>

      {/* History FAB */}
      <Pressable
        style={[
          styles.fab,
          { bottom: insets.bottom + Spacing.xl },
        ]}
        onPress={openHistory}
      >
        <Feather name="list" size={24} color={BeachColors.oceanBlue} />
      </Pressable>

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
    marginTop: Spacing.lg,
  },
  titleIcon: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 32,
    color: BeachColors.oceanBlue,
    textAlign: "center",
  },
  inputSection: {
    marginTop: Spacing.sm,
  },
  noticeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  noticeText: {
    fontSize: 12,
    color: BeachColors.textSecondary,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BeachColors.cardSurface,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.floating,
  },
});
