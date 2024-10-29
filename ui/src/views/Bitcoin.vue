<template>
  <div class="pt-2 pt-md-4 pb-4 px-2">
    <div class="my-3 pb-2">
      <div class="d-flex flex-wrap justify-content-between align-items-center mb-2">
        <div class="d-flex flex-grow-1 justify-content-start align-items-start mb-3">
          <img
            class="app-icon mr-2 mr-sm-3"
            src="@/assets/icon.svg"
          />
          <div>
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="4" cy="4" r="4" :fill="`${isBitcoinCoreOperational ? '#00CD98' : '#F6B900'}`" />
            </svg>
            <small v-if="isBitcoinCoreOperational" class="ml-1 text-success">Running</small>
            <small v-else class="ml-1 text-warning">Starting</small>
            <h3 class="d-block font-weight-bold mb-1">Bitcoin Node</h3>
            <span class="d-block text-muted">{{
              version ? `Bitcoin Core ${version}` : "..."
            }}</span>
          </div>
        </div>
        <div class="d-flex col-12 col-md-auto justify-content-start align-items-center p-0">
          <!-- TODO - work on responsiveness of connect + settings button -->
          <b-button
            type="button"
            variant="primary"
            class="btn btn-primary capitalize py-1 pl-2 pr-3 w-100"
            v-b-modal.connect-modal
          >
            <b-icon icon="plus" aria-hidden="true"></b-icon>
            Connect
          </b-button>
 
          <b-dropdown
            class="ml-3"
            variant="link"
            toggle-class="text-decoration-none p-0"
            no-caret
            right
          >
            <template v-slot:button-content>
              <svg
                width="18"
                height="4"
                viewBox="0 0 18 4"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M2 4C3.10457 4 4 3.10457 4 2C4 0.89543 3.10457 0 2 0C0.89543 0 0 0.89543 0 2C0 3.10457 0.89543 4 2 4Z"
                  fill="#6c757d"
                />
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M9 4C10.1046 4 11 3.10457 11 2C11 0.89543 10.1046 0 9 0C7.89543 0 7 0.89543 7 2C7 3.10457 7.89543 4 9 4Z"
                  fill="#6c757d"
                />
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M16 4C17.1046 4 18 3.10457 18 2C18 0.89543 17.1046 0 16 0C14.8954 0 14 0.89543 14 2C14 3.10457 14.8954 4 16 4Z"
                  fill="#6c757d"
                />
              </svg>
            </template>
            <b-dropdown-item href="#" v-b-modal.advanced-settings-modal>Advanced Settings</b-dropdown-item>
          </b-dropdown>
        </div>
      </div>
      <b-alert :show="showReindexCompleteAlert" variant="warning">Reindexing is now complete. Turn off "Reindex blockchain" in <span class="open-settings" @click="() => $bvModal.show('advanced-settings-modal')">advanced settings</span> to prevent reindexing every time Bitcoin Node restarts.</b-alert>

    <b-alert :show="showReindexInProgressAlert" variant="info">Reindexing in progress...</b-alert>

    <b-alert :show="showRestartError" variant="danger" dismissible @dismissed="showRestartError=false">
      Something went wrong while attempting to change the configuration of Bitcoin Node.
    </b-alert>
    </div>

    <b-row class="row-eq-height">
      <b-col col cols="12" lg="4">
        <card-widget
          header="Blockchain"
          :loading="syncPercent !== 100 || blocks.length === 0"
        >
          <!-- <template v-slot:menu>
            <b-dropdown-item variant="danger" href="#" disabled>Resync Blockchain</b-dropdown-item>
          </template>-->
          <div class>
            <div class="px-3 px-lg-4 mb-5">
              <div class="w-100 d-flex justify-content-between mb-2">
                <span class="align-self-end">Synchronized</span>
                <h3 class="font-weight-normal mb-0">
                  <span v-if="syncPercent !== -1">
                    {{ syncPercent }}
                    <small class>%</small>
                  </span>

                  <span
                    class="loading-placeholder loading-placeholder-lg d-block"
                    style="width: 6rem;"
                    v-else
                  ></span>
                </h3>
              </div>
              <b-progress
                :value="Math.round(syncPercent)"
                class="mb-1"
                variant="success"
                :style="{ height: '4px' }"
              ></b-progress>
              <small
                class="text-muted d-block text-right"
                v-if="currentBlock < blockHeight - 1"
              >
                {{ currentBlock.toLocaleString() }} of
                {{ blockHeight.toLocaleString() }} blocks
              </small>
            </div>
            <p class="px-3 px-lg-4 mb-3 text-muted">Latest Blocks</p>
            <blockchain :numBlocks="5"></blockchain>
          </div>
        </card-widget>
      </b-col>
      <b-col col cols="12" lg="8">
        <card-widget class="overflow-x" :header="networkWidgetHeader">
          <div class>
            <div class="px-3 px-lg-4">
              <b-row>
                <b-col col cols="6" md="3">
                  <stat
                    title="Connections"
                    :value="stats.peers"
                    :suffix="`${stats.peers === 1 ? 'Peer' : 'Peers'}`"
                    showPercentChange
                    :showPopover="true"
                    popoverId="connections-popover"
                    :popoverContent="[`Clearnet${torProxy ? ' (over Tor)': ''}: ${peers.clearnet}`, `Tor: ${peers.tor}`, `I2P: ${peers.i2p}`]"
                  ></stat>
                </b-col>
                <b-col col cols="6" md="3">
                  <stat
                    title="Mempool"
                    :value="abbreviateSize(stats.mempool)[0]"
                    :suffix="abbreviateSize(stats.mempool)[1]"
                    showPercentChange
                  ></stat>
                </b-col>
                <b-col col cols="6" md="3">
                  <stat
                    title="Hashrate"
                    :value="abbreviateHashRate(stats.hashrate)[0]"
                    :suffix="abbreviateHashRate(stats.hashrate)[1]"
                    showPercentChange
                  ></stat>
                </b-col>
                <b-col col cols="6" md="3">
                  <stat
                    title="Blockchain Size"
                    :value="abbreviateSize(stats.blockchainSize)[0]"
                    :suffix="abbreviateSize(stats.blockchainSize)[1]"
                    showPercentChange
                    :showPopover="pruned"
                    popoverId="blockchain-size-popover"
                    :popoverContent='[`Your "Prune Old Blocks" setting has set the max blockchain size to ${pruneTargetSizeGB}GB.`]'
                  ></stat>
                </b-col>
              </b-row>
            </div>
            <chart-wrapper></chart-wrapper>
          </div>
        </card-widget>
      </b-col>
    </b-row>

    <b-modal id="connect-modal" size="lg" centered hide-footer>
      <connection-modal></connection-modal>
    </b-modal>
    
    <b-modal id="advanced-settings-modal" size="lg" centered hide-footer scrollable>
      <advanced-settings-modal :isSettingsDisabled="isRestartPending" :validationErrors="validationErrors" @submit="saveSettingsAndRestartBitcoin" @clickRestoreDefaults="restoreDefaultSettingsAndRestartBitcoin" @clearErrors="validationErrors = []"></advanced-settings-modal>
    </b-modal>
  </div>
