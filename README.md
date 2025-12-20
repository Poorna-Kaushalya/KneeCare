
# 🛡️ KneeCare: Smart Prediction for Knee Recovery

**A Multi-Modal Deep Learning Framework for Knee Osteoarthritis (KOA) Monitoring.**

KneeCare is a cutting-edge medical platform designed to monitor and predict the progression of Knee Osteoarthritis. By combining **AI-driven X-ray analysis (KL Grading)** with **Real-time IoT Acoustic Sensing (Vibroarthrography)**, it provides physicians with a comprehensive tool for early intervention and personalized recovery plans.

## 🚀 Key Features

* **Multi-Modal AI Engine:** Integrates radiographic data (X-rays) with biomechanical acoustic signals.
* **IoT VAG Sensor Integration:** Real-time collection of joint vibration and thermal data via wearable sensors.
* **Automated KL Grading:** AI-powered classification of OA severity (Stages 0–4).
* **Explainable AI (XAI):** Generates heatmaps to show clinicians exactly which joint areas are showing signs of decay.
* **Dynamic Treatment Dashboards:** Visualize recovery trends and automate risk alerts for potential complications.

## 🏗️ System Architecture

The system follows a modular flow as outlined in the **System Architectural Flow**:

1. **Data Acquisition:** Patient X-rays and IoT wearable sensor signals.
2. **Preprocessing:** Signal denoising and image normalization using Deep Learning.
3. **Feature Extraction:** Extracting radiographic features and acoustic spectral signatures.
4. **Inference Layer:** Multi-modal fusion model predicts the recovery trajectory.
5. **Clinician Interface:** Dashboard for physician review and prescription management.

## 🛠️ Tech Stack

* **Frontend:** React.js, Tailwind CSS, Framer Motion (for smooth UI/UX).
* **Backend:** Node.js / Python (FastAPI/Flask for AI Model serving).
* **Animations:** Framer Motion & Intersection Observer.
* **Icons:** FontAwesome.
* **AI Models:** Convolutional Neural Networks (CNN) for Imaging + Recurrent Neural Networks (RNN/LSTMs) for VAG signals.

## 📦 Installation & Setup

1. **Clone the repository:**
```bash
[git@github.com:Poorna-Kaushalya/KneeCare.git](https://github.com/Poorna-Kaushalya/KneeCare.git)
cd kneecare-platform

```


2. **Install dependencies:**
```bash
npm install

```


3. **Install Animation Library:**
```bash
npm install framer-motion

```


4. **Run the development server:**
```bash
npm start

```



## 📸 Component Screenshots

*(Place your images in `src/images/` and link them here)*

* **Dashboard:** Monitoring KL stages.
* **IoT Section:** Real-time VAG signal visualization.

## 📜 Research Credits

Developed under the **Centre of Excellence for AI (CoEAI)** as a specialized research project in biomechanical health monitoring.
