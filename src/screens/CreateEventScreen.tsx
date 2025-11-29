import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { useEventsStore } from "../state/eventsStore";
import { usePlacesStore } from "../state/placesStore";
import { RootStackParamList } from "../navigation/RootNavigator";

type RouteParams = RouteProp<RootStackParamList, "CreateEvent">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CreateEventScreen() {
  const route = useRoute<RouteParams>();
  const navigation = useNavigation<NavigationProp>();
  const addEvent = useEventsStore((s) => s.addEvent);
  const places = usePlacesStore((s) => s.places);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState(
    route.params?.placeId || places[0]?.id || ""
  );
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const selectedPlace = places.find((p) => p.id === selectedPlaceId);

  const handleSubmit = () => {
    if (!name.trim() || !description.trim() || !selectedPlaceId || !time.trim()) {
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newEvent = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      placeId: selectedPlaceId,
      placeName: selectedPlace?.name || "",
      date: date,
      time: time.trim(),
      attendees: 0,
      isUserAttending: false,
      images: selectedPlace?.images || [
        "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800",
      ],
      tags: [],
    };

    addEvent(newEvent);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-5 pt-6">
          {/* Event Name */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Event Name *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Coffee Tasting Workshop"
              className="bg-gray-50 rounded-xl px-4 py-3.5 text-base text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Description *
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Tell people about this event..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-gray-50 rounded-xl px-4 py-3.5 text-base text-gray-900 min-h-[100px]"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Select Place */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Location *
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            >
              {places.map((place) => (
                <Pressable
                  key={place.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPlaceId(place.id);
                  }}
                  className={`rounded-xl p-4 min-w-[200px] ${
                    selectedPlaceId === place.id
                      ? "bg-indigo-600"
                      : "bg-gray-50"
                  }`}
                >
                  <Text
                    className={`text-base font-bold mb-1 ${
                      selectedPlaceId === place.id
                        ? "text-white"
                        : "text-gray-900"
                    }`}
                    numberOfLines={1}
                  >
                    {place.name}
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons
                      name="location"
                      size={12}
                      color={selectedPlaceId === place.id ? "white" : "#6B7280"}
                    />
                    <Text
                      className={`text-xs ml-1 ${
                        selectedPlaceId === place.id
                          ? "text-white/90"
                          : "text-gray-600"
                      }`}
                      numberOfLines={1}
                    >
                      {place.address.split(",")[0]}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Date */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Date *
            </Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              className="bg-gray-50 rounded-xl px-4 py-3.5 flex-row items-center justify-between"
            >
              <Text className="text-base text-gray-900">
                {date.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
              <Ionicons name="calendar" size={20} color="#6B7280" />
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setDate(selectedDate);
                  }
                }}
                minimumDate={new Date()}
              />
            )}
          </View>

          {/* Time */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Time *
            </Text>
            <TextInput
              value={time}
              onChangeText={setTime}
              placeholder="e.g. 3:00 PM"
              className="bg-gray-50 rounded-xl px-4 py-3.5 text-base text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={
              !name.trim() ||
              !description.trim() ||
              !selectedPlaceId ||
              !time.trim()
            }
            className={`rounded-full py-4 flex-row items-center justify-center ${
              name.trim() &&
              description.trim() &&
              selectedPlaceId &&
              time.trim()
                ? "bg-indigo-600"
                : "bg-gray-300"
            }`}
          >
            <Ionicons name="calendar" size={24} color="white" />
            <Text className="text-white text-lg font-bold ml-2">
              Create Event
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
