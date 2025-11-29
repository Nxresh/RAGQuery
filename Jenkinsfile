pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_CREDENTIALS_ID = 'docker-hub-credentials'
        K8S_NAMESPACE = 'ragquery'
        GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo "Building commit: ${GIT_COMMIT_SHORT}"
            }
        }
        
        stage('Build Backend Image') {
            steps {
                script {
                    docker.build("ragquery-backend:${GIT_COMMIT_SHORT}", "-f Dockerfile .")
                    docker.build("ragquery-backend:latest", "-f Dockerfile .")
                }
            }
        }
        
        stage('Build Frontend Image') {
            steps {
                script {
                    docker.build("ragquery-frontend:${GIT_COMMIT_SHORT}", "-f Dockerfile.frontend .")
                    docker.build("ragquery-frontend:latest", "-f Dockerfile.frontend .")
                }
            }
        }
        
        stage('Test') {
            steps {
                echo 'Running tests...'
                // Add your test commands here
                // sh 'npm test'
            }
        }
        
        stage('Security Scan') {
            steps {
                echo 'Scanning images for vulnerabilities...'
                // Optional: Add Trivy or similar scanner
                // sh 'trivy image ragquery-backend:latest'
            }
        }
        
        stage('Push Images') {
            when {
                branch 'main'
            }
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", DOCKER_CREDENTIALS_ID) {
                        docker.image("ragquery-backend:${GIT_COMMIT_SHORT}").push()
                        docker.image("ragquery-backend:latest").push()
                        docker.image("ragquery-frontend:${GIT_COMMIT_SHORT}").push()
                        docker.image("ragquery-frontend:latest").push()
                    }
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            when {
                branch 'main'
            }
            steps {
                script {
                    sh '''
                        kubectl apply -f k8s/namespace.yaml
                        kubectl apply -f k8s/secrets.yaml
                        kubectl apply -f k8s/configmap.yaml
                        kubectl apply -f k8s/persistent-volume.yaml
                        kubectl apply -f k8s/backend-deployment.yaml
                        kubectl apply -f k8s/backend-service.yaml
                        kubectl apply -f k8s/frontend-deployment.yaml
                        kubectl apply -f k8s/frontend-service.yaml
                    '''
                    
                    // Wait for rollout
                    sh "kubectl rollout status deployment/backend -n ${K8S_NAMESPACE}"
                    sh "kubectl rollout status deployment/frontend -n ${K8S_NAMESPACE}"
                }
            }
        }
        
        stage('Verify Deployment') {
            when {
                branch 'main'
            }
            steps {
                script {
                    sh "kubectl get pods -n ${K8S_NAMESPACE}"
                    sh "kubectl get services -n ${K8S_NAMESPACE}"
                }
            }
        }
    }
    
    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed!'
            // Optional: Add rollback logic
            // sh "kubectl rollout undo deployment/backend -n ${K8S_NAMESPACE}"
        }
        always {
            cleanWs()
        }
    }
}
