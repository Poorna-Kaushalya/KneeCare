import sys
import json
import os
from ultralytics import YOLO

def main():
    try:
        if len(sys.argv) < 3:
            print(json.dumps({
                "ok": False,
                "error": "Usage: python predict_xray.py <model_path> <image_path>"
            }))
            return

        model_path = sys.argv[1]
        image_path = sys.argv[2]

        if not os.path.exists(model_path):
            print(json.dumps({"ok": False, "error": f"Model not found: {model_path}"}))
            return

        if not os.path.exists(image_path):
            print(json.dumps({"ok": False, "error": f"Image not found: {image_path}"}))
            return

        model = YOLO(model_path)

        # verbose=False stops Ultralytics printing those lines
        results = model.predict(source=image_path, verbose=False)
        r0 = results[0]

        names = getattr(r0, "names", None) or getattr(model, "names", {})

        # ---- YOLO Classification ----
        if getattr(r0, "probs", None) is not None and r0.probs is not None:
            top_idx = int(r0.probs.top1)
            top_conf = float(r0.probs.top1conf)
            label = names.get(top_idx, str(top_idx)) if isinstance(names, dict) else str(top_idx)

            print(json.dumps({
                "ok": True,
                "type": "classification",
                "label": label,
                "confidence": top_conf,
                "topIndex": top_idx
            }))
            return

        # ---- YOLO Detection ----
        if getattr(r0, "boxes", None) is not None and r0.boxes is not None and len(r0.boxes) > 0:
            confs = r0.boxes.conf.tolist()
            best_i = int(max(range(len(confs)), key=lambda i: confs[i]))

            cls_id = int(r0.boxes.cls[best_i].item())
            conf = float(r0.boxes.conf[best_i].item())
            label = names.get(cls_id, str(cls_id)) if isinstance(names, dict) else str(cls_id)

            print(json.dumps({
                "ok": True,
                "type": "detection",
                "label": label,
                "confidence": conf,
                "classId": cls_id
            }))
            return

        print(json.dumps({
            "ok": True,
            "type": "unknown",
            "label": "No prediction",
            "confidence": 0.0
        }))

    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}))

if __name__ == "__main__":
    main()
