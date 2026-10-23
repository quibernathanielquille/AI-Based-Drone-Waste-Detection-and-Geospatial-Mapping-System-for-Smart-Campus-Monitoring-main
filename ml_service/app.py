import base64
import io
from pathlib import Path

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from ultralytics import YOLO

from class_mapper import map_detection
from config import (
    CONFIDENCE_THRESHOLD,
    GARBAGE_DATASET,
    GARBAGE_WEIGHTS,
    MODELS_DIR,
    PLASTIC_DATASET,
    PLASTIC_WEIGHTS,
)

app = FastAPI(title="Smart Campus YOLO Detection Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

loaded_models: dict[str, YOLO] = {}


def _resolve_weights(model_key: str) -> str:
    preferred = PLASTIC_WEIGHTS if model_key == "plastic" else GARBAGE_WEIGHTS
    if preferred.exists():
        return str(preferred)

    ml_dir = Path(__file__).resolve().parent
    for name in ("garbage_best.pt", "plastic_best.pt"):
        candidate = ml_dir / name
        if model_key == "garbage" and name == "garbage_best.pt" and candidate.exists():
            return str(candidate)
        if model_key == "plastic" and name == "plastic_best.pt" and candidate.exists():
            return str(candidate)

    search_roots = [MODELS_DIR, ml_dir, PLASTIC_DATASET if model_key == "plastic" else GARBAGE_DATASET]
    for root in search_roots:
        if not root.exists():
            continue
        for pt in sorted(root.rglob("best.pt"), reverse=True):
            return str(pt)

    label = "Plastic" if model_key == "plastic" else "Garbage"
    raise FileNotFoundError(
        f"{label} model not found. Place {label.lower()}_best.pt in ml_service/ folder."
    )


def get_model(model_key: str) -> YOLO:
    if model_key not in loaded_models:
        loaded_models[model_key] = YOLO(_resolve_weights(model_key))
    return loaded_models[model_key]


def _image_to_numpy(data: bytes) -> np.ndarray:
    image = Image.open(io.BytesIO(data)).convert("RGB")
    return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)


def _encode_annotated(result) -> str:
    plotted = result.plot()
    plotted_rgb = cv2.cvtColor(plotted, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(plotted_rgb)
    buffer = io.BytesIO()
    pil_img.save(buffer, format="JPEG", quality=85)
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{encoded}"


def _parse_results(results, model_key: str, threshold: float) -> list[dict]:
    detections = []
    result = results[0]
    if result.boxes is None:
        return detections

    names = result.names
    for box in result.boxes:
        conf = float(box.conf[0])
        if conf < threshold:
            continue
        cls_id = int(box.cls[0])
        class_name = names.get(cls_id, str(cls_id))
        mapped = map_detection(class_name, model_key)
        xyxy = box.xyxy[0].tolist()
        detections.append({
            **mapped,
            "confidence": round(conf * 100, 2),
            "bbox": [round(v, 2) for v in xyxy],
            "model": model_key,
        })

    detections.sort(key=lambda d: d["confidence"], reverse=True)
    return detections


@app.get("/health")
def health():
    return {
        "status": "ok",
        "models_loaded": list(loaded_models.keys()),
        "garbage_weights": GARBAGE_WEIGHTS.exists(),
        "plastic_weights": PLASTIC_WEIGHTS.exists(),
        "garbage_path": str(GARBAGE_WEIGHTS) if GARBAGE_WEIGHTS.exists() else None,
        "plastic_path": str(PLASTIC_WEIGHTS) if PLASTIC_WEIGHTS.exists() else None,
    }


@app.get("/models")
def models():
    garbage_ready = GARBAGE_WEIGHTS.exists() or any(GARBAGE_DATASET.rglob("best.pt"))
    plastic_ready = PLASTIC_WEIGHTS.exists() or any(PLASTIC_DATASET.rglob("best.pt"))
    return {
        "models": [
            {
                "id": "garbage",
                "name": "Garbage Classification",
                "classes": ["BIODEGRADABLE", "CARDBOARD", "GLASS", "METAL", "PAPER", "PLASTIC"],
                "ready": garbage_ready,
            },
            {
                "id": "plastic",
                "name": "Plastic Detection (Bag / Bottle / Cup)",
                "classes": ["Bag", "Bottle", "Cup"],
                "ready": plastic_ready,
            },
        ]
    }


@app.post("/detect")
async def detect(
    image: UploadFile = File(...),
    model: str = Form("garbage"),
    confidence: float = Form(CONFIDENCE_THRESHOLD),
):
    model_key = "plastic" if model == "plastic" else "garbage"
    data = await image.read()
    frame = _image_to_numpy(data)

    try:
        yolo = get_model(model_key)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    results = yolo(frame, verbose=False)
    detections = _parse_results(results, model_key, confidence)
    annotated = _encode_annotated(results[0]) if len(results) else None

    return {
        "success": True,
        "model": model_key,
        "detections": detections,
        "best": detections[0] if detections else None,
        "annotated_image": annotated,
        "count": len(detections),
    }


if __name__ == "__main__":
    import uvicorn

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
