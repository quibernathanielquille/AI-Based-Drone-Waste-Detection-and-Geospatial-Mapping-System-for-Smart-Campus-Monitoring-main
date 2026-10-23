<?php

class WasteDetection extends Model
{
    protected string $table = 'waste_detections';

    public function paginate(array $filters = []): array
    {
        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = min(50, max(5, (int) ($filters['per_page'] ?? 10)));
        $offset = ($page - 1) * $perPage;
        $params = [];
        $where = ['wd.deleted_at IS NULL'];

        if (!empty($filters['search'])) {
            $term = '%' . $filters['search'] . '%';
            $where[] = '(wd.description LIKE :search_desc OR wd.zone_name LIKE :search_zone'
                . ' OR wd.waste_category LIKE :search_cat OR wd.status LIKE :search_status'
                . ' OR CONCAT(u.first_name, \' \', u.last_name) LIKE :search_user'
                . ' OR u.email LIKE :search_email)';
            $params['search_desc'] = $term;
            $params['search_zone'] = $term;
            $params['search_cat'] = $term;
            $params['search_status'] = $term;
            $params['search_user'] = $term;
            $params['search_email'] = $term;
        }
        if (!empty($filters['detected_by'])) {
            $where[] = 'wd.detected_by = :detected_by';
            $params['detected_by'] = (int) $filters['detected_by'];
        }
        if (!empty($filters['waste_category'])) {
            $where[] = 'wd.waste_category = :category';
            $params['category'] = $filters['waste_category'];
        }
        if (!empty($filters['date_from'])) {
            $where[] = 'wd.detection_date >= :date_from';
            $params['date_from'] = $filters['date_from'];
        }
        if (!empty($filters['date_to'])) {
            $where[] = 'wd.detection_date <= :date_to';
            $params['date_to'] = $filters['date_to'];
        }
        if (isset($filters['is_hotspot']) && $filters['is_hotspot'] !== '') {
            $where[] = 'wd.is_hotspot = :hotspot';
            $params['hotspot'] = (int) $filters['is_hotspot'];
        }

        $whereClause = implode(' AND ', $where);
        $countSql = "SELECT COUNT(*) as total FROM waste_detections wd
                     LEFT JOIN users u ON wd.detected_by = u.id
                     WHERE {$whereClause}";
        $total = (int) $this->queryOne($countSql, $params)['total'];

        $orderBy = (($filters['sort'] ?? '') === 'id')
            ? 'wd.id DESC'
            : 'wd.detection_date DESC, wd.detection_time DESC';

        $sql = "SELECT wd.*,
                       CONCAT(u.first_name, ' ', u.last_name) as detected_by_name,
                       u.email as detected_by_email,
                       r.name as detected_by_role,
                       r.slug as detected_by_role_slug
                FROM waste_detections wd
                LEFT JOIN users u ON wd.detected_by = u.id
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE {$whereClause}
                ORDER BY {$orderBy}
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

    public function findWithDetails(int $id): ?array
    {
        $sql = "SELECT wd.*,
                       CONCAT(u.first_name, ' ', u.last_name) as detected_by_name,
                       u.email as detected_by_email,
                       r.name as detected_by_role,
                       r.slug as detected_by_role_slug
                FROM waste_detections wd
                LEFT JOIN users u ON wd.detected_by = u.id
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE wd.id = :id AND wd.deleted_at IS NULL";
        return $this->queryOne($sql, ['id' => $id]);
    }

    public function getByUserStats(): array
    {
        $sql = "SELECT u.id,
                       CONCAT(u.first_name, ' ', u.last_name) as user_name,
                       u.email,
                       r.name as role_name,
                       r.slug as role_slug,
                       COUNT(wd.id) as detection_count,
                       MAX(wd.created_at) as last_detection_at
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                LEFT JOIN waste_detections wd ON wd.detected_by = u.id AND wd.deleted_at IS NULL
                WHERE u.deleted_at IS NULL
                GROUP BY u.id, u.first_name, u.last_name, u.email, r.name, r.slug
                ORDER BY detection_count DESC, user_name ASC";
        return $this->query($sql);
    }

    public function getForMap(array $filters = []): array
    {
        $params = [];
        $where = ['deleted_at IS NULL'];

        if (!empty($filters['waste_category'])) {
            $where[] = 'waste_category = :category';
            $params['category'] = $filters['waste_category'];
        }
        if (!empty($filters['date_from'])) {
            $where[] = 'detection_date >= :date_from';
            $params['date_from'] = $filters['date_from'];
        }
        if (!empty($filters['date_to'])) {
            $where[] = 'detection_date <= :date_to';
            $params['date_to'] = $filters['date_to'];
        }

        $whereClause = implode(' AND ', $where);
        $sql = "SELECT id, waste_category, latitude, longitude, confidence_score, waste_image,
                       detection_date, detection_time, description, zone_name, is_hotspot
                FROM waste_detections WHERE {$whereClause}
                ORDER BY detection_date DESC";
        return $this->query($sql, $params);
    }

    public function getDashboardStats(): array
    {
        $total = $this->queryOne("SELECT COUNT(*) as c FROM waste_detections WHERE deleted_at IS NULL")['c'];
        $today = $this->queryOne(
            "SELECT COUNT(*) as c FROM waste_detections WHERE deleted_at IS NULL AND detection_date = CURDATE()"
        )['c'];
        $hotspots = $this->queryOne(
            "SELECT COUNT(*) as c FROM waste_detections WHERE deleted_at IS NULL AND is_hotspot = 1"
        )['c'];
        $categories = $this->query(
            "SELECT waste_category, COUNT(*) as count FROM waste_detections
             WHERE deleted_at IS NULL GROUP BY waste_category ORDER BY count DESC"
        );
        $recent = $this->query(
            "SELECT wd.id, wd.waste_category, wd.latitude, wd.longitude, wd.detection_date,
                    wd.detection_time, wd.confidence_score, wd.zone_name, wd.is_hotspot,
                    wd.status, wd.detected_by,
                    CONCAT(u.first_name, ' ', u.last_name) as detected_by_name,
                    u.email as detected_by_email,
                    r.name as detected_by_role
             FROM waste_detections wd
             LEFT JOIN users u ON wd.detected_by = u.id
             LEFT JOIN roles r ON u.role_id = r.id
             WHERE wd.deleted_at IS NULL
             ORDER BY wd.created_at DESC LIMIT 8"
        );

        return compact('total', 'today', 'hotspots', 'categories', 'recent');
    }

    public function getAnalyticsData(): array
    {
        $byCategory = $this->query(
            "SELECT waste_category, COUNT(*) as count FROM waste_detections
             WHERE deleted_at IS NULL GROUP BY waste_category ORDER BY count DESC"
        );
        $monthly = $this->query(
            "SELECT DATE_FORMAT(detection_date, '%Y-%m') as month, COUNT(*) as count
             FROM waste_detections WHERE deleted_at IS NULL
             AND detection_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             GROUP BY month ORDER BY month"
        );
        $daily = $this->query(
            "SELECT detection_date as date, COUNT(*) as count FROM waste_detections
             WHERE deleted_at IS NULL AND detection_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
             GROUP BY detection_date ORDER BY detection_date"
        );
        $hotspots = $this->query(
            "SELECT zone_name, COUNT(*) as count FROM waste_detections
             WHERE deleted_at IS NULL AND is_hotspot = 1 AND zone_name IS NOT NULL
             GROUP BY zone_name ORDER BY count DESC LIMIT 10"
        );
        $frequency = $this->query(
            "SELECT DAYNAME(detection_date) as day_name, COUNT(*) as count
             FROM waste_detections WHERE deleted_at IS NULL
             GROUP BY DAYNAME(detection_date), DAYOFWEEK(detection_date)
             ORDER BY DAYOFWEEK(detection_date)"
        );

        $most = $byCategory[0] ?? null;
        $least = !empty($byCategory) ? end($byCategory) : null;

        return [
            'by_category' => $byCategory,
            'monthly_trends' => $monthly,
            'daily_frequency' => $daily,
            'hotspot_stats' => $hotspots,
            'detection_frequency' => $frequency,
            'most_common' => $most,
            'least_common' => $least,
        ];
    }
}
