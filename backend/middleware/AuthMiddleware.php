<?php

class AuthMiddleware
{
    public static function handle(): void
    {
        $header = self::getAuthorizationHeader();
        if (!preg_match('/Bearer\s+(.+)/i', $header, $matches)) {
            Response::unauthorized('Authentication token required');
        }

        $payload = JwtHelper::decode(trim($matches[1]));
        if (!$payload) {
            Response::unauthorized('Invalid or expired token');
        }

        $userModel = new User();
        $user = $userModel->findByIdWithRole((int) $payload['sub']);
        if (!$user || !$user['is_active']) {
            Response::unauthorized('User not found or inactive');
        }

        $GLOBALS['auth_user'] = $user;
    }

    private static function getAuthorizationHeader(): string
    {
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            return $_SERVER['HTTP_AUTHORIZATION'];
        }
        if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }
        if (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            if (!empty($headers['Authorization'])) {
                return $headers['Authorization'];
            }
        }
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            foreach ($headers as $name => $value) {
                if (strcasecmp($name, 'Authorization') === 0) {
                    return $value;
                }
            }
        }
        return '';
    }
}
