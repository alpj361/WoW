import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

// Import screens
import DiscoverScreen from "../screens/DiscoverScreen";
import MapScreen from "../screens/MapScreen";
import EventsScreen from "../screens/EventsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import PlaceDetailScreen from "../screens/PlaceDetailScreen";
import AddPlaceScreen from "../screens/AddPlaceScreen";
import CreateEventScreen from "../screens/CreateEventScreen";
import SettingsScreen from "../screens/SettingsScreen";

export type RootStackParamList = {
  MainTabs: undefined;
  PlaceDetail: { placeId: string };
  AddPlace: undefined;
  CreateEvent: { placeId?: string };
};

export type TabParamList = {
  Discover: undefined;
  Map: undefined;
  Events: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 88,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#0A2472",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "Discover") {
            iconName = focused ? "compass" : "compass-outline";
          } else if (route.name === "Map") {
            iconName = focused ? "map" : "map-outline";
          } else if (route.name === "Events") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return (
            <View
              className="items-center justify-center rounded-full px-6 py-2"
              style={{
                backgroundColor: focused ? "#E8EAF6" : "transparent"
              }}
            >
              <Ionicons name={iconName} size={size} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{ tabBarLabel: "Discover" }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ tabBarLabel: "Map" }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{ tabBarLabel: "Events" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: "Profile" }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="PlaceDetail"
        component={PlaceDetailScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AddPlace"
        component={AddPlaceScreen}
        options={{
          presentation: "modal",
          headerShown: true,
          headerTitle: "Add New Place",
          headerBackTitle: "Cancel",
        }}
      />
      <Stack.Screen
        name="CreateEvent"
        component={CreateEventScreen}
        options={{
          presentation: "modal",
          headerShown: true,
          headerTitle: "Create Event",
          headerBackTitle: "Cancel",
        }}
      />
    </Stack.Navigator>
  );
}
