<template>
  <div class="pb-4">
    <div
      class="px-3 px-lg-4 pb-4 d-flex flex-wrap w-100 justify-content-between align-items-center"
    >
      <h6 class="mb-0 font-weight-normal text-muted">
        Number of transactions
      </h6>
      <div>
        <button
          v-for="filter in filters"
          :key="filter"
          class="tx-chart-filter-button text-muted"
          :class="{ shadow: selectedFilter === filter }"
          @click="selectedFilter = filter"
        >
          {{ filter }}
        </button>
      </div>
    </div>
    <chart
      :chartData="blockAggregates"
      v-bind:selectedFilter="selectedFilter"
    ></chart>
  </div>
</template>

<script>
// import Vue from "vue";
import { mapState } from "vuex";

import Chart from "@/components/Chart";

export default {
  data() {
    return {
      selectedFilter: "1hr",
      filters: ["1hr", "6hr", "12hr", "1d", "3d", "7d"]
    };
  },
  computed: {
    ...mapState({
      blockAggregates(state) {
        return state.bitcoin.blockRangeTransactionChunks[
          this.selectedFilter
        ].map(item => [item.time * 1000, item.numTransactions]);
      }
    })
  },
  methods: {},
  components: {
    Chart
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
