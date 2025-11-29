import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  Share,
  Linking,
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
import { fetchInstagramPosts, getTimeAgo } from "../utils/instagramService";
import { InstagramPost } from "../types/place";

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
  const [instagramPosts, setInstagramPosts] = useState<InstagramPost[]>([]);
  const [loadingInstagram, setLoadingInstagram] = useState(false);

  const scrollY = useSharedValue(0);

  // Load Instagram posts when component mounts
  useEffect(() => {
    if (place?.instagramHandle) {
      setLoadingInstagram(true);
      fetchInstagramPosts(place.instagramHandle)
        .then(posts => setInstagramPosts(posts))
        .catch(err => console.error('Error loading Instagram posts:', err))
        .finally(() => setLoadingInstagram(false));
    }
  }, [place?.instagramHandle]);

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

          {/* Instagram Feed Section */}
          {place.instagramHandle && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Ionicons name="logo-instagram" size={24} style={{ color: "#0A2472" }} />
                  <Text className="text-lg font-bold ml-2" style={{ color: "#0A2472" }}>
                    @{place.instagramHandle}
                  </Text>
                </View>
                <Pressable
                  onPress={() => Linking.openURL(`https://instagram.com/${place.instagramHandle}`)}
                  className="px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: "#E8EAF6" }}
                >
                  <Text className="text-xs font-semibold" style={{ color: "#0A2472" }}>
                    Follow
                  </Text>
                </Pressable>
              </View>

              {loadingInstagram ? (
                <View className="py-8 items-center">
                  <Text className="text-gray-500">Loading posts...</Text>
                </View>
              ) : instagramPosts.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12 }}
                >
                  {instagramPosts.map((post) => (
                    <Pressable
                      key={post.id}
                      onPress={() => post.permalink && Linking.openURL(post.permalink)}
                      className="w-40"
                    >
                      <View className="rounded-xl overflow-hidden mb-2" style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                      }}>
                        <Image
                          source={{ uri: post.imageUrl }}
                          className="w-40 h-40"
                          resizeMode="cover"
                        />
                      </View>
                      <Text className="text-xs text-gray-700 mb-1" numberOfLines={2}>
                        {post.caption}
                      </Text>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Ionicons name="heart" size={12} color="#EF4444" />
                          <Text className="text-xs text-gray-500 ml-1">{post.likes}</Text>
                        </View>
                        <Text className="text-xs text-gray-400">
                          {getTimeAgo(post.timestamp)}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : (
                <View className="py-6 items-center bg-gray-50 rounded-xl">
                  <Text className="text-gray-500">No posts yet</Text>
                </View>
              )}
            </View>
          )}

          {/* Events at this place */}
          {placeEvents.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-bold text-gray-900">
                  Upcoming Events
                </Text>
                <Text className="text-sm font-semibold" style={{ color: "#0A2472" }}>
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
          className="rounded-full py-4 flex-row items-center justify-center shadow-lg"
          style={{
            backgroundColor: "#0A2472",
            shadowColor: "#0A2472",
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
