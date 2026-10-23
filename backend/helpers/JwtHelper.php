<?php

class JwtHelper
{
    public static function encode(array $payload, bool $remember = false): string
    {
        $config = require __DIR__ . '/../config/jwt.php';
        $header = self::base64UrlEncode(json_encode(['typ' => 'JWT', 'alg' => $config['algorithm']]));
        $payload['iat'] = time();
        $payload['exp'] = time() + ($remember ? $config['remember_expiry'] : $config['expiry']);
        $payload['iss'] = $config['issuer'];
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));
        $signature = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$payloadEncoded", $config['secret'], true)
        );
        return "$header.$payloadEncoded.$signature";
    }

    public static function decode(string $token): ?array
    {
        $config = require __DIR__ . '/../config/jwt.php';
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        [$header, $payload, $signature] = $parts;
        $expected = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$payload", $config['secret'], true)
        );
        if (!hash_equals($expected, $signature)) {
            return null;
        }
        $data = json_decode(self::base64UrlDecode($payload), true);
        if (!$data || ($data['exp'] ?? 0) < time()) {
            return null;
        }
        return $data;
    }

    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
