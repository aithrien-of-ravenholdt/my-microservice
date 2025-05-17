pipeline {
  agent any

  environment {
    IMAGE_NAME = "my-microservice:latest"
  }

  stages {
    stage('Checkout') {
      steps {
        git branch: 'main', url: 'https://github.com/aithrien-of-ravenholdt/my-microservice.git'
      }
    }

    stage('Install dependencies') {
      steps {
        sh 'npm install'
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

    stage('Health Check & Auto-Rollback') {
      steps {
        script {
          echo "Starting health check with kubectl port-forward..."

          // Start port-forward in background
          sh 'kubectl port-forward svc/my-microservice-my-microservice-chart 8888:3000 &'
          
          // Wait for it to stabilize
          sleep 5

          def healthCode = sh(
            script: 'curl -s -o /dev/null -w "%{http_code}" http://localhost:8888',
            returnStdout: true
          ).trim()

          echo "Health check returned HTTP ${healthCode}"

          if (healthCode != '200') {
            echo "❌ Health check failed — rolling back"
            sh 'helm rollback my-microservice 3'
            error("Deployment failed health check. Rolled back.")
          } else {
            echo "✅ Health check passed — app is healthy"
          }
        }
      }
    }
  }

  post {
    always {
      sh 'docker stop microservice || true'
    }
  }
}
