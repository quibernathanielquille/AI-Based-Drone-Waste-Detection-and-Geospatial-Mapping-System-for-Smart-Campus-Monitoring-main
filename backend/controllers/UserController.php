<?php

class UserController extends Controller
{
    private User $model;

    public function __construct()
    {
        parent::__construct();
        $this->model = new User();
    }

    public function index(): void
    {
        $page = (int) ($_GET['page'] ?? 1);
        $search = $_GET['search'] ?? null;
        Response::success($this->model->paginate($page, 10, $search));
    }

    public function show(string $id): void
    {
        $user = $this->model->findByIdWithRole((int) $id);
        if (!$user) {
            Response::notFound('User not found');
        }
        unset($user['password_hash']);
        Response::success($user);
    }

    public function store(): void
    {
        $data = $this->getJsonInput();
        if (!$this->validator->validate($data, [
            'first_name' => 'required|min:2',
            'last_name' => 'required|min:2',
            'email' => 'required|email',
            'password' => 'required|min:8',
            'role_id' => 'required|numeric',
        ])) {
            Response::error('Validation failed', $this->validator->errors(), 422);
        }

        if ($this->model->findByEmail($data['email'])) {
            Response::error('Email already exists', null, 422);
        }

        $id = $this->model->create([
            'role_id' => (int) $data['role_id'],
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'password_hash' => password_hash($data['password'], PASSWORD_BCRYPT),
            'phone' => $data['phone'] ?? null,
            'is_active' => (int) ($data['is_active'] ?? 1),
        ]);

        $this->logActivity('create', 'users', "Created user #{$id}");
        Response::success($this->model->findByIdWithRole($id), 'User created', 201);
    }

    public function update(string $id): void
    {
        $existing = $this->model->find((int) $id);
        if (!$existing) {
            Response::notFound('User not found');
        }

        $data = $this->getJsonInput();
        $update = array_filter([
            'role_id' => $data['role_id'] ?? null,
            'first_name' => $data['first_name'] ?? null,
            'last_name' => $data['last_name'] ?? null,
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'is_active' => isset($data['is_active']) ? (int) $data['is_active'] : null,
        ], fn($v) => $v !== null);

        if (!empty($data['password'])) {
            $update['password_hash'] = password_hash($data['password'], PASSWORD_BCRYPT);
        }

        $this->model->update((int) $id, $update);
        $this->logActivity('update', 'users', "Updated user #{$id}");
        Response::success($this->model->findByIdWithRole((int) $id), 'User updated');
    }

    public function destroy(string $id): void
    {
        $authUser = $this->getAuthUser();
        if ((int) $id === (int) $authUser['id']) {
            Response::error('Cannot delete your own account', null, 400);
        }
        if (!$this->model->find((int) $id)) {
            Response::notFound('User not found');
        }
        $this->model->delete((int) $id);
        $this->logActivity('delete', 'users', "Deleted user #{$id}");
        Response::success(null, 'User deleted');
    }

    public function resetPassword(string $id): void
    {
        $data = $this->getJsonInput();
        if (!$this->validator->validate($data, ['password' => 'required|min:8'])) {
            Response::error('Validation failed', $this->validator->errors(), 422);
        }
        if (!$this->model->find((int) $id)) {
            Response::notFound('User not found');
        }
        $this->model->update((int) $id, [
            'password_hash' => password_hash($data['password'], PASSWORD_BCRYPT),
        ]);
        $this->logActivity('reset_password', 'users', "Admin reset password for user #{$id}");
        Response::success(null, 'Password reset successful');
    }

    public function roles(): void
    {
        $roleModel = new Role();
        Response::success($roleModel->getAllActive());
    }
}
