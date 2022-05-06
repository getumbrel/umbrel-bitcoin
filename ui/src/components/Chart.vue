<template>
  <highcharts
    class="hc"
    v-if="chartData.length"
    :options="computedChartOptions"
    ref="chart"
  ></highcharts>
  <chart-empty-state v-else />
</template>

<script>
import moment from "moment";
import ChartEmptyState from "@/components/ChartEmptyState";

export default {
  props: ["chartData", "selectedFilter"],
  data() {
    return {
      chartOptions: {
        chart: {
          type: "areaspline",
          marginLeft: 0,
          marginRight: 0,
          spacingLeft: 0,
          spacingRight: 0,
          plotLeft: true,
          plotTop: true,
          animation: {
            duration: 1000
          }
        },
        credits: {
          enabled: false
        },
        legend: {
          enabled: false
        },
        tooltip: {
          formatter: function() {
            return "" + this.y + "";
          },
          backgroundColor: null,
          borderWidth: 0,
          className: "shadow custom-tooltip",
          distance: 32,
          positioner: (labelWidth, labelHeight, point) => {
            return {
              x: point.plotX - labelWidth / 2,
              y: 0
            };
          },
          shadow: false,
          useHTML: true,
          style: {
            padding: 0,
            color: "#6060ee"
          }
        },
        yAxis: {
          // visible: false
          minorGridLineWidth: 1,
          gridLineColor: "#e2e8f0"
        },
        xAxis: {
          title: {
            text: undefined,
            reserveSpace: false
          },
          minPadding: 0,
          maxPadding: 0,
          type: "datetime",
          lineWidth: 0,
          minorGridLineWidth: 0,
          minorTickLength: 0,
          tickLength: 0,
          crosshair: true,
          labels: {}
        },
        title: null,
        plotOptions: {
          areaspline: {
            lineColor: "transparent",
            fillOpacity: 0.5,
            fillColor: {
              linearGradient: {
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 1
              },
              stops: [
                [0, "#6060EE"],
                [1, "rgba(255, 255, 255, 0.5)"]
              ]
            },
            states: {
              hover: {
                halo: null
              }
            },
            marker: {
              enabled: false,
              fillColor: "#6060EE",
              symbol: "circle",
              radius: 5,
              states: {
                hover: {
                  enabled: true
                }
              }
            }
          }
        },
        series: [
          {
            data: [],
            type: "areaspline",
            animation: false
          }
        ]
      }
    };
  },
  computed: {
    computedChartOptions() {
      const selectedFilter = this.selectedFilter;
      let localOptions = Object.assign({}, this.chartOptions);
      localOptions.series[0].data = this.chartData;
      localOptions.xAxis.labels = {
        formatter: function() {
          if (selectedFilter === "7d") {
            return moment(this.value).format("DD MMM");
          } else if (selectedFilter === "3d") {
            return moment(this.value).format("DD MMM, ha");
          } else {
            return moment(this.value).format("LT");
          }
        }
      };
      return localOptions;
    }
  },
  components: {
    ChartEmptyState
  }
};
</script>

<style lan ChartEmptyStateg="scss">
.highcharts-tooltip > span {
  border-radius: 0.5em;
  box-shadow: 0 0.5rem 1rem rgba(20, 24, 33, 0.15);
  padding: 0.5em 1.5em;
  background: white;
}
</style>
