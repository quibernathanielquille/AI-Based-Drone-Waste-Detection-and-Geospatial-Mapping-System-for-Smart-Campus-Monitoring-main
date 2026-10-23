<?php

class AuthController extends Controller
{
    private User $userModel;

    public function __construct()
    {
        parent::__construct();
        $this->userModel = new User();
    }

    public function register(): void
    {
        $data = $this->getJsonInput();
        if (!$this->validator->validate($data, [
            'first_name' => 'required|min:2',
            'last_name' => 'required|min:2',
            'email' => 'required|email',
            'password' => 'required|min:8',
            'password_confirmation' => 'required|min:8',
        ])) {
            Response::error('Validation failed', $this->validator->errors(), 422);
        }

        if ($data['password'] !== $data['password_confirmation']) {
            Response::error('Passwords do not match', null, 422);
        }

        if ($this->userModel->findByEmail($data['email'])) {
            Response::error('An account with this email already exists', null, 422);
        }

        $roleModel = new Role();
        $role = $roleModel->findBySlug('environmental_officer');
        if (!$role) {
            Response::error('Registration is not available yet. Please import database/sample_data.sql in phpMyAdmin.', null, 503);
        }

        $userId = $this->userModel->create([
            'role_id' => (int) $role['id'],
            'first_name' => trim($data['first_name']),
            'last_name' => trim($data['last_name']),
            'email' => strtolower(trim($data['email'])),
            'password_hash' => password_hash($data['password'], PASSWORD_BCRYPT),
            'phone' => !empty($data['phone']) ? trim($data['phone']) : null,
            'is_active' => 1,
        ]);

        $user = $this->userModel->findByIdWithRole($userId);
        $token = JwtHelper::encode([
            'sub' => (int) $user['id'],
            'email' => $user['email'],
            'role' => $user['role_slug'],
            'role_id' => (int) $user['role_id'],
        ], false);

        $this->userModel->update($userId, ['last_login_at' => date('Y-m-d H:i:s')]);
        $this->logActivity('register', 'auth', 'New user registered');

        Response::success([
            'token' => $token,
            'user' => $this->formatUser($user),
        ], 'Account created successfully', 201);
    }

    public function login(): void
    {
        $data = $this->getJsonInput();
        if (!$this->validator->validate($data, [
            'email' => 'required|email',
            'password' => 'required|min:6',
        ])) {
            Response::error('Validation failed', $this->validator->errors(), 422);
        }

        $user = $this->userModel->findByEmail($data['email']);
        if (!$user || !password_verify($data['password'], $user['password_hash'])) {
            Response::error('Invalid email or password', null, 401);
        }
        if (!$user['is_active']) {
            Response::error('Account is deactivated', null, 403);
        }

        $remember = !empty($data['remember']);
        $token = JwtHelper::encode([
            'sub' => (int) $user['id'],
            'email' => $user['email'],
            'role' => $user['role_slug'],
            'role_id' => (int) $user['role_id'],
        ], $remember);

        $this->userModel->update((int) $user['id'], ['last_login_at' => date('Y-m-d H:i:s')]);
        $this->logActivity('login', 'auth', 'User logged in');

        Response::success([
            'token' => $token,
            'user' => $this->formatUser($user),
            'remember' => $remember,
        ], 'Login successful');
    }

    public function logout(): void
    {
        $this->logActivity('logout', 'auth', 'User logged out');
        Response::success(null, 'Logged out successfully');
    }

    public function me(): void
    {
        $user = $this->getAuthUser();
        Response::success(['user' => $this->formatUser($user)]);
    }

    public function forgotPassword(): void
    {
        $data = $this->getJsonInput();
        if (!$this->validator->validate($data, ['email' => 'required|email'])) {
            Response::error('Validation failed', $this->validator->errors(), 422);
        }

        $user = $this->userModel->findByEmail($data['email']);
        if ($user) {
            $token = bin2hex(random_bytes(32));
            $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));
            $this->userModel->updateResetToken((int) $user['id'], $token, $expires);
            $this->logActivity('forgot_password', 'auth', 'Password reset requested');
            Response::success([
                'message' => 'If the email exists, a reset link has been sent.',
                'reset_token' => $token,
            ], 'Reset instructions sent');
        } else {
            Response::success(null, 'If the email exists, a reset link has been sent.');
        }
    }

    public function resetPassword(): void
    {
        $data = $this->getJsonInput();
        if (!$this->validator->validate($data, [
            'token' => 'required',
            'password' => 'required|min:8',
            'password_confirmation' => 'required|min:8',
        ])) {
            Response::error('Validation failed', $this->validator->errors(), 422);
        }

        if ($data['password'] !== $data['password_confirmation']) {
            Response::error('Passwords do not match', null, 422);
        }

        $user = $this->userModel->findByResetToken($data['token']);
        if (!$user) {
            Response::error('Invalid or expired reset token', null, 400);
        }

        $this->userModel->update((int) $user['id'], [
            'password_hash' => password_hash($data['password'], PASSWORD_BCRYPT),
        ]);
        $this->userModel->clearResetToken((int) $user['id']);
        $this->logActivity('reset_password', 'auth', 'Password reset completed');

        Response::success(null, 'Password reset successful');
    }

    private function formatUser(array $user): array
    {
        return [
            'id' => (int) $user['id'],
            'first_name' => $user['first_name'],
            'last_name' => $user['last_name'],
            'email' => $user['email'],
            'phone' => $user['phone'] ?? null,
            'avatar' => $user['avatar'] ?? null,
            'role' => $user['role_slug'] ?? $user['role_name'] ?? '',
            'role_name' => $user['role_name'] ?? '',
            'role_id' => (int) ($user['role_id'] ?? 0),
        ];
    }
}
