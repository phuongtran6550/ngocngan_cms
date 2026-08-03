# Ngoc Chau Jenkins Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide one-click Jenkins deployment for the Ngoc Chau API and CMS on `149.28.144.156`, with isolated production configuration, release rollback, and an API-first aggregate job.

**Architecture:** Jenkins checks out each GitHub repository using `YTPlus_SSH`, builds or packages the application, then deploys through `ServerMain` into versioned release directories. The API runs as one PM2 process on loopback port `4100`; Nginx serves the CMS symlink and proxies API traffic while MongoDB and Redis remain loopback-only.

**Tech Stack:** Jenkins Declarative Pipeline, Node.js 20, npm, PM2, Redis, MongoDB 8, Nginx, SSH/SCP, Vite/Vue.

---

## Pre-Coding Thinking

**Task:** Deploy two applications and their production dependencies without disturbing legacy services.
**Complexity:** Complex
**Role Perspective:** Solution Architect / DevOps Engineer
**Dimensions Activated:** Backend, database, DevOps, security, architecture, core reasoning, SDLC.

### Key Insights

- The existing `/home/https/www` directory contains unrelated production applications, so only `/home/https/www/cms` may be replaced and its first replacement must be recoverable.
- API startup depends on both MongoDB and Redis; Jenkins must not activate a release until dependencies install successfully and local HTTP health returns `204`.
- Secrets must move directly into Jenkins credentials or protected remote files without appearing in terminal output, job logs, documentation, or source control.
- `api.tiembacngocchau.vn` has no DNS record, so local API health is the deployment gate and public API TLS is a separately reported external blocker.

### Trade-offs Identified

| Option A | Option B | Decision | Rationale |
|---|---|---|---|
| Build API dependencies on Jenkins | Install production dependencies on target | Target | Native Node modules match the production OS and Node runtime. |
| Multiple PM2 instances | One PM2 instance | One | Prevent duplicate OCR workers during the first rollout. |
| MongoDB authorization migration | Keep loopback-only authorization-disabled state | Keep current state | Enabling authorization would risk all legacy applications on the host. |
| Invented Google OCR credential | Disable OCR until a real service-account file exists | Disable | A fake credential would make startup and job processing nondeterministic. |

### Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Legacy CMS path replacement breaks serving | Medium | High | Timestamped backup, atomic symlink, Nginx syntax check, automatic rollback. |
| API process starts but is unusable | Medium | High | PM2 state, active symlink, Redis ping, Mongo ping, and HTTP 204 checks. |
| Secret leakage | Low | Critical | `set +x`, Jenkins credentials binding, clipboard-only migration, mode `600`, no value echoing. |
| Missing API DNS/TLS | High | Medium | Deploy and verify on loopback; defer Certbot/public check until DNS resolves. |

## File Structure

- Create: `/Users/phuongtran/Documents/Freelance/NgocChau/Version2/API_2/deploy/jenkins/Jenkinsfile.api` — source-of-truth copy of the API inline pipeline.
- Create: `/Users/phuongtran/Documents/Freelance/NgocChau/Version2/CMS_2/deploy/jenkins/Jenkinsfile.cms` — source-of-truth copy of the CMS inline pipeline.
- Create: `/Users/phuongtran/Documents/Freelance/NgocChau/Version2/CMS_2/deploy/jenkins/Jenkinsfile.deploy-all` — source-of-truth copy of the aggregate pipeline.
- Create: `/Users/phuongtran/Documents/Freelance/NgocChau/Version2/CMS_2/deploy/nginx/api.tiembacngocchau.vn.conf` — API reverse-proxy source.
- Create: `/Users/phuongtran/Documents/Freelance/NgocChau/Version2/CMS_2/deploy/nginx/cms.tiembacngocchau.vn.conf` — CMS vhost source with compatibility API proxy on port `4100`.
- Modify: `/Users/phuongtran/Documents/Freelance/NgocChau/Version2/CMS_2/docs/superpowers/specs/2026-08-02-ngocchau-jenkins-deployment-design.md` — record the confirmed absence of Google credentials.
- Create remotely: `/etc/nginx/sites-available/api.tiembacngocchau.vn.conf` — loopback API reverse proxy.
- Modify remotely: `/etc/nginx/sites-enabled/cms.tiembacngocchau.vn.conf` — point compatibility API routes to port `4100` while preserving TLS settings.

### Task 1: Create and Validate Pipeline Sources

- [x] **Step 1: Prove the pipeline files do not yet exist**

Run:

```bash
test ! -e /Users/phuongtran/Documents/Freelance/NgocChau/Version2/API_2/deploy/jenkins/Jenkinsfile.api
test ! -e /Users/phuongtran/Documents/Freelance/NgocChau/Version2/CMS_2/deploy/jenkins/Jenkinsfile.cms
test ! -e /Users/phuongtran/Documents/Freelance/NgocChau/Version2/CMS_2/deploy/jenkins/Jenkinsfile.deploy-all
```

