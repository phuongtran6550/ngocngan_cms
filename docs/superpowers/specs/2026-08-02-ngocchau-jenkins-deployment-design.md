# Ngoc Chau Jenkins Deployment Design

## Objective

Provide one-click Jenkins deployment for the Ngoc Chau API and CMS to
`149.28.144.156`, with independent jobs plus an orchestrator job that deploys
the API before the CMS.

## Confirmed Scope

Local source directories:

- `/Users/phuongtran/Documents/Freelance/NgocChau/Version2/API_2`
- `/Users/phuongtran/Documents/Freelance/NgocChau/Version2/CMS_2`

Remote write locations:

- `/home/https/apps/ngocchau/api`
- `/home/https/releases/ngocchau/api`
- `/home/https/shared/ngocchau/api`
- `/home/https/www/cms`
- `/home/https/releases/ngocchau/cms`

Approved system changes include installing Node.js 20, npm, PM2, and Redis,
including their files under `/usr`, `/etc/redis`, `/var/lib/redis`, and systemd.

## Observed Server State

- MongoDB 8 is active on `127.0.0.1:27017` with authorization disabled.
- Existing MongoDB databases include `ngocchau`; the new application will use
  a separate database named `ngocchau_v2_prod`.
- Redis, Node.js, npm, and PM2 are not installed.
- Nginx is active and its current configuration passes `nginx -t`.
- The current CMS lives under `/home/https/www/cms` and proxies `/api` to the
  old API on port `4000`.
- `/home/https/www` also contains the public website and old API. It must remain
  a directory and must never be replaced by a CMS symlink.
- `cms.tiembacngocchau.vn` resolves through Cloudflare and responds over HTTPS.
- `api.tiembacngocchau.vn` does not currently have a DNS record.
- CUPS and the `lp` command are not installed. Printer deployment is excluded
  from this phase.

## Jenkins Jobs

### Ngoc Chau - API

Checks out `git@github.com:phuongtran6550/ngocngan_api.git` from `main` using
`YTPlus_SSH`, packages the source, uploads it with `ServerMain`, and deploys a
versioned release on the production server.

### Ngoc Chau - CMS

Checks out `git@github.com:phuongtran6550/ngocngan_cms.git` from `main` using
`YTPlus_SSH`, builds the Vite application with Jenkins Node.js 20, uploads the
result with `ServerMain`, and activates a versioned CMS release.

### Ngoc Chau - Deploy All

Triggers `Ngoc Chau - API` and waits for success before triggering
`Ngoc Chau - CMS`. An API failure prevents the CMS deployment.

All jobs retain ten Jenkins build records, disable concurrent builds, use a
one-hour timeout, and expose the Git commit in the Jenkins build display name.

## API Runtime Design

- Runtime: Node.js 20 managed by PM2.
- PM2 process name: `ngocchau-api`.
- Instances: one. This avoids duplicate OCR workers during the initial rollout.
- Port: `4100` on loopback through Nginx.
- Active path: `/home/https/apps/ngocchau/api`.
- Release path: `/home/https/releases/ngocchau/api/release-${BUILD_NUMBER}`.
- Persistent uploads: `/home/https/shared/ngocchau/api/uploads`.
- Production dependencies are installed on the target with `npm ci --omit=dev`.
- The release is activated with an atomic symlink swap.
- PM2 is restarted with `NODE_ENV=production` and saved after successful start.
- The pipeline keeps the three newest releases.

The API health check verifies all of the following:

1. The PM2 process is online.
2. The active symlink resolves to the new release.
3. `http://127.0.0.1:4100/api/connection` returns HTTP 204.
4. The public endpoint is checked after DNS and TLS are available.

On failure, the active symlink is restored to the previous release and PM2 is
restarted from that release.

## Database and Redis

The server preparation creates `ngocchau_v2_prod` with a small deployment
metadata collection so that the database exists before the first application
write. No existing MongoDB database or collection is modified.

MongoDB remains bound to loopback. Enabling MongoDB authorization is excluded
because it would be a server-wide migration that could break the legacy
application. The new Mongo URI is stored in Jenkins even though it contains no
password, keeping runtime configuration in one controlled location.

Redis is installed from Ubuntu packages, enabled through systemd, bound to
loopback, and configured for local application access. The API cannot start
without Redis because Socket.IO initializes its Redis adapter before opening
the HTTP port.

## API Configuration and Credentials

Git access reuses the existing GitHub credential, while server deployment uses
a dedicated key authorized only for the Ngoc Chau production host:

- `YTPlus_SSH`: GitHub checkout.
- `NGOCCHAU_SERVER_SSH`: SSH deployment to `149.28.144.156` as `root`.

Application configuration uses separate Jenkins credentials with the
`NGOCCHAU_` prefix. It must never reuse YTPlus application secrets or database
credentials.

Planned credential IDs:

