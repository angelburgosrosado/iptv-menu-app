# IPTV.MENU Google Cloud & Firebase Deployment Guide

This document walks through setting up the required GCP infrastructure and deploying your services.

## Prerequisites
1. Install [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) and authenticate.
2. Install [Firebase CLI](https://firebase.google.com/docs/cli).
3. Ensure you have the `roles/owner` or `roles/editor` role on your target GCP project.

---

## 1. Set up Google Cloud Project
First, create your project and enable required APIs:

```bash
# Define target project ID
export PROJECT_ID="iptv-menu-prod"

# Set default configuration
gcloud config set project $PROJECT_ID

# Enable essential APIs
gcloud services enable \
  run.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

---

## 2. Provision Cloud Storage Buckets
Create GCS buckets for user uploads, processed assets, and compilation artifacts:

```bash
# Set bucket variables
export REGION="us-central1"

# Create buckets
gcloud storage buckets create gs://iptv-menu-prod-user-uploads --location=$REGION
gcloud storage buckets create gs://iptv-menu-prod-generated-assets --location=$REGION
gcloud storage buckets create gs://iptv-menu-prod-build-artifacts --location=$REGION

# Apply CORS configurations to enable browser signed URL uploads
gcloud storage buckets update gs://iptv-menu-prod-user-uploads --cors-file=infra/storage/cors.json
```

---

## 3. Configure Google Secret Manager
Create and store the runtime secrets:

```bash
# Create secrets
gcloud secrets create FIREBASE_PRIVATE_KEY
gcloud secrets create STRIPE_SECRET_KEY
gcloud secrets create STRIPE_WEBHOOK_SECRET

# Write secret values (e.g., Stripe secret key)
echo -n "sk_live_..." | gcloud secrets versions add STRIPE_SECRET_KEY --data-file=-
```

---

## 4. Deploy Firestore Rules
From the monorepo root, log in and push Firestore configurations:

```bash
# Log in to Firebase CLI
firebase login

# Select active Firebase project
firebase use $PROJECT_ID

# Deploy rules and compound indexes
firebase deploy --only firestore
```

---

## 5. Execute Cloud Run Deployments
Execute the integrated deploy orchestrator to containerize and spin up API and Worker workloads:

```bash
# Grant execution permissions
chmod +x infra/cloudrun/deploy.sh

# Deploy services
./infra/cloudrun/deploy.sh
```
