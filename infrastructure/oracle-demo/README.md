# Oracle Free Tier demo provisioning

This directory contains a guarded retry job for an OCI Ampere A1 demo VM.
It is intentionally fixed at `VM.Standard.A1.Flex`, 2 OCPU and 12 GB RAM so
it cannot silently fall back to a paid shape.

The local `.env.retry` file contains tenancy-specific OCIDs and is ignored by
Git. The launch job checks for an existing non-terminated `zumbarl-demo`
instance before every attempt. A successful launch creates
`~/.config/zumbarl-oci/provisioned`. Any error other than temporary A1 host
capacity creates `~/.config/zumbarl-oci/fatal-error` and pauses retries.

The macOS LaunchAgent runs every thirty minutes. Temporary A1 capacity errors
and Oracle HTTP 429 rate limits remain retryable; other errors pause the job.
Its logs are written to:

- `~/Library/Logs/zumbarl-oracle-free-tier.log`
- `~/Library/Logs/zumbarl-oracle-free-tier.error.log`

After provisioning succeeds, unload the retry agent before continuing with
Docker and application deployment:

```sh
launchctl bootout "gui/$(id -u)" ~/Library/LaunchAgents/com.zumbarl.oracle-free-tier.plist
```

## Temporary E2 micro bootstrap demo

`compose.bootstrap.yml` runs a production-mode demo on the remaining Always
Free `VM.Standard.E2.1.Micro` while A1 capacity is unavailable. It is
deliberately memory constrained and runs PostgreSQL and Redis on the same VM.
New uploads use a private, versioned OCI Object Storage bucket through a
dedicated bucket-limited service identity. A separate worker executes recurring
jobs. Payment and notification delivery remain explicitly disabled, and
`DEPLOYMENT_PURPOSE=demo` prevents the deployment from representing itself as
approved for live personal-data processing.

The edge service obtains HTTPS automatically for the VM's `sslip.io` hostname.
The public site does not use an edge-level password; authenticated application
features remain protected by Zumbarl's own session and role checks.

Copy `.env.bootstrap.example` to the ignored `.env.bootstrap`, replace every
secret, and copy the demo seed assets into `seed-public` with their paths
relative to `zumbarl.com/public`. Always pass the environment file explicitly
to Compose:

```sh
docker compose \
  --env-file .env.bootstrap \
  -f compose.bootstrap.yml \
  --profile release run --rm migrate

docker compose \
  --env-file .env.bootstrap \
  -f compose.bootstrap.yml \
  --profile release run --rm seed

docker compose \
  --env-file .env.bootstrap \
  -f compose.bootstrap.yml \
  up -d
```

The backend and scheduled worker run as separate processes. Named Docker
volumes preserve the database, Redis state, legacy seed assets, and TLS
certificates across container replacements. OCI Object Storage preserves new
uploads independently of the VM. Do not run `down -v` unless the demo data is
intentionally being erased.

## GitOps deployment from `main`

The `Verify` GitHub Actions workflow validates both applications, builds
commit-tagged images in GitHub Container Registry, runs the database migration,
deploys the API, worker and frontend together, and checks the public `/ready`
endpoint. A failed container health check restores the preceding application
image set; migrations remain forward-only.

Configure the GitHub `production` environment with:

- Actions secret `PRODUCTION_HOST`: the Oracle VM public IP or DNS name.
- Actions secret `PRODUCTION_SSH_KEY`: the private key for the VM's `ubuntu`
  account. This must be a dedicated deployment key whose `authorized_keys`
  entry uses `restrict` and forces `github-deploy-gate.sh`; do not store a
  general-purpose operator key in GitHub.
- Actions secret `PRODUCTION_SSH_KNOWN_HOSTS`: the trusted `known_hosts` line
  for the production host. Capture and verify its fingerprint out of band.
- Environment variable `PRODUCTION_URL`: the public HTTPS origin, without a
  trailing slash.

The VM keeps runtime secrets only in
`/opt/zumbarl/infrastructure/oracle-demo/.env.bootstrap`. They are never copied
into GitHub or a container image. A push to `main` deploys only after backend
and frontend verification succeeds. Pull requests run the same verification
but never publish or deploy.

The deployment definitions and command gate are provisioned to the VM by an
operator. The Actions key cannot upload or replace them, open a shell, forward
ports, or run arbitrary host commands.
