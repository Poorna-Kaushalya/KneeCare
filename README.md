# KneeCare

## Knee Osteoarthritis Prediction and Progression Using Multi-Modal Deep Learning

---

## Overview

KneeCare is a research-driven multimodal decision-support system for the detection, severity grading, and continuous monitoring of Knee Osteoarthritis (KOA).

This system integrates:

* Radiographic imaging (X-ray / MRI)
* Structured demographic, clinical, and biomarker data
* Wearable IoT-based vibration and temperature signals

The framework combines deep learning models, machine learning algorithms, and rule-based classification to provide accurate, interpretable, and clinically meaningful decision support.

This implementation is based on the research paper:

**“Knee Osteoarthritis Prediction and Progression Using Multi Modal Deep Learning”**

---

## Research Objectives

The system is designed to:

1. Predict the presence of KOA using structured clinical and biomarker data.
2. Automatically detect KOA from knee X-ray and MRI images using deep learning.
3. Estimate disease severity using the Kellgren–Lawrence (KL) grading scale (KL0–KL4).
4. Provide a severity-aware treatment management support system.
5. Enable continuous monitoring using wearable IoT vibration and temperature sensors.
6. Improve interpretability through explainable and rule-based modeling.

---

## System Architecture

The system consists of five main components:

### 1. KOA Presence Prediction (Structured Data)

* Data source: Real-world hospital records
* Preprocessing:

  * Label encoding and one-hot encoding
  * Z-score normalization
  * Median imputation
  * BMI computation
* Class imbalance handling using SMOTE

Models evaluated:

* Logistic Regression
* KNN
* Random Forest
* Gradient Boosting
* **XGBoost (Final Model)**

XGBoost achieved approximately 94% test accuracy with strong precision, recall, and F1-score performance.

---

### 2. Imaging-Based KOA Detection

Modalities:

* Knee X-ray
* MRI

Preprocessing:

* CLAHE (contrast enhancement)
* Image resizing
* Data augmentation (rotation, flipping, scaling)

CNN architectures evaluated:

* ResNet50
* DenseNet
* EfficientNet
* MobileNetV3
* GoogLeNet
* LeNet-5
* **YOLOv8 (Final Model)**

YOLOv8 achieved:

* Validation Accuracy ≈ 91%
* Test Accuracy ≈ 90.83%
* ROC-AUC ≈ 97%

---

### 3. Multimodal KL Severity Prediction (KL0–KL4)

This module combines:

* Imaging backbone: EfficientNetB0
* Clinical model: XGBoost
* Fusion strategy: Late fusion ensemble

The multimodal fusion approach adaptively combines imaging and clinical predictions to improve robustness and generalization.

---

### 4. Treatment Management Support System

A non-prescriptive, severity-aware decision support module:

* KL0–KL1 → Preventive care & lifestyle modification
* KL2–KL3 → Conservative management & structured rehabilitation
* Severe cases → Clinician-guided advanced treatment

The system incorporates confidence-aware logic to maintain clinical oversight.

---

### 5. Wearable IoT-Based Continuous Monitoring

Hardware Components:

* MPU6050 – Motion & vibration sensing
* INMP441 – Acoustic signal capture
* MLX90614 – Infrared temperature sensor
* ESP32 – Microcontroller for data transmission

Extracted Features:

* RMS Amplitude
* Spectral Entropy
* Zero Crossing Rate
* Mean Frequency
* Knee Temperature

Classifiers evaluated:

* Decision Tree
* Random Forest
* SVM
* **Rule-Based Decision Tree (Final Model)**

Performance:

* Training Accuracy: 94.34%
* Test Accuracy: 92.80%

The rule-based decision tree ensures interpretability and suitability for medical applications.

---

## Key Contributions

* Unified multimodal KOA detection and monitoring framework
* Integration of imaging, structured clinical data, and IoT signals
* Explainable AI via rule-based severity classification
* High-performance clinical and imaging models
* Continuous real-time wearable monitoring
* Modular architecture for scalability

---

## Tech Stack

### Frontend

* React.js
* Tailwind CSS
* Recharts
* FontAwesome

### Backend

* Node.js
* Python (FastAPI / Flask for ML serving)

### AI & ML

* CNN architectures (EfficientNet, YOLOv8)
* XGBoost
* Decision Tree (Rule-based)
* SMOTE for imbalance handling

### IoT

* ESP32 wearable device
* Real-time TCP data transmission

---

## Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/Poorna-Kaushalya/KneeCare.git
cd KneeCare
```

---

### 2. Backend Setup (Windows – PowerShell)

```powershell
cd koa360-backend
powershell -ExecutionPolicy Bypass -File .\setup.ps1
.\pyenv\Scripts\Activate.ps1
npm start
```

---

### 3. Frontend Setup

```bash
cd koa360-dashboard
npm install
npm start
```

---

## Evaluation Metrics

* Accuracy
* Precision
* Recall
* F1-Score
* Confusion Matrix
* ROC-AUC
* Learning Curve Analysis

---

## Future Work

* Multi-centric large-scale dataset expansion
* Longitudinal progression modeling
* Transformer-based multimodal fusion
* Improved hyperparameter optimization
* Enhanced real-world deployment validation

---

## Authors

Faculty of Computing
Sri Lanka Institute of Information Technology (SLIIT)
Malabe, Sri Lanka
