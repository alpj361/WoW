import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  Share,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { usePlacesStore } from "../state/placesStore";
import { useUserStore } from "../state/userStore";
import { useEventsStore } from "../state/eventsStore";
import { RootStackParamList } from "../navigation/RootNavigator";

type RouteParams = RouteProp<RootStackParamList, "PlaceDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get("window");

export default function PlaceDetailScreen() {
  const route = useRoute<RouteParams>();
  const navigation = useNavigation<NavigationProp>();
  const { placeId } = route.params;

  const places = usePlacesStore((s) => s.places);
  const toggleFavorite = usePlacesStore((s) => s.toggleFavorite);
  const incrementCheckIn = usePlacesStore((s) => s.incrementCheckIn);
  const addCheckIn = useUserStore((s) => s.addCheckIn);
  const events = useEventsStore((s) => s.events);

  const place = places.find((p) => p.id === placeId);
  const placeEvents = events.filter((e) => e.placeId === placeId);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const imageStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-100, 0],
      [1.5, 1],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ scale }],
    };
  });

  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [200, 300], [0, 1], "clamp");
    return { opacity };
  });

  if (!place) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">Place not found</Text>
        <Pressable onPress={() => navigation.goBack()} className="mt-4">
          <Text className="text-indigo-600 font-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const handleCheckIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addCheckIn({
      id: Date.now().toString(),
      placeId: place.id,
      placeName: place.name,
      timestamp: new Date(),
    });
    incrementCheckIn(place.id);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${place.name} on our map! ${place.address}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(place.id);
  };

  return (
    <View className="flex-1 bg-white">
      {/* Animated Header */}
      <Animated.View
        style={[headerStyle]}
        className="absolute top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100"
      >
        <View className="pt-14 px-5 pb-4 flex-row items-center justify-between">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 bg-white rounded-full items-center justify-center shadow"
          >
            <Ionicons name="close" size={24} color="#1F2937" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
            {place.name}
          </Text>
          <View className="w-10" />
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <View className="h-96 overflow-hidden">
          <Animated.View style={[imageStyle, { flex: 1 }]}>
            <Image
              source={{ uri: place.images[0] }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          </Animated.View>
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 200,
            }}
          />

          {/* Floating Action Buttons */}
          <View className="absolute top-14 left-0 right-0 px-5 flex-row items-center justify-between">
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full items-center justify-center shadow"
            >
              <Ionicons name="chevron-back" size={24} color="#1F2937" />
            </Pressable>
            <View className="flex-row gap-3">
              <Pressable
                onPress={handleShare}
                className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full items-center justify-center shadow"
              >
                <Ionicons name="share-outline" size={20} color="#1F2937" />
              </Pressable>
              <Pressable
                onPress={handleFavorite}
                className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full items-center justify-center shadow"
              >
                <Ionicons
                  name={place.isFavorite ? "heart" : "heart-outline"}
                  size={20}
                  color={place.isFavorite ? "#EF4444" : "#1F2937"}
                />
              </Pressable>
            </View>
          </View>

          {/* Title Overlay */}
          <View className="absolute bottom-6 left-5 right-5">
            <View className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 self-start mb-3">
              <Text className="text-white text-xs font-semibold capitalize">
                {place.category}
              </Text>
            </View>
            <Text className="text-4xl font-bold text-white mb-2">
              {place.name}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View className="px-5 py-6">
          {/* Stats Row */}
          <View className="flex-row justify-around mb-6 bg-gray-50 rounded-2xl py-4">
            {place.rating && (
              <View className="items-center">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="star" size={20} color="#FCD34D" />
                  <Text className="text-xl font-bold text-gray-900 ml-1">
                    {place.rating}
                  </Text>
                </View>
                <Text className="text-xs text-gray-500">Rating</Text>
              </View>
            )}
            <View className="items-center">
              <Text className="text-xl font-bold text-gray-900 mb-1">
                {place.checkInCount}
              </Text>
              <Text className="text-xs text-gray-500">Check-ins</Text>
            </View>
            {place.priceLevel && (
              <View className="items-center">
                <Text className="text-xl font-bold text-gray-900 mb-1">
                  {place.priceLevel}
                </Text>
                <Text className="text-xs text-gray-500">Price</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">About</Text>
            <Text className="text-base text-gray-700 leading-6">
              {place.description}
            </Text>
          </View>

          {/* Details */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Details
            </Text>

            <View className="space-y-3">
              <View className="flex-row items-start py-3 border-b border-gray-100">
                <Ionicons name="location" size={20} color="#6B7280" />
                <View className="flex-1 ml-3">
                  <Text className="text-sm text-gray-500 mb-1">Address</Text>
                  <Text className="text-base text-gray-900">{place.address}</Text>
                </View>
              </View>

              {place.hours && (
                <View className="flex-row items-start py-3 border-b border-gray-100">
                  <Ionicons name="time" size={20} color="#6B7280" />
                  <View className="flex-1 ml-3">
                    <Text className="text-sm text-gray-500 mb-1">Hours</Text>
                    <Text className="text-base text-gray-900">{place.hours}</Text>
                  </View>
                </View>
              )}

              {place.contact && (
                <View className="flex-row items-start py-3 border-b border-gray-100">
                  <Ionicons name="call" size={20} color="#6B7280" />
                  <View className="flex-1 ml-3">
                    <Text className="text-sm text-gray-500 mb-1">Contact</Text>
                    <Text className="text-base text-gray-900">{place.contact}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Features */}
          {place.features && place.features.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-3">
                Features
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {place.features.map((feature, idx) => (
                  <View
                    key={idx}
                    className="bg-indigo-50 rounded-full px-4 py-2"
                  >
                    <Text className="text-sm font-medium text-indigo-700">
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Events at this place */}
          {placeEvents.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-bold text-gray-900">
                  Upcoming Events
                </Text>
                <Text className="text-sm text-indigo-600 font-semibold">
                  {placeEvents.length}
                </Text>
              </View>
              {placeEvents.map((event) => (
                <View
                  key={event.id}
                  className="bg-gray-50 rounded-xl p-4 mb-3"
                >
                  <Text className="text-base font-bold text-gray-900 mb-1">
                    {event.name}
                  </Text>
                  <Text className="text-sm text-gray-600 mb-2">
                    {event.time}
                  </Text>
                  <Text className="text-sm text-gray-700" numberOfLines={2}>
                    {event.description}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Bottom Action Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 pb-8">
        <Pressable
          onPress={handleCheckIn}
          className="bg-indigo-600 rounded-full py-4 flex-row items-center justify-center shadow-lg"
          style={{
            shadowColor: "#4F46E5",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Ionicons name="checkmark-circle" size={24} color="white" />
          <Text className="text-white text-lg font-bold ml-2">Check In</Text>
        </Pressable>
      </View>
    </View>
  );
}
