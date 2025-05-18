<p align="center">
  <img src="https://img.shields.io/badge/Jenkins-CI%2FCD-red?logo=jenkins&logoColor=white" alt="Jenkins Badge"/>
  <img src="https://img.shields.io/badge/Docker-Container-blue?logo=docker&logoColor=white" alt="Docker Badge"/>
  <img src="https://img.shields.io/badge/Kubernetes-Orchestration-326ce5?logo=kubernetes&logoColor=white" alt="Kubernetes Badge"/>
  <img src="https://img.shields.io/badge/Helm-K8s%20Package%20Manager-0f1689?logo=helm&logoColor=white" alt="Helm Badge"/>
  <img src="https://img.shields.io/badge/Minikube-Local%20Cluster-yellow?logo=minikube&logoColor=black" alt="Minikube Badge"/>
  <img src="https://img.shields.io/badge/Tests-Passing-brightgreen?logo=jest&logoColor=white" alt="Jest Badge"/>
  <img src="https://img.shields.io/badge/Lint-Clean-success?logo=eslint&logoColor=white" alt="ESLint Badge"/>
  <a href="https://hub.docker.com/r/aithrien/my-microservice" target="_blank">
    <img src="https://img.shields.io/badge/DockerHub-View%20Image-blue?logo=docker&logoColor=white" alt="DockerHub Badge"/>
  </a>
</p>

# 🧪 my-microservice — CI/CD Portfolio Lab

A complete end-to-end CI/CD lab built around a Dockerized Node.js app deployed to Kubernetes using Helm, tested with Jest, linted with ESLint, and automated by Jenkins.

> 🛠️ Created and maintained by **Gabriel Cantero**

---

## 📁 Project Structure

```
my-microservice/
├── index.js
├── Dockerfile
├── package.json
├── test/
│   └── hello.test.js
├── my-microservice-chart/
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
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
3. Use `Jenkinsfile` to define pipeline with stages:
   - Checkout
   - Install dependencies
   - Lint with ESLint
   - Unit tests with Jest
   - Docker build and tag
   - DockerHub login & push
   - Helm deploy
   - Health check with rollback

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

### 🧪 Part 5: Jest Testing Integration

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

## 🧭 Project Origin

This project was originally based on the Heroku Node.js sample app (https://github.com/heroku/node-js-sample) and has since been significantly extended into a modern, end-to-end CI/CD portfolio with DockerHub, Helm automation, test reporting, and lint quality gates.
