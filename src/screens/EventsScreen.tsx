import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useEventsStore } from "../state/eventsStore";
import { usePlacesStore } from "../state/placesStore";
import { RootStackParamList } from "../navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const events = useEventsStore((s) => s.events);
  const toggleAttendance = useEventsStore((s) => s.toggleAttendance);
  const places = usePlacesStore((s) => s.places);

  const upcomingEvents = events
    .filter((event) => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-gray-100"
      >
        <View className="px-5 py-4 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900">Events</Text>
          <Pressable
            onPress={() => navigation.navigate("CreateEvent", {})}
            className="rounded-full px-4 py-2.5 flex-row items-center"
            style={{ backgroundColor: "#0A2472" }}
          >
            <Ionicons name="add" size={18} color="white" />
            <Text className="text-white font-semibold ml-1 text-sm">
              Create
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Upcoming Events Section */}
        <View className="px-5 pt-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Upcoming Events
          </Text>

          {upcomingEvents.length === 0 ? (
            <View className="items-center py-12">
              <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
              </View>
              <Text className="text-gray-500 text-center text-base mb-2">
                No upcoming events
              </Text>
              <Text className="text-gray-400 text-center text-sm">
                Create an event or check back later
              </Text>
            </View>
          ) : (
            upcomingEvents.map((event) => {
              const place = places.find((p) => p.id === event.placeId);
              return (
                <Pressable
                  key={event.id}
                  className="mb-4 rounded-2xl overflow-hidden bg-white shadow-sm"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  {/* Event Image */}
                  <Image
                    source={{ uri: event.images[0] }}
                    className="w-full h-48"
                    resizeMode="cover"
                  />

                  {/* Event Info */}
                  <View className="p-4">
                    {/* Date Badge */}
                    <View className="flex-row items-center mb-2">
                      <View className="rounded-lg px-3 py-2 mr-3" style={{ backgroundColor: "#E8EAF6" }}>
                        <Text className="text-2xl font-bold" style={{ color: "#0A2472" }}>
                          {format(new Date(event.date), "dd")}
                        </Text>
                        <Text className="text-xs font-semibold uppercase" style={{ color: "#0A2472" }}>
                          {format(new Date(event.date), "MMM")}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-xl font-bold text-gray-900 mb-1">
                          {event.name}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          {event.time}
                        </Text>
                      </View>
                    </View>

                    {/* Location */}
                    <Pressable
                      onPress={() => {
                        if (place) {
                          navigation.navigate("PlaceDetail", {
                            placeId: place.id,
                          });
                        }
                      }}
                      className="flex-row items-center mb-3"
                    >
                      <Ionicons name="location" size={16} color="#6B7280" />
                      <Text className="text-sm text-gray-600 ml-1 flex-1">
                        {event.placeName}
                      </Text>
                      {place && (
                        <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                      )}
                    </Pressable>

                    {/* Description */}
                    <Text className="text-gray-700 mb-4 leading-5">
                      {event.description}
                    </Text>

                    {/* Attendees & RSVP */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Ionicons name="people" size={18} color="#6B7280" />
                        <Text className="text-sm text-gray-600 ml-1">
                          {event.attendees} attending
                          {event.maxAttendees && ` / ${event.maxAttendees}`}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => toggleAttendance(event.id)}
                        className="px-5 py-2.5 rounded-full"
                        style={{
                          backgroundColor: event.isUserAttending ? "#F3F4F6" : "#0A2472"
                        }}
                      >
                        <Text
                          className={`font-semibold ${
                            event.isUserAttending
                              ? "text-gray-700"
                              : "text-white"
                          }`}
                        >
                          {event.isUserAttending ? "Cancel" : "Join"}
                        </Text>
                      </Pressable>
                    </View>

                    {/* Tags */}
                    {event.tags && event.tags.length > 0 && (
                      <View className="flex-row flex-wrap mt-3 gap-2">
                        {event.tags.map((tag, idx) => (
                          <View
                            key={idx}
                            className="bg-gray-100 rounded-full px-3 py-1"
                          >
                            <Text className="text-xs font-medium text-gray-700">
                              #{tag}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
