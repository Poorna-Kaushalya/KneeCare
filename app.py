from flask import Flask, request, jsonify
import subprocess
import json
import sys
import os

app = Flask(__name__)

SCRIPT_MAP = {
    "general": "python/predict.py",
    "fusion": "python/predict_fusion.py",
    "mri": "python/predict_mri.py",
    "vag-features": "python/predict_vag_from_features.py",
    "vag-severity": "python/predict_vag_severity.py",
    "xray": "python/predict_xray.py"
}

@app.route("/")
def home():
    return jsonify({
        "message": "KneeCare ML API running",
        "available_models": list(SCRIPT_MAP.keys())
    })

@app.route("/predict/<model_name>", methods=["POST"])
def predict_model(model_name):
    if model_name not in SCRIPT_MAP:
        return jsonify({
            "error": "Invalid model name",
            "available_models": list(SCRIPT_MAP.keys())
        }), 400

    script_path = SCRIPT_MAP[model_name]

    try:
        input_data = request.get_json()

        process = subprocess.run(
            [sys.executable, script_path],
            input=json.dumps(input_data),
            text=True,
            capture_output=True,
            cwd=os.getcwd()
        )

        if process.returncode != 0:
            return jsonify({
                "error": "Python script failed",
                "model": model_name,
                "stderr": process.stderr,
                "stdout": process.stdout
            }), 500

        return jsonify(json.loads(process.stdout))

    except Exception as e:
        return jsonify({
            "error": str(e),
            "model": model_name
        }), 500