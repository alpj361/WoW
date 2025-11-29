import React from "react";
import { View, Text, ScrollView, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useUserStore } from "../state/userStore";
import { usePlacesStore } from "../state/placesStore";
import { RootStackParamList } from "../navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const profile = useUserStore((s) => s.profile);
  const places = usePlacesStore((s) => s.places);

  const favoritePlaces = places.filter((p) => p.isFavorite);
  const recentCheckIns = profile.checkIns.slice(0, 5);

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top, backgroundColor: "#0A2472" }}
        className="pb-6"
      >
        <View className="px-5 py-4">
          <Text className="text-2xl font-bold text-white">Profile</Text>
        </View>

        {/* Profile Info Card */}
        <View className="px-5">
          <View className="bg-white rounded-2xl p-5 shadow-sm">
            <View className="flex-row items-center mb-4">
              <View className="w-16 h-16 bg-indigo-100 rounded-full items-center justify-center mr-4">
                <Text className="text-2xl font-bold text-indigo-600">
                  {profile.name.charAt(0)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900 mb-1">
                  {profile.name}
                </Text>
                {profile.email && (
                  <Text className="text-sm text-gray-600">{profile.email}</Text>
                )}
              </View>
            </View>

            {/* Stats */}
            <View className="flex-row justify-around border-t border-gray-100 pt-4">
              <View className="items-center">
                <Text className="text-2xl font-bold text-gray-900">
                  {profile.checkIns.length}
                </Text>
                <Text className="text-xs text-gray-500 mt-1">Check-ins</Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="items-center">
                <Text className="text-2xl font-bold text-gray-900">
                  {profile.favorites.length}
                </Text>
                <Text className="text-xs text-gray-500 mt-1">Favorites</Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="items-center">
                <Text className="text-2xl font-bold text-gray-900">
                  {profile.createdPlaces.length}
                </Text>
                <Text className="text-xs text-gray-500 mt-1">Added</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Favorite Places */}
        <View className="px-5 pt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">
              Favorite Places
            </Text>
            {favoritePlaces.length > 0 && (
              <Text className="text-sm text-indigo-600 font-semibold">
                {favoritePlaces.length} places
              </Text>
            )}
          </View>

          {favoritePlaces.length === 0 ? (
            <View className="bg-gray-50 rounded-xl p-6 items-center">
              <Ionicons name="heart-outline" size={32} color="#9CA3AF" />
              <Text className="text-gray-500 text-center mt-2">
                No favorites yet
              </Text>
              <Text className="text-gray-400 text-sm text-center mt-1">
                Start exploring and save your favorite places
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
              className="mb-6"
            >
              {favoritePlaces.map((place) => (
                <Pressable
                  key={place.id}
                  onPress={() =>
                    navigation.navigate("PlaceDetail", { placeId: place.id })
                  }
                  className="w-48"
                >
                  <View className="rounded-xl overflow-hidden shadow-sm">
                    <Image
                      source={{ uri: place.images[0] }}
                      className="w-full h-32"
                      resizeMode="cover"
                    />
                    <View className="bg-white p-3">
                      <Text
                        className="text-base font-bold text-gray-900 mb-1"
                        numberOfLines={1}
                      >
                        {place.name}
                      </Text>
                      <View className="flex-row items-center">
                        <Ionicons name="location" size={12} color="#6B7280" />
                        <Text
                          className="text-xs text-gray-600 ml-1 flex-1"
                          numberOfLines={1}
                        >
                          {place.address.split(",")[0]}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Recent Check-ins */}
        <View className="px-5 pt-2">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Recent Check-ins
          </Text>

          {recentCheckIns.length === 0 ? (
            <View className="bg-gray-50 rounded-xl p-6 items-center">
              <Ionicons name="location-outline" size={32} color="#9CA3AF" />
              <Text className="text-gray-500 text-center mt-2">
                No check-ins yet
              </Text>
              <Text className="text-gray-400 text-sm text-center mt-1">
                Visit places and check in to track your adventures
              </Text>
            </View>
          ) : (
            recentCheckIns.map((checkIn) => {
              const place = places.find((p) => p.id === checkIn.placeId);
              return (
                <Pressable
                  key={checkIn.id}
                  onPress={() => {
                    if (place) {
                      navigation.navigate("PlaceDetail", {
                        placeId: place.id,
                      });
                    }
                  }}
                  className="flex-row items-center mb-4 bg-white rounded-xl p-4 shadow-sm"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  {place && (
                    <Image
                      source={{ uri: place.images[0] }}
                      className="w-14 h-14 rounded-lg"
                      resizeMode="cover"
                    />
                  )}
                  <View className="flex-1 ml-3">
                    <Text className="text-base font-semibold text-gray-900 mb-1">
                      {checkIn.placeName}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {format(new Date(checkIn.timestamp), "MMM d, yyyy 'at' h:mm a")}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
