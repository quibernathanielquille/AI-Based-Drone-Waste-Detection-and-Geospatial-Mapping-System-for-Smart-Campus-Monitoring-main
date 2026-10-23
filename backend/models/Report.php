<?php

class Report extends Model
{
    protected string $table = 'reports';

    public function paginate(array $filters = []): array
    {
        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = min(50, max(5, (int) ($filters['per_page'] ?? 10)));
        $offset = ($page - 1) * $perPage;
        $params = [];
        $where = ['r.deleted_at IS NULL'];

        if (!empty($filters['search'])) {
            $where[] = 'r.title LIKE :search';
            $params['search'] = '%' . $filters['search'] . '%';
        }
        if (!empty($filters['report_type'])) {
            $where[] = 'r.report_type = :type';
            $params['type'] = $filters['report_type'];
        }
        if (!empty($filters['waste_category'])) {
            $where[] = 'r.waste_category = :category';
            $params['category'] = $filters['waste_category'];
        }
        if (!empty($filters['date_from'])) {
            $where[] = 'r.date_from >= :date_from';
            $params['date_from'] = $filters['date_from'];
        }
        if (!empty($filters['date_to'])) {
            $where[] = 'r.date_to <= :date_to';
            $params['date_to'] = $filters['date_to'];
        }
        if (!empty($filters['generated_by'])) {
            $where[] = 'r.generated_by = :generated_by';
            $params['generated_by'] = (int) $filters['generated_by'];
        }

        $sort = in_array($filters['sort'] ?? '', ['title', 'created_at', 'total_detections'])
            ? $filters['sort'] : 'created_at';
        $order = strtoupper($filters['order'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';

        $whereClause = implode(' AND ', $where);
        $countSql = "SELECT COUNT(*) as total FROM reports r WHERE {$whereClause}";
        $total = (int) $this->queryOne($countSql, $params)['total'];

        $sql = "SELECT r.*, CONCAT(u.first_name, ' ', u.last_name) as generated_by_name
                FROM reports r JOIN users u ON r.generated_by = u.id
                WHERE {$whereClause}
                ORDER BY r.{$sort} {$order}
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
        $sql = "SELECT r.*, CONCAT(u.first_name, ' ', u.last_name) as generated_by_name
                FROM reports r
                JOIN users u ON r.generated_by = u.id
                WHERE r.id = :id AND r.deleted_at IS NULL";
        return $this->queryOne($sql, ['id' => $id]);
    }

    public function generateSummary(array $filters): array
    {
        $params = [];
        $where = ['deleted_at IS NULL'];

        if (!empty($filters['date_from'])) {
            $where[] = 'detection_date >= :date_from';
            $params['date_from'] = $filters['date_from'];
        }
        if (!empty($filters['date_to'])) {
            $where[] = 'detection_date <= :date_to';
            $params['date_to'] = $filters['date_to'];
        }
        if (!empty($filters['waste_category'])) {
            $where[] = 'waste_category = :category';
            $params['category'] = $filters['waste_category'];
        }

        $whereClause = implode(' AND ', $where);
        $total = (int) $this->queryOne(
            "SELECT COUNT(*) as c FROM waste_detections WHERE {$whereClause}",
            $params
        )['c'];
        $categories = $this->query(
            "SELECT waste_category, COUNT(*) as count FROM waste_detections
             WHERE {$whereClause} GROUP BY waste_category ORDER BY count DESC",
            $params
        );
        $hotspots = (int) ($this->queryOne(
            "SELECT COUNT(*) as c FROM waste_detections WHERE {$whereClause} AND is_hotspot = 1",
            $params
        )['c'] ?? 0);
        $avgRow = $this->queryOne(
            "SELECT ROUND(AVG(confidence_score), 2) as avg_conf FROM waste_detections WHERE {$whereClause}",
            $params
        );
        $detections = $this->query(
            "SELECT id, waste_category, latitude, longitude, confidence_score,
                    detection_date, detection_time, zone_name, status, is_hotspot, description
             FROM waste_detections WHERE {$whereClause}
             ORDER BY detection_date DESC, detection_time DESC LIMIT 500",
            $params
        );

        return [
            'total_detections' => $total,
            'categories' => $categories,
            'hotspots' => $hotspots,
            'avg_confidence' => $avgRow['avg_conf'] ?? 0,
            'detections' => $detections,
        ];
    }
}
