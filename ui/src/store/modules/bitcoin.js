import API from '@/helpers/api';
import { toPrecision } from '@/helpers/units';

// Initial state
const state = () => ({
  operational: false,
  calibrating: false,
  version: '',
  rpc: {
    apiKey: '',
    port: '',
    localAddress: '',
    localConnectionString: ''
  },
  currentBlock: 0,
  chain: '',
  blockHeight: 0,
  blocks: [],
  percent: -1, //for loading state
  depositAddress: '',
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
  },
  chartData: []
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

    if (sync.status === 'calibrating') {
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

  setRpcInfo(state, rpcInfo) {
    state.rpc.apiKey = rpcInfo.apiKey;
    state.rpc.port = rpcInfo.port;
    state.rpc.localAddress = rpcInfo.localAddress;
    state.rpc.localConnectionString = rpcInfo.localConnectionString;
  },

  peers(state, peers) {
    state.peers.total = peers.total || 0;
    state.peers.inbound = peers.inbound || 0;
    state.peers.outbound = peers.outbound || 0;
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
      commit('isOperational', status.operational);

      // if (status.operational) {
      //   dispatch("getSync");
      // }
    }
  },

  async getRpcInfo({ commit }) {
    const rpcInfo = await API.get(
      `${process.env.VUE_APP_API_BASE_URL}/v1/bitcoind/system/rpc-connection-details`
    );

    if (rpcInfo) {
      commit('setRpcInfo', rpcInfo);
    }
  },

  async getSync({ commit }) {
    const sync = await API.get(
      `${process.env.VUE_APP_API_BASE_URL}/v1/bitcoind/info/sync`
    );

    if (sync) {
      commit('syncStatus', sync);
    }
  },

  async getBlocks({ commit, state, dispatch }) {
    await dispatch('getSync');

    // Cache block height array of latest 3 blocks for loading view
    const currentBlock = state.currentBlock;

    // Don't fetch blocks if no new block has been found
    if (state.blocks.length && currentBlock === state.blocks[0]['height']) {
      return;
    }

    // Don't fetch blocks if < 3 blocks primarily because we don't have a UI
    // ready for a blockchain with < 3 blocks
    if (currentBlock < 3) {
      return;
    }

    //TODO: Fetch only new blocks
    const latestFiveBlocks = await API.get(
      `${
        process.env.VUE_APP_API_BASE_URL
      }/v1/bitcoind/info/blocks?from=${currentBlock - 3}&to=${currentBlock}`
    );

    if (!latestFiveBlocks.blocks) {
      return;
    }

    // Update blocks
    commit('setBlocks', latestFiveBlocks.blocks);
  },

  async getChartData({ dispatch, state, commit }) {
    // get the latest block height
    await dispatch('getSync');

    const currentBlock = state.currentBlock;

    // check if atleast 144 blocks exist
    if (!currentBlock || currentBlock < 144) {
      return;
    }

    // get last 144 blocks (~24 hours)
    const lastDaysBlocks = await API.get(
      `${
        process.env.VUE_APP_API_BASE_URL
      }/v1/bitcoind/info/blocks?from=${currentBlock - 143}&to=${currentBlock}`
    );

    // exit if we don't get the blocks for some reason
    if (
      !lastDaysBlocks ||
      !lastDaysBlocks.blocks ||
      !lastDaysBlocks.blocks.length
    ) {
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

    commit('setChartData', chartData);
  },

  async getVersion({ commit }) {
    const version = await API.get(
      `${process.env.VUE_APP_API_BASE_URL}/v1/bitcoind/info/version`
    );

    if (version) {
      commit('setVersion', version);
    }
  },

  async getPeers({ commit }) {
    const peers = await API.get(
      `${process.env.VUE_APP_API_BASE_URL}/v1/bitcoind/info/connections`
    );

    if (peers) {
      commit('peers', peers);
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

      commit('setStats', {
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
      class: 'loading',
      text: 'Loading...'
    };

    if (state.operational) {
      data.class = 'active';
      data.text = 'Operational';
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
