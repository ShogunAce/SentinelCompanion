#!/usr/bin/env bash
set -e

PROJECT_ID="pathfinder-engine"
SERVICE_NAME="sentinel-app"
REGION="us-central1"

echo "🚀 Deploying Sentinel to Google Cloud Run and Firebase Hosting..."
echo "Project ID: $PROJECT_ID"

# 1. Set gcloud project
gcloud config set project $PROJECT_ID

# 2. Deploy to Cloud Run with max-instances=1 (critical for in-memory scanner rate limits)
echo "📦 Building container and deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --allow-unauthenticated \
  --max-instances 1 \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars SCANNER_CONTACT="coleslaysolutions@gmail.com",TRUST_PROXY_HOPS=1

# 3. Deploy Firestore Security Rules & Firebase Hosting
echo "🔥 Deploying Firestore security rules and Firebase Hosting..."
npx firebase-tools deploy --only firestore:rules,hosting --project $PROJECT_ID

echo "✅ Sentinel Deployment successfully finished!"
