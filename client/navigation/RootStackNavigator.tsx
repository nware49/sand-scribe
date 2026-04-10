import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import OnboardingScreen, { ROLE_STORAGE_KEY } from "@/screens/OnboardingScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { BeachColors } from "@/constants/theme";

export type MainTabName = "SendTab" | "ReceiveTab" | "HistoryTab";
export type UserRole = "helen" | "nate";

export type RootStackParamList = {
  Onboarding: undefined;
  Main: { initialTab?: MainTabName; role?: UserRole };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const [initialRoute, setInitialRoute] = useState<"Onboarding" | "Main" | null>(null);
  const [savedTab, setSavedTab] = useState<MainTabName | undefined>(undefined);
  const [savedRole, setSavedRole] = useState<UserRole | undefined>(undefined);

  useEffect(() => {
    AsyncStorage.getItem(ROLE_STORAGE_KEY).then((role) => {
      if (role === "helen") {
        setSavedTab("ReceiveTab");
        setSavedRole("helen");
        setInitialRoute("Main");
      } else if (role === "nate") {
        setSavedTab("SendTab");
        setSavedRole("nate");
        setInitialRoute("Main");
      } else {
        setInitialRoute("Onboarding");
      }
    });
  }, []);

  if (!initialRoute) return null;

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        ...screenOptions,
        contentStyle: {
          backgroundColor: BeachColors.sandyBeige,
        },
      }}
    >
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Main"
        options={{ headerShown: false }}
      >
        {(props) => (
          <MainTabNavigator
            {...props}
            initialTab={props.route.params?.initialTab ?? savedTab}
            role={props.route.params?.role ?? savedRole}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