Expected: all commands exit `0` before creation.

- [x] **Step 2: Create the API pipeline**

Create `/Users/phuongtran/Documents/Freelance/NgocChau/Version2/API_2/deploy/jenkins/Jenkinsfile.api` with:

- [x] **Step 3: Create the CMS pipeline**

Create `/Users/phuongtran/Documents/Freelance/NgocChau/Version2/CMS_2/deploy/jenkins/Jenkinsfile.cms` with:

```groovy
pipeline {
  agent any

  tools {
    nodejs 'Node 20'
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
    timeout(time: 1, unit: 'HOURS')
  }

  environment {
    REPOSITORY = 'git@github.com:phuongtran6550/ngocngan_cms.git'
    DEPLOY_HOST = 'root@149.28.144.156'
    VITE_API_BASE_URL = 'https://api.tiembacngocchau.vn/api'
    VITE_ASSET_BASE_URL = 'https://api.tiembacngocchau.vn'
  }

  stages {
    stage('Checkout') {
      steps {
        deleteDir()
        script {
          def source = checkout([
            $class: 'GitSCM',
            branches: [[name: '*/main']],
            userRemoteConfigs: [[url: env.REPOSITORY, credentialsId: 'YTPlus_SSH']]
          ])
          env.SOURCE_REVISION = source.GIT_COMMIT
          currentBuild.displayName = "#${env.BUILD_NUMBER} ${env.SOURCE_REVISION.take(8)}"
        }
      }
    }

    stage('Build') {
      steps {
        sh '''
          set -eu
          node --version
          npm --version
          npm ci
          npm run lint
          npm run build
          test -s dist/index.html
          tar -czf cms-dist.tgz dist
        '''
      }
    }

    stage('Deploy') {
      steps {
        sshagent(credentials: ['NGOCCHAU_SERVER_SSH']) {
          sh '''
            set -eu
            archive="/tmp/ngocchau-cms-$BUILD_NUMBER.tgz"
            scp -o BatchMode=yes -o StrictHostKeyChecking=no cms-dist.tgz "$DEPLOY_HOST:$archive"
            ssh -o BatchMode=yes -o StrictHostKeyChecking=no "$DEPLOY_HOST" \
              "bash -s -- '$BUILD_NUMBER' '$archive'" <<'REMOTE'
              set -Eeuo pipefail
              build_number="$1"
              archive="$2"
              release_root="/home/https/releases/ngocchau/cms"
              active_path="/home/https/www/cms"
              release_path="$release_root/release-$build_number"
              previous_path=""
              legacy_backup=""

              if [ -L "$active_path" ]; then
                previous_path="$(readlink -f "$active_path")"
              elif [ -d "$active_path" ]; then
                legacy_backup="${active_path}.legacy-$(date +%Y%m%d%H%M%S)"
                mv "$active_path" "$legacy_backup"
              fi

              rollback() {
                status="$?"
                set +e
                rm -f "$active_path" "${active_path}.new"
                if [ -n "$previous_path" ] && [ -d "$previous_path" ]; then
                  ln -s "$previous_path" "$active_path"
                elif [ -n "$legacy_backup" ] && [ -d "$legacy_backup" ]; then
                  mv "$legacy_backup" "$active_path"
                fi
                rm -f "$archive"
                exit "$status"
              }
              trap rollback ERR

              install -d -m 755 "$release_root"
              rm -rf "$release_path"
              install -d -m 755 "$release_path"
              tar -xzf "$archive" -C "$release_path"
              test -s "$release_path/dist/index.html"

              ln -sfn "$release_path" "${active_path}.new"
              mv -Tf "${active_path}.new" "$active_path"
              [ "$(readlink -f "$active_path")" = "$release_path" ]
              test -s "$active_path/dist/index.html"

              status_code="$(curl -sS -o /dev/null -w '%{http_code}' --retry 5 --retry-delay 2 https://cms.tiembacngocchau.vn/)"
              [ "$status_code" = "200" ]

              trap - ERR
              rm -f "$archive"
              ls -1dt "$release_root"/release-* 2>/dev/null | tail -n +4 | xargs -r rm -rf
REMOTE
          '''
        }
      }
    }
  }

  post {
    always {
      sh 'rm -f cms-dist.tgz'
      deleteDir()
    }
  }
}
```

- [x] **Step 4: Create the aggregate pipeline**

Create `/Users/phuongtran/Documents/Freelance/NgocChau/Version2/CMS_2/deploy/jenkins/Jenkinsfile.deploy-all` with:

