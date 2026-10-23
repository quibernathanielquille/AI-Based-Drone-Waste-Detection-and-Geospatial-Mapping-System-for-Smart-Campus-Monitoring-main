<?php

class DashboardController extends Controller
{
    public function index(): void
    {
        $wasteModel = new WasteDetection();
        $activityModel = new ActivityLog();
        $stats = $wasteModel->getDashboardStats();
        $activities = $activityModel->getRecent(8);
        $wasteLabels = (require __DIR__ . '/../config/waste.php')['labels'];
        $categoryLabel = fn(string $cat) => $wasteLabels[strtolower($cat)] ?? strtoupper($cat);

        $chartData = [
            'pie' => array_map(fn($c) => [
                'label' => $categoryLabel($c['waste_category']),
                'waste_category' => $c['waste_category'],
                'value' => (int) $c['count'],
            ], $stats['categories']),
            'bar' => $stats['categories'],
            'line' => $wasteModel->getAnalyticsData()['daily_frequency'],
            'area' => $wasteModel->getAnalyticsData()['monthly_trends'],
        ];

        Response::success([
            'stats' => [
                'total_detections' => (int) $stats['total'],
                'today_detections' => (int) $stats['today'],
                'active_hotspots' => (int) $stats['hotspots'],
                'waste_categories' => count($stats['categories']),
            ],
            'categories' => $stats['categories'],
            'recent_detections' => $stats['recent'],
            'recent_activities' => $activities,
            'charts' => $chartData,
            'map_points' => array_map(fn($d) => [
                'id' => $d['id'],
                'lat' => (float) $d['latitude'],
                'lng' => (float) $d['longitude'],
                'category' => $d['waste_category'],
            ], $stats['recent']),
        ]);
    }
}
