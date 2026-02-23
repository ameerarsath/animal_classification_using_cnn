# 🐄 Indian Cattle Breed Classifier

A deep learning-powered web application that classifies **50 Indian cattle breeds** from uploaded images using **MobileNetV2** transfer learning.

![Python](https://img.shields.io/badge/Python-3.10-blue?logo=python)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.16-orange?logo=tensorflow)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.131-009688?logo=fastapi)

---

## 📁 Project Structure

```
animal-classification/
├── backend/
│   ├── app.py                 # FastAPI server & prediction endpoint
│   ├── train.py               # Model training script
│   ├── split_dataset.py       # Dataset splitting (train/val/test)
│   ├── requirements.txt       # Python dependencies
│   ├── model/
│   │   ├── model.py           # MobileNetV2 architecture definition
│   │   └── cattle_classifier.keras  # Trained model weights
│   └── dataset/               # Image dataset (not tracked in git)
│       ├── cattle/            # Raw images by breed
│       ├── train/             # 70% training split
│       ├── val/               # 15% validation split
│       └── test/              # 15% test split
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       └── components/
│           └── AnimalClassifierApp.jsx  # Main classifier UI
│
└── .gitignore
```

## 🧠 Model Details

| Property | Value |
|---|---|
| **Architecture** | MobileNetV2 (ImageNet pretrained) |
| **Custom Layers** | GlobalAvgPooling → Dense(256, ReLU) → Dropout(0.5) → Dense(50, Softmax) |
| **Input Size** | 224 × 224 × 3 |
| **Output** | 50 Indian cattle breeds |
| **Optimizer** | Adam (lr=0.001) |
| **Loss** | Sparse Categorical Crossentropy |
| **Epochs** | 15 |

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
python -m uvicorn app:app --reload
```

The API will be running at `http://localhost:8000`.

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be running at `http://localhost:5173`.

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API info & list of class names |
| `GET` | `/health` | Health check & model status |
| `POST` | `/predict` | Upload image → get breed prediction |

### Example — Predict

```bash
curl -X POST http://localhost:8000/predict \
  -F "file=@cow.jpg"
```

```json
{
  "predicted_breed": "Gir",
  "confidence": 94.32,
  "top_5_predictions": [
    { "breed": "Gir", "confidence": 94.32 },
    { "breed": "Sahiwal", "confidence": 3.21 },
    ...
  ],
  "filename": "cow.jpg"
}
```

## 🏋️ Training Your Own Model

1. Place breed images in `backend/dataset/cattle/<breed_name>/`
2. Split the dataset:
   ```bash
   cd backend
   python split_dataset.py
   ```
3. Train:
   ```bash
   python train.py
   ```
4. The trained model is saved to `backend/model/cattle_classifier.keras`

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **ML Framework** | TensorFlow / Keras |
| **Base Model** | MobileNetV2 (ImageNet) |
| **Backend** | FastAPI + Uvicorn |
| **Frontend** | React 19 + Vite |
| **UI Icons** | Lucide React |

## 📄 License

This project is for educational purposes.
