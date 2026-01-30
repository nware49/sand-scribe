import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MessageScreen from "@/screens/MessageScreen";
import HistoryScreen from "@/screens/HistoryScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { BeachColors } from "@/constants/theme";

export type RootStackParamList = {
  Message: undefined;
  History: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator
      screenOptions={{
        ...screenOptions,
        contentStyle: {
          backgroundColor: BeachColors.sandyBeige,
        },
      }}
    >
      <Stack.Screen
        name="Message"
        component={MessageScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{
          headerTitle: "Recent Messages",
          headerTintColor: BeachColors.oceanBlue,
        }}
      />
    </Stack.Navigator>
  );
}
