<template>
  <div class="pt-2 pt-md-4 pb-4 px-2">
    <div class="my-3 pb-2">
      <div
        class="d-flex flex-wrap justify-content-between align-items-center mb-2"
      >
        <div
          class="d-flex flex-grow-1 justify-content-start align-items-start mb-3"
        >
          <img class="app-icon mr-2 mr-sm-3" src="@/assets/icon.svg" />
          <div>
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="4" cy="4" r="4" fill="#00CD98" />
            </svg>
            <small class="ml-1 text-success">Running</small>
            <h3 class="d-block font-weight-bold mb-1">Handshake</h3>
            <span class="d-block text-muted">{{
              version ? `Handshake hsd ${version}` : '...'
            }}</span>
          </div>
        </div>
        <div
          class="d-flex col-12 col-md-auto justify-content-start align-items-center p-0"
        >
          <b-button
            type="button"
            variant="primary"
            class="btn btn-primary capitalize py-1 pl-2 pr-3 w-100"
            v-b-modal.connect-modal
          >
            <b-icon icon="plus" aria-hidden="true"></b-icon>
            Connect
          </b-button>
        </div>
      </div>
    </div>

    <b-row class="row-eq-height">
      <b-col col cols="12" md="5" lg="4">
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
                    {{ syncPercent >= 99.99 ? 100 : syncPercent }}
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
      <b-col col cols="12" md="7" lg="8">
        <card-widget class="overflow-x" header="Network">
          <div class>
            <div class="px-3 px-lg-4">
              <b-row>
                <b-col col cols="6" md="4">
                  <stat
                    title="Connections"
                    :value="stats.peers"
                    suffix="Peers"
                    showNumericChange
                  ></stat>
                </b-col>
                <b-col col cols="6" md="4">
                  <stat
                    title="Mempool"
                    :value="abbreviateSize(stats.mempool)[0]"
                    :suffix="abbreviateSize(stats.mempool)[1]"
                    showPercentChange
                  ></stat>
                </b-col>
                <b-col col cols="6" md="4">
                  <stat
                    title="Hashrate"
                    :value="abbreviateHashRate(stats.hashrate)[0]"
                    :suffix="abbreviateHashRate(stats.hashrate)[1]"
                    showPercentChange
                  ></stat>
                </b-col>
                <!-- <b-col col cols="6" md="3">
                  <stat
                    title="Blockchain Size"
                    :value="abbreviateSize(stats.blockchainSize)[0]"
                    :suffix="abbreviateSize(stats.blockchainSize)[1]"
                    showPercentChange
                  ></stat>
                </b-col> -->
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
  </div>
</template>

<script>
// import Vue from "vue";
import { mapState } from 'vuex';

import CardWidget from '@/components/CardWidget';
import Blockchain from '@/components/Blockchain';
import Stat from '@/components/Utility/Stat';
import ConnectionModal from '@/components/ConnectionModal';
import ChartWrapper from '@/components/ChartWrapper.vue';

export default {
  data() {
    return {};
  },
  computed: {
    ...mapState({
      syncPercent: state => state.bitcoin.percent,
      blocks: state => state.bitcoin.blocks,
      version: state => state.bitcoin.version,
      currentBlock: state => state.bitcoin.currentBlock,
      blockHeight: state => state.bitcoin.blockHeight,
      stats: state => state.bitcoin.stats,
      rpc: state => state.bitcoin.rpc,
      p2p: state => state.bitcoin.p2p
    })
  },
  methods: {
    random(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    abbreviateHashRate(n) {
      if (n < 1e3) return [Number(n.toFixed(1)), 'H/s'];
      if (n >= 1e3 && n < 1e6) return [Number((n / 1e3).toFixed(1)), 'kH/s'];
      if (n >= 1e6 && n < 1e9) return [Number((n / 1e6).toFixed(1)), 'MH/s'];
      if (n >= 1e9 && n < 1e12) return [Number((n / 1e9).toFixed(1)), 'GH/s'];
      if (n >= 1e12 && n < 1e15) return [Number((n / 1e12).toFixed(1)), 'TH/s'];
      if (n >= 1e15 && n < 1e18) return [Number((n / 1e15).toFixed(1)), 'PH/s'];
      if (n >= 1e18 && n < 1e21) return [Number((n / 1e18).toFixed(1)), 'EH/s'];
      if (n >= 1e21) return [Number(+(n / 1e21).toFixed(1)), 'ZH/s'];
    },
    abbreviateSize(n) {
      if (n < 1e3) return [Number(n.toFixed(1)), 'Bytes'];
      if (n >= 1e3 && n < 1e6) return [Number((n / 1e3).toFixed(1)), 'KB'];
      if (n >= 1e6 && n < 1e9) return [Number((n / 1e6).toFixed(1)), 'MB'];
      if (n >= 1e9 && n < 1e12) return [Number((n / 1e9).toFixed(1)), 'GB'];
      if (n >= 1e12 && n < 1e15) return [Number((n / 1e12).toFixed(1)), 'TB'];
      if (n >= 1e15) return [Number(+(n / 1e15).toFixed(1)), 'PB'];
    },
    fetchStats() {
      this.$store.dispatch('bitcoin/getStats');
    },
    fetchConnectionDetails() {
      return this.$store.dispatch('bitcoin/getRpcInfo');
    }
  },
  created() {
    this.$store.dispatch('bitcoin/getVersion');
    this.fetchStats();
    this.fetchConnectionDetails();
    this.interval = window.setInterval(this.fetchStats, 5000);
  },
  beforeDestroy() {
    window.clearInterval(this.interval);
  },
  components: {
    CardWidget,
    Blockchain,
    Stat,
    ConnectionModal,
    ChartWrapper
  }
};
</script>

<style lang="scss" scoped>
.app-icon {
  height: 120px;
  width: 120px;
  border-radius: 22%;
}
.overflow-x {
  overflow-x: visible;
}
</style>
