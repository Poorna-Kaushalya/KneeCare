import os
import sys
import json
import numpy as np
import pandas as pd
import joblib
from PIL import Image

import tensorflow as tf
from tensorflow.keras.applications.densenet import preprocess_input as densenet_preprocess

# =========================
# PATHS
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_DIR = os.path.join(BASE_DIR, "..", "models")

XRAY_MODEL_PATH = os.path.join(MODEL_DIR, "efficientnetB0_001.keras")

# LOAD FULL PIPELINE (preprocess + xgb)
TABULAR_PIPELINE_PATH = os.path.join(MODEL_DIR, "koa_grade_xgb_newly.pkl")

IMG_SIZE = (224, 224)
CLASS_LABELS = ["KL0", "KL1", "KL2", "KL3", "KL4"]

# RAW columns required (your NOT-REMOVED list)
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


def safe_float(x, default=np.nan):
    try:
        if x is None:
            return default
        s = str(x).strip()
        if s == "":
            return default
        return float(s)
    except:
        return default

def safe_str(x):
    if x is None:
        return ""
    return str(x).strip()

def preprocess_image(image_path: str) -> np.ndarray:
    img = Image.open(image_path).convert("RGB")
    img = img.resize(IMG_SIZE)
    arr = np.array(img).astype(np.float32)
    arr = np.expand_dims(arr, axis=0)
    arr = densenet_preprocess(arr)
    return arr

def build_raw_df(tabular: dict) -> pd.DataFrame:
    """
    Build a 1-row DataFrame with EXACT RAW columns used during training.
    Missing filled with NaN (for numeric) or "" (for categorical).
    """
    row = {}
    for c in RAW_COLS:
        if c in NUMERIC_COLS:
            row[c] = safe_float(tabular.get(c, ""), np.nan)
        else:
            row[c] = safe_str(tabular.get(c, ""))

    return pd.DataFrame([row], columns=RAW_COLS)


def main():
    raw = sys.stdin.read()
    data = json.loads(raw)

    image_path = data["image_path"]
    tabular = data.get("tabular", {})

    # Load models
    xray_model = tf.keras.models.load_model(XRAY_MODEL_PATH, compile=False)
    tab_pipeline = joblib.load(TABULAR_PIPELINE_PATH)

    # ---- XRAY ----
    x_img = preprocess_image(image_path)
    xray_probs = xray_model.predict(x_img, verbose=0)[0].astype(np.float32)

    # ---- TABULAR (PIPELINE DOES EVERYTHING) ----
    X_tab_raw = build_raw_df(tabular)

    if hasattr(tab_pipeline, "predict_proba"):
        tab_probs = tab_pipeline.predict_proba(X_tab_raw)[0].astype(np.float32)
    else:
        pred_class = int(tab_pipeline.predict(X_tab_raw)[0])
        tab_probs = np.zeros(len(CLASS_LABELS), dtype=np.float32)
        tab_probs[pred_class] = 1.0

    # ---- ALIGN ----
    n = min(len(xray_probs), len(tab_probs), len(CLASS_LABELS))
    xray_probs = xray_probs[:n]
    tab_probs = tab_probs[:n]
    labels = CLASS_LABELS[:n]

    # ---- FUSION ----
    fused_probs = (xray_probs + tab_probs) / 2.0
    fused_idx = int(np.argmax(fused_probs))

    result = {
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

if __name__ == "__main__":
    main()
