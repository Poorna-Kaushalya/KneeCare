import sys, json, os
import pandas as pd
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

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

# Expect flat payload keys
features_all = {c: safe_float(payload.get(c, 0.0)) for c in feature_cols}

X = pd.DataFrame([[features_all[c] for c in feature_cols]], columns=feature_cols)

pred_encoded = int(model.predict(X)[0])
pred_label = encoder.inverse_transform([pred_encoded])[0]

conf = None
if hasattr(model, "predict_proba"):
    conf = float(max(model.predict_proba(X)[0]))

print(json.dumps({
    "prediction": pred_label,
    "confidence": conf,
    "features_used": features_all,
    "features_order": feature_cols
}))