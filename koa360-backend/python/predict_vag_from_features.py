import sys, json
import numpy as np
import pandas as pd
import joblib

bundle = joblib.load("models/svm_vag_bundle.pkl")
model = bundle["model"]
scaler = bundle["scaler"]
encoder = bundle["label_encoder"]
feature_cols = bundle["feature_cols"]

payload = json.loads(sys.stdin.read())

features = {
    "rms_amplitude": float(payload.get("rms_amplitude")),
    "spectral_entropy": float(payload.get("spectral_entropy")),
    "zero_crossing_rate": float(payload.get("zero_crossing_rate")),
    "mean_frequency": float(payload.get("mean_frequency")),
    "knee_tempurarture": float(payload.get("knee_tempurarture")),
}

X = pd.DataFrame([[features[c] for c in feature_cols]], columns=feature_cols)
X_scaled = scaler.transform(X)

pred_encoded = model.predict(X_scaled)[0]
pred_label = encoder.inverse_transform([pred_encoded])[0]

conf = None
if hasattr(model, "predict_proba"):
    conf = float(np.max(model.predict_proba(X_scaled)[0]))

print(json.dumps({
    "prediction": pred_label,
    "confidence": conf,
    "features_used": features
}))
