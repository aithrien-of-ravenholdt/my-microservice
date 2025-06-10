// Jenkinsfile for CI/CD Release Engineering Lab
// Includes: deployment-time configuration change for beta banner (via BETA_BANNER_ENABLED param),
// quality gates, build, deployment, and observability.

pipeline {
  agent any

  // Deployment-time configuration: user can control 'show-beta-banner' from Jenkins UI
  parameters {
    choice(
      name: 'BETA_BANNER_ENABLED',
      choices: ['on', 'off'],
      description: '''Beta Banner Deployment Setting
Controls whether the beta banner is shown in app response.

✅ on  → Show the beta banner message
❌ off → Hide the beta banner (show default app response)

Note: This is a deployment-time configuration change, not a runtime feature flag.'''
    )
    string(
      name: 'POD_READINESS_TIMEOUT',
      defaultValue: '120',
      description: 'Timeout in seconds for pod readiness check'
    )
    string(
      name: 'HEALTH_CHECK_TIMEOUT',
      defaultValue: '30',
      description: 'Timeout in seconds for health check'
    )
    string(name: 'UNLEASH_TOKEN_CREDENTIAL_ID', defaultValue: 'unleash-admin-token', description: 'Jenkins credential ID for the Unleash admin token')
  }

  environment {
    IMAGE_NAME = "my-microservice:latest"
    UNLEASH_URL = "http://localhost:4242"
    K8S_SERVICE_NAME = "my-microservice-my-microservice-chart"
    FORWARD_PORT = "8888"
    APP_PORT = "3000"
  }

  stages {
    // Pull source code
    stage('Checkout') {
      steps {
        git branch: 'main', url: 'https://github.com/aithrien-of-ravenholdt/my-microservice.git'
      }
    }

    // Apply deployment-time configuration change for beta banner
    stage('Set Beta Banner Config') {
      steps {
        script {
          echo "Setting beta banner configuration to ${params.BETA_BANNER_ENABLED}"
          
          def action = (params.BETA_BANNER_ENABLED == 'on') ? 'on' : 'off'
          
          withCredentials([string(credentialsId: 'unleash-admin-token', variable: 'UNLEASH_ADMIN_TOKEN')]) {
            sh '''
              curl -X POST http://localhost:4242/api/admin/features/show-beta-banner/environments/development/${action} \
                -H "Authorization: Bearer ${UNLEASH_ADMIN_TOKEN}" \
                -H "Content-Type: application/json"
            '''
          }
        }
      }
    }

    // Install project dependencies
    stage('Install dependencies') {
      steps {
        sh 'npm install'
      }
    }

    // Lint and archive static analysis results
    stage('Lint') {
      steps {
        script {
          try {
            sh 'npm run lint'
          } catch (Exception e) {
            echo 'Linting failed, but continuing pipeline'
            currentBuild.result = 'UNSTABLE'
          }
        }
      }
    }

    // Run tests and capture test results
    stage('Run Tests') {
      steps {
        script {
          try {
            sh '''
              mkdir -p test-results
              npm test
            '''
          } catch (error) {
            echo "Tests failed, but continuing pipeline"
            sh 'echo "Tests failed: ${error.message}" > test-results/test-failure.txt'
          }
        }
      }
    }

    // Publish test output in JUnit format
    stage('Publish Test Results') {
      steps {
        junit 'test-results/junit.xml'
        archiveArtifacts artifacts: 'test-results/test-failure.txt', allowEmptyArchive: true
      }
    }

    // Build container image
    stage('Build Docker Image') {
      steps {
        sh 'docker build -t $IMAGE_NAME .'
      }
    }
    
    // Scan container image for vulnerabilities
    stage('Trivy Scan') {
      when {
        expression { false }
      }
      steps {
        echo "Scanning Docker image with Trivy (Docker-based, with volume mount)..."
        sh '''
          docker run --rm \
            -v /var/run/docker.sock:/var/run/docker.sock \
            -v $(pwd):/report/ \
            aquasec/trivy image \
            --exit-code 0 \
            --severity HIGH,CRITICAL \
            $IMAGE_NAME

          docker run --rm \
            -v /var/run/docker.sock:/var/run/docker.sock \
            -v $(pwd):/report/ \
            aquasec/trivy image \
            --format json \
            --output /report/trivy-report.json \
            $IMAGE_NAME
        '''
        archiveArtifacts artifacts: 'trivy-report.json', fingerprint: true
      }
    }

    // Authenticate with Docker Hub
    stage('Docker Login') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'dockerhub-creds',
          usernameVariable: 'DOCKER_USER',
          passwordVariable: 'DOCKER_PASS'
        )]) {
          sh '''
            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
          '''
        }
      }
    }

    // Tag and push image to registry
    stage('Tag & Push Docker Image') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'dockerhub-creds',
          usernameVariable: 'DOCKER_USER',
          passwordVariable: 'DOCKER_PASS'
        )]) {
          sh '''
            docker tag my-microservice:latest "$DOCKER_USER/my-microservice:latest"
            docker push "$DOCKER_USER/my-microservice:latest"
          '''
        }
      }
    }

    // Confirm Kubernetes access before deploying
    stage('Verify Kube Access') {
      steps {
        script {
          try {
            sh 'kubectl config current-context'
            sh 'kubectl get nodes'
          } catch (error) {
            error "Failed to verify Kubernetes access: ${error.message}"
          }
        }
      }
    }

    // Deploy microservice with Helm
    stage('Helm Deploy') {
      steps {
        echo 'Deploying with Helm...'
        withCredentials([string(credentialsId: 'unleash-admin-token', variable: 'UNLEASH_API_TOKEN')]) {
          sh '''
            pwd
            ls -la
            cd my-microservice-chart
            pwd
            ls -la
            
            # Create Kubernetes secret with Unleash token
            kubectl create secret generic unleash-api-token \
              --from-literal=token="${UNLEASH_API_TOKEN}" \
              --dry-run=client -o yaml | kubectl apply -f -
            
            # Build dependencies using local chart
            helm dependency build
            helm upgrade --install my-microservice . --set unleash.url=http://unleash-server.unleash.svc.cluster.local:4242/api/
          '''
        }
      }
    }

    // Wait until the app pod is marked ready
    stage('Wait for Pod Readiness') {
      steps {
        echo "Waiting for my-microservice pod to be ready..."
        sh "kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=my-microservice --timeout=${params.POD_READINESS_TIMEOUT}s"
      }
    }

    // Log and store all feature flag states from Unleash
    stage('Log All Feature Flags') {
      steps {
        script {
          echo "Fetching current feature flags from Unleash..."

          withCredentials([string(credentialsId: 'unleash-admin-token', variable: 'UNLEASH_ADMIN_TOKEN')]) {
            sh """
              curl -s ${UNLEASH_URL}/api/admin/projects/default/features \\
                -H "Authorization: Bearer \$UNLEASH_ADMIN_TOKEN" \\
                -H "Content-Type: application/json" > unleash-flags.json

              echo "Feature Flags Snapshot:"
              cat unleash-flags.json
            """
          }

          archiveArtifacts artifacts: 'unleash-flags.json', fingerprint: true
        }
      }
    }

    // Simple health check via curl with rollback if 200 not received
    stage('Health Check & Auto-Rollback') {
      steps {
        script {
          echo "Running basic health check..."
          def portForwardProcess = null

          try {
            // Start port-forward in background
            portForwardProcess = sh(
              script: "kubectl port-forward svc/${K8S_SERVICE_NAME} ${FORWARD_PORT}:${APP_PORT} &",
              returnStdout: true
            ).trim()
            
            // Wait for port-forward to be ready
            sleep 5

            // Perform health check with timeout
            def healthCode = sh(
              script: "timeout ${params.HEALTH_CHECK_TIMEOUT} curl -s -o /dev/null -w '%{http_code}' http://localhost:${FORWARD_PORT}/health",
              returnStdout: true
            ).trim()

            if (healthCode != '200') {
              echo "❌ Health check failed — rolling back"
              sh 'helm rollback my-microservice 1'
              error("Deployment failed health check. Rolled back.")
            } else {
              echo "✅ Health check passed — app is healthy"
            }
          } catch (error) {
            echo "❌ Health check failed — rolling back"
            sh 'helm rollback my-microservice 1'
            error("Deployment failed health check: ${error.message}. Rolled back.")
          } finally {
            // Cleanup port-forward
            if (portForwardProcess) {
              sh "pkill -f 'kubectl port-forward' || true"
            }
          }
        }
      }
    }
  
    // Fetch rendered HTML response from root route
    stage('Capture Rendered App Output') {
      steps {
        echo "Fetching actual app response from root route..."
        sh """
          echo "<pre>" > rendered-output.html
          curl -s http://localhost:${FORWARD_PORT} >> rendered-output.html
          echo "</pre>" >> rendered-output.html
        """
        archiveArtifacts artifacts: 'rendered-output.html', fingerprint: true
      }
    }  
  }

  // Cleanup hook
  post {
    always {
      sh 'docker stop microservice || true'
      sh "pkill -f 'kubectl port-forward' || true"
    }
    success {
      echo "Pipeline completed successfully!"
    }
    failure {
      echo "Pipeline failed!"
    }
  }
}
