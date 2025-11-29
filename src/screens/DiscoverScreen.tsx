import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";
import { usePlacesStore } from "../state/placesStore";
import { useUserStore } from "../state/userStore";
import { RootStackParamList } from "../navigation/RootNavigator";
import { PlaceCategory } from "../types/place";
import {
  HandDrawnCoffeeIcon,
  HandDrawnFoodIcon,
  HandDrawnBarIcon,
  HandDrawnCoworkingIcon,
  HandDrawnGymIcon,
  HandDrawnHotelIcon,
  HandDrawnShoppingIcon,
} from "../components/HandDrawnIcons";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get("window");
const CARD_HEIGHT = height * 0.65;

const CATEGORIES = [
  { id: "all", label: "All", icon: "apps" },
  { id: "coffee", label: "Coffee", icon: "cafe" },
  { id: "coworking", label: "Cowork", icon: "briefcase" },
  { id: "restaurant", label: "Food", icon: "restaurant" },
  { id: "bar", label: "Bars", icon: "wine" },
] as const;

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const scrollY = useSharedValue(0);

  const places = usePlacesStore((s) => s.places);
  const selectedCategory = usePlacesStore((s) => s.selectedCategory);
  const setSelectedCategory = usePlacesStore((s) => s.setSelectedCategory);
  const toggleFavorite = usePlacesStore((s) => s.toggleFavorite);
  const profile = useUserStore((s) => s.profile);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 100], [0, 1], "clamp");
    return { opacity };
  });

  const filteredPlaces =
    selectedCategory === "all"
      ? places
      : places.filter((p) => p.category === selectedCategory);

  // Render category icon based on place type
  const renderCategoryIcon = (category: PlaceCategory, size: number = 80) => {
    const color = "white";
    switch (category) {
      case "coffee":
        return <HandDrawnCoffeeIcon size={size} color={color} />;
      case "restaurant":
        return <HandDrawnFoodIcon size={size} color={color} />;
      case "bar":
        return <HandDrawnBarIcon size={size} color={color} />;
      case "coworking":
        return <HandDrawnCoworkingIcon size={size} color={color} />;
      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header with blur effect */}
      <Animated.View
        style={[headerStyle]}
        className="absolute top-0 left-0 right-0 z-10 bg-white/95 border-b border-gray-100"
      >
        <View style={{ paddingTop: insets.top }} className="px-5 py-4">
          <Text className="text-2xl font-bold" style={{ color: "#0A2472" }}>
            Discover
          </Text>
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top }}
      >
        {/* Welcome Header */}
        <View className="px-5 pt-6 pb-4">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: "#E8EAF6" }}
              >
                <Ionicons name="person" size={20} color="#0A2472" />
              </View>
              <View>
                <Text className="text-sm text-gray-500">Welcome back</Text>
                <Text className="text-xl font-bold" style={{ color: "#0A2472" }}>
                  {profile.name}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => navigation.navigate("AddPlace")}
              className="rounded-full px-4 py-2.5 flex-row items-center"
              style={{ backgroundColor: "#0A2472" }}
            >
              <Ionicons name="add" size={18} color="white" />
              <Text className="text-white font-semibold ml-1 text-sm">
                Add Place
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-5 mb-6"
          contentContainerStyle={{ gap: 8 }}
        >
          {CATEGORIES.map((category) => (
            <Pressable
              key={category.id}
              onPress={() =>
                setSelectedCategory(category.id as PlaceCategory | "all")
              }
              className="px-4 py-2.5 rounded-full flex-row items-center"
              style={{
                backgroundColor:
                  selectedCategory === category.id ? "#0A2472" : "white",
              }}
            >
              <Ionicons
                name={category.icon as keyof typeof Ionicons.glyphMap}
                size={16}
                color={selectedCategory === category.id ? "white" : "#6B7280"}
              />
              <Text
                className={`ml-2 font-semibold ${
                  selectedCategory === category.id
                    ? "text-white"
                    : "text-gray-700"
                }`}
              >
                {category.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Places Cards - Hand-drawn style */}
        <View className="px-5 pb-8">
          {filteredPlaces.map((place, index) => (
            <Pressable
              key={place.id}
              onPress={() =>
                navigation.navigate("PlaceDetail", { placeId: place.id })
              }
              className="mb-6"
            >
              <View
                className="rounded-3xl overflow-hidden"
                style={{
                  height: CARD_HEIGHT,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.2,
                  shadowRadius: 16,
                  elevation: 10,
                }}
              >
                {/* Background with gradient */}
                <LinearGradient
                  colors={[place.primaryColor || "#0A2472", "#1E3A8A"]}
                  style={{ flex: 1 }}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View className="flex-1 justify-between p-6">
                    {/* Top Section - Category Badge & Favorite */}
                    <View className="flex-row justify-between items-start">
                      <View className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5">
                        <Text className="text-xs font-semibold capitalize" style={{ color: place.primaryColor || "#0A2472" }}>
                          {place.category}
                        </Text>
                      </View>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleFavorite(place.id);
                        }}
                        className="bg-white/90 backdrop-blur-sm rounded-full p-2.5"
                      >
                        <Ionicons
                          name={place.isFavorite ? "heart" : "heart-outline"}
                          size={20}
                          color={place.isFavorite ? "#EF4444" : "#6B7280"}
                        />
                      </Pressable>
                    </View>

                    {/* Center Section - Hand-drawn Illustration */}
                    <View className="items-center justify-center flex-1">
                      {renderCategoryIcon(place.category, 120)}
                    </View>

                    {/* Bottom Section - Place Info */}
                    <View>
                      <Text className="text-4xl font-bold text-white mb-2">
                        {place.name}
                      </Text>
                      <Text className="text-white/90 text-base mb-4 leading-6">
                        {place.description}
                      </Text>

                      {/* Details Row */}
                      <View className="flex-row items-center mb-6">
                        <Ionicons
                          name="location"
                          size={16}
                          color="white"
                          style={{ opacity: 0.9 }}
                        />
                        <Text className="text-white/90 text-sm ml-1 flex-1">
                          {place.address.split(",")[0]}
                        </Text>
                      </View>

                      {/* Features */}
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mb-4"
                        contentContainerStyle={{ gap: 8 }}
                      >
                        {place.features?.slice(0, 4).map((feature, idx) => (
                          <View
                            key={idx}
                            className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5"
                          >
                            <Text className="text-white text-xs font-medium">
                              {feature}
                            </Text>
                          </View>
                        ))}
                      </ScrollView>

                      {/* Stats */}
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          {place.rating && (
                            <View className="flex-row items-center mr-4">
                              <Ionicons name="star" size={16} color="#FCD34D" />
                              <Text className="text-white font-semibold ml-1">
                                {place.rating}
                              </Text>
                            </View>
                          )}
                          <View className="flex-row items-center">
                            <Ionicons
                              name="people"
                              size={16}
                              color="white"
                              style={{ opacity: 0.9 }}
                            />
                            <Text className="text-white/90 text-sm ml-1">
                              {place.checkInCount} check-ins
                            </Text>
                          </View>
                        </View>
                        <View className="bg-white rounded-full px-4 py-2">
                          <Text className="font-bold" style={{ color: place.primaryColor || "#0A2472" }}>
                            {place.priceLevel}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </Pressable>
          ))}
        </View>
      </Animated.ScrollView>
    </View>
  );
}
