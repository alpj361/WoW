import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';

interface WebViewportProps {
  children: React.ReactNode;
}

export const WebViewport: React.FC<WebViewportProps> = ({ children }) => {
  // IMPORTANTE: Hooks deben llamarse ANTES de cualquier return condicional
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  // En pantallas anchas, simular viewport móvil; en móviles, usar ancho completo
  const viewportWidth = windowWidth > 600 ? 390 : windowWidth;
  const shouldSimulateMobile = windowWidth > 600;

  // Usar 95% de la altura para dejar espacio a la barra del navegador
  // Máximo 844px (iPhone 14 Pro height) en desktop
  const viewportHeight = windowHeight > 0
    ? Math.min(windowHeight * 0.95, shouldSimulateMobile ? 844 : windowHeight * 0.95)
    : 844;

  return (
    <View style={styles.webContainer}>
      <View
        style={[
          styles.mobileViewport,
          {
            width: viewportWidth,
            height: viewportHeight,
            borderRadius: shouldSimulateMobile ? 20 : 0,
          },
          // @ts-ignore - web only style
          shouldSimulateMobile && { boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }
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
    justifyContent: 'flex-start',
  },
  mobileViewport: {
    backgroundColor: '#0F0F0F',
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
