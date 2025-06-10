# 🧪 my-microservice — Release Engineering Lab

<p align="center">
  <img src="https://img.shields.io/badge/Jenkins-CI%2FCD-red?logo=jenkins&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Container-blue?logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Kubernetes-Orchestration-326ce5?logo=kubernetes&logoColor=white" />
  <img src="https://img.shields.io/badge/Helm-Package%20Manager-0F1689?logo=helm&logoColor=white" />
  <img src="https://img.shields.io/badge/Unleash-Feature%20Flags-orange?logo=unleash&logoColor=white" />
</p>

This project is a complete, hands-on CI/CD lab, built to simulate a real-world DevOps and release pipeline lifecycle, from building and testing a Node.js microservice to containerizing it with Docker and deploying to Kubernetes using Helm.
 
📝 While originally inspired by a standard Express template, the application logic was fully rewritten and restructured to serve as a clean, integration-friendly foundation for advanced CI/CD tooling. There is no inherited logic or boilerplate from the original source.
 
The real focus of this lab is not the app itself, but the automated infrastructure surrounding it, including Jenkins pipelines, DockerHub integration, test and lint quality gates, Helm deployments, rollback automation, and Kubernetes-based health checks.

---

## 📁 Project Structure

```
my-microservice/
├── app.js                 # Main application file
├── Dockerfile            # Multi-stage Docker build
├── package.json          # Node.js dependencies and scripts
├── package-lock.json     # Locked dependencies
├── test/                 # Jest test files
│   └── hello.test.js
├── test-results/         # Test output in JUnit format
│   └── junit.xml
├── my-microservice-chart/ # Helm chart for Kubernetes deployment
│   ├── Chart.yaml        # Chart metadata and dependencies
│   ├── values.yaml       # Configurable values
│   └── templates/        # Kubernetes manifests
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── ingress.yaml
│       └── hpa.yaml
├── eslint.config.mjs     # ESLint configuration
└── Jenkinsfile          # CI/CD pipeline definition
```

---

## 🚀 Prerequisites

### System Requirements
- Ubuntu 24.04 or similar Linux distribution
- 4GB RAM minimum
- 20GB free disk space

### Required Software
1. **Docker**
   ```bash
   sudo apt-get update
   sudo apt-get install docker.io
   sudo systemctl enable --now docker
   sudo usermod -aG docker $USER
   ```

2. **Node.js 18+**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Git**
   ```bash
   sudo apt-get install git
   ```

4. **Jenkins**
   ```bash
   curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
     /usr/share/keyrings/jenkins-keyring.asc > /dev/null
   echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
     https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
     /etc/apt/sources.list.d/jenkins.list > /dev/null
   sudo apt-get update
   sudo apt-get install jenkins
   ```

   Required Jenkins plugins:
   - Pipeline
   - Docker Pipeline
   - Kubernetes
   - Git
   - Credentials Binding
   - JUnit
   - HTML Publisher

5. **Minikube**
   ```bash
   curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
   sudo install minikube-linux-amd64 /usr/local/bin/minikube
   ```

6. **Helm 3.x**
   ```bash
   curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
   ```

7. **Ngrok** (for GitHub Webhooks)
   ```bash
   sudo snap install ngrok
   ```

8. **Development Tools**
   ```bash
   # Jest and testing tools
   npm install --save-dev jest jest-junit

   # ESLint
   npm install --save-dev eslint

   # Trivy (for container scanning)
   docker pull aquasec/trivy
   ```

---

## ✅ Step-by-Step Guide

### 🔧 Part 1: Project Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/my-microservice.git
   cd my-microservice
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start local development:
   ```bash
   npm start
   ```

---

### 🛠️ Part 2: Jenkins Pipeline

The `Jenkinsfile` defines a complete CI/CD pipeline with the following stages:

1. **Checkout**
   - Clones the repository
   - Uses the main branch

2. **Set Beta Banner Config**
   - Configures the beta banner feature flag
   - Uses Unleash API for feature management
   - Requires `unleash-admin-token` credential in Jenkins

3. **Install Dependencies**
   - Runs `npm install`
   - Installs all required Node.js packages

4. **Lint**
   - Runs ESLint
   - Generates `eslint-report.txt`
   - Archives the report as a build artifact

5. **Run Tests**
   - Executes Jest tests
   - Generates JUnit XML report
   - Continues pipeline even if tests fail (for demo purposes)

6. **Publish Test Results**
   - Publishes JUnit test results
   - Makes results visible in Jenkins UI

7. **Build Docker Image**
   - Builds the Docker image
   - Uses multi-stage build for smaller image size

8. **Trivy Scan**
   - Scans Docker image for vulnerabilities
   - Generates `trivy-report.json`
   - Currently disabled in pipeline (can be enabled)

