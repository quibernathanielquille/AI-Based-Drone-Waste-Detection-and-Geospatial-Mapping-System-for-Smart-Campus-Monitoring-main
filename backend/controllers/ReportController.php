<?php

class ReportController extends Controller
{
    private Report $model;

    public function __construct()
    {
        parent::__construct();
        $this->model = new Report();
    }

    public function index(): void
    {
        $filters = $_GET;
        $user = $this->getAuthUser();
        if ($user) {
            $filters['generated_by'] = (int) $user['id'];
        }
        Response::success($this->model->paginate($filters));
    }

    public function show(string $id): void
    {
        $report = $this->model->findWithDetails((int) $id);
        if (!$report) {
            Response::error('Report not found', 404);
        }

        $user = $this->getAuthUser();
        if ($user && (int) $report['generated_by'] !== (int) $user['id']) {
            Response::forbidden('You can only view your own reports');
        }

        $filters = [
            'date_from' => $report['date_from'],
            'date_to' => $report['date_to'],
            'waste_category' => $report['waste_category'] ?: null,
        ];
        $summary = $this->model->generateSummary($filters);

        Response::success([
            'report' => $report,
            'summary' => $summary,
        ]);
    }

    public function preview(): void
    {
        $data = $this->getJsonInput();
        $filters = $this->resolveDateFilters($data);
        $summary = $this->model->generateSummary($filters);

        Response::success([
            'filters' => $filters,
            'summary' => $summary,
            'title' => $this->buildReportTitle($data, $filters),
        ]);
    }

    public function generate(): void
    {
        $data = $this->getJsonInput();
        $filters = $this->resolveDateFilters($data);
        $summary = $this->model->generateSummary($filters);
        $title = $data['title'] ?? $this->buildReportTitle($data, $filters);

        $user = $this->getAuthUser();
        $reportId = $this->model->create([
            'generated_by' => $user['id'],
            'title' => $title,
            'report_type' => $data['report_type'] ?? 'custom',
            'date_from' => $filters['date_from'] ?? null,
            'date_to' => $filters['date_to'] ?? null,
            'waste_category' => $filters['waste_category'] ?? null,
            'total_detections' => $summary['total_detections'],
            'summary_json' => json_encode([
                'categories' => $summary['categories'],
                'hotspots' => $summary['hotspots'],
                'avg_confidence' => $summary['avg_confidence'],
            ]),
            'file_format' => $data['file_format'] ?? 'pdf',
            'status' => 'generated',
        ]);

        $this->logActivity('generate', 'reports', "Generated report #{$reportId}");
        Response::success([
            'report_id' => $reportId,
            'title' => $title,
            'filters' => $filters,
            'summary' => $summary,
        ], 'Report generated', 201);
    }

    public function export(): void
    {
        $data = $this->getJsonInput();
        $format = $data['format'] ?? 'csv';
        $filters = $this->resolveDateFilters($data);
        $summary = $this->model->generateSummary($filters);
        $detections = $summary['detections'];

        switch ($format) {
            case 'csv':
                $this->exportCsv($detections);
                break;
            case 'excel':
                $this->exportCsv($detections, 'excel');
                break;
            case 'json':
                Response::success([
                    'filters' => $filters,
                    'summary' => $summary,
                    'title' => $this->buildReportTitle($data, $filters),
                ]);
                break;
            default:
                Response::error('Invalid export format. Use csv, excel, or json.');
        }
    }

    private function resolveDateFilters(array $data): array
    {
        $type = $data['report_type'] ?? 'custom';
        $ref = $data['reference_date'] ?? $data['date_from'] ?? date('Y-m-d');
        $category = !empty($data['waste_category']) ? $data['waste_category'] : null;

        switch ($type) {
            case 'daily':
                return [
                    'report_type' => 'daily',
                    'date_from' => $ref,
                    'date_to' => $ref,
                    'waste_category' => $category,
                ];
            case 'weekly':
                return [
                    'report_type' => 'weekly',
                    'date_from' => date('Y-m-d', strtotime($ref . ' -6 days')),
                    'date_to' => $ref,
                    'waste_category' => $category,
                ];
            case 'monthly':
                return [
                    'report_type' => 'monthly',
                    'date_from' => date('Y-m-01', strtotime($ref)),
                    'date_to' => date('Y-m-t', strtotime($ref)),
                    'waste_category' => $category,
                ];
            default:
                return [
                    'report_type' => 'custom',
                    'date_from' => $data['date_from'] ?? null,
                    'date_to' => $data['date_to'] ?? null,
                    'waste_category' => $category,
                ];
        }
    }

    private function buildReportTitle(array $data, array $filters): string
    {
        if (!empty($data['title'])) {
            return $data['title'];
        }

        $type = ucfirst($filters['report_type'] ?? 'custom');
        $from = $filters['date_from'] ?? '';
        $to = $filters['date_to'] ?? '';

        if ($from && $to && $from === $to) {
            return "{$type} Campus Waste Report — {$from}";
        }

        return "{$type} Campus Waste Report — {$from} to {$to}";
    }

    private function exportCsv(array $detections, string $type = 'csv'): void
    {
        $filename = 'waste_report_' . date('Ymd_His') . '.csv';
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="' . $filename . '"');

        $out = fopen('php://output', 'w');
        fputcsv($out, ['ID', 'Category', 'Latitude', 'Longitude', 'Confidence', 'Date', 'Time', 'Zone', 'Status', 'Hotspot', 'Description']);
        foreach ($detections as $d) {
            fputcsv($out, [
                $d['id'],
                $d['waste_category'],
                $d['latitude'],
                $d['longitude'],
                $d['confidence_score'],
                $d['detection_date'],
                $d['detection_time'],
                $d['zone_name'] ?? '',
                $d['status'] ?? '',
                !empty($d['is_hotspot']) ? 'Yes' : 'No',
                $d['description'] ?? '',
            ]);
        }
        fclose($out);
        exit;
    }
}
