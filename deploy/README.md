# Deploy (Kubernetes)

This folder contains helper scripts and manifests for deploying Fraktal into Kubernetes.

Structure

- k8s/
  - base/ - Kustomize base (namespaces, common resources)
  - overlays/
    - dev/
    - staging/
    - prod/
- scripts/
  - kind-create.sh - create a local kind cluster
  - build-and-deploy.sh - build placeholder images and deploy dev overlay

Quick local deploy (kind)

1. Create a cluster:
   ./deploy/scripts/kind-create.sh fraktal
2. Build images and deploy (loads images into kind if present):
   ./deploy/scripts/build-and-deploy.sh --kind fraktal

Notes

- The scripts expect `kind`, `kubectl` and `docker` to be installed and on PATH.
- Replace placeholder images in k8s overlays with your real image names/tags.
