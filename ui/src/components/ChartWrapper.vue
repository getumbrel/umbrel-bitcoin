<template>
  <div class="pb-2">
    <div
      class="px-3 px-lg-4 pb-2 d-flex flex-wrap w-100 justify-content-between align-items-center"
    >
      <h6 
        class="mb-0 font-weight-normal text-muted"
        :class="{invisible: !isSynced}"
      >
        Transactions on the network
      </h6>
    </div>
    <chart
      v-if="isSynced && chartData.length"
      :chartData="chartData"
    ></chart>
    <chart-empty-state v-else />
  </div>
</template>

<script>
import { mapState } from "vuex";

import Chart from "@/components/Chart";
import ChartEmptyState from "@/components/ChartEmptyState";

export default {
  data() {
    return {
      selectedFilter: "1hr",
    };
  },
  computed: {
    ...mapState({
      blocks: state => state.bitcoin.blocks,
      chartData: state => state.bitcoin.chartData,
      isSynced: state => state.bitcoin.percent >= 99.99,
    })
  },
  methods: {
    getChartData() {
      if (this.isSynced) {
        this.$store.dispatch("bitcoin/getChartData");
      }
    },
  },
  watch: {
    blocks: {
      handler() {
        this.getChartData();
      },
      immediate: true,
      deep: true
    },
    isSynced: {
      handler() {
        this.getChartData();
      },
    },
  },
  components: {
    Chart,
    ChartEmptyState,
  }
};
</script>

<style lang="scss" scoped>
.tx-chart-filter-button {
  text-transform: none;
  background: transparent;
  width: 3.5em;
  height: 3.5em;
  border-radius: 9999px;
  margin: 0 0.25em;
  white-space: nowrap;
  @media (max-width: 800px) {
    font-size: 12px;
    margin-top: 14px;
  }
}
</style>
