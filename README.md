[![Umbrel Middleware](https://static.getumbrel.com/github/github-banner-umbrel-middleware.svg)](https://github.com/getumbrel/umbrel-middleware)

[![Version](https://img.shields.io/github/v/release/getumbrel/umbrel-middleware?color=%235351FB&label=version)](https://github.com/getumbrel/umbrel-middleware/releases)
[![Docker Build](https://img.shields.io/github/workflow/status/getumbrel/umbrel-middleware/Docker%20build%20on%20push?color=%235351FB)](https://github.com/getumbrel/umbrel-middleware/actions?query=workflow%3A"Docker+build+on+push")
[![Docker Pulls](https://img.shields.io/docker/pulls/getumbrel/middleware?color=%235351FB)](https://hub.docker.com/repository/registry-1.docker.io/getumbrel/middleware/tags?page=1)
[![Chat](https://img.shields.io/badge/chat%20on-telegram-%235351FB)](https://t.me/getumbrel)

[![Twitter](https://img.shields.io/twitter/follow/getumbrel?style=social)](https://twitter.com/getumbrel)
[![Reddit](https://img.shields.io/reddit/subreddit-subscribers/getumbrel?label=Subscribe%20%2Fr%2Fgetumbrel&style=social)](https://reddit.com/r/getumbrel)


# ☂️ middleware

Middleware runs by-default on [Umbrel OS](https://github.com/getumbrel/umbrel-os) as a containerized service. It wraps [Bitcoin Core](https://github.com/bitcoin/bitcoin)'s RPC and [LND](https://github.com/lightningnetwork/lnd)'s gRPC, and exposes them via a RESTful API.

Umbrel OS's [web dashboard](https://github.com/getumbrel/umbrel-dashboard) uses middleware to interact with both Bitcoin and Lightning Network.

## 🚀 Getting started

If you are looking to run Umbrel on your hardware, you do not need to run this service on it's own. Just download [Umbrel OS](https://github.com/getumbrel/umbrel-os/releases) and you're good to go.

## 🛠 Running middleware

Make sure a [`bitcoind`](https://github.com/bitcoin/bitcoin) and [`lnd`](https://github.com/lightningnetwork/lnd) instance is running and available on the same machine.

### Step 1. Install dependencies
```sh
yarn
```

### Step 2. Set environment variables
Set the following environment variables directly or by placing them in `.env` file of project's root.

| Variable | Description | Default |
| ------------- | ------------- | ------------- |
| `PORT` | Port where middleware should listen for requests | `3005` |
| `DEVICE_HOST` | IP or domain from where [`umbrel-dashboard`](https://github.com/getumbrel/umbrel-dashboard) will request | `http://umbrel.local` |
| `BITCOIN_HOST` | IP or domain where `bitcoind` RPC is listening | `127.0.0.1` |
| `RPC_USER` | `bitcoind` RPC username  |  |
| `RPC_PASSWORD` | `bitcoind` RPC password |  |
| `LND_HOST` | IP or domain where `lnd` RPC is listening | `127.0.0.1` |
| `TLS_FILE` | Path to `lnd`'s TLS certificate | `/lnd/tls.cert` |
| `LND_PORT` | Port where `lnd` RPC is listening | `10009` |
| `LND_NETWORK` | The chain `bitcoind` is running on (mainnet, testnet, regtest, simnet) | `mainnet` |
| `MACAROON_DIR` | Path to `lnd`'s macaroon directory | `/lnd/data/chain/bitcoin/mainnet/` |
| `JWT_PUBLIC_KEY_FILE` | Path to the JWT public key created by [`umbrel-manager`](https://github.com/getumbrel/umbrel-manager) | `/jwt-public-key/jwt.pem` |

### Step 3. Run middleware
```sh
yarn start
```

You can browse through the available API endpoints [here](https://github.com/getumbrel/umbrel-middleware/tree/master/routes/v1).

---

### ⚡️ Don't be too reckless

> Umbrel is still in an early stage and things are expected to break every now and then. We **DO NOT** recommend running it on the mainnet with real money just yet, unless you want to be really *#reckless*.

## ❤️ Contributing

We welcome and appreciate new contributions!

If you're a developer looking to help but not sure where to begin, check out [these issues](https://github.com/getumbrel/umbrel-middleware/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) that have specifically been marked as being friendly to new contributors.

If you're looking for a bigger challenge, before opening a pull request please [create an issue](https://github.com/getumbrel/umbrel-middleware/issues/new/choose) or [join our community chat](https://t.me/getumbrel) to get feedback, discuss the best way to tackle the challenge, and to ensure that there's no duplication of work.

## 🙏 Acknowledgements

Umbrel Middleware is built upon the work done by [Casa](https://github.com/casa) on its open-source [API](https://github.com/Casa/Casa-Node-API).

---

[![License](https://img.shields.io/github/license/getumbrel/umbrel-middleware?color=%235351FB)](https://github.com/getumbrel/umbrel-middleware/blob/master/LICENSE)

[getumbrel.com](https://getumbrel.com)
