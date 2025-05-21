pipeline {
  agent any

  parameters {
    choice(name: 'FLAG_STATE', choices: ['on', 'off'], description: 'Set the state of the feature flag show-beta-banner')
  }

  environment {
    IMAGE_NAME = "my-microservice:latest"
  }

  stages {
    stage('Checkout') {
      steps {
        git branch: 'main', url: 'https://github.com/aithrien-of-ravenholdt/my-microservice.git'
      }
    }

    stage('Toggle Feature Flag') {
      steps {
        script {
          echo "Setting Unleash flag 'show-beta-banner' to ${params.FLAG_STATE}"

          def action = (params.FLAG_STATE == 'on') ? 'on' : 'off'

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

    stage('Install dependencies') {
      steps {
        sh 'npm install'
      }
    }

    stage('Lint') {
      steps {
        sh 'npm run lint > eslint-report.txt || true'
        archiveArtifacts artifacts: 'eslint-report.txt', fingerprint: true
      }
    }

    stage('Run Tests') {
      steps {
        sh '''
          mkdir -p test-results
          npm test || true
        '''
      }
    }

    stage('Publish Test Results') {
      steps {
        junit 'test-results/junit.xml'
      }
    }

    stage('Build Docker Image') {
      steps {
        sh 'docker build -t $IMAGE_NAME .'
      }
    }

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

    stage('Verify Kube Access') {
      steps {
        sh 'kubectl config current-context || echo "❌ No Kube context loaded"'
        sh 'kubectl get nodes || echo "❌ Cluster unreachable"'
      }
    }

    stage('Helm Deploy') {
      steps {
        echo "Deploying with Helm..."
        sh 'helm upgrade --install my-microservice ./my-microservice-chart'
      }
    }

    stage('Wait for Pod Readiness') {
      steps {
        echo "⏳ Waiting for my-microservice pod to be ready..."
        sh 'kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=my-microservice --timeout=60s'
      }
    }

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

    stage('Capture App Logs') {
      steps {
        echo "📦 Capturing runtime logs from deployed pod..."
        sh 'kubectl logs -l app.kubernetes.io/instance=my-microservice --tail=100 > app-runtime.log'
        archiveArtifacts artifacts: 'app-runtime.log', fingerprint: true
      }
    }
  }

  post {
    always {
      sh 'docker stop microservice || true'
    }
  }
}
 
