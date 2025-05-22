// Jenkinsfile for CI/CD Release Engineering Lab
// Includes: dual-mode logic for CI/CD pipeline and feature flag showcase

pipeline {
  agent any

  // Feature flag toggle: user can control 'show-beta-banner' from Jenkins UI
  parameters {
    choice(
      name: 'FLAG_STATE',
      choices: ['on', 'off'],
      description: '''Feature Flag: show-beta-banner
Toggles the beta message visibility in app response.

🟢 on  → Show beta banner message
🔴 off → Hide banner, send default only'''
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

    // Toggle feature flag remotely before deploy
    stage('Toggle Feature Flag') {
      when {
        expression { env.JOB_NAME?.toLowerCase()?.contains('toggle-flag') }
      }
      steps {
        script {
          echo "Setting Unleash flag 'show-beta-banner' to ${params.FLAG_STATE}"
          def action = (params.FLAG_STATE == 'on') ? 'on' : 'off'

          withCredentials([string(credentialsId: 'unleash-admin-token', variable: 'UNLEASH_ADMIN_TOKEN')]) {
            sh """
              curl -X POST http://localhost:4242/api/admin/projects/default/features/show-beta-banner/environments/development/${action} \\
                -H "Authorization: Bearer $UNLEASH_ADMIN_TOKEN" \\
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
      when {
        expression { !env.JOB_NAME?.toLowerCase()?.contains('toggle-flag') }
      }
      steps {
        sh 'npm run lint > eslint-report.txt || true'
        archiveArtifacts artifacts: 'eslint-report.txt', fingerprint: true
      }
    }

    // Run tests and capture test results
    stage('Run Tests') {
      when {
        expression { !env.JOB_NAME?.toLowerCase()?.contains('toggle-flag') }
      }
      steps {
        sh 'mkdir -p test-results && npm test || true'
      }
    }

    // Publish test output in JUnit format
    stage('Publish Test Results') {
      when {
        expression { !env.JOB_NAME?.toLowerCase()?.contains('toggle-flag') }
      }
      steps {
        junit 'test-results/junit.xml'
      }
    }

    // Build container image
    stage('Build Docker Image') {
      when {
        expression { !env.JOB_NAME?.toLowerCase()?.contains('toggle-flag') }
      }
      steps {
        sh 'docker build -t $IMAGE_NAME .'
      }
    }

    // Authenticate with Docker Hub
    stage('Docker Login') {
      when {
        expression { !env.JOB_NAME?.toLowerCase()?.contains('toggle-flag') }
      }
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
        }
      }
    }

    // Tag and push image to registry
    stage('Tag & Push Docker Image') {
      when {
        expression { !env.JOB_NAME?.toLowerCase()?.contains('toggle-flag') }
      }
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          sh 'docker tag my-microservice:latest "$DOCKER_USER/my-microservice:latest"'
          sh 'docker push "$DOCKER_USER/my-microservice:latest"'
        }
      }
    }

    // Confirm Kubernetes access before deploying
    stage('Verify Kube Access') {
      when {
        expression { !env.JOB_NAME?.toLowerCase()?.contains('toggle-flag') }
      }
      steps {
        sh 'kubectl config current-context || echo "❌ No Kube context loaded"'
        sh 'kubectl get nodes || echo "❌ Cluster unreachable"'
      }
    }

    // Deploy microservice with Helm
    stage('Helm Deploy') {
      when {
        expression { !env.JOB_NAME?.toLowerCase()?.contains('toggle-flag') }
      }
      steps {
        sh 'helm upgrade --install my-microservice ./my-microservice-chart'
      }
    }

    // Wait until the app pod is marked ready
    stage('Wait for Pod Readiness') {
      when {
        expression { !env.JOB_NAME?.toLowerCase()?.contains('toggle-flag') }
      }
      steps {
        sh 'kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=my-microservice --timeout=60s'
      }
    }

    // Log and store Unleash feature flag state
    stage('Log All Feature Flags') {
      steps {
        withCredentials([string(credentialsId: 'unleash-admin-token', variable: 'UNLEASH_ADMIN_TOKEN')]) {
          sh '''
            curl -s http://localhost:4242/api/admin/projects/default/features \
              -H "Authorization: Bearer $UNLEASH_ADMIN_TOKEN" \
              -H "Content-Type: application/json" > unleash-flags.json
            cat unleash-flags.json
          '''
        }
        archiveArtifacts artifacts: 'unleash-flags.json', fingerprint: true
      }
    }

    // Simple health check via curl with rollback if 200 not received
    stage('Health Check & Auto-Rollback') {
      when {
        expression { !env.JOB_NAME?.toLowerCase()?.contains('toggle-flag') }
      }
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
        withCredentials([string(credentialsId: 'unleash-admin-token', variable: 'UNLEASH_ADMIN_TOKEN')]) {
          sh '''
            UNLEASH_URL=http://localhost:4242/api \
            UNLEASH_API_TOKEN=$UNLEASH_ADMIN_TOKEN \
            nohup node app.js & sleep 5

            echo "<pre>" > rendered-output.html
            curl -s http://localhost:8888 >> rendered-output.html
            echo "</pre>" >> rendered-output.html

            pkill -f "node app.js"
          '''
          archiveArtifacts artifacts: 'rendered-output.html', fingerprint: true
        }
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
