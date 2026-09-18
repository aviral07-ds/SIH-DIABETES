# Deploying the Models on Render

This project deploys APTOS, IDRiD, and DRIVE as independent Render services. Each service has its own Docker image, dependencies, memory allocation, URL, and API key.

| Service | Dockerfile | Prediction endpoint | Status |
| --- | --- | --- | --- |
| APTOS | `backend/Dockerfile.aptos` | `POST /api/predict/aptos` | Ready |
| IDRiD | `backend/Dockerfile.idrid` | `POST /api/predict/idrid` | Ready |
| DRIVE | `backend/Dockerfile.drive` | `POST /api/predict/drive` | Ready after its checkpoint is trained |

Each service provides `GET /` and `GET /health`. Prediction requests require an `X-API-Key` header and accept JPEG, PNG, or TIFF images up to 10 MB.

## Deploy

1. Commit and push the repository. Keep the APTOS model artifact and `backend/app/models/idrid/best_model.pth` in the repository; they must not be excluded by `.dockerignore`.
2. In Render, select **New +** → **Blueprint**, connect this repository, and create the Blueprint. Render reads [`render.yaml`](render.yaml) and creates all three services.
3. Set these environment variables for every Render service:

   ```dotenv
   API_KEY=use-a-long-random-secret
   CORS_ORIGINS=https://your-frontend-domain.example
   ```

   Use separate API keys per service if desired. Keep API keys in server-side configuration; never expose them in browser code.
4. Deploy the Blueprint. Each service receives its own Render URL. Verify the services:

   ```bash
   curl https://<aptos-service>.onrender.com/health
   curl https://<idrid-service>.onrender.com/health
   curl https://<drive-service>.onrender.com/health
   ```

## Make a prediction

Send each image to the endpoint for its matching model:

```bash
curl -X POST https://<idrid-service>.onrender.com/api/predict/idrid \
  -H "X-API-Key: $IDRID_API_KEY" \
  -F "file=@path/to/fundus-image.jpg"
```

## Train and add the DRIVE checkpoint

The DRIVE dataset and a trained checkpoint are not included in this repository. Download the official dataset and place it in this structure:

```text
drive-baby/drive/dataset/
└── training/
    ├── images/
    └── 1st_manual/
```

Train from the DRIVE project and write the best checkpoint directly into the deployment model directory:

```bash
cd drive-baby/drive
pip install -r requirements.txt
python -m src.train \
  --data dataset/training \
  --epochs 50 \
  --batch-size 2 \
  --checkpoint-dir ../../backend/app/models/drive \
  --checkpoint-name best_model.pth
```

Validate the checkpoint before committing it. The DRIVE Docker image automatically includes `backend/app/models/drive/best_model.pth` when it is present. Until then, the deployed DRIVE prediction endpoint returns `503` while APTOS and IDRiD continue to work normally.

## Streamlit configuration

The Streamlit server reads the three service-specific variables below. It requires IDRiD for lesion segmentation and calls APTOS and DRIVE when their variables are configured:

```dotenv
APTOS_API_URL=https://<aptos-service>.onrender.com
APTOS_API_KEY=the-aptos-api-key
IDRID_API_URL=https://<idrid-service>.onrender.com
IDRID_API_KEY=the-idrid-api-key
DRIVE_API_URL=https://<drive-service>.onrender.com
DRIVE_API_KEY=the-drive-api-key
```

## Run all services locally

`docker-compose.yml` mirrors the production split and reads the API keys above from `.env`:

| Service | Local URL |
| --- | --- |
| APTOS | `http://localhost:8001` |
| IDRiD | `http://localhost:8002` |
| DRIVE | `http://localhost:8003` |

Start all three with:

```bash
docker compose up --build
```