9. **Docker Login**
   - Authenticates with DockerHub
   - Uses `dockerhub-creds` credential in Jenkins

10. **Tag & Push Docker Image**
    - Tags image with DockerHub username
    - Pushes to DockerHub repository

11. **Verify Kube Access**
    - Checks Kubernetes cluster access
    - Verifies node availability

12. **Helm Deploy**
    - Deploys using Helm chart
    - Uses `my-microservice-chart`

13. **Wait for Pod Readiness**
    - Waits for pods to be ready
    - Configurable timeout

14. **Log All Feature Flags**
    - Captures current feature flag states
    - Generates `unleash-flags.json`

15. **Health Check & Auto-Rollback**
    - Performs health check
    - Automatically rolls back on failure
    - Uses port-forwarding for local access

16. **Capture Rendered App Output**
    - Captures application response
    - Generates `rendered-output.html`

### Required Jenkins Credentials

1. **DockerHub Credentials**
   - ID: `dockerhub-creds`
   - Type: Username with password
   - Username: Your DockerHub username
   - Password: Your DockerHub access token

2. **Unleash Admin Token**
   - ID: `unleash-admin-token`
   - Type: Secret text
   - Secret: Your Unleash admin API token

3. **Kubernetes Configuration**
   - Ensure `~/.kube/config` is accessible to Jenkins
   - Or use Kubernetes credentials plugin

### Pipeline Configuration

1. Create a new Pipeline job in Jenkins
2. Configure GitHub repository
3. Set build trigger to "GitHub hook trigger for GITScm polling"
4. Set pipeline script from SCM
5. Configure SCM as Git
6. Set repository URL and credentials
7. Set branch to `*/main`
8. Set script path to `Jenkinsfile`

---

### ☸️ Part 3: Kubernetes Deployment

#### 3A. Local Cluster Setup
```bash
# Start Minikube
minikube start --driver=docker

# Enable required addons
minikube addons enable ingress
minikube addons enable metrics-server

# Verify cluster
kubectl get nodes
```

#### 3B. Helm Chart Deployment
```bash
# Add Unleash repository
helm repo add unleash https://docs.getunleash.io/helm-charts
helm repo update

# Install Unleash
helm install unleash unleash/unleash --set postgresql.enabled=true

# Deploy the application
helm upgrade --install my-microservice ./my-microservice-chart
```

#### 3C. Verify Deployment
```bash
# Check pods
kubectl get pods

# Check services
kubectl get svc

# Port-forward for local access
kubectl port-forward svc/unleash-server 4242:4242
kubectl port-forward svc/my-microservice 3000:3000
```

---

### 🐳 Part 4: DockerHub Publishing

1. Create DockerHub account and repository
2. Add DockerHub credentials to Jenkins
3. In `Jenkinsfile`, push image:
   ```bash
   docker tag my-microservice:latest youruser/my-microservice:latest
   docker push youruser/my-microservice:latest
   ```
4. Pull and run locally:
   ```bash
   docker pull youruser/my-microservice
   docker run -p 3000:3000 youruser/my-microservice
   ```

---

### 🧪 Part 5: Jest Integration

1. Install Jest + jest-junit:
   ```bash
   npm install --save-dev jest jest-junit
   ```

2. Add test + config in `package.json`:
   ```json
   "test": "jest"
   ```

3. Generate JUnit output:
   ```json
   "jest": {
     "reporters": [
       "default",
       ["jest-junit", {
         "outputDirectory": "test-results",
         "outputName": "junit.xml"
       }]
     ]
   }
   ```

4. Jenkins parses `test-results/junit.xml` and shows results in UI

---

### 📦 Part 6: ESLint Integration

1. Install ESLint:
   ```bash
   npm install --save-dev eslint
   npx eslint --init
   ```

2. When prompted, select:
   ```
   - What do you want to lint? · javascript
   - How would you like to use ESLint? · problems
   - What type of modules does your project use? · commonjs
   - Which framework does your project use? · none
   - Does your project use TypeScript? · no
   - Where does your code run? · node
   - Install the recommended dependencies
   - Which package manager do you want to use? · npm
   ```

3. ESLint creates `eslint.config.mjs` (modern config format)

4. Add a script to `package.json`:
   ```json
   "lint": "eslint ."
   ```

5. Add Jenkinsfile lint stage:
   ```groovy
   stage('Lint') {
     steps {
       sh 'npm run lint > eslint-report.txt || true'
       archiveArtifacts artifacts: 'eslint-report.txt', fingerprint: true
     }
   }
   ```

---

### 🚩 Part 7: Unleash Integration

This lab integrates **Unleash** as a runtime feature flag manager, while also demonstrating a deployment-time configuration change using the `BETA_BANNER_ENABLED` parameter.

#### 7A. Installation & Setup

