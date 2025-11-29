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
        Response::error('Outscraper API key not configured', 500);
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
?>