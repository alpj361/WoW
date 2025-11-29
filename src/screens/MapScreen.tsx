import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { usePlacesStore } from "../state/placesStore";
import { RootStackParamList } from "../navigation/RootNavigator";
import { PlaceCategory } from "../types/place";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORY_COLORS: Record<PlaceCategory, string> = {
  coffee: "#8B5CF6",
  coworking: "#10B981",
  restaurant: "#EF4444",
  bar: "#F59E0B",
  event: "#3B82F6",
};

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const places = usePlacesStore((s) => s.places);

  const [region, setRegion] = useState({
    latitude: 40.7128,
    longitude: -73.9352,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    })();
  }, []);

  const recenterMap = () => {
    if (userLocation) {
      setRegion({
        ...region,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });
    }
  };

  return (
    <View className="flex-1">
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        region={region}
        showsUserLocation
        showsMyLocationButton={false}
        onRegionChangeComplete={setRegion}
      >
        {places.map((place) => (
          <Marker
            key={place.id}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            onPress={() =>
              navigation.navigate("PlaceDetail", { placeId: place.id })
            }
          >
            <View className="items-center">
              <View
                className="rounded-full p-3 shadow-lg"
                style={{
                  backgroundColor: place.primaryColor || "#4F46E5",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                <Ionicons
                  name={
                    place.category === "coffee"
                      ? "cafe"
                      : place.category === "coworking"
                      ? "briefcase"
                      : place.category === "restaurant"
                      ? "restaurant"
                      : place.category === "bar"
                      ? "wine"
                      : "location"
                  }
                  size={20}
                  color="white"
                />
              </View>
              <View
                className="mt-1 bg-white rounded-full px-2 py-0.5 shadow"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 2,
                  elevation: 3,
                }}
              >
                <Text className="text-xs font-semibold text-gray-800">
                  {place.name}
                </Text>
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="absolute top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-100"
      >
        <View className="px-5 py-4">
          <Text className="text-2xl font-bold text-gray-900">Map</Text>
        </View>
      </View>

      {/* Recenter Button */}
      <Pressable
        onPress={recenterMap}
        className="absolute bottom-8 right-5 bg-white rounded-full p-4 shadow-lg"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <Ionicons name="navigate" size={24} color="#4F46E5" />
      </Pressable>

      {/* Add Place Button */}
      <Pressable
        onPress={() => navigation.navigate("AddPlace")}
        className="absolute bottom-8 left-5 bg-indigo-600 rounded-full px-5 py-4 flex-row items-center shadow-lg"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <Ionicons name="add" size={20} color="white" />
        <Text className="text-white font-semibold ml-2">Add Place</Text>
      </Pressable>
    </View>
  );
}
