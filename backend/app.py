from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import os

# ==========================
# Configuration
# ==========================

MODEL_PATH = "model/cattle_classifier.keras"
DATASET_PATH = "dataset/train"
IMAGE_SIZE = (224, 224)

model = None
class_names = []

# ==========================
# Lifespan Event (Modern Way)
# ==========================

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, class_names

    print("🔄 Loading model...")

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}")

    # Patch Dense.from_config to handle 'quantization_config' from newer Keras versions
    _original_dense_from_config = tf.keras.layers.Dense.from_config.__func__

    @classmethod
    def _patched_dense_from_config(cls, config):
        config.pop("quantization_config", None)
        return _original_dense_from_config(cls, config)

    tf.keras.layers.Dense.from_config = _patched_dense_from_config

    model = tf.keras.models.load_model(MODEL_PATH, compile=False, safe_mode=False)

    # Load only directory names (ignore unwanted files)
    class_names = sorted(
        [
            d for d in os.listdir(DATASET_PATH)
            if os.path.isdir(os.path.join(DATASET_PATH, d))
        ]
    )

    print(f"✅ Model loaded successfully")
    print(f"📊 Total Classes: {len(class_names)}")

    yield

    print("🛑 Shutting down API...")

# ==========================
# Initialize FastAPI App
# ==========================

app = FastAPI(
    title="Cattle Breed Classifier API",
    version="1.0.0",
    lifespan=lifespan
)

# ==========================
# CORS Middleware
# ==========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================
# Routes
# ==========================

@app.get("/")
def root():
    return {
        "message": "Cattle Breed Classifier API",
        "total_classes": len(class_names),
        "class_names": class_names
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "num_classes": len(class_names)
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        image = image.resize(IMAGE_SIZE)

        # Convert to numpy array
        img_array = np.array(image, dtype=np.float32)

        # Normalize for MobileNetV2 [-1, 1]
        img_array = (img_array / 127.5) - 1.0

        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)

        # Predict
        predictions = model.predict(img_array)[0]

        # Get top 5 predictions
        top_5_indices = np.argsort(predictions)[-5:][::-1]

        top_5 = [
            {
                "breed": class_names[i],
                "confidence": round(float(predictions[i]) * 100, 2)
            }
            for i in top_5_indices
        ]

        return {
            "predicted_breed": top_5[0]["breed"],
            "confidence": top_5[0]["confidence"],
            "top_5_predictions": top_5,
            "filename": file.filename
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))