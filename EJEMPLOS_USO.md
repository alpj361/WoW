# 📱 Ejemplos de Uso del Backend

Guía práctica de cómo usar las APIs en tu app React Native.

---

## 🗺️ Buscar Lugares (Outscraper)

### Ejemplo 1: Buscar cafeterías en Guatemala City

```typescript
import { fetchPlaces } from '../api/backendService';

const buscarCafeterias = async () => {
  try {
    const result = await fetchPlaces({
      category: 'coffee',
      location: 'Guatemala City, Guatemala',
      limit: 20
    });
    
    console.log(`Encontrados: ${result.places.length} lugares`);
    console.log(`Desde cache: ${result.cached}`);
    
    result.places.forEach(place => {
      console.log(`${place.name} - ${place.rating}⭐`);
    });
    
    return result.places;
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Ejemplo 2: Buscar restaurantes cerca de una ubicación

```typescript
const buscarRestaurantes = async (ciudad: string) => {
  const result = await fetchPlaces({
    category: 'restaurant',
    location: `${ciudad}, Guatemala`,
    limit: 15
  });
  
  return result.places;
};

// Uso:
const restaurantes = await buscarRestaurantes('Antigua Guatemala');
```

### Ejemplo 3: Búsqueda libre con query

```typescript
const buscarLugar = async (busqueda: string) => {
  const result = await fetchPlaces({
    query: busqueda,
    location: 'Guatemala',
    limit: 10
  });
  
  return result.places;
};

// Ejemplos de búsqueda:
await buscarLugar('pizza italiana');
await buscarLugar('gimnasio crossfit');
await buscarLugar('hotel boutique antigua');
```

---

## 📅 Buscar Eventos (Exa)

### Ejemplo 1: Eventos culturales en Guatemala

```typescript
import { fetchEvents } from '../api/backendService';

