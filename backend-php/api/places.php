<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../utils/cache.php';
require_once __DIR__ . '/../utils/http.php';
require_once __DIR__ . '/../utils/response.php';

/**
 * Google Maps Places API using Outscraper
 * 
 * GET /api/places?query=coffee&location=Guatemala&category=cafe
 */

try {
    // Get parameters
    $query = $_GET['query'] ?? '';
    $location = $_GET['location'] ?? 'Guatemala City, Guatemala';
    $category = $_GET['category'] ?? 'all';
    $limit = min(intval($_GET['limit'] ?? 20), MAX_RESULTS);
    
    if (empty($query) && $category === 'all') {
        Response::error('Query or category is required', 400);
    }
    
    // Build search query
    $searchQuery = $query ?: getCategoryQuery($category);
    $searchQuery .= ' in ' . $location;
    
    // Check cache
    $cache = new Cache();
    $cacheKey = 'places_' . md5($searchQuery . $limit);
    $cachedData = $cache->get($cacheKey);
    
    if ($cachedData) {
        Response::cached($cachedData, true);
    }
    
    // Make API request to Outscraper
    if (!OUTSCRAPER_API_KEY || OUTSCRAPER_API_KEY === 'your_outscraper_api_key_here') {
        // Return mock data if Outscraper not configured
        $mockPlaces = getMockPlaces($category, $limit);
        Response::success($mockPlaces);
    }
    
    $url = 'https://api.app.outscraper.com/maps/search-v3?' . http_build_query([
        'query' => $searchQuery,
        'limit' => $limit,
        'language' => DEFAULT_LANGUAGE,
        'region' => 'gt'
    ]);
    
    $response = HttpClient::get($url, [
        'X-API-KEY: ' . OUTSCRAPER_API_KEY
    ]);
    
    if ($response['status'] !== 200) {
        Response::error('Failed to fetch places from Outscraper', 500, $response['body']);
    }
    
    $places = parsePlaces($response['data'], $category);
    
    // Cache results
    $cache->set($cacheKey, $places);
    
    Response::success($places);
    
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}

function getCategoryQuery($category) {
    $queries = [
        'coffee' => 'cafeterías coffee shops',
        'restaurant' => 'restaurantes',
        'bar' => 'bares pubs',
        'coworking' => 'espacios coworking oficinas',
        'gym' => 'gimnasios fitness',
        'hotel' => 'hoteles hospedaje',
        'shopping' => 'tiendas centros comerciales'
    ];
    
    return $queries[$category] ?? $category;
}

function parsePlaces($data, $category) {
    $places = [];
    
    if (!isset($data['data']) || !is_array($data['data'])) {
        return $places;
    }
    
    foreach ($data['data'] as $item) {
        if (!is_array($item)) continue;
        
        // Get first result from each query
        $results = is_array($item) ? $item : [$item];
        
        foreach ($results as $place) {
            if (!isset($place['name'])) continue;
            
            $places[] = [
                'id' => $place['place_id'] ?? uniqid(),
                'name' => $place['name'] ?? 'Unknown',
                'category' => $category,
                'description' => $place['description'] ?? ($place['type'] ?? 'No description available'),
                'address' => $place['full_address'] ?? ($place['address'] ?? 'Address not available'),
                'latitude' => floatval($place['latitude'] ?? 0),
                'longitude' => floatval($place['longitude'] ?? 0),
                'hours' => $place['working_hours'] ?? null,
                'contact' => $place['phone'] ?? null,
                'website' => $place['site'] ?? null,
                'images' => isset($place['photos_data']) ? array_slice(array_column($place['photos_data'], 'photo_url'), 0, 5) : [],
                'rating' => floatval($place['rating'] ?? 0),
                'reviews_count' => intval($place['reviews'] ?? 0),
                'priceLevel' => getPriceLevel($place['price_level'] ?? null),
                'features' => array_filter([
                    $place['type'] ?? null,
                    isset($place['features']) ? implode(', ', array_slice($place['features'], 0, 3)) : null
                ]),
                'primaryColor' => getCategoryColor($category),
                'checkInCount' => rand(50, 500),
                'isFavorite' => false,
                'googleMapsUrl' => $place['google_maps_url'] ?? null
            ];
        }
    }
    
    return $places;
}

function getPriceLevel($level) {
    if (!$level) return '$$';
    $map = ['$', '$$', '$$$', '$$$$'];
    return $map[min($level - 1, 3)] ?? '$$';
}

function getCategoryColor($category) {
    $colors = [
        'coffee' => '#0A2472',
        'restaurant' => '#1E3A8A',
        'bar' => '#0A2472',
        'coworking' => '#1E3A8A',
        'gym' => '#0A2472',
        'hotel' => '#1E3A8A',
        'shopping' => '#0A2472'
    ];
    return $colors[$category] ?? '#0A2472';
}

