# RAGQuery - Production Deployment Guide

## Prerequisites

### 1. Install Required Tools

**Docker:**
```bash
# Windows (using Chocolatey)
choco install docker-desktop

# Verify installation
docker --version
```

**Minikube (Local Kubernetes):**
```bash
# Windows (using Chocolatey)
choco install minikube

# Start Minikube
minikube start --driver=docker --memory=4096 --cpus=2

# Verify
kubectl get nodes
```

**kubectl:**
```bash
# Windows (using Chocolatey)
choco install kubernetes-cli

# Verify
kubectl version --client
```

**Jenkins (Optional - for CI/CD):**
```bash
# Run Jenkins in Docker
docker run -d -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  --name jenkins \
  jenkins/jenkins:lts
```

---

## Quick Start (Docker Compose)

### 1. Set Environment Variables

Create `.env` file in project root:
```bash
API_KEY=your_google_generative_ai_api_key_here
```

### 2. Build and Run

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f

# Access the app
# Frontend: http://localhost
# Backend API: http://localhost:3000
```

### 3. Stop Services

```bash
docker-compose down
```

---

## Kubernetes Deployment (Minikube)

### 1. Build Docker Images

```bash
# Enable Minikube Docker environment
eval $(minikube docker-env)

# Build backend
docker build -t ragquery-backend:latest -f Dockerfile .

# Build frontend
docker build -t ragquery-frontend:latest -f Dockerfile.frontend .

# Verify images
docker images | grep ragquery
```

### 2. Update Secrets

Edit `k8s/secrets.yaml` and replace `YOUR_GOOGLE_GENERATIVE_AI_API_KEY_HERE` with your actual API key.

### 3. Deploy to Kubernetes

```bash
# Apply all configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/persistent-volume.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

# Wait for pods to be ready
kubectl get pods -n ragquery -w
```

### 4. Access the Application

```bash
# Get Minikube IP
minikube ip

# Access frontend
# http://<minikube-ip>:30080
```

### 5. Verify Deployment

```bash
# Check pod status
kubectl get pods -n ragquery

# Check services
kubectl get services -n ragquery

# View logs
kubectl logs -f deployment/backend -n ragquery
kubectl logs -f deployment/frontend -n ragquery

# Describe pod (for troubleshooting)
kubectl describe pod <pod-name> -n ragquery
```

---

## Jenkins CI/CD Setup

### 1. Access Jenkins

```bash
# Get initial admin password
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

# Open browser: http://localhost:8080
```

### 2. Install Plugins

- Docker Pipeline
- Kubernetes CLI
- Git

### 3. Configure Credentials

1. Go to: Manage Jenkins → Manage Credentials
2. Add Docker Hub credentials (ID: `docker-hub-credentials`)
3. Add Kubernetes config (if using remote cluster)

### 4. Create Pipeline Job

1. New Item → Pipeline
2. Configure:
   - Definition: Pipeline script from SCM
   - SCM: Git
   - Repository URL: Your Git repo
   - Script Path: `Jenkinsfile`

### 5. Trigger Build

Click "Build Now" to start the CI/CD pipeline.

---

## Updating Firebase Configuration

### For Production Domain

When you get a domain, update these files:

**1. `k8s/configmap.yaml`:**
```yaml
data:
  FRONTEND_URL: "https://yourdomain.com"
```

**2. `components/Auth/FirebaseSignup.tsx`:**
```typescript
url: 'https://yourdomain.com/#/login'
```

**3. Firebase Console:**
- Go to Authentication → Settings → Authorized Domains
- Add your production domain

---

## Monitoring & Troubleshooting

### View Logs

```bash
# Backend logs
kubectl logs -f deployment/backend -n ragquery

# Frontend logs
kubectl logs -f deployment/frontend -n ragquery

# All pods
kubectl logs -f -l app=ragquery -n ragquery
```

### Check Resource Usage

```bash
kubectl top pods -n ragquery
kubectl top nodes
```

### Restart Deployment

```bash
kubectl rollout restart deployment/backend -n ragquery
kubectl rollout restart deployment/frontend -n ragquery
```

### Rollback Deployment

```bash
# View rollout history
kubectl rollout history deployment/backend -n ragquery

# Rollback to previous version
kubectl rollout undo deployment/backend -n ragquery
```

### Delete Everything

```bash
kubectl delete namespace ragquery
```

---

## Security Best Practices

1. **Never commit secrets to Git:**
   - Use Kubernetes Secrets
   - Use environment variables
   - Use `.gitignore` for sensitive files

2. **Update secrets.yaml before deploying:**
   ```bash
   # Create secret from command line (more secure)
   kubectl create secret generic ragquery-secrets \
     --from-literal=api-key=YOUR_KEY \
     -n ragquery
   ```

3. **Enable HTTPS in production:**
   - Use cert-manager for automatic SSL certificates
   - Configure Ingress with TLS

4. **Limit resource usage:**
   - Set resource requests and limits (already configured)
   - Monitor resource consumption

5. **Regular updates:**
   - Keep Docker images updated
   - Update dependencies regularly
   - Scan for vulnerabilities

---

## Next Steps

1. **Get a Domain:**
   - Use free services like Freenom or get a cheap domain
   - Configure DNS to point to your cluster

2. **Set up HTTPS:**
   - Install cert-manager in Kubernetes
   - Configure Let's Encrypt for free SSL certificates

3. **Migrate Database:**
   - Consider PostgreSQL for production
   - Set up database backups

4. **Add Monitoring:**
   - Prometheus for metrics
   - Grafana for dashboards
   - ELK stack for logs

5. **Implement Auto-scaling:**
   - Horizontal Pod Autoscaler (HPA)
   - Cluster autoscaling

---

## Support

For issues or questions:
1. Check logs: `kubectl logs -f deployment/backend -n ragquery`
2. Verify pod status: `kubectl get pods -n ragquery`
3. Check events: `kubectl get events -n ragquery`
