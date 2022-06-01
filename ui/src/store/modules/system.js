import API from "@/helpers/api";

// Initial state
const state = () => ({
  version: "",
  api: {
    operational: false,
    version: ""
  }
});

// Functions to update the state directly
const mutations = {
  setVersion(state, version) {
    state.version = version;
  },
  setApi(state, api) {
    state.api = api;
  }
};

// Functions to get data from the API
const actions = {
  async getApi({ commit }) {
    console.log(`${process.env.VUE_APP_API_BASE_URL}`);
    const api = await API.get(`${process.env.VUE_APP_API_BASE_URL}/ping`);
    commit("setApi", {
      operational: !!(api && api.version),
      version: api && api.version ? api.version : ""
    });
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
