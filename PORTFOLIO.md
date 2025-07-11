<p align="center">
  <img src="https://img.shields.io/badge/Jenkins-CI%2FCD-red?logo=jenkins&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Container-blue?logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Kubernetes-Orchestration-326ce5?logo=kubernetes&logoColor=white" />
  <img src="https://img.shields.io/badge/Tests-Passing-brightgreen?logo=jest&logoColor=white" />
  <img src="https://img.shields.io/badge/Lint-Clean-success?logo=eslint&logoColor=white" />
  <a href="https://hub.docker.com/r/aithrien/my-microservice" target="_blank">
    <img src="https://img.shields.io/badge/DockerHub-View%20Image-blue?logo=docker&logoColor=white" />
  </a>
</p>

# 🚀 CI/CD Pipeline Portfolio — Docker, Jenkins & Helm

This project demonstrates a complete, production-grade CI/CD pipeline built with open-source tools to support the lifecycle of a Node.js microservice — from build and test to containerization, deployment, and automatic rollback.

---

## 🗂️ Stack Used

- **Node.js** – Sample microservice
- **ESLint** – Code linting with artifact output
- **Jest** – Unit testing framework with JUnit output
- **Docker** – Containerize the app
- **Jenkins** – CI/CD pipeline orchestrator
- **Helm** – Kubernetes package manager
- **Minikube** – Local Kubernetes cluster
- **DockerHub** – Remote container registry for CI-delivered images
- **kubectl** – K8s command-line tool
- **Unleash** – Configuration change service integrated with the CI pipeline
- **Trivy** – Image container scan with artifact output

---

## 📦 What This Pipeline Does

1. **Checks out code** from a GitHub repo
2. **Lints source files** using ESLint and archives a report
3. **Installs dependencies** and runs tests (Jest)
4. **Publishes test results** via the JUnit plugin
5. **Builds a Docker image**
6. **Runs an image scan** via Trivy
7. **Pushes the image** to DockerHub securely via Jenkins credentials
8. **Deploys to Kubernetes using Helm**
9. **Toggles a configuration change** via Unleash 
10. **Exposes the service using `kubectl port-forward`**
11. **Performs a live health check via `curl`**
12. **Rolls back automatically** if the health check fails
13. **Fetches the live app output and archives it**

---

## 🧹 ESLint Quality Gate and Reporting

ESLint is configured in the project using the modern `eslint.config.mjs` format. It checks for syntax errors and basic best practices before test or build stages run.

- Runs with: `npm run lint`
- Produces a `eslint-report.txt` file on every Jenkins run
- Report is archived using `archiveArtifacts` and downloadable via the Jenkins UI

---

### 🔁 Failure Case Simulation: ESLint

To test ESLint’s enforcement and artifact reporting, you can introduce a deliberate lint error such as:

```js
console.log("Lint test failure");
```

If the `no-console` rule is enabled, this will trigger a lint warning or error.

The pipeline:
- Executes `npm run lint`
- Captures and archives the output as `eslint-report.txt`
- Continues the build using `|| true`

This simulates:
- Style violation visibility in Jenkins
- Artifact-based debugging without interrupting the deploy process

---

## 🧪 Jest Test Coverage and Trend Reporting

Jest is integrated with JUnit output so Jenkins can track and trend test outcomes using native JUnit plugin support.

- Test output written to `test-results/junit.xml`
- Results tracked over time within Jenkins
- Test failures logged and visible, but do not block deployment

---

### 🔁 Failure Case Simulation: Jest

To validate Jenkins’ test trend and result reporting, you can intentionally trigger a test failure by modifying a test like this:

```js
expect(true).toBe(false);
```

This will produce a failed test report which Jenkins will display using the JUnit plugin.

Because the test stage uses `|| true`, the pipeline continues execution without halting — allowing you to observe test regressions without blocking the deployment entirely.

This demonstrates:
- CI visibility for test failures
- Non-blocking test trends for quality insight

---

## 🚩 Unleash Deployment-Time Configuration

This lab integrates **Unleash** as a runtime feature flag manager, while also demonstrating a deployment-time configuration change using `BETA_BANNER_ENABLED`.

- The Node.js app uses the Unleash Node SDK to **dynamically** toggle runtime features (no redeploy needed).
- In this pipeline, we showcase a **deployment-time config change**: the beta banner toggle (`BETA_BANNER_ENABLED`), controlled via Jenkins pipeline parameters.
- Jenkins authenticates via an admin API token to update the Unleash config for the `show-beta-banner` toggle **at deployment time**.
- The app **reads this config at boot**, showing or hiding the beta banner accordingly.

Jenkins captures the final output by:
- Calling `curl http://localhost:8888` after deployment
- Saving the rendered HTML response to `rendered-output.html`
- Archiving it for visual inspection in the Jenkins UI

This demonstrates:
- Controlled deployment-time configuration changes (like beta banners) managed via the pipeline
- Real runtime toggling happens inside the app itself using Unleash
 
---

## 🐳 DockerHub Integration

An automated stage was added to push Docker images to DockerHub from Jenkins using securely stored credentials. This step includes:

- Login to DockerHub using Jenkins' credential store (token-based)
- Dynamic tagging using the injected DockerHub username
- Publishing to `aithrien/my-microservice:latest` via `docker push`

The image is publicly available here:

https://hub.docker.com/r/aithrien/my-microservice

---

## 🛡️ Trivy Image Scan and Reporting

Trivy is integrated into the pipeline to **scan Docker images** for known vulnerabilities in base images and application dependencies.

- The pipeline includes a **Trivy Scan stage** that runs directly inside Jenkins using the official Trivy Docker image.
- The stage uses volume mounts (`-v $(pwd):/report/`) to generate a **`trivy-report.json`** in the Jenkins workspace.
- The report is archived as a pipeline artifact for detailed inspection of vulnerabilities.

The scan is configured with:
- `--exit-code 0`: The pipeline **always continues**, even if vulnerabilities are found (useful in lab environments).
- `--exit-code 1`: The pipeline **fails** if HIGH or CRITICAL vulnerabilities are found — this is the recommended setting in production environments.

This demonstrates:
- Integration of security scanning directly into CI/CD pipelines
- Full control over enforcement policies and traceability of scan results
 
---

## ⚙️ Health Check Strategy

The pipeline uses:

```bash
kubectl port-forward svc/my-microservice-my-microservice-chart 8888:3000
curl -s -o /dev/null -w "%{http_code}" http://localhost:8888
```

If the response is anything other than `200`, the deployment is considered unhealthy.

---

## 🔁 Rollback Simulation

A failure scenario is simulated using a failing Jest test to validate CI behavior. This triggers Jenkins to report a failed test result while continuing execution of the remaining stages.
 
Jenkins then evaluates the application’s health post-deployment. If the service fails the live check, it automatically triggers:

```bash
helm rollback my-microservice <revision>
```

---

## ✅ Final State

- Jenkins securely connects to Minikube using a configured `.kube/config` and TLS certificates
- The CI/CD pipeline **builds, lints, tests, scans for vulnerabilities, pushes and deploys** automatically
- Health checks **verify post-deploy stability**, with **auto-rollback** protecting against bad deployments
- All **quality gates** (tests, lint, and scan reports) are visible in Jenkins, with **archived artifacts** for traceability
- Deployment-time **configuration changes** are seamlessly integrated in the pipeline
- Rendered HTML output and feature flag states are archived as artifacts, providing **visual verification** of deployments

---

🛠️ **Created and maintained by Gabriel Cantero**
