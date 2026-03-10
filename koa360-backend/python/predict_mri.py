import sys
import json
import os
import numpy as np
from PIL import Image

import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.resnet50 import preprocess_input

IMG_SIZE = (224, 224)
CLASS_LABELS = ["Normal", "Osteoarthritis"]


def load_image(image_path: str):
    img = Image.open(image_path).convert("RGB")
    img = img.resize(IMG_SIZE)
    arr = np.array(img, dtype=np.float32)
    arr = preprocess_input(arr)
    arr = np.expand_dims(arr, axis=0)
    return arr


def decode_prediction(pred):
    pred = np.array(pred)

    # sigmoid output
    if pred.ndim == 2 and pred.shape[1] == 1:
        conf_oa = float(pred[0][0])
        if conf_oa >= 0.5:
            return "Osteoarthritis", conf_oa, 1
        return "Normal", 1.0 - conf_oa, 0

    # softmax output
    if pred.ndim == 2 and pred.shape[1] >= 2:
        idx = int(np.argmax(pred[0]))
        conf = float(pred[0][idx])
        label = CLASS_LABELS[idx] if idx < len(CLASS_LABELS) else str(idx)
        return label, conf, idx

    # fallback
    value = float(pred.flatten()[0])
    if value >= 0.5:
        return "Osteoarthritis", value, 1
    return "Normal", 1.0 - value, 0


def main():
    try:
        if len(sys.argv) < 3:
            print(json.dumps({
                "ok": False,
                "error": "Usage: python predict_mri.py <model_path> <image_path>"
            }))
            return

        model_path = sys.argv[1]
        image_path = sys.argv[2]

        if not os.path.exists(model_path):
            print(json.dumps({"ok": False, "error": f"MRI model not found: {model_path}"}))
            return

        if not os.path.exists(image_path):
            print(json.dumps({"ok": False, "error": f"Image not found: {image_path}"}))
            return

        model = load_model(model_path, compile=False)
        x = load_image(image_path)
        pred = model.predict(x, verbose=0)

        label, confidence, class_id = decode_prediction(pred)

        print(json.dumps({
            "ok": True,
            "validImage": True,
            "modality": "mri",
            "message": "MRI prediction successful",
            "type": "classification",
            "label": label,
            "confidence": confidence,
            "classId": class_id
        }))

    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}))


if __name__ == "__main__":
    main()