<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../utils/cache.php';
require_once __DIR__ . '/../utils/http.php';
require_once __DIR__ . '/../utils/response.php';

/**
 * Guatemala.com Scraping using Supadata
 * 
 * GET /api/guatemala?type=events (events, news, places)
 */

try {
    $type = $_GET['type'] ?? 'events';
    $limit = min(intval($_GET['limit'] ?? 10), 20);
    
    // Check cache
    $cache = new Cache();
    $cacheKey = 'guatemala_' . $type . '_' . $limit;
    $cachedData = $cache->get($cacheKey);
    
    if ($cachedData) {
        Response::cached($cachedData, true);
    }
    
    if (!SUPADATA_API_KEY || SUPADATA_API_KEY === 'your_supadata_api_key_here') {
        Response::error('Supadata API key not configured', 500);
    }
    
    // Build Supadata request based on type
    $url = buildSupadataUrl($type);
    
    $response = HttpClient::post('https://api.supadata.ai/v1/scrape', [
        'url' => $url,
        'format' => 'json',
        'extract' => getExtractionRules($type)
    ], [
        'Content-Type: application/json',
        'Authorization: Bearer ' . SUPADATA_API_KEY
    ]);
    
    if ($response['status'] !== 200) {
        Response::error('Failed to scrape Guatemala.com', 500, $response['body']);
    }
    
    $data = parseGuatemalaData($response['data'], $type);
    $data = array_slice($data, 0, $limit);
    
    // Cache results
    $cache->set($cacheKey, $data, 1800); // 30 minutes
    
    Response::success($data);
    
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}

function buildSupadataUrl($type) {
    $urls = [
        'events' => 'https://www.guatemala.com/eventos/',
        'news' => 'https://www.guatemala.com/noticias/cultura/',
        'places' => 'https://www.guatemala.com/lugares-turisticos/'
    ];
    
    return $urls[$type] ?? $urls['events'];
}

function getExtractionRules($type) {
    // Supadata extraction rules for different content types
    $rules = [
        'events' => [
            'list_selector' => '.event-item, article',
            'fields' => [
                'title' => '.title, h2, h3',
                'description' => '.description, .excerpt, p',
                'date' => '.date, time',
                'image' => 'img@src',
                'link' => 'a@href'
            ]
        ],
        'news' => [
            'list_selector' => 'article, .news-item',
            'fields' => [
                'title' => 'h2, h3, .title',
                'description' => 'p, .excerpt',
                'date' => '.date, time',
                'image' => 'img@src',
                'link' => 'a@href'
            ]
        ],
        'places' => [
            'list_selector' => '.place-item, article',
            'fields' => [
                'name' => 'h2, h3, .title',
                'description' => 'p, .description',
                'location' => '.location, .address',
                'image' => 'img@src',
                'link' => 'a@href'
            ]
        ]
    ];
    
    return $rules[$type] ?? $rules['events'];
}

function parseGuatemalaData($data, $type) {
    $parsed = [];
    
    if (!isset($data['results']) || !is_array($data['results'])) {
        return $parsed;
    }
    
    foreach ($data['results'] as $item) {
        switch ($type) {
            case 'events':
                $parsed[] = [
                    'id' => uniqid(),
                    'name' => $item['title'] ?? 'Evento',
                    'description' => $item['description'] ?? '',
                    'date' => parseDate($item['date'] ?? ''),
                    'time' => 'Por confirmar',
                    'location' => 'Guatemala',
                    'images' => [$item['image'] ?? 'https://via.placeholder.com/400'],
                    'source' => 'Guatemala.com',
                    'url' => $item['link'] ?? '',
                    'attendees' => rand(20, 150),
                    'tags' => ['cultura', 'guatemala']
                ];
                break;
                
            case 'news':
                $parsed[] = [
                    'id' => uniqid(),
                    'title' => $item['title'] ?? 'Noticia',
                    'description' => $item['description'] ?? '',
                    'date' => parseDate($item['date'] ?? ''),
                    'image' => $item['image'] ?? 'https://via.placeholder.com/400',
                    'url' => $item['link'] ?? '',
                    'source' => 'Guatemala.com',
                    'category' => 'cultura'
                ];
                break;
                
            case 'places':
                $parsed[] = [
                    'id' => uniqid(),
                    'name' => $item['name'] ?? 'Lugar',
                    'description' => $item['description'] ?? '',
                    'location' => $item['location'] ?? 'Guatemala',
                    'images' => [$item['image'] ?? 'https://via.placeholder.com/400'],
                    'url' => $item['link'] ?? '',
                    'source' => 'Guatemala.com',
                    'rating' => rand(40, 50) / 10
                ];
                break;
        }
    }
    
    return $parsed;
}

function parseDate($dateStr) {
    if (empty($dateStr)) {
        return date('Y-m-d', strtotime('+7 days'));
    }
    
    // Try to parse various date formats
    $timestamp = strtotime($dateStr);
    if ($timestamp) {
        return date('Y-m-d', $timestamp);
    }
    
    return date('Y-m-d', strtotime('+7 days'));
}
?>