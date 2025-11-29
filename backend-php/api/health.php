<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../utils/response.php';

/**
 * Health check endpoint
 * GET /api/health
 */

$status = [
    'status' => 'ok',
    'timestamp' => date('c'),
    'apis' => [
        'outscraper' => !empty(OUTSCRAPER_API_KEY) && OUTSCRAPER_API_KEY !== 'your_outscraper_api_key_here',
        'exa' => !empty(EXA_API_KEY) && EXA_API_KEY !== 'your_exa_api_key_here',
        'supadata' => !empty(SUPADATA_API_KEY) && SUPADATA_API_KEY !== 'your_supadata_api_key_here'
    ],
    'cache_dir' => is_writable(__DIR__ . '/../cache'),
    'php_version' => PHP_VERSION
];

Response::success($status);
?>