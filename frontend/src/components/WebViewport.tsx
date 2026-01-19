import React from 'react';
import { View, StyleSheet, Platform, Dimensions, ScrollView } from 'react-native';

interface WebViewportProps {
  children: React.ReactNode;
}

const { width, height } = Dimensions.get('window');

export const WebViewport: React.FC<WebViewportProps> = ({ children }) => {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  // En web, simular viewport móvil
  return (
    <View style={styles.webContainer}>
      <View style={styles.mobileViewport}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileViewport: {
    width: 390, // iPhone 14 Pro width
    height: height > 844 ? 844 : height, // iPhone 14 Pro height max
    maxHeight: '95vh',
    backgroundColor: '#0F0F0F',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    // @ts-ignore - web only
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
});
