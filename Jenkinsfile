pipeline {
    agent any

    environment {
        APP_NAME        = 'cloud-native-nextjs-platform'
        IMAGE_NAME      = 'your-registry/cloud-native-nextjs-platform' // e.g. ghcr.io/org/app
        DOCKER_REGISTRY = credentials('docker-creds')
        SONAR_TOKEN     = credentials('sonartoken')
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }

    stages {

        // ─── 1. Checkout ──────────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                    env.IMAGE_TAG = "${env.BRANCH_NAME}-${env.GIT_COMMIT_SHORT}-${env.BUILD_NUMBER}"
                    echo "Image tag: ${env.IMAGE_TAG}"
                }
            }
        }

        // ─── 2. Install ───────────────────────────────────────────────────────
        stage('Install') {
            steps {
                sh 'npm ci --prefer-offline --ignore-scripts'
            }
        }

        // ─── 3. Quality Gates (parallel) ──────────────────────────────────────
        stage('Quality Gates') {
            parallel {
                stage('Type Check') {
                    steps { sh 'npm run type-check' }
                }
                stage('Lint') {
                    steps { sh 'npm run lint' }
                }
                stage('Format Check') {
                    steps { sh 'npx prettier --check .' }
                }
            }
        }

        // ─── 4. SonarQube ─────────────────────────────────────────────────────
        stage('SonarQube') {
            when {
                anyOf { branch 'main'; branch 'develop'; changeRequest() }
            }
            steps {
                withSonarQubeEnv('sonarserver') {
                    sh """
                        npx sonar-scanner \
                          -Dsonar.projectKey=${APP_NAME} \
                          -Dsonar.projectName="${APP_NAME}" \
                          -Dsonar.sources=app,components,lib \
                          -Dsonar.exclusions=**/node_modules/**,**/.next/**,**/public/** \
                          -Dsonar.login=${SONAR_TOKEN}
                    """
                }
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // ─── 5. Next.js Build ─────────────────────────────────────────────────
        stage('Build App') {
            steps {
                sh 'npm run build'
                archiveArtifacts artifacts: '.next/BUILD_ID', fingerprint: true
            }
        }

        // ─── 6. Docker Build ──────────────────────────────────────────────────
        stage('Docker Build') {
            steps {
                script {
                    docker.build(
                        "${IMAGE_NAME}:${env.IMAGE_TAG}",
                        "--label git-commit=${env.GIT_COMMIT_SHORT} " +
                        "--label build-number=${env.BUILD_NUMBER} " +
                        "--label branch=${env.BRANCH_NAME} ."
                    )
                    sh "docker tag ${IMAGE_NAME}:${env.IMAGE_TAG} ${IMAGE_NAME}:${env.BRANCH_NAME}-latest"
                }
            }
        }

        // ─── 7. Security Scan (Trivy) ─────────────────────────────────────────
        stage('Security Scan') {
            steps {
                sh """
                    trivy image \
                      --exit-code 1 \
                      --severity CRITICAL \
                      --no-progress \
                      ${IMAGE_NAME}:${env.IMAGE_TAG}
                """
            }
            post {
                always {
                    sh """
                        trivy image \
                          --exit-code 0 \
                          --format json \
                          --output trivy-report.json \
                          ${IMAGE_NAME}:${env.IMAGE_TAG} || true
                    """
                    archiveArtifacts artifacts: 'trivy-report.json', allowEmptyArchive: true
                }
            }
        }

        // ─── 8. Push to Registry ──────────────────────────────────────────────
        stage('Push Image') {
            when {
                anyOf { branch 'main'; branch 'develop' }
            }
            steps {
                script {
                    docker.withRegistry('', 'docker-creds') {
                        docker.image("${IMAGE_NAME}:${env.IMAGE_TAG}").push()
                        docker.image("${IMAGE_NAME}:${env.BRANCH_NAME}-latest").push()
                        if (env.BRANCH_NAME == 'main') {
                            docker.image("${IMAGE_NAME}:${env.IMAGE_TAG}").push('latest')
                        }
                    }
                }
            }
        }

        // ─── 9. Deploy ────────────────────────────────────────────────────────
        stage('Deploy') {
            parallel {

                stage('Deploy → Staging') {
                    when { branch 'develop' }
                    steps {
                        script { deployToEnv('staging', env.IMAGE_TAG) }
                    }
                }

                stage('Deploy → Production') {
                    when { branch 'main' }
                    steps {
                        timeout(time: 15, unit: 'MINUTES') {
                            input message: "Deploy ${env.IMAGE_TAG} to PRODUCTION?",
                                  ok: 'Deploy',
                                  submitter: 'dev-leads'
                        }
                        script { deployToEnv('production', env.IMAGE_TAG) }
                    }
                }
            }
        }
    }

    // ─── Post Actions ──────────────────────────────────────────────────────────
    post {
        always {
            sh """
                docker rmi ${IMAGE_NAME}:${env.IMAGE_TAG}          || true
                docker rmi ${IMAGE_NAME}:${env.BRANCH_NAME}-latest || true
            """
            cleanWs()
        }
        success {
            slackSend color: 'good',
                message: ":white_check_mark: *${APP_NAME}* `${env.IMAGE_TAG}` deployed successfully. <${env.BUILD_URL}|View>"
        }
        failure {
            slackSend color: 'danger',
                message: ":x: *${APP_NAME}* `${env.IMAGE_TAG}` FAILED at *${env.STAGE_NAME}*. <${env.BUILD_URL}|View>"
            emailext subject: "FAILED: ${APP_NAME} #${env.BUILD_NUMBER}",
                body: "Pipeline failed: ${env.BUILD_URL}",
                recipientProviders: [[$class: 'DevelopersRecipientProvider']]
        }
        unstable {
            slackSend color: 'warning',
                message: ":warning: *${APP_NAME}* `${env.IMAGE_TAG}` UNSTABLE. <${env.BUILD_URL}|View>"
        }
    }
}

// ─── Deploy helper ────────────────────────────────────────────────────────────
// Replace kubectl commands with your mechanism (Helm, ECS, Compose, etc.)
def deployToEnv(String targetEnv, String imageTag) {
    echo "Deploying ${IMAGE_NAME}:${imageTag} → ${targetEnv}"
    sh """
        kubectl set image deployment/${APP_NAME} \
          ${APP_NAME}=${IMAGE_NAME}:${imageTag} \
          --namespace=${targetEnv} --record

        kubectl rollout status deployment/${APP_NAME} \
          --namespace=${targetEnv} --timeout=3m
    """
}