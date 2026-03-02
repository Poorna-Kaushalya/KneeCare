# python/predict_vag_severity.py
import sys, json, os
import pandas as pd
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# Your rule-based bundle
BUNDLE_PATH = os.path.join(MODELS_DIR, "best_ruled_based.pkl")

def load_artifacts():
    if not os.path.exists(BUNDLE_PATH):
        raise FileNotFoundError(f"Rule bundle not found: {BUNDLE_PATH}")
    bundle = joblib.load(BUNDLE_PATH)
    return bundle["model"], bundle["label_encoder"], bundle["feature_cols"]

model, encoder, feature_cols = load_artifacts()

def safe_float(v, default=0.0):
    try:
        if v is None:
            return float(default)
        return float(v)
    except Exception:
        return float(default)

payload = json.loads(sys.stdin.read() or "{}")

aligned = payload.get("avg_microphone_features_aligned") or {}

features_all = {
    "rms_amplitude": safe_float(aligned.get("rms_amplitude"), 0.0),
    "spectral_entropy": safe_float(aligned.get("spectral_entropy"), 0.0),
    "zero_crossing_rate": safe_float(aligned.get("zero_crossing_rate"), 0.0),
    "mean_frequency": safe_float(aligned.get("mean_frequency"), 0.0),

    # IMPORTANT: keep same spelling you trained with
    "knee_tempurarture": safe_float(payload.get("avg_knee_tempurarture"), 0.0),
}

# exact order
X = pd.DataFrame([[features_all.get(c, 0.0) for c in feature_cols]], columns=feature_cols)

pred_encoded = int(model.predict(X)[0])
pred_label = encoder.inverse_transform([pred_encoded])[0]

conf = None
if hasattr(model, "predict_proba"):
    conf = float(max(model.predict_proba(X)[0]))

print(json.dumps({
    "prediction": pred_label,
    "confidence": conf,
    "device_id": payload.get("device_id"),
    "record_id": str(payload.get("_id", "")),
    "features_used": {c: float(features_all.get(c, 0.0)) for c in feature_cols},
    "features_order": feature_cols
}))