#!/usr/bin/env bash
# Usage: scripts/deploy-k8s.sh KUBE_CONTEXT IMAGE[:TAG]
# Creates the admin Secret once (random values, never stored in Git), then applies
# the manifests with the chosen image and waits for the rollout.
set -euo pipefail
CONTEXT=${1:?kube context required}
IMAGE=${2:?image required, e.g. ghcr.io/akdavid4real/veloura-store:git-abc-1}
KC="kubectl --context $CONTEXT"
NS=veloura

$KC apply -f deploy/k8s/base/namespace.yaml
if ! $KC -n "$NS" get secret store-admin >/dev/null 2>&1; then
  $KC -n "$NS" create secret generic store-admin \
    --from-literal=ADMIN_EMAIL="${ADMIN_EMAIL:-admin@veloura.store}" \
    --from-literal=ADMIN_PASSWORD="$(openssl rand -base64 18)" \
    --from-literal=ADMIN_SESSION_SECRET="$(openssl rand -hex 32)"
  echo "Created Secret store-admin. Read the password with:"
  echo "  kubectl -n $NS get secret store-admin -o jsonpath='{.data.ADMIN_PASSWORD}' | base64 -d"
fi

TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
cp -r deploy/k8s/base/. "$TMP/"
# Point the manifests at the exact image tag built by Jenkins.
NAME=${IMAGE%:*}; TAG=${IMAGE##*:}
sed -i "s|newName: .*|newName: $NAME|; s|newTag: .*|newTag: $TAG|" "$TMP/kustomization.yaml"
$KC apply -k "$TMP"
$KC -n "$NS" rollout status deployment/store --timeout=240s
$KC -n "$NS" get deployment,pod,svc,pvc
