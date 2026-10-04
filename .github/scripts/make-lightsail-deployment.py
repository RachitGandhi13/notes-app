#!/usr/bin/env python3
"""Builds the Lightsail deployment JSON from the production environment held in a secret.

Reads the dotenv-style text from PRODUCTION_ENV and the image reference from IMAGE. Writes
containers.json and public-endpoint.json to RUNNER_TEMP. Fails before anything is deployed
if a required value is missing or a connection URL is malformed.
"""
import json
import os
import re
import sys

REQUIRED = [
    "DATABASE_URL", "NEXTAUTH_URL", "NEXTAUTH_SECRET", "GITHUB_ID", "GITHUB_SECRET",
    "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "SMTP_HOST", "SMTP_USER", "SMTP_PASS",
    "SMTP_FROM", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET",
    "BLOB_READ_WRITE_TOKEN", "REDIS_URL", "REVALIDATE_SECRET",
]
URL_PREFIXES = {
    "DATABASE_URL": ("postgresql://", "postgres://"),
    "REDIS_URL": ("redis://", "rediss://"),
}
# The app itself listens on 3000 (see apps/web/Dockerfile).
CONTAINER_PORT = 3000


def parse_env(text):
    """Parses KEY=VALUE lines. Strips matching quotes and trailing ' # comments'."""
    env = {}
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[len("export "):]
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.strip()
        # "value" or 'value', optionally followed by a comment, keeps only what is inside the quotes.
        quoted = re.match(r"""^(["'])(.*?)\1\s*(#.*)?$""", value)
        if quoted:
            value = quoted.group(2)
        else:
            value = re.sub(r"\s+#.*$", "", value).strip()
        env[key.strip()] = value
    return env


def main():
    env = parse_env(os.environ.get("PRODUCTION_ENV", ""))

    missing = [name for name in REQUIRED if not env.get(name)]
    if missing:
        sys.exit("CV_PRODUCTION_ENV is missing: " + ", ".join(missing))

    for name, prefixes in URL_PREFIXES.items():
        if not env[name].startswith(prefixes):
            sys.exit(f"{name} must start with one of {', '.join(prefixes)} (no quotes, no spaces)")

    # Keep the values out of the job log.
    for value in env.values():
        if value:
            print(f"::add-mask::{value}")

    image = os.environ.get("IMAGE", "").strip()
    if not image:
        sys.exit("IMAGE is empty: the push step did not produce an image reference")

    out_dir = os.environ.get("RUNNER_TEMP", ".")
    containers = {
        "web": {
            "image": image,
            "ports": {str(CONTAINER_PORT): "HTTP"},
            "environment": {k: v for k, v in env.items() if v},
        }
    }
    public_endpoint = {
        "containerName": "web",
        "containerPort": CONTAINER_PORT,
        "healthCheck": {
            "path": "/api/health",
            "successCodes": "200-299",
            "intervalSeconds": 15,
            "timeoutSeconds": 5,
            "healthyThreshold": 2,
            "unhealthyThreshold": 3,
        },
    }
    with open(os.path.join(out_dir, "containers.json"), "w") as f:
        json.dump(containers, f, indent=2)
    with open(os.path.join(out_dir, "public-endpoint.json"), "w") as f:
        json.dump(public_endpoint, f, indent=2)
    print(f"Wrote deployment for {image} with {len(containers['web']['environment'])} variables")


if __name__ == "__main__":
    main()
