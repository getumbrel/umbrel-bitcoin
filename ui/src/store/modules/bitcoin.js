import API from "@/helpers/api";
import { toPrecision } from "@/helpers/units";

// Initial state
const state = () => ({
  operational: false,
  calibrating: false,
  version: "",
  p2p: {
    address: "",
    port: "",
    connectionString: ""
  },
  rpc: {
    rpcuser: "",
    rpcpassword: "",
    address: "",
    port: "",
    connectionString: ""
  },
  currentBlock: 0,
  chain: "",
  blockHeight: 0,
  blocks: [],
  blockAggregates: [],
  blockRangeTransactionChunks: {
    "1d": [],
    "1hr": [],
    "3d": [],
    "6hr": [],
    "7d": [],
    "12hr": []
  },
  percent: -1, //for loading state
  depositAddress: "",
  stats: {
    peers: -1,
    mempool: -1,
    hashrate: -1,
    blockchainSize: -1
  },
  peers: {
    total: 0,
    inbound: 0,
    outbound: 0
  }
});

// Functions to update the state directly
const mutations = {
  isOperational(state, operational) {
    state.operational = operational;
  },

  syncStatus(state, sync) {
    state.percent = Number(toPrecision(parseFloat(sync.percent) * 100, 2));
    state.currentBlock = sync.currentBlock;
    state.blockHeight = sync.headerCount;
    state.chain = sync.chain;

    if (sync.status === "calibrating") {
      state.calibrating = true;
    } else {
      state.calibrating = false;
    }
  },

  setBlocks(state, blocks) {
    const mergedBlocks = [...blocks, ...state.blocks];
    // remove duplicate blocks
    const uniqueBlocks = mergedBlocks.filter(
      (v, i, a) => a.findIndex(t => t.height === v.height) === i
    );
    // limit to latest 6 blocks
    state.blocks = [...uniqueBlocks.slice(0, 6)];
  },

  setBlockRangeTransactionChunks(state, blockRangeTransactionChunks) {
    state.blockRangeTransactionChunks = blockRangeTransactionChunks;
  },

  setVersion(state, version) {
    state.version = version.version;
  },

  setStats(state, stats) {
    state.stats.peers = stats.peers;
    state.stats.mempool = stats.mempool;
    state.stats.blockchainSize = stats.blockchainSize;
    state.stats.hashrate = stats.hashrate;
  },

  setP2PInfo(state, p2pInfo) {
    state.p2p.address = p2pInfo.address;
    state.p2p.port = p2pInfo.port;
    state.p2p.connectionString = p2pInfo.connectionString;
  },

  setRpcInfo(state, rpcInfo) {
    state.rpc.rpcuser = rpcInfo.rpcuser;
    state.rpc.rpcpassword = rpcInfo.rpcpassword;
    state.rpc.address = rpcInfo.address;
    state.rpc.port = rpcInfo.port;
    state.rpc.connectionString = rpcInfo.connectionString;
  },

  peers(state, peers) {
    state.peers.total = peers.total || 0;
    state.peers.inbound = peers.inbound || 0;
    state.peers.outbound = peers.outbound || 0;
  }
};

// Functions to get data from the API
const actions = {
  async getStatus({ commit }) {
    const status = await API.get(
      `${process.env.VUE_APP_API_BASE_URL}/v1/bitcoind/info/status`
    );

    if (status) {
      commit("isOperational", status.operational);

      // if (status.operational) {
      //   dispatch("getSync");
      // }
    }
  },

  async getP2PInfo({ commit }) {
    const p2pInfo = await API.get(
      `${process.env.VUE_APP_API_BASE_URL}/v1/bitcoind/system/bitcoin-p2p-connection-details`
    );

    if (p2pInfo) {
      commit("setP2PInfo", p2pInfo);
    }
  },

  async getRpcInfo({ commit }) {
    const rpcInfo = await API.get(
      `${process.env.VUE_APP_API_BASE_URL}/v1/bitcoind/system/bitcoin-rpc-connection-details`
    );

    if (rpcInfo) {
      commit("setRpcInfo", rpcInfo);
    }
  },

  async getSync({ commit }) {
    const sync = await API.get(
      `${process.env.VUE_APP_API_BASE_URL}/v1/bitcoind/info/sync`
    );

    if (sync) {
      commit("syncStatus", sync);
    }
  },

  async getBlocks({ commit, state, dispatch }) {
    await dispatch("getSync");

    // Cache block height array of latest 3 blocks for loading view
    const currentBlock = state.currentBlock;

    // Don't fetch blocks if no new block has been found
    if (state.blocks.length && currentBlock === state.blocks[0]["height"]) {
      return;
    }

    // Don't fetch blocks if < 3 blocks primarily because we don't have a UI
    // ready for a blockchain with < 3 blocks
    if (currentBlock < 3) {
      return;
    }

    //TODO: Fetch only new blocks
    const latestFiveBlocks = await API.get(
      `${process.env.VUE_APP_API_BASE_URL}/v1/bitcoind/info/blocks?from=${currentBlock - 4}&to=${currentBlock}`
    );

    if (!latestFiveBlocks.blocks) {
      return;
    }

    // Update blocks
    commit("setBlocks", latestFiveBlocks.blocks);
  },

  async getBlockRangeTransactionChunks({ commit }) {
    const blockRangeTransactionChunks = await API.get(
      `${process.env.VUE_APP_API_BASE_URL}/v1/bitcoind/info/charts`
    );

    // Update chunks
    commit("setBlockRangeTransactionChunks", blockRangeTransactionChunks);
  },

  async getVersion({ commit }) {
    const version = await API.get(
      `${process.env.VUE_APP_API_BASE_URL}/v1/bitcoind/info/version`
    );

    if (version) {
      commit("setVersion", version);
    }
  },

  async getPeers({ commit }) {
    const peers = await API.get(
      `${process.env.VUE_APP_API_BASE_URL}/v1/bitcoind/info/connections`
    );

    if (peers) {
      commit("peers", peers);
    }
  },

  async getStats({ commit }) {
    const stats = await API.get(
      `${process.env.VUE_APP_API_BASE_URL}/v1/bitcoind/info/stats`
    );

    if (stats) {
      const peers = stats.connections;
      const mempool = stats.mempool;
      const hashrate = stats.networkhashps;
      const blockchainSize = stats.size;

      commit("setStats", {
        peers,
        mempool,
        hashrate,
        blockchainSize
      });
    }
  }
};

const getters = {
  status(state) {
    const data = {
      class: "loading",
      text: "Loading..."
    };

    if (state.operational) {
      data.class = "active";
      data.text = "Operational";
    }

    return data;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