```groovy
pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
    timeout(time: 1, unit: 'HOURS')
  }

  stages {
    stage('Deploy API') {
      steps {
        build job: 'Ngoc Chau - API', wait: true, propagate: true
      }
    }

    stage('Deploy CMS') {
      steps {
        build job: 'Ngoc Chau - CMS', wait: true, propagate: true
      }
    }
  }
}
```

- [x] **Step 5: Validate pipeline invariants without executing them**

Run:

```bash
rg -n "YTPlus_SSH|NGOCCHAU_SERVER_SSH|disableConcurrentBuilds|timeout\(time: 1, unit: 'HOURS'\)" \
  /Users/phuongtran/Documents/Freelance/NgocChau/Version2/API_2/deploy/jenkins/Jenkinsfile.api \
  /Users/phuongtran/Documents/Freelance/NgocChau/Version2/CMS_2/deploy/jenkins/Jenkinsfile.cms
rg -n "Ngoc Chau - API|Ngoc Chau - CMS|propagate: true|wait: true" \
  /Users/phuongtran/Documents/Freelance/NgocChau/Version2/CMS_2/deploy/jenkins/Jenkinsfile.deploy-all
```

Expected: each required invariant appears in the correct pipeline and no secret value appears in any file.

### Task 2: Prepare the Production Runtime

- [x] **Step 1: Record the pre-install state**

Run remotely:

```bash
command -v node || true
command -v npm || true
command -v pm2 || true
command -v redis-server || true
systemctl is-active mongod
nginx -t
```

Expected: MongoDB and Nginx are healthy; the four application runtime commands are absent before installation.

- [x] **Step 2: Install Node.js 20, npm, PM2, and Redis**

Run remotely using Ubuntu packages and the NodeSource 20 repository, then install PM2 globally. Enable and start Redis, verify it is bound to loopback, and persist PM2 startup through systemd for `root`.

- [x] **Step 3: Verify the installed runtime**

Run remotely:

```bash
node --version
npm --version
pm2 --version
redis-cli -h 127.0.0.1 ping
systemctl is-enabled redis-server
systemctl is-active redis-server
ss -lntp | rg ':6379'
```

Expected: Node reports major version `20`, Redis replies `PONG`, and Redis is enabled, active, and loopback-only.

### Task 3: Create the Isolated Database and Release Layout

- [x] **Step 1: Create the production directories**

Run remotely:

```bash
install -d -m 755 /home/https/apps/ngocchau
install -d -m 755 /home/https/releases/ngocchau/api
install -d -m 755 /home/https/releases/ngocchau/cms
install -d -m 755 /home/https/shared/ngocchau/api
install -d -m 755 /home/https/shared/ngocchau/api/uploads
```

Expected: all directories exist and unrelated `/home/https/www` children remain unchanged.

- [x] **Step 2: Create `ngocchau_v2_prod` without changing `ngocchau`**

Run a MongoDB command that upserts a single document into `ngocchau_v2_prod.deployment_metadata` with key `environment: "production"` and the current timestamp.

- [x] **Step 3: Verify database isolation**

Run remotely with `mongosh --quiet` and return only database and collection names, never document values.

Expected: both `ngocchau` and `ngocchau_v2_prod` exist; `deployment_metadata` exists only in the new database.

### Task 4: Create Jenkins Credentials Safely

- [x] **Step 1: Create a dedicated production SSH credential**

Generate a new Ed25519 deployment key, append only its public key to the
production root account, verify that the new key authenticates, and store the
private key in Jenkins as `NGOCCHAU_SERVER_SSH`. Delete the temporary local key
pair after a Jenkins deployment succeeds with that credential.

- [x] **Step 2: Create fixed connection credentials**

Create Jenkins Secret Text credentials:

```text
NGOCCHAU_API_MONGO_URI = mongodb://127.0.0.1:27017/ngocchau_v2_prod
NGOCCHAU_API_REDIS_URL = redis://127.0.0.1:6379
```

- [x] **Step 3: Generate application secrets directly into Jenkins**

Generate at least 48 random bytes for each of `NGOCCHAU_API_JWT_SECRET` and `NGOCCHAU_API_ENCRYPTION_KEY`. Transfer each value through the system clipboard into the Jenkins credential form, clear the clipboard afterward, and never print the values.

- [x] **Step 4: Migrate Zalo values without exposing them**

Read `ZALO_APP_ID`, `ZALO_SECRET_KEY`, and `ZALO_TEMPLATE_ID` from `/home/https/www/api/.env` on the production server into the clipboard one at a time and create:

```text
NGOCCHAU_API_ZALO_APP_ID
NGOCCHAU_API_ZALO_SECRET_KEY
NGOCCHAU_API_ZALO_TEMPLATE_ID
```

Abort creation of an individual credential if its source key is absent or empty; do not substitute a guessed value.

- [x] **Step 5: Keep Google OCR disabled until real configuration exists**