const buscarEventosCulturales = async () => {
  try {
    const result = await fetchEvents({
      location: 'Guatemala',
      category: 'cultura',
      limit: 10
    });
    
    console.log(`Eventos encontrados: ${result.events.length}`);
    
    result.events.forEach(event => {
      console.log(`${event.name} - ${event.date}`);
      console.log(`  📍 ${event.location}`);
      console.log(`  🔗 ${event.url}`);
    });
    
    return result.events;
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Ejemplo 2: Filtrar por categoría

```typescript
const buscarEventosPorCategoria = async (categoria: string) => {
  // Categorías disponibles: 'eventos', 'cultura', 'deportes', 'música', 'arte', 'comida'
  
  const result = await fetchEvents({
    location: 'Guatemala City',
    category: categoria,
    limit: 15
  });
  
  return result.events;
};

// Uso:
const conciertos = await buscarEventosPorCategoria('música');
const deportes = await buscarEventosPorCategoria('deportes');
const festivales = await buscarEventosPorCategoria('comida');
```

### Ejemplo 3: Eventos en una ciudad específica

```typescript
const buscarEventosEnCiudad = async (ciudad: string) => {
  const result = await fetchEvents({
    location: ciudad,
    category: 'eventos',
    limit: 20
  });
  
  // Filtrar eventos próximos (próximos 30 días)
  const hoy = new Date();
  const en30dias = new Date();
  en30dias.setDate(hoy.getDate() + 30);
  
  const eventosProximos = result.events.filter(evento => {
    const fechaEvento = new Date(evento.date);
    return fechaEvento >= hoy && fechaEvento <= en30dias;
  });
  
  return eventosProximos;
};
```

---

## 🇬🇹 Scraping de Guatemala.com (Supadata)

### Ejemplo 1: Obtener eventos de Guatemala.com

```typescript
import { fetchGuatemalaData } from '../api/backendService';

const obtenerEventosGuatemala = async () => {
  try {
    const result = await fetchGuatemalaData({
      type: 'events',
      limit: 10
    });
    
    console.log(`Eventos de Guatemala.com: ${result.data.length}`);
    
    result.data.forEach(evento => {
      console.log(`${evento.name}`);
      console.log(`  📅 ${evento.date}`);
      console.log(`  📝 ${evento.description}`);
    });
    
    return result.data;
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Ejemplo 2: Obtener noticias culturales

```typescript
const obtenerNoticiasCulturales = async () => {
  const result = await fetchGuatemalaData({
    type: 'news',
    limit: 15
  });
  
  return result.data;
};
```

### Ejemplo 3: Obtener lugares recomendados

```typescript
const obtenerLugaresRecomendados = async () => {
  const result = await fetchGuatemalaData({
    type: 'places',
    limit: 10
  });
  
  return result.data;
};
```

---

## 🔄 Uso Combinado

### Ejemplo: Pantalla completa con todos los datos

```typescript
import { useState, useEffect } from 'react';
import { fetchPlaces, fetchEvents, fetchGuatemalaData } from '../api/backendService';

const DiscoverScreen = () => {
  const [lugares, setLugares] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    cargarDatos();
  }, []);
  
  const cargarDatos = async () => {
    setLoading(true);
    
    try {
      // Cargar lugares de diferentes categorías
      const [cafes, restaurantes, hoteles] = await Promise.all([
        fetchPlaces({ category: 'coffee', location: 'Guatemala', limit: 5 }),
        fetchPlaces({ category: 'restaurant', location: 'Guatemala', limit: 5 }),
        fetchPlaces({ category: 'hotel', location: 'Guatemala', limit: 5 })
      ]);
      
      const todosLugares = [
        ...cafes.places,
        ...restaurantes.places,
        ...hoteles.places
      ];
      
      setLugares(todosLugares);
      
      // Cargar eventos
      const eventosResult = await fetchEvents({
        location: 'Guatemala',
        category: 'cultura',
        limit: 10
      });
      
      setEventos(eventosResult.events);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    // Tu UI aquí
  );
};
```

---

## 🎯 Buenas Prácticas

### 1. Manejo de Errores

```typescript
const buscarConErrorHandling = async () => {
  try {
    const result = await fetchPlaces({
      category: 'coffee',
      location: 'Guatemala City',
      limit: 20
    });
    
    if (result.places.length === 0) {
      Alert.alert('Sin resultados', 'No se encontraron lugares');
      return [];
    }
    
    return result.places;
    
  } catch (error) {
    if (error.message.includes('Backend no disponible')) {
      Alert.alert(
        'Error de Conexión',
        'No se puede conectar con el servidor. Verifica tu conexión a internet.'
      );
    } else if (error.message.includes('API key')) {
      Alert.alert(
        'Error de Configuración',
        'Las APIs no están configuradas correctamente.'
      );
    } else {
      Alert.alert('Error', error.message);
    }
    
    return [];
  }
};
```

### 2. Loading States

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [data, setData] = useState([]);

const cargarDatos = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const result = await fetchPlaces({
      category: 'coffee',
      location: 'Guatemala',
      limit: 20
    });
    setData(result.places);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

// En tu render:
{loading && <ActivityIndicator />}
{error && <Text>Error: {error}</Text>}
{data.map(item => <Item key={item.id} {...item} />)}
```

### 3. Refresh y Pull-to-Refresh

```typescript
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  await cargarDatos();
  setRefreshing(false);
};

// En FlatList:
<FlatList
  data={lugares}
  renderItem={renderItem}
  refreshing={refreshing}
  onRefresh={onRefresh}
/>
```

### 4. Cache Local con AsyncStorage

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const buscarConCache = async (categoria: string, ubicacion: string) => {
  const cacheKey = `places_${categoria}_${ubicacion}`;
  
  try {
    // Intentar cargar desde cache local
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const edad = Date.now() - timestamp;
      
      // Si tiene menos de 10 minutos, usar cache
      if (edad < 10 * 60 * 1000) {
        console.log('Usando cache local');
        return data;
      }
    }
    
    // Si no hay cache o está viejo, buscar en API
    const result = await fetchPlaces({
      category: categoria,
      location: ubicacion,
      limit: 20
    });
    
    // Guardar en cache
    await AsyncStorage.setItem(cacheKey, JSON.stringify({
      data: result.places,
      timestamp: Date.now()
    }));
    
    return result.places;
    
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
};
```

### 5. Búsqueda con Debounce

```typescript
import { useState, useEffect } from 'react';

const SearchScreen = () => {
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState([]);
  
  useEffect(() => {
    // Debounce: esperar 500ms después de que el usuario deje de escribir
    const timer = setTimeout(() => {
      if (searchText.length >= 3) {
        buscar(searchText);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchText]);
  
  const buscar = async (texto: string) => {
    const result = await fetchPlaces({
      query: texto,
      location: 'Guatemala',
      limit: 10
    });
    setResults(result.places);
  };
  
  return (
    <TextInput
      value={searchText}
      onChangeText={setSearchText}
      placeholder="Buscar lugares..."
    />
  );
};
```

---

## 🔍 Testing y Debugging

### Verificar conexión al backend

```typescript
import { checkHealth, getApiUrl } from '../api/backendService';

const verificarBackend = async () => {
  console.log('API URL:', getApiUrl());
  
  const health = await checkHealth();
  
  if (health && health.status === 'ok') {
    console.log('✅ Backend conectado');
    console.log('APIs configuradas:', health.apis);
  } else {
    console.log('❌ Backend no disponible');
  }
};
```

### Log de requests

```typescript
const buscarConLogs = async () => {
  console.log('🔍 Iniciando búsqueda...');
  const inicio = Date.now();
  
  const result = await fetchPlaces({
    category: 'coffee',
    location: 'Guatemala City',
    limit: 10
  });
  
  const duracion = Date.now() - inicio;
  console.log(`✅ Búsqueda completada en ${duracion}ms`);
  console.log(`📊 Resultados: ${result.places.length}`);
  console.log(`💾 Cache: ${result.cached ? 'Sí' : 'No'}`);
  
  return result.places;
};
```

---

## 📝 Notas Finales

- **Cache del Backend**: El backend ya tiene cache automático de 1 hora
- **Rate Limiting**: Ten cuidado con no hacer demasiadas requests
- **Geolocalización**: Usa la ubicación del usuario cuando sea posible
- **Offline**: Considera guardar los últimos resultados para modo offline
- **Testing**: Prueba primero con `curl` antes de implementar en la app

¡Listo para usar! 🚀
