<?php

class SettingsController extends Controller
{
    private Setting $model;

    public function __construct()
    {
        parent::__construct();
        $this->model = new Setting();
    }

    public function index(): void
    {
        $user = $this->getAuthUser();
        $group = $_GET['group'] ?? null;
        Response::success($this->model->getByUser((int) $user['id'], $group));
    }

    public function updateProfile(): void
    {
        $user = $this->getAuthUser();
        $data = $this->getJsonInput();
        $userModel = new User();

        $update = array_filter([
            'first_name' => $data['first_name'] ?? null,
            'last_name' => $data['last_name'] ?? null,
        ], fn($v) => $v !== null);

        $userModel->update((int) $user['id'], $update);
        $this->logActivity('update', 'settings', 'Profile updated');
        Response::success($userModel->findByIdWithRole((int) $user['id']), 'Profile updated');
    }

    public function changePassword(): void
    {
        $user = $this->getAuthUser();
        $data = $this->getJsonInput();

        if (!$this->validator->validate($data, [
            'current_password' => 'required',
            'new_password' => 'required|min:8',
        ])) {
            Response::error('Validation failed', $this->validator->errors(), 422);
        }

        $fullUser = (new User())->find((int) $user['id']);
        if (!password_verify($data['current_password'], $fullUser['password_hash'])) {
            Response::error('Current password is incorrect', null, 422);
        }

        if (password_verify($data['new_password'], $fullUser['password_hash'])) {
            Response::error('New password must be different from your current password', null, 422);
        }

        (new User())->update((int) $user['id'], [
            'password_hash' => password_hash($data['new_password'], PASSWORD_BCRYPT),
        ]);
        $this->logActivity('change_password', 'settings', 'Password changed');
        Response::success(null, 'Password changed successfully');
    }

    public function updateNotifications(): void
    {
        $user = $this->getAuthUser();
        $data = $this->getJsonInput();

        foreach (['email_notifications', 'push_notifications', 'notify_new_waste'] as $key) {
            if (isset($data[$key])) {
                $this->model->upsert((int) $user['id'], $key, $data[$key] ? '1' : '0', 'notification');
            }
        }

        Response::success(null, 'Notification settings updated');
    }

    public function updateTheme(): void
    {
        $user = $this->getAuthUser();
        $data = $this->getJsonInput();

        if (!empty($data['theme_primary'])) {
            $this->model->upsert((int) $user['id'], 'theme_primary', $data['theme_primary'], 'theme');
        }

        Response::success(null, 'Theme updated');
    }

    public function updateSystem(): void
    {
        $data = $this->getJsonInput();
        $keys = ['campus_name', 'default_map_lat', 'default_map_lng', 'default_map_zoom'];

        foreach ($keys as $key) {
            if (isset($data[$key])) {
                $this->model->upsert(null, $key, (string) $data[$key], 'system');
            }
        }

        $this->logActivity('update', 'settings', 'System settings updated');
        Response::success(null, 'System settings updated');
    }

    public function activityLogs(): void
    {
        $user = $this->getAuthUser();
        $page = (int) ($_GET['page'] ?? 1);
        $isAdmin = ($user['role_slug'] ?? '') === 'administrator';
        $userId = ($isAdmin && !empty($_GET['all'])) ? null : (int) $user['id'];

        $model = new ActivityLog();
        Response::success($model->paginate($page, 20, $userId));
    }
}
