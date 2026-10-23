<?php

class Router
{
    private array $routes = [];

    public function get(string $path, callable $handler, array $middleware = []): void
    {
        $this->addRoute('GET', $path, $handler, $middleware);
    }

    public function post(string $path, callable $handler, array $middleware = []): void
    {
        $this->addRoute('POST', $path, $handler, $middleware);
    }

    public function put(string $path, callable $handler, array $middleware = []): void
    {
        $this->addRoute('PUT', $path, $handler, $middleware);
    }

    public function delete(string $path, callable $handler, array $middleware = []): void
    {
        $this->addRoute('DELETE', $path, $handler, $middleware);
    }

    private function addRoute(string $method, string $path, callable $handler, array $middleware): void
    {
        $this->routes[] = compact('method', 'path', 'handler', 'middleware');
    }

    public function dispatch(string $method, string $uri): void
    {
        $uri = '/' . trim(parse_url($uri, PHP_URL_PATH), '/');
        $uri = rawurldecode($uri);

        $basePath = rawurldecode($this->getBasePath());
        if ($basePath && str_starts_with($uri, $basePath)) {
            $uri = substr($uri, strlen($basePath)) ?: '/';
        }

        // PATH_INFO fallback (e.g. index.php/auth/login)
        if (!str_starts_with($uri, '/auth') && !str_starts_with($uri, '/dashboard')
            && isset($_SERVER['PATH_INFO']) && $_SERVER['PATH_INFO']) {
            $uri = '/' . trim($_SERVER['PATH_INFO'], '/');
        }

        foreach ($this->routes as $route) {
            $pattern = preg_replace('/\{([a-zA-Z_]+)\}/', '([^/]+)', $route['path']);
            $pattern = '#^' . $pattern . '$#';

            if ($route['method'] === $method && preg_match($pattern, $uri, $matches)) {
                array_shift($matches);
                foreach ($route['middleware'] as $mw) {
                    $mw();
                }
                call_user_func_array($route['handler'], $matches);
                return;
            }
        }

        Response::notFound('Endpoint not found');
    }

    private function getBasePath(): string
    {
        $script = $_SERVER['SCRIPT_NAME'] ?? '';
        return rtrim(dirname($script), '/');
    }
}
