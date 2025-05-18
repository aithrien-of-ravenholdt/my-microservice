## 🚀 Release Engineering CI/CD Pipeline: Docker, Jenkins, Helm, Jest & ESLint

This project demonstrates a complete, production-grade CI/CD pipeline built with open-source tools to support the lifecycle of a Node.js microservice — from build and test to containerization, deployment, and automatic rollback.

> 🛠️ Created and maintained by **Gabriel Cantero**

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

## 🔁 Rollback Simulation

A failure scenario is simulated using a failing Jest test to validate CI behavior. This triggers Jenkins to report a failed test result while continuing execution of the remaining stages.
 
Jenkins then evaluates the application’s health post-deployment. If the service fails the live check, it automatically triggers:

```bash
helm rollback my-microservice <revision>
```

---

## ⚙️ Health Check Strategy

The pipeline uses:

```bash
kubectl port-forward svc/my-microservice-my-microservice-chart 8888:3000
curl -s -o /dev/null -w "%{http_code}" http://localhost:8888
```

If the response is anything other than `200`, the deployment is considered unhealthy.

---

## ✅ Final State

- Jenkins connects to Minikube with a properly configured `.kube/config` and TLS certs
- Pipeline builds and deploys automatically
- Health checks verify post-deploy success
- Auto-rollback keeps the system stable

---

## 🐳 DockerHub Integration

An automated stage was added to push Docker images to DockerHub from Jenkins using securely stored credentials. This step includes:

- Login to DockerHub using Jenkins' credential store (token-based)
- Dynamic tagging using the injected DockerHub username
- Publishing to `aithrien/my-microservice:latest` via `docker push`

The image is publicly available here:

https://hub.docker.com/r/aithrien/my-microservice

---

## 🧪 Test Automation and CI Visibility

Jest is configured as the unit testing framework. Each commit triggers a test run within Jenkins, using `jest-junit` to output results into JUnit-compatible XML.

### How Tests Are Handled

- `npm test` is run automatically as part of the pipeline.
- Results are written to `test-results/junit.xml`.
- Jenkins uses the `junit` plugin to parse and display the results.
- A **Test Result Trend** graph is displayed on every build summary page.

### Failure Case Simulation

A failure scenario was created by forcing a test to fail:

```js
expect(true).toBe(false);
```

Jenkins executed the test stage, reported the failed result, and preserved the build's full report while continuing the deployment flow (due to `|| true` in the script). This simulates a CI behavior where test trends can be used to monitor quality regressions without fully blocking deployment.

---

## 🧹 ESLint Quality Gate and Reporting

ESLint is configured in the project using the modern `eslint.config.mjs` format. It checks for syntax errors and basic best practices before test or build stages run.

- Runs with: `npm run lint`
- Produces a `eslint-report.txt` file on every Jenkins run
- Report is archived using `archiveArtifacts` and downloadable via the Jenkins UI

### Failure Case Simulation

To simulate a failure, a temporary rule violation was added (e.g., using `console.log` where disallowed).  
The pipeline stage ran ESLint, logged the failure in the artifact, but continued the pipeline using `|| true`.

This pattern demonstrates:
- CI visibility without halting critical deploy steps
- Artifact-based debugging of coding style issues

---

## 📈 Next Improvements

- Deploy to a real Kubernetes cluster (e.g., EKS, GKE)
- Integrate static analysis
- Add Prometheus + Grafana monitoring
- Use Helm secrets and Kubernetes `Secrets` for secure configs
- Add image scanning with Trivy