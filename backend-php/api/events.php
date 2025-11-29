<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../utils/cache.php';
require_once __DIR__ . '/../utils/http.php';
require_once __DIR__ . '/../utils/response.php';

/**
 * Events Search using Exa API
 * 
 * GET /api/events?location=Guatemala&category=cultura&limit=10
 */

try {
    $location = $_GET['location'] ?? 'Guatemala';
    $category = $_GET['category'] ?? 'eventos';
    $limit = min(intval($_GET['limit'] ?? 10), 20);
    
    // Check cache
    $cache = new Cache();
    $cacheKey = 'events_' . md5($location . $category . $limit);
    $cachedData = $cache->get($cacheKey);
    
    if ($cachedData) {
        Response::cached($cachedData, true);
    }
    
    if (!EXA_API_KEY || EXA_API_KEY === 'your_exa_api_key_here') {
        Response::error('Exa API key not configured', 500);
    }
    
    // Build search query for events
    $searchQuery = buildEventQuery($location, $category);
    
    // Call Exa Search API
    $url = 'https://api.exa.ai/search';
    $payload = [
        'query' => $searchQuery,
        'num_results' => $limit,
        'type' => 'neural',
        'contents' => [
            'text' => true
        ],
        'use_autoprompt' => true
    ];
    
    $response = HttpClient::post($url, $payload, [
        'Content-Type: application/json',
        'x-api-key: ' . EXA_API_KEY
    ]);
    
    if ($response['status'] !== 200) {
        Response::error('Failed to fetch events from Exa', 500, $response['body']);
    }
    
    $events = parseEvents($response['data']);
    
    // Cache results
    $cache->set($cacheKey, $events, 1800); // 30 minutes cache for events
    
    Response::success($events);
    
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}

function buildEventQuery($location, $category) {
    $queries = [
        'eventos' => 'eventos actuales upcoming events',
        'cultura' => 'eventos culturales exposiciones conciertos',
        'deportes' => 'eventos deportivos partidos torneos',
        'música' => 'conciertos festivales música en vivo',
        'arte' => 'exposiciones galerías arte performances',
        'comida' => 'festivales gastronómicos food events'
    ];
    
    $categoryQuery = $queries[$category] ?? 'eventos';
    return $categoryQuery . ' en ' . $location . ' ' . date('Y');
}

function parseEvents($data) {
    $events = [];
    
    if (!isset($data['results']) || !is_array($data['results'])) {
        return $events;
    }
    
    foreach ($data['results'] as $result) {
        $text = $result['text'] ?? '';
        $title = $result['title'] ?? 'Evento';
        $url = $result['url'] ?? '';
        
        // Extract date from text (simple extraction)
        $date = extractDate($text);
        
        $events[] = [
            'id' => $result['id'] ?? uniqid(),
            'name' => $title,
            'description' => truncateText($text, 200),
            'date' => $date,
            'time' => 'Por confirmar',
            'location' => extractLocation($text),
            'url' => $url,
            'source' => parse_url($url, PHP_URL_HOST),
            'images' => [
                'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800'
            ],
            'attendees' => rand(20, 200),
            'maxAttendees' => rand(50, 500),
            'isUserAttending' => false,
            'tags' => extractTags($text)
        ];
    }
    
    return $events;
}

function extractDate($text) {
    // Simple date extraction - can be improved
    $months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    foreach ($months as $index => $month) {
        if (stripos($text, $month) !== false) {
            // Extract day if possible
            preg_match('/(\d{1,2})\s+de\s+' . $month . '/i', $text, $matches);
            if (isset($matches[1])) {
                $day = $matches[1];
                $monthNum = str_pad($index + 1, 2, '0', STR_PAD_LEFT);
                return date('Y') . '-' . $monthNum . '-' . str_pad($day, 2, '0', STR_PAD_LEFT);
            }
        }
    }
    
    // Default to next week
    return date('Y-m-d', strtotime('+7 days'));
}

function extractLocation($text) {
    // Simple location extraction
    $locations = ['Guatemala City', 'Antigua', 'Quetzaltenango', 'Panajachel'];
    foreach ($locations as $location) {
        if (stripos($text, $location) !== false) {
            return $location;
        }
    }
    return 'Guatemala';
}

function extractTags($text) {
    $tags = [];
    $keywords = ['música', 'arte', 'cultura', 'comida', 'festival', 'concierto', 'exposición'];
    
    foreach ($keywords as $keyword) {
        if (stripos(strtolower($text), $keyword) !== false) {
            $tags[] = $keyword;
        }
    }
    
    return array_slice($tags, 0, 3);
}

function truncateText($text, $length) {
    if (strlen($text) <= $length) {
        return $text;
    }
    return substr($text, 0, $length) . '...';
}
?>