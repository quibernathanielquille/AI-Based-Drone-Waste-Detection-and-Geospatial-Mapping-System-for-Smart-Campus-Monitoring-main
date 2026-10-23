<?php

class Controller
{
    protected Validator $validator;

    public function __construct()
    {
        $this->validator = new Validator();
    }

    protected function getJsonInput(): array
    {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        return is_array($data) ? $data : [];
    }

    protected function getAuthUser(): ?array
    {
        return $GLOBALS['auth_user'] ?? null;
    }

    protected function logActivity(string $action, string $module, string $description, ?array $metadata = null): void
    {
        $user = $this->getAuthUser();
        $model = new ActivityLog();
        $model->create([
            'user_id' => $user['id'] ?? null,
            'action' => $action,
            'module' => $module,
            'description' => $description,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
            'user_agent' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500),
            'metadata' => $metadata ? json_encode($metadata) : null,
        ]);
    }
}
