<p align="center">
  <img src="https://img.shields.io/badge/Jenkins-CI%2FCD-red?logo=jenkins&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Container-blue?logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Kubernetes-Orchestration-326ce5?logo=kubernetes&logoColor=white" />
  <img src="https://img.shields.io/badge/Tests-Passing-brightgreen?logo=jest&logoColor=white" />
  <img src="https://img.shields.io/badge/Lint-Clean-success?logo=eslint&logoColor=white" />
  <a href="https://getunleash.io" target="_blank">
    <img src="https://img.shields.io/badge/Unleash-Feature%20Flags-4e2a8e" />
  </a>
  <a href="https://hub.docker.com/r/aithrien/my-microservice" target="_blank">
    <img src="https://img.shields.io/badge/DockerHub-View%20Image-blue?logo=docker&logoColor=white" />
  </a>
</p>

# 🧪 my-microservice — Release Engineering Lab

This project is a complete, hands-on CI/CD lab, built to simulate a real-world DevOps and release pipeline lifecycle, from building and testing a Node.js microservice to containerizing it with Docker and deploying to Kubernetes using Helm.
 
📝 While originally inspired by a standard Express template, the application logic was fully rewritten and restructured to serve as a clean, integration-friendly foundation for advanced CI/CD tooling. There is no inherited logic or boilerplate from the original source.
 
The real focus of this lab is not the app itself, but the automated infrastructure surrounding it, including Jenkins pipelines, DockerHub integration, test and lint quality gates, Helm deployments, rollback automation, and Kubernetes-based health checks.

---

## 📁 Project Structure

```
my-microservice/
├── app.js
├── Dockerfile
├── package.json
├── package-lock.json
├── test/
│   └── hello.test.js
├── test-results/
│   └── junit.xml
├── my-microservice-chart/
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
├── eslint.config.mjs
└── Jenkinsfile
```

---

## 🚀 Prerequisites

- Ubuntu 24.04
- Docker
- Node.js 18+
- Git
- Jenkins (with Pipeline + Docker plugins)
- Minikube (Docker driver)
- Helm 3.x
- Ngrok (for GitHub Webhooks)
- Jest + jest-junit
- ESLint
- Trivy (Docker container)

---

## ✅ Step-by-Step Guide

### 🔧 Part 1: Project Setup

1. Scaffold a minimal Node.js app using Express
2. Add a `Dockerfile` to containerize the app
3. Create `index.js`, `package.json`, and the `test/` folder

---

### 🛠️ Part 2: Jenkins Pipeline

1. Install Jenkins with necessary plugins  
2. Create a freestyle pipeline pointing to your GitHub repo  
3. Use the `Jenkinsfile` to define your pipeline, which includes these stages:
   - Checkout
   - Set Beta Banner Config
   - Install dependencies
   - Lint (eslint-report.txt)
   - Run Tests
   - Publish Test Results
   - Build Docker Image
   - Trivy Scan (trivy-report.json)
   - Docker Login
   - Tag & Push Docker Image
   - Verify Kube Access
   - Helm Deploy
   - Wait for Pod Readiness
   - Log All Feature Flags (unleash-flags.json)
   - Health Check & Auto-Rollback
   - Capture Rendered App Output (rendered-output.html)

---

### ☸️ Part 3: Kubernetes Deployment

#### 3A. Local Cluster
- Start Minikube with Docker as the driver:
```bash
minikube start --driver=docker
```
- Verify that it's running:
```bash
kubectl get nodes
```

#### 3B. Helm Chart
- Create `my-microservice-chart/` and define:
  - `Chart.yaml`
  - `values.yaml`
  - templates for `deployment.yaml`, `service.yaml`, `ingress.yaml`
- Install or upgrade the chart:
```bash
helm upgrade --install my-microservice ./my-microservice-chart
```

#### 3C. Auto Rollback
- Jenkins checks health after deployment:
```groovy
sh 'kubectl port-forward svc/my-microservice-my-microservice-chart 8888:3000 &'
```
- If the app returns anything other than `200 OK`, Jenkins rolls back:
```bash
helm rollback my-microservice <revision>
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

#### 7D. Deployment-Time Configuration Showcase in Jenkins

In this lab, the pipeline uses a **deployment-time configuration parameter** called `BETA_BANNER_ENABLED` (`on` or `off`) to simulate changing application behavior:

- Jenkins reads this parameter from the pipeline UI.
- Jenkins **calls the Unleash API** to set the beta banner config (`show-beta-banner`).
- This change takes effect **at deployment time** — it’s not a runtime feature toggle in this scenario.

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

> ⚠️ **Note:** In production, toggling feature flags would be done dynamically at runtime using Unleash (no redeploy required). Here, we demonstrate a deploy-time configuration change for clarity and to showcase Jenkins pipeline flexibility.

---


### 🛡️ Part 8: Container Image Scanning with Trivy

This lab integrates **Trivy**, an open-source security scanner for Docker images.  
It ensures your container images don’t contain known vulnerabilities, demonstrating supply chain security in your pipeline.

---

#### 8A. Installation & Setup

Instead of installing Trivy locally, we run it as a Docker container. The pipeline includes a dedicated **Trivy Scan** stage:

```groovy
stage('Trivy Scan') {
  steps {
    echo "🔍 Scanning Docker image with Trivy (Docker-based, with volume mount)..."
    sh '''
      docker run --rm -v /var/run/docker.sock:/var/run/docker.sock         -v $(pwd):/report/         aquasec/trivy image --exit-code 0 --severity HIGH,CRITICAL $IMAGE_NAME || true

      docker run --rm -v /var/run/docker.sock:/var/run/docker.sock         -v $(pwd):/report/         aquasec/trivy image --format json --output /report/trivy-report.json $IMAGE_NAME || true
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
> In production, it’s recommended to use `--exit-code 1` to fail the pipeline if HIGH or CRITICAL vulnerabilities are found.

---

## 📈 Next Steps / Portfolio Extensions
 
See [PORTFOLIO.md](./PORTFOLIO.md) for the full roadmap, upcoming tooling, and release engineering enhancements.

🛠️ **Created and maintained by Gabriel Cantero**
