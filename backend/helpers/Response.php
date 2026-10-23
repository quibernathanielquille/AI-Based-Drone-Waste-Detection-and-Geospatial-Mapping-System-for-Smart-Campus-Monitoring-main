<?php

class Response
{
    public static function json(bool $success, string $message = '', $data = null, $errors = null, int $code = 200): void
    {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => $success,
            'message' => $message,
            'data' => $data,
            'errors' => $errors,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function success($data = null, string $message = 'Success', int $code = 200): void
    {
        self::json(true, $message, $data, null, $code);
    }

    public static function error(string $message = 'Error', $errors = null, int $code = 400): void
    {
        self::json(false, $message, null, $errors, $code);
    }

    public static function unauthorized(string $message = 'Unauthorized'): void
    {
        self::error($message, null, 401);
    }

    public static function forbidden(string $message = 'Forbidden'): void
    {
        self::error($message, null, 403);
    }

    public static function notFound(string $message = 'Not found'): void
    {
        self::error($message, null, 404);
    }
}
