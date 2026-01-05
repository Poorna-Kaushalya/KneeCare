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
TABULAR_MODEL_PATH = os.path.join(MODEL_DIR, "xgboost.pkl")

# ✅ NEW: saved from training notebook
FEATURES_JSON_PATH = os.path.join(MODEL_DIR, "xgb_feature_names.json")
SCALER_PATH = os.path.join(MODEL_DIR, "xgb_scaler.pkl")

IMG_SIZE = (224, 224)
CLASS_LABELS = ["KL0", "KL1", "KL2", "KL3", "KL4"]

# These are the numeric columns you standardized during training
NUM_COLS = [
    "age", "height", "weight", "pain_score", "fbs", "wbc", "platelets",
    "cs", "cholesterol", "crp", "esr", "rf", "fbc", "bmi"
]

# =========================
# UTILS
# =========================
def safe_float(x, default=0.0):
    try:
        if x is None or x == "":
            return default
        return float(x)
    except:
        return default

def to_bin(v):
    if v is None:
        return 0
    s = str(v).strip().lower()
    if s in ["1", "yes", "y", "true"]:
        return 1
    if s in ["0", "no", "n", "false", ""]:
        return 0
    try:
        return 1 if float(s) > 0 else 0
    except:
        return 0

def load_feature_names():
    if not os.path.exists(FEATURES_JSON_PATH):
        raise FileNotFoundError(
            f"Missing: {FEATURES_JSON_PATH}. "
            "Create it in training: json.dump(list(X.columns), ...)"
        )
    with open(FEATURES_JSON_PATH, "r") as f:
        feats = json.load(f)
    if not isinstance(feats, list) or len(feats) == 0:
        raise ValueError("xgb_feature_names.json is empty/invalid.")
    return feats

# =========================
# IMAGE PREPROCESS
# =========================
def preprocess_image(image_path: str) -> np.ndarray:
    img = Image.open(image_path).convert("RGB")
    img = img.resize(IMG_SIZE)
    arr = np.array(img).astype(np.float32)
    arr = np.expand_dims(arr, axis=0)
    arr = densenet_preprocess(arr)
    return arr

# =========================
# TABULAR (XGBOOST) PREPROCESS
# =========================
def build_xgb_input(feature_names, tabular: dict) -> pd.DataFrame:
    """
    Build a single-row DataFrame with EXACT training features (104).
    Missing columns filled with 0.
    """

    # Start with all zeros
    row = {f: 0.0 for f in feature_names}

    # --- Fill base numeric/binary columns if they exist (some may be dummy'ed in training) ---
    for col in row.keys():
        # If training kept some raw numeric columns, populate them:
        if col in ["age","height","weight","pain_score","fbs","wbc","platelets","cs","cholesterol","crp","esr","rf","fbc","bmi"]:
            row[col] = safe_float(tabular.get(col, ""), 0.0)

        # If training kept some raw binary columns, populate them:
        elif col in [
            "knee_pain","knee_pain_in_past_week","stifness_after_resting",
            "knee_injuries","swelling","difficulty_in_performing",
            "family_history","obesity","diabetes","hypertension",
            "vitaminD_deficiency","rheumatoid_arthritis"
        ]:
            row[col] = float(to_bin(tabular.get(col, "")))

    # --- One-hot fields (these MUST match your training dummy column names) ---
    # Example: living_environment_Urban, occupation_No, gender_Female etc.

    gender = str(tabular.get("gender", "")).strip()  # if you send Male/Female OR 0/1
    occupation = str(tabular.get("occupation", "")).strip()
    pal = str(tabular.get("physical_activity_level", "")).strip()
    living = str(tabular.get("living_environment", "")).strip()

    # Try common patterns:
    candidates = [
        f"gender_{gender}",
        f"occupation_{occupation}",
        f"physical_activity_level_{pal}",
        f"living_environment_{living}",
    ]
    for c in candidates:
        if c in row and c.split("_", 1)[1] != "":
            row[c] = 1.0

    # If you send gender as 0/1 codes, map to names if your dummies used names:
    if gender in ["0", "1"]:
        if gender == "0" and "gender_Male" in row:
            row["gender_Male"] = 1.0
        if gender == "1" and "gender_Female" in row:
            row["gender_Female"] = 1.0

    X = pd.DataFrame([row], columns=feature_names)
    X = X.apply(pd.to_numeric, errors="coerce").fillna(0)
    return X

def apply_scaler_if_available(X: pd.DataFrame):
    """
    Apply the same StandardScaler used in training to the numeric columns that exist.
    """
    if not os.path.exists(SCALER_PATH):
        # If you didn't save scaler, skip (but predictions may differ)
        return X

    scaler = joblib.load(SCALER_PATH)

    # Only scale numeric columns that actually exist in current feature set
    present = [c for c in NUM_COLS if c in X.columns]
    if len(present) > 0:
        X[present] = scaler.transform(X[present])

    return X

# =========================
# MAIN
# =========================
def main():
    raw = sys.stdin.read()
    data = json.loads(raw)

    image_path = data["image_path"]
    tabular = data.get("tabular", {})

    # Load models
    xray_model = tf.keras.models.load_model(XRAY_MODEL_PATH, compile=False)
    tab_model = joblib.load(TABULAR_MODEL_PATH)

    # Load feature list (104)
    feature_names = load_feature_names()

    # ---- XRAY ----
    x_img = preprocess_image(image_path)
    xray_probs = xray_model.predict(x_img, verbose=0)[0]
    xray_probs = np.array(xray_probs, dtype=np.float32)

    # ---- TABULAR ----
    X_tab = build_xgb_input(feature_names, tabular)
    X_tab = apply_scaler_if_available(X_tab)

    if hasattr(tab_model, "predict_proba"):
        tab_probs = tab_model.predict_proba(X_tab)[0]
    else:
        pred_class = int(tab_model.predict(X_tab)[0])
        tab_probs = np.zeros(len(CLASS_LABELS), dtype=np.float32)
        tab_probs[pred_class] = 1.0

    tab_probs = np.array(tab_probs, dtype=np.float32)

    # ---- ALIGN CLASSES ----
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
