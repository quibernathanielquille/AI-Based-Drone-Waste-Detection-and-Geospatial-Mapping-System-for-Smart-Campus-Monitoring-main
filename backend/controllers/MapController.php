<?php

class MapController extends Controller
{
    public function detections(): void
    {
        $model = new WasteDetection();
        $filters = $_GET;
        $detections = $model->getForMap($filters);

        $config = require __DIR__ . '/../config/app.php';
        $settings = new Setting();
        $mapSettings = $settings->getByUser(null, 'system');

        Response::success([
            'detections' => $detections,
            'map_config' => [
                'lat' => (float) ($mapSettings['default_map_lat'] ?? 7.3135278),
                'lng' => (float) ($mapSettings['default_map_lng'] ?? 125.6703333),
                'zoom' => (int) ($mapSettings['default_map_zoom'] ?? 16),
                'campus_name' => $mapSettings['campus_name'] ?? 'Davao del Norte State College (DNSC)',
            ],
        ]);
    }
}
