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
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { usePlacesStore } from "../state/placesStore";
import { useUserStore } from "../state/userStore";
import { RootStackParamList } from "../navigation/RootNavigator";
import { PlaceCategory } from "../types/place";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES: { id: PlaceCategory; label: string; icon: string }[] = [
  { id: "coffee", label: "Coffee Shop", icon: "cafe" },
  { id: "coworking", label: "Coworking", icon: "briefcase" },
  { id: "restaurant", label: "Restaurant", icon: "restaurant" },
  { id: "bar", label: "Bar", icon: "wine" },
];

export default function AddPlaceScreen() {
  const navigation = useNavigation<NavigationProp>();
  const addPlace = usePlacesStore((s) => s.addPlace);
  const profile = useUserStore((s) => s.profile);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<PlaceCategory>("coffee");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [hours, setHours] = useState("");
  const [contact, setContact] = useState("");
  const [instagram, setInstagram] = useState("");

  const handleSubmit = () => {
    if (!name.trim() || !description.trim() || !address.trim()) {
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newPlace = {
      id: Date.now().toString(),
      name: name.trim(),
      category,
      description: description.trim(),
      address: address.trim(),
      latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
      longitude: -73.9352 + (Math.random() - 0.5) * 0.1,
      hours: hours.trim(),
      contact: contact.trim(),
      images: ["https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800"],
      rating: undefined,
      priceLevel: "$$" as const,
      features: [],
      primaryColor: "#0A2472",
      createdBy: profile.id,
      checkInCount: 0,
      isFavorite: false,
      instagramHandle: instagram.trim().replace('@', ''),
    };

    addPlace(newPlace);
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
          {/* Name */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Place Name *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Coffee Haven"
              className="bg-gray-50 rounded-xl px-4 py-3.5 text-base text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Category */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Category *
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCategory(cat.id);
                  }}
                  className="flex-1 min-w-[45%] rounded-xl py-4 px-3 flex-row items-center justify-center"
                  style={{
                    backgroundColor: category === cat.id ? "#0A2472" : "#F9FAFB"
                  }}
                >
                  <Ionicons
                    name={cat.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={category === cat.id ? "white" : "#6B7280"}
                  />
                  <Text
                    className={`ml-2 font-semibold ${
                      category === cat.id ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Description *
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Tell us about this place..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-gray-50 rounded-xl px-4 py-3.5 text-base text-gray-900 min-h-[100px]"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Address */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Address *
            </Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Street address, City, State"
              className="bg-gray-50 rounded-xl px-4 py-3.5 text-base text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Hours */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Hours (Optional)
            </Text>
            <TextInput
              value={hours}
              onChangeText={setHours}
              placeholder="e.g. 7 AM - 8 PM"
              className="bg-gray-50 rounded-xl px-4 py-3.5 text-base text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Contact */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Contact (Optional)
            </Text>
            <TextInput
              value={contact}
              onChangeText={setContact}
              placeholder="Phone number"
              keyboardType="phone-pad"
              className="bg-gray-50 rounded-xl px-4 py-3.5 text-base text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Instagram Handle */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Instagram (Optional)
            </Text>
            <TextInput
              value={instagram}
              onChangeText={setInstagram}
              placeholder="@username"
              autoCapitalize="none"
              className="bg-gray-50 rounded-xl px-4 py-3.5 text-base text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={!name.trim() || !description.trim() || !address.trim()}
            className="rounded-full py-4 flex-row items-center justify-center"
            style={{
              backgroundColor: name.trim() && description.trim() && address.trim()
                ? "#0A2472"
                : "#D1D5DB"
            }}
          >
            <Ionicons
              name="checkmark-circle"
              size={24}
              color="white"
            />
            <Text className="text-white text-lg font-bold ml-2">
              Add Place
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
