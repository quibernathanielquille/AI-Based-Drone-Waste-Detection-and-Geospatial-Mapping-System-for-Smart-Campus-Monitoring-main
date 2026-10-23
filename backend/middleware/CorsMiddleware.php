<?php

class CorsMiddleware
{
    public static function handle(): void
    {
        $config = require __DIR__ . '/../config/app.php';
        $requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowed = $config['frontend_urls'] ?? [$config['frontend_url']];
        $origin = in_array($requestOrigin, $allowed, true)
            ? $requestOrigin
            : $config['frontend_url'];

        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Allow-Credentials: true');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
