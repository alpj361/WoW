<?php
require_once __DIR__ . '/config/config.php';

// Main router
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

header('Content-Type: application/json');

echo json_encode([
    'name' => 'Collaborative Map Space API',
    'version' => '1.0.0',
    'endpoints' => [
        'GET /api/health' => 'Health check',
        'GET /api/places' => 'Search places (Outscraper)',
        'GET /api/events' => 'Search events (Exa)',
        'GET /api/guatemala' => 'Guatemala.com data (Supadata)'
    ],
    'documentation' => 'See README.md for details'
]);
?>