
# 🔄 Rollback Test Case: Simulating a Broken Release & Recovery

This test validates our ability to detect a faulty deployment and recover using Helm’s built-in rollback functionality.

---

## 🧪 Step-by-Step Scenario

### 🟢 1. Deploy a Healthy App (Baseline)

```bash
helm upgrade --install my-microservice ./my-microservice-chart
```

Confirm the app is running:

```bash
minikube service my-microservice-my-microservice-chart
helm list  # Note the revision number (e.g. 3)
```

### 🔥 2. Introduce Failure

Edit `index.js` to simulate a crash:

```js
throw new Error("Simulated failure for rollback test");
```

Rebuild the Docker image:

```bash
eval $(minikube docker-env)
docker build -t my-microservice:latest .
```

### 🚀 3. Deploy the Broken Version

```bash
helm upgrade my-microservice ./my-microservice-chart
```

Watch the pod:

```bash
kubectl get pods -w
```

Expected: Failing health probes and `CrashLoopBackOff`.

### 🛑 4. Roll Back

Roll back to the last healthy revision:

```bash
helm rollback my-microservice 3
```

Verify the rollback:

```bash
kubectl get pods
minikube service my-microservice-my-microservice-chart
```

✅ App should be restored.

---

## 📝 Notes

- This test assumes `livenessProbe` and `readinessProbe` are defined in `values.yaml`.
- Can be scripted as part of regression suite.
