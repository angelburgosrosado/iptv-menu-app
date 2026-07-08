#!/bin/bash
# ==============================================================================
# IPTV.MENU Google Cloud Run Deployment Orchestrator
# ==============================================================================
set -eo pipefail

# Configurable variables
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"iptv-menu-prod"}
REGION=${GCP_REGION:-"us-central1"}
ENV=${APP_ENV:-"prod"}

# Service Names
API_SERVICE="iptv-api"
WORKER_SERVICE="iptv-worker"

echo "--------------------------------------------------------"
echo "🚀 Bootstrapping Deployment for IPTV.MENU ($ENV)"
echo "📍 Target GCP Project: $PROJECT_ID"
echo "📍 Target Region: $REGION"
echo "--------------------------------------------------------"

# 1. Ensure GCP service accounts exist with minimum privilege boundaries
echo "🔑 Verifying dedicated Cloud Run Service Accounts..."

# API Service Account
if ! gcloud iam service-accounts describe run-$API_SERVICE@$PROJECT_ID.iam.gserviceaccount.com >/dev/null 2>&1; then
  echo "Creating SA for API..."
  gcloud iam service-accounts create run-$API_SERVICE \
    --description="Execution identity for IPTV API service" \
    --display-name="run-$API_SERVICE"
fi

# Worker Service Account
if ! gcloud iam service-accounts describe run-$WORKER_SERVICE@$PROJECT_ID.iam.gserviceaccount.com >/dev/null 2>&1; then
  echo "Creating SA for Worker..."
  gcloud iam service-accounts create run-$WORKER_SERVICE \
    --description="Execution identity for IPTV Background Worker" \
    --display-name="run-$WORKER_SERVICE"
fi

# 2. Assign IAM roles (Firestore, Storage, Logging)
echo "🛡️ Assigning IAM Roles..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:run-$API_SERVICE@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user" >/dev/null

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:run-$API_SERVICE@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin" >/dev/null

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:run-$WORKER_SERVICE@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user" >/dev/null

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:run-$WORKER_SERVICE@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin" >/dev/null

# 3. Build and Push containers to Artifact Registry
echo "📦 Building API Docker container via Cloud Builds..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$API_SERVICE:latest -f apps/api/Dockerfile .

echo "📦 Building Worker Docker container via Cloud Builds..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$WORKER_SERVICE:latest -f apps/worker/Dockerfile .

# 4. Deploy API Service to Google Cloud Run
echo "🚀 Deploying $API_SERVICE REST API to Cloud Run..."
gcloud run deploy $API_SERVICE \
  --image gcr.io/$PROJECT_ID/$API_SERVICE:latest \
  --platform managed \
  --region $REGION \
  --service-account run-$API_SERVICE@$PROJECT_ID.iam.gserviceaccount.com \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,APP_ENV=$ENV,GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GCS_UPLOAD_BUCKET=iptv-menu-$ENV-user-uploads,GCS_OUTPUT_BUCKET=iptv-menu-$ENV-generated-assets,GCS_BUILD_BUCKET=iptv-menu-$ENV-build-artifacts" \
  --set-secrets="FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest,STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest,STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest" \
  --timeout 300 \
  --min-instances 0 \
  --max-instances 10

# 5. Deploy Worker Service to Google Cloud Run (Private/Internal only)
echo "🚀 Deploying $WORKER_SERVICE Background Worker to Cloud Run..."
gcloud run deploy $WORKER_SERVICE \
  --image gcr.io/$PROJECT_ID/$WORKER_SERVICE:latest \
  --platform managed \
  --region $REGION \
  --service-account run-$WORKER_SERVICE@$PROJECT_ID.iam.gserviceaccount.com \
  --no-allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,APP_ENV=$ENV,GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GCS_UPLOAD_BUCKET=iptv-menu-$ENV-user-uploads,GCS_OUTPUT_BUCKET=iptv-menu-$ENV-generated-assets,GCS_BUILD_BUCKET=iptv-menu-$ENV-build-artifacts" \
  --set-secrets="FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest" \
  --timeout 3600 \
  --cpu 2 \
  --memory 4Gi \
  --min-instances 0 \
  --max-instances 5

echo "--------------------------------------------------------"
echo "🎉 IPTV.MENU Cloud Services Deployed Successfully!"
echo "📡 REST API (Public): $(gcloud run services describe $API_SERVICE --region $REGION --format='value(status.url)')"
echo "📡 Worker (Private): $(gcloud run services describe $WORKER_SERVICE --region $REGION --format='value(status.url)')"
echo "--------------------------------------------------------"
