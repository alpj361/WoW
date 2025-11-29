<?php
/**
 * Router for Render.com deployment
 * Handles all routing without .htaccess
 */

// Get the request URI and method
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Remove query string
$path = parse_url($requestUri, PHP_URL_PATH);

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle OPTIONS preflight
if ($requestMethod === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Route mapping
$routes = [
    '/api/health' => __DIR__ . '/api/health.php',
    '/api/places' => __DIR__ . '/api/places.php',
    '/api/events' => __DIR__ . '/api/events.php',
    '/api/guatemala' => __DIR__ . '/api/guatemala.php',
];

// Match route
foreach ($routes as $route => $file) {
    if (strpos($path, $route) === 0) {
        if (file_exists($file)) {
            require_once $file;
            exit();
        }
    }
}

// Root endpoint
if ($path === '/' || $path === '') {
    require_once __DIR__ . '/index.php';
    exit();
}

// 404
http_response_code(404);
echo json_encode([
    'success' => false,
    'error' => 'Endpoint not found',
    'path' => $path
]);
?>
