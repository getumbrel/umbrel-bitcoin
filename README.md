### Monorepo scaffolding

- Pinned Node LTS version in .nvmrc. You can run `nvm use` to use that version.
- Backend is node and Fastify (Bun doesn't have zeromq support (and other bugginess), and Elysia does not have full support for node currently).
- Frontend is React and Vite with Tanstack Query. Vite dev-server proxies /api/** to http://localhost:3000/**
- The root package.json declares npm workspaces (apps/*, libs/*).
- Two workspaces right now: apps/backend and apps/ui.
- From the root directory you can run `npm install` and shared dependencies are hoisted to the root-level node_modules.
- Typescript config: Root tsconfig.base.json for base options. Backend tsconfig.json extends the base. UI keeps Vite’s tsconfig.app.json / tsconfig.node.json and extends the base.
- Linting: Flat ESLint config at the root. Overrides add project configs for backend and UI, plus React/React-Hooks rules. Stylistic rules disabled in favour of Prettier.
- Prettier: Root prettier.config.js for shared config. .prettierignore excludes node_modules, build artifacts, etc.

### Running this early POC in dev:

Install bitcoind on macOS:

```bash
brew install bitcoin
```

Currently the bitcoind binary is hardcoded in `apps/backend/src/paths.ts` to `/opt/homebrew/bin/bitcoind`

Run both backend and frontend from the root directory:

```bash
npm run dev
```