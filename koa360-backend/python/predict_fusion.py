import os
import sys
import json
import numpy as np
import pandas as pd
import joblib
from PIL import Image

import tensorflow as tf
from tensorflow.keras.applications.efficientnet import preprocess_input as efficientnet_preprocess
from ultralytics import YOLO

# PATHS
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "..", "models")

# Gate model (YOLO classifier)
GATE_MODEL_PATH = os.path.join(MODEL_DIR, "gate.pt")

# X-ray severity model
XRAY_MODEL_PATH = os.path.join(MODEL_DIR, "efficientnetB0_001.keras")

# Tabular pipeline
TABULAR_PIPELINE_PATH = os.path.join(MODEL_DIR, "koa_grade_xgb_newly.pkl")

IMG_SIZE = (224, 224)
CLASS_LABELS = ["KL0", "KL1", "KL2", "KL3", "KL4"]

# Acceptable X-ray class names from gate model
XRAY_LABEL_ALIASES = {
    "xray",
    "x-ray",
    "knee_xray",
    "knee xray",
    "knee-xray",
    "knee_x-ray",
    "knee x-ray",
    "knee",
    "knee_x_ray"
}

# RAW columns 
RAW_COLS = [
    "age",
    "bmi",
    "cholesterol",
    "crp",
    "cs",
    "do_you_currently_experience_knee_pain",
    "do_you_experience_swelling_in_your_knees",
    "do_you_find_difficulty_in_performing_these_activities_(check_all_that_apply)",
    "does_the_patient_has_diabetes",
    "does_the_patient_has_hypertension",
    "does_the_patient_has_obesity",
    "does_the_patient_have_any_other_health_conditions_or_risk_factors_that_may_contribute_to_knee_osteoarthritis",
    "esr",
    "fbs",
    "gender",
    "have_you_had_any_previous_knee_injuries_(acl_tear,_meniscus_tear,_fracture,_etc.)",
    "height",
    "occupation",
    "pain_score",
    "physical_activity_level",
    "platelets",
    "rf",
    "stiffness",
    "wbc",
    "weight",
    "what_are_the_suggested_or_ongoing_treatments_for_the_patients_current_condition"
]

NUMERIC_COLS = [
    "age", "height", "weight", "pain_score", "fbs", "wbc", "platelets",
    "cs", "cholesterol", "crp", "esr", "rf", "bmi"
]

# HELPERS
def safe_float(x, default=np.nan):
    try:
        if x is None:
            return default
        s = str(x).strip()
        if s == "":
            return default
        return float(s)
    except Exception:
        return default


def safe_str(x):
    if x is None:
        return ""
    return str(x).strip()


def normalize_label(label: str) -> str:
    if label is None:
        return ""
    return str(label).strip().lower().replace("__", "_")


def preprocess_image(image_path: str) -> np.ndarray:
    img = Image.open(image_path).convert("RGB")
    img = img.resize(IMG_SIZE)
    arr = np.array(img).astype(np.float32)
    arr = np.expand_dims(arr, axis=0)
    arr = efficientnet_preprocess(arr)
    return arr


def build_raw_df(tabular: dict) -> pd.DataFrame:
    row = {}
    for c in RAW_COLS:
        if c in NUMERIC_COLS:
            row[c] = safe_float(tabular.get(c, ""), np.nan)
        else:
            row[c] = safe_str(tabular.get(c, ""))
    return pd.DataFrame([row], columns=RAW_COLS)


def run_gate_check(gate_model, image_path: str):
    """
    Return structured gate prediction.
    Works for YOLOv8 classification model.
    """
    results = gate_model.predict(source=image_path, verbose=False)

    if not results:
        return {
            "ok": False,
            "error": "Gate model returned no result"
        }

    result = results[0]

    if result.probs is None:
        return {
            "ok": False,
            "error": "Gate model does not contain classification probabilities"
        }

    probs = result.probs.data.cpu().numpy().astype(np.float32)
    top1_idx = int(result.probs.top1)
    top1_conf = float(result.probs.top1conf.item())

    names = result.names if hasattr(result, "names") else gate_model.names
    pred_label = names[top1_idx] if isinstance(names, dict) else str(top1_idx)
    pred_label_norm = normalize_label(pred_label)

    is_xray = pred_label_norm in XRAY_LABEL_ALIASES

    all_probs = []
    if isinstance(names, dict):
        for i in range(len(probs)):
            all_probs.append({
                "index": i,
                "label": str(names.get(i, i)),
                "prob": float(probs[i])
            })

    return {
        "ok": True,
        "pred_index": top1_idx,
        "pred_label": pred_label,
        "pred_label_normalized": pred_label_norm,
        "confidence": top1_conf,
        "is_xray": is_xray,
        "all_probs": all_probs
    }


