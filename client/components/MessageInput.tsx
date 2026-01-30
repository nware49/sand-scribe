import React, { forwardRef } from "react";
import { StyleSheet, View, TextInput, TextInputProps } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { BeachColors, Spacing, BorderRadius, Shadows } from "@/constants/theme";

const MAX_CHARACTERS = 100;

interface MessageInputProps extends Omit<TextInputProps, "style"> {
  value: string;
  onChangeText: (text: string) => void;
}

export const MessageInput = forwardRef<TextInput, MessageInputProps>(
  ({ value, onChangeText, ...props }, ref) => {
    const remainingChars = MAX_CHARACTERS - value.length;
    const isNearLimit = remainingChars <= 20;
    const isAtLimit = remainingChars <= 0;

    const handleChangeText = (text: string) => {
      if (text.length <= MAX_CHARACTERS) {
        onChangeText(text);
      }
    };

    return (
      <View style={styles.container}>
        <TextInput
          ref={ref}
          style={styles.input}
          value={value}
          onChangeText={handleChangeText}
          placeholder="Write your message..."
          placeholderTextColor={BeachColors.textSecondary}
          multiline
          maxLength={MAX_CHARACTERS}
          textAlignVertical="top"
          {...props}
        />
        <View style={styles.footer}>
          <View style={styles.spacer} />
          <ThemedText
            style={[
              styles.counter,
              isNearLimit && styles.counterWarning,
              isAtLimit && styles.counterLimit,
            ]}
          >
            {value.length}/{MAX_CHARACTERS}
          </ThemedText>
        </View>
      </View>
    );
  }
);

MessageInput.displayName = "MessageInput";

const styles = StyleSheet.create({
  container: {
    backgroundColor: BeachColors.cardSurface,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
    overflow: "hidden",
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    color: BeachColors.textPrimary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    minHeight: 120,
    maxHeight: 180,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  spacer: {
    flex: 1,
  },
  counter: {
    fontSize: 12,
    color: BeachColors.textSecondary,
  },
  counterWarning: {
    color: BeachColors.sunsetCoral,
  },
  counterLimit: {
    color: BeachColors.error,
  },
});