</template>

<script>
// import Vue from "vue";
import { mapState } from "vuex";

import API from "@/helpers/api";
import delay from "@/helpers/delay";

import CardWidget from "@/components/CardWidget";
import Blockchain from "@/components/Blockchain";
import Stat from "@/components/Utility/Stat";
import ConnectionModal from "@/components/ConnectionModal";
import AdvancedSettingsModal from "@/components/AdvancedSettingsModal";
import ChartWrapper from "@/components/ChartWrapper.vue";

export default {
  data() {
    return {
      isRestartPending: false,
      showRestartError: false,
      validationErrors: []
    };
  },
  computed: {
    ...mapState({
      isBitcoinCoreOperational: state => state.bitcoin.operational,
      syncPercent: state => state.bitcoin.percent,
      blocks: state => state.bitcoin.blocks,
      version: state => state.bitcoin.version,
      currentBlock: state => state.bitcoin.currentBlock,
      blockHeight: state => state.bitcoin.blockHeight,
      stats: state => state.bitcoin.stats,
      peers: state => state.bitcoin.peers,
      rpc: state => state.bitcoin.rpc,
      p2p: state => state.bitcoin.p2p,
      reindex: state => state.user.bitcoinConfig.reindex,
      network: state => state.user.bitcoinConfig.network,
      pruned: state => state.bitcoin.pruned,
      pruneTargetSizeGB: state => state.bitcoin.pruneTargetSizeGB,
      torProxy: state => state.user.bitcoinConfig.torProxyForClearnet
    }),
    showReindexInProgressAlert() {
      return this.reindex && this.syncPercent !== 100 && !this.isRestartPending;
    },
    showReindexCompleteAlert() {
      return this.reindex && this.syncPercent === 100 && !this.isRestartPending;
    },
    networkWidgetHeader() {
      if (!this.network || this.network === "main") return "Network";
      if (this.network === "test") return "Network (testnet3)";
      return `Network (${this.network})`;
    }
  },
  methods: {
    random(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    abbreviateHashRate(n) {
      if (n < 1e3) return [Number(n.toFixed(1)), "H/s"];
      if (n >= 1e3 && n < 1e6) return [Number((n / 1e3).toFixed(1)), "kH/s"];
      if (n >= 1e6 && n < 1e9) return [Number((n / 1e6).toFixed(1)), "MH/s"];
      if (n >= 1e9 && n < 1e12) return [Number((n / 1e9).toFixed(1)), "GH/s"];
      if (n >= 1e12 && n < 1e15) return [Number((n / 1e12).toFixed(1)), "TH/s"];
      if (n >= 1e15 && n < 1e18) return [Number((n / 1e15).toFixed(1)), "PH/s"];
      if (n >= 1e18 && n < 1e21) return [Number((n / 1e18).toFixed(1)), "EH/s"];
      if (n >= 1e21) return [Number(+(n / 1e21).toFixed(1)), "ZH/s"];
    },
    abbreviateSize(n) {
      if (n < 1e3) return [Number(n.toFixed(1)), "Bytes"];
      if (n >= 1e3 && n < 1e6) return [Number((n / 1e3).toFixed(1)), "KB"];
      if (n >= 1e6 && n < 1e9) return [Number((n / 1e6).toFixed(1)), "MB"];
      if (n >= 1e9 && n < 1e12) return [Number((n / 1e9).toFixed(1)), "GB"];
      if (n >= 1e12 && n < 1e15) return [Number((n / 1e12).toFixed(1)), "TB"];
      if (n >= 1e15) return [Number(+(n / 1e15).toFixed(1)), "PB"];
    },
    fetchStats() {
      this.$store.dispatch("bitcoin/getStats");
    },
    fetchPeers() {
      this.$store.dispatch("bitcoin/getPeers");
    },
    fetchConnectionDetails() {
      return Promise.all([
        this.$store.dispatch("bitcoin/getP2PInfo"),
        this.$store.dispatch("bitcoin/getRpcInfo")
      ]);
    },
    fetchBitcoinConfigSettings() {
      this.$store.dispatch("user/getBitcoinConfig");
    },
    async saveSettingsAndRestartBitcoin(bitcoinConfig) {
      try {
        this.validationErrors = [];
        this.isRestartPending = true;
        this.$store.dispatch("user/updateBitcoinConfig", bitcoinConfig);
  
        const response = await API.post(
          `${process.env.VUE_APP_API_BASE_URL}/v1/bitcoind/system/update-bitcoin-config`,
          { bitcoinConfig }
        );

        if (response.data.success) {
          // reload the page to reset all state and show loading view while bitcoin core restarts.
          this.$router.push({ query: { restart: "1" } });
          window.location.reload();
        } else {
          this.fetchBitcoinConfigSettings();
          this.showRestartError = true;
          this.$bvModal.hide("advanced-settings-modal");
          this.isRestartPending = false;
        }
      } catch (error) {
        this.fetchBitcoinConfigSettings();
        this.isRestartPending = false;

        if (error.response.status === 400) {
          console.log("validation error woop woop!")
          this.validationErrors = error.response.data.validationErrors;
          return;
        }

        this.showRestartError = true;
        this.$bvModal.hide("advanced-settings-modal");
      }
    },
    async restoreDefaultSettingsAndRestartBitcoin() {
      try {
        this.validationErrors = [];
        this.isRestartPending = true;
        
        const response = await API.post(
          `${process.env.VUE_APP_API_BASE_URL}/v1/bitcoind/system/restore-default-bitcoin-config`
          );
        
        // dispatch getBitcoinConfig after post request to avoid referencing default values in the store.
        this.$store.dispatch("user/getBitcoinConfig");
  
        if (response.data.success) {
          // reload the page to reset all state and show loading view while bitcoin core restarts.
          this.$router.push({ query: { restart: "1" } });
          window.location.reload();
        } else {
          this.fetchBitcoinConfigSettings();
          this.showRestartError = true;
          this.$bvModal.hide("advanced-settings-modal");
          this.isRestartPending = false;
        }  
      } catch (error) {
        console.error(error);
        this.fetchBitcoinConfigSettings();
        this.showRestartError = true;
        this.$bvModal.hide("advanced-settings-modal");
        this.isRestartPending = false;
      }
    }
  },
  async created() {
    // fetch settings first because bitcoin core
    // is not operational if pruning is in progress
    this.fetchBitcoinConfigSettings();

    // wait until bitcoin core is operational
    while (true) { /* eslint-disable-line */
      await this.$store.dispatch("bitcoin/getStatus");
      if (this.isBitcoinCoreOperational) {
        break;
      }
      await delay(1000);
    }
    this.$store.dispatch("bitcoin/getVersion");
    this.fetchStats();
    this.fetchPeers();
    this.fetchConnectionDetails();
    this.interval = window.setInterval(() => {
      this.fetchStats();
      this.fetchPeers();
    }, 5000);
  },
  beforeDestroy() {
    if (this.interval) {
      window.clearInterval(this.interval);
    }
  },
  components: {
    CardWidget,
    Blockchain,
    Stat,
    ConnectionModal,
    AdvancedSettingsModal,
    ChartWrapper
  }
};
</script>

<style lang="scss">
.app-icon {
  height: 120px;
  width: 120px;
  border-radius: 22%;
}
.overflow-x {
  overflow-x: visible;
}

.dropdown-menu {
  margin-top: 0.5rem;
  padding: 4px 0;
  border-radius: 4px;
}

.dropdown-item {
  padding-top: 8px;
  padding-bottom: 8px;
}

.open-settings {
  text-decoration: underline;
}

.open-settings:hover {
  cursor: pointer;
}
</style>
