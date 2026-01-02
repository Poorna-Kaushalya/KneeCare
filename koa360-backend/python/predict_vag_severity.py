# koa360-backend/python/predict_vag_severity.py

import sys, json, os
import numpy as np
import pandas as pd
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # backend root
BUNDLE_PATH = os.path.join(BASE_DIR, "models", "svm_vag_bundle.pkl")

bundle = joblib.load(BUNDLE_PATH)
model = bundle["model"]
scaler = bundle["scaler"]
encoder = bundle["label_encoder"]
feature_cols = bundle["feature_cols"]

def rms_amplitude(x):
    x = np.asarray(x, dtype=float)
    return float(np.sqrt(np.mean(x**2))) if len(x) else 0.0

def zero_crossing_rate(x):
    x = np.asarray(x, dtype=float)
    if len(x) < 2:
        return 0.0
    s = np.sign(x)
    for i in range(1, len(s)):
        if s[i] == 0:
            s[i] = s[i-1]
    return float(np.mean(s[1:] != s[:-1]))

def spectral_entropy(x):
    x = np.asarray(x, dtype=float)
    if len(x) < 8:
        return 0.0
    x = x - np.mean(x)
    X = np.fft.rfft(x)
    psd = (np.abs(X) ** 2)[1:]  # drop DC
    total = psd.sum()
    if total == 0:
        return 0.0
    p = psd / total
    ent = -np.sum(p * np.log2(p + 1e-12))
    return float(ent / np.log2(len(p) + 1e-12))  # normalize 0..1

def mean_frequency(x, fs):
    x = np.asarray(x, dtype=float)
    if len(x) < 8:
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

payload = json.loads(sys.stdin.read())

signal = payload.get("signal_series", [])
knee_temp_series = payload.get("knee_temp_series", [])

# 5-min averages => 1 sample / 300 sec
fs = 1.0 / 300.0

knee_temp = float(np.mean(knee_temp_series)) if len(knee_temp_series) else 0.0

features = {
    "rms_amplitude": rms_amplitude(signal),
    "spectral_entropy": spectral_entropy(signal),
    "zero_crossing_rate": zero_crossing_rate(signal),
    "mean_frequency": mean_frequency(signal, fs),
    "knee_tempurarture": knee_temp
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
