<?php

class WasteDetectionController extends Controller
{
    private WasteDetection $model;

    public function __construct()
    {
        parent::__construct();
        $this->model = new WasteDetection();
    }

    public function index(): void
    {
        $filters = $_GET;
        Response::success($this->model->paginate($filters));
    }

    public function userStats(): void
    {
        Response::success($this->model->getByUserStats());
    }

    public function show(string $id): void
    {
        $item = $this->model->findWithDetails((int) $id);
        if (!$item) {
            Response::notFound('Detection not found');
        }
        Response::success($item);
    }

    public function store(): void
    {
        $data = $this->prepareData($_POST);
        if (!$this->validateDetection($data)) {
            return;
        }

        $imagePath = $this->handleUpload();
        if ($imagePath) {
            $data['waste_image'] = $imagePath;
        }

        $user = $this->getAuthUser();
        $data['detected_by'] = $user['id'] ?? null;

        $id = $this->model->create($data);
        $this->logActivity('create', 'waste_detections', "Created detection #{$id}");
        Response::success($this->model->findWithDetails($id), 'Detection created', 201);
    }

    public function update(string $id): void
    {
        $existing = $this->model->find((int) $id);
        if (!$existing) {
            Response::notFound('Detection not found');
        }

        $data = $this->prepareData($_POST);
        if (!$this->validateDetection($data, false)) {
            return;
        }

        $imagePath = $this->handleUpload();
        if ($imagePath) {
            $data['waste_image'] = $imagePath;
        }

        $this->model->update((int) $id, $data);
        $this->logActivity('update', 'waste_detections', "Updated detection #{$id}");
        Response::success($this->model->findWithDetails((int) $id), 'Detection updated');
    }

    public function destroy(string $id): void
    {
        if (!$this->model->find((int) $id)) {
            Response::notFound('Detection not found');
        }
        $this->model->delete((int) $id);
        $this->logActivity('delete', 'waste_detections', "Deleted detection #{$id}");
        Response::success(null, 'Detection deleted');
    }

    private function prepareData(array $input): array
    {
        return array_filter([
            'waste_category' => $input['waste_category'] ?? null,
            'latitude' => $input['latitude'] ?? null,
            'longitude' => $input['longitude'] ?? null,
            'confidence_score' => $input['confidence_score'] ?? null,
            'detection_date' => $input['detection_date'] ?? null,
            'detection_time' => $input['detection_time'] ?? null,
            'description' => $input['description'] ?? null,
            'zone_name' => $input['zone_name'] ?? null,
            'is_hotspot' => isset($input['is_hotspot']) ? (int) $input['is_hotspot'] : null,
            'status' => $input['status'] ?? null,
        ], fn($v) => $v !== null && $v !== '');
    }

    private function validateDetection(array $data, bool $isCreate = true): bool
    {
        $rules = [
            'waste_category' => $isCreate ? 'required' : 'nullable',
            'latitude' => $isCreate ? 'required|numeric' : 'nullable|numeric',
            'longitude' => $isCreate ? 'required|numeric' : 'nullable|numeric',
            'confidence_score' => $isCreate ? 'required|numeric' : 'nullable|numeric',
            'detection_date' => $isCreate ? 'required' : 'nullable',
            'detection_time' => $isCreate ? 'required' : 'nullable',
        ];

        if (!$this->validator->validate($data, $rules)) {
            Response::error('Validation failed', $this->validator->errors(), 422);
            return false;
        }
        return true;
    }

    private function handleUpload(): ?string
    {
        if (empty($_FILES['waste_image']) || $_FILES['waste_image']['error'] !== UPLOAD_ERR_OK) {
            return null;
        }

        $config = require __DIR__ . '/../config/app.php';
        $file = $_FILES['waste_image'];

        if ($file['size'] > $config['max_upload_size']) {
            Response::error('File too large', null, 422);
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mime, $config['allowed_image_types'], true)) {
            Response::error('Invalid file type', null, 422);
        }

        if (!is_dir($config['upload_path'])) {
            mkdir($config['upload_path'], 0755, true);
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid('waste_', true) . '.' . strtolower($ext);
        $path = $config['upload_path'] . $filename;

        if (!move_uploaded_file($file['tmp_name'], $path)) {
            Response::error('Upload failed', null, 500);
        }

        return $config['upload_url'] . $filename;
    }
}
