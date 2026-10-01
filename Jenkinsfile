pipeline {
  agent any
  options {
    disableConcurrentBuilds()
    timestamps()
    timeout(time: 30, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }
  parameters {
    string(name: 'IMAGE_REPO', defaultValue: 'ghcr.io/akdavid4real/veloura-store', description: 'Lowercase GHCR image repository')
    string(name: 'GITHUB_USERNAME', defaultValue: 'akdavid4real', description: 'GitHub account that owns the registry token')
    booleanParam(name: 'PUBLISH_IMAGE', defaultValue: false, description: 'Push the versioned image to GHCR')
    booleanParam(name: 'DEPLOY_K8S', defaultValue: false, description: 'Deploy into an already configured cluster')
    string(name: 'KUBE_CONTEXT', defaultValue: '', description: 'Explicit context from the Jenkins kubeconfig credential')
  }
  stages {
    stage('Validate configuration') {
      steps {
        script {
          if (!(params.IMAGE_REPO ==~ /ghcr\.io\/[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*/)) {
            error('IMAGE_REPO must be ghcr.io/owner/name in lowercase')
          }
          if (params.DEPLOY_K8S && !params.PUBLISH_IMAGE) {
            error('Deployment requires PUBLISH_IMAGE')
          }
          if (params.DEPLOY_K8S && !params.KUBE_CONTEXT.trim()) {
            error('Set KUBE_CONTEXT explicitly')
          }
          env.IMAGE_TAG = 'git-' + sh(script: 'git rev-parse --short=12 HEAD', returnStdout: true).trim() + '-' + env.BUILD_NUMBER
          env.IMAGE = params.IMAGE_REPO + ':' + env.IMAGE_TAG
        }
        sh 'docker version && kubectl kustomize deploy/k8s/base > /dev/null'
      }
    }
    stage('Build image and run JUnit tests') {
      steps {
        // The Dockerfile build stage runs "mvn package", so failing tests fail this stage.
        sh 'docker build -t "$IMAGE" .'
      }
    }
    stage('Smoke test container') {
      steps {
        // Jenkins itself runs in a container, so 127.0.0.1 here is not the Docker host.
        // Run the health check from inside the app container instead.
        sh '''
          set -eu
          CID=$(docker run -d "$IMAGE")
          trap 'docker rm -f "$CID" >/dev/null 2>&1 || true' EXIT
          for i in $(seq 1 30); do
            if docker exec "$CID" curl -fsS http://127.0.0.1:4000/api/health | grep -q '"ok":true'; then
              echo "health check passed"; exit 0
            fi
            sleep 2
          done
          docker logs "$CID" | tail -40
          echo "health check failed"; exit 1
        '''
      }
    }
    stage('Publish versioned image') {
      when { expression { params.PUBLISH_IMAGE } }
      steps {
        withCredentials([usernamePassword(credentialsId: 'github-registry', usernameVariable: 'REGISTRY_USER', passwordVariable: 'REGISTRY_TOKEN')]) {
          withEnv(["GHCR_USERNAME=${params.GITHUB_USERNAME}"]) {
            sh '''
              set +x
              set -eu
              DOCKER_CONFIG=$(mktemp -d)
              export DOCKER_CONFIG
              trap 'rm -rf "$DOCKER_CONFIG"' EXIT
              printf '%s' "$REGISTRY_TOKEN" | docker login ghcr.io --username "$GHCR_USERNAME" --password-stdin
              docker push "$IMAGE"
              docker tag "$IMAGE" "${IMAGE%:*}:latest"
              docker push "${IMAGE%:*}:latest"
            '''
          }
        }
      }
    }
    stage('Deploy Kubernetes') {
      when { expression { params.DEPLOY_K8S } }
      steps {
        withCredentials([file(credentialsId: 'veloura-kubeconfig', variable: 'KUBECONFIG')]) {
          withEnv(["DEPLOY_CONTEXT=${params.KUBE_CONTEXT}"]) {
            sh 'bash scripts/deploy-k8s.sh "$DEPLOY_CONTEXT" "$IMAGE"'
          }
        }
      }
    }
  }
  post {
    always {
      sh 'docker image rm "$IMAGE" >/dev/null 2>&1 || true'
    }
  }
}
