from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

GARBAGE_DATASET = ROOT / "GARBAGE CLASSIFICATION"
PLASTIC_DATASET = ROOT / "Plastic_trained"
ML_DIR = Path(__file__).resolve().parent
MODELS_DIR = ML_DIR / "models"

# Weights: check ml_service/ first (where you uploaded), then models/
def _weight_path(name: str) -> Path:
    for p in (ML_DIR / name, MODELS_DIR / name):
        if p.exists():
            return p
    return ML_DIR / name

GARBAGE_WEIGHTS = _weight_path("garbage_best.pt")
PLASTIC_WEIGHTS = _weight_path("plastic_best.pt")

GARBAGE_CLASSES = ["BIODEGRADABLE", "CARDBOARD", "GLASS", "METAL", "PAPER", "PLASTIC"]
PLASTIC_CLASSES = ["Bag", "Bottle", "Cup"]

# Map YOLO class names to system waste_category slugs
GARBAGE_TO_CATEGORY = {
    "BIODEGRADABLE": "biodegradable",
    "CARDBOARD": "cardboard",
    "GLASS": "glass",
    "METAL": "metal",
    "PAPER": "paper",
    "PLASTIC": "plastic",
}

PLASTIC_TO_CATEGORY = {
    "Bag": "plastic",
    "Bottle": "plastic",
    "Cup": "plastic",
}

CONFIDENCE_THRESHOLD = 0.35
