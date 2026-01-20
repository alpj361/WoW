import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface WebViewportProps {
  children: React.ReactNode;
}

export const WebViewport: React.FC<WebViewportProps> = ({ children }) => {
  // No usar hooks - simplemente renderizar children directamente en web
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  // En web, simplemente envolver en un contenedor sin hooks
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
    backgroundColor: '#0F0F0F',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  mobileViewport: {
    flex: 1,
    width: '100%',
    maxWidth: 428, // iPhone 14 Pro Max width
    backgroundColor: '#0F0F0F',
    overflow: 'hidden',
  },
});
