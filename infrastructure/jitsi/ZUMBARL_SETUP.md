# Zumbarl Jitsi

This directory contains the pinned official `docker-jitsi-meet` release used by
Zumbarl for self-hosted interview rooms.

## Local development

From this directory:

```sh
cp env.example .env
./gen-passwords.sh
docker compose up -d
```

Jitsi is then available at `http://localhost:18000`. Generated Zumbarl
interview rooms use this address through the backend `JITSI_PUBLIC_URL`
environment variable.

Stop the stack with:

```sh
docker compose down
```

The web container replaces Jitsi's meeting watermark with the white Zumbarl
bee. The source mark remains `zumbarl.com/public/assets/index/bee_nobg.png`;
the transparent white asset and Jitsi overrides live in
`infrastructure/jitsi/branding`. Restart the web container after changing
these assets:

```sh
docker compose up -d --force-recreate web
```

Configuration data is stored outside the repository in
`~/.jitsi-meet-cfg-zumbarl`.

## Production

Before deploying:

1. Set `PUBLIC_URL=https://meet.zumbarl.com`.
2. Set `JVB_ADVERTISE_IPS` to the server's public IP.
3. Remove `DISABLE_HTTPS=1`.
4. Set `BOSH_RELATIVE=0` and `ENABLE_XMPP_WEBSOCKET=1`.
5. Enable Let's Encrypt and configure its domain and contact email.
6. Open TCP ports 80 and 443 and UDP port 10000.
7. Set the backend `JITSI_PUBLIC_URL=https://meet.zumbarl.com`.

Anonymous room creation is enabled for the current MVP. Room names are
generated with cryptographically random identifiers. JWT authentication should
be enabled before exposing the service beyond controlled testing.
