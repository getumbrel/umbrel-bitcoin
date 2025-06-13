### TODO:
- [ ] show indication  of which chain is active
- [ ] Connect modal
- [x] Add advanced tab for custom config
- [ ] handle automated settings.json corruption detection/fix
- [ ] Add loading animation for blocks
- [ ] Add sync animation for blocks
- [ ] Add new single-block animation for blocks
- [ ] Hook blocks up to websocket once IBD is complete
- [ ] responsiveness everywhere
- [x] add newly requested config options
- [ ] heavily test config logic and options
- [x] add success and error toasts to settings page
- [x] add log to settings page when error occurs
- [ ] assumeutxo
- [x] use rpcauth
- [x] bring in the rest of the env vars from app store exports.sh
- [ ] old bitcoin-config.json --> new settings.json migration
- [ ] Address all TODOs in the codebase
- [ ] one place for query keys

### Monorepo scaffolding

- Pinned Node LTS version in .nvmrc. You can run `nvm use` to use that version.
- Backend is node and Fastify (Bun doesn't have zeromq support (and other bugginess), and Elysia does not have full support for node currently).
- Frontend is React and Vite with Tanstack Query. Vite dev-server proxies /api/** to http://localhost:3000/**
- The root package.json declares npm workspaces (apps/*, libs/*). From the root directory you can run `npm install` and shared dependencies are hoisted to the root-level node_modules.
- Current workspaces: apps/backend, apps/ui, libs/shared-types, libs/settings.
- You can install new packages from the root dir into a workspace. e.g., `npm i -w apps/ui @tanstack/react-query`
- Typescript config: Root tsconfig.base.json for base options. Backend tsconfig.json extends the base. UI keeps Vite’s tsconfig.app.json / tsconfig.node.json and extends the base.
- Linting: Flat ESLint config at the root. Overrides add project configs for backend and UI, plus React/React-Hooks rules. Stylistic rules disabled in favour of Prettier.
- Prettier: Root prettier.config.js for shared config. .prettierignore excludes node_modules, build artifacts, etc.
- Shared types – libs/shared-types/index.d.ts with a package.json named @umbrel-bitcoin/shared-types for easy import.
- Shared settings – libs/settings/index.ts with a package.json named @umbrel-bitcoin/settings for easy import.

### Backend

- BitcoindManager – spawns bitcoind as a child process, handles start / stop / restart, streams logs...
- RPC client – using bitcoin-core (npm i bitcoin-core)

### Development

From repo root run:

```sh
docker compose up
```

This will give you hot-reload for both backend and frontend.