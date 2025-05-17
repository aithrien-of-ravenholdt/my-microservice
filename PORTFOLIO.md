
## 🚀 Release Engineering CI/CD Pipeline with Jenkins, Docker, and Kubernetes

This project demonstrates a complete, production-grade CI/CD pipeline built with open-source tools to support the lifecycle of a Node.js microservice — from build and test to containerization, deployment, and automatic rollback.

---

## 🗂️ Stack Used

- **Node.js** – Sample microservice
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
2. **Installs dependencies** and runs tests (Jest)
3. **Publishes test results** via the JUnit plugin
4. **Builds a Docker image**
5. **Pushes the image** to DockerHub securely via Jenkins credentials
6. **Deploys to Kubernetes using Helm**
7. **Exposes the service using `kubectl port-forward`**
8. **Performs a live health check via `curl`**
9. **Rolls back automatically** if the health check fails

---

## 🔁 Rollback Simulation

A simulated failure is introduced in `index.js` to trigger a bad deployment. Jenkins detects the failure and automatically rolls back using:

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

## 📈 Next Improvements

- Deploy to a real Kubernetes cluster (e.g., EKS, GKE)
- Integrate static analysis
- Add Prometheus + Grafana monitoring
- Use Helm secrets and Kubernetes `Secrets` for secure configs
- Add image scanning with Trivy

---

## 📄 Author

Built by Gabriel Cantero as part of a hands-on Release Engineering lab.
