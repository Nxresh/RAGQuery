#!/bin/bash

# Deployment script for Kubernetes
set -e

NAMESPACE="ragquery"
TIMEOUT="300s"

echo "🚀 Starting deployment to Kubernetes..."

# Apply configurations in order
echo "📦 Creating namespace..."
kubectl apply -f k8s/namespace.yaml

echo "🔐 Creating secrets and configmap..."
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml

echo "💾 Creating persistent volume..."
kubectl apply -f k8s/persistent-volume.yaml

echo "🔧 Deploying backend..."
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

echo "🌐 Deploying frontend..."
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=$TIMEOUT deployment/backend -n $NAMESPACE
kubectl wait --for=condition=available --timeout=$TIMEOUT deployment/frontend -n $NAMESPACE

echo "✅ Deployment successful!"
echo ""
echo "📊 Current status:"
kubectl get pods -n $NAMESPACE
echo ""
kubectl get services -n $NAMESPACE
echo ""
echo "🎉 Application is ready!"
