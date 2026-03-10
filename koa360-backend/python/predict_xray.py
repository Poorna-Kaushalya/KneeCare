import sys
import json
import os
from ultralytics import YOLO

# Acceptable labels from gate model that mean "correct knee x-ray image"
VALID_XRAY_LABELS = {
    "knee x-ray",
    "knee_xray",
    "knee-xray",
    "xray",
    "x-ray",
    "knee",
    "knee radiograph",
    "knee radiography",
}

# Labels that clearly mean invalid / wrong image
INVALID_XRAY_LABELS = {
    "not x-ray",
    "not_xray",
    "not-xray",
    "non xray",
    "non_xray",
    "non-xray",
    "wrong",
    "invalid",
}

# Minimum confidence for gate acceptance
GATE_CONF_THRESHOLD = 0.60


def normalize_label(label: str) -> str:
    return str(label).strip().lower().replace("_", " ").replace("-", " ")


def load_model_safe(model_path: str):
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found: {model_path}")
    return YOLO(model_path)


def run_yolo_prediction(model, image_path: str):
    results = model.predict(source=image_path, verbose=False)
    if not results:
        return {
            "ok": False,
            "error": "No results returned by model"
        }

    r0 = results[0]
    names = getattr(r0, "names", None) or getattr(model, "names", {})

    # YOLO classification result
    if getattr(r0, "probs", None) is not None and r0.probs is not None:
        top_idx = int(r0.probs.top1)
        top_conf = float(r0.probs.top1conf)
        label = names.get(top_idx, str(top_idx)) if isinstance(names, dict) else str(top_idx)

        return {
            "ok": True,
            "type": "classification",
            "label": label,
            "confidence": top_conf,
            "classId": top_idx
        }

    # YOLO detection result
    if getattr(r0, "boxes", None) is not None and r0.boxes is not None and len(r0.boxes) > 0:
        confs = r0.boxes.conf.tolist()
        best_i = int(max(range(len(confs)), key=lambda i: confs[i]))

        cls_id = int(r0.boxes.cls[best_i].item())
        conf = float(r0.boxes.conf[best_i].item())
        label = names.get(cls_id, str(cls_id)) if isinstance(names, dict) else str(cls_id)

        return {
            "ok": True,
            "type": "detection",
            "label": label,
            "confidence": conf,
            "classId": cls_id
        }

    return {
        "ok": True,
        "type": "unknown",
        "label": "No prediction",
        "confidence": 0.0
    }


def is_valid_knee_xray(gate_result: dict) -> bool:
    raw_label = gate_result.get("label", "")
    conf = float(gate_result.get("confidence", 0.0))
    label = normalize_label(raw_label)

    valid_norm = {normalize_label(x) for x in VALID_XRAY_LABELS}
    invalid_norm = {normalize_label(x) for x in INVALID_XRAY_LABELS}

    # Strong invalid class
    if label in invalid_norm:
        return False

    # Accept only known valid class with enough confidence
    if label in valid_norm and conf >= GATE_CONF_THRESHOLD:
        return True

    return False


def format_final_prediction(pred_result: dict):
    raw_label = str(pred_result.get("label", "")).strip()
    conf = float(pred_result.get("confidence", 0.0))
    normalized = normalize_label(raw_label)

    # Map model outputs to user-friendly text
    if normalized in {"normal", "no oa", "no osteoarthritis", "healthy"}:
        display_label = "Normal"
    elif normalized in {"osteoarthritis", "oa", "abnormal", "arthritis"}:
        display_label = "Osteoarthritis"
    else:
        # keep original model label if something else is returned
        display_label = raw_label

    return {
        "ok": True,
        "validImage": True,
        "message": "Valid knee X-ray image",
        "type": pred_result.get("type", "classification"),
        "label": display_label,
        "confidence": conf,
        "classId": pred_result.get("classId", None)
    }


def main():
    try:
        # Usage:
        # python predict_xray.py <gate_model_path> <prediction_model_path> <image_path>
        if len(sys.argv) < 4:
            print(json.dumps({
                "ok": False,
                "error": "Usage: python predict_xray.py <gate_model_path> <prediction_model_path> <image_path>"
            }))
            return

        gate_model_path = sys.argv[1]
        prediction_model_path = sys.argv[2]
        image_path = sys.argv[3]

        if not os.path.exists(image_path):
            print(json.dumps({
                "ok": False,
                "error": f"Image not found: {image_path}"
            }))
            return

        gate_model = load_model_safe(gate_model_path)
        prediction_model = load_model_safe(prediction_model_path)

        # Stage 1: Gate check
        gate_result = run_yolo_prediction(gate_model, image_path)
        if not gate_result.get("ok"):
            print(json.dumps({
                "ok": False,
                "error": "Gate model failed",
                "details": gate_result
            }))
            return

        if not is_valid_knee_xray(gate_result):
            print(json.dumps({
                "ok": False,
                "validImage": False,
                "error": "Wrong image inserted. Please upload a correct knee X-ray image.",
                "gate": {
                    "label": gate_result.get("label"),
                    "confidence": gate_result.get("confidence"),
                    "type": gate_result.get("type")
                }
            }))
            return

        # Stage 2: OA prediction
        pred_result = run_yolo_prediction(prediction_model, image_path)
        if not pred_result.get("ok"):
            print(json.dumps({
                "ok": False,
                "error": "Prediction model failed",
                "details": pred_result
            }))
            return

        print(json.dumps(format_final_prediction(pred_result)))

    except Exception as e:
        print(json.dumps({
            "ok": False,
            "error": str(e)
        }))


if __name__ == "__main__":
    main()