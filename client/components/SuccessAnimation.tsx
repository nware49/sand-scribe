import React, { useEffect } from "react";
import { StyleSheet, Image, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SuccessAnimationProps {
  visible: boolean;
  onComplete: () => void;
}

export function SuccessAnimation({ visible, onComplete }: SuccessAnimationProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Reset values
      scale.value = 0;
      opacity.value = 0;
      rotation.value = 0;

      // Animate in
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSequence(
        withTiming(1.2, { duration: 400, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: 200 })
      );
      rotation.value = withTiming(360, { duration: 600, easing: Easing.out(Easing.quad) });

      // Fade out and complete
      opacity.value = withDelay(
        1500,
        withTiming(0, { duration: 500 }, (finished) => {
          if (finished) {
            runOnJS(onComplete)();
          }
        })
      );
      scale.value = withDelay(
        1500,
        withTiming(1.3, { duration: 500 })
      );
    }
  }, [visible, scale, opacity, rotation, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Image
        source={require("../../assets/images/success-heart.png")}
        style={styles.heart}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(245, 230, 211, 0.8)",
    zIndex: 1000,
  },
  heart: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
  },
});
