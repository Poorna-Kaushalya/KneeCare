# predict_vag_severity.py
import sys, json, os
import numpy as np
import pandas as pd
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# Prefer bundle if available, else fall back to separate files
BUNDLE_PATH = os.path.join(MODELS_DIR, "svm_bundle.pkl")
MODEL_PATH  = os.path.join(MODELS_DIR, "svm_calibrated.pkl")
SCALER_PATH = os.path.join(MODELS_DIR, "scaler.pkl")
ENC_PATH    = os.path.join(MODELS_DIR, "label_encoder.pkl")
FEAT_PATH   = os.path.join(MODELS_DIR, "selected_features.pkl")

def load_artifacts():
    if os.path.exists(BUNDLE_PATH):
        bundle = joblib.load(BUNDLE_PATH)
        return bundle["model"], bundle["scaler"], bundle["label_encoder"], bundle["feature_cols"]
    # fallback (your current setup)
    model = joblib.load(MODEL_PATH)                 # CalibratedClassifierCV
    scaler = joblib.load(SCALER_PATH)
    encoder = joblib.load(ENC_PATH)
    feature_cols = joblib.load(FEAT_PATH)
    return model, scaler, encoder, feature_cols

model, scaler, encoder, feature_cols = load_artifacts()

# ---------- Feature functions ----------
def rms_amplitude(x):
    x = np.asarray(x, dtype=float)
    return float(np.sqrt(np.mean(x**2))) if x.size else 0.0

def zero_crossing_rate(x):
    x = np.asarray(x, dtype=float)
    if x.size < 2:
        return 0.0
    s = np.sign(x)
    # fill zeros with previous sign to avoid extra crossings
    for i in range(1, len(s)):
        if s[i] == 0:
            s[i] = s[i - 1]
    return float(np.mean(s[1:] != s[:-1]))

def spectral_entropy(x):
    x = np.asarray(x, dtype=float)
    if x.size < 8:
        return 0.0
    x = x - np.mean(x)
    X = np.fft.rfft(x)
    psd = (np.abs(X) ** 2)[1:]  # drop DC
    total = psd.sum()
    if total == 0:
        return 0.0
    p = psd / total
    ent = -np.sum(p * np.log2(p + 1e-12))
    return float(ent / np.log2(len(p) + 1e-12))  # normalized 0..1

def mean_frequency(x, fs):
    x = np.asarray(x, dtype=float)
    if x.size < 8:
        return 0.0
    x = x - np.mean(x)
    X = np.fft.rfft(x)
    psd = (np.abs(X) ** 2)
    freqs = np.fft.rfftfreq(len(x), d=1/fs)

    psd = psd[1:]     # drop DC
    freqs = freqs[1:]
    denom = psd.sum()
    if denom == 0:
        return 0.0
    return float((freqs * psd).sum() / denom)

# ---------- Read payload ----------
payload = json.loads(sys.stdin.read() or "{}")

signal = payload.get("signal_series", [])
knee_temp_series = payload.get("knee_temp_series", [])

# If your signal may arrive as strings -> try to convert safely
signal = np.asarray(signal, dtype=float) if len(signal) else np.array([], dtype=float)
knee_temp_series = np.asarray(knee_temp_series, dtype=float) if len(knee_temp_series) else np.array([], dtype=float)

# 5-min averages => 1 sample / 300 sec
fs = 1.0 / 300.0

knee_temp = float(np.mean(knee_temp_series)) if knee_temp_series.size else 0.0

features_all = {
    "rms_amplitude": rms_amplitude(signal),
    "spectral_entropy": spectral_entropy(signal),
    "zero_crossing_rate": zero_crossing_rate(signal),
    "mean_frequency": mean_frequency(signal, fs),
    "knee_tempurarture": knee_temp
}

# Build model input in EXACT order of feature_cols (missing -> 0.0)
X = pd.DataFrame([[float(features_all.get(c, 0.0)) for c in feature_cols]], columns=feature_cols)
X_scaled = scaler.transform(X.values)

pred_encoded = int(model.predict(X_scaled)[0])
pred_label = encoder.inverse_transform([pred_encoded])[0]

conf = None
if hasattr(model, "predict_proba"):
    conf = float(np.max(model.predict_proba(X_scaled)[0]))

print(json.dumps({
    "prediction": pred_label,
    "confidence": conf,
    "features_used": {c: float(features_all.get(c, 0.0)) for c in feature_cols},
    "features_order": feature_cols
}))
