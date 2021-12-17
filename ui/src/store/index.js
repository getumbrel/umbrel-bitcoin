import Vue from "vue";
import Vuex from "vuex";

//Modules
import system from "./modules/system";
import bitcoin from "./modules/bitcoin";

Vue.use(Vuex);

// Initial State
const state = {
  isMobileMenuOpen: true
};

// Getters
const getters = {
  isMobileMenuOpen(state) {
    return state.isMobileMenuOpen;
  }
};

// Mutations
const mutations = {
  toggleMobileMenu(state) {
    //disable body's scrolling on menu open
    if (!state.isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
      state.isMobileMenuOpen = true;
    } else {
      document.body.style.overflow = "auto";
      state.isMobileMenuOpen = false;
    }
  }
};

// Actions
const actions = {
  toggleMobileMenu(context) {
    context.commit("toggleMobileMenu");
  }
};

export default new Vuex.Store({
  state,
  mutations,
  actions,
  getters,
  modules: {
    system,
    bitcoin
  }
});
