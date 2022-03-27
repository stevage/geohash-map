<template lang="pug">
#Chart-container.absolute.w100(v-show="showing")
  #chart-legend
  #chart
</template>

<script>
// import Chart from 'chartjs';
import * as Plot from '@observablehq/plot';
import { EventBus } from '@/EventBus';
import * as d3 from 'd3';
export default {
    name: 'Chart',
    data: () => ({
        xAxis: 'byWeek',
        showing: !!window.location.host.match(/localhost/),
    }),
    async created() {
        window.Chart = this;
        EventBus.$on('map-loaded', (map) =>
            map.on('moveend', () => this.update(map))
        );
        EventBus.$on('chart-options-change', async (options) => {
            this.showing = options.showChart;
            this.update(window.map);
        });
    },
    mounted() {},

    methods: {
        initChart(expeditions) {
            const colorBy = window.ChartControls.options.colorBy;
            const scheme =
                {
                    participantsCount: 'turbo',
                    graticuleLatitude: 'rdylbu',
                    graticuleLongitude: 'rdylbu',
                }[colorBy] || 'turbo';
            const plotEl = Plot.plot({
                color:
                    colorBy === 'participantsCount'
                        ? {
                              type: 'threshold',
                              domain: d3.range(0, 10),
                              scheme,
                          }
                        : colorBy === 'graticuleLatitude'
                        ? {
                              //   type: 'diverging',
                              //   domain: d3.range(-70, 70),
                              scheme,
                          }
                        : colorBy === 'graticuleLongitude'
                        ? {
                              //   type: 'diverging',
                              //   domain: d3.range(-70, 70),
                              //   scheme: 'turbo',
                              scheme,
                          }
                        : undefined,
                marks: [
                    Plot.rectY(
                        expeditions,
                        Plot.binX(
                            { y: 'count' },
                            {
                                x: {
                                    value: 'date',
                                    interval: d3.utcMonth,
                                },
                                fill:
                                    {
                                        weekDay: 'weekDayName',
                                        participantsCount: 'participantsCount',
                                        participants: 'participantsOrMultiple',
                                    }[window.ChartControls.options.colorBy] ||
                                    window.ChartControls.options.colorBy,
                            }
                        )
                    ),
                ],
                background: '#222',
                width: document.getElementById('chart').getClientRects()[0]
                    .width,
                style: {
                    background: 'transparent', // 'hsla(0,0%,0%,0.5)', //'#222',
                    color: 'white',
                },
            });
            let legendEl;
            if (colorBy === 'participantsCount') {
                legendEl = Plot.legend({
                    color: {
                        type: 'threshold',
                        domain: d3.range(0, 14),
                        scheme,
                    },
                    label: 'Particpants',
                    style: { color: 'white', background: 'transparent' },
                });
            } else {
                legendEl = plotEl.legend('color', {
                    style: { color: 'white', background: 'transparent' },
                    label: {
                        participantsCount: 'Participants',
                        success: 'Success',
                        weekDay: '',
                    }[colorBy],
                });
            }

            document.getElementById('chart').replaceChildren(plotEl);
            document.getElementById('chart-legend').replaceChildren(legendEl);
        },
        update(map) {
            if (!this.showing) return;
            this.expeditions = map
                .queryRenderedFeatures({
                    layers: ['expeditions-circles'],
                })
                .map((e) => ({
                    ...e.properties,
                    week: Math.round(e.properties.days / 7),
                    date: new Date(e.properties.id.slice(0, 10)),
                }));
            this.initChart(this.expeditions);
        },
    },
};
</script>

<style scoped>
#Chart-container {
    /* background: #222; */
    background: hsla(0, 0%, 0%, 0.5);
    height: 450px;
    width: 100%;
    bottom: 0;
}
</style>
