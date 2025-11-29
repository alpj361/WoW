import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { usePlacesStore } from "../state/placesStore";
import { RootStackParamList } from "../navigation/RootNavigator";
import { PlaceCategory } from "../types/place";
import { customMapStyle } from "../utils/mapCustomStyles";
import Svg, { Circle, Path } from "react-native-svg";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORY_COLORS: Record<PlaceCategory, string> = {
  coffee: "#0A2472",
  coworking: "#1E3A8A",
  restaurant: "#0A2472",
  bar: "#1E3A8A",
  event: "#0A2472",
};

interface CustomMarkerProps {
  category: PlaceCategory;
  color: string;
}

// Custom hand-drawn marker component
const CustomMarker = ({ category, color }: CustomMarkerProps) => (
  <View className="items-center">
    <Svg width="40" height="50" viewBox="0 0 40 50" fill="none">
      {/* Hand-drawn pin shape */}
      <Path
        d="M20 5 C12 5 6 11 6 19 C6 28 20 45 20 45 C20 45 34 28 34 19 C34 11 28 5 20 5 Z"
        fill={color}
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner dot */}
      <Circle cx="20" cy="18" r="5" fill="white" />
    </Svg>
  </View>
);

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const places = usePlacesStore((s) => s.places);
  const selectedCategory = usePlacesStore((s) => s.selectedCategory);
  const setSelectedCategory = usePlacesStore((s) => s.setSelectedCategory);

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

  // Filter places based on selected category
  const filteredPlaces =
    selectedCategory === "all"
      ? places
      : places.filter((p) => p.category === selectedCategory);

  const CATEGORIES = [
    { id: "all", label: "All", icon: "apps" },
    { id: "coffee", label: "Coffee", icon: "cafe" },
    { id: "restaurant", label: "Food", icon: "restaurant" },
    { id: "bar", label: "Bars", icon: "wine" },
    { id: "coworking", label: "Cowork", icon: "briefcase" },
    { id: "gym", label: "Gym", icon: "fitness" },
    { id: "hotel", label: "Hotels", icon: "bed" },
    { id: "shopping", label: "Shop", icon: "cart" },
  ] as const;

  return (
    <View className="flex-1">
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        region={region}
        showsUserLocation
        showsMyLocationButton={false}
        onRegionChangeComplete={setRegion}
        customMapStyle={customMapStyle}
      >
        {filteredPlaces.map((place) => (
          <Marker
            key={place.id}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            onPress={() =>
              navigation.navigate("PlaceDetail", { placeId: place.id })
            }
            tracksViewChanges={false}
          >
            <View className="items-center">
              <View
                className="rounded-full p-3"
                style={{
                  backgroundColor: place.primaryColor || "#0A2472",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
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
                className="mt-1 bg-white rounded-full px-2 py-0.5"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 2,
                  elevation: 3,
                }}
              >
                <Text className="text-xs font-semibold" style={{ color: "#0A2472" }}>
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
          <Text className="text-2xl font-bold" style={{ color: "#0A2472" }}>
            Map
          </Text>
        </View>
      </View>

      {/* Category Filter Pills */}
      <View className="absolute top-28 left-0 right-0 px-5">
        <View
          className="bg-white/95 rounded-full py-2 px-3 flex-row"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {CATEGORIES.map((category) => (
            <Pressable
              key={category.id}
              onPress={() =>
                setSelectedCategory(category.id as PlaceCategory | "all")
              }
              className="px-3 py-1.5 rounded-full flex-row items-center mr-2"
              style={{
                backgroundColor:
                  selectedCategory === category.id ? "#0A2472" : "transparent",
              }}
            >
              <Ionicons
                name={category.icon as keyof typeof Ionicons.glyphMap}
                size={14}
                color={selectedCategory === category.id ? "white" : "#6B7280"}
              />
              {selectedCategory === category.id && (
                <Text className="text-white text-xs font-semibold ml-1">
                  {category.label}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Recenter Button */}
      <Pressable
        onPress={recenterMap}
        className="absolute bottom-8 right-5 bg-white rounded-full p-4"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <Ionicons name="navigate" size={24} color="#0A2472" />
      </Pressable>

      {/* Add Place Button */}
      <Pressable
        onPress={() => navigation.navigate("AddPlace")}
        className="absolute bottom-8 left-5 rounded-full px-5 py-4 flex-row items-center"
        style={{
          backgroundColor: "#0A2472",
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
