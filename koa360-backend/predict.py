import sys
import json
import joblib
import pandas as pd
import numpy as np
import os

# Safe path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "best_model.pkl")

model = joblib.load(MODEL_PATH)

# Read JSON from Node
input_data = json.loads(sys.stdin.read())
features = input_data["features"]

FEATURE_COLUMNS = [
    "age","gender","height","weight","occupation","living_environment",
    "knee_pain","knee_pain_in_past_week","stifness_after_resting",
    "knee_injuries","swelling","difficulty_in_performing",
    "family_history","obesity","diabetes","hypertension",
    "vitaminD_deficiency","rheumatoid_arthritis","fbs","wbc",
    "platelets","cs","cholesterol","crp","esr","rf","fbc",
    "physical_activity_level_Low","physical_activity_level_Moderate","BMI"
]

X = pd.DataFrame([[features[col] for col in FEATURE_COLUMNS]], columns=FEATURE_COLUMNS)

prediction = model.predict(X)[0]

confidence = None
if hasattr(model, "predict_proba"):
    confidence = float(np.max(model.predict_proba(X)[0]))

# Return JSON to Node
print(json.dumps({
    "model": "GB (Best Model)",
    "prediction": str(prediction),
    "confidence": confidence
}))
