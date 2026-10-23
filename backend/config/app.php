<?php

return [
    'name' => 'Smart Campus Waste Detection',
    'env' => 'development',
    'debug' => true,
    'url' => 'http://localhost',
    'timezone' => 'Asia/Manila',
    'upload_path' => __DIR__ . '/../uploads/waste/',
    'upload_url' => 'http://localhost/AI-Based%20Drone%20Waste%20Detection%20and%20Geospatial%20Mapping%20System%20for%20Smart%20Campus%20Monitoring/backend/uploads/waste/',
    'max_upload_size' => 5 * 1024 * 1024,
    'allowed_image_types' => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    'frontend_url' => 'http://localhost:5173',
    'frontend_urls' => [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
    ],
];
