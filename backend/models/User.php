<?php

class User extends Model
{
    protected string $table = 'users';

    public function findByEmail(string $email): ?array
    {
        $sql = "SELECT u.*, r.name as role_name, r.slug as role_slug
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.email = :email AND u.deleted_at IS NULL AND r.deleted_at IS NULL";
        return $this->queryOne($sql, ['email' => $email]);
    }

    public function findByIdWithRole(int $id): ?array
    {
        $sql = "SELECT u.id, u.role_id, u.first_name, u.last_name, u.email, u.phone, u.avatar,
                       u.is_active, u.last_login_at, u.created_at,
                       r.name as role_name, r.slug as role_slug
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.id = :id AND u.deleted_at IS NULL AND r.deleted_at IS NULL";
        return $this->queryOne($sql, ['id' => $id]);
    }

    public function paginate(int $page = 1, int $perPage = 10, ?string $search = null): array
    {
        $offset = ($page - 1) * $perPage;
        $params = [];
        $where = 'u.deleted_at IS NULL';

        if ($search) {
            $where .= ' AND (u.first_name LIKE :s1 OR u.last_name LIKE :s2 OR u.email LIKE :s3)';
            $term = "%{$search}%";
            $params['s1'] = $term;
            $params['s2'] = $term;
            $params['s3'] = $term;
        }

        $countSql = "SELECT COUNT(*) as total FROM users u WHERE {$where}";
        $total = (int) $this->queryOne($countSql, $params)['total'];

        $sql = "SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.is_active, u.last_login_at,
                       u.created_at, r.name as role_name, r.slug as role_slug, r.id as role_id
                FROM users u JOIN roles r ON u.role_id = r.id
                WHERE {$where}
                ORDER BY u.created_at DESC
                LIMIT {$perPage} OFFSET {$offset}";
        $items = $this->query($sql, $params);

        return [
            'items' => $items,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => (int) ceil($total / $perPage),
            ],
        ];
    }

    public function updateResetToken(int $userId, string $token, string $expires): bool
    {
        return $this->update($userId, [
            'reset_token' => $token,
            'reset_token_expires_at' => $expires,
        ]);
    }

    public function findByResetToken(string $token): ?array
    {
        $sql = "SELECT * FROM users WHERE reset_token = :token
                AND reset_token_expires_at > NOW() AND deleted_at IS NULL";
        return $this->queryOne($sql, ['token' => $token]);
    }

    public function clearResetToken(int $userId): bool
    {
        $sql = "UPDATE users SET reset_token = NULL, reset_token_expires_at = NULL WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute(['id' => $userId]);
    }
}
