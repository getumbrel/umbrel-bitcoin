import Vue from "vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import HighchartsVue from "highcharts-vue";

import App from "./App.vue";
import router from "./router";
import store from "./store";

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);
Vue.use(HighchartsVue);

//Localized number (comma, seperator, spaces, etc)
Vue.filter("localize", n =>
  Number(n).toLocaleString(undefined, { maximumFractionDigits: 8 })
);

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
