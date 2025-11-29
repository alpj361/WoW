<?php
// Load environment variables
function loadEnv($path) {
    if (!file_exists($path)) {
        return;
    }
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        
        if (!array_key_exists($name, $_ENV)) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
        }
    }
}

loadEnv(__DIR__ . '/../.env');

// Configuration
define('OUTSCRAPER_API_KEY', getenv('OUTSCRAPER_API_KEY'));
define('EXA_API_KEY', getenv('EXA_API_KEY'));
define('SUPADATA_API_KEY', getenv('SUPADATA_API_KEY'));
define('CACHE_DURATION', getenv('CACHE_DURATION') ?: 3600);
define('MAX_RESULTS', getenv('MAX_RESULTS_PER_QUERY') ?: 20);
define('DEFAULT_COUNTRY', getenv('DEFAULT_COUNTRY') ?: 'Guatemala');
define('DEFAULT_LANGUAGE', getenv('DEFAULT_LANGUAGE') ?: 'es');

// CORS Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>