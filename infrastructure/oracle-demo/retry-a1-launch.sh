#!/bin/bash

set -euo pipefail

ENV_FILE="${1:-}"
if [[ -z "$ENV_FILE" || ! -f "$ENV_FILE" ]]; then
  echo "Usage: $0 /absolute/path/to/.env.retry" >&2
  exit 64
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

required=(
  OCI_COMPARTMENT_ID
  OCI_AVAILABILITY_DOMAIN
  OCI_IMAGE_ID
  OCI_SUBNET_ID
  OCI_SSH_PUBLIC_KEY
  OCI_STATE_DIR
)

for name in "${required[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required setting: $name" >&2
    exit 64
  fi
done

OCI_PROFILE="${OCI_PROFILE:-DEFAULT}"
OCI_CLI="${OCI_CLI:-/usr/local/bin/oci}"
OCI_INSTANCE_NAME="${OCI_INSTANCE_NAME:-zumbarl-demo}"
OCI_OCPUS="${OCI_OCPUS:-2}"
OCI_MEMORY_GB="${OCI_MEMORY_GB:-12}"
OCI_BOOT_VOLUME_GB="${OCI_BOOT_VOLUME_GB:-100}"

if [[ "$OCI_OCPUS" != "2" || "$OCI_MEMORY_GB" != "12" ]]; then
  echo "Refusing to launch outside the approved Free Tier shape: 2 OCPU / 12 GB." >&2
  exit 65
fi

if [[ ! -x "$OCI_CLI" ]]; then
  echo "OCI CLI is not executable at $OCI_CLI" >&2
  exit 69
fi

mkdir -p "$OCI_STATE_DIR"
chmod 700 "$OCI_STATE_DIR"

complete_file="$OCI_STATE_DIR/provisioned"
fatal_file="$OCI_STATE_DIR/fatal-error"
lock_dir="$OCI_STATE_DIR/launch.lock"

if [[ -f "$complete_file" || -f "$fatal_file" ]]; then
  exit 0
fi

if ! mkdir "$lock_dir" 2>/dev/null; then
  exit 0
fi
trap 'rmdir "$lock_dir" 2>/dev/null || true' EXIT

timestamp() {
  date -u '+%Y-%m-%dT%H:%M:%SZ'
}

echo "$(timestamp) Checking for an existing $OCI_INSTANCE_NAME instance."

existing_count="$("$OCI_CLI" compute instance list \
  --profile "$OCI_PROFILE" \
  --compartment-id "$OCI_COMPARTMENT_ID" \
  --all \
  --query "length(data[?\"display-name\"==\`$OCI_INSTANCE_NAME\` && \"lifecycle-state\"!=\`TERMINATED\`])" \
  --raw-output)"

if [[ "$existing_count" != "0" ]]; then
  echo "$(timestamp) $OCI_INSTANCE_NAME already exists; marking provisioning complete."
  touch "$complete_file"
  exit 0
fi

echo "$(timestamp) Attempting Always Free A1 launch at 2 OCPU / 12 GB."

set +e
launch_output="$("$OCI_CLI" compute instance launch \
  --profile "$OCI_PROFILE" \
  --availability-domain "$OCI_AVAILABILITY_DOMAIN" \
  --compartment-id "$OCI_COMPARTMENT_ID" \
  --shape VM.Standard.A1.Flex \
  --shape-config "{\"ocpus\":$OCI_OCPUS,\"memoryInGBs\":$OCI_MEMORY_GB}" \
  --image-id "$OCI_IMAGE_ID" \
  --subnet-id "$OCI_SUBNET_ID" \
  --display-name "$OCI_INSTANCE_NAME" \
  --assign-public-ip true \
  --boot-volume-size-in-gbs "$OCI_BOOT_VOLUME_GB" \
  --ssh-authorized-keys-file "$OCI_SSH_PUBLIC_KEY" \
  --wait-for-state RUNNING \
  --wait-interval-seconds 15 \
  --max-wait-seconds 900 \
  --query 'data.{Id:id,Name:"display-name",State:"lifecycle-state"}' \
  --output json 2>&1)"
launch_status=$?
set -e

if [[ $launch_status -eq 0 ]]; then
  printf '%s\n' "$launch_output"
  echo "$(timestamp) $OCI_INSTANCE_NAME is running."
  touch "$complete_file"
  exit 0
fi

if [[ "$launch_output" == *"Out of host capacity"* ]]; then
  echo "$(timestamp) Stockholm still has no A1 host capacity; retry will continue."
  exit 75
fi

if [[ "$launch_output" == *"TooManyRequests"* || "$launch_output" == *'"status": 429'* ]]; then
  echo "$(timestamp) Oracle rate-limited the launch request; retry will continue after the cooldown."
  exit 75
fi

printf '%s\n' "$launch_output" >&2
echo "$(timestamp) A non-capacity error occurred; automatic retries are paused." >&2
touch "$fatal_file"
exit "$launch_status"
