<?php

class ActivityLog extends Model
{
    protected string $table = 'activity_logs';
    protected bool $softDeletes = false;

    public function paginate(int $page = 1, int $perPage = 20, ?int $userId = null): array
    {
        $offset = ($page - 1) * $perPage;
        $params = [];
        $where = '1=1';

        if ($userId) {
            $where .= ' AND al.user_id = :user_id';
            $params['user_id'] = $userId;
        }

        $total = (int) $this->queryOne(
            "SELECT COUNT(*) as total FROM activity_logs al WHERE {$where}",
            $params
        )['total'];

        $sql = "SELECT al.*, CONCAT(u.first_name, ' ', u.last_name) as user_name
                FROM activity_logs al
                LEFT JOIN users u ON al.user_id = u.id
                WHERE {$where}
                ORDER BY al.created_at DESC
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

    public function getRecent(int $limit = 10): array
    {
        $sql = "SELECT al.*, CONCAT(u.first_name, ' ', u.last_name) as user_name
                FROM activity_logs al
                LEFT JOIN users u ON al.user_id = u.id
                ORDER BY al.created_at DESC LIMIT {$limit}";
        return $this->query($sql);
    }
}