def main():
    try:
        raw = sys.stdin.read()
        data = json.loads(raw)

        image_path = data["image_path"]
        tabular = data.get("tabular", {})

        if not os.path.exists(image_path):
            print(json.dumps({
                "ok": False,
                "error": f"Image not found: {image_path}"
            }))
            return

        if not os.path.exists(GATE_MODEL_PATH):
            print(json.dumps({
                "ok": False,
                "error": f"Gate model not found: {GATE_MODEL_PATH}"
            }))
            return

        if not os.path.exists(XRAY_MODEL_PATH):
            print(json.dumps({
                "ok": False,
                "error": f"X-ray model not found: {XRAY_MODEL_PATH}"
            }))
            return

        if not os.path.exists(TABULAR_PIPELINE_PATH):
            print(json.dumps({
                "ok": False,
                "error": f"Tabular pipeline not found: {TABULAR_PIPELINE_PATH}"
            }))
            return

        # LOAD MODELS
        gate_model = YOLO(GATE_MODEL_PATH)
        xray_model = tf.keras.models.load_model(XRAY_MODEL_PATH, compile=False)
        tab_pipeline = joblib.load(TABULAR_PIPELINE_PATH)

        # GATE CHECK
        gate_result = run_gate_check(gate_model, image_path)

        if not gate_result.get("ok", False):
            print(json.dumps({
                "ok": False,
                "error": gate_result.get("error", "Gate prediction failed"),
                "stage": "gate"
            }))
            return

        if not gate_result.get("is_xray", False):
            print(json.dumps({
                "ok": False,
                "stage": "gate",
                "message": "Wrong image uploaded. Please upload a valid knee X-ray image.",
                "gate": gate_result
            }))
            return

        # XRAY PREDICTION
        x_img = preprocess_image(image_path)
        xray_probs = xray_model.predict(x_img, verbose=0)[0].astype(np.float32)

        # TABULAR PREDICTION
        X_tab_raw = build_raw_df(tabular)

        if hasattr(tab_pipeline, "predict_proba"):
            tab_probs = tab_pipeline.predict_proba(X_tab_raw)[0].astype(np.float32)
        else:
            pred_class = int(tab_pipeline.predict(X_tab_raw)[0])
            tab_probs = np.zeros(len(CLASS_LABELS), dtype=np.float32)
            tab_probs[pred_class] = 1.0

        n = min(len(xray_probs), len(tab_probs), len(CLASS_LABELS))
        xray_probs = xray_probs[:n]
        tab_probs = tab_probs[:n]
        labels = CLASS_LABELS[:n]

        # FUSION
        fused_probs = (xray_probs + tab_probs) / 2.0
        fused_idx = int(np.argmax(fused_probs))

        result = {
            "ok": True,
            "stage": "fusion",
            "gate": gate_result,
            "xray": {
                "pred_index": int(np.argmax(xray_probs)),
                "pred_label": labels[int(np.argmax(xray_probs))],
                "probs": [float(p) for p in xray_probs],
            },
            "tabular": {
                "pred_index": int(np.argmax(tab_probs)),
                "pred_label": labels[int(np.argmax(tab_probs))],
                "probs": [float(p) for p in tab_probs],
            },
            "fusion": {
                "pred_index": fused_idx,
                "pred_label": labels[fused_idx],
                "probs": [float(p) for p in fused_probs],
            }
        }

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({
            "ok": False,
            "error": str(e),
            "stage": "python_exception"
        }))


if __name__ == "__main__":
    main()