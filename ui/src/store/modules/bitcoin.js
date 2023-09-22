import API from "@/helpers/api";

const BYTES_PER_GB = 1000000000;

// Initial state
const state = () => ({
  operational: false,
  calibrating: false,
  version: "",
  p2p: {
    port: "",
    localAddress: "",
    localConnectionString: "",
    torAddress: "",
    torConnectionString: "",
  },
  rpc: {
    rpcuser: "",
    rpcpassword: "",
    port: "",
    localAddress: "",
    localConnectionString: "",
    torAddress: "",
    torConnectionString: "",
  },
  currentBlock: 0,
  chain: "",
  pruned: false,
  pruneTargetSizeGB: 0,
  blockHeight: 0,
  blocks: [],
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
    outbound: 0,
    clearnet: 0,
    tor: 0,
    i2p: 0
  },
  chartData: []
});

// Functions to update the state directly
const mutations = {
  isOperational(state, operational) {
    state.operational = operational;
  },

  syncStatus(state, sync) {
    // sync.percent is `verificationprogress` from the getblockchaininfo RPC, which can't reach 1 when the most recent block is in the past.
    // To ensure accurate percentage display during sync:
    //  - When no headers have been downloaded, we set the progress to 0% (this is because sync.percent = 1 when no headers have been downloaded).
    //  - When current block matches header count (indicating sync completion), we set the progress to 100%.
    //  - For other cases, we use the value of `verificationprogress` with 2 decimal places and floor it such that the value is in the range 0% to 99.99%.
    // This allows us to show accurate percentage during initial sync by using the `verificationprogress` value, while also
    // not relying on prematurely rounding to 100% before the sync is actually complete
    state.percent = Math.floor(sync.percent * 10000) / 100;
    // If we're synced to the tip, always show 100
    if (sync.currentBlock === sync.headerCount) state.percent = 100;
    // If no headers have been downloaded, show 0. sync.percent = 1 when no headers have been downloaded.
    if (sync.headerCount === 0) state.percent = 0;
    state.currentBlock = sync.currentBlock;
    state.blockHeight = sync.headerCount;
    state.chain = sync.chain;
    state.pruned = sync.pruned;
    state.pruneTargetSizeGB = Math.round(sync.pruneTargetSize / BYTES_PER_GB);

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
    state.p2p.port = p2pInfo.port;
    state.p2p.localAddress = p2pInfo.localAddress;
    state.p2p.localConnectionString = p2pInfo.localConnectionString;
    state.p2p.torAddress = p2pInfo.torAddress;
    state.p2p.torConnectionString = p2pInfo.torConnectionString;
  },

  setRpcInfo(state, rpcInfo) {
    state.rpc.rpcuser = rpcInfo.rpcuser;
    state.rpc.rpcpassword = rpcInfo.rpcpassword;
    state.rpc.port = rpcInfo.port;
    state.rpc.localAddress = rpcInfo.localAddress;
    state.rpc.localConnectionString = rpcInfo.localConnectionString;
    state.rpc.torAddress = rpcInfo.torAddress;
    state.rpc.torConnectionString = rpcInfo.torConnectionString;
  },

  peers(state, peers) {
    state.peers.total = peers.total || 0;
    state.peers.inbound = peers.inbound || 0;
    state.peers.outbound = peers.outbound || 0;
    state.peers.clearnet = peers.clearnet || 0;
    state.peers.tor = peers.tor || 0;
    state.peers.i2p = peers.i2p || 0;
  },

  setChartData(state, chartData) {
    state.chartData = chartData;
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
      `${process.env.VUE_APP_API_BASE_URL}/v1/bitcoind/info/blocks?from=${currentBlock - 3}&to=${currentBlock}`
    );

    if (!latestFiveBlocks.blocks) {
      return;
    }

    // Update blocks
    commit("setBlocks", latestFiveBlocks.blocks);
  },

  async getChartData({dispatch, state, commit}) {

    // get the latest block height
    await dispatch("getSync");

    const currentBlock = state.currentBlock;

    // check if atleast 144 blocks exist
    if (!currentBlock || currentBlock < 144) {
      return;
    }
    
    // get last 144 blocks (~24 hours)
    const lastDaysBlocks = await API.get(
      `${process.env.VUE_APP_API_BASE_URL}/v1/bitcoind/info/blocks?from=${currentBlock - 143}&to=${currentBlock}`
    );
    
    // exit if we don't get the blocks for some reason
    if (!lastDaysBlocks || !lastDaysBlocks.blocks || !lastDaysBlocks.blocks.length) {
      return;
    }

    // add up transactions in 6 blocks and use last block's timestamp
    // to create an array like this
    // [[timestamp, transactions], ...]

    const chartData = [];

    const CHUNK_SIZE = 12;
    let transactionsInCurrentChunk = 0;
    let currentChunkSize = 0;

    for (let block of lastDaysBlocks.blocks) {
      transactionsInCurrentChunk += Number(block.numTransactions);
      currentChunkSize++;
      if (currentChunkSize === CHUNK_SIZE) {
        chartData.push([Number(block.time), transactionsInCurrentChunk]);
        currentChunkSize = 0;
        transactionsInCurrentChunk = 0;
      }
    }
    
    // sort by ascending timestamps and update state
    chartData.sort((a, b) => a[0] - b[0]);

    commit("setChartData", chartData);
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
