pipeline {
    agent any

    // ──────────────────────────────────────────────
    // Cấu hình – thay đổi theo môi trường thực tế
    // ──────────────────────────────────────────────
    environment {
        NODE_VERSION    = '20'                              // Node.js LTS version
        DEPLOY_SERVER   = credentials('ngocchau-server')    // Jenkins SSH credentials ID
        DEPLOY_HOST     = 'tiembacngocchau.vn'              // Hostname / IP của server
        DEPLOY_USER     = 'root'                            // SSH user
        DEPLOY_PATH     = '/home/https/www/cms'             // Thư mục deploy trên server
        DIST_DIR        = 'dist'                            // Build output directory
        NGINX_CONF      = 'ngocchau-cms'                    // Nginx site config name
    }

    options {
        timeout(time: 15, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    triggers {
        // Tự động build khi có push (cần cấu hình webhook trên Git)
        pollSCM('H/5 * * * *')
    }

    stages {

        // ─── 1. Checkout source ─────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                echo "Branch: ${env.BRANCH_NAME ?: env.GIT_BRANCH}"
                echo "Commit: ${env.GIT_COMMIT}"
            }
        }

        // ─── 2. Install dependencies ────────────────
        stage('Install Dependencies') {
            steps {
                nodejs(nodeJSInstallationName: "Node-${NODE_VERSION}") {
                    sh 'npm ci'
                }
            }
        }

        // ─── 3. Lint (optional) ─────────────────────
        stage('Lint') {
            steps {
                nodejs(nodeJSInstallationName: "Node-${NODE_VERSION}") {
                    sh 'npm run lint || echo "Lint warnings found – continuing"'
                }
            }
        }

        // ─── 4. Build production bundle ─────────────
        stage('Build') {
            environment {
                // Biến môi trường cho Vite build
                VITE_APP_NAME           = 'Ngọc Châu'
                VITE_API_BASE_URL       = '/api'
            }
            steps {
                nodejs(nodeJSInstallationName: "Node-${NODE_VERSION}") {
                    sh 'npm run build'
                }

                // Kiểm tra build output tồn tại
                sh """
                    if [ ! -d "${DIST_DIR}" ]; then
                        echo '❌ Build output directory not found!'
                        exit 1
                    fi
                    echo "📦 Build size: \$(du -sh ${DIST_DIR} | cut -f1)"
                    echo "📄 Files count: \$(find ${DIST_DIR} -type f | wc -l)"
                """
            }
        }

        // ─── 5. Deploy lên server ───────────────────
        stage('Deploy') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                    branch 'production'
                }
            }
            steps {
                echo '🚀 Deploying CMS to production server...'

                sshagent(credentials: ['ngocchau-server']) {
                    // 5a. Tạo thư mục backup trên server
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} << 'ENDSSH'
                            BACKUP_DIR="${DEPLOY_PATH}/dist.bak.\$(date +%Y%m%d%H%M%S)"
                            if [ -d "${DEPLOY_PATH}/dist" ]; then
                                echo "📁 Backing up current dist → \$BACKUP_DIR"
                                cp -r ${DEPLOY_PATH}/dist "\$BACKUP_DIR"
                            fi

                            # Giữ tối đa 3 bản backup
                            cd ${DEPLOY_PATH}
                            ls -dt dist.bak.* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null || true
ENDSSH
                    """

                    // 5b. Upload bản build mới
                    sh """
                        rsync -avz --delete \
                            -e 'ssh -o StrictHostKeyChecking=no' \
                            ${DIST_DIR}/ ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/dist/
                    """

                    // 5c. Reload Nginx
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} << 'ENDSSH'
                            echo '🔄 Testing Nginx configuration...'
                            nginx -t

                            echo '🔄 Reloading Nginx...'
                            systemctl reload nginx

                            echo '✅ CMS deploy completed!'
ENDSSH
                    """
                }
            }
        }

        // ─── 6. Health check ────────────────────────
        stage('Health Check') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                    branch 'production'
                }
            }
            steps {
                sshagent(credentials: ['ngocchau-server']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} << 'ENDSSH'
                            echo '🏥 Running health check...'
                            sleep 3

                            # Kiểm tra file index.html tồn tại
                            if [ ! -f "${DEPLOY_PATH}/dist/index.html" ]; then
                                echo "❌ index.html not found!"
                                exit 1
                            fi
                            echo "✅ index.html exists"

                            # Kiểm tra Nginx đang serve đúng
                            HTTP_STATUS=\$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:80 -H 'Host: cms.tiembacngocchau.vn' || echo '000')

                            if [ "\$HTTP_STATUS" = "200" ]; then
                                echo "✅ CMS is responding (HTTP \$HTTP_STATUS)"
                            else
                                echo "⚠️  CMS returned HTTP \$HTTP_STATUS (may need DNS/domain check)"
                            fi
ENDSSH
                    """
                }
            }
        }
    }

    post {
        success {
            echo '🎉 CMS Pipeline completed successfully!'
        }
        failure {
            echo '❌ CMS Pipeline failed!'
            // Uncomment để gửi notification qua Slack/Telegram
            // slackSend(color: 'danger', message: "❌ CMS Deploy FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}")
        }
        always {
            cleanWs()
        }
    }
}
