// Shared type declarations from the backend and ui
// TODO: Replace with actual types

export type SummaryResponse = {
  networkInfo: unknown;
  blockchainInfo: unknown;
  peerInfo: unknown;
}

export type StatusResponse = {
  running: boolean;
  pid: number;
}