Add the Unleash Helm repository and install the Unleash server:
```bash
helm repo add unleash https://docs.getunleash.io/helm-charts
helm repo update
helm install unleash-server unleash/unleash --set postgresql.enabled=true
```

Port-forward the Unleash UI locally:
```bash
kubectl port-forward svc/unleash-server 4242:4242 --address 0.0.0.0
```

Access the Unleash UI at [http://localhost:4242](http://localhost:4242).

Default credentials:
- **Username:** `admin`
- **Password:** `unleash4all`

#### 7B. Generate an Admin API Token

1. Log into the Unleash UI.
2. Go to your **user profile → API Tokens**.
3. Create a new token with:
   - **Type:** Admin
   - **Project:** default
   - **Environment:** development
   - **Expiration:** Never (suggested for local testing)
4. Copy the generated token and store it in your `.env` file:
   ```
   UNLEASH_API_TOKEN=your-token-here
   ```

#### 7C. Create the Feature Flag

1. In the Unleash UI, navigate to **Projects → default → New Feature Toggle**.
2. Name it: `show-beta-banner`.
3. Set the type to `release` and enable it for the `development` environment.
4. Use the **Flexible Rollout** strategy:
   - Stickiness: `default`
   - Rollout: `100%`

#### 7D. Deployment-Time Configuration in Jenkins

In this lab, the pipeline uses a **deployment-time configuration parameter** called `BETA_BANNER_ENABLED` (`on` or `off`) to simulate changing application behavior:

- Jenkins reads this parameter from the pipeline UI.
- **calls the Unleash API** to set the beta banner config (`show-beta-banner`).
- This change takes effect **at deployment time** — it's not a runtime feature toggle in this scenario.

Jenkins uses this command internally:
```bash
curl -X POST http://localhost:4242/api/admin/projects/default/features/show-beta-banner/environments/development/on \
  -H "Authorization: Bearer $UNLEASH_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

The deployed application **fetches this value on boot** and uses it to decide whether to show the beta banner:
```
Welcome to the CI/CD Release Engineering Lab 🚀
🧪 Beta Feature: Releasing smarter, one flag at a time.
```

When `BETA_BANNER_ENABLED` is set to `off`, the second line is hidden.

> ⚠️ **Note:** In production, toggling feature flags would be done dynamically at runtime using Unleash (no redeploy required). 
> Here, we demonstrate a deploy-time configuration change for clarity and to showcase Jenkins pipeline flexibility.

---

### 🛡️ Part 8: Container Image Scanning with Trivy

This lab integrates **Trivy**, an open-source security scanner for Docker images.  
It ensures your container images don't contain known vulnerabilities, demonstrating supply chain security in your pipeline.

#### 8A. Installation & Setup

Instead of installing Trivy locally, we run it as a Docker container. The pipeline includes a dedicated **Trivy Scan** stage.
It's disabled by default, to include it in the pipeline run you must change the expression value to `true` at the start of the stage:

```groovy
stage('Trivy Scan') {
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
```

- `docker run` executes Trivy inside a container.
- It scans the built Docker image (`$IMAGE_NAME`).
- The second command saves a detailed **JSON vulnerability report**.
- Jenkins archives the `trivy-report.json` for inspection.

---

#### 8B. Report Details

- After the pipeline runs, the **`trivy-report.json`** file is available as a Jenkins artifact.
- It contains a full list of detected vulnerabilities, severity, and impacted packages.

> ⚠️ **Note:** In this lab, `--exit-code 0` allows the pipeline to continue while still archiving the security report for review.  
> In production, it's recommended to use `--exit-code 1` to fail the pipeline if HIGH or CRITICAL vulnerabilities are found.

---

## 🔍 Troubleshooting

### Common Issues

1. **Jenkins Pipeline Fails**
   - Check Jenkins credentials
   - Verify DockerHub access
   - Check Kubernetes configuration

2. **Kubernetes Deployment Issues**
   - Check pod logs: `kubectl logs <pod-name>`
   - Check pod status: `kubectl describe pod <pod-name>`
   - Verify service: `kubectl get svc`

3. **Unleash Connection Issues**
   - Verify port-forwarding
   - Check API token
   - Verify feature flag configuration

4. **Local Development Issues**
   - Check .env configuration
   - Verify Node.js version
   - Check port availability

---

## 📚 Additional Resources

- [Jenkins Pipeline Documentation](https://www.jenkins.io/doc/book/pipeline/)
- [Helm Documentation](https://helm.sh/docs/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Unleash Documentation](https://docs.getunleash.io/)
- [Docker Documentation](https://docs.docker.com/)

---

## 📈 Next Steps / Portfolio Extensions
  
See [PORTFOLIO.md](./PORTFOLIO.md) for the full roadmap, upcoming tooling, and release engineering enhancements.

🛠️ **Created and maintained by Gabriel Cantero**