// Mock places for testing without Outscraper
function getMockPlaces($category, $limit) {
    $mockData = [
        [
            'id' => 'mock_1',
            'name' => 'Café de la Paz',
            'category' => 'coffee',
            'description' => 'Cafetería artesanal con ambiente acogedor',
            'address' => '6a Avenida 14-38, Zona 1, Guatemala City',
            'latitude' => 14.634915,
            'longitude' => -90.506882,
            'hours' => 'Lun-Vie: 7am-8pm',
            'contact' => '+502 2230-1234',
            'website' => null,
            'images' => ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800'],
            'rating' => 4.5,
            'reviews_count' => 120,
            'priceLevel' => '$$',
            'features' => ['Café', 'WiFi', 'Pasteles'],
            'primaryColor' => '#0A2472',
            'checkInCount' => 234,
            'isFavorite' => false,
            'googleMapsUrl' => null
        ],
        [
            'id' => 'mock_2',
            'name' => 'La Trattoria Italiana',
            'category' => 'restaurant',
            'description' => 'Auténtica cocina italiana en el corazón de Guatemala',
            'address' => '4a Avenida 12-59, Zona 10, Guatemala City',
            'latitude' => 14.598621,
            'longitude' => -90.508812,
            'hours' => '12pm-10pm',
            'contact' => '+502 2367-5678',
            'website' => null,
            'images' => ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'],
            'rating' => 4.8,
            'reviews_count' => 340,
            'priceLevel' => '$$$',
            'features' => ['Italiana', 'Pasta', 'Vino'],
            'primaryColor' => '#1E3A8A',
            'checkInCount' => 567,
            'isFavorite' => false,
            'googleMapsUrl' => null
        ],
        [
            'id' => 'mock_3',
            'name' => 'SkyBar Rooftop',
            'category' => 'bar',
            'description' => 'Bar en azotea con vista panorámica de la ciudad',
            'address' => '13 Calle 0-40, Zona 10, Guatemala City',
            'latitude' => 14.595412,
            'longitude' => -90.513523,
            'hours' => '5pm-2am',
            'contact' => '+502 2420-9876',
            'website' => null,
            'images' => ['https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800'],
            'rating' => 4.6,
            'reviews_count' => 280,
            'priceLevel' => '$$$',
            'features' => ['Cocteles', 'Rooftop', 'Música en vivo'],
            'primaryColor' => '#0A2472',
            'checkInCount' => 445,
            'isFavorite' => false,
            'googleMapsUrl' => null
        ],
        [
            'id' => 'mock_4',
            'name' => 'CoWork Guatemala',
            'category' => 'coworking',
            'description' => 'Espacio de coworking moderno con todas las amenidades',
            'address' => '12 Calle 1-25, Zona 10, Guatemala City',
            'latitude' => 14.591234,
            'longitude' => -90.509876,
            'hours' => '24/7',
            'contact' => '+502 2345-6789',
            'website' => null,
            'images' => ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'],
            'rating' => 4.7,
            'reviews_count' => 150,
            'priceLevel' => '$$',
            'features' => ['WiFi', 'Café', 'Salas de reunión'],
            'primaryColor' => '#1E3A8A',
            'checkInCount' => 320,
            'isFavorite' => false,
            'googleMapsUrl' => null
        ],
        [
            'id' => 'mock_5',
            'name' => 'FitZone Gym',
            'category' => 'gym',
            'description' => 'Gimnasio completo con equipamiento de última generación',
            'address' => '7a Avenida 15-45, Zona 9, Guatemala City',
            'latitude' => 14.601234,
            'longitude' => -90.515678,
            'hours' => '5am-11pm',
            'contact' => '+502 2456-7890',
            'website' => null,
            'images' => ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800'],
            'rating' => 4.4,
            'reviews_count' => 200,
            'priceLevel' => '$$',
            'features' => ['Pesas', 'Cardio', 'Clases'],
            'primaryColor' => '#0A2472',
            'checkInCount' => 180,
            'isFavorite' => false,
            'googleMapsUrl' => null
        ],
        [
            'id' => 'mock_6',
            'name' => 'Hotel Boutique Colonial',
            'category' => 'hotel',
            'description' => 'Hotel boutique con arquitectura colonial restaurada',
            'address' => '5a Calle 5-55, Antigua Guatemala',
            'latitude' => 14.558912,
            'longitude' => -90.734512,
            'hours' => '24/7',
            'contact' => '+502 7832-1234',
            'website' => null,
            'images' => ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'],
            'rating' => 4.9,
            'reviews_count' => 420,
            'priceLevel' => '$$$',
            'features' => ['Restaurante', 'Spa', 'Piscina'],
            'primaryColor' => '#1E3A8A',
            'checkInCount' => 680,
            'isFavorite' => false,
            'googleMapsUrl' => null
        ],
        [
            'id' => 'mock_7',
            'name' => 'Oakland Mall',
            'category' => 'shopping',
            'description' => 'Centro comercial moderno con variedad de tiendas',
            'address' => 'Diagonal 6 13-01, Zona 10, Guatemala City',
            'latitude' => 14.584567,
            'longitude' => -90.497834,
            'hours' => '10am-9pm',
            'contact' => '+502 2380-9000',
            'website' => null,
            'images' => ['https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=800'],
            'rating' => 4.3,
            'reviews_count' => 890,
            'priceLevel' => '$$',
            'features' => ['Tiendas', 'Restaurantes', 'Cine'],
            'primaryColor' => '#0A2472',
            'checkInCount' => 1250,
            'isFavorite' => false,
            'googleMapsUrl' => null
        ]
    ];
    
    // Filter by category if specified
    if ($category !== 'all') {
        $mockData = array_filter($mockData, function($place) use ($category) {
            return $place['category'] === $category;
        });
    }
    
    // Limit results
    return array_slice(array_values($mockData), 0, $limit);
}
?>