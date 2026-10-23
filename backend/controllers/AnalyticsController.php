<?php

class AnalyticsController extends Controller
{
    public function index(): void
    {
        $model = new WasteDetection();
        $data = $model->getAnalyticsData();

        $wasteConfig = require __DIR__ . '/../config/waste.php';
        $labels = $wasteConfig['labels'];
        $categoryLabel = fn(?string $cat) => $labels[strtolower((string) $cat)] ?? strtoupper((string) $cat);

        $insights = [];
        if ($data['most_common']) {
            $insights[] = 'Most detected waste type is ' . $categoryLabel($data['most_common']['waste_category'])
                . ' with ' . $data['most_common']['count'] . ' detections.';
        }
        if ($data['least_common']) {
            $insights[] = 'Least detected type is ' . $categoryLabel($data['least_common']['waste_category'])
                . ' with ' . $data['least_common']['count'] . ' detections.';
        }
        if (!empty($data['hotspot_stats'])) {
            $insights[] = 'Top hotspot zone: ' . ($data['hotspot_stats'][0]['zone_name'] ?? 'N/A');
        }

        Response::success([
            'summary' => [
                'most_common' => $data['most_common'],
                'least_common' => $data['least_common'],
                'total_categories' => count($data['by_category']),
            ],
            'charts' => [
                'pie' => $data['by_category'],
                'bar' => $data['hotspot_stats'],
                'line' => $data['daily_frequency'],
                'area' => $data['monthly_trends'],
            ],
            'hotspot_stats' => $data['hotspot_stats'],
            'detection_frequency' => $data['detection_frequency'],
            'monthly_trends' => $data['monthly_trends'],
            'insights' => $insights,
        ]);
    }
}
