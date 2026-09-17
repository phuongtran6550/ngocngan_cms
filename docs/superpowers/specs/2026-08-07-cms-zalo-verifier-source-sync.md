# CMS Zalo Verifier Jenkins Gate Removal

**Status:** Approved
**Owner:** Ngoc Chau CMS
**Date:** 2026-08-07

## Requested Outcome

Restore Jenkins deployment for `Ngoc Chau - CMS` and
`Ngoc Chau - Deploy All` by removing the obsolete Zalo domain-verification
file from the CMS release gates.

## Verified Root Cause

- Jenkins CMS build `#15` completes install, lint, typecheck, and Vite build.
- It fails only because the pipeline requires `dist/zalo_verifier*.html`.
- The verifier is not part of CMS runtime, API behavior, authentication, or
  the Zalo OAuth callback.
- The owner confirmed that the Zalo domain was verified previously and the
  verifier file is no longer required for deployment.

## Reference Pattern

The change follows the existing deployment structure:

- `deploy/jenkins/Jenkinsfile.cms` already gates releases on `dist/index.html`,
  active symlink correctness, and the public HTTP smoke test.
- `docs/superpowers/specs/2026-08-02-ngocchau-jenkins-deployment-design.md`
  defines source-controlled, reproducible CMS artifacts built by Jenkins.
- `deploy/jenkins/Jenkinsfile.deploy-all` preserves API-first orchestration and
  propagates failures from both child jobs.

## Exact Pipeline Change

**Target file:** `deploy/jenkins/Jenkinsfile.cms`

Remove this obsolete build gate after `test -s dist/index.html`:

```sh
# File xác minh Zalo OA phải đi cùng bản build, thiếu là Zalo mất
# xác thực domain và ZNS ngừng gửi được thông báo đơn hàng.
verifier_count="$(find dist -maxdepth 1 -type f -name 'zalo_verifier*.html' | wc -l)"
[ "$verifier_count" -ge 1 ] || {
  echo 'Thiếu file xác minh Zalo trong dist/ — kiểm tra public/zalo_verifier*.html' >&2
  exit 1
}
```

Remove this obsolete release gate from `verify_cms_release`:

```sh
find "$active_path/dist" -maxdepth 1 -type f \
  -name 'zalo_verifier*.html' | grep -q . || {
  echo 'Bản đã phát hành thiếu file xác minh Zalo' >&2
  return 1
}
```

The resulting build and release checks remain:

```sh
npm run build
test -s dist/index.html || {
  echo 'Build không sinh ra dist/index.html' >&2
  exit 1
}
```

```sh
verify_cms_release() {
  expected_path="$1"
  [ "$(readlink -f "$active_path")" = "$expected_path" ] || return 1
  test -s "$active_path/dist/index.html" || return 1
  verify_cms_http
}
```

The same approved pipeline content must be applied to the inline Jenkins job
`Ngoc Chau - CMS`. No application source, API contract, environment value,
credential, Nginx configuration, or rollback behavior changes.

## Affected Components

- CMS Jenkins pipeline source and inline job configuration.
- Jenkins `Ngoc Chau - CMS` build/release validation.
- Jenkins `Ngoc Chau - Deploy All` aggregate result.

API behavior and data storage are unaffected.

## Validation

1. Confirm the local and inline Jenkins pipeline no longer contain
   `zalo_verifier` checks.
2. Run CMS lint and build from the approved local source.
3. Run `Ngoc Chau - Deploy All` with `BRANCH=main` and
   `SKIP_SMOKE_TESTS=false`.
4. Confirm the child API and CMS jobs both finish `SUCCESS`.
5. Confirm the active CMS release contains a non-empty `dist/index.html`.
6. Confirm the API endpoint remains HTTP `204` and the CMS root remains HTTP
   `200`.

## Rollback

Restore the two verifier checks from the previous Jenkins job configuration if
Zalo requires continuous domain verification again. CMS release rollback and
the previous production release remain available throughout deployment.

## Execution Evidence

Validated on 2026-08-07 after applying the approved change:

- Local `deploy/jenkins/Jenkinsfile.cms` and the inline `Ngoc Chau - CMS`
  pipeline have the same SHA-256:
  `8030d1b2ae020e18ac05b5d610d9a4cab32b2678e4d91ad61be54372d2ccf282`.
- Both pipeline copies contain zero `zalo_verifier` references and retain one
  `test -s dist/index.html` build gate.
- Local `npm run lint` completed with exit code `0`.
- Local `npm run build` completed with exit code `0` and generated a non-empty
  `dist/index.html`.
- `Ngoc Chau - API` build `#34` completed `SUCCESS` from
  `main@822b902e469638f4d0b41d391e1a67acb970082e`.
- `Ngoc Chau - CMS` build `#16` completed `SUCCESS` from
  `main@f34a5a44ffb4018ac669e8fd33432898f3b7856d`.
- `Ngoc Chau - Deploy All` build `#22` completed `SUCCESS` with smoke tests
  enabled.
- Production API points to `/home/https/releases/ngocchau/api/release-34` and
  PM2 reports `ngocchau-api` as `online` with zero restarts.
- Production CMS points to `/home/https/releases/ngocchau/cms/release-16`; its
  `dist/index.html` is non-empty and the release contains no obsolete
  `zalo_verifier*.html` file.
- API health returned HTTP `204` locally and through
  `https://api.tiembacngocchau.vn/api/connection`.
- `https://cms.tiembacngocchau.vn/` returned HTTP `200` from the new release.
