import React from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';

interface WebViewportProps {
  children: React.ReactNode;
}

export const WebViewport: React.FC<WebViewportProps> = ({ children }) => {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  // En web, simular viewport móvil
  const { height: windowHeight } = Dimensions.get('window');

  // Calcular altura máxima: 95% de la ventana o 844px (iPhone 14 Pro)
  const maxHeight = Math.min(windowHeight * 0.95, 844);

  return (
    <View style={styles.webContainer}>
      <View
        style={[
          styles.mobileViewport,
          { height: maxHeight },
          // @ts-ignore - web only style
          Platform.OS === 'web' && { boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }
        ]}
      >
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
    backgroundColor: '#0F0F0F',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20, // Android shadow
  },
});
