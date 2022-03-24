<template lang="pug">
#Chart-container.absolute.w100(v-show="showing")
  p hello
  #chart
</template>

<script>
// import Chart from 'chartjs';
// import * as Plot from '@observablehq/plot';
import { EventBus } from '@/EventBus';
export default {
    name: 'Chart',
    data: () => ({
        xAxis: 'byWeek',
        showing: false,
    }),
    async created() {
        window.Chart = this;
        EventBus.$on('map-loaded', (map) =>
            map.on('moveend', () => this.update(map))
        );
        EventBus.$on('chart-options-change', async (options) => {
            this.showing = options.showChart;
            if (!this.loaded) {
                await this.$nextTick();
                this.initChart();
                this.loaded = true;
            }
        });
    },
    mounted() {},

    methods: {
        initChart() {
            // document.getElementById('chart').appendChild
            // (
            0 &&
                Plot.plot({
                    target: '#chart',
                });
            // this.ctx = document.getElementById('chart').getContext('2d');
            // this.chart = new Chart(this.ctx, {
            //     type: 'line',
            //     data: {
            //         labels: [],
            //         datasets: [
            //             {
            //                 label: 'Expeditions',
            //                 data: [],
            //                 backgroundColor: 'rgba(255, 99, 132, 0.2)',
            //                 borderColor: 'rgba(255, 99, 132, 1)',
            //                 borderWidth: 1,
            //             },
            //         ],
            //     },
            //     options: {
            //         scales: {
            //             yAxes: [
            //                 {
            //                     ticks: {
            //                         beginAtZero: true,
            //                     },
            //                 },
            //             ],
            //         },
            //     },
            // });
        },
        update(map) {
            this.expeditions = map.queryRenderedFeatures({
                layers: ['expeditions-circles'],
            });
        },
    },
};
</script>

<style scoped>
#Chart-container {
    background: #333;
    height: 5em;
    width: 100%;
    bottom: 0;
}
</style>
