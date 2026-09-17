# Local and Background Testing

This document describes the available local testing options for the project.

## Current repository status

The `drive/` project contains a Python U-Net training and inference pipeline only. No frontend source, `package.json`, or frontend development server is present in this checkout.

As a result, there is currently no localhost frontend URL to test. The separate APTOS FastAPI service can be tested through its API and Swagger UI, while DRIVE model checks must run as background or command-line tests.

## Option 1: Test the APTOS API on localhost

The API is implemented in `../aptos final/app.py`.

### Run directly

From the project root:

```bash
cd "aptos final"
pip install -r ../requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

Open the interactive API documentation at:

```text
http://localhost:8000/docs
```

Smoke-test the service:

```bash
curl http://localhost:8000/
curl http://localhost:8000/api/model-info
```

Test an authenticated image prediction:

```bash
curl -X POST "http://localhost:8000/api/predict" \
  -H "X-API-Key: change-me-in-production" \
  -F "image=@test_images/0005cfc8afb6.png"
```

`change-me-in-production` is the local default API key. Set a different local value with `API_KEY` when needed, and never reuse it in production.

### Run with Docker Compose

From the project root:

```bash
docker compose up --build
```

The API is exposed at `http://localhost:8000`, with Swagger UI at `http://localhost:8000/docs`.

> Note: `docker-compose.yml` currently mounts `./aptos_final/test_images`, but the checked-in directory is named `aptos final/test_images`. Correct that path before relying on the Compose setup.

### Frontend checklist once a frontend exists

1. Start the API on port `8000`.
2. Start the frontend development server from its own project.
3. Confirm the frontend calls `http://localhost:8000` and handles CORS correctly.
4. Test image upload, loading state, success response, recapture response, and error state.
5. Test `/api/predict` with a valid API key and `/api/batch-predict` with up to 10 images.
6. Verify that invalid files, oversized files, missing keys, and model failures produce usable UI messages.

## Option 2: Run DRIVE background tests

The DRIVE project has no frontend or HTTP server. Use command-line or background model tests instead.

From `drive/`:

```bash
pip install -r requirements.txt
python -m compileall -q src
```

A short training smoke test can be run after the dataset pairing issue is fixed:

```bash
python -m src.train \
  --epochs 1 \
  --batch-size 2 \
  --device cpu
```

A prediction smoke test requires a saved checkpoint:

```bash
python -m src.predict \
  --image dataset/training/images/01_test.tif \
  --model ../models/best_model.pth \
  --output /tmp/drive_prediction.png \
  --device cpu
```

Run long training jobs in a terminal multiplexer or the project’s process manager and capture the log to a file. Do not leave a local server or training process running after the test is complete.

## Known DRIVE test blockers

- The current files contain 20 images in `dataset/training/images/` and 20 masks in `dataset/training/mask/`. The masks use names such as `01_test_mask.gif`, while `src/dataset.py` currently looks for `_manual1` or an identical stem. All mask lookups therefore fail, and dataset loading can recurse until it raises `RecursionError`.
- `src/predict.py` and `src/evaluate.py` import `build_unet`, but `src/model.py` only defines `UNet`; both command-line entry points fail during import.
- `src/model.py` uses `torch.cat` in `forward()` without importing `torch`; a training forward pass can fail after the model is constructed.

Fix these issues before treating training, evaluation, prediction, or frontend integration tests as passing.
