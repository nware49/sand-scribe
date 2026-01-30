import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";

import SendScreen from "@/screens/SendScreen";
import ReceiveScreen from "@/screens/ReceiveScreen";
import HistoryScreen from "@/screens/HistoryScreen";
import { BeachColors } from "@/constants/theme";

export type MainTabParamList = {
  SendTab: undefined;
  ReceiveTab: undefined;
  HistoryTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="SendTab"
      screenOptions={{
        tabBarActiveTintColor: BeachColors.oceanBlue,
        tabBarInactiveTintColor: BeachColors.textSecondary,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: BeachColors.cardSurface,
            web: BeachColors.cardSurface,
          }),
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="SendTab"
        component={SendScreen}
        options={{
          title: "Send",
          tabBarIcon: ({ color, size }) => (
            <Feather name="edit-3" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ReceiveTab"
        component={ReceiveScreen}
        options={{
          title: "Receive",
          tabBarIcon: ({ color, size }) => (
            <Feather name="bluetooth" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryScreen}
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <Feather name="clock" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
