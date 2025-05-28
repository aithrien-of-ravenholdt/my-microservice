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
❌ off → Hide the beta banner (show default only)

Note: This is a deployment-time configuration change, not a runtime feature flag.'''
    )
  }

  environment {
    IMAGE_NAME = "my-microservice:latest"
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
            sh """
              curl -X POST http://localhost:4242/api/admin/projects/default/features/show-beta-banner/environments/development/${action} \\
                -H "Authorization: Bearer \$UNLEASH_ADMIN_TOKEN" \\
                -H "Content-Type: application/json"
            """
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
        sh 'npm run lint > eslint-report.txt || true'
        archiveArtifacts artifacts: 'eslint-report.txt', fingerprint: true
      }
    }

    // Run tests and capture test results
    stage('Run Tests') {
      steps {
        sh '''
          mkdir -p test-results
          npm test || true
        '''
      }
    }

    // Publish test output in JUnit format
    stage('Publish Test Results') {
      steps {
        junit 'test-results/junit.xml'
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
      steps {
        echo "🔍 Scanning Docker image with Trivy..."
        sh '''
          docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image --exit-code 0 --severity HIGH,CRITICAL $IMAGE_NAME || true
          docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image --format json --output trivy-report.json $IMAGE_NAME || true
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
        sh 'kubectl config current-context || echo "❌ No Kube context loaded"'
        sh 'kubectl get nodes || echo "❌ Cluster unreachable"'
      }
    }

    // Deploy microservice with Helm
    stage('Helm Deploy') {
      steps {
        echo "Deploying with Helm..."
        sh 'helm upgrade --install my-microservice ./my-microservice-chart'
      }
    }

    // Wait until the app pod is marked ready
    stage('Wait for Pod Readiness') {
      steps {
        echo "⏳ Waiting for my-microservice pod to be ready..."
        sh 'kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=my-microservice --timeout=60s'
      }
    }

    // Log and store all feature flag states from Unleash
    stage('Log All Feature Flags') {
      steps {
        script {
          echo "Fetching current feature flags from Unleash..."

          withCredentials([string(credentialsId: 'unleash-admin-token', variable: 'UNLEASH_ADMIN_TOKEN')]) {
            sh '''
              curl -s http://localhost:4242/api/admin/projects/default/features \
                -H "Authorization: Bearer $UNLEASH_ADMIN_TOKEN" \
                -H "Content-Type: application/json" > unleash-flags.json

              echo "🔍 Feature Flags Snapshot:"
              cat unleash-flags.json
            '''
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

          sh 'kubectl port-forward svc/my-microservice-my-microservice-chart 8888:3000 &'
          sleep 5

          def healthCode = sh(
            script: 'curl -s -o /dev/null -w "%{http_code}" http://localhost:8888/health',
            returnStdout: true
          ).trim()

          if (healthCode != '200') {
            echo "❌ Health check failed — rolling back"
            sh 'helm rollback my-microservice 1'
            error("Deployment failed health check. Rolled back.")
          } else {
            echo "✅ Health check passed — app is healthy"
          }
        }
      }
    }
  
    // Fetch rendered HTML response from root route
    stage('Capture Rendered App Output') {
      steps {
        echo "📥 Fetching actual app response from root route..."
        sh '''
          echo "<pre>" > rendered-output.html
          curl -s http://localhost:8888 >> rendered-output.html
          echo "</pre>" >> rendered-output.html
        '''
        archiveArtifacts artifacts: 'rendered-output.html', fingerprint: true
      }
    }  
  }

  // Cleanup hook
  post {
    always {
      sh 'docker stop microservice || true'
    }
  }
}
