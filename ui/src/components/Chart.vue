<template>
  <highcharts
    :options="chartOptions"
  ></highcharts>
</template>

<script>
import moment from "moment";

export default {
  props: {
    chartData: Array,
  },
  computed: {
    chartOptions() {
      return {
        chart: {
          type: "areaspline",
          marginLeft: 0,
          marginRight: 0,
          spacingLeft: 0,
          spacingRight: 0,
          plotLeft: true,
          plotTop: true,
          animation: false
        },
        credits: {
          enabled: false
        },
        legend: {
          enabled: false
        },
        tooltip: {
          formatter: function() {
            return `<span>${moment(this.x * 1000).format("MMM DD, h:mma")}<br/><br/>${this.y.toLocaleString()} transactions</span>`;
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
            color: "#1d1d1f"
          }
        },
        yAxis: {
          visible: false,
          minorGridLineWidth: 1,
          gridLineColor: "#e2e8f0"
        },
        xAxis: {
          title: {
            text: undefined,
            reserveSpace: false
          },
          visible: false,
          minPadding: 0,
          maxPadding: 0,
          type: "datetime",
          lineWidth: 0,
          minorGridLineWidth: 0,
          minorTickLength: 0,
          tickLength: 0,
          crosshair: true,
          labels: {},
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
              lineColor: "transparent",
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
            data: this.chartData,
            type: "areaspline",
            animation: true
          }
        ]
      };
    },
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
};
</script>

<style lan ChartEmptyStateg="scss">
.highcharts-tooltip > span {
  border-radius: 0.5em;
  box-shadow: 0 0.5rem 1rem rgba(20, 24, 33, 0.15);
  padding: 0.75em 1.5em;
  background: white;
  text-align: center;
}
.highcharts-container, .highcharts-root, div[data-highcharts-chart] { 
  overflow: visible !important; 
}
.highcharts-containe > svg {
  overflow: visible;
}
</style>
