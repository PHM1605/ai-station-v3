import cv2
import numpy as np

from fastapi import FastAPI, UploadFile, File

from sam_service import generate_masks

app = FastAPI()

@app.post("/segment")
async def segment(file: UploadFile = File(...)):
  data = await file.read()
  image = cv2.imdecode(
    np.frombuffer(data, np.uint8),
    cv2.IMREAD_COLOR,
  )