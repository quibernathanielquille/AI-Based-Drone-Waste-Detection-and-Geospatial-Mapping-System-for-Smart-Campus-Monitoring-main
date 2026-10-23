<?php
header('Content-Type: application/json');
echo json_encode([
    'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? null,
    'SCRIPT_NAME' => $_SERVER['SCRIPT_NAME'] ?? null,
    'PATH_INFO' => $_SERVER['PATH_INFO'] ?? null,
    'dirname' => dirname($_SERVER['SCRIPT_NAME'] ?? ''),
], JSON_PRETTY_PRINT);
