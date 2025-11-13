FabConnect Helm chart

This chart deploys a FabConnect instance which requires two Kubernetes Secrets:

- connection secret (JSON connection profile)
- admin secret (contains signcert and keystore files for the admin identity)

Create secrets from the repository root. Example commands:

kubectl -n fraktal-dev create secret generic fabconnect-conn --from-file=connection.json=./fabric/connection-org1.json
kubectl -n fraktal-dev create secret generic fabconnect-admin --from-file=signcert=./fabric/admin/signcert --from-file=keystore=./fabric/admin/keystore

Install the chart from the repo root:

helm upgrade --install fabconnect ./deploy/helm/fabconnect-fixed -n fraktal-dev -f ./deploy/helm/fabconnect-fixed/values-dev.yaml

Notes:

- The chart defaults to the upstream image `ghcr.io/hyperledger/firefly-fabconnect:latest`. If you want to use a local build, change `image.repository` and `image.tag` in `values-dev.yaml` or pass `--set image.repository=... --set image.tag=...` at install time.
- To use a locally-built image named `ghcr.io/your-org/fabconnect:dev` with kind, build it and load into kind:

```bash
docker build -t ghcr.io/your-org/fabconnect:dev ./path/to/fabconnect
kind load docker-image ghcr.io/your-org/fabconnect:dev --name fraktal
helm upgrade --install fabconnect ./deploy/helm/fabconnect-fixed -n fraktal-dev -f ./deploy/helm/fabconnect-fixed/values-dev.yaml --set image.repository=ghcr.io/your-org/fabconnect --set image.tag=dev
```
