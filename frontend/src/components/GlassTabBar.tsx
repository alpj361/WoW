import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TabItemProps {
  route: any;
  index: number;
  state: any;
  descriptors: any;
  navigation: any;
}

const TabItem: React.FC<TabItemProps> = ({ route, index, state, descriptors, navigation }) => {
  const { options } = descriptors[route.key];
  const isFocused = state.index === index;

  const onPress = () => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  const iconName = getIconName(route.name, isFocused);
  const color = isFocused ? '#8B5CF6' : 'rgba(255, 255, 255, 0.5)';

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarTestID}
      onPress={onPress}
      style={styles.tabItem}
      activeOpacity={0.7}
    >
      {/* Glow effect behind active icon */}
      {isFocused && (
        <View style={styles.glowContainer}>
          <View style={styles.glow} />
        </View>
      )}
      <Ionicons name={iconName as any} size={24} color={color} />
      <Text style={[styles.label, { color }]}>
        {options.title || route.name}
      </Text>
    </TouchableOpacity>
  );
};

function getIconName(routeName: string, focused: boolean): string {
  const icons: Record<string, { active: string; inactive: string }> = {
    index: { active: 'compass', inactive: 'compass-outline' },
    create: { active: 'add-circle', inactive: 'add-circle-outline' },
    places: { active: 'globe', inactive: 'globe-outline' },
    extractions: { active: 'cloud-download', inactive: 'cloud-download-outline' },
    myevents: { active: 'bookmark', inactive: 'bookmark-outline' },
    profile: { active: 'person', inactive: 'person-outline' },
  };

  const icon = icons[routeName];
  if (!icon) return 'ellipse';
  return focused ? icon.active : icon.inactive;
}

export const GlassTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  // Filter out hidden routes - only show main 5 tabs
  const mainRoutes = ['index', 'create', 'places', 'myevents', 'profile'];
  const visibleRoutes = state.routes.filter(route => mainRoutes.includes(route.name));

  const content = (
    <>
      {/* Glass overlay for extra effect */}
      <View style={styles.glassOverlay} />

      {/* Top border glow */}
      <View style={styles.topBorder} />

      {/* Tab items */}
      <View style={styles.tabsContainer}>
        {visibleRoutes.map((route) => {
          // Find the actual index in state.routes
          const actualIndex = state.routes.findIndex(r => r.key === route.key);
          return (
            <TabItem
              key={route.key}
              route={route}
              index={actualIndex}
              state={state}
              descriptors={descriptors}
              navigation={navigation}
            />
          );
        })}
      </View>
    </>
  );

  // Use BlurView on native, fallback on web
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, styles.webFallback, { paddingBottom: insets.bottom }]}>
        {content}
      </View>
    );
  }

  return (
    <View style={[styles.containerWrapper, { paddingBottom: insets.bottom }]}>
      <BlurView
        intensity={50}
        tint="dark"
        style={styles.blurContainer}
      >
        {content}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  containerWrapper: {
    backgroundColor: 'transparent',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  webFallback: {
    backgroundColor: 'rgba(15, 15, 25, 0.75)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.15)',
    boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.3)',
  } as any,
  blurContainer: {
    overflow: 'hidden',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 30, 40, 0.5)',
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.4)',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  glowContainer: {
    position: 'absolute',
    top: 0,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8B5CF6',
    opacity: 0.25,
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default GlassTabBar;
