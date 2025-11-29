import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkHealth, fetchPlaces, getApiUrl } from '../api/backendService';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [location, setLocation] = useState('Guatemala City, Guatemala');
  const [apiUrl, setApiUrl] = useState(getApiUrl());
  const [backendStatus, setBackendStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadSettings();
    testBackend();
  }, []);

  const loadSettings = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem('default_location');
      if (savedLocation) {
        setLocation(savedLocation);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveLocation = async () => {
    try {
      await AsyncStorage.setItem('default_location', location);
      Alert.alert('¡Guardado!', 'Ubicación predeterminada actualizada');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la ubicación');
    }
  };

  const testBackend = async () => {
    setLoading(true);
    try {
      const health = await checkHealth();
      setBackendStatus(health);
    } catch (error) {
      setBackendStatus({ status: 'error', message: 'Backend no disponible' });
    } finally {
      setLoading(false);
    }
  };

  const testPlacesAPI = async () => {
    setTesting(true);
    try {
      const result = await fetchPlaces({
        query: 'coffee',
        location: 'Guatemala City',
        limit: 5,
      });
      Alert.alert(
        '¡Éxito!',
        `Se encontraron ${result.places.length} lugares. ${result.cached ? '(Cache)' : '(API)'}`
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo conectar con el backend');
    } finally {
      setTesting(false);
    }
  };

  const clearCache = async () => {
    Alert.alert(
      'Limpiar Cache',
      'Esto borrará todos los datos en cache del backend. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: () => {
            // The backend handles cache automatically
            Alert.alert('Info', 'El cache se limpia automáticamente en el backend');
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top, backgroundColor: '#0A2472' }}
        className="pb-6"
      >
        <View className="px-5 py-4">
          <Text className="text-2xl font-bold text-white">Configuración</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Backend Status */}
        <View className="px-5 pt-6">
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold" style={{ color: '#0A2472' }}>
                Estado del Backend
              </Text>
              <Pressable
                onPress={testBackend}
                disabled={loading}
                className="px-3 py-1.5 rounded-full"
                style={{ backgroundColor: '#E8EAF6' }}
              >
                <Text className="text-xs font-semibold" style={{ color: '#0A2472' }}>
                  {loading ? 'Probando...' : 'Probar'}
                </Text>
              </Pressable>
            </View>

            {loading ? (
              <ActivityIndicator size="small" color="#0A2472" />
            ) : backendStatus ? (
              <View>
                <View className="flex-row items-center mb-2">
                  <Ionicons
                    name={backendStatus.status === 'ok' ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={backendStatus.status === 'ok' ? '#10B981' : '#EF4444'}
                  />
                  <Text className="ml-2 text-gray-700">
                    {backendStatus.status === 'ok' ? 'Conectado' : 'Desconectado'}
                  </Text>
                </View>
                <Text className="text-xs text-gray-500 mb-2">URL: {apiUrl}</Text>
                {backendStatus.apis && (
                  <View className="mt-3 pt-3 border-t border-gray-100">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">APIs:</Text>
                    <View className="space-y-1">
                      <View className="flex-row items-center">
                        <View
                          className="w-2 h-2 rounded-full mr-2"
                          style={{
                            backgroundColor: backendStatus.apis.outscraper ? '#10B981' : '#EF4444',
                          }}
                        />
                        <Text className="text-xs text-gray-600">Outscraper</Text>
                      </View>
                      <View className="flex-row items-center">
                        <View
                          className="w-2 h-2 rounded-full mr-2"
                          style={{
                            backgroundColor: backendStatus.apis.exa ? '#10B981' : '#EF4444',
                          }}
                        />
                        <Text className="text-xs text-gray-600">Exa Search</Text>
                      </View>
                      <View className="flex-row items-center">
                        <View
                          className="w-2 h-2 rounded-full mr-2"
                          style={{
                            backgroundColor: backendStatus.apis.supadata ? '#10B981' : '#EF4444',
                          }}
                        />
                        <Text className="text-xs text-gray-600">Supadata</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <Text className="text-gray-500 text-sm">No hay información disponible</Text>
            )}
          </View>

          {/* Location Settings */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <Text className="text-lg font-bold mb-3" style={{ color: '#0A2472' }}>
              Ubicación Predeterminada
            </Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Ciudad, País"
              className="bg-gray-50 rounded-xl px-4 py-3.5 text-base text-gray-900 mb-3"
              placeholderTextColor="#9CA3AF"
            />
            <Pressable
              onPress={saveLocation}
              className="rounded-full py-3 items-center"
              style={{ backgroundColor: '#0A2472' }}
            >
              <Text className="text-white font-semibold">Guardar Ubicación</Text>
            </Pressable>
          </View>

          {/* Test Actions */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <Text className="text-lg font-bold mb-3" style={{ color: '#0A2472' }}>
              Pruebas
            </Text>

            <Pressable
              onPress={testPlacesAPI}
              disabled={testing}
              className="rounded-xl py-3 px-4 mb-3 flex-row items-center justify-between"
              style={{ backgroundColor: '#E8EAF6' }}
            >
              <View className="flex-row items-center">
                <Ionicons name="map" size={20} color="#0A2472" />
                <Text className="ml-2 font-semibold" style={{ color: '#0A2472' }}>
                  Probar API de Lugares
                </Text>
              </View>
              {testing && <ActivityIndicator size="small" color="#0A2472" />}
            </Pressable>

            <Pressable
              onPress={clearCache}
              className="rounded-xl py-3 px-4 flex-row items-center"
              style={{ backgroundColor: '#FEF2F2' }}
            >
              <Ionicons name="trash" size={20} color="#EF4444" />
              <Text className="ml-2 font-semibold" style={{ color: '#EF4444' }}>
                Limpiar Cache
              </Text>
            </Pressable>
          </View>

          {/* Instructions */}
          <View className="bg-blue-50 rounded-2xl p-5">
            <View className="flex-row items-start mb-2">
              <Ionicons name="information-circle" size={24} color="#0A2472" />
              <Text className="ml-2 text-sm font-bold" style={{ color: '#0A2472' }}>
                Configuración del Backend
              </Text>
            </View>
            <Text className="text-xs text-gray-600 leading-5">
              Para usar el backend PHP:{"\n"}
              1. Configura las API keys en backend-php/.env{"\n"}
              2. Inicia el servidor: php -S localhost:8000{"\n"}
              3. Actualiza la URL en backendService.ts si es necesario
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
