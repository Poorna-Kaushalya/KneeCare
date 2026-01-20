# predict_vag_from_features.py
import sys, json, os
import numpy as np
import pandas as pd
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

BUNDLE_PATH = os.path.join(MODELS_DIR, "svm_bundle.pkl")
MODEL_PATH  = os.path.join(MODELS_DIR, "svm_calibrated.pkl")
SCALER_PATH = os.path.join(MODELS_DIR, "scaler.pkl")
ENC_PATH    = os.path.join(MODELS_DIR, "label_encoder.pkl")
FEAT_PATH   = os.path.join(MODELS_DIR, "selected_features.pkl")

def load_artifacts():
    if os.path.exists(BUNDLE_PATH):
        bundle = joblib.load(BUNDLE_PATH)
        return bundle["model"], bundle["scaler"], bundle["label_encoder"], bundle["feature_cols"]
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    encoder = joblib.load(ENC_PATH)
    feature_cols = joblib.load(FEAT_PATH)
    return model, scaler, encoder, feature_cols

model, scaler, encoder, feature_cols = load_artifacts()

payload = json.loads(sys.stdin.read() or "{}")

# Accept any subset; fill missing with 0.0
features_in = {k: payload.get(k, 0.0) for k in feature_cols}

# Cast to float safely
features_in = {k: float(features_in.get(k, 0.0)) for k in feature_cols}

X = pd.DataFrame([[features_in[c] for c in feature_cols]], columns=feature_cols)
X_scaled = scaler.transform(X.values)

pred_encoded = int(model.predict(X_scaled)[0])
pred_label = encoder.inverse_transform([pred_encoded])[0]

conf = None
if hasattr(model, "predict_proba"):
    conf = float(np.max(model.predict_proba(X_scaled)[0]))

print(json.dumps({
    "prediction": pred_label,
    "confidence": conf,
    "features_used": features_in,
    "features_order": feature_cols
}))
