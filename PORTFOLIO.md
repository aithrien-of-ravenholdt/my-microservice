## 🚀 Release Engineering CI/CD Pipeline: Docker, Jenkins, Helm, Jest & ESLint

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

---

## 📦 What This Pipeline Does

1. **Checks out code** from a GitHub repo
2. **Lints source files** using ESLint and archives a report
3. **Installs dependencies** and runs tests (Jest)
4. **Publishes test results** via the JUnit plugin
5. **Builds a Docker image**
6. **Pushes the image** to DockerHub securely via Jenkins credentials
7. **Deploys to Kubernetes using Helm**
8. **Exposes the service using `kubectl port-forward`**
9. **Performs a live health check via `curl`**
10. **Rolls back automatically** if the health check fails

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

## 🐳 DockerHub Integration

An automated stage was added to push Docker images to DockerHub from Jenkins using securely stored credentials. This step includes:

- Login to DockerHub using Jenkins' credential store (token-based)
- Dynamic tagging using the injected DockerHub username
- Publishing to `aithrien/my-microservice:latest` via `docker push`

The image is publicly available here:

https://hub.docker.com/r/aithrien/my-microservice

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
 
- Jenkins connects securely to Minikube with a configured `.kube/config` and TLS certificates
- The CI/CD pipeline builds, lints, tests, pushes, and deploys automatically
- Health checks verify post-deploy stability
- Auto-rollback protects against bad deployments
- All quality gates (tests + lint) are visible in Jenkins with archived reports

---

## 📈 Next Improvements

- Deploy to a real Kubernetes cluster (e.g., EKS, GKE)
- Integrate static analysis
- Add Prometheus + Grafana monitoring
- Use Helm secrets and Kubernetes `Secrets` for secure configs
- Add image scanning with Trivy

> 🛠️ Created and maintained by **Gabriel Cantero**
