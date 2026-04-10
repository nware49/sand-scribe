import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFonts, Pacifico_400Regular } from "@expo-google-fonts/pacifico";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { GradientBackground } from "@/components/GradientBackground";
import { BeachColors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

export const ROLE_STORAGE_KEY = "sandscribe_user_role";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [selecting, setSelecting] = useState<"helen" | "nate" | null>(null);

  const [fontsLoaded] = useFonts({
    Pacifico_400Regular,
  });

  const handleSelect = async (role: "helen" | "nate") => {
    if (selecting) return;
    setSelecting(role);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.setItem(ROLE_STORAGE_KEY, role);
    navigation.replace("Main", {
      initialTab: role === "helen" ? "ReceiveTab" : "SendTab",
      role,
    });
  };

  return (
    <GradientBackground>
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + Spacing["4xl"],
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <View style={styles.header}>
          <ThemedText
            style={[
              styles.title,
              fontsLoaded ? { fontFamily: "Pacifico_400Regular" } : {},
            ]}
          >
            Sand Scribe
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Messages written in the sand, carried by the tide
          </ThemedText>
        </View>

        <View style={styles.waveDivider} />

        <View style={styles.body}>
          <ThemedText style={styles.question}>Who are you?</ThemedText>
          <ThemedText style={styles.hint}>
            This helps us show you the right view
          </ThemedText>

          <View style={styles.cards}>
            <Pressable
              testID="button-select-helen"
              style={({ pressed }) => [
                styles.card,
                styles.cardHelen,
                pressed && styles.cardPressed,
                selecting === "helen" && styles.cardSelected,
              ]}
              onPress={() => handleSelect("helen")}
              disabled={selecting !== null}
            >
              {selecting === "helen" ? (
                <ActivityIndicator color={BeachColors.foamWhite} />
              ) : (
                <>
                  <ThemedText style={styles.cardName}>Helen</ThemedText>
                  <ThemedText style={styles.cardRole}>Receiver</ThemedText>
                  <ThemedText style={styles.cardDesc}>
                    Connect your display and receive messages from Nate
                  </ThemedText>
                </>
              )}
            </Pressable>

            <Pressable
              testID="button-select-nate"
              style={({ pressed }) => [
                styles.card,
                styles.cardNate,
                pressed && styles.cardPressed,
                selecting === "nate" && styles.cardSelected,
              ]}
              onPress={() => handleSelect("nate")}
              disabled={selecting !== null}
            >
              {selecting === "nate" ? (
                <ActivityIndicator color={BeachColors.foamWhite} />
              ) : (
                <>
                  <ThemedText style={styles.cardName}>Nate</ThemedText>
                  <ThemedText style={styles.cardRole}>Sender</ThemedText>
                  <ThemedText style={styles.cardDesc}>
                    Compose messages and add them to the queue for Helen
                  </ThemedText>
                </>
              )}
            </Pressable>
          </View>
        </View>

        <ThemedText style={styles.footer}>
          Tap your name to get started
        </ThemedText>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing["2xl"],
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  title: {
    fontSize: 40,
    lineHeight: 52,
    color: BeachColors.oceanBlue,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.small,
    color: BeachColors.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },
  waveDivider: {
    height: 2,
    borderRadius: 1,
    backgroundColor: BeachColors.lightOcean,
    opacity: 0.6,
    marginVertical: Spacing.xl,
  },
  body: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.sm,
  },
  question: {
    ...Typography.h2,
    color: BeachColors.textPrimary,
    textAlign: "center",
  },
  hint: {
    ...Typography.small,
    color: BeachColors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing["2xl"],
  },
  cards: {
    gap: Spacing.lg,
  },
  card: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing["3xl"],
    paddingHorizontal: Spacing["2xl"],
    gap: Spacing.xs,
    alignItems: "center",
    minHeight: 130,
    justifyContent: "center",
  },
  cardHelen: {
    backgroundColor: BeachColors.oceanBlue,
  },
  cardNate: {
    backgroundColor: BeachColors.sunsetCoral,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardSelected: {
    opacity: 0.9,
  },
  cardName: {
    fontSize: 26,
    fontWeight: "700",
    color: BeachColors.foamWhite,
  },
  cardRole: {
    ...Typography.small,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  cardDesc: {
    ...Typography.small,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  footer: {
    ...Typography.caption,
    color: BeachColors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xl,
  },
});
