<?php

class RoleMiddleware
{
    public static function adminOnly(): callable
    {
        return function () {
            AuthMiddleware::handle();
            $user = $GLOBALS['auth_user'] ?? null;
            if (($user['role_slug'] ?? '') !== 'administrator') {
                Response::forbidden('Administrator access required');
            }
        };
    }

    public static function auth(): callable
    {
        return fn() => AuthMiddleware::handle();
    }
}