- `NGOCCHAU_API_MONGO_URI`
- `NGOCCHAU_API_REDIS_URL`
- `NGOCCHAU_API_JWT_SECRET`
- `NGOCCHAU_API_ENCRYPTION_KEY`
- `NGOCCHAU_API_ZALO_APP_ID`
- `NGOCCHAU_API_ZALO_SECRET_KEY`
- `NGOCCHAU_API_ZALO_TEMPLATE_ID`
- `NGOCCHAU_GOOGLE_APPLICATION_CREDENTIALS` as a Jenkins Secret File

JWT and encryption secrets are generated with a cryptographically secure
random source. Existing Zalo values are migrated from the old API environment
without printing them in terminal output, Jenkins logs, or responses.

The local API development environment currently references this SDK file:

`/Users/phuongtran/Documents/Freelance/NgocChau/Version2/license/ngocngan-service-account.json`

The referenced file was absent during inspection. The approved alternate
location `/Users/phuongtran/.config/gcloud` is also absent, and the local
machine does not have the `gcloud` CLI installed. Therefore no Application
Default Credentials or service-account JSON is available to migrate. No
placeholder credential will be created. The local `.env` and
`.env.development` files also contain no production Google project, location,
or model values; values present in `.env.example` are documentation examples
and are not migrated. When a real credential file and production values are
provided later, Jenkins stores the file as the Secret File credential above. During
deployment, Jenkins copies it to
`/home/https/shared/ngocchau/api/google-credentials.json`, sets mode `600`, and
sets `GOOGLE_APPLICATION_CREDENTIALS` to that path in `.env.production`.

Non-secret production values include:

- `NODE_ENV=production`
- `PORT=4100`
- `CMS_ORIGINS=https://cms.tiembacngocchau.vn`
- `JWT_EXPIRES_IN=7d`
- `UPLOAD_DIR=/home/https/shared/ngocchau/api/uploads`
- `ZALO_REDIRECT_URI=https://cms.tiembacngocchau.vn/zalo/callback`

Google Vision and multimodal OCR remain disabled until the Secret File is
present and the production project/model values have been migrated. This keeps
the initial API startup deterministic and routes incomplete OCR cases through
manual review instead of failing checkout.

## CMS Build and Deployment

Jenkins uses Node.js 20 and runs:

1. `npm ci`
2. `npm run lint`
3. `npm run build`
4. Verify `dist/index.html`

The initial pipeline does not run the unit suite because the approved source
`npm run build`.

Build-time environment values are:

- `VITE_API_BASE_URL=https://api.tiembacngocchau.vn/api`
- `VITE_ASSET_BASE_URL=https://api.tiembacngocchau.vn`

The release contains the `dist` directory and is extracted to
`/home/https/releases/ngocchau/cms/release-${BUILD_NUMBER}`. The active path
`/home/https/www/cms` is an atomic symlink to the release. The existing CMS
directory is moved to a timestamped legacy backup during the first deployment;
it is not deleted.

The pipeline keeps three CMS releases, verifies the active symlink and
`dist/index.html`, then checks `https://cms.tiembacngocchau.vn/`. A failed
verification restores the previous release.

## Nginx and DNS

Nginx is updated so that:

- `cms.tiembacngocchau.vn` serves `/home/https/www/cms/dist`.
- Its compatibility `/api` and `/uploads` proxy targets use port `4100`.
- A new `api.tiembacngocchau.vn` virtual host proxies to
  `http://127.0.0.1:4100`.

Every Nginx change is syntax-checked before reload. The existing public website
configuration is not changed.

The user must create the DNS record for `api.tiembacngocchau.vn`. Certbot and
the public API health check run only after that record resolves to the server
or the correct Cloudflare proxy configuration is active.

## Security and Secret Handling

- Secret values are never printed.
- Jenkins credentials are referenced only by credential ID.
- `.env.production` and the Google credential file use mode `600`.
- Runtime secrets are generated or migrated directly into Jenkins credential
  forms and are not added to Git.
- The deployment excludes `.git`, local `.env` files, `node_modules`, build
  artifacts, test results, and local tool artifacts.
- MongoDB and Redis remain loopback-only.
- Production release directories are owned by root and are not writable by the
  web process outside designated shared directories.

## Verification

The rollout is complete only when:

- Node.js 20, npm, PM2, Redis, MongoDB, and Nginx report expected versions and
  active state.
- `ngocchau_v2_prod` exists without modifying `ngocchau`.
- Jenkins has separate Ngoc Chau credentials and all three jobs.
- The API job deploys successfully and local HTTP health returns 204.
- The CMS job deploys successfully and serves its built `index.html`.
- The orchestrator job runs API then CMS in order.
- Both working trees remain free of generated secrets.
- Public HTTPS checks pass after the API DNS record exists.

## Deferred Work

- CUPS, printer queue configuration, and physical label-printer validation.
- Enabling MongoDB authorization as a coordinated server-wide migration.
- Re-enabling automated Google OCR before the SDK Secret File is available.
