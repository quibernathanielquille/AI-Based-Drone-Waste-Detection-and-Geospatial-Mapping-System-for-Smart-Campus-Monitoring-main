from config import GARBAGE_TO_CATEGORY, PLASTIC_TO_CATEGORY


def map_detection(class_name: str, model_key: str) -> dict:
    name = str(class_name).strip()
    if model_key == "plastic":
        category = PLASTIC_TO_CATEGORY.get(name, "plastic")
        label = f"Plastic ({name})"
    else:
        upper = name.upper()
        category = GARBAGE_TO_CATEGORY.get(upper, upper.lower())
        label = upper

    return {
        "class_name": name,
        "label": label,
        "category": category,
    }
