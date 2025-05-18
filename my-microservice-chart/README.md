# my-microservice-chart

A Helm chart for deploying the CI/CD portfolio microservice.

## Features

- Configurable replica count, image, and service port
- Built-in liveness and readiness probes
- Supports health check-driven rollbacks
- Uses values.yaml for easy customization

## Usage

```bash
helm upgrade --install my-microservice ./my-microservice-chart
```

## Configuration

Values can be customized by editing `values.yaml` or passing `--set` flags.

For example:

```bash
helm install my-microservice ./my-microservice-chart --set replicaCount=2
```