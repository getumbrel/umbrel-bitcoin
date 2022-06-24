<p align="center">
  <a href="https://umbrel.com">
    <img src="https://i.imgur.com/rhDWq5W.jpg" alt="Logo">
  </a>
  <h1 align="center">Bitcoin Node for Umbrel</h1>
  <p align="center">
    Run a Bitcoin node on your Umbrel personal server. An official app by Umbrel. Powered by Bitcoin Core.
    <br />
    <a href="https://umbrel.com"><strong>umbrel.com »</strong></a>
    <br />
    <br />
    <a href="https://twitter.com/umbrel">
      <img src="https://img.shields.io/twitter/follow/umbrel?style=social" />
    </a>
    <a href="https://t.me/getumbrel">
      <img src="https://img.shields.io/badge/community-chat-%235351FB">
    </a>
    <a href="https://reddit.com/r/getumbrel">
      <img src="https://img.shields.io/reddit/subreddit-subscribers/getumbrel?style=social">
    </a>
    <a href="https://community.getumbrel.com">
      <img src="https://img.shields.io/badge/community-forum-%235351FB">
    </a>
  </p>
</p>

## Getting started

This app can be installed in one click via the Umbrel App Store.

## Running locally for development

Make sure a [`bitcoind`](https://github.com/bitcoin/bitcoin) instance is running and available on the same machine.

### Step 1. Install dependencies
```sh
yarn
```

### Step 2. Set environment variables
Set the following environment variables directly or by placing them in `.env` file of project's root.

| Variable | Description | Default |
| ------------- | ------------- | ------------- |
| `PORT` | Port where the API should listen for requests | `3005` |
| `DEVICE_HOSTS` | Comma separated list of IPs or domain names to whitelist for CORS | `http://umbrel.local` |
| `BITCOIN_HOST` | IP or domain where `bitcoind` RPC is listening | `127.0.0.1` |
| `RPC_USER` | `bitcoind` RPC username  |  |
| `RPC_PASSWORD` | `bitcoind` RPC password |  |

### Step 3. Build the web interface
```sh
yarn install:ui
yarn build:ui
```

### Step 4. Run
```sh
yarn start
```

You can access the app interface by visiting `http://localhost:8080/`

---

## Contributing

We welcome and appreciate new contributions!

If you're a developer looking to help but not sure where to begin, check out [these issues](https://github.com/getumbrel/umbrel-bitcoin/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) that have specifically been marked as being friendly to new contributors.

If you're looking for a bigger challenge, before opening a pull request please [create an issue](https://github.com/getumbrel/umbrel-bitcoin/issues/new/choose) or [join our community chat](https://t.me/getumbrel) to get feedback, discuss the best way to tackle the challenge, and to ensure that there's no duplication of work.

## Acknowledgements

This app is built upon the work done by [Casa](https://github.com/casa) on its open source [API](https://github.com/Casa/Casa-Node-API).

---

[![License](https://img.shields.io/github/license/getumbrel/umbrel-bitcoin?color=%235351FB)](https://github.com/getumbrel/umbrel-bitcoin/blob/master/LICENSE)

[umbrel.com](https://umbrel.com)
