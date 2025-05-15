
## 🚀 Release Engineering CI/CD Pipeline with Jenkins, Docker, and Kubernetes

This project demonstrates a complete, production-grade CI/CD pipeline built with open-source tools to support the lifecycle of a Node.js microservice — from build and test to containerization, deployment, and automatic rollback.

---

## 🗂️ Stack Used

- **Node.js** – Sample microservice
- **Docker** – Containerize the app
- **Jenkins** – CI/CD pipeline orchestrator
- **Helm** – Kubernetes package manager
- **Minikube** – Local Kubernetes cluster
- **kubectl** – K8s command-line tool

---

## 📦 What This Pipeline Does

1. **Checks out code** from a GitHub repo
2. **Installs dependencies** and runs tests
3. **Builds a Docker image**
4. **Deploys to Kubernetes using Helm**
5. **Exposes the service using `kubectl port-forward`**
6. **Performs a live health check via `curl`**
7. **Rolls back automatically** if the health check fails

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

## 📈 Next Improvements

- Push images to DockerHub or GitHub Container Registry (GHCR)
- Deploy to a real Kubernetes cluster (e.g., EKS, GKE)
- Integrate unit test reports or static analysis
- Add Prometheus + Grafana monitoring
- Use Helm secrets and Kubernetes `Secrets` for secure configs
- Add image scanning with Trivy

---

## 📄 Author

Built by Gabriel Cantero as part of a hands-on Release Engineering lab.