Verify that `.env` and `.env.development` contain no production Google project,
location, or model values. Do not migrate documentation-only values from
`.env.example`, and do not create `NGOCCHAU_GOOGLE_APPLICATION_CREDENTIALS`
because no real JSON credential file exists in either approved local location.

- [x] **Step 6: Verify credential IDs only**

Inspect the Jenkins credential list and verify the expected IDs are present. Never open or reveal their stored values.

### Task 5: Create the Jenkins Jobs

- [x] **Step 1: Create `Ngoc Chau - API`**

Create a Pipeline job, paste the exact content of `Jenkinsfile.api` as an inline pipeline, and save it.

- [x] **Step 2: Create `Ngoc Chau - CMS`**

Create a Pipeline job, paste the exact content of `Jenkinsfile.cms` as an inline pipeline, and save it.

- [x] **Step 3: Create `Ngoc Chau - Deploy All`**

Create a Pipeline job, paste the exact content of `Jenkinsfile.deploy-all` as an inline pipeline, and save it.

- [x] **Step 4: Verify job configuration**

Open each job configuration and confirm the job name, inline script, build retention, concurrency guard, and timeout. Do not trigger deployment until Nginx is prepared.

### Task 6: Configure Nginx Safely

- [x] **Step 1: Back up only the affected CMS configuration**

Copy `/etc/nginx/sites-enabled/cms.tiembacngocchau.vn.conf` to a timestamped sibling backup before editing.

- [x] **Step 2: Change the CMS compatibility upstream to port `4100`**

Preserve all existing TLS and location directives except the API upstream target. Keep the CMS root at `/home/https/www/cms/dist`.

- [x] **Step 3: Create the API virtual host**

Create an HTTP virtual host for `api.tiembacngocchau.vn` that proxies `/` to `http://127.0.0.1:4100`, supplies standard forwarded headers, supports WebSocket upgrades, and allows upload bodies large enough for current API use.

- [x] **Step 4: Validate and reload**

Run remotely:

```bash
nginx -t
systemctl reload nginx
systemctl is-active nginx
```

Expected: syntax succeeds and Nginx remains active. If syntax fails, restore the timestamped CMS backup and remove only the new API vhost link/file.

### Task 7: Deploy and Verify the API

- [x] **Step 1: Trigger `Ngoc Chau - API`**

Start the Jenkins build and monitor the complete log while confirming that masked credential bindings do not reveal values.

- [x] **Step 2: Verify the API independently on the server**

Run remotely:

```bash
pm2 describe ngocchau-api
readlink -f /home/https/apps/ngocchau/api
curl --silent --output /dev/null --write-out '%{http_code}' http://127.0.0.1:4100/api/connection
redis-cli -h 127.0.0.1 ping
```

Expected: PM2 status is online, the symlink targets the current release, HTTP status is `204`, and Redis replies `PONG`.

- [x] **Step 3: Verify release retention and protected files**

Expected: at most three API release directories remain; `.env.production` and any shared credential file have mode `600`; uploads resolve to `/home/https/shared/ngocchau/api/uploads`.

### Task 8: Deploy and Verify the CMS

- [x] **Step 1: Trigger `Ngoc Chau - CMS`**

Start the Jenkins build only after the API job succeeds.

- [x] **Step 2: Verify the CMS independently**

Run remotely and publicly:

```bash
readlink -f /home/https/www/cms
test -s /home/https/www/cms/dist/index.html
curl --silent --output /dev/null --write-out '%{http_code}' https://cms.tiembacngocchau.vn/
```

Expected: the symlink targets the current CMS release, `index.html` is non-empty, and public HTTPS returns `200`.

- [x] **Step 3: Verify legacy preservation and retention**

Expected: the original CMS directory exists as a timestamped legacy backup after first activation and at most three new CMS releases remain.

### Task 9: Verify the Aggregate Deployment and External Blocker

- [x] **Step 1: Trigger `Ngoc Chau - Deploy All`**

Expected: the aggregate job waits for a successful API build before starting CMS, and reports success only when both downstream jobs succeed.

- [x] **Step 2: Re-run final health checks**

Verify Jenkins job results, PM2 state, local API HTTP `204`, public CMS HTTP `200`, MongoDB database presence, Redis state, Nginx state, active symlinks, and release retention.

- [x] **Step 3: Check API DNS without changing external DNS**

Run:

```bash
dig +short api.tiembacngocchau.vn A
```

Expected until the DNS owner acts: no address. Do not run Certbot or claim public API HTTPS is complete until this command resolves to the intended server/proxy.

## Policy Notes

- Do not run any local or remote Git CLI commands. Jenkins repository access uses the Jenkins `checkout` step only.
- Do not commit or push the three local pipeline source files; the user must perform any Git operation manually.
- Do not delete legacy application directories or databases.
- Do not print credential values, private keys, tokens, or complete environment files.
