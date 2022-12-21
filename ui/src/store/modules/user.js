import API from "@/helpers/api";

// Initial state
const state = () => ({
  bitcoinConfig: {}
});

// Functions to update the state directly
const mutations = {
  setBitcoinConfig(state, bitcoinConfig) {
    state.bitcoinConfig = bitcoinConfig;
  }
};

const actions = {
  async getBitcoinConfig({ commit }) {
    const existingConfig = await API.get(
      `${process.env.VUE_APP_API_BASE_URL}/v1/bitcoind/system/bitcoin-config`
    );

    if (existingConfig) {
      commit("setBitcoinConfig", existingConfig);
    }
  },
  updateBitcoinConfig({ commit }, bitcoinConfig) {
    commit("setBitcoinConfig", bitcoinConfig);
  }
};

const getters = {};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
